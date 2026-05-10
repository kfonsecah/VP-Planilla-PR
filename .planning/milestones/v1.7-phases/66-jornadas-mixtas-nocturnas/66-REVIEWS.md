---
phase: 66-jornadas-mixtas-nocturnas
reviewed: 2025-02-24T18:30:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/backend/prisma/schema.prisma
  - src/backend/src/model/employee.ts
  - src/backend/src/service/LegalParamService.ts
  - src/backend/src/service/NomineeService.ts
  - src/backend/src/service/EmployeeService.ts
  - src/backend/src/__tests__/unit/services/NomineeService.test.ts
  - src/backend/src/__tests__/unit/services/LegalParamService.test.ts
  - src/backend/src/__tests__/unit/services/PayrollService.Override.test.ts
  - src/frontend/src/types/employee.ts
  - src/frontend/src/schemas/employee.ts
  - src/frontend/src/components/AddEmployeeModal.tsx
  - src/frontend/src/components/EditEmployeeModal.tsx
  - src/frontend/src/components/PayrollResults.tsx
  - src/frontend/src/types/payrollTypes.ts
  - src/backend/src/types/payroll.types.ts
findings:
  critical: 1
  warning: 1
  info: 3
  total: 5
status: issues_found
---

# Phase 66: Code Review Report

**Reviewed:** 2025-02-24
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

The implementation of Phase 66 (Jornadas Mixtas y Nocturnas) correctly introduces the multi-shift support across the stack. The backend `NomineeService` now handles shift-specific legal parameters, and the frontend allows selecting the shift type. Performance optimizations such as pre-fetching parameters for all shift types to avoid N+1 queries were successfully implemented. 

However, a critical data mapping bug was identified in the `EmployeeService` which will lead to corrupted names in the database. Additionally, some hardcoded values remain in the payroll calculation logic that should be parameterized.

## Critical Issues

### CR-01: Inconsistent Name Mapping in Employee Service

**File:** `src/backend/src/service/EmployeeService.ts:31, 119`
**Issue:** The `createEmployee` and `updateEmployee` methods use the `data.name` property to populate the `employee_first_name` column in the database. However, the `Employee` interface defines `name` as the full name (as seen in `getEmployeeById` where it is constructed from first, middle, and last names). This results in full names being stored in the first name column, leading to data corruption and incorrect full name generation in future reads.
**Fix:**
```typescript
// In EmployeeService.ts
const createPayload: any = {
    // Change data.name to data.first_name
    employee_first_name: data.first_name || data.name, 
    employee_last_name: data.last_name,
    // ...
```
Additionally, consider updating the `Employee` interface in `src/backend/src/model/employee.ts` to make `first_name` required and `name` optional/derived.

## Warnings

### WR-01: Hardcoded Vacation Hours in Nominee Calculation

**File:** `src/backend/src/service/NomineeService.ts:436`
**Issue:** The hours for a vacation day are hardcoded to `8.0`. This is incorrect for employees on Mixed (7h) or Night (6h) shifts. In Costa Rica, a vacation day should correspond to the ordinary workday hours of the employee's shift.
**Fix:**
```typescript
if (isVacationDay) {
  dayWork.isVacation = true;
  // Use the regular hours defined for the shift
  dayWork.hoursWorked = params.regularHoursPerDay; 
  // ...
}
```

## Info

### IN-01: Hardcoded Fallback Minimum Wage

**File:** `src/backend/src/service/LegalParamService.ts:72`
**Issue:** The fallback value `1529.62` is hardcoded in `getGlobalMinWageRate`. 
**Fix:** Define this value as a constant `DEFAULT_MIN_WAGE_RATE` at the top of the file to improve maintainability.

### IN-02: Use of `any` in NomineeService

**File:** `src/backend/src/service/NomineeService.ts:348`
**Issue:** The `calculateEmployeePayroll` method types the `employee` parameter as `any`.
**Fix:** Use the `Employee` interface (from `../model/employee`) to ensure type safety.

### IN-03: Parameter Evaluation for Mid-Period Changes

**File:** `src/backend/src/service/NomineeService.ts:197-199`
**Issue:** Legal parameters are fetched only once using the `startDate` of the period. If a legal parameter (like minimum wage) changes mid-period (e.g., on the 1st of the month during a biweekly period starting on the 25th), it will not be reflected in the calculation for the second half of the period.
**Fix:** This is a minor issue as parameter changes are infrequent, but for high-precision compliance, the system should ideally fetch parameters based on the date of each workday or check if a change occurred within the period.

---

_Reviewed: 2025-02-24T18:30:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
