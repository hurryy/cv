# Mise en production du CV

Préparé le 2026-11-19. Ce document dit dans quel ordre mettre en ligne ce qui est sur
`claude`, puis ouvrir le site au public. Les commandes de détail restent dans `docs/VPS.md` ;
ce fichier y renvoie par numéro de paragraphe.

## État constaté le 2026-11-19

| Élément | État |
|---|---|
| Production | image `ghcr.io/hurryy/cv:latest` du merge `97889e1` (PR #6), publiée le 2026-11-07 à 13:27, déployée à 13:29 (`Container cv-cv-1 Recreated`) |
| `claude` | 18 commits d'avance sur `origin/master`, dont 1 commit local non poussé (`7e0f827`, CV-11 ouvert) et ce document |
| Caddyfile de bordure | modifié sur `master` le 2026-11-07 (`54735e6`) ; rien ne prouve qu'il a été recopié sur le VPS |
| `edge/conf/sites/app-shop.caddy` | nouveau, non importé : sans effet tant qu'aucun `import` ne le cite (voir `app-shop/docs/MEP.md`) |

Le « Deploy qui a tiré l'ancienne image » date du 2026-11-07 à 13:20 (run `42376511209`), pas
du 2026-11-17 : il suivait un « Docker Build & Push » automatique, qui ne publie rien. Le
lancement manuel de 13:27 a corrigé. Le piège reste entier pour la prochaine version.

## 1. Valider ce qui est sur `claude`

Fait le 2026-11-19 : tu as relu l'image locale et validé les données du CV (`ea2a503`), puis
décidé l'ouverture publique sans relecture de la production sous mot de passe.

Dérouler `docs/RECETTE.md` sur une image locale. Les PDF ne sont générés que dans l'image :

```powershell
# PC, depuis C:\Development\yannhurry.fr\cv
docker build -t cv:local . ; if ($?) { docker run --rm -p 8090:8080 cv:local }
```

Puis `http://localhost:8090`. Un défaut devient un ticket ; on ne passe à l'étape 2 qu'avec
une recette sans défaut bloquant.

Avant la PR, `claude` doit être poussé (le commit `7e0f827` et ce document sont locaux) et la
CI verte dessus.

## 2. PR et merges (toi)

`docs/VPS.md` § 4.1 : `claude` → `dev`, puis `dev` → `master`, toujours en merge commit
(`gh pr merge <N> --merge`). Pièges connus :

- jamais `--squash`, `--rebase` ni `--admin` : les branches divergeraient (§ 8) ;
- un check `cv` annulé sur le commit de la PR bloque le merge même avec un autre run vert :
  relancer ce run (§ 4.4) ;
- le ruleset `26755649` exige le check `cv` vert ; 0 approbation.

## 3. Publier l'image depuis `master`

Le « Docker Build & Push » qui part seul au merge (événement `push`) construit sans publier.
Seul le lancement manuel depuis `master` publie (job `publish`).

```powershell
# PC
gh workflow run "Docker Build & Push" -R hurryy/cv --ref master
gh run list -R hurryy/cv --workflow "Docker Build & Push" --event workflow_dispatch --branch master --limit 1
gh run watch <id> -R hurryy/cv
```

Contrôle avant tout « Deploy » :

```powershell
# PC
gh run view <id> -R hurryy/cv --json headSha,jobs --jq '{headSha, jobs: [.jobs[] | {name, conclusion}]}'
git -C C:\Development\yannhurry.fr\cv fetch origin
git -C C:\Development\yannhurry.fr\cv rev-parse origin/master
```

Attendu : job `publish` en `success` (et `build` en `skipped`), `headSha` égal à
`origin/master`. Le tag publié est `sha-` suivi des 7 premiers caractères de ce `headSha` :
le noter, il sert à l'étape 4.

Si tu veux aussi le digest : GitHub → `hurryy/cv` → Packages → `cv` → la version taguée
`sha-xxxxxxx` doit porter aussi `latest` et dater de quelques minutes.

## 4. Déployer, puis recopier le Caddyfile de bordure

Déployer le tag `sha-` noté, pas `latest` : si la publication n'a pas eu lieu, le `pull` échoue,
`set -e` arrête tout et la production ne bouge pas, au lieu de « réussir » sans rien changer.

```powershell
# PC
gh workflow run Deploy -R hurryy/cv --ref master -f tag=sha-xxxxxxx
```

Approuver : GitHub → Actions → run « Deploy » → Review deployments → `production` → Approve
and deploy.

Contrôle :

```powershell
# PC
gh run view <id> -R hurryy/cv --log | Select-String "Recreated|Running"
ssh deploy@51.83.79.249 "docker inspect --format '{{.Config.Image}}' cv-cv-1"
```

Attendu : `Container cv-cv-1 Recreated` (pas seulement `Running`) et
`ghcr.io/hurryy/cv:sha-xxxxxxx`.

Puis la configuration de bordure (`docs/VPS.md` § 5). Le fichier recopié doit être celui de
`master` : vérifier d'abord que l'arbre local n'en diffère pas (sortie vide attendue).

```powershell
# PC
git -C C:\Development\yannhurry.fr\cv fetch origin
git -C C:\Development\yannhurry.fr\cv diff origin/master -- edge/conf/Caddyfile
scp C:\Development\yannhurry.fr\cv\edge\conf\Caddyfile deploy@51.83.79.249:/srv/edge/conf/Caddyfile
ssh deploy@51.83.79.249 "cd /srv/edge && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile"
```

Si `reload` répond « permission denied » : `chmod 755 /srv/edge/conf` en `deploy` (§ 5).

Ce Caddyfile ouvre le CV au public (étape 7) : ne le recopier qu'une fois le Deploy contrôlé,
sinon l'ancienne image devient publique.

Contrôle : `curl.exe -sI https://yannhurry.fr` rend `200` avec `strict-transport-security` et
`x-frame-options: DENY`, sans `x-robots-tag`.

## 5. Choix de mise en ligne (CV-10) : à trancher par toi

L'oubli du 2026-11-07 vient d'une suite de gestes manuels sans contrôle entre eux. Deux façons
de la fermer.

Script `release.ps1` sur le PC, avec ta session `gh` :
- pour : enchaîne PR, attente de la CI, merge, publication, contrôle du job `publish` et du
  `headSha`, Deploy avec le tag `sha-` ; ne touche à aucun workflow, donc la règle « rien ne
  quitte GitHub automatiquement » tient ;
- contre : un script de plus à maintenir (PowerShell 5.1, sorties de `gh`), qui ne tourne que
  depuis ce PC ; rien n'empêche de lancer les workflows à la main en le contournant.

Workflow déclenché sur `master`, avec approbation :
- pour : publication et déploiement du bon SHA garantis par GitHub, sans dépendre du PC ;
  l'approbation de l'environment `production` reste le point d'arrêt ;
- contre : revient sur la décision du 2026-10-30 (aucune sortie automatique) ; un merge sur
  `master` lance une chaîne dont le seul frein est un clic d'approbation ; `workflow_run`
  échoue en silence si un nom de workflow change.

Mon avis, à contester : le script, parce qu'il garde la décision existante et que le Deploy par
tag `sha-` de l'étape 4 ferme déjà l'essentiel du risque.

## 6. Ouverture publique (CV-05)

Décidée par toi le 2026-11-19 et faite sur `claude` : le bloc `{$CV_DOMAIN}` de
`edge/conf/Caddyfile` n'importe plus `preview`. Le mot de passe et l'en-tête
`X-Robots-Tag: noindex, nofollow` partent ensemble ; le snippet `(preview)` reste pour
app-shop. `PREVIEW_USER` et `PREVIEW_HASH` restent exigés par `edge/docker-compose.yml` :
les laisser dans `/srv/edge/.env`. `docs/VPS.md` § 6 et l'étape 9 de `edge/install-vps.ps1`
attendent désormais `200` sans `noindex`.

Le site s'ouvre au moment où ce Caddyfile est recopié sur le VPS (étape 4), donc après le
Deploy de la nouvelle image. Aucun `robots.txt` ni sitemap dans l'image : sans gravité.

Contrôle :

```powershell
# PC
curl.exe -sI https://yannhurry.fr/
```

Attendu : `200`, pas de `x-robots-tag`, `strict-transport-security` présent. `www` toujours en
`301`, `http` en `308`.

## 7. CV-11 (CV suisse à la racine)

Développé le 2026-11-19, sur `claude` : il part dans la même PR que le reste. Le CV suisse est à
`/` et `/en` ; `/ch` redirige en 301, `/fr` en 302 (France masquée pour l'instant, rouverte
par `FRANCE_FORMAT_PUBLISHED` dans `src/app/cv/cv-formats.ts`). Contrôle après déploiement :
`curl.exe -sI https://yannhurry.fr/ch` rend `301` vers `/`, `/fr` rend `302`.

## Actions utilisateur

1. Poste local : vérifier que `claude` est poussé. Contrôle : `git -C
   C:\Development\yannhurry.fr\cv status` sans « ahead », CI `cv` verte
   (`gh run list -R hurryy/cv --branch claude --limit 2`).
2. GitHub (`gh`) : PR `claude` → `dev` puis `dev` → `master`, merge commit (étape 2,
   `docs/VPS.md` § 4.1). Contrôle : `git -C C:\Development\yannhurry.fr\cv fetch origin ; git
   -C C:\Development\yannhurry.fr\cv log origin/master --oneline -1` montre « Merge pull
   request … from hurryy/dev ».
3. GitHub (`gh`) : `gh workflow run "Docker Build & Push" -R hurryy/cv --ref master`
   (étape 3). Contrôle : `gh run view <id> -R hurryy/cv --json headSha,jobs` donne `publish`
   en `success` et `headSha` = `origin/master`. Noter `sha-` + 7 caractères.
4. GitHub (`gh`) : `gh workflow run Deploy -R hurryy/cv --ref master -f tag=sha-xxxxxxx`, puis
   Approve and deploy dans Actions. Contrôle : log `Recreated` et
   `ssh deploy@51.83.79.249 "docker inspect --format '{{.Config.Image}}' cv-cv-1"` donne le
   tag `sha-xxxxxxx`. **Ne pas passer à l'action 5 avant ce contrôle** : elle ouvre le site.
5. Poste local puis VPS : vérifier que `edge/conf/Caddyfile` ne diffère pas
   d'`origin/master`, le recopier et `caddy reload` (étape 4). Contrôle : `curl.exe -sI
   https://yannhurry.fr/` rend `200` sans `x-robots-tag`, avec `x-frame-options: DENY` ;
   `/ch` rend `301`, `/fr` `302`.
6. Navigateur : relire `https://yannhurry.fr/` et `/en`, les deux PDF CH compris.
7. Plus tard, poste local : trancher CV-10 (étape 5). Contrôle : la décision est écrite dans
   CV-10 de `docs/BACKLOG.md`.
