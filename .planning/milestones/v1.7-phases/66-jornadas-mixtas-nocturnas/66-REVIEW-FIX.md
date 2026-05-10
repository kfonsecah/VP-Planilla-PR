---
phase: 66-jornadas-mixtas-nocturnas
fixed_at: 2025-02-24T19:00:00Z
review_path: .planning/phases/66-jornadas-mixtas-nocturnas/66-REVIEWS.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 66: Code Review Fix Report

**Fixed at:** 2025-02-24T19:00:00Z
**Source review:** .planning/phases/66-jornadas-mixtas-nocturnas/66-REVIEWS.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### CR-01: Inconsistent Name Mapping in Employee Service

**Files modified:** `src/backend/src/model/employee.ts`, `src/backend/src/service/EmployeeService.ts`, `src/backend/src/service/NomineeService.ts`
**Commit:** 9c0b42de
**Applied fix:** Updated `Employee` interface to make `first_name` required and `name` optional (derived). Adjusted `EmployeeService` methods (`createEmployee`, `updateEmployee`, `getAllEmployees`, etc.) to correctly map `first_name` to the database and include it in the returned objects. Updated `NomineeService` to handle the interface change and provide fallbacks for optional fields.

### WR-01: Hardcoded Vacation Hours in Nominee Calculation

**Files modified:** `src/backend/src/service/NomineeService.ts`
**Commit:** 9c0b42de (Combined with CR-01)
**Applied fix:** Replaced hardcoded `8.0` hours for vacation days with `params.regularHoursPerDay`, ensuring that employees on mixed (7h) or night (6h) shifts receive the correct vacation hour credit.

### IN-01: Hardcoded Fallback Minimum Wage

**Files modified:** `src/backend/src/service/LegalParamService.ts`
**Commit:** a2eb6454
**Applied fix:** Defined `DEFAULT_MIN_WAGE_RATE` constant and used it as fallback in `getGlobalMinWageRate`.

### IN-02: Use of `any` in NomineeService

**Files modified:** `src/backend/src/service/NomineeService.ts`
**Commit:** 9c0b42de (Combined with CR-01)
**Applied fix:** Typed `employee` parameter in `calculateEmployeePayroll` as `Employee`.

---

_Fixed: 2025-02-24T19:00:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
