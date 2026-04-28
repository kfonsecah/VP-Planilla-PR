---
phase: 60-advertencia-tarifa-minima
reviewed: 2025-03-05T16:45:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/backend/src/service/PayrollService.ts
  - src/frontend/src/services/legalParamService.ts
  - src/frontend/src/hooks/usePayrollWizard.ts
  - src/frontend/src/app/pages/payroll/wizard/page.tsx
  - src/frontend/src/hooks/useLegalParamConfig.ts
  - src/frontend/src/app/pages/configuracion/empresa/page.tsx
findings:
  critical: 3
  warning: 1
  info: 1
  total: 5
status: issues_found
---

# Phase 60: Code Review Report

**Reviewed:** 2025-03-05
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

The implementation of the Minimum Wage Warning (Phase 60) contains critical logic errors in salary comparison and an API contract mismatch between the frontend and backend. Specifically, the system compares monthly salaries directly with hourly minimum wage rates, which will cause the validation to fail silently (no warnings will ever be triggered). Additionally, the legal parameter update mechanism on the frontend calls a non-existent `PATCH` endpoint with an incomplete payload.

## Critical Issues

### CR-01: Incompatible Units in Minimum Wage Comparison

**File:** `src/backend/src/service/PayrollService.ts:251` and `src/frontend/src/app/pages/payroll/wizard/page.tsx:327`
**Issue:** The logic compares `position_base_salary` (which represents the **monthly** salary in CRC, e.g., 400,000) directly with `GLOBAL_MIN_WAGE_RATE` (which is an **hourly** rate, default 1,529.62). 
Since 400,000 is always greater than 1,529.62, the check `salary < minWageRate` will always be false, making the audit and warning system useless.
**Fix:** Convert the monthly salary to an hourly rate before comparison using the standard formula (Salary / 30 / 8).

```typescript
// Backend Fix in PayrollService.ts
const hourlyBaseSalary = Number(pe.vpg_employees.vpg_positions.position_base_salary) / 30 / 8;
const isUnderpaid = hourlyBaseSalary < minWageRate;
```

### CR-02: API Contract Mismatch for Legal Parameters

**File:** `src/frontend/src/services/legalParamService.ts:22`
**Issue:** The frontend service attempts to call `PATCH /legal-params/${key}` with a body of `{ value }`. However, the backend `LegalParamRoute.ts` only defines a `POST /legal-params` endpoint which expects a full `CreateLegalParamDto` (including `category`, `description`, `validFrom`, etc.). This will result in a 404/405 error and the settings will not be saved.
**Fix:** Update the frontend service to use `POST` and provide the required DTO fields, or implement the `PATCH` endpoint in the backend.

```typescript
// frontend/src/services/legalParamService.ts
updateParam: async (key: string, data: any): Promise<{ success: boolean }> => {
  return http.post(`/legal-params`, { 
    key, 
    ...data,
    validFrom: new Date().toISOString() 
  });
},
```

### CR-03: Missing Salary Data in Employee List

**File:** `src/backend/src/service/EmployeeService.ts:182`
**Issue:** The `getAllEmployees` method (used by the Wizard's Step 2) does not `include` the `vpg_positions` relation. Consequently, the `salary` field (from `position_base_salary`) is missing from the API response. In the frontend `page.tsx`, `Number(emp.salary)` will evaluate to `NaN`, breaking the warning logic.
**Fix:** Update `EmployeeService.getAllEmployees` to include the position data and map the salary.

```typescript
// backend/src/service/EmployeeService.ts
const prismaEmployees = await prisma.vpg_employees.findMany({
    include: { vpg_positions: true }
});
// ... map to include salary
```

## Warnings

### WR-01: Silent Failure in Parameter Fetching

**File:** `src/frontend/src/hooks/usePayrollWizard.ts:60`
**Issue:** If the call to `LegalParamService.getParam` fails (e.g., network error or 404), the error is caught and logged to console, but the state variables `minWageCheckEnabled` and `globalMinWageRate` remain `null`. This causes the UI to silently skip the warnings without notifying the user that the validation check could not be verified.
**Fix:** Add a fallback or an error state to the hook so the UI can display a "Validation unavailable" message if parameters fail to load.

## Info

### IN-01: Auto-save execution in Enterprise Page

**File:** `src/frontend/src/app/pages/configuracion/empresa/page.tsx:294`
**Issue:** The `onChange` handler for the checkbox calls `saveLegalConfig()` which is the result of `handleSubmit`. While it might work in some environments, it is cleaner to call the actual submit logic or use `legalForm.handleSubmit` correctly.
**Fix:** Ensure the submit function is called properly: `onChange={(e) => { legalForm.register(...).onChange(e); legalForm.handleSubmit(saveLegalConfig)(); }}`.

---

_Reviewed: 2025-03-05T16:45:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
