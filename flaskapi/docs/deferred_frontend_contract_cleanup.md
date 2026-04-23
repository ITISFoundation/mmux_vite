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
