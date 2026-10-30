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

Statut : à faire — préparation par Claude, exécution avec l'utilisateur

- [ ] Ubuntu LTS, utilisateur `deploy` par clé, root SSH coupé, `ufw` 22/80/443,
      `unattended-upgrades`, fail2ban
- [ ] Docker Engine + Compose ≥ 2.23
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

**Point de reprise au 2026-10-30.** CV-01 livré sur `claude`. Rien n'est déployé, rien n'est
mergé. Prochaine étape côté Claude : préparer CV-03 (script de durcissement du VPS) et la
réorganisation des dossiers `.claude` (racine commune + copie autonome par projet). Côté
utilisateur : CV-02, puis CV-04.
