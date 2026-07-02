SHELL 				 			:= /bin/sh
.DEFAULT_GOAL 		 			:= help

DOCKER_IMAGE_TAG := 1.5.18


FLASKAPI_DIR := ./flaskapi
NODE_DIR := ./node

## Front-end
install-node:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
# nvm install 22 ## gets node v22 (latest)
	cd ${NODE_DIR} && npm install # install all dependencies

start-frontend:
	cd ${NODE_DIR} && npm run dev

.PHONY: install-flaskapi-deps ## install Flask API Python dependencies
install-flaskapi-deps:
	cd ${FLASKAPI_DIR} && make install-flaskapi-deps


# Builds new service version ----------------------------------------------------------------------------
define _bumpversion
	# upgrades as $(subst $(1),,$@) version, commits and tags
	@docker run -it --rm -v $(PWD):/ml-lab \
		-u $(shell id -u):$(shell id -g) \
		itisfoundation/ci-service-integration-library:v2.1.23 \
		sh -c "cd /ml-lab && bump2version --verbose --list --config-file $(1) $(subst $(2),,$@)"
endef

.PHONY: version-patch version-minor version-major
version-patch version-minor version-major: .bumpversion.cfg ## increases service's version
	@make compose-spec
	@$(call _bumpversion,$<,version-)
	@make compose-spec


.PHONY: compose-spec
compose-spec: ## runs ooil to assemble the docker-compose.yml file
	@docker run -it --rm -v $(PWD):/ml-lab \
		-u $(shell id -u):$(shell id -g) \
		itisfoundation/ci-service-integration-library:v2.1.23 \
		sh -c "cd /ml-lab && ooil compose"

.PHONY: build
build: compose-spec ## build docker images
	docker compose build

.PHONY: build-no-cache
build-no-cache: compose-spec ## build docker images
	docker compose build --no-cache --pull --parallel

## NB: VSCode might keep old credentials cached, even if changed in .env
## run in a non-VSCode terminal to avoid this

# DEVELOPMENT

.PHONY: run-develop-sumo-read
run-develop-sumo-read: ## runs for development SUMO/READ-ONLY
	export SERVICE_MODE=SUMO && \
	export PERMISSIONS=READ-ONLY && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-sumo-read && \
	docker compose --file docker-compose-development.yml up

.PHONY: run-develop-sumo-write
run-develop-sumo-write: ## runs for development SUMO/WRITE
	export SERVICE_MODE=SUMO && \
	export PERMISSIONS=WRITE && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-sumo-write && \
	docker compose --file docker-compose-development.yml up

.PHONY: run-develop-uq-read
run-develop-uq-read: ## runs for development UQ/READ-ONLY
	export SERVICE_MODE=UQ && \
	export PERMISSIONS=READ-ONLY && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-uq-read && \
	docker compose --file docker-compose-development.yml up

.PHONY: run-develop-uq-write
run-develop-uq-write: ## runs for development UQ/WRITE
	export SERVICE_MODE=UQ && \
	export PERMISSIONS=WRITE && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-uq-write && \
	docker compose --file docker-compose-development.yml up

.PHONY: run-develop-moga-read
run-develop-moga-read: ## runs for development MOGA/READ-ONLY
	export SERVICE_MODE=MOGA && \
	export PERMISSIONS=READ-ONLY && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-moga-read && \
	docker compose --file docker-compose-development.yml up

.PHONY: run-develop-moga-write
run-develop-moga-write: ## runs for development MOGA/WRITE
	export SERVICE_MODE=MOGA && \
	export PERMISSIONS=WRITE && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-moga-write && \
	docker compose --file docker-compose-development.yml up

# VALIDATION VERSIONS

.PHONY: run-prod-local-sumo-read
run-prod-local-sumo-read: ## runs for validation as it would be in production SUMO/READ-ONLY
	export SERVICE_MODE=SUMO && \
	export PERMISSIONS=READ-ONLY && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-sumo-read && \
	docker compose --file docker-compose-local.yml up

.PHONY: run-prod-local-sumo-write
run-prod-local-sumo-write: ## runs for validation as it would be in production SUMO/WRITE
	export SERVICE_MODE=SUMO && \
	export PERMISSIONS=WRITE && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-sumo-write && \
	docker compose --file docker-compose-local.yml up

.PHONY: run-prod-local-uq-read
run-prod-local-uq-read: ## runs for validation as it would be in production UQ/READ-ONLY
	export SERVICE_MODE=UQ && \
	export PERMISSIONS=READ-ONLY && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-uq-read && \
	docker compose --file docker-compose-local.yml up

.PHONY: run-prod-local-uq-write
run-prod-local-uq-write: ## runs for validation as it would be in production UQ/WRITE
	export SERVICE_MODE=UQ && \
	export PERMISSIONS=WRITE && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-uq-write && \
	docker compose --file docker-compose-local.yml up

.PHONY: run-prod-moga-read
run-prod-moga-read: ## runs for validation as it would be in production MOGA/READ-ONLY
	export SERVICE_MODE=MOGA && \
	export PERMISSIONS=READ-ONLY && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-moga-read && \
	docker compose --file docker-compose-local.yml up

.PHONY: run-prod-moga-write
run-prod-moga-write: ## runs for validation as it would be in production MOGA/WRITE
	export SERVICE_MODE=MOGA && \
	export PERMISSIONS=WRITE && \
	export DEPLOYMENT_MODE=LOCAL && \
	export APP_IMAGE=mmux-vite-app-moga-write && \
	docker compose --file docker-compose-local.yml up


.PHONY: publish-local
publish-local: ## push to local throw away registry to test integration
	docker tag simcore/services/dynamic/mmux-vite-backend:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-backend:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-backend:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-web:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-web:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-web:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app-sumo-read:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app-sumo-read:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app-sumo-read:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app-sumo-write:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app-sumo-write:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app-sumo-write:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app-uq-read:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app-uq-read:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app-uq-read:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app-uq-write:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app-uq-write:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app-uq-write:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app-moga-read:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app-moga-read:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app-moga-read:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app-moga-write:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app-moga-write:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app-moga-write:$(DOCKER_IMAGE_TAG)
	@curl registry:5000/v2/_catalog | jq

.PHONY: build-publish-local
build-publish-local: build-no-cache publish-local

.env: .env-devel ## creates .env file from defaults in .env-devel
	$(if $(wildcard $@), \
	@echo "WARNING #####  $< is newer than $@ ####"; diff -uN $@ $<; false;,\
	@echo "WARNING ##### $@ does not exist, cloning $< as $@ ############"; cp $< $@)

.PHONY: clean
clean: ## clean build artifacts and dependencies
	rm -rf node/node_modules
	rm -rf flaskapi/.venv


.PHONY: prek pre-commit
prek: install-node install-flaskapi-deps ## run repository prek hooks
	uvx prek run --all-files

pre-commit: prek ## backward-compatible alias for prek



# TESTING
.PHONY: test-node
test-node: clean
	cd ${NODE_DIR} && \
		npm ci && \
		npm test

.PHONY: test-flaskapi
test-flaskapi: install-flaskapi-deps ## run Flask backend tests
	cd ${FLASKAPI_DIR} && \
	uv run pytest tests/ -v --cov-report=html --cov-report=term-missing

.PHONY: tests-flaskapi
tests-flaskapi: test-flaskapi ## alias for test-flaskapi

.PHONY: test-e2e
test-e2e: ## run the Playwright read-only pixel-snapshot e2e suite (SuMo/UQ/MOGA; boots backend+web via webServer)
	cd ${NODE_DIR} && npm run test:e2e

.PHONY: test-e2e-update
test-e2e-update: ## regenerate read-only e2e pixel baselines (SuMo/UQ/MOGA; run only in the pinned Playwright docker image, see V12)
	cd ${NODE_DIR} && npm run test:e2e:update

.PHONY: test-e2e-update-docker
PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.61.0-noble
test-e2e-update-docker: ## regenerate e2e baselines INSIDE the pinned Playwright image (font-stable, see V12); keep tag == @playwright/test
	docker run --rm --user root --network host \
		-v "$(PWD)":/work -w /work -e HOME=/root \
		$(PLAYWRIGHT_IMAGE) \
		bash /work/tests/e2e/scripts/gen-baselines.sh

.PHONY: test-e2e-docker
test-e2e-docker: ## verify e2e pixel diff vs committed baselines INSIDE the pinned Playwright image (mirrors CI, see V12,§C)
	docker run --rm --user root --network host \
		-v "$(PWD)":/work -w /work -e HOME=/root -e E2E_MAKE_TARGET=test-e2e \
		$(PLAYWRIGHT_IMAGE) \
		bash /work/tests/e2e/scripts/gen-baselines.sh

.PHONY: ci
ci: test-flaskapi test-node build-no-cache ## mimmicks the GitHub CI

.PHONY: help
help: ## this colorful help
	@echo "Recipes for '$(notdir $(CURDIR))':"
	@echo ""
	@awk --posix 'BEGIN {FS = ":.*?## "} /^[[:alpha:][:space:]_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
