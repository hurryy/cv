# VPS de production

Comment le CV arrive sur `yannhurry.fr`, comment réinstaller le serveur, comment mettre en
ligne une version. Écrit d'après l'installation du 2026-11-07.

| Repère | Valeur |
|---|---|
| VPS | OVH VPS 2020 Value 1-2-40, Ubuntu 24.04 |
| IPv4 | `51.83.79.249` |
| IPv6 | `2001:41d0:305:2100::485e` |
| Empreinte de la clé d'hôte (ED25519) | `SHA256:aowOgyim26MUcqSRKe+LUGhSXjJR8R+p3jVNE+5aTRQ` — change à chaque réinstallation |
| Domaine | `yannhurry.fr` (`www` redirigé) |
| Dépôt | `hurryy/cv` |
| Ruleset `master`/`dev` | id `26755649` |

Le script `edge/install-vps.ps1` enchaîne depuis le PC, avec des pauses aux points de
contrôle : § 2.2 (première connexion, clé perso), § 2.3 (clé de déploiement), § 2.4
(`bootstrap-vps.sh` et contrôle des accès), § 2.5 (redémarrage), le contrôle du DNS du § 2.6,
§ 2.7 (Caddy de bordure), § 2.8 (`/srv/cv`) et les vérifications HTTP du § 6. Il ne fait ni
la réinstallation chez OVH (§ 2.1), ni la saisie de la zone DNS (§ 2.6), ni les réglages
GitHub (§ 3), ni la mise en ligne (§ 4). Ce document reste la référence.

```powershell
# PC, depuis la racine du dépôt cv
powershell -NoProfile -File edge\install-vps.ps1 -Ip 51.83.79.249
# reprise après un arrêt : la commande exacte est affichée, avec -From <n>
powershell -NoProfile -File edge\install-vps.ps1 -Ip 51.83.79.249 -From <n>
```

Dans les blocs de code, la première ligne de commentaire dit où taper la commande :

- **PC** : PowerShell sur le poste Windows ;
- **VPS (ubuntu)** / **VPS (deploy)** : shell du serveur, connecté sous ce compte.

---

## 1. Vulgarisation

### Ce qui tourne où

```
  Publier une version                          Visiter le site
  ───────────────────                          ───────────────
  PC (code, git, gh)                           Navigateur
     │ git push / PR                              │ yannhurry.fr ?
     ▼                                            ▼
  GitHub ── CI (build, lint, tests)            DNS OVH ── « 51.83.79.249 »
     │ « Docker Build & Push » (manuel)           │
     ▼                                            │ HTTPS
  GHCR (ghcr.io/hurryy/cv:sha-xxxxxxx)            ▼
     │ « Deploy » (manuel, approuvé)          ┌─ VPS OVH ─────────────────────────────┐
     │ ssh deploy@VPS : pull + up             │                                       │
     └──────────────────────────────────────▶ │  Caddy de bordure   /srv/edge         │
                                              │  ports 80/443, TLS Let's Encrypt,     │
                                              │  mot de passe de pré-ouverture        │
                                              │          │ réseau Docker « edge »     │
                                              │          ▼                            │
                                              │  conteneur cv       /srv/cv           │
                                              │  Caddy non-root, sert les fichiers    │
                                              │  HTML prérendus (port 8080 interne)   │
                                              └───────────────────────────────────────┘
```

- **Le PC** écrit le code et pilote tout. Rien ne part en production sans un geste de
  l'utilisateur.
- **GitHub** vérifie chaque push (CI). Il ne publie une image et ne déploie que sur
  lancement manuel, depuis `master`, si la variable `DEPLOY_ENABLED` vaut `true`.
- **GHCR** (registre d'images de GitHub) garde les images `sha-xxxxxxx` et `latest`. Une
  ancienne image permet le retour arrière.
- **DNS OVH** traduit `yannhurry.fr` en adresse IP du VPS.
- **Le VPS** fait tourner deux conteneurs Docker :
  - le **Caddy de bordure** (`/srv/edge`) : seul à ouvrir des ports (80 et 443). Il obtient
    et renouvelle seul les certificats HTTPS (Let's Encrypt), ajoute les en-têtes de
    sécurité, et demande un mot de passe tant que le site est en pré-ouverture. Il servira
    aussi app-shop plus tard ;
  - le conteneur **`cv`** (`/srv/cv`) : un second Caddy, sans droits root, qui sert les
    fichiers HTML déjà générés au build. Pas de Node en production. Il n'ouvre aucun port :
    seul le Caddy de bordure le joint, par le réseau Docker interne `edge`.

### Les trois clés SSH

Une clé SSH = une paire. La partie **privée** reste chez son propriétaire et prouve son
identité ; la partie **publique** se donne à qui doit la reconnaître.

| Clé | Rôle | Partie privée | Partie publique |
|---|---|---|---|
| `id_rsa` (perso) | Toi, pour te connecter en `ubuntu` (et en `deploy`) | Sur le PC, `%USERPROFILE%\.ssh\id_rsa`. Ne sort jamais du PC | `~/.ssh/authorized_keys` de `ubuntu` et de `deploy` sur le VPS |
| `deploy_cv` | GitHub Actions, pour déployer en `deploy` | Secret GitHub `SSH_KEY` (copie sur le PC : `%USERPROFILE%\.ssh\deploy_cv`) | `~/.ssh/authorized_keys` de `deploy` |
| Clé d'hôte ED25519 | Identité du **serveur** : prouve à ton PC et à GitHub qu'ils parlent bien au VPS et pas à un imposteur | Sur le VPS, `/etc/ssh/ssh_host_ed25519_key` | Ton `known_hosts` et le secret GitHub `SSH_KNOWN_HOSTS` |

La clé d'hôte est régénérée à chaque réinstallation du VPS : il faut alors mettre à jour
`known_hosts` sur le PC et le secret `SSH_KNOWN_HOSTS`.

### Les comptes du VPS

| Compte | Pour qui | Droits |
|---|---|---|
| `ubuntu` | Toi, administrateur | `sudo`. Mot de passe défini à la première connexion (exigé par OVH) ; il ne sert plus qu'à `sudo` si on le demande, la connexion SSH se fait par clé |
| `deploy` | GitHub Actions (et toi pour `/srv/edge`) | Pas de `sudo`. Membre du groupe `docker`, ce qui **équivaut à root** : d'où une clé dédiée, `deploy_cv` |
| `root` | Personne | Connexion SSH refusée après le script d'installation |

Après le script, SSH refuse tout mot de passe : seules les clés ouvrent une session.

### Les deux jetons GitHub

| Jeton | Qui | Droits | Où |
|---|---|---|---|
| `GH_TOKEN` fine-grained | Claude | Lecture seule sur `cv` et `app-shop` | `.claude/settings.local.json` (porte un secret, hors git) |
| Session `gh auth login` | Toi | Écriture : secrets, variables, PR, merge, workflows | Gestionnaire d'identifiants de Windows |

Claude ne peut donc ni modifier les réglages du dépôt, ni merger, ni lancer un déploiement.

### Ce qui est manuel, par choix

La publication d'image (« Docker Build & Push ») et le déploiement (« Deploy ») ne partent
jamais d'un push ou d'un merge. Ils se lancent à la main, depuis `master`, et le déploiement
attend en plus ton approbation dans l'environment `production`. Les merges aussi
t'appartiennent.

---

## 2. Installation d'un VPS neuf

Compter une heure, dont l'attente DNS. Garder ce document ouvert.

### 2.1 Réinstaller chez OVH

Espace client OVH → VPS → **Réinstaller** → Ubuntu 24.04. OVH envoie par mail le compte
`ubuntu` et, selon le cas, un mot de passe temporaire.

**Si tu as une ancienne entrée pour cette IP** (réinstallation), SSH affiche
« REMOTE HOST IDENTIFICATION HAS CHANGED » : c'est normal, la clé d'hôte a changé.

```powershell
# PC
ssh-keygen -R 51.83.79.249
```

À la connexion suivante, SSH montre l'empreinte du serveur et demande `yes/no`. La comparer
avant de répondre `yes` : console KVM d'OVH (espace client → VPS → KVM), connecté en
`ubuntu`.

```bash
# VPS (ubuntu), dans la console KVM
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

### 2.2 Première connexion et clé perso

Si OVH n'a envoyé qu'un mot de passe, la première connexion se fait **en interactif** : Ubuntu
impose de le changer. Une commande passée en argument (`ssh ubuntu@IP "…"`) échoue alors avec
« Password change required but no TTY available ».

```powershell
# PC — saisir le mot de passe du mail, puis l'ancien encore une fois, puis le nouveau deux fois.
# La session se ferme après le changement : c'est normal.
ssh ubuntu@51.83.79.249
```

Envoyer ensuite la clé perso (demande le nouveau mot de passe une dernière fois) :

```powershell
# PC
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub -Raw | ssh ubuntu@51.83.79.249 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && tr -d '\r' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

`tr -d '\r'` retire les retours chariot (CRLF de Windows) : pas de ligne terminée par `\r`
dans `authorized_keys`. C'est la commande qu'envoie `edge/install-vps.ps1`.

Vérifier que la clé suffit (aucun mot de passe demandé) :

```powershell
# PC
ssh ubuntu@51.83.79.249 "echo ok"
```

### 2.3 Clé de déploiement

Une seule fois par PC, ou si on veut la changer. **Sans passphrase** (Entrée deux fois) :
GitHub Actions ne peut pas en saisir une.

```powershell
# PC
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\deploy_cv -C deploy@github
```

Deux fichiers : `deploy_cv` (privée, pour le secret GitHub `SSH_KEY`) et `deploy_cv.pub`
(publique, passée au script ci-dessous). Afficher la publique pour la copier :

```powershell
# PC
type $env:USERPROFILE\.ssh\deploy_cv.pub
```

Si la clé change, mettre à jour le secret `SSH_KEY` (§ 3.3).

### 2.4 Script d'installation (`bootstrap-vps.sh`)

Il installe le swap, les mises à jour, Docker, le pare-feu (`ufw` : 22, 80, 443), fail2ban,
les mises à jour de sécurité automatiques, crée `deploy` et `/srv/edge`, `/srv/cv`, puis
durcit SSH (plus de root, plus de mot de passe) **seulement** si `deploy` et un
administrateur ont chacun une clé. Il est rejouable.

```powershell
# PC
scp C:\Development\yannhurry.fr\cv\edge\bootstrap-vps.sh ubuntu@51.83.79.249:
ssh -t ubuntu@51.83.79.249
```

```bash
# VPS (ubuntu)
tmux new -s bootstrap
```

`tmux` garde la session vivante si le réseau coupe (`apt-get upgrade` est long) : une coupure
hors tmux tue le script et peut laisser dpkg interrompu. `edge/install-vps.ps1` (étape 4) lance
lui aussi le script dans une session tmux `bootstrap`. Après une coupure :

```powershell
# PC
ssh -t ubuntu@51.83.79.249 "tmux attach -t bootstrap"
```

Si le script n'y tourne plus et qu'apt signale dpkg interrompu :

```bash
# VPS (ubuntu)
sudo dpkg --configure -a
```

puis relancer le script (rejouable), ou `edge\install-vps.ps1 … -From 4`.

Avec le terminal Windows, tmux peut afficher des séquences parasites du genre
`61;4;6;7;…c` : sans effet, `Ctrl+L` pour nettoyer.

```bash
# VPS (ubuntu), dans tmux — coller la ligne de deploy_cv.pub entre les guillemets
sudo bash bootstrap-vps.sh "ssh-ed25519 AAAA… deploy@github"
```

Lire la fin de la sortie. Attendu :

```
SSH durci : root et mots de passe refusés. Administrateur : ubuntu.
```

Sinon le script dit pourquoi (« SSH laissé tel quel : il faut une clé… » ou « ATTENTION : SSH
n'est PAS durci… »). Corriger et relancer la même commande.

**Avant de fermer cette session**, tester depuis un second terminal PowerShell :

```powershell
# PC, second terminal
ssh ubuntu@51.83.79.249 "echo ok"
ssh -i $env:USERPROFILE\.ssh\deploy_cv deploy@51.83.79.249 "docker ps"
```

Les deux doivent répondre sans mot de passe (`ok`, puis l'en-tête vide de `docker ps`). Si
l'un échoue, la session ouverte permet encore de corriger ; une fois fermée, seule la console
KVM d'OVH le permet.

### 2.5 Redémarrage

Si la connexion affiche « System restart required » :

```bash
# VPS (ubuntu)
sudo apt-get update && sudo apt-get upgrade -y && sudo reboot
```

Ne **pas** lancer `do-release-upgrade` (passage à une autre version d'Ubuntu) : non testé
avec le script.

### 2.6 DNS chez OVH

Espace client → Noms de domaine → `yannhurry.fr` → **Zone DNS**.

| Sous-domaine | Type | Cible |
|---|---|---|
| (vide, racine) | A | `51.83.79.249` |
| (vide, racine) | AAAA | `2001:41d0:305:2100::485e` |
| `www` | CNAME | `yannhurry.fr.` (point final compris) |

- Mettre l'AAAA **seulement** si le VPS a bien son IPv6 : sinon Let's Encrypt, qui essaie
  l'IPv6 en premier, échoue.

  ```bash
  # VPS (ubuntu)
  ip -6 addr show scope global
  ```

- Supprimer l'enregistrement TXT `3|welcome` sur `www` créé par OVH : un CNAME ne peut
  cohabiter avec aucun autre enregistrement, OVH refuse le CNAME tant qu'il est là.
- Ne pas toucher aux MX, SRV, `autoconfig`, `autodiscover` : ils servent le mail.
- TTL bas (300 s) au début, pour corriger vite ; le remonter quand tout marche.

Vérifier, chez Google puis chez OVH :

```powershell
# PC
nslookup yannhurry.fr 8.8.8.8
nslookup www.yannhurry.fr 8.8.8.8
nslookup www.yannhurry.fr ns101.ovh.net
```

**Ne pas démarrer Caddy avant que ces réponses donnent la bonne IP.** Let's Encrypt
n'accepte que 5 échecs par heure et par nom : un Caddy démarré trop tôt les épuise.

### 2.7 Caddy de bordure (`/srv/edge`)

Envoyer le compose et le Caddyfile en `deploy` :

```powershell
# PC
scp C:\Development\yannhurry.fr\cv\edge\docker-compose.yml deploy@51.83.79.249:/srv/edge/docker-compose.yml
scp C:\Development\yannhurry.fr\cv\edge\conf\Caddyfile deploy@51.83.79.249:/srv/edge/conf/Caddyfile
ssh -t deploy@51.83.79.249
```

Calculer le hash du mot de passe de pré-ouverture (Caddy le demande deux fois, sans
l'afficher) :

```bash
# VPS (deploy)
docker run --rm -it caddy:2-alpine caddy hash-password
```

Écrire le `.env` d'après `edge/.env.example` :

```bash
# VPS (deploy)
nano /srv/edge/.env
```

Contenu attendu (valeurs à remplir) :

```
ACME_EMAIL=ton-adresse@exemple
CV_DOMAIN=yannhurry.fr
PREVIEW_USER=nom-choisi
PREVIEW_HASH=$$2a$$14$$…
```

**Doubler chaque `$` du hash** (`$` → `$$`) : sinon Docker Compose les prend pour des
variables. `Ctrl+O`, Entrée, `Ctrl+X` pour enregistrer et quitter.

```bash
# VPS (deploy)
chmod 600 /srv/edge/.env
cd /srv/edge && docker compose up -d && docker compose logs -f
```

Attendre deux lignes « certificate obtained successfully » (racine et `www`), puis `Ctrl+C`
(les logs s'arrêtent, pas Caddy).

### 2.8 Dossier du CV (`/srv/cv`)

Le déploiement y copie le compose et réécrit `CV_TAG` dans `.env`. Le créer d'avance, fermé
(`600`) : sans lui, « Deploy » journalise `grep: .env: No such file or directory` et le crée
lui-même avec les droits par défaut.

```bash
# VPS (deploy)
echo "CV_TAG=latest" > /srv/cv/.env && chmod 600 /srv/cv/.env
```

Le site répond `502` tant que « Deploy » n'a pas tourné une première fois (§ 4).

---

## 3. GitHub (une fois)

Toutes ces commandes se lancent sur le **PC**, avec ta session `gh` (le jeton de Claude est en
lecture seule). Après une réinstallation du VPS seule, refaire uniquement `SSH_KNOWN_HOSTS`
(§ 3.3), et `SSH_HOST` si l'IP a changé.

### 3.1 Connexion

```powershell
# PC — choisir GitHub.com, HTTPS, puis connexion par le navigateur
gh auth login
gh auth status
```

### 3.2 Environment `production` avec approbation

L'environment porte les secrets de déploiement et impose ton approbation avant chaque
« Deploy ».

```powershell
# PC
$id = gh api user --jq .id
@"
{ "reviewers": [ { "type": "User", "id": $id } ] }
"@ | gh api -X PUT repos/hurryy/cv/environments/production --input -
```

### 3.3 Secrets de l'environment

```powershell
# PC
gh secret set SSH_HOST -R hurryy/cv --env production --body 51.83.79.249
gh secret set SSH_USER -R hurryy/cv --env production --body deploy
Get-Content $env:USERPROFILE\.ssh\deploy_cv -Raw | gh secret set SSH_KEY -R hurryy/cv --env production
```

(commande vérifiée par un Deploy réussi le 2026-11-07)

`SSH_KNOWN_HOSTS` : la clé d'hôte du VPS, pour que GitHub refuse un imposteur.

```powershell
# PC
$kh = ssh-keyscan -t ed25519 51.83.79.249 2>$null
$kh
```

Vérifier l'empreinte avant de l'enregistrer. Sous Windows PowerShell 5.1, `ssh-keygen -lf -`
ne lit pas l'entrée standard, et `Out-File` écrit en UTF-16 que `ssh-keygen` ne sait pas lire :
passer par un fichier ASCII.

```powershell
# PC
$kh | Set-Content -Encoding Ascii $env:TEMP\kh.txt
ssh-keygen -lf $env:TEMP\kh.txt
Remove-Item $env:TEMP\kh.txt
```

L'empreinte affichée doit être celle de la console KVM (§ 2.1). Puis enregistrer la ligne
telle quelle, en `--body` :

```powershell
# PC
gh secret set SSH_KNOWN_HOSTS -R hurryy/cv --env production --body "$kh"
```

### 3.4 Variables

```powershell
# PC
gh variable set DEPLOY_PATH -R hurryy/cv --env production --body /srv/cv
```

`DEPLOY_ENABLED` se pose **en dernier** (§ 3.6) : tant qu'elle manque, publication et
déploiement sont inertes.

### 3.5 Ruleset `master` / `dev` et auto-merge

Protège `master` et `dev` : ni suppression ni force-push, merge par PR seulement, check `cv`
(la CI) vert obligatoire. 0 approbation requise : tu es seul sur le dépôt et GitHub
n'autorise pas à approuver sa propre PR.

**Le ruleset existe déjà (id `26755649`) : le relire, ne pas en créer un second.**

```powershell
# PC
gh api repos/hurryy/cv/rulesets/26755649
```

Création, **dépôt neuf uniquement**. Le JSON reprend le ruleset réel tel que l'API le rend.
`require_extra_approval_for_unattributed_changes` y est écrit à `false` par précaution :
aucun blocage constaté ne lui est imputable (le merge bloqué de la PR #2 venait d'un check `cv`
annulé, § 4.4).

```powershell
# PC — dépôt neuf uniquement
@'
{
  "name": "protect-master-dev",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["refs/heads/master", "refs/heads/dev"], "exclude": [] }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": false,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [ { "context": "cv" } ]
      }
    }
  ]
}
'@ | gh api -X POST repos/hurryy/cv/rulesets --input -
gh repo edit hurryy/cv --enable-auto-merge=false
```

### 3.6 Activation, en dernier

```powershell
# PC
gh variable set DEPLOY_ENABLED -R hurryy/cv --body true
```

### 3.7 Vérifications

```powershell
# PC
gh secret list -R hurryy/cv --env production
gh variable list -R hurryy/cv --env production
gh variable list -R hurryy/cv
```

Attendu : `SSH_HOST`, `SSH_KEY`, `SSH_KNOWN_HOSTS`, `SSH_USER` ; `DEPLOY_PATH` dans
l'environment ; `DEPLOY_ENABLED` au niveau du dépôt.

---

## 4. Mettre en ligne une version

Tout se lance sur le **PC**. Flux : `claude` → `dev` → `master`, puis publication de
l'image, puis déploiement.

### 4.1 Les deux PR

```powershell
# PC
gh pr create -R hurryy/cv --base dev --head claude --title "…" --body "…"
gh pr checks <N> -R hurryy/cv --watch
gh pr merge <N> -R hurryy/cv --merge

gh pr create -R hurryy/cv --base master --head dev --title "…" --body "…"
gh pr checks <N> -R hurryy/cv --watch
gh pr merge <N> -R hurryy/cv --merge
```

`<N>` : le numéro de PR affiché par `gh pr create`. Toujours `--merge` (sur GitHub :
« Create a merge commit ») : jamais `--squash` ni `--rebase` (les commits de `claude` seraient
recopiés sous d'autres identifiants et les branches divergeraient), ni `--admin` (contourne
la protection).

### 4.2 Publier l'image

```powershell
# PC
gh workflow run "Docker Build & Push" -R hurryy/cv --ref master
gh run list -R hurryy/cv --workflow "Docker Build & Push" --event workflow_dispatch --limit 1
gh run watch <id> -R hurryy/cv
```

L'image est publiée en `sha-xxxxxxx` (7 premiers caractères du commit) et `latest`.

Le « Docker Build & Push » qui part tout seul au merge sur `master` (événement `push`) ne fait
que construire l'image pour la vérifier : il ne publie rien. Seul le lancement manuel
ci-dessus publie : vérifier que le job `publish` a tourné et réussi, pas seulement `build`.
Sans lui, « Deploy » tire de nouveau l'ancienne `latest` et ne change rien en production.

### 4.3 Déployer

```powershell
# PC
gh workflow run Deploy -R hurryy/cv --ref master
```

Le run attend ton approbation : GitHub → Actions → run « Deploy » → **Review deployments** →
cocher `production` → **Approve and deploy**.

Retour arrière vers une image antérieure (tags visibles dans GitHub → Packages → `cv`) :

```powershell
# PC
gh workflow run Deploy -R hurryy/cv --ref master -f tag=sha-xxxxxxx
```

### 4.4 Piège : check `cv` annulé

Deux pushs rapprochés sur la même branche annulent le premier run de CI (`concurrency`). Si le
commit de la PR porte un check `cv` annulé, le merge reste bloqué, même avec un autre run `cv`
vert : y compris quand ce run annulé vient d'un push de ce même commit sur une autre branche
(cas de la PR #2 : le commit de `claude` poussé sur `master`, puis annulé).
Relancer ce run :

```powershell
# PC
gh run list -R hurryy/cv --workflow CI --limit 5
gh run rerun <id> -R hurryy/cv
```

---

## 5. Mettre à jour la configuration de bordure

Après une modification de `edge/conf/Caddyfile` dans le dépôt :

```powershell
# PC
scp C:\Development\yannhurry.fr\cv\edge\conf\Caddyfile deploy@51.83.79.249:/srv/edge/conf/Caddyfile
ssh deploy@51.83.79.249 "cd /srv/edge && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile"
```

Si Caddy répond « permission denied » sur le Caddyfile : il tourne sans le droit de lire un
dossier fermé (`cap_drop: ALL`).

```bash
# VPS (deploy)
chmod 755 /srv/edge/conf
```

Une modification de `edge/docker-compose.yml` ou du `.env` demande un redémarrage du
conteneur, pas un reload :

```bash
# VPS (deploy)
cd /srv/edge && docker compose up -d
```

**Ouvrir le site au public** (CV-05) : retirer la ligne `import preview` du bloc
`{$CV_DOMAIN}` dans `edge/conf/Caddyfile`, puis recopier et recharger comme ci-dessus. Le mot
de passe et le `noindex` disparaissent ensemble.

---

## 6. Vérifications

Depuis le PC :

```powershell
# PC
curl.exe -sI https://yannhurry.fr
curl.exe -sI https://www.yannhurry.fr
curl.exe -sI http://yannhurry.fr
```

| URL | Attendu en pré-ouverture |
|---|---|
| `https://yannhurry.fr` | `HTTP/1.1 401` ou `HTTP/2 401`, `strict-transport-security`, `x-robots-tag: noindex, nofollow` |
| `https://www.yannhurry.fr` | `301`, `location: https://yannhurry.fr/` |
| `http://yannhurry.fr` | `308`, `location: https://yannhurry.fr/` |

Avec le mot de passe : `curl.exe -sI -u nom-choisi https://yannhurry.fr` (curl le demande)
→ `200`.

Sur le VPS :

```bash
# VPS (deploy)
docker ps
cd /srv/edge && docker compose logs --tail 50
cd /srv/cv && docker compose -f docker-compose.prod.yml logs --tail 50
```

```bash
# VPS (ubuntu)
sudo ufw status
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication) '
sudo fail2ban-client status sshd
```

Attendu : `ufw` actif avec OpenSSH, 80, 443 ; `permitrootlogin no` et
`passwordauthentication no` ; la prison `sshd` de fail2ban active.

---

## 7. Fichiers à envoyer lors d'une réinstallation

| Fichier du dépôt (ou source) | Destination sur le VPS | Lu par |
|---|---|---|
| `edge/bootstrap-vps.sh` | `/home/ubuntu/bootstrap-vps.sh` | `sudo bash`, une fois |
| `%USERPROFILE%\.ssh\id_rsa.pub` (PC) | `/home/ubuntu/.ssh/authorized_keys` ; recopié par le script dans celui de `deploy` | sshd |
| `%USERPROFILE%\.ssh\deploy_cv.pub` (PC) | argument du script → `/home/deploy/.ssh/authorized_keys` | sshd |
| `edge/docker-compose.yml` | `/srv/edge/docker-compose.yml` | `docker compose`, en `deploy` |
| `edge/conf/Caddyfile` | `/srv/edge/conf/Caddyfile` | Caddy de bordure (monté en lecture seule sur `/etc/caddy`) |
| `edge/.env.example` (gabarit, rempli à la main) | `/srv/edge/.env`, `chmod 600` | `docker compose` de `/srv/edge` |
| `.env.prod.example` (gabarit) | `/srv/cv/.env` (`CV_TAG=latest`), `chmod 600` | `docker compose` de `/srv/cv`, réécrit par « Deploy » |
| `docker-compose.prod.yml` | `/srv/cv/docker-compose.prod.yml` | copié par « Deploy », rien à faire |

Les certificats sont dans le volume Docker `edge_caddy_data` : une réinstallation les perd, et
Caddy en redemande (attention à la limite Let's Encrypt, § 2.6).

---

## 8. Dépannage

| Symptôme | Cause | Remède |
|---|---|---|
| `Password change required but no TTY available` | Première connexion : OVH impose le changement du mot de passe, impossible sans terminal | `ssh ubuntu@51.83.79.249` seul, en interactif (§ 2.2) |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | VPS réinstallé : nouvelle clé d'hôte | `ssh-keygen -R 51.83.79.249`, reconnexion, vérifier l'empreinte (§ 2.1) ; mettre à jour `SSH_KNOWN_HOSTS` (§ 3.3) |
| « Deploy » échoue : `Host key verification failed` | `SSH_KNOWN_HOSTS` porte l'ancienne clé d'hôte | Refaire `SSH_KNOWN_HOSTS` (§ 3.3) |
| `hostname contains invalid characters` | Chevrons laissés dans la commande (`ubuntu@<IP>`) | Écrire l'IP sans chevrons : `ubuntu@51.83.79.249` |
| `cd /srv/edge && …` refusé, ou `&&` « n'est pas un séparateur valide » | Commande du VPS tapée dans PowerShell du PC | Se connecter d'abord : `ssh -t deploy@51.83.79.249` |
| `ssh` lancé depuis le VPS demande un mot de passe ou refuse | Commande du PC tapée dans le shell du VPS (le VPS n'a pas tes clés) | `exit`, puis la relancer dans PowerShell du PC |
| `61;4;6;7;…c` affiché dans tmux | Réponse du terminal Windows aux questions de tmux | Sans effet ; `Ctrl+L` |
| Coupure pendant `bootstrap-vps.sh` | Réseau | `ssh -t ubuntu@51.83.79.249 "tmux attach -t bootstrap"` ; si le script n'y tourne plus et que dpkg est interrompu : `sudo dpkg --configure -a`, puis relancer le script (rejouable) ou `edge\install-vps.ps1 … -From 4` |
| « SSH laissé tel quel : il faut une clé… » | `deploy` ou l'administrateur n'a pas de clé (clé perso pas envoyée, clé de déploiement absente ou mal collée) | Envoyer la clé perso (§ 2.2), relancer le script avec la ligne complète de `deploy_cv.pub` |
| Groupe `sudo` vide sur OVH | `ubuntu` tient `sudo` de `/etc/sudoers.d/90-cloud-init-users`, pas du groupe | Rien à faire : le script le reconnaît (`$SUDO_USER`) |
| « System restart required » | Noyau mis à jour | § 2.5 ; pas de `do-release-upgrade` |
| OVH refuse le CNAME `www` | TXT `3|welcome` présent sur `www` | Supprimer ce TXT, puis créer le CNAME (§ 2.6) |
| Caddy : `too many failed authorizations` / `rateLimited` | Plus de 5 échecs Let's Encrypt en une heure (DNS pas prêt au démarrage) | `docker compose down`, attendre une heure, vérifier le DNS (§ 2.6), redémarrer |
| Caddy : échec du challenge sur l'IPv6 | AAAA posé alors que l'IPv6 du VPS ne répond pas | Retirer l'AAAA ou corriger l'IPv6 (`ip -6 addr show scope global`) |
| Caddy : `permission denied` sur `/etc/caddy/Caddyfile` | `/srv/edge/conf` fermé ; Caddy n'a pas le droit de passer outre (`cap_drop: ALL`) | `chmod 755 /srv/edge/conf` en `deploy` |
| `docker compose up` : `required variable … is missing a value` | `.env` absent ou incomplet dans `/srv/edge` | Compléter d'après `edge/.env.example` (§ 2.7) |
| Mot de passe de pré-ouverture refusé alors qu'il est juste | `$` du hash non doublés dans `.env` | Réécrire `PREVIEW_HASH` avec `$$`, puis `docker compose up -d` |
| Log de « Deploy » : `grep: .env: No such file or directory` | `/srv/cv/.env` absent | § 2.8, puis `chmod 600 /srv/cv/.env` |
| « Deploy » ou « Docker Build & Push » ne fait rien (job sauté) | `DEPLOY_ENABLED` différent de `true`, ou lancé hors de `master` | § 3.6 ; `--ref master` |
| « Deploy » réussi mais le site n'a pas changé ; log : `Container cv-cv-1 Running` (pas `Recreated`) | Aucune nouvelle image publiée : seul le « Docker Build & Push » automatique (sans publication) a tourné | § 4.2 (lancement manuel depuis `master`), puis § 4.3 |
| `claude` et `dev` divergent avec le même contenu | PR mergée en « Rebase and merge » ou « Squash » | Merger en « Create a merge commit » (§ 4.1) ; réaligner `claude` demande un force-push, à décider par l'utilisateur |
| Site en `502` | Le conteneur `cv` ne tourne pas (jamais déployé, ou arrêté) | Lancer « Deploy » (§ 4.3) ; `docker ps` |
| Merge bloqué alors que la CI est verte | Un check `cv` annulé sur le même commit, y compris un run de push sur la branche cible annulé par `concurrency` | Retrouver le run annulé (`gh run list -R hurryy/cv --workflow CI --limit 5`), puis `gh run rerun <id> -R hurryy/cv` (§ 4.4) |
| `ssh-keygen -lf -` n'affiche rien ou `is not a public key file` | PowerShell 5.1 : pas de lecture de stdin ; `Out-File` écrit en UTF-16 | Fichier écrit avec `Set-Content -Encoding Ascii` (§ 3.3) |
| fail2ban bannit ton IP après des essais ratés | Plusieurs échecs SSH d'affilée | Attendre 10 min, ou depuis la console KVM : `sudo fail2ban-client set sshd unbanip <ton IP>` |
