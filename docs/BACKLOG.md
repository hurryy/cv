# Backlog — cv

Source de vérité du travail à faire. Plan d'ensemble : CV d'abord (migration, chaîne de
livraison, contenu, design franco-suisse), app-shop ensuite.

Format d'un ticket : `## [ID] Titre`, `Statut`, critères d'acceptation en cases à cocher.

---

## À faire

## [CV-04] Contenu à jour

Statut : fait le 2026-11-07, non déployé — à relire par l'utilisateur sur `/ch` et `/ch/en`

Sources hors dépôt (`C:\Development\Resources\CV\`, jamais copiées dans `cv/`) : CV Suisse
FR/EN (source de vérité), brouillon SQLI (mission SIG seulement ; ses ajouts non étayés
ailleurs écartés). Décisions de l'utilisateur (2026-11-07) : client SIG nommé ; publiés :
photo, année de naissance, nationalité, permis G ; anglais B2 ; stages GFI et Boondooa omis ;
adresse, téléphone, date complète et permis de conduire jamais.

- [x] `src/app/cv/cv.data.ts` : 5 expériences (SQLI · SIG, N2JSoft, OnCloud, Apollo,
      Cognizant), 4 formations, compétences en 5 groupes, français natif et anglais B2
- [x] `personal` : photo `public/img/yann-hurry.jpg` (400×400, sans EXIF), `birthYear`
      (remplace `birthDate` : un âge prérendu vieillirait entre deux builds), nationalité,
      permis, références sur demande. Elles partent dans le bundle JS servi aussi sous
      `/fr` : masquées à l'écran, pas absentes
- [ ] À trancher par l'utilisateur : M1 MIAGE 2016–2018 (seul le semestre ERASMUS de
      Linköping est publié) ; dates divergentes entre sources (DUT 2013 ou 2014, N2JSoft
      février ou mars 2022 : retenus 2013-09 et 2022-03)
- [x] `location` en `Localized` (« Vernier, Suisse » / « Vernier, Switzerland ») ; la stack
      reste unique, en forme anglaise standard (« REST API »)
- [ ] À valider par l'utilisateur, faits repris des PDF : Apollo jusqu'en 2020-11 (mois où
      OnCloud commence), Cognizant à Grenoble dès 2018-03

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

À arbitrer avec l'utilisateur : comment présenter une expérience en SSII, en régie chez un
client (employeur et client, une ou plusieurs missions sous un même employeur, nom du client
publiable ou non) — impacte le modèle (`Experience`), les deux styles et l'éditeur.
Lié : secteurs métier par expérience (ex. RH, Congés, Énergie), champ `domains: Localized[]` ;
en régie, secteur du client, donc par mission. Affichage à maquetter sans ajouter un 3e type
de tag identique aux compétences et à la stack (texte sur la ligne entreprise, ou tag contour).

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

- [ ] En-têtes : le snippet `(hardening)` les pose avant `reverse_proxy` ; si l'amont
      d'app-shop (helmet) en envoie aussi, vérifier qu'ils ne se doublent pas
      (`X-Frame-Options: DENY, SAMEORIGIN`) et retirer l'un des deux (`header_down`)

## [CV-10] Doc et script d'installation du VPS

Statut : à faire — demandé le 2026-11-07, après la mise en service du VPS (CV-02, CV-03)

- [ ] `docs/VPS.md` : installation, vérification, configuration ; fichiers à envoyer pour
      une réinstallation ; commandes réellement utilisées le 2026-11-07
- [ ] Section « Vulgarisation » : ce qui a été fait, ce qui est configuré où, ce qui tourne
      où (PC, GitHub, GHCR, OVH DNS, VPS : Caddy de bordure, conteneur `cv`), les trois clés
      SSH (`id_rsa` perso, `deploy_cv` CI, clé d'hôte du VPS)
- [ ] Étapes GitHub : environment `production` et reviewer, secrets `SSH_*`, variables
      `DEPLOY_PATH` et `DEPLOY_ENABLED`, rulesets ; `gh auth login` de l'utilisateur pour
      écrire, `GH_TOKEN` en lecture seule pour Claude
- [ ] Script PowerShell depuis le PC qui enchaîne : clé perso sur `ubuntu`, envoi et
      lancement de `bootstrap-vps.sh`, `/srv/edge`, `/srv/cv`, vérifications ; secrets
      demandés à l'exécution, jamais écrits ; arrêts aux points de contrôle (DNS, accès SSH)
- [ ] Pièges rencontrés : mot de passe à changer à la 1re connexion (pas de TTY), clé d'hôte
      changée après réinstallation, séquences parasites de tmux, groupe `sudo` vide sur OVH,
      `conf/` illisible par Caddy (`cap_drop: ALL`), TXT `3|welcome` qui bloque le CNAME
      `www`, `ssh-keygen -lf -` et `Out-File` sous PowerShell 5.1
- [x] Correctifs du dépôt liés : `bootstrap-vps.sh` (`$SUDO_USER` admin, `conf` en 755),
      en-têtes de `hardening` absents des 401 de `basic_auth` (Caddyfile) — faits le
      2026-11-07 ; `Server: Caddy` reste sur les réponses d'erreur (mineur). Sur le VPS
      déjà installé : recopier le Caddyfile puis `caddy reload`
- [ ] Mise en ligne : script `release.ps1` (PR, build, deploy, sans toucher aux workflows)
      ou workflow déclenché sur `master` avec approbation — à trancher par l'utilisateur

À voir plus tard : fail2ban peut bannir l'IP de l'utilisateur pendant ses essais de connexion
(10 min) ; `ignoreip` éventuel.

---

## Terminé

## [CV-03] VPS OVH neuf

Fait le 2026-11-07 par l'utilisateur, guidé : OVH VPS 2020 Value 1-2-40, Ubuntu 24.04,
`51.83.79.249` / `2001:41d0:305:2100::485e`. `bootstrap-vps.sh` exécuté (deux défauts
découverts, corrigés dans le dépôt : CV-10) ; SSH durci, `deploy` et `ubuntu` par clé ; DNS
OVH A/AAAA racine et CNAME `www` ; `/srv/edge` démarré, certificats Let's Encrypt obtenus ;
`/srv/cv/.env`. Vérifié : `https://yannhurry.fr` 401 `noindex`, `www` 301, HTTP 308.

## [CV-02] Réglages GitHub et premier passage de la CI

Fait le 2026-11-07 par l'utilisateur (son `gh`, le jeton de Claude restant en lecture
seule) : environment `production` avec reviewer, secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY`,
`SSH_KNOWN_HOSTS`, variable `DEPLOY_PATH` d'environment, `DEPLOY_ENABLED=true` de dépôt,
ruleset `protect-master-dev` (PR, check `cv`, ni suppression ni force-push,
`require_extra_approval_for_unattributed_changes: false`), auto-merge désactivé. PR #2
(`claude` → `dev`) et #3 (`dev` → `master`) mergées ; « Docker Build & Push » puis
« Deploy » réussis : CV-07 et CV-08 déployés.

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
| Mis à jour | 2026-11-07 |
| Dernière tâche terminée | CV-04 (contenu réel, `birthYear`, photo) et correctifs `edge/` de CV-10 ; CV-02 et CV-03 : VPS en service, CV-08 déployé en pré-ouverture |
| Tâche en cours | CV-10 : `docs/VPS.md` et `edge/install-vps.ps1` |
| Prochaine action | Claude : CV-10. Utilisateur : PR `claude` → `dev` → `master`, « Docker Build & Push » puis « Deploy » ; sur le VPS, recopier `edge/conf/Caddyfile` dans `/srv/edge/conf/` et `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` ; relire le contenu sur `/ch` |
| Contrôle | `check.ps1` 2026-11-07 : build, lint, test à 0 ; Vitest 5 fichiers / 65 tests ; shellcheck `edge/bootstrap-vps.sh` à 0 ; Caddy local : 401 avec HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy` |
| Livré, non déployé | CV-04, correctifs `edge/` (script, Caddyfile) |
| Attend l'utilisateur | points ouverts de CV-04 (M1, dates) ; choix de mise en ligne de CV-10 ; maquettes CV-09 avec le vrai contenu |
