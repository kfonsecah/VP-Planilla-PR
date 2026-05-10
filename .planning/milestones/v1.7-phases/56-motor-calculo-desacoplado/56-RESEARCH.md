# Phase 56 Research: Motor de Cálculo Desacoplado

## Standard Stack

*   **TypeScript Interfaces**: `LegalParamSet` defined in `src/backend/src/types/payroll.types.ts`.
*   **Prisma/Services**: `LegalParamService` (built in Phase 55) for fetching `VpgLegalParam` values by date.
*   **Pure Functions**: `payrollUtils.ts` functions remain pure but receive configuration explicitly rather than relying on module-level constants.

## Architecture Patterns

*   **Configuration Object Pattern**: Group all configuration into a single `LegalParamSet` interface and pass it down the call stack instead of passing 5-10 individual scalar arguments.
*   **Context Pre-loading**: `NomineeService.calculatePayrollForPeriod` must fetch the `LegalParamSet` exactly ONCE at the start of the payroll calculation process, outside the employee loop.
*   **Default Fallback for Testing**: Expose `DEFAULT_LEGAL_PARAMS: LegalParamSet` in `payrollUtils.ts` to prevent rewriting hundreds of existing unit tests. Production code should strictly use the DB values.
*   **Dependency Injection in Pure Functions**: `payrollUtils` continues to have no side effects (no DB calls). It purely processes `(data, config) -> result`.

## Don't Hand-Roll

*   **Date Temporal Logic**: Use `LegalParamService.getParamsAtDate(period.startDate)` to resolve parameters. Do NOT write custom Prisma queries inside `NomineeService` to fetch parameters.
*   **Type Casting**: Do not use `any`. Use strict typing for `LegalParamSet` matching the exact expected values (e.g., `otFactor: number`).
*   **Shift Types (Jornadas)**: Do NOT attempt to read `ordinaryShiftType` from employee or enterprise. Hardcode `regularHoursPerDay: 8` for now, leaving a `TODO: Phase 66` comment.

## Common Pitfalls

*   **N+1 Queries**: Fetching `LegalParamSet` inside `calculateEmployeePayroll`. It must be fetched ONCE in `calculatePayrollForPeriod`.
*   **Test Breakages**: Forgetting to update `PayrollService.test.ts` or `NomineeService.test.ts`. Use `DEFAULT_LEGAL_PARAMS` in tests unless specifically testing parameter variance.
*   **Passing Nulls**: Failing to handle potential nulls from `LegalParamService`. The service should throw or return defaults, and `NomineeService` should gracefully handle or fail the payroll calculation if parameters are entirely missing for a date.

## Code Examples

### 1. The LegalParamSet Interface (`payroll.types.ts`)
```typescript
export interface LegalParamSet {
  regularHoursPerDay: number; // TODO: Phase 66 (Jornadas)
  regularHoursPerWeek: number; // TODO: Phase 66
  otFactor: number;
  holidayMandatoryFactor: number;
  holidayTripleFactor: number;
  ccssObreroSalud: number;
  ccssObrerosPension: number;
  ccssObreroBP: number;
  minuteRoundingPolicy?: string; // TODO: Phase 58
}
```

### 2. Updating Pure Functions (`payrollUtils.ts`)
```typescript
export const DEFAULT_LEGAL_PARAMS: LegalParamSet = {
  regularHoursPerDay: 8,
  regularHoursPerWeek: 48,
  otFactor: 1.5,
  holidayMandatoryFactor: 2.0,
  holidayTripleFactor: 3.0,
  ccssObreroSalud: 5.5,
  ccssObrerosPension: 4.33,
  ccssObreroBP: 1.0
};

export function calculateRegularHours(days: DayWork[], params: LegalParamSet = DEFAULT_LEGAL_PARAMS): number {
  return roundToMoney(
    days.reduce((sum, day) => sum + Math.min(day.hoursWorked, params.regularHoursPerDay), 0)
  );
}
```

### 3. Pre-loading Context (`NomineeService.ts`)
```typescript
async calculatePayrollForPeriod(startDate: Date, endDate: Date, ...) {
  // Pre-load data
  const params = await LegalParamService.getParamsAtDate(startDate);
  if (!params) throw new Error("Legal parameters not configured for this date");
  
  // Convert map to LegalParamSet
  const legalParamSet: LegalParamSet = {
    regularHoursPerDay: 8, // hardcoded until phase 66
    regularHoursPerWeek: 48,
    otFactor: Number(params.find(p => p.key === 'OT_FACTOR')?.value || 1.5),
    // ... map other values
  };
  
  for (const employee of employees) {
     const employeePayroll = await this.calculateEmployeePayroll(
         employee, startDate, endDate, ..., legalParamSet
     );
  }
}
```
