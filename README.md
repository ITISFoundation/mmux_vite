# MMUX Vite

This repository is under active development. It aims to bring up meta-modeling functionality in an interactive, user-friendly, guided step-by-step way.

It uses Vite (and React) for the front-end, and Python (via Flask) for the backend. Additionally, it connects to the OSPARC backend through its API (which is actively being expanded with "Functions" and related content to allow for meta-modeling functionality).

## Development

To add changes with hot reloading for the forntend and backend jus run the following command
```shell
make run-develop
```

NOTE: you will be running in docker containers.

### Final validation step

When done editing always validate the production build of the app with the below command, since it's the only one giving some minor guarantee on the corectness of your changes.

```shell
male run-prod-local
```
