# Phase 4: Performance del Cálculo de Planilla - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Optimizar `calculatePayrollForPeriod` de O(N) queries por empleado a O(1) queries totales. Pre-cargar vacaciones y clock logs fuera del loop de empleados.

</domain>

<decisions>
## Implementation Decisions

### Scope (from ROADMAP)
- **REQ 4.1:** `getAllVacations()` llamado UNA vez antes del loop de empleados
- **REQ 4.2:** Clock logs del período cargados UNA vez, agrupados por `employee_id`
- **REQ 4.3:** Con 50 empleados, planilla genera máximo 5 queries a DB (no 100+)
- **REQ 4.4:** Resultado del cálculo es idéntico antes y después del cambio

### Technical Boundaries
- Modificar solo `NomineeService.ts` — no tocar `PayrollUtils.ts` (funciones puras, ya testeadas)
- Mantener signatures de `calculatePayrollForPeriod` y `calculateEmployeePayroll` existentes
- No cambiar el formato de `PayrollCalculationResult` retornado

### Claude's Discretion
- Data structures for grouping (Map vs Object vs array lookup)
- Specific query batching strategy (Prisma include vs separate queries)
- Error handling approach for bulk loading failures
- Whether to use Promise.all for parallel preloading or sequential

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Core
- `src/backend/src/service/NomineeService.ts` — Main file to refactor. Contains `calculatePayrollForPeriod` and `calculateEmployeePayroll`
- `src/backend/src/utils/payrollUtils.ts` — Pure payroll calculation functions (DO NOT MODIFY)
- `src/backend/src/types/payroll.types.ts` — Type definitions for PayrollCalculationResult, EmployeePayroll, etc.
- `src/backend/src/service/VacationService.ts` — Current `getAllVacations()` implementation
- `src/backend/src/service/ClockLogsService.ts` — Current `getClockLogs()` implementation
- `src/backend/src/service/DeductionsService.ts` — Deductions lookup
- `src/backend/src/service/BonusesService.ts` — Bonuses lookup
- `src/backend/src/lib/prisma.ts` — Prisma singleton

### Project Context
- `.planning/REQUIREMENTS.md` — Full requirements for REQ 4.1-4.4
- `.planning/ROADMAP.md` — Phase 4 goal and success criteria
- `.planning/codebase/ARCHITECTURE.md` — Service layer patterns, static-only classes
- `CLAUDE.md` — Key decisions about payrollUtils (never change without tests)

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `prisma` singleton from `../lib/prisma` — already imported in NomineeService
- Existing service classes: `VacationService`, `ClockLogsService`, `DeductionsService`, `BonusesService`

### Established Patterns
- Static-only service classes with `async` methods
- Service methods return domain model interfaces, not Prisma types
- Pure functions in `PayrollUtils` for all calculations — these are tested and verified correct

### Current N+1 Problem (what we're fixing)
```
calculatePayrollForPeriod:
  for each employee:
    getClockLogs()        // fetches ALL logs every iteration ❌
    getAllVacations()     // fetches ALL vacations every iteration ❌
    labor_events query     // per employee ✅ (N+1)
    calculateBonuses()    // per employee ✅ (N+1)
    calculateDeductions() // per employee ✅ (N+1)
```

### Target Architecture
```
calculatePayrollForPeriod:
  // Preload phase (outside loop)
  allClockLogs = getClockLogs({period})
  allVacations = getAllVacations()
  allLaborEvents = queryLaborEvents({period})  // single query, all employees
  allBonuses = queryBonuses({period})         // single query, all employees
  allDeductions = queryDeductions()           // single query, all employees

  // Group phase
  clockLogsByEmployee = groupBy(allClockLogs, 'employee_id')
  vacationsByEmployee = groupBy(allVacations, 'employee_id')
  laborEventsByEmployee = groupBy(allLaborEvents, 'employee_id')
  bonusesByEmployee = groupBy(allBonuses, 'employee_id')

  // Loop phase
  for each employee:
    employeeClockLogs = clockLogsByEmployee.get(employee.id) || []
    employeeVacations = vacationsByEmployee.get(employee.id) || []
    ...
```

</codebase_context>

<specifics>
## Specific Ideas

- Preloading must happen BEFORE the employee loop in `calculatePayrollForPeriod`
- Use `Map<number, T[]>` for O(1) lookups by employee ID
- Labor events query should use `where: { employee_labor_event_start_date: { lte: endDate }, employee_labor_event_end_date: { gte: startDate } }` to get all events overlapping the period in one query
- Deductions are not period-bound — load all assignments and definitions once
- Bonuses query should filter by `bonuses_granted_at` within the period
- Clock logs already filter by date range — group the result by employee_id

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is well-defined by requirements.

</deferred>

---

*Phase: 04-performance-del-calculo-de-planilla*
*Context gathered: 2026-03-26*
