FLASKAPI_DIR := ./flaskapi
VENV_DIR := $(FLASKAPI_DIR)/.venv
MMUX_PYTHON_DIR := $(FLASKAPI_DIR)/mmux_python
MMUX_PYTHON_BRANCH := "work/jgo/flask_mmux_nih"

base-install:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
	nvm install 22 ## gets node v22 (latest)
	npm install # install all dependencies
	apt install python3.11 python3.11-venv # install python venv

install-mmux-python:
	git clone https://github.com/ITISFoundation/mmux_python $(MMUX_PYTHON_DIR)
	cd $(MMUX_PYTHON_DIR) && git checkout $(MMUX_PYTHON_BRANCH)
	python3.11 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/python -m pip install flask python-dotenv
	$(VENV_DIR)/bin/python -m pip install -r $(MMUX_PYTHON_DIR)/requirements.txt

start-backend: 
	cd $(FLASKAPI_DIR) && .venv/bin/flask run --no-debugger

start-frontend:
	npm run dev

client-generator:
	rm -rf .uv_venv
	uv venv .uv_venv
	uv pip install openapi-generator-cli

ts-client: client-generator
	curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
	uv run openapi-generator-cli generate \
		-i openapi.json \
		-g typescript \
		-o ./src/osparc-api-ts-client \
		--package-name osparc_client

python-client: 
# 	curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
# # npm install @openapitools/openapi-generator-cli -g
# 	openapi-generator-cli generate \
# 		-i openapi.json \
# 		-g python \
# 		-o ./flaskapi/functions-api-python-client \
# 		--package-name osparc_client
# 	$(VENV_DIR)/bin/python -m pip install ./flaskapi/functions-api-python-client
	uv run openapi-generator-cli generate \
		-i openapi.json \
		-g python \
		-o ./flaskapi/osparc-api-python-client \
		--package-name osparc_client
	$(VENV_DIR)/bin/python -m  pip install ./flaskapi/osparc-api-python-client

# uv run python solver_functions.py

test:
	npm run test