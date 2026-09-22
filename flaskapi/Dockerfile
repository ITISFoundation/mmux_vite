FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

RUN apt update && apt install -y \
  curl \
  git \
  make

EXPOSE 5000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD curl -f http://localhost:5000/flask/deployment/health || exit 1

WORKDIR /app

COPY . .

RUN make install-flaskapi-deps

ENTRYPOINT ["./entrypoint.sh"]
