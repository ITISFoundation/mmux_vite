# MMUX Vite

[![Build and check image](https://github.com/ITISFoundation/mmux_vite/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ITISFoundation/mmux_vite/actions/workflows/ci.yml)
[![CodSpeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://app.codspeed.io/ITISFoundation/mmux_vite?utm_source=badge)
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
- Under WSL2 the printed output distinguishes the shell-local `http://localhost:<port>` from the Windows-browser `http://<WSL-IP>:<port>`; if Windows `localhost` fails on a fallback port while the WSL-IP URL works, see the portproxy workaround in the next section.
- Dev launchers bind-mount `flaskapi/` and `node/` (container runs as your host UID/GID), so edits are served live — Vite HMR for the frontend, Flask debug reload for the backend.

### WSL2: Windows browser access on fallback ports

Under WSL2, Windows localhost forwarding may already make the selected app port accessible, including fallback ports (`8889`-`8892`); it is not limited to `8888`. If `http://localhost:<port>` fails from a Windows browser but the launcher's `http://<WSL-IP>:<port>` URL works, the manual `netsh interface portproxy` workaround below can forward the port into WSL. Adding or deleting these rules requires an **elevated** Command Prompt (cmd.exe "Run as administrator"; unprivileged `add`/`delete` is refused).

Manual flow in an elevated Command Prompt — show, delete stale, add, show — with `<WSL-IP>` set to the current WSL IP (the one the launcher prints, or the first address of `hostname -I` inside WSL):

```bat
netsh interface portproxy show v4tov4
for /L %p in (8889,1,8892) do netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=%p
for /L %p in (8889,1,8892) do netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=%p connectaddress=<WSL-IP> connectport=%p
netsh interface portproxy show v4tov4
```

Or run `scripts/setup-windows-portproxy.sh` inside WSL: it detects the current WSL IP (same detection as the launcher banner) and prints this block pre-filled, ready to paste. To tear the rules down, run only the `delete` line.

**Warning — stale rules after an IP change:** the WSL IP is reassigned after `wsl --shutdown` or a Windows reboot. Existing portproxy rules keep forwarding to the OLD address, so `localhost:<fallback-port>` from Windows silently fails even while `http://<WSL-IP>:<port>` still works. Re-run `scripts/setup-windows-portproxy.sh` (or repeat delete + add with the new IP) after every restart. If the rules look correct but connections are still refused, Windows Defender Firewall may be blocking them; an inbound allow rule fixes it (run once): `netsh advfirewall firewall add rule name="mmux-vite WSL fallback ports" dir=in action=allow protocol=TCP localport=8889-8892`.

### Final validation step

When done editing always validate the production build of the app with the below command (pick your variant), since it's the only one giving some minor guarantee on the corectness of your changes.

```shell
make run-prod-local-sumo-read
```

## Sampling limits (auto-derived)

Per-variable sampling limits are **auto-derived by convention, not hand-set per study**: there is no Sobol' bounds window in the UI — the Sobol' box is derived backend-side, in `itis-sumo` (the editable Sobol' bounds editor and the frontend box-derivation were deliberately removed as a DOMAIN↔DISTRIBUTION conflation; decision record: [JavierGOrdonnez/mmux_vite#84](https://github.com/JavierGOrdonnez/mmux_vite/issues/84)). Two **different** boxes exist in the stack and they need not coincide:

| Box | Used by | Derived from | Rule |
|---|---|---|---|
| Sampling box | surrogate training/validation runs (LHS, grid search) | the modeller's input distributions | `uniform → [min, max]`, `normal → mean ± 2.5σ`, `constant → pinned value`; these derived ranges seed the Start/End fields of the sampling forms, where they may still be adjusted before launching a run |
| Sobol' domain box | Sobol' sensitivity ensemble | the surrogate's **observed training samples** | per-variable `min`/`max` of the samples; a column constant in the samples becomes a fixed factor; draws are **uniform** over the box (log-uniform under a log-scale flag); **no UI to edit it** |

What this means in practice:

- **±2.5σ covers ≈98.8% of a normal distribution.** The remaining ≈1.2% of the mass lies *outside* the sampled/validated domain — there the surrogate is **extrapolating**, not interpolating.
- **Sobol' indices describe the surrogate's own exploration ensemble, not your distribution.** The engine draws uniformly across the domain box, so the indices answer "how does the surrogate's output vary across this box?" — they are *not* your input distributions pushed through the surrogate (the Correlation panel is the distribution-shaped view; Sobol' ignores distribution shape entirely).
- **The Sobol' box is derived backend-side, in `itis-sumo`.** `itis_sumo.api.evaluate_sobol` takes *optional* `domains`/`fixed` maps; anything omitted is auto-inferred from the observed sample bounds, and the Saltelli sample count is fixed inside the engine. The frontend sends no `domains`, `fixed`, `distributions` or `numSamples` on the Sobol' request — a contract test (`node/src/utils/sobolIndices.test.ts`) locks that. Engine docstrings, verbatim: modeller distributions are *"NOT an input here; they drive `evaluate_uncertainty`"* and *"no box is ever re-derived from a distribution's mean ± 3σ"*.
- **The two boxes are different boxes.** Sobol' sees the observed training bounds; the LHS/grid forms seed `mean ± 2.5σ` ranges. Whether they should be reconciled is an engine decision, tracked in [itis-sumo#55](https://github.com/ITISFoundation/itis-sumo/issues/55); this README documents both conventions rather than assuming they match.

> [!NOTE]
> Engine pin: this behavior ships with the released `itis-sumo==0.1.0` on PyPI (pinned in `flaskapi/pyproject.toml`). The auto-infer contract above — optional `domains`/`fixed`, observed-bounds inference, constant column → fixed factor, uniform draws, and both docstring quotes — was verified against **that pin** (`itis_sumo/api/_session.py` in the published `0.1.0` wheel).

## Performance benchmarks

Performance is measured continuously with [CodSpeed](https://app.codspeed.io/ITISFoundation/mmux_vite) in CPU simulation mode; every pull request gets a report through `.github/workflows/codspeed.yml`.

- Frontend benchmarks: `node/src/**/*.bench.ts` (vitest bench) — job-collection CSV import, sampling bounds, and the session response-cache request key.
- Backend benchmarks: `flaskapi/benchmarks/` (pytest-codspeed) — the Flask API boundary only (request/response key case conversion on production-shaped payloads, pydantic validation and the Flask JSON round trip). The Dakota data-processing internals will be benchmarked where they live, in [itis-sumo](https://github.com/ITISFoundation/itis-sumo); the move is tracked in [itis-sumo#56](https://github.com/ITISFoundation/itis-sumo/issues/56).

Run them locally (requires the [CodSpeed CLI](https://codspeed.io/docs/cli)):

```shell
make bench-flaskapi
make bench-node
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
