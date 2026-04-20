# Suggested Commands for MMUX Vite Development

## Frontend (node/)

### Development
```bash
cd node
npm install           # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript compilation + Vite build → dist/
npm run preview      # Preview production build locally
```

### Testing & Quality
```bash
npm run test         # Run Vitest (unit + component tests)
npm run test:browser # Run Vitest with browser driver (Playwright)
npm run lint         # Run ESLint with airbnb-typescript config
npm run pretty       # Format all TS/JS/JSON with Prettier
```

## Backend (flaskapi/)

### Development
```bash
cd flaskapi
uv sync              # Sync Python environment (installs all + dev)
uv run python -m flask --app src.mmux_flaskapi run --port 5000
```

### Testing & Quality
```bash
uv run pytest                    # Run all tests with coverage report
uv run pytest -v --tb=short      # Verbose + short traceback
uv run pytest -m "not slow"      # Skip slow tests
uv run pytest --cov-report=html  # Generate HTML coverage (htmlcov/)
```

### Environment
```bash
cd flaskapi
uv venv              # Create virtual environment (if not automatic)
source .venv/bin/activate  # (or: .venv\Scripts\activate on Windows)
```

## Monorepo / Full Stack

### Install all
```bash
npm install                    # Frontend deps
cd flaskapi && uv sync && cd ..  # Backend deps + dev tools
```

### Dev server (both)
```bash
# Terminal 1: Backend
cd flaskapi && uv run python -m flask --app src.mmux_flaskapi run --port 5000

# Terminal 2: Frontend
cd node && npm run dev
```

### CI / Pre-commit
```bash
npm run lint && npm run pretty  # Frontend lint + format
npm run build                   # Frontend build
cd flaskapi && uv run pytest    # Backend tests + coverage
```

## Conventions

- **Python:** Always use `uv run python` or `uvx` — never bare `python3`
- **Env:** `.venv/` and `node_modules/` in `.gitignore`
- **Shell:** POSIX-compliant (Git Bash on Windows)
