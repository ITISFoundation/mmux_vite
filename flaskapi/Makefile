## Install Flask API dependencies
## osparc-client has already been added to pyproject.toml
.PHONY: install-flaskapi-deps
install-flaskapi-deps: ## install Flask API Python dependencies
	uv sync

# CI-only tier (root SPEC V47dp): --locked asserts uv.lock is up-to-date with
# pyproject.toml and installs strictly from the lock; a stale lock FAILS here
# instead of silently re-resolving like the bare `uv sync` above.
.PHONY: install-flaskapi-deps-locked
install-flaskapi-deps-locked: ## install from a freshness-validated uv.lock (CI gate; fails on a stale lock)
	uv sync --locked

.PHONY: check-types-flaskapi
check-types-flaskapi: ## run ty type checker against src/mmux_flaskapi
	uv run ty check src/mmux_flaskapi
