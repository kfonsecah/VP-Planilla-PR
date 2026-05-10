---
phase: 17-cobertura-tests-unitarios
plan: "01"
subsystem: backend-tests
tags: [testing, unit-tests, coverage, services]
dependency_graph:
  requires: []
  provides: [unit-tests-wave-1]
  affects: [coverage-baseline]
tech_stack:
  added: []
  patterns: [jest-mock-extended inline mock, Decimal chain mock, $disconnect finally mock]
key_files:
  created:
    - src/backend/src/__tests__/unit/services/VacationService.test.ts
    - src/backend/src/__tests__/unit/services/PayrollTypeService.test.ts
    - src/backend/src/__tests__/unit/services/PositionService.test.ts
    - src/backend/src/__tests__/unit/services/BonusesService.test.ts
    - src/backend/src/__tests__/unit/services/EmployeeDeductionsService.test.ts
  modified: []
decisions:
  - "Used inline jest.mock pattern (never prisma-mock.ts) per canonical pattern from EmployeeService.test.ts"
  - "Mocked Prisma Decimal as { toDecimalPlaces: (_) => ({ toNumber: () => 1500 }) } to support .toDecimalPlaces(2).toNumber() chain in PositionService"
  - "Added prisma.$disconnect.mockResolvedValue(undefined) in beforeEach for PayrollTypeService due to finally block"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_created: 5
---

# Phase 17 Plan 01: Unit Tests for 5 CRUD Services (Wave 1) Summary

**One-liner:** Added 48 unit tests across 5 CRUD service files covering VacationService, PayrollTypeService, PositionService, BonusesService, and EmployeeDeductionsService using inline jest-mock-extended pattern.

## What Was Built

Five new test files providing coverage for the five lowest-complexity, highest-uncovered-statement services in the backend:

| Test File | Tests | Key Branches Covered |
|---|---|---|
| VacationService.test.ts | 12 | P2021/does-not-exist swallow branch in getAllVacations |
| PayrollTypeService.test.ts | 9 | $disconnect finally block, error wrapping in createPayrollType |
| PositionService.test.ts | 11 | Prisma Decimal chain, version-mismatch null return in updatePosition |
| BonusesService.test.ts | 10 | null-guard paths in updateBonus and deleteBonus |
| EmployeeDeductionsService.test.ts | 6 | Composite unique key in removeDeductionFromEmployee |
| **Total** | **48** | |

## Coverage Delta

- **Baseline:** 31.59% statement coverage (104 tests)
- **After:** 35.21% statement coverage (152 tests)
- **Delta:** +3.62 percentage points, +48 tests

Note: Coverage target was ~44% but actual result is 35.21%. The gap is because these 5 services are small (low statement count) relative to larger uncovered services like NomineeService and PayrollService which have many more statements. Wave 2 plans targeting those larger services will push coverage higher.

## Decisions Made

1. **Inline mock pattern strictly followed** — all 5 files use `jest.mock('../../../lib/prisma', ...)` with `mockDeep<PrismaClient>()`, never importing from `prisma-mock.ts`.

2. **Decimal mock chain** — PositionService uses `prismaPosition.position_base_salary.toDecimalPlaces(2).toNumber()`. Mocked as `{ toDecimalPlaces: (_: number) => ({ toNumber: () => 1500.00 }) }` for the mock Prisma row.

3. **$disconnect mock** — PayrollTypeService.createPayrollType has `finally { await prisma.$disconnect() }`. Added `prisma.$disconnect.mockResolvedValue(undefined)` in `beforeEach` to prevent "not a function" errors from jest-mock-extended.

4. **EmployeeDeductions import path** — Service file is `EmployeeDeductions.ts` (no 'Service' suffix). Import uses `'../../../service/EmployeeDeductions'` while class is still `EmployeeDeductionsService`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all tests are fully wired to real service implementations through mocked Prisma.

## Self-Check: PASSED

Files created:
- src/backend/src/__tests__/unit/services/VacationService.test.ts — FOUND
- src/backend/src/__tests__/unit/services/PayrollTypeService.test.ts — FOUND
- src/backend/src/__tests__/unit/services/PositionService.test.ts — FOUND
- src/backend/src/__tests__/unit/services/BonusesService.test.ts — FOUND
- src/backend/src/__tests__/unit/services/EmployeeDeductionsService.test.ts — FOUND

Commit verified: 76cd0da — test(phase-17): add unit tests for 5 CRUD services (wave 1)

Full suite: 152 tests, 0 failures.
TypeScript: npx tsc --noEmit passes with no errors.
