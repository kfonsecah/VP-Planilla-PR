# Phase 8 — Tests Unitarios NomineeService

**Date:** 2026-03-27  
**Status:** ✅ VALIDATED — 42 tests passing, 0 failures

---

## 08-01: NomineeService.test.ts

**New file:** `src/backend/src/__tests__/unit/NomineeService.test.ts`

### Test coverage (9 tests)

| Test | REQ | Description |
|------|-----|-------------|
| Normal 8h/day | 8.1 | 6 days × 8h = 48 regular, 0 overtime |
| Overtime 1.5× | 8.2 | 6 days × 10h = 48 regular + 12 overtime |
| Overtime 2× | 8.3 | 6 days × 12h = 48 regular + 24 overtime |
| Weekly Rest | 8.4 | Period including Sunday → weeklyRestHours > 0 |
| Holiday Period | 8.5 | May 2026 → correct `scheduledHours = 96` (12 days × 8h) |
| CCSS Deduction | 8.6 | Deduction breakdown includes CCSS percentage |
| No clock logs | edge | Graceful handling → 0 hours |
| No employees | edge | Fallback message in summary |
| No position | edge | Warning message in generalMessages |

### Mock strategy

`calculateEmployeePayroll` is `private` — tested through `calculatePayrollForPeriod`. Mock chain:
1. `EmployeeService.getActiveEmployeesForPeriod` → mock employee array
2. `prisma.vpg_clock_logs.findMany` → clock log map
3. `prisma.vpg_positions.findMany` → positions map
4. `prisma.vpg_deductions_per_employee.findMany` → deductions map

Jest hoisting: use inline factory in `jest.mock()` + `jest.mocked()` in `beforeEach`.

### Timestamp generation (critical)

`makeClockLogPair` uses UTC-safe timestamps:
```typescript
function makeClockLogPair(date, localInHour, localOutHour, empId) {
  const UTC_OFFSET_HOURS = 6;
  const utcInHour = localInHour - UTC_OFFSET_HOURS;
  const utcOutHour = localOutHour - UTC_OFFSET_HOURS;
  const inDate = new Date(`${date}T${String(utcInHour).padStart(2,'0')}:00:00.000Z`);
  const outDate = new Date(`${date}T${String(utcOutHour).padStart(2,'0')}:00:00.000Z`);
  return [
    { timestamp: inDate.toISOString(), log_type: 'IN' },
    { timestamp: outDate.toISOString(), log_type: 'OUT' }
  ];
}
```
Using `inHour + 6` (wrong) creates invalid hours (24:00) for `outHour ≥ 18`.

---

## 08-02: PayrollService.test.ts — Mock Fixes

**File:** `src/backend/src/__tests__/unit/services/PayrollService.test.ts`

### Issue
`PayrollService.getAllPayrolls` uses `include: { vpg_payroll_employee: true }` and returns `total_*` aggregated fields. The mocks were missing both.

### Fixes applied
1. Added `vpg_payroll_employee: []` to all mock payroll records in `getAllPayrolls` tests
2. Updated `toHaveBeenCalledWith` assertion to include `include: { vpg_payroll_employee: true }`
3. Updated field mapping test expected output to include all `total_*` fields (zeros for empty employee arrays)

---

## Key lessons learned

### Jest mocking with hoisting
`jest.mock()` calls are hoisted to the top of the file BEFORE any other code. Variables defined before `jest.mock()` are NOT yet initialized when the factory runs. Solution: use inline factory in `jest.mock()` and `jest.mocked()` in `beforeEach`/`tests`.

### UTC date boundary in timestamp generation
`inHour + 6` produces `hour ≥ 24` for `outHour ≥ 18`. Invalid ISO hours (24:xx) cause `new Date()` to return `Invalid Date`. Fix: use `localHour - 6` to get the correct UTC hour.

### Holiday period test — timezone awareness
`countWorkingDaysInPeriod` + `isCRHoliday` use UTC methods consistently. In UTC-6, `new Date('2026-05-01')` = May 1 00:00 UTC = Apr 30 18:00 local. The period `May 1–15 UTC` maps to `Apr 30 18:00 – May 15 06:00 local`. The loop iterates over UTC dates Apr 30–May 14, giving 15 UTC days. May 1 (UTC date = "05-01") IS excluded as a holiday. Correct count: 12 working days (15 - 2 Sundays - 1 May 1 holiday = 12).

### `calculateEmployeePayroll` is private
Cannot call directly in tests. Must test through `calculatePayrollForPeriod` (public instance method). Instantiate with `new NomineeService()`.

---

## Validation

| Check | Command | Result |
|-------|---------|--------|
| `npm test` | 42 passed, 0 failures | ✅ |
| `npx tsc --noEmit` | Pre-existing 27 controller errors only (Phase 8 scope: 0 new errors) | ✅ |
| NomineeService test file exists | `ls NomineeService.test.ts` | ✅ |
| REQ 8.1–8.6 covered | All 6 requirements covered | ✅ |
| PayrollService mocks fixed | `npm test` PayrollService.test.ts: 8 passed | ✅ |
