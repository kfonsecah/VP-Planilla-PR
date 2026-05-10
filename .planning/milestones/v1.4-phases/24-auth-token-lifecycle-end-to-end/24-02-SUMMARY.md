---
phase: 24-auth-token-lifecycle-end-to-end
plan: "02"
subsystem: auth
tags: [jwt, refresh-token, logout, revocation, middleware, integration-testing]
requires:
  - phase: 24-auth-token-lifecycle-end-to-end
    provides: canonical 401/403 auth error envelope and middleware revocation enforcement from 24-01
  - phase: 07-rate-limiting-helmet-token-revocation
    provides: token blocklist persistence model and service pattern
provides:
  - Functional /api/refresh endpoint that validates refresh_token and issues a new access token
  - Durable logout invalidation with controlled handling for expired/invalid tokens and idempotent blocklist behavior
  - End-to-end lifecycle integration test coverage for login → refresh → logout → token reuse denial
affects: [phase-24-plan-03, frontend-http-auth-lifecycle, auth-session-hardening]
tech-stack:
  added: []
  patterns:
    - Controller-level canonical auth error envelope reuse for refresh/logout failures
    - Service-level reusable access token issuance helper for refresh flow
    - Idempotent token revocation write pattern to prevent duplicate-logout crashes
key-files:
  created:
    - src/backend/src/__tests__/integration/auth.lifecycle.test.ts
  modified:
    - src/backend/src/controller/AuthController.ts
    - src/backend/src/service/AuthService.ts
    - src/backend/src/middleware/AuthMiddleware.ts
key-decisions:
  - "Refresh remains a public endpoint, but now requires refresh_token presence + verification + user resolution before issuing a new access token."
  - "Logout keeps middleware protection and adds graceful handling for already-expired/duplicate-revoked tokens to guarantee no 500 crash path."
patterns-established:
  - "Auth lifecycle integration pattern: test login, refresh, logout, and post-logout reuse denial in one deterministic suite."
  - "Token issuance pattern: use AuthService.issueAccessToken helper instead of duplicating sign logic in controllers."
requirements-completed: [AUTH-07, AUTH-06]
duration: 6 min
completed: 2026-04-09
---

# Phase 24 Plan 02: Refresh/Logout Backend Lifecycle Summary

**Backend auth lifecycle now issues real refresh tokens responses and enforces server-side logout revocation that blocks old token reuse end-to-end.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T20:44:13Z
- **Completed:** 2026-04-09T20:50:46Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added integration lifecycle tests covering login → refresh → logout → reuse denied (401 revoked) plus idempotent second logout behavior.
- Replaced refresh placeholder logic with real `refresh_token` validation, user lookup, and new access token issuance.
- Hardened logout revocation path and made blocklist insert idempotent to avoid duplicate-token crashes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Definir pruebas de ciclo auth lifecycle (AUTH-07)** - `5f7bd05d` (test)
2. **Task 2: Implementar refresh real y reforzar logout server-side (AUTH-07, AUTH-06)** - `bf2f526c` (feat)

## Files Created/Modified
- `src/backend/src/__tests__/integration/auth.lifecycle.test.ts` - Integration lifecycle regression suite for refresh/logout invalidation.
- `src/backend/src/controller/AuthController.ts` - Real refresh implementation and controlled logout error handling.
- `src/backend/src/service/AuthService.ts` - Reusable `issueAccessToken` helper, typed token verification, and idempotent blocklist insert handling.
- `src/backend/src/middleware/AuthMiddleware.ts` - Static helper invocation fix for canonical auth error mapping.

## Decisions Made
- Keep `/api/refresh` public while enforcing strict refresh token validation and canonical auth error payloads.
- Treat duplicate logout revocation attempts as controlled behavior (200/401), never an internal server failure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed static-context auth error helper calls in middleware**
- **Found during:** Task 2 (verification run for refresh/logout lifecycle)
- **Issue:** `AuthMiddleware.verifyToken` used `this.buildAuthError`; when passed as route callback, `this` became undefined and produced runtime `TypeError`, breaking revoked-token path.
- **Fix:** Replaced all `this.buildAuthError(...)` usages with `AuthMiddleware.buildAuthError(...)` in middleware methods.
- **Files modified:** `src/backend/src/middleware/AuthMiddleware.ts`
- **Verification:** `npm test -- auth.lifecycle.test.ts AuthService.test.ts --runInBand` passed; lifecycle test now reaches expected 401 revoked response.
- **Committed in:** `bf2f526c` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix was required for correctness and to satisfy AUTH-06/AUTH-07 enforcement without runtime auth middleware failures.

## Issues Encountered

- None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- `src/backend/src/controller/AuthController.ts:309` — `changePassword` still returns "pendiente implementar" placeholder response. This stub is pre-existing and out of scope for plan 24-02 (refresh/logout lifecycle), and does not block AUTH-06/AUTH-07 outcomes.

## Next Phase Readiness

Phase 24 can proceed to 24-03 to align frontend auth lifecycle (`http.ts` single-flight refresh/logout) against the now-functional backend refresh/logout contract.

## Self-Check: PASSED

- FOUND: `src/backend/src/__tests__/integration/auth.lifecycle.test.ts`
- FOUND: `.planning/phases/24-auth-token-lifecycle-end-to-end/24-02-SUMMARY.md`
- FOUND commits: `5f7bd05d`, `bf2f526c`
