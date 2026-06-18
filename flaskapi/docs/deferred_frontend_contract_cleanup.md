# Deferred Frontend Contract Cleanup Notes

This refactor intentionally keeps all existing frontend-facing request and response
contracts unchanged. The items below were identified as worthwhile cleanup targets,
but they are deferred to avoid breaking current frontend integration.

## Text file endpoints

- Standardize invalid JSON handling for `POST /flask/text-file/`.
  Today malformed JSON surfaces as a `500` response instead of a structured client error.
- Decide whether text-file storage location should be configurable through an explicit
  backend setting rather than relying on the fixed `/text-files` path.

## Naming consistency

- Align inconsistent field naming patterns across the backend without changing existing
  payloads in this refactor.
  Current examples include `funUid`, `FunctionJobs`, and mixed camelCase/snake_case usage.
- Define a single policy for when backend models should accept aliases versus when
  route handlers should translate names explicitly.

## Error payload consistency

- Standardize error response bodies across blueprints so clients can rely on a shared
  shape for validation errors, missing resources, and unexpected server failures.
- Review whether traceback details should ever be exposed in non-debug responses.

## Backend bootstrap and config

- Decide whether application startup should validate required environment/configuration
  earlier and fail fast with a structured health/readiness signal.
- Consider moving backend-owned filesystem paths behind app config so deployment-specific
  behavior is explicit and testable.

## Flask preprocessing of function API calls

Analysis of the data flow between the osparc SDK, the Flask proxy, and the frontend
(conducted 2026-06-16 against the `develop` branch).

### camelCase ↔ snake_case round-trip (net-zero transformation)

The biggest overhead is a pointless round-trip conversion:

1. `_get_all_items` in `utils/helpers.py` calls `recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1)`
   on every paginated item — converting osparc SDK camelCase → snake_case at the top level.
2. `normalizePayloadToCamelCase<T>()` in `node/src/utils/functionUtils.ts` then recursively
   converts everything back to camelCase before TypeScript code uses it.

**Net effect: zero.** The SDK's `to_dict()` already returns camelCase keys. The conversion layer
is vestigial. Removing both sides would be safe once verified against the `osparc-api-ts-client`
field names.

The comment in `helpers.py` ("TypeScript expects camelCase, but Python API is getting
snake_case") is misleading — the function converts in the *opposite* direction.

### Inconsistent conversion direction across endpoints

Not all endpoints apply the same conversion:
- Most list endpoints (`list_functions`, `list_jobs`, `list_function_job_collections_for_functionid`)
  apply camel→snake via `dict_keys_camel_to_snake` / `recursive_dict_keys_camel_to_snake`.
- `sampling.py:_run_sampling_map` uses `dict_keys_snake_to_camel` (sends camelCase directly).

This means `normalizePayloadToCamelCase` on the frontend does real work for the first group
but is a no-op for the second, hiding which representation is canonical.

### List reversal in `flask_list_functions`

```python
functions = functions[::-1]  # put last-created first?  FIXME...
```

A frontend sorting concern that leaked into the backend. No `created_at` field is currently
exposed to the frontend, so the reversal cannot be replaced by client-side sorting without
that field first being surfaced.

### N+1 status calls in `flask_list_function_jobs_for_functionid`

For each job returned by the list endpoint, a separate `function_job_status(uid)` call is
made. This may be unavoidable if the list endpoint does not return status, but it should be
revisited when the osparc API evolves.

### Recommended cleanup path

1. Verify that osparc SDK `to_dict()` keys match the `osparc-api-ts-client` field names.
2. Remove `recursive_dict_keys_camel_to_snake` calls from `_get_all_items` and the
   per-item call sites in `osparc.py`.
3. Remove `normalizePayloadToCamelCase` from `functionUtils.ts` (or scope it only to
   endpoints that genuinely return snake_case).
4. Expose `created_at` on functions so the `[::-1]` reversal can be moved to a client-side
   sort and then removed from the backend.
