# Task Completion Workflow

## When a Task Is Complete

### 1. Run All Quality Checks
```bash
# Frontend
npm run lint && npm run pretty && npm run test

# Backend
uv run pytest --cov-report=html

# Full rebuild
npm run build
```

### 2. Commit with Conventional Commits
```bash
git add <changed files>
git commit -m "type(scope): description (#issue_number)"

# Examples:
# feat(dakota): add enhanced error handling for blueprint
# fix(sampling): now states are always filtered and parsed (#426)
# refactor(data-preprocessor): modernize with DataPreprocessor class
# test(flask-api): add endpoint validation tests (#280)
```

### 3. Push & Create/Update PR
```bash
git push origin <branch-name>
gh pr create --title "..." --body "..." # or update existing PR
```

### 4. Update Project House Task
- Mark task as `in-progress` or `completed` via `ph_fix_metadata`
- Add acceptance criteria checkmarks to task body
- Document results or blockers in task description
- Link any relevant commits or PR numbers

### 5. Test Coverage Requirements
- **Frontend:** Vitest unit tests for new components/utils
- **Backend:** pytest with ≥70% coverage on modified functions (aim higher for critical paths)
- **Integration:** Manual browser testing for full workflows (or use Playwright if test exists)

## Code Review Checklist

Before pushing, verify:
- [ ] ESLint + Prettier passing (`npm run lint` + `npm run pretty`)
- [ ] TypeScript strict mode: no `any` types unless absolutely necessary
- [ ] Tests added for new functions (frontend: Vitest; backend: pytest)
- [ ] Docstrings/comments for complex logic
- [ ] No console.log() left in production code (use logger.py or console.warn for dev)
- [ ] No hardcoded secrets or sensitive data
- [ ] Git history is clean (conventional commits, no WIP messages)

## Common Workflows

### Adding a New API Endpoint
1. Create route in `flaskapi/src/mmux_flaskapi/blueprints/new_module.py`
2. Import blueprint in `flaskapi/src/mmux_flaskapi/__init__.py`
3. Write unit tests in `flaskapi/tests/test_new_module.py`
4. Add React component/hook to consume endpoint in `node/src/components/` or `node/src/utils/`
5. Run full test suite: `npm run test` + `uv run pytest`
6. Commit: `feat(new-module): add <endpoint> endpoint`

### Updating Data Structures
1. Update backend dataclass/schema in `flaskapi/src/mmux_flaskapi/`
2. Add migration or schema version bump if needed
3. Update frontend types in TypeScript (`node/src/types/` or inline)
4. Update tests to reflect schema
5. Commit: `refactor(schema): update <structure> to include <field>`

### Fixing a Bug
1. Add test that reproduces bug (mark `@pytest.mark.xfail` or skip initially)
2. Fix the code
3. Verify test now passes
4. Run full suite to ensure no regressions
5. Commit: `fix(module): <description> (#issue_number)`

## Documentation

- Inline comments for "why" (not "what" — code should be self-documenting)
- Docstrings for public functions/classes (NumPy style for Python)
- Update `.github/prompts/` if decision affects future work
- Update `concepts/` if architectural insight is shared

## Deployment Readiness

Before moving to production:
- All tests passing with coverage report
- No console errors in browser dev tools
- Backend error logging shows no exceptions
- OSPARC proxy connectivity verified (if used)
- Environment variables documented in `.env.example`
