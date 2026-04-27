# Live Debugging Guide

This note is for future Codex sessions working on the local MMUX stack, especially when debugging Playwright or live frontend/backend issues.

## Quick Start

On a clean worktree, make sure the Python helper repo and env vars exist:

```bash
cd flaskapi && make setup-mmux-python
cd ..
```

If in a worktree, the easiest local setup is:

```bash
ln -sf /home/ordonez/mmux/mmux_vite/.env .env
```

Start the read-only SUMO stack:

```bash
make run-develop-sumo-read
```

Basic checks:

```bash
curl -sf http://localhost:8888/
curl -sf http://localhost:8888/flask/deployment/health
python3 -m pytest tests/e2e/test_sumo_local.py -v --app-url http://localhost:8888
```

## What To Check First

When the app looks broken, separate the problem into one of these buckets:

1. Frontend serving/runtime issue
2. Backend/API issue
3. Live OSPARC data issue
4. Dakota/model-generation issue

Useful first commands:

```bash
docker compose --file docker-compose-development.yml ps
docker logs mmux_vite_playwright-mmux-vite-web-1 --tail 250
docker logs mmux_vite_playwright-mmux-vite-app-1 --tail 250
docker logs mmux_vite_playwright-mmux-vite-backend-1 --tail 250
```

Notes:

- `mmux-vite-web` tells you whether Vite/HMR/build is healthy.
- `mmux-vite-app` shows proxied browser requests and failed asset/API requests.
- `mmux-vite-backend` shows Flask, osparc, and Dakota failures.
- Container names can change with the compose project name, so run `docker compose ... ps` first if unsure.

## How Codex Should Troubleshoot Live

When the user says "watch this bug live", do this in order:

1. Confirm the stack is up with `docker compose --file docker-compose-development.yml ps`.
2. Tail all three containers: `web`, `app`, and `backend`.
3. Check `http://localhost:8888/flask/deployment/health`.
4. Ask the user to reproduce the issue now, or use Playwright against `localhost:8888`.
5. Correlate:
   - browser symptom
   - proxied request in `app`
   - API/Dakota failure in `backend`
   - build/HMR/runtime problem in `web`

Good targeted log searches:

```bash
docker logs mmux_vite_playwright-mmux-vite-app-1 --tail 250
docker logs mmux_vite_playwright-mmux-vite-backend-1 --tail 250
docker logs mmux_vite_playwright-mmux-vite-web-1 --tail 250
```

```bash
docker logs mmux_vite_playwright-mmux-vite-app-1 2>&1 | rg " 500 | 400 | websocket|Failed to load resource|error"
docker logs mmux_vite_playwright-mmux-vite-backend-1 2>&1 | rg "sumo_cross_validation|dakota|ERROR|Traceback"
```

## Known Gotchas

- A clean worktree may need `flaskapi/mmux_python` bootstrapped again.
- A clean worktree may also need a working `.env`.
- Frontend logs can be completely clean even when the real failure is backend data validation or Dakota.
- SUMO validation responses are camelCased by Flask response serialization, so frontend code must not assume raw snake_case response keys.
- Live OSPARC data can be inconsistent across functions and job collections; if a local e2e must be deterministic, pin it to a known-good function instead of picking an arbitrary live one.
