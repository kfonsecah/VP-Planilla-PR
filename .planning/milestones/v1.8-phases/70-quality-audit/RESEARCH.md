# Research: Phase 70 — Quality Audit

## Overview
Phase 70 focuses on the final audit of the Payroll Engine (`payrollUtils.ts`) and the "Legal Engine" (Legal parameters infrastructure). The goal is to eliminate remaining hardcoded literals and ensure full JSDoc coverage for recently added services.

## Key Findings

### 1. Hardcoded Literals in `payrollUtils.ts`
The following literals were identified as candidates for parameterization in `LegalParamSet`:
- `WORKING_DAYS_PER_WEEK = 6`: Currently a constant in the file.
- `calculateWeeklyRestHours`: Uses `(regularHours * 8) / 104 * 2`. These numbers (8, 104, 2) should be dynamic parameters.
- `averageOfSalaries`: Uses `/ 12`. This is standard for CR Aguinaldo but could be parameterized for extreme flexibility.

### 2. JSDoc Coverage
- `NomineeService.ts` (39KB) and `AguinaldoService.ts` (15KB) were heavily modified/added in v1.7.
- Initial check shows most methods have JSDoc, but accuracy regarding parameter types (especially `Decimal` vs `number`) and return shapes needs verification.
- `LegalParamService` and `LaborEventsService` also need a JSDoc audit.

### 3. Test Coverage
- `payrollUtils.test.ts`: 106 tests, high coverage.
- `LegalParamService.test.ts`: 15 tests.
- Total project tests: ~556.

## Strategy
1. **Refactor `payrollUtils.ts`**: Move literals to `LegalParamSet`.
2. **Update Legal Infrastructure**: Add new keys to `LegalParamSet` and `LegalParamService.getParamSetAtDate`.
3. **JSDoc Audit**: Systematically check and fix JSDoc in the 4 identified services.
4. **Final Verification**: Execution of Gate 1 (TSC) and Gate 2 (Tests) for the entire project.

## Verification Plan
- Unit tests for `payrollUtils.ts` must pass after refactor.
- `npx tsc --noEmit` must pass in backend and frontend.
- `npm test` must pass for the full backend suite.
