# MMUX Python configuration
MMUX_PYTHON_TAG := v1.5.7-hotfix-uq-seed
MMUX_PYTHON_REPO := https://github.com/ITISFoundation/mmux_python

## Flask API setup
.PHONY: setup-mmux-python
setup-mmux-python: ## clone and setup mmux_python dependency
	if [ ! -d "mmux_python" ]; then \
		git clone --single-branch --branch ${MMUX_PYTHON_TAG} ${MMUX_PYTHON_REPO} mmux_python; \
	else \
		echo "mmux_python already exists, skipping clone"; \
	fi

.PHONY: install-flaskapi-deps
install-flaskapi-deps: setup-mmux-python ## install Flask API Python dependencies
	uv add -r ./mmux_python/requirements.txt && \
	uv add osparc==0.8.3.post0.dev30 && \
	uv sync && \
	echo "Flask API dependencies installed using uv add"
