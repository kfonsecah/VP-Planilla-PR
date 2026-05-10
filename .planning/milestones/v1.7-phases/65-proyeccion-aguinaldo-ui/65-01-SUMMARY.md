---
phase: 65-proyeccion-aguinaldo-ui
plan: 65-01
subsystem: backend
tags: [aguinaldo, service, bulk-query, tdd]
dependency_graph:
  requires: []
  provides: [AguinaldoService]
  affects: [PayrollService]
tech_stack:
  added: []
  patterns: [groupBy, tdd, bulk-optimization]
key_files:
  created:
    - src/backend/src/model/AguinaldoAccrual.ts
    - src/backend/src/service/AguinaldoService.ts
    - src/backend/src/__tests__/unit/services/AguinaldoService.test.ts
  modified:
    - src/backend/src/service/PayrollService.ts
decisions:
  - Used groupBy in getAguinaldoSummaryForPayroll to prevent N+1 queries when calculating aguinaldo projection for an entire payroll list.
  - Aligned fiscal year logic (Dec 1 - Nov 30) with Costa Rica Labor Law.
metrics:
  duration: 25m
  completed_date: 2026-04-29T22:50:00Z
---

# Phase 65 Plan 01: AguinaldoService Summary

Bulk-optimized AguinaldoService with full unit tests and TDD compliance.

## Key Changes

### Backend
- **AguinaldoAccrual Model**: Defined `AguinaldoAccrual` and `AguinaldoSummaryRow` interfaces.
- **AguinaldoService**:
    - `calculateAccruedAguinaldo`: Calculates accrued aguinaldo for a single employee considering the Dec-Nov fiscal period.
    - `getAguinaldoSummaryForPayroll`: Uses `prisma.vpg_payroll_employee.groupBy` to fetch all prior salaries for multiple employees in a single query, providing significant performance benefits for payroll views.
- **PayrollService**: Marked `calculateAguinaldo` as `@deprecated` to favor the new service.

### Testing
- **TDD Cycle**:
    - **RED**: Created tests for fiscal year rollover, `BORRADOR` exclusion, and bulk query structure.
    - **GREEN**: Implemented service logic to pass all tests.
- **Test Coverage**:
    - Dec 1 rollover boundary cases.
    - Accrual calculation (sum / 12).
    - GroupBy bulk optimization verification.

## Deviations from Plan

None - plan executed exactly as written.

## Test Results

```
 PASS  src/__tests__/unit/services/AguinaldoService.test.ts
  AguinaldoService
    calculateAccruedAguinaldo
      √ should handle fiscal year rollover (Dec 1 boundary) (2 ms)
      √ should exclude BORRADOR payrolls from calculation
      √ should correctly sum gross salaries and calculate accrued (gross / 12) (6 ms)
    getAguinaldoSummaryForPayroll
      √ should use bulk query (groupBy) to fetch prior accruals (2 ms)
```

## TDD Gate Compliance
- `test(65-01)` commit: `50fa910` (RED)
- `feat(65-01)` commit: `d1d8107` (GREEN)

## Self-Check: PASSED
