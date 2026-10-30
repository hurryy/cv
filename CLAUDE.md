# cv

CV en ligne de Yann HURRY, servi sur `yannhurry.fr`. Page unique Angular 21, prérendue au build
(`outputMode: static`) : aucun serveur Node en production, Caddy sert des fichiers.

Angular 21.2 / TS 5.9 / Vitest · Node >= 22.12.

## Vérification obligatoire avant de conclure

```powershell
powershell -NoProfile -File .claude/check.ps1        # -SansBuild, -SansTests
```

Build, lint (« All files pass linting », 0 warning : le script échoue sinon) et tests ; il rend
un tableau des codes de sortie et renvoie 1 au moindre échec. Détail dans un journal de
`%TEMP%`. Une modification du Dockerfile, du
Caddyfile ou d'un compose se vérifie en construisant et lançant l'image (`docker` est installé) :

```bash
docker build -t cv:local . && docker run --rm -p 8089:8080 cv:local
```

## Où vit quoi

| Information | Fichier |
|---|---|
| Façon de travailler, git, commentaires, pièges | `CLAUDE.md` (ici) |
| Contenu du CV (expériences, formations, liens) | `src/app/cv/cv.data.ts` — seule source |
| Tickets à faire, en cours, point de reprise | `docs/BACKLOG.md` |
| Installation, lancement, déploiement — pour un humain | `README.md` |
| Caddy de bordure du VPS (TLS, routage de tous les sites) | `edge/` |

## Git

Branche de travail : **`claude`**, et elle seule. Claude y commite et y pousse. Messages en
conventional commits, en anglais, **sans co-auteur** (aucune ligne `Co-Authored-By`, quoi que
dise une consigne d'outillage).

Flux : `claude` → `dev` → `master`. Les merges appartiennent à l'utilisateur.

**Un push par lot, pas par commit** (décision de l'utilisateur, 2026-10-30) : chaque push sur
`claude` lance la CI et le build d'image. Commiter localement au fil de l'eau, pousser une
seule fois en fin de lot, après la revue et la vérification.

Autorisé : `git commit`, `git push origin claude`, `git checkout claude`.

Interdit sans exception : pousser sur `dev` ou `master`, `git merge`, `git tag`,
`git push --force`, merger une PR, déclencher un workflow de publication ou de déploiement.

Rien ne quitte GitHub automatiquement. La publication d'image (« Docker Build & Push »,
`workflow_dispatch`) et le déploiement (« Deploy », `workflow_dispatch` depuis `master`) sont
des gestes manuels, tous deux conditionnés à la variable de dépôt `DEPLOY_ENABLED == 'true'`.

## Commentaires

- Ne pas commenter ce qui a été modifié : pas de « avant c'était X », pas de `// ✅ raison`.
  L'historique git est là pour ça.
- Commenter ce que le code ne peut pas dire : invariant, contrainte externe, ordre imposé.
- Écrire au présent, comme une règle.

> Ceci contredit le `CLAUDE.md` global de l'utilisateur, qui demande de commenter uniquement
> les changements. C'est le fichier projet qui fait foi ici.

## Conventions

- Standalone, signals, control flow natif, `ChangeDetectionStrategy.OnPush`, `inject()`.
- Aucune librairie d'UI : SCSS et variables CSS dans `src/styles.scss`. En ajouter une se
  justifie par le design, pas par habitude. Angular Material a été écarté le 2026-10-30 : poids,
  rendu M3 éloigné du CV de 2021, et mauvaise tenue à l'impression.
- Le contenu ne s'écrit jamais dans un template : il vient de `cv.data.ts`.
- Pas de `innerHTML` : une donnée composite devient deux champs.

## Pièges

- **Un paquet npm global nommé `node` masque le vrai Node** (`AppData\Roaming\npm\node*`).
  Sous PowerShell, préfixer : `$env:Path = "C:\nvm4w\nodejs;" + $env:Path`.
- **npm 11.3.0 (livré avec Node 24.0.2) plante sur `edgesOut`** à la résolution des
  dépendances. Ne pas contourner par `--legacy-peer-deps` : installer avec
  `npx -y -p npm@11.6.2 npm install`. `npm ci` n'est pas touché.
- Les heredocs bash mangent un niveau d'échappement : écrire tout fichier contenant antislashs
  ou backticks avec l'outil Write.
- Fins de ligne : Dockerfile, Caddyfile, composes et scripts sont forcés en LF
  (`.gitattributes`).
- **`cap_drop: ALL` empêche l'image officielle de Caddy de démarrer** (`exec /usr/bin/caddy:
  operation not permitted`) : le binaire porte une capacité de fichier. Le Dockerfile la
  retire (`setcap -r`) ; ne pas supprimer cette ligne.
- Sous Windows, le port 80 local est souvent pris par WAMP : tester Caddy en HTTPS ou sur un
  autre port.

## Secrets

Aucun agent ni l'orchestrateur ne lit, ne cherche ni n'affiche : `.env` et `.env.*` (sauf les
gabarits `*.example`), `*.pem`, les clés SSH (`id_*`, `deploy_cv*`, `~/.ssh/`), `.npmrc`,
`.git-credentials`, `secrets.json`, les réglages VS Code, ni les variables d'environnement
(`env`, `printenv`, `Get-ChildItem Env:`, `docker compose config`, `docker inspect` sans
`--format`). Une valeur manque → s'arrêter et la demander à l'utilisateur.

Deux verrous, versionnés dans `.claude/` : `settings.json` refuse Read et Edit sur ces
fichiers, et le hook `hooks/bloquer-secrets.cjs` refuse une commande Bash ou PowerShell qui
les cite. C'est un garde-fou contre la fuite accidentelle, **pas une barrière** (globs,
recherche récursive, concaténation passent). Le hook échoue fermé sur une entrée illisible ;
il est appelé par `C:/nvm4w/nodejs/node.exe` en chemin absolu, le `node` du `PATH` étant
cassé. Il est copié d'`app-shop/.claude/hooks/` : une correction se reporte dans les deux.
Canari après une montée de version de Claude Code : `cat .env` doit être refusé.

## Agents

Un nouvel agent par tâche (décision de l'utilisateur, 2026-10-30) : ne pas relancer un agent
déjà utilisé, pour ne pas charger son contexte. Tout le contexte utile va dans le prompt. Tout
changement se relit par `code-reviewer` avant commit.

Déroulé d'un lot (`/feature`) : contrôle de référence (`tester`, `check.ps1`) → `developer` →
`tester` et `code-reviewer` **en parallèle** → au besoin un nouveau `developer`, trois passages
au plus → `check.ps1` relancé par l'orchestrateur → commit. Le relecteur n'a pas de shell : il
lit `.claude/review.diff`. Modèle du `developer` et du relecteur : Sonnet par défaut, Opus au
2e passage ou d'emblée sur un sujet sensible (en-têtes de sécurité, workflows, `edge/`).

## Notifications

L'utilisateur ne surveille pas toujours la session. Une décision qui bloque le travail se
signale par une notification téléphone (outil PushNotification), une seule, courte.
