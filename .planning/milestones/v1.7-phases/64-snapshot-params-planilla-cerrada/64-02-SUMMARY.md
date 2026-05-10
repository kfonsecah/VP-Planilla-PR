# Plan 64-02 Summary — Snapshot Capture + API Endpoint

## What was built

- **PayrollService.approvePayroll**: modified to capture a param snapshot atomically inside `prisma.$transaction([createMany, update])` at approval time.
  - Fetches all active legal params via `LegalParamService.getActiveParams(payroll.payrolls_period_start)` (period start, not today).
  - Fetches enterprise config (`enterprise_minute_rounding_policy`, `enterprise_ordinary_shift_type`, `enterprise_is_commercial_activity`).
  - Writes all params + 3 ENTERPRISE_* keys with `skipDuplicates: true`.
- **PayrollService.getPayrollWithSnapshot**: new method returning `{ payroll: Payroll, snapshot: ParamSnapshot[] }` with `param_value` serialized as string.
- **PayrollController.getPayrollSnapshot**: new static method delegating to `getPayrollWithSnapshot`.
- **GET /payroll/:id/snapshot**: registered in `PayrollRoutes.ts` with Swagger JSDoc; covered by global `AuthMiddleware.verifyToken`.
- **Tests**: added snapshot capture tests (`createMany` called with `skipDuplicates`, `getActiveParams` receives `period_start`) and `getPayrollWithSnapshot` tests (all 26 PayrollService tests pass).

## Key Technical Decisions

- Used array-overload `prisma.$transaction([op1, op2])` — snapshot createMany goes first, status update second. If snapshot fails, status is not updated (atomicity).
- `skipDuplicates: true` prevents duplicate rows on re-approval after reopen.
- `param_value.toString()` in `getPayrollWithSnapshot` normalizes Decimal to string for API consumers.
- Fixed pre-existing approvePayroll test to mock all new dependencies added by PAY-29.

## Verification

- `npx tsc --noEmit` → exit 0
- `npx jest --testPathPattern="PayrollService.test"` → 26/26 passed
