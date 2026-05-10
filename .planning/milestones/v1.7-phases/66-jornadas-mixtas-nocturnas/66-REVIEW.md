---
phase: 66-jornadas-mixtas-nocturnas
reviewed: 2026-04-30T16:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/backend/prisma/schema.prisma
  - src/backend/src/model/employee.ts
  - src/backend/src/service/LegalParamService.ts
  - src/backend/src/service/NomineeService.ts
  - src/backend/src/service/EmployeeService.ts
  - src/backend/src/__tests__/unit/services/LegalParamRounding.test.ts
  - src/backend/src/__tests__/unit/services/NomineeService.test.ts
  - src/backend/src/__tests__/unit/services/LegalParamService.test.ts
  - src/backend/src/__tests__/unit/services/PayrollService.Override.test.ts
  - src/backend/src/types/payroll.types.ts
  - src/frontend/src/types/employee.ts
  - src/frontend/src/schemas/employee.ts
  - src/frontend/src/components/AddEmployeeModal.tsx
  - src/frontend/src/components/EditEmployeeModal.tsx
  - src/frontend/src/components/PayrollResults.tsx
  - src/frontend/src/types/payrollTypes.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 66: Code Review Report (jornadas-mixtas-nocturnas)

**Reviewed:** 2026-04-30
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 66 successfully implements support for Mixed (Mixta) and Night (Nocturna) shifts in accordance with Costa Rican labor law (8h/7h/6h daily caps). The implementation is robust, with significant performance optimizations in the payroll calculation engine and full UI support for managing employee shift overrides.

Key strengths:
- **N+1 Optimization**: `NomineeService` pre-fetches legal parameters for all three shift types in a single batch before iterating over employees.
- **Correct Legal Logic**: Shift-specific daily/weekly caps are correctly applied to OT calculations and vacation pay.
- **UI Integration**: Smooth addition of shift selection in modals and visual hints in payroll results.

## Major Issues

### WR-01: All-or-nothing Critical Parameter Fetching

**File:** `src/backend/src/service/LegalParamService.ts:36`
**Issue:** `LegalParamService.getParamSetAtDate` throws an error if a critical parameter (like `WORKDAY_NOCTURNA_DAILY`) is missing from the database. Since `NomineeService` pre-fetches all three shift sets, a missing parameter for *any* shift will crash the entire payroll calculation for *all* employees, even if no employee in the company uses that specific shift type.
**Fix:**
Provide fallback values for shift-specific workday parameters (8h, 7h, 6h) if they are missing from the DB, or allow the calculation to proceed if the missing shift type is not actually used by any active employee.

### WR-02: Brittle Enum Casting in Shift Resolution

**File:** `src/backend/src/service/NomineeService.ts:46`
**Issue:** The method `resolveEffectiveShiftType` uses `as unknown as ShiftType` to cast `EmployeeShiftType`. While functionally correct because `USE_ENTERPRISE_DEFAULT` is handled by an `if` block, this bypasses TypeScript's type safety and relies on the string values of the two different Enums remaining identical.
**Fix:**
```typescript
  static resolveEffectiveShiftType(
    employeeShiftType: EmployeeShiftType,
    enterpriseShiftType: ShiftType
  ): ShiftType {
    if (employeeShiftType === EmployeeShiftType.USE_ENTERPRISE_DEFAULT) {
      return enterpriseShiftType;
    }
    // Explicit mapping instead of unknown cast
    switch (employeeShiftType) {
      case EmployeeShiftType.MIXTA: return ShiftType.MIXTA;
      case EmployeeShiftType.NOCTURNA: return ShiftType.NOCTURNA;
      case EmployeeShiftType.DIURNA: return ShiftType.DIURNA;
      default: return enterpriseShiftType;
    }
  }
```

## Info

### IN-01: Redundant Enterprise Configuration Queries

**File:** `src/backend/src/service/LegalParamService.ts:41`
**Issue:** `getParamSetAtDate` queries the `vpg_enterprise` table for the rounding policy every time it is called. When calculating payroll, this results in 3 identical DB queries.
**Fix:** Pass the enterprise config into the service method from the controller/orchestrator level if possible, or implement a short-lived cache for enterprise settings.

### IN-02: Hardcoded UI Labels for Shift Types

**File:** `src/frontend/src/components/PayrollResults.tsx:55`
**Issue:** Shift labels are hardcoded in Spanish in the UI component (`Jornada: Diurna (8h/día)`).
**Fix:** Consider moving these strings to a shared constants file or a translation layer if the project intends to support multiple languages in the future.

### IN-03: Multiple Naming Conventions in Result Extraction

**File:** `src/frontend/src/components/PayrollResults.tsx:28`
**Issue:** `extractEmployeeFields` handles many aliases for the same data (e.g., `hours`, `total_hours`, `totalHoursFromDays`). This indicates inconsistency in the API response format between different endpoints or versions.
**Fix:** Standardize the backend response to use a consistent naming convention (preferably camelCase as per `GEMINI.md`) and refactor the frontend to expect only that format.

---

_Reviewed: 2026-04-30_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
