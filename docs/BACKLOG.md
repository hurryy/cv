# Backlog — cv

Source de vérité du travail à faire. Plan d'ensemble : CV d'abord (migration, chaîne de
livraison, contenu, design franco-suisse), app-shop ensuite.

Format d'un ticket : `## [ID] Titre`, `Statut`, critères d'acceptation en cases à cocher.

---

## À faire

## [CV-02] Réglages GitHub et premier passage de la CI

Statut : à faire — **utilisateur** (`gh` absent de la machine)

- [ ] Dépôt `hurryy/cv` : protection de `master` et `dev` (PR obligatoire, check `cv` requis,
      pas de force-push), « Allow auto-merge » décoché
- [ ] Environment `production` avec required reviewer
- [ ] Secrets de l'environment : `SSH_HOST`, `SSH_USER`, `SSH_KEY` (clé dédiée),
      `SSH_KNOWN_HOSTS` (`ssh-keyscan`), `SSH_PORT` (facultatif)
- [ ] Variable `DEPLOY_PATH` (ex. `/srv/cv`), puis `DEPLOY_ENABLED=true` en dernier
- [ ] CI verte sur `claude`
- [ ] Le check `cv` de `ci.yml` et le job `build` de `docker-build.yml` passent

## [CV-03] VPS OVH neuf

Statut : script corrigé et relu le 2026-11-05 (`edge/bootstrap-vps.sh`, shellcheck propre,
durcissement SSH vérifié sur un vrai sshd en conteneur, jamais exécuté sur le VPS) —
exécution par l'utilisateur

Prérequis utilisateur : VPS commandé ou réinstallé en **Ubuntu 24.04 LTS** avec sa clé SSH
personnelle ; une **paire de clés dédiée au déploiement** (`ssh-keygen -t ed25519 -f
deploy_cv -C deploy@github`) dont la publique est passée au script et la privée va dans le
secret `SSH_KEY`.

VPS retenu (2026-11-05) : OVH VPS 2020 Value 1-2-40 (1 vCore, 2 Go, 40 Go), réinstallé en
Ubuntu 24.04 par l'utilisateur avec sa clé personnelle. **Toute action sur le VPS est faite
par l'utilisateur**, jamais par Claude. `ACME_EMAIL` : l'adresse du compte de l'utilisateur.

Défauts du script relevés le 2026-11-05, corrigés le jour même (non exécutés sur le VPS) :
- [x] Les clés reprises de `/root/.ssh/authorized_keys` portent sur les images OVH une option
      `command="…Please login as the user ubuntu…"` : recopiées telles quelles, elles
      bloquent `deploy`. Reprendre les clés de l'administrateur qui lance le script
      (`$SUDO_USER`), options de ligne retirées
- [x] L'en-tête documente `ssh root@<ip>`, fermé sur les images OVH : `ssh -t ubuntu@<ip>`,
      `tmux`, puis `sudo bash` dans la session
- [x] Swap de 2 Go (fichier, rejouable, `vm.swappiness=10`) : 2 Go de RAM ne suffisent pas
      à MySQL + Nest d'app-shop sans marge
- [x] Le message final renvoie à un `edge/README` absent
- [x] Durcissement SSH sans effet : `50-cloud-init.conf` (`PasswordAuthentication yes`) passe
      avant `90-hardening.conf`, sshd gardant la première valeur ; fichier renommé
      `00-hardening.conf` et effet relu par `sshd -T`

À voir plus tard : fail2ban peut bannir l'IP de l'utilisateur pendant ses essais de connexion,
session ouverte comprise (10 min) ; `ignoreip` éventuel.

- [ ] `edge/bootstrap-vps.sh` : utilisateur `deploy` par clé, root SSH coupé (seulement si un
      membre de sudo a une clé), `ufw` 22/80/443, `unattended-upgrades`, fail2ban, Docker
      Engine + Compose, rotation des logs, `/srv/edge` et `/srv/cv`
- [ ] DNS OVH : A/AAAA `yannhurry.fr` et `www` → IP du VPS, **avant** le premier démarrage
      de Caddy
- [ ] `/srv/edge` : `edge/docker-compose.yml`, `edge/conf/Caddyfile`, `.env` d'après
      `edge/.env.example` ; `docker compose up -d`
- [ ] `/srv/cv` : `.env` d'après `.env.prod.example`
- [ ] Premier déploiement : « Docker Build & Push » puis « Deploy » depuis `master`
- [ ] `curl -I https://yannhurry.fr` : 401 sans identifiants, `noindex`, HSTS ; `www` → 301

## [CV-04] Contenu à jour

Statut : à faire — **utilisateur**, relecture par Claude

- [ ] `src/app/cv/cv.data.ts` : expériences post-2020, compétences, langues, formations
- [ ] Lien GitHub : l'ancien CV pointait vers une URL invalide, il a été retiré

## [CV-05] Design et format franco-suisse

Statut : à faire — itératif avec l'utilisateur, après CV-04

À arbitrer : photo, en-tête (nationalité / permis, disponibilité, mobilité Annecy–Genève, taux
d'activité), langues au niveau CECR, références, 2 pages A4 max.

- [ ] Feuille `@media print` A4 : 2 pages, liens cliquables, aucun débordement
- [ ] PDF téléchargeable, généré depuis la même source
- [ ] Ouverture publique : retirer `import preview` du bloc CV dans `edge/conf/Caddyfile`

## [CV-06] Sortir `edge/` dans un dépôt d'infra

Statut : à faire — avant le branchement d'app-shop

Le Caddy de bordure sert tous les sites du VPS mais vit dans `cv/` parce que le CV est le
premier déployé. Quand app-shop s'y branche (retrait de son propre Caddy, réseau `edge`
externe), le déplacer dans un dépôt dédié.

---

## Terminé

## [CV-01] Migration Angular 11 → 21 et containerisation

Recréation du workspace plutôt que dix `ng update` successifs. Standalone, signals, OnPush,
control flow, ESLint, Vitest, prérendu statique. Contenu repris tel quel dans `cv.data.ts`.
Image Caddy non-root, testée en local derrière le Caddy de bordure (`edge/`). Workflows CI,
build/publish manuel, déploiement manuel. Dokku, Express, Bootstrap, Material et FontAwesome
retirés.

---

## En cours

<!--
Tenue de cette section, relue avant chaque modification : état présent seulement (l'historique
est dans git et dans « Terminé ») ; « Reprise » 15 lignes au plus avec une « Prochaine action »
exécutable telle quelle ; un fait, une place (statut dans le ticket, chiffres dans « Contrôle »).
-->

### Reprise

| Champ | Valeur |
|---|---|
| Mis à jour | 2026-11-05 |
| Dernière tâche terminée | kit agents : secrets (settings + hook), `check.ps1`, relecteur sans shell, `/feature` réécrit |
| Tâche en cours | aucune — CV-03 attend l'exécution du script par l'utilisateur |
| Prochaine action | Utilisateur : exécuter `edge/bootstrap-vps.sh` corrigé sur le VPS réinstallé (procédure en tête du script), puis DNS et `/srv/edge` (CV-03). Claude : CV-04 dès que `cv.data.ts` est rempli |
| Contrôle | `check.ps1` 2026-11-05 : build, lint, test à 0 ; Vitest 2 fichiers / 6 tests ; shellcheck `edge/bootstrap-vps.sh` à 0 |
| Livré, non déployé | CV-01 (migration, image Caddy, workflows, `edge/`), style provisoire SCSS (accent `#36648b`, feuille A4), icônes SVG inline ; `edge/bootstrap-vps.sh` prêt, jamais exécuté |
| Attend l'utilisateur | 1. merger `claude` → `dev` → `master` ; 2. CV-02 (réglages GitHub, secrets, clé de déploiement) ; 3. VPS en Ubuntu 24.04 puis CV-03 ensemble ; 4. CV-04, contenu |
