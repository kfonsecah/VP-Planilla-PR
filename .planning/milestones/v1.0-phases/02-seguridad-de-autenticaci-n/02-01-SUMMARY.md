---
phase: 02-seguridad-de-autenticaci-n
plan: 01
subsystem: backend-auth
tags: [security, authentication, middleware, routes]
dependency_graph:
  requires: []
  provides: [auth-protected-routes]
  affects: [all-api-endpoints]
tech_stack:
  added: []
  patterns: [router-level-auth-middleware]
key_files:
  modified:
    - src/backend/src/routes/EmployeeRoute.ts
    - src/backend/src/routes/PayrollRoutes.ts
    - src/backend/src/routes/BonusesRoute.ts
    - src/backend/src/routes/ClockLogsRoute.ts
    - src/backend/src/routes/DeductionsRoute.ts
    - src/backend/src/routes/EmployeeDeductionsRoute.ts
    - src/backend/src/routes/LaborEventsRoute.ts
    - src/backend/src/routes/NomineeRoute.ts
    - src/backend/src/routes/PaymentReceiptRoute.ts
    - src/backend/src/routes/PayrollTypeRoute.ts
    - src/backend/src/routes/PositionRoute.ts
    - src/backend/src/routes/VacationRoute.ts
    - src/backend/src/routes/AuditLogsRoute.ts
decisions:
  - "Used Pattern A (router.use) to match existing ReportsRoute.ts convention — cleaner and impossible to miss individual routes"
  - "Replaced local asyncHandler in EmployeeDeductionsRoute with shared import from utils/asyncHandler for consistency"
  - "Added asyncHandler wrapping to all PaymentReceiptRoute controller calls (were previously unwrapped)"
  - "Pre-existing TypeScript errors in controllers are out of scope and documented in deferred-items.md"
metrics:
  duration: ~15m
  completed_date: 2026-03-25
  tasks_completed: 1
  files_modified: 13
---

# Phase 02 Plan 01: Auth Middleware Application Summary

Apply `router.use(AuthMiddleware.verifyToken)` to all 13 previously unprotected Express route files so every non-public API endpoint requires a valid JWT Bearer token.

## What Was Built

Every API route except `/api/login`, `/api/validate`, and `/api/refresh` now requires a valid JWT. The pattern used is `router.use(AuthMiddleware.verifyToken)` at the top of each router, matching the existing `ReportsRoute.ts` implementation exactly.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add AuthMiddleware.verifyToken to 13 route files | 84641d0 | 13 route files |

## Changes Applied

### Standard Pattern (11 files)

Each file received two additions:
1. `import { AuthMiddleware } from "../middleware/AuthMiddleware";` — after existing imports
2. `router.use(AuthMiddleware.verifyToken);` — immediately after `const router = Router();`

Files: `EmployeeRoute.ts`, `PayrollRoutes.ts`, `BonusesRoute.ts`, `ClockLogsRoute.ts`, `DeductionsRoute.ts`, `LaborEventsRoute.ts`, `NomineeRoute.ts`, `PayrollTypeRoute.ts`, `PositionRoute.ts`, `VacationRoute.ts`, `AuditLogsRoute.ts`

### Special Case: EmployeeDeductionsRoute.ts

In addition to adding the AuthMiddleware import and `router.use()`:
- Removed the inline local `asyncHandler` function definition (lines 9-11 in original)
- Added `import { asyncHandler } from "../utils/asyncHandler";` to use the shared utility

### Special Case: PaymentReceiptRoute.ts

This file used `express.Router()` instead of `{ Router }` and had no `asyncHandler` wrapping. Changes made:
- Added `import { asyncHandler } from '../utils/asyncHandler';`
- Added `import { AuthMiddleware } from '../middleware/AuthMiddleware';`
- Added `router.use(AuthMiddleware.verifyToken);` after `const router = express.Router();`
- Wrapped all 4 controller calls with `asyncHandler(...)` (previously unwrapped — Rule 2: missing critical functionality for error propagation)

## Verification Results

```
grep -rc "AuthMiddleware.verifyToken" src/backend/src/routes/
AuditLogsRoute.ts:1
BonusesRoute.ts:1
ClockLogsRoute.ts:1
DeductionsRoute.ts:1
EmployeeDeductionsRoute.ts:1
EmployeeRoute.ts:1
LaborEventsRoute.ts:1
NomineeRoute.ts:1
PaymentReceiptRoute.ts:1
PayrollRoutes.ts:1
PayrollTypeRoute.ts:1
PositionRoute.ts:1
ReportsRoute.ts:1
VacationRoute.ts:1
```

All 13 target files: 1 occurrence each. ReportsRoute.ts: 1 (pre-existing). AuthRoute.ts and UserRoute.ts use per-route pattern (not router.use, also pre-existing and correct).

No local `asyncHandler` in EmployeeDeductionsRoute.ts: confirmed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added asyncHandler wrapping to PaymentReceiptRoute.ts controller calls**
- **Found during:** Task 1 — PaymentReceiptRoute special case review
- **Issue:** All 4 controller method registrations in PaymentReceiptRoute.ts were unwrapped. Async errors from these controllers would not propagate to Express error handler properly.
- **Fix:** Wrapped all 4 calls: `generateReceiptPDF`, `getReceiptData`, `getReceiptHTML`, `generateBatchReceipts` with `asyncHandler(...)`
- **Files modified:** `src/backend/src/routes/PaymentReceiptRoute.ts`
- **Commit:** 84641d0 (included in same commit)

## Pre-existing Issues (Out of Scope)

TypeScript errors exist in multiple controller files (`string | string[]` parameter mismatches, missing Employee fields) and `ReportsService.ts` (missing `@types/nodemailer`). These were present before this plan and are documented in `deferred-items.md`. They are not caused by the route file changes in this plan.

## Known Stubs

None — this plan applies middleware only. No data rendering or UI stubs.

## Self-Check: PASSED

- All 13 modified route files exist and contain `AuthMiddleware.verifyToken`
- Commit 84641d0 exists in git log
- EmployeeDeductionsRoute.ts has no local asyncHandler definition
- PaymentReceiptRoute.ts has asyncHandler on all 4 controller calls
