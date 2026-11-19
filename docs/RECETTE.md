# Recette — cv

Liste pour la session de test manuel de tout ce qui est sur `claude` et n'a pas été validé.
Préparée le 2026-11-17. Cocher au fil du test ; un défaut devient un ticket dans
`docs/BACKLOG.md`.

## Préparer

Depuis `cv/`, construire et lancer l'image locale (les PDF ne sont générés que dans l'image) :

```bash
docker build -t cv:local . && docker run --rm -p 8089:8080 cv:local
```

Ouvrir `http://localhost:8089`. Le premier build est long (cache Docker vidé).

## CV-09 — Mise en page « Bandeau et frise »

- [ ] `/ch` et `/fr` redirigent vers `/`, `/ch/en` et `/fr/en` vers `/en` (`/ch` en 301, `/fr` en 302, CV-11).
- [ ] Bureau, `/` : feuille blanche centrée sur fond gris-bleu, liseré d'accent en haut,
      barre d'outils au-dessus (FR/EN, thème, « Télécharger le PDF »).
- [ ] Bandeau : photo, nom, titre, profil, ligne d'infos (lieu, année de naissance,
      nationalité, permis, langues), LinkedIn.
- [ ] Expériences en frise, période à gauche ; « Détails » déplie contexte et réalisations
      en ligne, sans popin.
- [ ] Colonne droite : compétences en pastilles, formation, « Références sur demande ».
- [ ] Fenêtre réduite sous 1100 px : feuille pleine largeur, sans ombre.
- [ ] Mobile (outils de développement, 360 px) : « En bref » avec 6 technologies, barre de
      raccourcis collante (Expériences · Compétences · Formation) ; la section en cours est
      soulignée en défilant ; un tap sur un raccourci y amène.
- [ ] Thème sombre (bouton) : contraste correct partout, choix gardé après rechargement.
- [ ] FR/EN : tous les textes changent, l'URL suit (`/en`).
- Prouverait un défaut : texte en dur non traduit, débordement horizontal sur mobile,
  soulignement de la barre décalé de plus d'une section.

## CV-05 — PDF et bouton « Partager »

- [ ] « Télécharger le PDF » sur `/` et `/en` : 2 fichiers différents (format suisse ;
      France masqué par CV-11), nommés par nom et langue, 2 pages, liens cliquables, police Roboto.
- [ ] Le PDF suisse est la version longue (tout déplié), sans date de mise à jour.
- [ ] Aperçu d'impression du navigateur (Ctrl+P) : clair même en thème sombre, A4, 2 pages
      au plus, tout déplié.
- [ ] « Partager » : sur téléphone, feuille de partage du système ; sur bureau sans
      `navigator.share`, ouverture d'un courriel avec le lien.

## CV-04 — Contenu

- [ ] Relire dans `src/app/cv/cv.data.ts` (ou à l'écran) les contextes, réalisations et
      secteurs de chaque expérience, déduits puis reformulés par Claude ; en particulier
      « envoi de courriels sur Amazon » (N2JSoft) et « coding game pour Deezer » (Apollo).
- [ ] Trancher : M1 MIAGE 2016–2018 (seul le semestre de Linköping est publié) ; DUT 2013
      ou 2014 ; N2JSoft février ou mars 2022 ; Apollo jusqu'en 2020-11 ; Cognizant à
      Grenoble dès 2018-03.

## CV-10 — Script d'installation du VPS (reprise `-From`)

Sans VPS, seulement les refus en tête (adresse de documentation, non routable) :

- [ ] `powershell -NoProfile -File edge/install-vps.ps1 -Ip 51.83.249 -From 5` : refus
      « Adresse IPv4 invalide », aucune étape jouée.
- [ ] `... -Ip 192.0.2.1 -Domain https://x.fr -From 7` : refus « Domaine invalide ».
- [ ] À la prochaine réinstallation réelle : reprise `-From 7` avec une AAAA qui ne pointe
      pas sur le VPS → arrêt avant le démarrage de Caddy et renvoi vers `-From 6`.

## Hors recette, attend une décision

Mise en ligne (`release.ps1` ou workflow), dépôt d'infra pour `edge/` (CV-06), publication et déploiement des images.
