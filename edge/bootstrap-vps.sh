#!/usr/bin/env bash
# Préparation d'un VPS Ubuntu LTS neuf pour le Caddy de bordure et les sites.
# À lancer en root via sudo, depuis l'administrateur des images OVH (`ubuntu`),
# dans une session interactive qui survit au script :
#
#   scp edge/bootstrap-vps.sh ubuntu@<ip>:
#   ssh -t ubuntu@<ip>
#   tmux new -s bootstrap        # une coupure réseau ne tue pas apt-get upgrade
#   sudo bash bootstrap-vps.sh "<clé publique de déploiement GitHub>"
#
# Ne pas passer la commande en argument de ssh : la session se fermerait avec le
# script, sans terminal pour sudo, et il ne resterait plus de session ouverte
# pour corriger un durcissement SSH raté. Après une coupure : ssh, puis
# `tmux attach -t bootstrap`.
#
# Le script est rejouable. Il ne coupe root et les mots de passe que si `deploy`
# et un administrateur (membre de sudo ou utilisateur qui lance le script, à qui
# sudo donne toutes les commandes) ont chacun une clé. Garder la session ouverte
# et tester `ssh deploy@<ip>` et `ssh ubuntu@<ip>` depuis un second terminal
# avant de la fermer.
set -euo pipefail

DEPLOY_USER=deploy
DEPLOY_KEY="${1:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "À lancer en root (sudo)." >&2
  exit 1
fi

# Lit des lignes au format authorized_keys et n'en rend que `type base64
# [commentaire]`. Les options de ligne disparaissent : sur OVH, la clé de root
# porte `command="echo 'Please login as the user \"ubuntu\"…';exit 142"`, qui
# rendrait `deploy` inutilisable si elle était recopiée telle quelle.
filter_keys() {
  awk '
    /^[[:space:]]*(#|$)/ { next }
    {
      sub(/\r$/, "")
      for (i = 1; i < NF; i++) {
        if ($i ~ /^(ssh-ed25519|ssh-rsa|ecdsa-sha2-[a-z0-9]+|sk-[a-z0-9-]+@openssh\.com)$/ \
            && $(i + 1) ~ /^[A-Za-z0-9+\/]+=*$/) {
          line = $i " " $(i + 1)
          for (j = i + 2; j <= NF; j++) line = line " " $j
          print line
          next
        }
      }
    }
  '
}

deploy_key_line=""
if [ -n "$DEPLOY_KEY" ]; then
  deploy_key_line=$(printf '%s\n' "$DEPLOY_KEY" | filter_keys)
  if [ -z "$deploy_key_line" ]; then
    echo "Clé de déploiement illisible : attendu 'type base64 [commentaire]'." >&2
    exit 1
  fi
fi

# --- swap ---------------------------------------------------------------------
# 2 Go de RAM : MySQL et Nest d'app-shop s'ajouteront à Caddy. Le swap évite que
# l'OOM killer tue un conteneur lors d'un pic (apt, build, démarrage de MySQL).
if [ -z "$(swapon --show --noheadings)" ]; then
  # Aucun swap actif : un /swapfile présent est un reste d'exécution interrompue.
  rm -f /swapfile
  if ! fallocate -l 2G /swapfile; then
    rm -f /swapfile
    dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  fi
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
fi
# Seul un /swapfile actif entre dans fstab : un fichier quelconque à ce nom
# ferait échouer le montage au démarrage.
if swapon --show=NAME --noheadings | grep -qx /swapfile \
    && ! grep -qE '^/swapfile[[:space:]]' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swap.conf
sysctl -q -p /etc/sysctl.d/99-swap.conf

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl gnupg ufw fail2ban unattended-upgrades

# --- utilisateur de déploiement ---------------------------------------------
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
auth="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$auth"

# Les clés de l'administrateur qui lance le script donnent aussi accès à `deploy`.
admin_keys=/root/.ssh/authorized_keys
if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != root ]; then
  admin_keys="$(getent passwd "$SUDO_USER" | cut -d: -f6)/.ssh/authorized_keys"
fi
if [ ! -f "$admin_keys" ]; then
  echo "Aucune clé d'administrateur trouvée dans $admin_keys." >&2
  admin_keys=/dev/null
fi

# Le fichier entier est refiltré : une ligne à options laissée par une exécution
# antérieure disparaît aussi.
auth_tmp=$(mktemp)
trap 'rm -f "$auth_tmp"' EXIT
{
  cat "$auth" "$admin_keys"
  if [ -n "$deploy_key_line" ]; then
    printf '%s\n' "$deploy_key_line"
  fi
} | filter_keys | sort -u > "$auth_tmp"
install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$auth_tmp" "$auth"

# --- Docker Engine + Compose (dépôt officiel) --------------------------------
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck source=/dev/null
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
# Appartenir au groupe docker équivaut à être root : c'est le prix du déploiement
# par SSH sans sudo, et la raison pour laquelle la clé de `deploy` est dédiée.
usermod -aG docker "$DEPLOY_USER"

# Les journaux des conteneurs ne doivent pas remplir le disque.
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
systemctl restart docker

# --- dossiers des sites -------------------------------------------------------
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /srv/edge /srv/cv
# Caddy tourne en root mais sans CAP_DAC_OVERRIDE (cap_drop: ALL) : il ne lit
# que ce que les permissions ouvrent à tous. Le Caddyfile ne contient aucun
# secret ; le .env reste dans /srv/edge, fermé.
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /srv/edge/conf

# --- pare-feu -----------------------------------------------------------------
# Docker publie ses ports en contournant ufw (règles iptables propres) : seuls
# 80/443 sont publiés par les composes, rien d'autre ne doit l'être.
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# --- mises à jour de sécurité automatiques -----------------------------------
dpkg-reconfigure -f noninteractive unattended-upgrades

# --- SSH ----------------------------------------------------------------------
# `deploy` n'a pas sudo : couper root sans autre administrateur joignable par clé
# enfermerait dehors (seul le mode rescue OVH resterait). Les images Ubuntu OVH
# fournissent `ubuntu`, qui tient sudo de cloud-init.
# Seule compte une ligne qui commence par le type de clé : une ligne à options,
# comme le `command="…exit 142"` de root chez OVH, peut refuser toute session.
has_plain_key() {
  [ -f "$1" ] && grep -qE '^(ssh-ed25519|ssh-rsa|ecdsa-sha2-[a-z0-9]+|sk-[a-z0-9-]+@openssh\.com)[[:space:]]' "$1"
}

# Un administrateur compte s'il a une clé sans options et si la politique sudo
# lui donne toutes les commandes en tant que root : `sudo -l -U` l'interroge
# sans mot de passe. sudo écrit chaque règle sur une ligne indentée, par
# exemple `    (ALL : ALL) ALL` ou `    (ALL) NOPASSWD: ALL` ; une règle
# restreinte comme `(ALL) NOPASSWD: /usr/bin/systemctl restart x` ne suffit pas.
# Une règle sans NOPASSWD demande le mot de passe du compte : elle ne compte que
# si ce mot de passe existe (`passwd -S` rend `P`), sinon sudo serait inutilisable
# une fois l'accès SSH par mot de passe coupé.
is_admin_with_key() {
  local home rules
  home=$(getent passwd "$1" | cut -d: -f6) || return 1
  [ -n "$home" ] && has_plain_key "$home/.ssh/authorized_keys" || return 1
  rules=$(sudo -n -l -U "$1" 2>/dev/null \
    | grep -E '^[[:space:]]+\(ALL([[:space:]]*:[[:space:]]*ALL)?\)[[:space:]]+([A-Z_]+:[[:space:]]*)*ALL[[:space:]]*$') \
    || return 1
  grep -q 'NOPASSWD:' <<<"$rules" && return 0
  [ "$(passwd -S "$1" 2>/dev/null | awk '{print $2}')" = P ]
}

# Sur les images OVH, le groupe sudo est vide : `ubuntu` tient ses droits de
# /etc/sudoers.d/90-cloud-init-users. L'utilisateur qui lance le script est
# donc candidat au même titre que les membres du groupe.
admin_with_key=""
candidates=$(getent group sudo | cut -d: -f4 | tr ',' ' ') || candidates=""
if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != root ]; then
  candidates="$candidates $SUDO_USER"
fi
for user in $candidates; do
  if is_admin_with_key "$user"; then
    admin_with_key="$user"
  fi
done

if [ -s "$auth" ] && [ -n "$admin_with_key" ]; then
  # sshd retient la première valeur lue pour chaque mot-clé et inclut
  # sshd_config.d/*.conf dans l'ordre lexical : le préfixe 00 passe devant le
  # 50-cloud-init.conf des images cloud, qui peut rouvrir les mots de passe.
  hardening=/etc/ssh/sshd_config.d/00-hardening.conf
  rm -f /etc/ssh/sshd_config.d/90-hardening.conf
  cat > "$hardening" <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
SSHD
  # Une configuration invalide laissée en place empêcherait sshd de redémarrer
  # au prochain reboot.
  if ! sshd -t; then
    rm -f "$hardening"
    echo "Configuration SSH refusée par 'sshd -t' : durcissement retiré." >&2
    exit 1
  fi
  systemctl reload ssh
  # Sans -C, `sshd -T` ignore les blocs Match : il rend la configuration globale.
  effective=$(sshd -T 2>/dev/null | grep -Ei '^(permitrootlogin|passwordauthentication) ' || true)
  if printf '%s\n' "$effective" | grep -qix 'permitrootlogin no' \
      && printf '%s\n' "$effective" | grep -qix 'passwordauthentication no'; then
    echo "SSH durci : root et mots de passe refusés. Administrateur : $admin_with_key."
  else
    {
      echo "ATTENTION : SSH n'est PAS durci, la configuration effective reste :"
      printf '%s\n' "${effective:-(sshd -T illisible)}" | sed 's/^/  /'
      echo "Chercher le fichier qui l'impose : grep -riE 'PermitRootLogin|PasswordAuthentication' /etc/ssh/"
    } >&2
  fi
  echo "Tester 'ssh deploy@<ip>' et 'ssh $admin_with_key@<ip>' AVANT de fermer cette session."
else
  echo "SSH laissé tel quel : il faut une clé pour '$DEPLOY_USER' ET un administrateur sudo avec une clé (membre de sudo ou \$SUDO_USER)." >&2
fi

systemctl enable --now fail2ban

docker --version
docker compose version
cat <<'NEXT'
Prêt. Suite, en tant que deploy :
  1. /srv/edge : y copier edge/docker-compose.yml, edge/conf/Caddyfile (dans
     /srv/edge/conf/) et un .env tiré de edge/.env.example ; une fois le DNS
     pointé sur ce VPS : cd /srv/edge && docker compose up -d
  2. /srv/cv : y créer un .env tiré de .env.prod.example ; le déploiement y
     copie le compose.
NEXT
