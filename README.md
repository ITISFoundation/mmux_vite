# MMUX Vite

[![Build and check image](https://github.com/ITISFoundation/mmux_vite/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ITISFoundation/mmux_vite/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/ITISFoundation/mmux_vite/graph/badge.svg?token=x7ha0WSGJl)](https://codecov.io/gh/ITISFoundation/mmux_vite)
[![codecov node](https://codecov.io/gh/ITISFoundation/mmux_vite/graph/badge.svg?flag=node&token=x7ha0WSGJl)](https://codecov.io/gh/ITISFoundation/mmux_vite)
[![codecov flaskapi](https://codecov.io/gh/ITISFoundation/mmux_vite/graph/badge.svg?flag=flaskapi&token=x7ha0WSGJl)](https://codecov.io/gh/ITISFoundation/mmux_vite)
[![codecov e2e](https://codecov.io/gh/ITISFoundation/mmux_vite/graph/badge.svg?flag=e2e&token=x7ha0WSGJl)](https://codecov.io/gh/ITISFoundation/mmux_vite)
[![release](https://img.shields.io/github/v/release/ITISFoundation/mmux_vite)](https://github.com/ITISFoundation/mmux_vite/releases)

This repository is under active development. It aims to bring up meta-modeling functionality in an interactive, user-friendly, guided step-by-step way.

It uses Vite (and React) for the front-end, and Python (via Flask) for the backend. Additionally, it connects to the OSPARC backend through its API (which is actively being expanded with "Functions" and related content to allow for meta-modeling functionality).

### Coverage

CI uploads unit-test coverage to Codecov with separate `node` and `flaskapi` flags, plus Chromium browser coverage from the Playwright suite under the `e2e` flag.

Run Node coverage locally with:

```shell
cd node && npm ci && npm run test:coverage
```

Run the Playwright browser coverage locally with:

```bash
make test-e2e
```

Run backend coverage locally with:

```shell
make test-flaskapi
```

CI combines regular and analytical backend coverage before uploading it.

## Development

To setup your development environment, you need to fill it with the API access data from your oSPARC's account. Login on a deployment with your account and create a `New API Key` and use that data to fill out the generated `.env` file:

```shell
make .env
```

Make sure your images have been build (since they are used as a base for mounting the loca source folders)

```shell
make build
```

Install and run the repository hooks before opening a PR:

```shell
uvx prek install
make prek
```

Start for development mode with (pick the mode × permissions variant you need, see the run matrix below)
```shell
make run-develop-sumo-read
```

NOTE: code will be running inside docker containers.

### Run matrix (modes × permissions)

The app ships as 3 service modes × 2 permission levels, each with a development launcher (live source mounts, debug logging) and a production-local launcher (built images, validation mount only). There are 12 targets in total:

| Mode | Purpose | Dev (live mounts) | Prod-local (built images) |
|---|---|---|---|
| SuMo | surrogate metamodeling (fit/validation of AI models) | `make run-develop-sumo-read` | `make run-prod-local-sumo-read` |
| SuMo | same, writable (run sampling, persist collections) | `make run-develop-sumo-write` | `make run-prod-local-sumo-write` |
| UQ | uncertainty quantification (histograms, correlation, Sobol indices) | `make run-develop-uq-read` | `make run-prod-local-uq-read` |
| UQ | same, writable | `make run-develop-uq-write` | `make run-prod-local-uq-write` |
| MOGA | multi-objective genetic algorithm optimization (preview) | `make run-develop-moga-read` | `make run-prod-local-moga-read` |
| MOGA | same, writable | `make run-develop-moga-write` | `make run-prod-local-moga-write` |

Target naming: `make run-{develop|prod-local}-{sumo|uq|moga}-{read|write}` — mode/perm are passed to the backend as `SERVICE_MODE`/`PERMISSIONS` (§ SPEC.md §I env contract).

Notes:

- The app (Caddy proxy) publishes on host port `8888` by default; if busy, `scripts/resolve-app-port.sh` picks the next free port (fallbacks 8889-8892) and the launcher prints the actual URL(s).
- Under WSL2 the printed output distinguishes the shell-local `http://localhost:<port>` from the Windows-browser `http://<WSL-IP>:<port>`; Windows `localhost` on fallback ports needs `netsh interface portproxy` rules (ask a maintainer for the current recipe).
- Dev launchers bind-mount `flaskapi/` and `node/` (container runs as your host UID/GID), so edits are served live — Vite HMR for the frontend, Flask debug reload for the backend.

### Final validation step

When done editing always validate the production build of the app with the below command (pick your variant), since it's the only one giving some minor guarantee on the corectness of your changes.

```shell
make run-prod-local-sumo-read
```

## Updating the ospsarc package

The backend relies on the `osparc` package to interact with the oSPARC's API server. If he API server specs change, you would most likley need to create a new release of this service.
Instructions:

Fork https://github.com/ITISFoundation/osparc-simcore-clients  and clone your fork locally

```shell
cd api
make openapi-osparc-simore-master-branch
git commit -am "updated specs form osparc-simcore master branch"
```

Push your changes and create a PR which needs to be merged.

After the PR is merged, the CI will automatically publish a new version of this client which can be found here https://pypi.org/project/osparc/0.8.3.post0.dev27/#history
Get the latest version and repalce it in `falskapi/Dockerfile`. At the time of writing this it was `osparc==0.8.3.post0.dev27`.
