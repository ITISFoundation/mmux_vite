# Code Conventions & Style

## Frontend (TypeScript / React)

### Code Style
- **Formatter:** Prettier (2-space tabs, 130 char line width, double quotes, trailing commas)
- **Linter:** ESLint with `eslint-config-airbnb-typescript`
- **TS Config:** Strict mode enabled (`strict: true` in tsconfig.json)
- **React:** Hooks-based, functional components only
- **Imports:** Module format (ES6); absolute imports via TypeScript paths where configured

### Naming
- **Components:** PascalCase (e.g., `JobSelector`, `ResultsPlot`)
- **Functions & vars:** camelCase (e.g., `getSamplingStartValue`, `handleSubmit`)
- **Constants:** CONSTANT_CASE when truly immutable, otherwise camelCase
- **File names:** kebab-case for utils/hooks (e.g., `csv_utils.ts`), PascalCase for components

### Patterns
- Destructure props in function signatures
- Use typed object keys (avoid `any`)
- Prop validation via TypeScript types (no PropTypes)
- Error handling: console.warn/error for dev feedback; toast notifications for user-facing errors
- Comments: Use `// FIXME` or `// TODO` for known issues; inline comments for complex logic only

## Backend (Python)

### Code Style
- **Python:** 3.11+
- **Linter:** implicit from pyproject.toml (pytest with coverage)
- **Type hints:** Encouraged but not enforced; use for public APIs
- **Imports:** Organized by standard library, third-party, local (but no explicit sorting tool configured)
- **Docstrings:** Use for class and function definitions; follow PEP 257

### Naming
- **Classes:** PascalCase (e.g., `DataPreprocessor`)
- **Functions & methods:** snake_case (e.g., `load_samples`, `get_surrogate_model`)
- **Constants:** CONSTANT_CASE (e.g., `MAX_ITERATIONS`, `DEFAULT_LOG_LEVEL`)
- **Private:** Prefix with `_` (e.g., `_process_input`)

### Patterns
- Flask blueprints for modular API endpoints
- Dataclass or pydantic for config/schema validation (if available; check existing code)
- Error handling: raise `ValueError` or `RuntimeError` with descriptive messages
- Logging: Use the configured logger (see `flaskapi/src/mmux_flaskapi/utils/logger.py`)
- Tests: pytest with markers (`@pytest.mark.slow`, `@pytest.mark.integration`)

### Git & Commits
- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`
- **Message format:** `<type>(<scope>): <subject> (#PR_NUMBER)` or `<type>: <subject>`
- **Example:** `fix: now states are always filtered and parsed (#426)`

## Project-Wide

### Environment Files
- No `.env` checked in; use `.env.example` or document via comments
- Secrets via environment variables (Flask respects `python-dotenv`)

### Testing
- **Frontend:** Vitest (vitest.config.ts for defaults)
- **Backend:** pytest (config in pyproject.toml; output: `htmlcov/` for coverage)
- **Coverage target:** Encourage but not enforced; see `--cov-report=html` output

### Linting & Format on Save
- ESLint + Prettier configured for VS Code (check `.vscode/settings.json`)
- Run `npm run pretty` before commit on frontend; backend relies on manual review or pre-commit hooks if configured
