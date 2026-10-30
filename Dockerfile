# CV — build dans l'image, servi en statique par Caddy.

# --- build -------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- runtime -----------------------------------------------------------------
FROM caddy:2-alpine AS runtime

COPY Caddyfile /etc/caddy/Caddyfile

# `outputMode: static` écrit les pages prérendues sous dist/<projet>/browser.
COPY --from=build /app/dist/cv/browser /srv

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
