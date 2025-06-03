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

Start for development mode with
```shell
make run-develop
```

NOTE: code will be running inside docker containers.

### Final validation step

When done editing always validate the production build of the app with the below command, since it's the only one giving some minor guarantee on the corectness of your changes.

```shell
male run-prod-local
```
