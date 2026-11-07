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

## [CV-09] Mise en page unique « Bandeau et frise », bureau et mobile

Statut : fait le 2026-11-07 sur `claude`, non déployé — vu dans un navigateur (bureau clair et
sombre, mobile : barre collante, raccourcis, focus, Détails) ; aperçu d'impression et tenue
sur 2 pages A4 non vérifiés, à regarder par l'utilisateur (`/ch`, `/ch/en`).
Maquettes : https://claude.ai/artifact/5HzcUU8x9BBcQXgeSkep7p — retenues : « B · Bandeau et
frise — bureau » et « B mobile · En bref + barre collante ». Écartées : A (colonne latérale,
qui se vide à mi-page), B mobile avec burger.

Décisions de l'utilisateur (2026-11-07), qui remplacent celles du 2026-11-06 (Commentaires +
Éditeur, bascule `</>`) : une seule mise en page affichée, issue de Sobre. Commentaires et
Éditeur restent dans le code mais ne sont plus accessibles (ni liste déroulante, ni `?style=`).
Burger refusé : quatre entrées tiennent sur une ligne, un menu caché ajoute un tap et de la
gestion de focus pour rien. Pas de logos d'entreprise (marques protégées, rendu hétérogène).

Écarts assumés avec les maquettes : « Mis à jour en » vient de `Cv.updated` (date du contenu,
à avancer à chaque modification), pas du build, pour éviter un écart prérendu / hydratation ;
« En bref » est une liste `Cv.highlights`, chaque entrée vérifiée présente dans les compétences
par un test ; libellé « PDF » gardé dans la barre d'outils ; périodes en `04/2024`. Budget
`anyComponentStyle` relevé à 7 / 10 kB (`sobre.scss` ≈ 6,75 kB compilé). `rootMargin` de la
barre mesuré une fois au chargement (rotation ou zoom ensuite : soulignement un peu décalé).

- [x] Bandeau : photo (`/ch`), nom, titre, profil, ligne d'infos (lieu, année de naissance,
      nationalité et permis en `/ch`, langues), LinkedIn. Profil (choix de l'utilisateur, 2026-11-07 ; pas
      en recherche, donc aucun poste visé) :
      FR « J'ai commencé côté back-end, là où vivent les règles métier. J'ai ensuite pris
      Angular en main pour suivre une fonctionnalité de la base de données jusqu'à l'écran.
      Aujourd'hui, j'aime porter un produit de bout en bout. »
      EN « I started on the back end, where the business rules live. I then took up Angular to
      follow a feature from the database all the way to the screen. Today, I enjoy owning a
      product end to end. »
- [x] « En bref » sur mobile : 6 technologies clés (`highlights`, incluses dans les compétences)
- [x] Expériences en frise (période à gauche sur bureau, au-dessus sur mobile) ; ligne
      entreprise · lieu · secteur en italique ; résumé ; réalisations ; stack en étiquettes
      carrées, distinctes des pastilles de compétences
- [x] Colonne droite sur bureau : compétences en pastilles groupées, formation ; « Références
      sur demande » en `/ch`
- [x] Effet page (validé le 2026-11-07, maquette « B · grand écran, effet page + Détails ») :
      fond gris-bleu, feuille blanche de 1040 px avec ombre et liseré d'accent en haut ; barre
      d'outils hors feuille au-dessus (FR/EN, thème, « Télécharger le PDF ») ; « Mis à jour en
      <mois année> » sous la feuille (date du contenu, voir plus haut). Sous 1100 px : feuille
      pleine largeur, sans ombre ni marge
- [x] Mobile : barre de raccourcis collante (Expériences · Compétences · Formation, 44 px,
      section en cours soulignée, focus posé sur la section atteinte)
- [x] Bouton « Détails » sur chaque expérience, bureau et mobile, qui déplie en ligne
      (`<details>`, pas de popin : décision du 2026-11-07) le contexte du poste et les
      réalisations ; résumé et stack restent visibles. Contenu de détail tiré des PDF suisses,
      complété par l'utilisateur
- [x] Impression et PDF : tout déplié (`beforeprint` / `afterprint`, et `::details-content` en
      secours pour un Chrome headless) ; la page en ligne est la version courte, le PDF la
      version longue suisse, même source
- [x] Format suisse : `achievements` (`/ch` seulement) ; format France sans photo, infos
      personnelles, Détails ni références
- [x] Modèle : `profile`, `location`, `highlights`, `updated` ; par expérience `context`,
      `achievements`, `domains` ; contenu FR et EN tiré des PDF suisses
- [x] Sélecteur de style, `StyleService`, `?style=` retirés ; Commentaires et Éditeur restent
      dans `layouts/`, non rendus ; clair et sombre (CV-07)
- [ ] Impression A4 claire sur 2 pages au plus : à vérifier dans l'aperçu d'impression
- [x] Tests mis à jour : 6 fichiers / 88 tests
- [x] **Rappel à l'utilisateur, à la livraison** (fait le 2026-11-07, relecture en attente) : il relit et corrige lui-même dans
      `cv.data.ts` les réalisations (dont « envoi de courriels sur Amazon » chez N2JSoft et
      « coding game pour Deezer » chez Apollo) et les secteurs, déduits par Claude
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

Statut : fait le 2026-11-07 (doc et script relus deux fois) — `install-vps.ps1` jamais
exécuté contre un vrai VPS, à éprouver à la prochaine réinstallation ; reste le choix de
mise en ligne ci-dessous

- [x] `docs/VPS.md` : vulgarisation (ce qui tourne où, clés, comptes, jetons), installation
      pas à pas, GitHub, mise en ligne, configuration de bordure, vérifications, fichiers à
      envoyer, dépannage (tous les pièges du 2026-11-07, dont Build & Push sans publication
      et merge en rebase) ; lien depuis `README.md`
- [x] `edge/install-vps.ps1` : 10 étapes, reprise `-From`, bootstrap dans tmux, redémarrage
      vérifié par `boot_id`, DNS contrôlé avant Caddy, mot de passe de pré-ouverture par
      l'entrée standard (jamais en argument ni sur le PC), `.env` créés en 600
- [ ] Mineurs de relecture : avec `-From` > 1, IP et domaine non revalidés ; reprise
      `-From 7` sans recontrôle de l'AAAA
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
| Dernière tâche terminée | CV-09 : mise en page unique « Bandeau et frise » (bureau, mobile, effet page, Détails) ; avant, CV-10 |
| Tâche en cours | aucune |
| Prochaine action | Utilisateur : « Docker Build & Push » lancé à la main depuis `master` (job `publish` vert), puis « Deploy » — le Deploy de 13:20 a tiré de nouveau l'ancienne image ; recopier le Caddyfile et `caddy reload` (`docs/VPS.md` § 5) ; relire `/ch`. Puis PR `claude` → `dev` (merge commit) pour CV-10 et CV-09 |
| Contrôle | `check.ps1` 2026-11-07 : build, lint, test à 0 ; Vitest 6 fichiers / 88 tests ; rendu CV-09 vu dans un navigateur sauf l'impression |
| Livré, non déployé | CV-04, correctifs `edge/` (sur `master`, image non publiée) ; CV-10 et CV-09 (sur `claude`) |
| Attend l'utilisateur | relire dans `cv.data.ts` contextes, réalisations et secteurs de CV-09 (déduits par Claude) ; aperçu d'impression `/ch` ; points ouverts de CV-04 (M1, dates) ; choix de mise en ligne de CV-10 |
