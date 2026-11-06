# Backlog — cv

Source de vérité du travail à faire. Plan d'ensemble : CV d'abord (migration, chaîne de
livraison, contenu, design franco-suisse), app-shop ensuite.

Format d'un ticket : `## [ID] Titre`, `Statut`, critères d'acceptation en cases à cocher.

---

## À faire

## [CV-02] Réglages GitHub et premier passage de la CI

Statut : à faire — **utilisateur** (jeton `gh` en lecture seule)

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
- [ ] Données suisses (`personal` : photo, naissance, nationalité, permis, dispo, taux), niveau
      d'anglais (CECR), références sur demande. Une fois renseignées, elles partent dans le
      bundle JS servi aussi sous `/fr` : masquées à l'écran, pas absentes
- [ ] Compétences : CV-08 n'a mis que celles des expériences, plus C# et TypeScript

## [CV-05] Design et format franco-suisse

Statut : à faire — itératif avec l'utilisateur, après CV-04

À arbitrer : photo, en-tête (nationalité / permis, disponibilité, mobilité Annecy–Genève, taux
d'activité), langues au niveau CECR, références, 2 pages A4 max.

- [ ] Feuille `@media print` A4 : 2 pages, liens cliquables, aucun débordement
- [ ] PDF téléchargeable, généré depuis la même source
- [ ] Ouverture publique : retirer `import preview` du bloc CV dans `edge/conf/Caddyfile`

## [CV-07] Français / anglais, thème clair / sombre, PDF téléchargeables

Statut : fait le 2026-11-05, non déployé (routes `/` et `/en`, remplacées par CV-08)

Choix faits en autonomie (2026-11-05), à confirmer par l'utilisateur :
- Traduction à l'exécution, pas `@angular/localize` : une seule build, un seul jeu de données.
  Chaque texte traduisible de `cv.data.ts` est un `{ fr, en }` ; dates, URL, noms propres et
  stack restent uniques, donc rien ne diverge entre les deux langues.
- Deux routes prérendues : `/` (français) et `/en` (anglais) — un lien direct vers le CV
  anglais à donner à un recruteur. Le bouton FR/EN navigue entre les deux.
- Thème : `prefers-color-scheme` par défaut, bouton qui force clair ou sombre, mémorisé en
  `localStorage` (lecture et écriture protégées). Script inline dans `index.html` pour éviter
  le flash du mauvais thème. L'impression reste toujours claire.
- PDF : fichiers fournis par l'utilisateur dans `public/pdf/` ; le lien de la langue affichée
  n'apparaît que si `cv.data.ts` déclare le fichier. La génération depuis la source (CV-05)
  reste possible plus tard.

- [x] Modèle : type `Localized = { fr: string; en: string }` pour les textes traduisibles
- [x] Libellés d'interface (titres de section, boutons, « aujourd'hui » de la période) dans
      les deux langues, hors template
- [x] `/` et `/en` prérendus, `<html lang>`, `<title>` et meta description par langue,
      `hreflang` alternés
- [x] Caddyfile de l'image : `/en` sert `en/index.html`, pas l'index français
- [x] Bouton FR/EN et bouton de thème accessibles (libellé, `aria-pressed` ou équivalent)
- [x] Thème sombre par variables CSS, contraste AA ; impression claire
- [x] Lien PDF par langue, `download`, masqué si non déclaré
- [x] Tests : rendu des deux langues, bascule de thème, lien PDF absent / présent

## [CV-08] Styles au choix (liste déroulante)

Statut : fait le 2026-11-05, non déployé ; rendu mobile 360px et impression à vérifier par l'utilisateur dans un navigateur. Maquettes : https://claude.ai/artifact/VSC8wvwUfgEphZ9GTcVhuU

Demande de l'utilisateur (2026-11-05) : styles A, C et D (B abandonné). Format suisse par
défaut ; routes (choix de l'utilisateur, 2026-11-05) : `/ch` et `/fr` en français, `/ch/en` et `/fr/en` en anglais ; `/` et l'actuel `/en` redirigent (301) vers `/ch` et `/ch/en`. Format sur A et D seulement.

- [x] Format porté par la route (`data.format`), prérendu, hreflang et canonical cohérents. Suisse : photo, nationalité /
      permis, date de naissance ou âge, disponibilité, taux d'activité, langues CECR,
      « références sur demande ». France : sans ces mentions personnelles. A et D seulement,
      C ignore le réglage. Champs fournis par l'utilisateur, masqués tant qu'ils sont vides
- [x] Liste déroulante « Style » : Sobre (D, défaut, choix du 2026-11-05), Commentaires (A), Éditeur (C) ;
      libellés FR/EN ; `<select>` natif avec `<label>`
- [x] Style par défaut : une seule constante de configuration, changée par simple redéploiement
- [x] Choix mémorisé en `localStorage` (protégé), et `?style=` pour un lien direct
- [x] Un composant de mise en page par style, tous lisant `cv.data.ts` ; aucun texte en dur
- [x] Chaque style fonctionne en clair et en sombre (CV-07)
- [x] Impression : toujours le style Sobre, clair, A4, quel que soit le style affiché
- [x] Prérendu : style par défaut, sans flash au changement côté navigateur
- [x] Tests : changement de style, valeur `?style=` inconnue → défaut

## [CV-09] Deux styles, Commentaires + Éditeur, bascule `</>`

Statut : à faire — maquettes v2 **non validées**, encore à retravailler avec l'utilisateur
(avec le vrai contenu des PDF) ; aucun code avant validation.
Maquettes v2 : https://claude.ai/artifact/VSC8wvwUfgEphZ9GTcVhuU (Commentaires France,
Commentaires Suisse longue, accordéons — écarté —, Éditeur).

Décisions de l'utilisateur (2026-11-06) : on garde Commentaires (`/** */`) et Éditeur ; Sobre
(trop générique) et Terminal sont abandonnés. Pas d'accordéon : description longue directe en
format suisse (un accordéon fermé est vide dans le PDF). Une seule source, `cv.data.ts`, pour
les deux langues, les deux formats et les deux styles : pas de fichier par CV ni par thème.

Étape 1 — contenu (avant le code) : l'utilisateur dépose ses CV PDF perso et pro hors dépôt
(ex. `C:\Development\yannhurry.fr\backups\`) et donne les chemins. Claude en extrait
descriptions, réalisations, compétences et langues, puis remplit les maquettes. Données
personnelles : ne reprendre que ce que l'utilisateur autorise à publier (`cv.data.ts` est
public) ; adresse, téléphone, etc. seulement sur accord explicite.

- [ ] Style Commentaires, ordre : profil (ce que Yann cherche, sans répéter l'expérience
      actuelle), compétences en tags groupés, expériences, formations, langues
- [ ] Expériences : années seules (`2020 → aujourd'hui`, `2020`), stack en tags comme les
      compétences, `description` (2 lignes, partout)
- [ ] Format suisse : `achievements` (3 à 5 réalisations par poste, `/ch` seulement), situation
      (`personal`), « Références sur demande » ; 2 pages A4 au plus
- [ ] Formations : ville affichée
- [ ] Éditeur : un `export const` par section, une chaîne par entrée ; description et stack
      dans un `/** … @stack … */` au-dessus ; toujours généré depuis `cv.data.ts`
- [ ] Liste déroulante remplacée par un bouton `</>` (bascule Commentaires ↔ Éditeur,
      `aria-pressed`), mémorisé comme le style actuel ; `?style=` conservé
- [ ] Style par défaut et impression : Commentaires (clair, A4) ; layout Sobre supprimé
- [ ] Modèle : `description: Localized`, `achievements?: Localized[]` ; tests mis à jour
- [ ] PDF téléchargeables : les anciens ne correspondent plus, à refaire ou générer (CV-05)

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
| Mis à jour | 2026-11-06 |
| Dernière tâche terminée | CV-08 : styles Sobre (défaut, `DEFAULT_STYLE` de `cv.config.ts`), Commentaires, Éditeur ; routes `/ch` `/fr` `/ch/en` `/fr/en` |
| Tâche en cours | CV-09 (maquettes v2 à retravailler, non validées) ; CV-03 attend l'exécution du script par l'utilisateur |
| Prochaine action | Utilisateur : déposer ses CV PDF perso et pro hors dépôt et donner les chemins, dire quelles données personnelles peuvent être publiées. Claude : en extraire le contenu (CV-04), remplir les maquettes et les retravailler ensemble jusqu'à validation ; coder CV-09 seulement ensuite. Utilisateur, en parallèle : exécuter `edge/bootstrap-vps.sh` corrigé sur le VPS réinstallé (procédure en tête du script), puis DNS et `/srv/edge` (CV-03) |
| Contrôle | `check.ps1` 2026-11-05 : build, lint, test à 0 ; Vitest 5 fichiers / 62 tests ; image : `/` et `/en` 301, 4 routes 200, inconnu 302, asset absent 404 ; shellcheck `edge/bootstrap-vps.sh` à 0 |
| Livré, non déployé | CV-08 (styles, routes pays), CV-07 (FR/EN, thème, lien PDF), CV-01 (migration, image Caddy, workflows, `edge/`), style provisoire SCSS (accent `#36648b`, feuille A4), icônes SVG inline ; `edge/bootstrap-vps.sh` prêt, jamais exécuté |
| Attend l'utilisateur | 1. merger `claude` → `dev` → `master` ; 2. CV-02 (réglages GitHub, secrets, clé de déploiement) ; 3. VPS en Ubuntu 24.04 puis CV-03 ensemble ; 4. CV-04, contenu |
