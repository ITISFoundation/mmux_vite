FLASKAPI_DIR := ./flaskapi
VENV_DIR := $(FLASKAPI_DIR)/.venv
MMUX_PYTHON_DIR := $(FLASKAPI_DIR)/mmux_python
MMUX_PYTHON_BRANCH := "work/jgo/flask_mmux_nih"

base-install:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
	nvm install 22 ## gets node v22 (latest)
	npm install # install all dependencies
	apt install python3.10 python3.10-venv # install python venv

install-mmux-python:
	git clone https://github.com/ITISFoundation/mmux_python $(MMUX_PYTHON_DIR)
	cd $(MMUX_PYTHON_DIR) && git checkout $(MMUX_PYTHON_BRANCH)
	python3.10 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/python -m pip install flask python-dotenv
	$(VENV_DIR)/bin/python -m pip install -r $(MMUX_PYTHON_DIR)/requirements.txt

start-backend: 
	cd $(FLASKAPI_DIR) && .venv/bin/flask run --no-debugger

start-frontend:
	npm run dev

ts-client: ## requires serving from FunctionsAPI already active
	curl http://localhost:8087/generate-openapi -o openapi.json
	npm install @openapitools/openapi-generator-cli -g
	openapi-generator-cli generate \
		-i openapi.json \
		-g typescript \
		-o ./src/functions-api-ts-client

test:
	npm run test