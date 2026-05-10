---
phase: 17-cobertura-tests-unitarios
plan: "02"
subsystem: backend-tests
tags: [testing, unit-tests, coverage, services]
dependency_graph:
  requires: [unit-tests-wave-1]
  provides: [unit-tests-wave-2]
  affects: [coverage-moderate-services]
tech_stack:
  added: []
  patterns: [jest-mock-extended inline mock, Promise.all dual mock, catch-returns-null pattern]
key_files:
  created:
    - src/backend/src/__tests__/unit/services/LaborEventsService.test.ts
    - src/backend/src/__tests__/unit/services/UserService.test.ts
    - src/backend/src/__tests__/unit/services/NotificationService.test.ts
  modified:
    - src/backend/src/__tests__/unit/NomineeService.test.ts
decisions:
  - "NotificationType in mock changed from 'info' to 'system' to match the union type in model/Notification.ts"
  - "NomineeService fallback test updated to verify the warning message instead of empty employees array — the service falls back to getAllEmployees() rather than returning empty when getActiveEmployeesForPeriod returns []"
  - "PayrollSummary does not have totalGrossPay/totalNetPay fields — test assertions adjusted to use employeesProcessed and messages fields from the actual interface"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 17 Plan 02: Unit Tests for Moderate Complexity Services (Wave 2) Summary

**One-liner:** Added 39 unit tests across 3 new service test files and extended NomineeService.test.ts, covering LaborEventsService (dual-table + catch-returns-null), UserService (audit log conditional), NotificationService (Promise.all pagination + ownership guards), and NomineeService fallback path.

## What Was Built

Three new test files and one extended file covering the moderate-complexity services:

| Test File | Tests | Key Branches Covered |
|---|---|---|
| LaborEventsService.test.ts | 15 | vpg_employee_labor_event nested include, null vpg_labor_events relation, deleteEmployeeLaborEvent catch-returns-null |
| UserService.test.ts | 10 | updatePermissions with/without actorId (audit log conditional), invalid role 400, user not found 404, null middle_name full name |
| NotificationService.test.ts | 13 | Promise.all([findMany, count]) pagination, markAsRead null-guard (update not called), deleteNotification ownership check |
| NomineeService.test.ts (appended) | 1 | calculatePayrollForPeriod fallback to getAllEmployees when no active employees, warning message assertion |
| **Total** | **39** | |

## Coverage Delta

- **Before:** 35.21% statement coverage (152 tests)
- **After:** 38.59% statement coverage (191 tests)
- **Delta:** +3.38 percentage points, +39 tests

**Note on 60% target:** The phase 60% target was not achieved by Wave 2. These 4 service files, while more complex than Wave 1, still represent a small fraction of total statements relative to the full codebase. Larger uncovered areas include: all route files, all controller files, middleware, and PayrollService. Wave 3 or additional plans targeting those larger files will be needed to cross 60%.

## Decisions Made

1. **NotificationType union fix** — The mock used `'info'` but `CreateNotificationInput.type` is typed as `NotificationType` which does not include `'info'`. Changed to `'system'` which is a valid member of the union.

2. **PayrollSummary interface mismatch** — Initial NomineeService append test used `totalGrossPay` and `totalNetPay` fields that do not exist on `PayrollSummary`. Corrected to use `employeesProcessed` and `messages` per the actual interface in `src/backend/src/types/payroll.types.ts`.

3. **NomineeService fallback logic** — The service does NOT return empty `employees` when `getActiveEmployeesForPeriod` returns `[]`. Instead it falls back to `getAllEmployees()` and processes those employees. When `getAllEmployees` also returns `[]`, it processes 0 employees but adds a Spanish warning message. Test was updated to verify the message rather than empty employee array.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NotificationType 'info' not in union**
- **Found during:** Task 2.2, first test run
- **Issue:** Mock used `type: 'info'` but `NotificationType` union only includes `'payroll_generated' | 'payment_processed' | 'employee_action' | 'system' | 'report_generated'`
- **Fix:** Changed mock and test input to use `'system'` as the type value
- **Files modified:** `NotificationService.test.ts`

**2. [Rule 1 - Bug] PayrollSummary fields totalGrossPay/totalNetPay don't exist**
- **Found during:** Task 2.2, first test run on NomineeService
- **Issue:** Plan described asserting `result.summary.totalGrossPay === 0` but `PayrollSummary` interface only has `employeesProcessed`, `employeesWithInconsistencies`, and `messages`
- **Fix:** Removed invalid field assertions, replaced with `employeesProcessed` and message content check
- **Files modified:** `NomineeService.test.ts`

**3. [Rule 1 - Bug] NomineeService fallback does not return empty employees**
- **Found during:** Task 2.2, second test run on NomineeService
- **Issue:** Plan said to verify `result.employees` is an empty array for fallback path. The service actually falls back to `getAllEmployees()` and processes those, only returning empty if `getAllEmployees()` also returns `[]`
- **Fix:** Updated test to mock `getAllEmployees` returning `[]` and assert on the warning message instead of empty employees
- **Files modified:** `NomineeService.test.ts`

## Known Stubs

None — all tests are fully wired to real service implementations through mocked Prisma.

## Self-Check

Files created:
- `src/backend/src/__tests__/unit/services/LaborEventsService.test.ts` — FOUND
- `src/backend/src/__tests__/unit/services/UserService.test.ts` — FOUND
- `src/backend/src/__tests__/unit/services/NotificationService.test.ts` — FOUND
- `src/backend/src/__tests__/unit/NomineeService.test.ts` — FOUND (extended)

Commit: caddab4 — test(phase-17): add unit tests for moderate complexity services (wave 2)

Full suite: 191 tests, 0 failures.
TypeScript: npx tsc --noEmit passes with no errors.

## Self-Check: PASSED
