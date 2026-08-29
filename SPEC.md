# SPEC: watch-ITISFoundation-mmux_vite-pr-e0f8b95380f92719d66fecf335d2bb36c2189656

## §G

Fix PR #560 in ITISFoundation/mmux_vite. The SuMo read-only e2e test was failing because it attempted to scope the `qoi-select` locator to the `sumo-validation-view`, but the QoI selector had been moved to the `Header` component in the plot workflow.

## §C

- C1 scope: fix PR #560 e2e test failures.
- C2 repo: https://github.com/ITISFoundation/mmux_vite

## §V

- V1 MUST NOT edit `.github/workflows/`.
- V2 MUST NOT implement tasks other than this work item.

## §T

```
id  | st | desc                    | cites
T0  | x  | check mergeable state; rebase PR #560 if CONFLICTING | V3
T1  | x  | fix PR #560: update qoi-select locator for SuMo workflow | V1,V2
```
