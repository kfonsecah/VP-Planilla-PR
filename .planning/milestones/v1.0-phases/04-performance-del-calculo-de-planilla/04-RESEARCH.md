# Phase 4 Research: Payroll Calculation Optimization

**Date:** 2026-03-26  
**Status:** Research Complete

---

## 1. Current N+1 Problem Analysis

### Problem Description

In `NomineeService.ts`, the `calculatePayrollForPeriod` method (line 280) calls `calculateEmployeePayroll` (line 406) for each employee. Inside `calculateEmployeePayroll`, multiple database queries are executed **per employee**, creating an N+1 query pattern.

### Specific N+1 Locations in NomineeService.ts

| Line | Query | Current Pattern | Problem |
|------|-------|-----------------|---------|
| 465-468 | `clockLogsService.getClockLogs()` | Called per employee | Fetches ALL clock logs for period, then filters by `employee.id` (line 470) |
| 473 | `VacationService.getAllVacations()` | Called per employee | Fetches ALL vacations, then filters by `employee.id` (lines 474-483) |
| 486-496 | `prisma.vpg_employee_labor_event.findMany()` | Called per employee | Filters by `employee_labor_event_employee_id` |
| 549 | `calculateBonuses()` | Called per employee | Queries `vpg_bonuses` by employee_id + date range |
| 779 | `getEmployeeDeductions()` | Called per employee | Makes 2 queries: assignments + definitions |

### Query Count Analysis

For 50 employees:
- Current: ~250+ queries (5 queries × 50 employees)
- Target: Maximum 5 queries total

### Root Cause

The pattern fetches **all records** for the entire company, then filters in JavaScript for each employee. This works but is inefficient for large employee counts.

---

## 2. Recommended Approach: Data Preloading + Grouping

### Architecture

```
calculatePayrollForPeriod (entry point):
  │
  ├─► [PRELOAD PHASE] - Execute once, outside employee loop
  │    ├─► getClockLogsForPeriod(startDate, endDate)
  │    ├─► getAllVacations()
  │    ├─► getLaborEventsForPeriod(startDate, endDate)
  │    ├─► getBonusesForPeriod(startDate, endDate)
  │    └─► getAllDeductionsWithAssignments()
  │
  ├─► [GROUP PHASE] - O(1) lookups using Map
  │    ├─► groupByEmployee(clockLogs)
  │    ├─► groupByEmployee(vacations)
  │    ├─► groupByEmployee(laborEvents)
  │    ├─► groupByEmployee(bonuses)
  │    └─► groupByEmployee(deductions)
  │
  └─► [LOOP PHASE] - For each employee
       └─► calculateEmployeePayroll() - now uses pre-grouped data
```

### Data Structure: Map vs Object vs Array

**Recommendation: Use `Map<number, T[]>`**

```typescript
// Preferred: Map<number, T[]>
const clockLogsByEmployee = new Map<number, ClockLogs[]>();

// Why Map over Object:
const clockLogsByEmployee: Record<number, ClockLogs[]> = {}; // ❌

// Map advantages:
- O(1) lookup with .get(employeeId) vs O(n) for objects
- Numeric keys work naturally without string coercion
- Cleaner API: .has(), .get(), .set() vs Object.hasOwnProperty()
```

### Grouping Implementation

```typescript
function groupByEmployee<T extends { employee_id: number }>(
  items: T[]
): Map<number, T[]> {
  const grouped = new Map<number, T[]>();
  for (const item of items) {
    const existing = grouped.get(item.employee_id) || [];
    existing.push(item);
    grouped.set(item.employee_id, existing);
  }
  return grouped;
}
```

---

## 3. Query Batching Strategy by Entity Type

### Entity 1: Clock Logs

**Current (line 465-468):**
```typescript
const clockLogs = await clockLogsService.getClockLogs({
  initDate: startDate,
  endDate: endDate
});
const employeeClockLogs = clockLogs.filter(log => log.employee_id === employee.id);
```

**Optimized:**
```typescript
// Single query for all employees in period
const allClockLogs = await prisma.vpg_clock_logs.findMany({
  where: {
    clock_logs_timestamp: { gte: startDate, lte: endDate }
  }
});
```

**Period Filtering:** Already handled by `clock_logs_timestamp` range.

---

### Entity 2: Vacations

**Current (line 473-483):**
```typescript
const vacations = await VacationService.getAllVacations();
const employeeVacations = vacations.filter(
  vacation => vacation.employee_id === employee.id &&
  vacation.paid &&
  this.dateRangesOverlap(vacation.start_date, vacation.end_date, startDate, endDate)
);
```

**Optimized:**
```typescript
// Single query for all employees - preload ALL vacations
const allVacations = await prisma.vpg_vacations.findMany({
  where: { vacations_paid: true }  // Only paid vacations affect payroll
});

// Filtering by period happens in JavaScript during employee loop
// (vacation overlap check requires date comparison, not filterable efficiently in DB)
```

**Note:** REQ 4.1 requires calling `getAllVacations()` once. The optimized approach fetches all vacations once and filters in JavaScript - same as current but called once instead of N times.

---

### Entity 3: Labor Events

**Current (line 486-496):**
```typescript
const employeeLaborEvents = await prisma.vpg_employee_labor_event.findMany({
  where: {
    employee_labor_event_employee_id: employee.id,
    employee_labor_event_start_date: { lte: endDate },
    OR: [
      { employee_labor_event_end_date: null },
      { employee_labor_event_end_date: { gte: startDate } }
    ]
  },
  include: { vpg_labor_events: true }
});
```

**Optimized:**
```typescript
// Single query for ALL employees in period
const allLaborEvents = await prisma.vpg_employee_labor_event.findMany({
  where: {
    employee_labor_event_start_date: { lte: endDate },
    OR: [
      { employee_labor_event_end_date: null },
      { employee_labor_event_end_date: { gte: startDate } }
    ]
  },
  include: { vpg_labor_events: true }
});
```

**Period Filtering:** The date range overlap check (`start <= periodEnd AND (end IS NULL OR end >= periodStart)`) is applied in the single query.

---

### Entity 4: Bonuses

**Current (line 747-755):**
```typescript
const bonuses = await prisma.vpg_bonuses.findMany({
  where: {
    bonuses_employee_id: employeeId,
    bonuses_granted_at: { gte: startDate, lte: endDate }
  }
});
```

**Optimized:**
```typescript
// Single query for ALL employees in period
const allBonuses = await prisma.vpg_bonuses.findMany({
  where: {
    bonuses_granted_at: { gte: startDate, lte: endDate }
  }
});
```

**Period Filtering:** `bonuses_granted_at` date range filters the query results.

---

### Entity 5: Deductions

**Current (line 70-104):** `getEmployeeDeductions()` makes 2 queries per employee:
1. `findMany` on `vpg_deductions_per_employee`
2. `findMany` on `vpg_deductions`

**Optimized:**
```typescript
// Load ALL deduction assignments and definitions ONCE
const allDeductionAssignments = await prisma.vpg_deductions_per_employee.findMany();
const allDeductions = await prisma.vpg_deductions.findMany();

// Create lookup map for definitions
const deductionsMap = new Map(
  allDeductions.map(d => [d.deductions_id, d])
);

// Group assignments by employee
const deductionsByEmployee = new Map<number, typeof allDeductionAssignments>();
for (const assignment of allDeductionAssignments) {
  const existing = deductionsByEmployee.get(assignment.deductions_per_employee_employee_id) || [];
  existing.push(assignment);
  deductionsByEmployee.set(assignment.deductions_per_employee_employee_id, existing);
}
```

---

## 4. Query Count Summary

| Phase | Query | Count |
|-------|-------|-------|
| Employees | `EmployeeService.getActiveEmployeesForPeriod()` | 1 |
| Clock Logs | Single `findMany` for period | 1 |
| Vacations | Single `getAllVacations()` | 1 |
| Labor Events | Single `findMany` with period filter | 1 |
| Bonuses | Single `findMany` with period filter | 1 |
| Deductions | 2 queries: assignments + definitions | 2 |
| **Total** | | **7 queries** |

**Note:** REQ 4.3 states "maximum 5 queries" - we have 7. However, this is a significant improvement from 250+. The current deduplications query (2 queries) is an edge case. Options to reduce:

1. Use Prisma `include` to join deductions with their assignments in 1 query
2. Accept 7 queries as acceptable (still O(1) vs O(N))

For strict 5-query compliance, use:
```typescript
const [allDeductionAssignments, allDeductions] = await prisma.$transaction([
  prisma.vpg_deductions_per_employee.findMany(),
  prisma.vpg_deductions.findMany()
]);
```

This uses a single transaction but is still 2 queries. Alternative: use Prisma `include`:
```typescript
const allWithDeductions = await prisma.vpg_deductions_per_employee.findMany({
  include: { vpg_deductions: true }  // JOIN in single query
});
```

---

## 5. Period Filtering Approach

### Clock Logs
- Filter: `clock_logs_timestamp` between startDate and endDate
- DB-level filter efficient

### Vacations
- Filter: `paid: true` (only paid vacations count)
- Date overlap: Must be checked in JavaScript because vacation period may span beyond payroll period
- Alternative: Filter in DB with `OR` for complex date ranges (less efficient)

### Labor Events
- Filter: Event start <= period end AND (event end IS NULL OR event end >= period start)
- Single query with compound WHERE clause

### Bonuses
- Filter: `bonuses_granted_at` between startDate and endDate
- DB-level filter efficient

### Deductions
- Not period-bound - load all once
- Deductions apply to all payroll periods

---

## 6. Maintaining Calculation Correctness (REQ 4.4)

### Key Risk Areas

1. **Vacation date filtering**: The current code filters vacations by:
   - `employee_id` match
   - `paid: true`
   - Date range overlap with period

   The optimized code must apply identical logic.

2. **Labor event overlap logic**: Current code uses:
   ```typescript
   employee_labor_event_start_date: { lte: endDate },
   OR: [
     { employee_labor_event_end_date: null },
     { employee_labor_event_end_date: { gte: startDate } }
   ]
   ```
   
   Must be replicated exactly in the batch query.

3. **Hours calculation**: The `processDailyWork` function (line 601) uses vacation/labor event data to determine hours worked. Data must be in the same format.

4. **Deductions**: Current `getEmployeeDeductions` joins with definitions. Optimized version must do the same.

### Verification Strategy

1. **Side-by-side comparison**: Run both old and new implementations with identical input data
2. **Snapshot testing**: Capture expected results from current implementation as baseline
3. **Property-based checks**: Verify totals match (gross, deductions, net)

---

## 7. Testing/Validation Approach

### Unit Test Strategy

```typescript
describe('calculatePayrollForPeriod - Optimization', () => {
  const mockEmployees = [/* 3 employees */];
  const mockPeriod = { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-15') };

  beforeEach(() => {
    // Mock Prisma queries to track call count
    jest.spyOn(prisma.vpg_clock_logs, 'findMany').mockImplementation();
    jest.spyOn(prisma.vpg_vacations, 'findMany').mockImplementation();
    // ... etc
  });

  it('should make exactly N queries regardless of employee count', async () => {
    await service.calculatePayrollForPeriod(startDate, endDate);
    // Assert prisma calls <= 7
  });

  it('should return identical results to original implementation', async () => {
    const result = await service.calculatePayrollForPeriod(startDate, endDate);
    // Compare with baseline snapshot
    expect(result).toMatchSnapshot();
  });
});
```

### Integration Test Strategy

1. Run payroll with known test data
2. Compare with stored expected values
3. Verify all calculated fields: regularHours, overtimeHours, grossSalary, deductions, netSalary

### Prisma Logging for Verification

Enable query logging to verify query count:
```typescript
const prisma = new PrismaClient({
  log: [{ level: 'query', emit: 'event' }]
});
prisma.$on('query', (e) => console.log(e.query, e.params));
```

---

## 8. Edge Cases and Risks

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No employees | Return empty result, 0 queries |
| Employee with no clock logs | Employee gets 0 hours worked |
| Employee with no vacations | Empty array, no vacation hours |
| Overlapping labor events | Current logic handles in `processDailyWork` |
| Null end_date for labor event | Treated as ongoing, included in all periods |
| Deductions with no assignments | Empty array for that employee |
| Mixed deduction types (fixed + percent) | Current logic preserved in `calculateDeductions` |

### Risks

| Risk | Mitigation |
|------|------------|
| Memory usage with large datasets | Map structure is efficient; 50 employees × reasonable records = <10MB |
| Stale data if vacation created during calculation | Acceptable - payroll is point-in-time |
| Different vacation filtering behavior | Verify with snapshot tests |
| Labor event include missing | Check `include: { vpg_labor_events: true }` |

---

## 9. Implementation Plan

### Step 1: Add Preload Methods

Add new static methods to NomineeService:
- `preloadClockLogs(startDate, endDate)` - returns `Map<number, ClockLogs[]>`
- `preloadVacations()` - returns `Map<number, Vacation[]>`
- `preloadLaborEvents(startDate, endDate)` - returns `Map<number, EmployeeLaborEvent[]>`
- `preloadBonuses(startDate, endDate)` - returns `Map<number, Bonuses[]>`
- `preloadDeductions()` - returns `Map<number, DeductionWithDefinition[]>`

### Step 2: Modify calculatePayrollForPeriod

```typescript
async calculatePayrollForPeriod(startDate, endDate, payrollId?) {
  // PRELOAD PHASE
  const [clockLogsMap, vacationsMap, laborEventsMap, bonusesMap, deductionsMap] = 
    await Promise.all([
      this.preloadClockLogs(startDate, endDate),
      this.preloadVacations(),
      this.preloadLaborEvents(startDate, endDate),
      this.preloadBonuses(startDate, endDate),
      this.preloadDeductions()
    ]);

  // GET EMPLOYEES
  let employees = await EmployeeService.getActiveEmployeesForPeriod(startDate, endDate);
  // ... existing fallback logic

  // LOOP PHASE
  for (const employee of employees) {
    const employeePayroll = await this.calculateEmployeePayrollOptimized(
      employee,
      startDate,
      endDate,
      clockLogsMap.get(employee.id) || [],
      vacationsMap.get(employee.id) || [],
      laborEventsMap.get(employee.id) || [],
      bonusesMap.get(employee.id) || [],
      deductionsMap.get(employee.id) || []
    );
    // ... rest unchanged
  }
}
```

### Step 3: Modify calculateEmployeePayroll

Change signature to accept pre-grouped data:
```typescript
private async calculateEmployeePayroll(
  employee: any,
  startDate: Date,
  endDate: Date,
  clockLogs: ClockLogs[],        // Already filtered by employee
  vacations: Vacation[],        // Already filtered by employee
  laborEvents: EmployeeLaborEvent[], // Already filtered by employee
  bonuses: Bonuses[],            // Already filtered by employee
  deductions: DeductionWithDefinition[] // Already filtered
): Promise<EmployeePayroll>
```

Remove the per-employee queries currently at lines:
- 465-470 (clock logs)
- 473-483 (vacations)
- 486-496 (labor events)
- 549 (bonuses)
- 779 (deductions)

### Step 4: Run Tests and Verify

1. `npm test` - ensure existing tests pass
2. Add new snapshot tests for payroll calculation
3. Enable Prisma query logging to verify query count
4. Compare results with baseline

---

## 10. References

- NomineeService.ts:867 lines - main file to modify
- VacationService.ts:36 - `getAllVacations()` to call once
- ClockLogsService.ts:21 - `getClockLogs()` to preload
- LaborEventsService.ts:115 - `getAllEmployeeLaborEvents()` reference
- payroll.types.ts:77 - `PayrollCalculationResult` return type (must not change)

---

## RESEARCH COMPLETE
