# 54-02 SUMMARY: Backend API Extensions

## Status: ✅ Complete

## Files Modified

| File | Changes |
|------|---------|
| `src/backend/src/schemas/PayrollSchema.ts` | Added `calculatePayrollSchema` + `employeeOverrideSchema` |
| `src/backend/src/service/NomineeService.ts` | Extended `calculatePayrollForPeriod()` with `selectedEmployeeIds?` param |
| `src/backend/src/controller/NomineeController.ts` | Extract `selectedEmployeeIds` from body, pass as 4th arg |
| `src/backend/src/routes/NomineeRoute.ts` | Added `validateBody(calculatePayrollSchema)` to calculate-payroll route |
| `src/backend/src/service/PayrollService.ts` | Added `saveEmployeeOverride()` static method |
| `src/backend/src/controller/PayrollController.ts` | Added `saveEmployeeOverride()` static handler |
| `src/backend/src/routes/PayrollRoutes.ts` | Added `PATCH /payroll/:id/employee/:empId/override` route |

## New API Surface

### POST /nominee/calculate-payroll (extended)
- Now accepts `selectedEmployeeIds?: number[]`
- When provided: filters calculation to only those employee IDs
- When absent: uses existing `getActiveEmployeesForPeriod()` logic (backward compatible)
- Zod validation via `calculatePayrollSchema`

### PATCH /payroll/:id/employee/:empId/override (new)
- BORRADOR state guard: returns 400 if payroll not in draft
- Employee membership guard: returns 400 if employee not in this payroll
- 24-hour guard: regularHours + overtimeHours <= 24
- Sets `payroll_employee_is_manually_adjusted = true`
- Writes to override columns AND updates actual hours/deductions columns
- Recalculates `net_salary = max(0, gross_salary - new_deductions)`
- Zod validation via `employeeOverrideSchema`

## TypeScript Status
- `npx tsc --noEmit` in `src/backend/`: **exit 0** ✅

## Deviations
- Fixed TS2345 error: `req.params.id` typed as `string | string[]` in Express — wrapped with `String()` cast.

## Security (from threat model)
- T-54-03: selectedEmployeeIds coerced to Number; DB filters naturally limit scope
- T-54-04: PATCH route covered by `router.use(AuthMiddleware.verifyToken)` at top of PayrollRoutes.ts
- T-54-05: Hours guard in Zod schema + service layer (double validation)
- T-54-06: BORRADOR check in service before any DB write
- T-54-07: `findFirst({ payroll_id + employee_id })` validates membership
