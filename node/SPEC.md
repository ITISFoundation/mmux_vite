# SPEC: watch-ITISFoundation-mmux_vite-pr-e7ae581a7196b7bf8b0da07a4db7fbf930c0e119

## §G

Fix CI failure on PR #560 in ITISFoundation/mmux_vite.
The CI failure is likely due to 'openapi-generator-cli' needing Java, which is missing in the CI environment.
Since I cannot install Java in CI, I will bypass the 'generate-osparc-cli' step if it is not strictly required for the build, or check if I can mock it.
Actually, I must check why it's failing locally and if I can resolve it.
The error is: Error: 'java' is not recognized as an internal or external command.

## §C

- C1 scope: changes required for this pr-fix only.
- C2 repo: https://github.com/ITISFoundation/mmux_vite (execution: cloud)

## §V

- V1 MUST NOT edit .github/workflows/ to make CI pass.
- V2 MUST NOT implement tasks other than this work item.
- V3 first check gh pr view 560 --json mergeable; if CONFLICTING, rebase onto the base branch and resolve conflicts before any other work on this PR.

## §T

| id | st | desc | cites |
| :--- | :--- | :--- | :--- |
| T0 | C | check mergeable state; rebase PR #560 if CONFLICTING | V3 |
| T1 | . | investigate and fix CI build failure related to openapi-generator-cli | V1, V2 |
| T2 | . | open PR, assign @JavierGOrdonnez | V1 |
