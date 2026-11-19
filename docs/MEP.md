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

Rien de ce qui est sur `claude` n'a été relu par toi : CV-09 (mise en page), CV-05 (PDF,
Partager), retrait de la date, textes reformulés, CV-10 (script VPS).

Dérouler `docs/RECETTE.md` sur une image locale. Les PDF ne sont générés que dans l'image :

```powershell
# PC, depuis C:\Development\yannhurry.fr\cv
docker build -t cv:local . ; if ($?) { docker run --rm -p 8089:8080 cv:local }
```

Puis `http://localhost:8089`. Un défaut devient un ticket ; on ne passe à l'étape 2 qu'avec
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

Contrôle : `curl.exe -sI https://yannhurry.fr` rend `401` avec `strict-transport-security`,
`x-frame-options: DENY` et `x-robots-tag: noindex, nofollow`. `Server: Caddy` peut rester sur
ce 401 (mineur connu, CV-10).

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

## 6. Nouveau mot de passe de pré-ouverture (toi)

Inutile si tu ouvres le site au public dans la même session (étape 7) : le mot de passe ne
sert qu'à relire la production avant l'ouverture.

Le hash se calcule sur le VPS, en interactif (Caddy le demande deux fois sans l'afficher). Ne
pas utiliser `--plaintext` proposé par `edge/.env.example` : le mot de passe resterait dans
l'historique du shell.

```bash
# VPS (deploy), après ssh -t deploy@51.83.79.249
docker run --rm -it caddy:2-alpine caddy hash-password
nano /srv/edge/.env
```

Remplacer la seule ligne `PREVIEW_HASH=` par le nouveau hash, chaque `$` doublé (`$$`). Le
nom d'utilisateur est sur la ligne `PREVIEW_USER=` du même fichier. Une variable du `.env`
demande un redémarrage, pas un reload (`docs/VPS.md` § 5) :

```bash
# VPS (deploy)
grep -c '^PREVIEW_HASH=\$\$2' /srv/edge/.env
cd /srv/edge && docker compose up -d
```

Attendu : `1` (le hash commence bien par `$$2`, sans afficher la valeur), puis le conteneur
`edge-caddy-1` recréé.

Contrôle depuis le PC : `curl.exe -sI -u <nom> https://yannhurry.fr` (curl demande le mot de
passe) rend `200` ; un mauvais mot de passe rend `401`.

## 7. Ouverture publique (CV-05)

Où : `edge/conf/Caddyfile`, bloc `{$CV_DOMAIN}`. Quoi : retirer la ligne `import preview`.
Le `basic_auth` et l'en-tête `X-Robots-Tag: noindex, nofollow` partent ensemble, ils ne
vivent que dans ce snippet. Garder le snippet `(preview)` : il servira à app-shop.

Le changement passe par le dépôt (commit sur `claude`, PR, `master`), puis la recopie de
l'étape 4. Le reste à ajuster dans le même lot :
- `docs/VPS.md` § 6 et l'étape 9 de `edge/install-vps.ps1` attendent `401` et `noindex` :
  après l'ouverture, ils signaleraient un défaut à tort ;
- `PREVIEW_USER` et `PREVIEW_HASH` restent exigés par `edge/docker-compose.yml` (`:?`) : les
  laisser dans `/srv/edge/.env`, ou les rendre facultatifs dans le même lot ;
- aucun `robots.txt` ni sitemap dans l'image : sans gravité, à décider avec CV-11.

Contrôle :

```powershell
# PC
curl.exe -sI https://yannhurry.fr/
```

Attendu : `200`, pas de `x-robots-tag`, `strict-transport-security` présent. `www` toujours en
`301`, `http` en `308`.

## 8. CV-11 (CV suisse à la racine)

Développé le 2026-11-19, sur `claude` : il part dans la même PR que le reste. Le CV suisse est à
`/` et `/en` ; `/ch` redirige en 301, `/fr` en 302 (France masquée pour l'instant, rouverte
par `FRANCE_FORMAT_PUBLISHED` dans `src/app/cv/cv-formats.ts`). Contrôle après déploiement :
`curl.exe -sI -u <nom> https://yannhurry.fr/ch` rend `301` vers `/`, `/fr` rend `302`.

## Actions utilisateur

1. Poste local : pousser `claude` (`git -C C:\Development\yannhurry.fr\cv push origin
   claude`, ou le demander à Claude). Contrôle : `git status` sans « ahead », CI `cv` verte
   (`gh run list -R hurryy/cv --branch claude --limit 2`).
2. Poste local : recette de l'étape 1 (`docs/RECETTE.md`, image `cv:local`). Contrôle : toutes
   les cases cochées ou un ticket par défaut.
3. Poste local : trancher CV-10 (étape 5) et la date d'ouverture (avec ou sans CV-11).
   Contrôle : la décision est écrite dans CV-10 de `docs/BACKLOG.md`.
4. GitHub (`gh`) : PR `claude` → `dev` puis `dev` → `master`, merge commit (`docs/VPS.md`
   § 4.1). Contrôle : `git -C C:\Development\yannhurry.fr\cv fetch origin ; git -C
   C:\Development\yannhurry.fr\cv log origin/master --oneline -1` montre « Merge pull request
   … from hurryy/dev ».
5. GitHub (`gh`) : `gh workflow run "Docker Build & Push" -R hurryy/cv --ref master`.
   Contrôle : `gh run view <id> -R hurryy/cv --json headSha,jobs` donne `publish` en
   `success` et `headSha` = `origin/master`. Noter `sha-` + 7 caractères.
6. GitHub (`gh`) : `gh workflow run Deploy -R hurryy/cv --ref master -f tag=sha-xxxxxxx`, puis
   Approve and deploy dans Actions. Contrôle : log `Recreated` et
   `ssh deploy@51.83.79.249 "docker inspect --format '{{.Config.Image}}' cv-cv-1"` donne le
   tag `sha-xxxxxxx`.
7. Poste local puis VPS : vérifier que `edge/conf/Caddyfile` ne diffère pas
   d'`origin/master`, le recopier et `caddy reload` (étape 4).
   Contrôle : `curl.exe -sI https://yannhurry.fr` rend `401`, `x-frame-options: DENY`,
   `x-robots-tag: noindex, nofollow`.
8. VPS (deploy), seulement si tu relis la production avant ouverture : nouveau hash
   (étape 6), `docker compose up -d` dans `/srv/edge`. Contrôle : `curl.exe -sI -u <nom>
   https://yannhurry.fr` rend `200`.
9. Relire `https://yannhurry.fr/` et `/en` en production, les deux PDF CH compris.
10. Ouverture : demander à Claude le lot « retirer `import preview` » (étape 7), le merger
    jusqu'à `master`, puis refaire l'action 7. Contrôle : `curl.exe -sI
    https://yannhurry.fr/` rend `200` sans `x-robots-tag`.
