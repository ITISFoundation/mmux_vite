# MMUX Vite — Project Overview

## Purpose

MMUX (Multi-platform Uncertainty eXplorer) is a web-based application for designing, executing, and analyzing parametric sampling campaigns (Monte Carlo, Latin Hypercube Sampling, etc.) in scientific simulation workflows.

**Use case:** TI (Temporal Interference) stimulation uncertainty & sensitivity analysis — helps PhD students and researchers quantify how tissue conductivity variations affect simulated electric field predictions.

## Tech Stack

### Frontend (node/)
- **Framework:** React 19 + TypeScript
- **Build:** Vite 6.3.1
- **Styling:** Tailwind CSS 4, Material-UI (MUI) 7, Emotion
- **Visualization:** Plotly.js 3
- **Testing:** Vitest + React Testing Library + Playwright
- **Quality:** ESLint (airbnb-typescript), Prettier, Husky (pre-commit)
- **Runtime:** Node.js ≥24.0.0

### Backend (flaskapi/)
- **Framework:** Flask 3.1.1 (WSGI + Gevent)
- **Language:** Python ≥3.11
- **Scientific:** NumPy 2.2.6, SciPy 1.15.3, scikit-learn 1.6.1, Pandas 2.2.3
- **Integration:** itis-dakota, osparc, mmux-python (workspace dependency)
- **Testing:** pytest with coverage (via uv dependency groups)
- **Package Mgmt:** uv (workspaces) + setuptools

### Deployment & Integration
- **OSPARC integration:** Custom proxy services in `.osparc/` for MOGA, SUMO, UQ
- **Monorepo:** Vite frontend, pip/setuptools backend, workspace coordination via uv

## Key Directories

- `node/src/` — React components, pages, utils
- `flaskapi/src/mmux_flaskapi/` — Backend blueprints, utils, data_preprocessor
- `flaskapi/tests/` — Backend test suite
- `.osparc/` — OSPARC service metadata
- `.github/workflows/` — CI/CD pipelines

## Git Conventions

**Commit style:** Conventional Commits (feat:, fix:, refactor:, chore:, docs:)
**Branches:** Feature branches + PR review before merge to main
**PR format:** Numbered issues + descriptive title
