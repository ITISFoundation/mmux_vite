# MMUX Vite

This repository is under active development. It aims to bring up meta-modeling functionality in an interactive, user-friendly, guided step-by-step way.

It uses Vite (and React) for the front-end, and Python (via Flask) for the backend. Additionally, it connects to the OSPARC backend through its API (which is actively being expanded with "Functions" and related content to allow for meta-modeling functionality).

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

Start for development mode with
```shell
make run-develop
```

NOTE: code will be running inside docker containers.

### Final validation step

When done editing always validate the production build of the app with the below command, since it's the only one giving some minor guarantee on the corectness of your changes.

```shell
make run-prod-local
```

## Using without oSPARC credentials

### Unit tests

All backend tests run without real credentials. `conftest.py` provides two autouse fixtures that inject dummy env vars and patch the oSPARC connection check, so no real network call is ever made:

```shell
cd flaskapi && uv run pytest tests/ -v
```

### Local Functions (no oSPARC account required)

The app supports *local functions* — functions defined and stored entirely on your machine, without any oSPARC connection. When the app cannot reach oSPARC (invalid or missing credentials), `list_functions` and `list_function_job_collections` gracefully fall back to returning only local data instead of failing.

Local functions are stored in `runs_local/uploaded_job_collections_store.json` and are identified by the `local-func-*` uid prefix. They are merged transparently with any oSPARC functions when both are available.

**To run locally without oSPARC credentials**, set dummy values in `.env` (the app validates these variables exist at startup, but does not require them to be real):

```shell
OSPARC_API_BASE_URL=https://dummy.example.io
OSPARC_API_KEY=dummy_key
OSPARC_API_SECRET=dummy_secret
```

Then start normally:

```shell
make run-develop
```

The function list will be empty on first launch (showing a help prompt inside the table). Use the **Upload Data** button to create a local function from a CSV file — it will appear in the list immediately and persist across restarts.

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
