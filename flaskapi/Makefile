# MMUX Python configuration
MMUX_PYTHON_TAG := v1.5.14
MMUX_PYTHON_REPO := https://github.com/ITISFoundation/mmux_python

## Flask API setup
.PHONY: setup-mmux-python
setup-mmux-python: ## clone and setup mmux_python dependency
	if [ ! -d "mmux_python" ]; then \
		git clone --single-branch --branch ${MMUX_PYTHON_TAG} ${MMUX_PYTHON_REPO} mmux_python; \
	else \
		echo "mmux_python already exists, skipping clone"; \
	fi

## Install mmux_python & its dependencies
## osparc-client has already been added to pyproject.toml
.PHONY: install-flaskapi-deps
install-flaskapi-deps: setup-mmux-python ## install Flask API Python dependencies
	uv sync
