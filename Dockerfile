# CV — build dans l'image, servi en statique par Caddy.

# --- build -------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- pdf ---------------------------------------------------------------------
# Imprime chaque page prérendue en PDF (`npm run pdf`). Debian plutôt qu'Alpine : le paquet
# `chromium` y suit les correctifs de sécurité de la version stable. Chromium et Node restent
# dans cette étape : l'image finale n'en reçoit que les PDF.
FROM node:22-trixie-slim AS pdf
WORKDIR /app

# Pile `--sans` de `src/styles.scss` : system-ui, Segoe UI, Roboto. Roboto, seule des trois
# empaquetée par Debian, devient la police par défaut (`pdf-fonts.conf`) ; sans elle, la mise
# en page et le nombre de pages dépendraient de DejaVu, tirée par fontconfig.
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-roboto-unhinted \
  && rm -rf /var/lib/apt/lists/*
COPY scripts/pdf-fonts.conf /etc/fonts/local.conf

COPY package.json ./
COPY scripts ./scripts
COPY --from=build /app/dist ./dist

# Le sandbox de Chromium ne démarre pas dans un conteneur de build, en root comme en
# utilisateur (pas d'espaces de noms utilisateur) : d'où PDF_NO_SANDBOX, voir le script.
RUN PDF_NO_SANDBOX=1 npm run pdf

# --- runtime -----------------------------------------------------------------
FROM caddy:2-alpine AS runtime

COPY Caddyfile /etc/caddy/Caddyfile

# `outputMode: static` écrit les pages prérendues sous dist/<projet>/browser ; l'étape `pdf`
# y ajoute pdf/.
COPY --from=pdf /app/dist/cv/browser /srv

# Caddy écrit son état dans /data et /config, propriétés de root dans l'image
# officielle : sans ce chown, le démarrage en uid 1000 échoue.
RUN chown -R 1000:1000 /data /config

# Le binaire officiel porte la capacité de fichier cap_net_bind_service : sous
# `cap_drop: ALL`, le noyau refuse alors de l'exécuter. Sur 8080, elle ne sert
# à rien.
RUN setcap -r /usr/bin/caddy

USER 1000:1000

EXPOSE 8080

# GET explicite (-O /dev/null) : --spider enverrait un HEAD.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget","-q","-O","/dev/null","http://127.0.0.1:8080/"]
