---
phase: 24-auth-token-lifecycle-end-to-end
plan: "01"
subsystem: auth
tags: [jwt, middleware, revocation, authorization, testing]
requires:
  - phase: 07-rate-limiting-helmet-token-revocation
    provides: token blocklist persistence and AuthService blocklist helpers
  - phase: 02-seguridad-de-autenticaci-n
    provides: router-level AuthMiddleware.verifyToken protection pattern
provides:
  - Canonical auth error envelope for 401/403 responses in middleware
  - Explicit middleware mapping for missing, revoked, expired, invalid token states
  - Regression tests for auth error contract and token expiration mapping
affects: [phase-24-plan-02, frontend-http-auth-handling, auth-error-consumers]
tech-stack:
  added: []
  patterns:
    - Canonical auth error payload with error.code/error.status/retryable
    - Middleware-level 401/403 normalization using buildAuthError helper
key-files:
  created:
    - src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts
  modified:
    - src/backend/src/middleware/AuthMiddleware.ts
    - src/backend/src/service/AuthService.ts
    - src/backend/src/__tests__/unit/services/AuthService.test.ts
key-decisions:
  - "Auth failures now use one middleware helper (buildAuthError) to prevent payload drift across 401/403 branches."
  - "TokenExpiredError is preserved in AuthService.verifyToken so middleware can map expired tokens to AUTH_TOKEN_EXPIRED instead of generic invalid token."
patterns-established:
  - "Auth contract pattern: { success:false, error:{ code, message, status, retryable } } for all authentication/authorization failures."
requirements-completed: [AUTH-06, AUTH-08]
duration: 5 min
completed: 2026-04-09
---

# Phase 24 Plan 01: Canonical Auth Error Contract Summary

**Auth middleware now enforces a single 401/403 error envelope with stable codes for missing/invalid/expired/revoked tokens and insufficient role scope.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-09T20:26:29Z
- **Completed:** 2026-04-09T20:31:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added RED tests that codify the canonical 401/403 auth error shape and key code values.
- Implemented `buildAuthError` in `AuthMiddleware` and replaced legacy flat `message` payloads.
- Differentiated expired-token vs invalid-token paths in `AuthService.verifyToken` and covered behavior with unit tests.

## Task Commits

Each task was committed atomically:

1. **Task 1: Crear pruebas RED para contrato canónico 401/403 (AUTH-08)** - `e0def9d6` (test)
2. **Task 2: Implementar helper de error auth + normalizar AuthMiddleware (AUTH-06, AUTH-08)** - `67a6d169` (feat)

## Files Created/Modified
- `src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts` - New middleware contract tests for AUTH_TOKEN_MISSING/REVOKED/EXPIRED/INVALID and AUTH_INSUFFICIENT_SCOPE.
- `src/backend/src/middleware/AuthMiddleware.ts` - Added canonical `buildAuthError` helper and normalized all 401/403 responses.
- `src/backend/src/service/AuthService.ts` - Preserved `TokenExpiredError` semantics for precise middleware mapping.
- `src/backend/src/__tests__/unit/services/AuthService.test.ts` - Added coverage ensuring expired token errors are surfaced distinctly.

## Decisions Made
- Use a private middleware helper (`buildAuthError`) as the single source of truth for auth failure payload shape.
- Keep `AuthService.verifyToken` signature unchanged while propagating expiration semantics via error name for compatibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial commit attempt failed because git user identity was not configured in the local repository. Resolved via checkpoint and continuation after local identity setup.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 24-01 deliverables are complete and verified. Phase 24 can proceed to 24-02 for refresh/logout end-to-end invalidation work on top of this canonical error contract.

## Self-Check: PASSED

- FOUND: `src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts`
- FOUND: `.planning/phases/24-auth-token-lifecycle-end-to-end/24-01-SUMMARY.md`
- FOUND commits: `e0def9d6`, `67a6d169`
