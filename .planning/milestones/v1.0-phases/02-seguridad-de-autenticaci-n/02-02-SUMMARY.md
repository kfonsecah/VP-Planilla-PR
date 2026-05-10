---
phase: 02-seguridad-de-autenticaci-n
plan: 02
subsystem: backend-security
tags: [security, auth, jwt, payroll, cleanup]
dependency_graph:
  requires: []
  provides: [jwt-startup-assertion, body-only-credentials, correct-error-throws]
  affects: [src/backend/src/index.ts, src/backend/src/controller/AuthController.ts, src/backend/src/service/PayrollService.ts]
tech_stack:
  added: []
  patterns: [startup-env-assertion, body-only-login, proper-error-throwing]
key_files:
  modified:
    - src/backend/src/index.ts
    - src/backend/src/controller/AuthController.ts
    - src/backend/src/service/PayrollService.ts
    - .gitignore
  deleted:
    - parse_tmp.js
    - temp_script.py
    - test_hours.js
    - src/backend/check_employee.ts
    - src/backend/query_emp.mjs
decisions:
  - "Used process.exit(1) immediately after dotenv.config() so the assertion runs before any route or middleware setup"
  - "Removed req.query fallback entirely — existing body validation (lines 23-38) already handles missing credentials"
  - "Deleted bad console.error import; replaced throw error() with throw new Error() for proper Error object propagation"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 4
  files_deleted: 5
---

# Phase 02 Plan 02: Security Surgical Fixes Summary

JWT startup assertion, body-only login credentials, fixed throw-undefined bug in PayrollService, and deleted 5 debug scripts from the repo.

## Objective

Fix four surgical security and correctness issues: JWT startup assertion, login query-param removal, PayrollService throw-undefined bug, and temp file cleanup.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | JWT assertion + remove req.query login fallback | 8189a80 | src/backend/src/index.ts, AuthController.ts |
| 2 | Fix throw undefined + delete temp files + gitignore | 8189a80 | PayrollService.ts, .gitignore, 5 deleted files |

## Changes Made

### Task 1: JWT_SECRET Startup Assertion (REQ 2.3)

Added 4-line assertion in `src/backend/src/index.ts` immediately after `dotenv.config()`:

```typescript
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
  process.exit(1);
}
```

Server now refuses to start without `JWT_SECRET` in the environment — eliminates the fallback-secret risk (known tech debt item #6).

### Task 1: Remove req.query Login Fallback (REQ 2.4)

In `AuthController.ts` lines 13-14, removed `|| req.query.username as string` and `|| req.query.password as string`. Credentials now read exclusively from `req.body`. The existing validation (lines 23-38) already handles missing/empty credentials correctly.

### Task 2: Fix PayrollService throw-undefined (REQ 2.6)

- Deleted line 3: `import { error } from "console";` — this was importing Node's `console.error` as `error`, making `throw error(...)` throw `undefined` instead of an Error object
- Changed `throw error("Payroll not found")` to `throw new Error('Payroll not found')` — now throws a proper Error with a message

### Task 2: Delete Temp Files (REQ 2.5)

Deleted 5 debug/temporary scripts:
- `parse_tmp.js` (root)
- `temp_script.py` (root)
- `test_hours.js` (root)
- `src/backend/check_employee.ts`
- `src/backend/query_emp.mjs`

Added gitignore block to prevent re-committing these patterns:
```
# Temp/debug scripts — do not commit
parse_tmp.js
temp_script.py
test_hours.js
check_employee.ts
query_emp.mjs
*.tmp.js
*.tmp.ts
```

## Deviations from Plan

### Pre-existing Issues Logged (not fixed — out of scope)

**1. [Deferred] Pre-existing TypeScript errors in 9 controller files**
- Found during: tsc --noEmit verification
- Issue: `string | string[]` not assignable to `string` for req.query params in unmodified controllers; EmployeeController missing required fields
- Action: Logged to deferred-items.md — not caused by this plan
- Files affected: AuditLogsController, BonusesController, DeductionsController, EmployeeController, LaborEventsController, PaymentReceiptController, PayrollTypesController, PositionController, VacationController

**2. [Deferred] Missing @types/nodemailer in ReportsService.ts**
- Pre-existing — not caused by this plan
- Fix: `npm i --save-dev @types/nodemailer`

**3. [Deferred] PayrollService test failures for getAllPayrolls**
- Pre-existing test/implementation mismatch — 2 tests fail because tests were written against an older `getAllPayrolls` that did not include employee aggregations
- Not caused by this plan's changes (updatePayroll method was fixed, getAllPayrolls untouched)

All deviations are pre-existing — plan executed exactly as written for in-scope changes.

## Decisions Made

1. Placed JWT assertion immediately after `dotenv.config()` and before `const app = express()` — ensures the assertion runs before any route mounting or middleware setup
2. Removed req.query fallback entirely rather than adding a warning — the existing body validation already provides appropriate 400 error responses
3. Removed the entire `import { error } from "console"` line and replaced the call site with `throw new Error(...)` — minimal surgical change, no other code depends on that import

## Known Stubs

None — all changes are correctness/security fixes with no stub patterns introduced.

## Self-Check: PASSED

- [x] src/backend/src/index.ts exists and contains `process.exit(1)` after JWT_SECRET check
- [x] src/backend/src/controller/AuthController.ts contains no `req.query` references
- [x] src/backend/src/service/PayrollService.ts contains `throw new Error` and no `import { error }`
- [x] .gitignore contains `parse_tmp.js` entry
- [x] 5 temp files deleted and absent from filesystem
- [x] Commit 8189a80 exists
