FROM caddy:2.10.0-alpine

RUN apk add curl

HEALTHCHECK \
    --interval=60s \
    --timeout=10s \
    --start-period=60s \
    --retries=10 \
    CMD curl -f http://localhost:8888/ || exit 1

EXPOSE 8888

COPY Caddyfile /etc/caddy/Caddyfile
