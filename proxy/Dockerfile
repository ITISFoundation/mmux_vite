FROM caddy:2.10.0-alpine

RUN apk add curl

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8888/ || exit 1

EXPOSE 8888

COPY Caddyfile /etc/caddy/Caddyfile
