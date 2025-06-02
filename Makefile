SHELL 				 			:= /bin/sh
.DEFAULT_GOAL 		 			:= help

DOCKER_IMAGE_TAG := 1.0.0


FLASKAPI_DIR := ./flaskapi
VENV_DIR := $(FLASKAPI_DIR)/.venv
MMUX_PYTHON_DIR := $(FLASKAPI_DIR)/mmux_python
MMUX_PYTHON_BRANCH := "work/jgo/flask_mmux_nih"
#
NODE_DIR := ./node

## Front-end
install-node:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
# nvm install 22 ## gets node v22 (latest)
	cd ${NODE_DIR} && npm install # install all dependencies

start-frontend:
	cd ${NODE_DIR} && npm run dev

## Python Backend
install-mmux-python:
	apt install python3.11 python3.11-venv # install python venv
	git clone https://github.com/ITISFoundation/mmux_python $(MMUX_PYTHON_DIR)
	cd $(MMUX_PYTHON_DIR) && git checkout $(MMUX_PYTHON_BRANCH)
	python3.11 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/python -m pip install flask python-dotenv
	$(VENV_DIR)/bin/python -m pip install -r $(MMUX_PYTHON_DIR)/requirements.txt

start-backend: 
	cd $(FLASKAPI_DIR) && .venv/bin/flask run --no-debugger


## OSPARC API client generation
client-generator:
	rm -rf .uv_venv
	uv venv .uv_venv
	uv pip install openapi-generator-cli

## No longer used
# ts-client: client-generator
# 	curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
# 	uv run openapi-generator-cli generate \
# 		-i openapi.json \
# 		-g typescript \
# 		-o ./src/osparc-api-ts-client \
# 		--package-name osparc_client

python-client: client-generator
	curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
	uv run openapi-generator-cli generate \
		-i openapi.json \
		-g python \
		-o ./flaskapi/osparc-api-python-client \
		--package-name osparc_client
	$(VENV_DIR)/bin/python -m  pip install ./flaskapi/osparc-api-python-client



### dynamic serice utils


.PHONY: compose-spec
compose-spec: ## runs ooil to assemble the docker-compose.yml file
	@docker run -it --rm -v $(PWD):/ml-lab \
		-u $(shell id -u):$(shell id -g) \
		itisfoundation/ci-service-integration-library:v2.0.12 \
		sh -c "cd /ml-lab && ooil compose"

.PHONY: build
build: compose-spec ## build docker images
	docker compose build

.PHONY: run-prod-local
run-prod-local: ## runs image with local configuration (dataset X)
	docker compose --file docker-compose-local.yml up

.PHONY: publish-local
publish-local: ## push to local throw away registry to test integration
	docker tag simcore/services/dynamic/mmux-vite-backend:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-backend:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-backend:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-web:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-web:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-web:$(DOCKER_IMAGE_TAG)
	docker tag simcore/services/dynamic/mmux-vite-app:${DOCKER_IMAGE_TAG} registry:5000/simcore/services/dynamic/mmux-vite-app:$(DOCKER_IMAGE_TAG)
	docker push registry:5000/simcore/services/dynamic/mmux-vite-app:$(DOCKER_IMAGE_TAG)
	@curl registry:5000/v2/_catalog | jq


.env: .env-devel ## creates .env file from defaults in .env-devel
	$(if $(wildcard $@), \
	@echo "WARNING #####  $< is newer than $@ ####"; diff -uN $@ $<; false;,\
	@echo "WARNING ##### $@ does not exist, cloning $< as $@ ############"; cp $< $@)


.PHONY: help
help: ## this colorful help
	@echo "Recipes for '$(notdir $(CURDIR))':"
	@echo ""
	@awk --posix 'BEGIN {FS = ":.*?## "} /^[[:alpha:][:space:]_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
