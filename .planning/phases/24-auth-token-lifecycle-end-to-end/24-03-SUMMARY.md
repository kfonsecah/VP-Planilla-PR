---
phase: 24-auth-token-lifecycle-end-to-end
plan: "03"
subsystem: auth
tags: [frontend, http-client, refresh-token, logout, jest, nextjs]
requires:
  - phase: 24-auth-token-lifecycle-end-to-end
    provides: canonical auth error envelope and backend refresh/logout lifecycle behavior from 24-01 and 24-02
provides:
  - Frontend auth calls fully centralized through shared http transport layer
  - Single-flight refresh orchestration with retry-once semantics for concurrent 401 flows
  - Deterministic client-side logout cleanup for vp_access_token/vp_refresh_token with auth failure callback coverage
affects: [phase-25-http-client-layer-enforcement, auth-session-resilience, frontend-error-handling]
tech-stack:
  added: []
  patterns:
    - Shared transport-only auth API access via http.get/http.post
    - Single-flight refresh promise lock to avoid concurrent refresh stampede
    - Auth 401 handling guided by error.code with backward-compatible fallback behavior
key-files:
  created:
    - src/frontend/src/__tests__/services/http.auth.test.ts
    - src/frontend/src/__tests__/hooks/useAuth.logout.test.tsx
  modified:
    - src/frontend/src/services/http.ts
    - src/frontend/src/services/authService.ts
    - src/frontend/jest.config.js
key-decisions:
  - "Refresh no longer depends on AuthService recursion; http.ts now owns refresh POST and coordinates all retry logic in one place."
  - "Auth error interpretation prioritizes error.code (AUTH_TOKEN_EXPIRED/AUTH_TOKEN_INVALID) while retaining fallback for legacy payloads without code."
patterns-established:
  - "Frontend auth lifecycle pattern: central transport handles token storage, refresh lock, retry, and forced logout callback."
requirements-completed: [AUTH-05, AUTH-07, AUTH-08]
duration: 10 min
completed: 2026-04-09
---

# Phase 24 Plan 03: Frontend Auth Lifecycle Hardening Summary

**Frontend auth transport now performs single-flight token refresh with deterministic logout/token cleanup and all auth service calls routed through the shared `http.ts` layer.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-09T21:05:53Z
- **Completed:** 2026-04-09T21:16:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added focused frontend tests for refresh single-flight behavior, retry-once semantics, and forced auth-failure cleanup.
- Removed direct `fetch` bypasses from `authService.ts`, delegating login/me/logout/validate/refresh/change-password via shared `http` client methods.
- Hardened `http.ts` with in-flight refresh locking and auth error-code-aware 401 handling to keep session behavior consistent under concurrency.

## Task Commits

Each task was committed atomically:

1. **Task 1: Escribir pruebas frontend para refresh single-flight y logout completo (AUTH-05, AUTH-07)** - `8980f081` (test)
2. **Task 2: Eliminar bypass fetch en authService y endurecer http/useAuth para contrato auth (AUTH-05, AUTH-08)** - `5cb5370a` (feat)

## Files Created/Modified
- `src/frontend/src/__tests__/services/http.auth.test.ts` - Verifies concurrent 401 single-flight refresh, retry-once flow, and token cleanup callback behavior.
- `src/frontend/src/__tests__/hooks/useAuth.logout.test.tsx` - Verifies logout clears `vp_access_token`/`vp_refresh_token`, resets local auth state, and redirects to `/auth`.
- `src/frontend/src/services/http.ts` - Adds shared refresh in-flight promise lock, canonical `error.code` parsing, and one-shot auth-failure callback handling.
- `src/frontend/src/services/authService.ts` - Removes raw fetch usage and delegates all auth endpoints through `http.ts`.
- `src/frontend/jest.config.js` - Corrects Next Jest import so targeted frontend tests run reliably.

## Decisions Made
- Keep refresh orchestration completely inside `http.ts` to avoid circular/recursive auth-service dependency and guarantee single transport path.
- Preserve public `AuthService` method signatures for compatibility while internally ignoring token arguments now that authorization headers are centrally attached by `http.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed frontend Jest config import to unblock TDD RED execution**
- **Found during:** Task 1 (initial RED test run)
- **Issue:** `nextJest is not a function` due to incorrect destructured import in `src/frontend/jest.config.js`, which blocked all targeted test execution.
- **Fix:** Updated config to use `const nextJest = require('next/jest');` so Next/Jest factory initializes correctly.
- **Files modified:** `src/frontend/jest.config.js`
- **Verification:** `npm test -- http.auth.test.ts useAuth.logout.test.tsx --runInBand` runs and executes both suites.
- **Committed in:** `8980f081` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary to execute the planned TDD workflow; no scope creep introduced.

## Issues Encountered

- `npx next lint` reports two pre-existing warnings in unrelated test files (`page.test.tsx`, `clockLogsService.test.ts`). These are out of scope and non-blocking for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 24 is now complete (3/3 plans). Frontend and backend auth lifecycle contracts are aligned, and work can proceed to Phase 25 for broader HTTP client layer enforcement.

## Self-Check: PASSED

- FOUND: `.planning/phases/24-auth-token-lifecycle-end-to-end/24-03-SUMMARY.md`
- FOUND commits: `8980f081`, `5cb5370a`
