# cv

CV en ligne de Yann HURRY — Angular 21, prérendu en HTML statique, servi par Caddy.

## Développement

```bash
npm ci
npm start          # http://localhost:4200
npm run build      # dist/cv/browser
npm run lint
npm test -- --watch=false
```

Le contenu se modifie dans `src/app/cv/cv.data.ts`, et nulle part ailleurs.

## Image

```bash
docker build -t cv:local .
docker run --rm -p 8089:8080 cv:local   # http://localhost:8089
```

## Production

```
Internet ──▶ edge (Caddy, TLS, 80/443) ──réseau docker `edge`──▶ cv (Caddy statique, 8080)
```

Sur le VPS :

1. `/srv/edge` — `edge/docker-compose.yml`, `edge/conf/Caddyfile`, `.env` d'après
   `edge/.env.example`, puis `docker compose up -d`. Une seule fois par VPS.
2. `/srv/cv` — `.env` d'après `.env.prod.example`. Le compose y est copié par le déploiement.

GitHub Actions :

- **CI** — build, lint, tests à chaque push et PR.
- **Docker Build & Push** — construit l'image à chaque push ; la publie sur
  `ghcr.io/hurryy/cv` seulement en lancement manuel.
- **Deploy** — manuel, depuis `master` : pull de l'image et redémarrage sur le VPS. Entrée
  `tag` pour revenir à un `sha-…` antérieur.

Publication et déploiement exigent la variable de dépôt `DEPLOY_ENABLED=true`.
