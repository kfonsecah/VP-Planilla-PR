# Phase 8 Research — Tests Unitarios NomineeService

**Phase:** 08  
**Goal:** Cobertura de tests para `NomineeService.calculatePayrollForPeriod`  
**Gathered:** 2026-03-27  
**Status:** Ready for planning

---

## Domain Context

### Requirements Summary

| REQ | Description | Priority |
|-----|-------------|----------|
| 8.1 | Tests para `calculateEmployeePayroll` con empleados mock (8h/día normal) | Must |
| 8.2 | Test: overtime 1.5× (8h < total ≤ 10h) | Must |
| 8.3 | Test: overtime 2× (total > 10h) | Must |
| 8.4 | Test: día de descanso trabajado (compensación 0.5×) | Must |
| 8.5 | Test: período con feriado nacional → días laborales correctos | Must |
| 8.6 | Test: empleado con deducción CCSS → totales correctos | Must |
| 8.7 | `npm test` pasa con 0 failures | Must |
| 8.8 | Tests de integración para `POST /api/nominee/payroll` | Should |

---

## Test Structure

### NomineeService.test.ts

The tests need to mock:
1. **Employee data** — employee info, position, hourly rate
2. **Clock logs** — IN/OUT pairs for the period
3. **Vacations** — vacation days within the period
4. **Labor events** — ausencia justificada, etc.
5. **Deductions** — CCSS, etc.

**Approach:** Mock at the service level (not Prisma level). Create mock data objects that match what `calculateEmployeePayroll` expects.

### Key Test Cases

#### REQ 8.1 — Normal 8h/day
```
Employee: 8h/day × 6 days = 48 regular hours
Expected: regularHours=48, overtimeHours=0
```

#### REQ 8.2 — Overtime 1.5×
```
Employee: 10h/day × 6 days = 60 hours
- Regular: 8h/day × 6 = 48h
- Overtime: 2h/day × 6 = 12h
Expected: regularHours=48, overtimeHours=12 (paid at 1.5×)
```

#### REQ 8.3 — Overtime 2×
```
Employee: 12h/day × 6 days = 72 hours
- Regular: 8h/day × 6 = 48h
- Overtime: 4h/day × 6 = 24h (paid at 2×)
Expected: regularHours=48, overtimeHours=24
```

#### REQ 8.4 — Day of rest worked
```
Employee: 8h Monday-Saturday + Sunday worked 8h
- Regular: 8h × 6 = 48h
- Weekly rest: 0.5 × daily rate for Sunday
Expected: weeklyRestHours calculated, weeklyRestPay > 0
```

#### REQ 8.5 — Holiday
```
Period: May 1-15, 2026
- Total Mon-Sat days: 12
- Holidays (May 1): 1
- Sundays: 2
Expected: scheduledHours = (12 - 1 - 2) × 8 = 72h
```

#### REQ 8.6 — CCSS Deduction
```
Employee with CCSS deduction (3.5% of gross)
Expected: totalDeductions includes CCSS amount
```

---

## PayrollService.test.ts Issue

**Problem:** 2 tests failing in PayrollService.test.ts:
1. `getAllPayrolls` mock doesn't include `include: { vpg_payroll_employee: true }`
2. `getAllPayrolls` mock missing `total_*` fields

**Fix:** Update the mock data in PayrollService.test.ts to match current service implementation.

---

## Files to Create/Modify

1. `src/backend/src/__tests__/unit/services/NomineeService.test.ts` — NEW
2. `src/backend/src/__tests__/unit/services/PayrollService.test.ts` — FIX mocks

---

## Test Pattern

```typescript
import { NomineeService } from '../../../service/NomineeService';
import { EmployeePayroll } from '../../../types/payroll.types';

// Mock Prisma at service level
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    vpg_employees: { findMany: jest.fn() },
    vpg_clock_logs: { findMany: jest.fn() },
    // ...etc
  }
}));

describe('NomineeService', () => {
  describe('calculateEmployeePayroll', () => {
    it('calculates normal 8h/day correctly', async () => {
      // Arrange mock data
      const mockEmployee = { ... };
      const mockClockLogs = [ ... ];
      
      // Act
      const result = await NomineeService.calculateEmployeePayroll(
        mockEmployee,
        mockClockLogs,
        startDate,
        endDate
      );
      
      // Assert
      expect(result.regularHours).toBe(48);
      expect(result.overtimeHours).toBe(0);
    });
  });
});
```

---

## Validation Architecture

### Dimension 8 Requirements

| Verification | Method | Command |
|---|---|---|
| NomineeService.test.ts created | ls | `ls src/backend/src/__tests__/unit/services/NomineeService.test.ts` → exists |
| Tests for normal 8h/day | grep | `grep "normal 8h" NomineeService.test.ts` → exists |
| Tests for overtime 1.5× | grep | `grep "overtime.*1.5" NomineeService.test.ts` → exists |
| Tests for overtime 2× | grep | `grep "overtime.*2" NomineeService.test.ts` → exists |
| Tests for weekly rest | grep | `grep "weeklyRest\|descanso" NomineeService.test.ts` → exists |
| Tests for holidays | grep | `grep "feriado\|holiday" NomineeService.test.ts` → exists |
| npm test passes | jest | `npm test` → 0 failures |
