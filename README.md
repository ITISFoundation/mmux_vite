# MMUX Vite

This repository is under active development. It aims to bring up meta-modeling functionality in an interactive, user-friendly, guided step-by-step way.

It uses Vite (and React) for the front-end, and Python (via Flask) for the backend. Additionally, it connects to the OSPARC backend through its API (which is actively being expanded with "Functions" and related content to allow for meta-modeling functionality).

## Development
To set up & test this repo locally, you need the following:
- Frontend: use `make install-node` to install Node22 and all packages related to the frontend. To then get the app running, use `make start-frontend`
- Python backend: use `make-install-mmux-python` to install the python backend. Then use `make start-backend` to get it running.
- OSPARC backend: use `make python-client` to generate & install the OSPARC API with the latest specifications. Additionally, you need an `osparc-master.conf.json` file  at the top directory with the following contents:
```json
{
    "host": "https://api.osparc-master.speag.com",
    "username": API_KEY,
    "password": API_TOKEN
}
```