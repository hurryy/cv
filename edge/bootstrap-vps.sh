#!/usr/bin/env bash
# Préparation d'un VPS Ubuntu LTS neuf pour le Caddy de bordure et les sites.
# À lancer en root, une fois, depuis une session SSH ouverte avec une clé :
#
#   scp edge/bootstrap-vps.sh root@<ip>:/root/
#   ssh root@<ip> 'bash /root/bootstrap-vps.sh "<clé publique de déploiement GitHub>"'
#
# Le script est rejouable. Il refuse de couper l'accès root par mot de passe tant
# que l'utilisateur `deploy` n'a pas de clé : garder la session root ouverte et
# tester `ssh deploy@<ip>` depuis un second terminal avant de la fermer.
set -euo pipefail

DEPLOY_USER=deploy
DEPLOY_KEY="${1:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "À lancer en root." >&2
  exit 1
fi

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
# Les clés de root (celle de l'utilisateur) donnent aussi accès à `deploy`.
if [ -f /root/.ssh/authorized_keys ]; then
  cat /root/.ssh/authorized_keys >> "$auth"
fi
if [ -n "$DEPLOY_KEY" ]; then
  printf '%s\n' "$DEPLOY_KEY" >> "$auth"
fi
sort -u "$auth" -o "$auth"
chown "$DEPLOY_USER:$DEPLOY_USER" "$auth"
chmod 600 "$auth"

# --- Docker Engine + Compose (dépôt officiel) --------------------------------
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
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
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /srv/edge /srv/edge/conf /srv/cv

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
# fournissent `ubuntu`, membre de sudo.
admin_with_key=""
for user in $(getent group sudo | cut -d: -f4 | tr ',' ' '); do
  home=$(getent passwd "$user" | cut -d: -f6)
  if [ -s "$home/.ssh/authorized_keys" ]; then
    admin_with_key="$user"
  fi
done

if [ -s "$auth" ] && [ -n "$admin_with_key" ]; then
  cat > /etc/ssh/sshd_config.d/90-hardening.conf <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
SSHD
  sshd -t
  systemctl reload ssh
  echo "SSH durci : root et mots de passe refusés. Administrateur : $admin_with_key."
  echo "Tester 'ssh deploy@<ip>' et 'ssh $admin_with_key@<ip>' AVANT de fermer cette session."
else
  echo "SSH laissé tel quel : il faut une clé pour '$DEPLOY_USER' ET un membre de sudo avec une clé." >&2
fi

systemctl enable --now fail2ban

docker --version
docker compose version
echo "Prêt. Suite : edge/README → /srv/edge, puis /srv/cv."
