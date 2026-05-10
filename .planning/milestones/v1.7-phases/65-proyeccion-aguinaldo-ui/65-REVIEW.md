---
phase: 65-proyeccion-aguinaldo-ui
reviewed: 2025-03-10T15:30:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/backend/src/model/AguinaldoAccrual.ts
  - src/backend/src/service/AguinaldoService.ts
  - src/backend/src/__tests__/unit/services/AguinaldoService.test.ts
  - src/backend/src/service/PayrollService.ts
  - src/backend/src/controller/PayrollController.ts
  - src/backend/src/routes/PayrollRoutes.ts
  - src/backend/src/routes/EmployeeRoute.ts
  - src/frontend/src/types/aguinaldo.ts
  - src/frontend/src/services/aguinaldoService.ts
  - src/frontend/src/hooks/useAguinaldo.ts
  - src/frontend/src/hooks/useAguinaldoSummary.ts
  - src/frontend/src/components/AguinaldoCard.tsx
  - src/frontend/src/components/ProfileSummaryTab.tsx
  - src/frontend/src/app/pages/payroll/wizard/page.tsx
  - src/frontend/src/components/PayrollWizardStep3.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 65: Code Review Report (Proyección Aguinaldo UI)

**Reviewed:** 2025-03-10
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

The implementation of the Aguinaldo projection logic and UI is generally high quality. The use of `groupBy` in the backend service effectively prevents N+1 query issues during bulk processing in the payroll wizard. The frontend integration via custom hooks and the "Compromiso de Aguinaldo" summary in the wizard provides good transparency for payroll administrators.

However, a significant logic issue was identified regarding the fiscal period transition in December, which causes the accrued amount to "disappear" from the UI exactly when employees are most likely to check it (just before payment). Additionally, the projection formula does not account for hire dates, leading to inaccurate annual projections for mid-year hires.

## Warnings

### WR-01: Aguinaldo Accrual Resets Prematurely in December

**File:** `src/backend/src/service/AguinaldoService.ts:18-21`
**Issue:** The logic for determining the `periodStart` uses `asOfDate.getMonth() === 11` (December). This means that on December 1st, the calculation immediately switches to the *next* fiscal year. Since Aguinaldo in Costa Rica is paid between Dec 1st and Dec 20th, employees checking their profile in early December will see an accrued amount of ₡0 (or only the first Dec payroll), which is confusing and alarming.
**Fix:** Implement a "grace period" or a toggle. For the `calculateAccruedAguinaldo` method, if the date is in December, it should probably return the accrual for the period that just ended (Nov 30) unless specifically requested otherwise, or at least until a cutoff date like Dec 20th.

```typescript
// Suggestion: allow viewing the period ending Nov 30 while in December
const isDecember = asOfDate.getMonth() === 11;
const dayOfMonth = asOfDate.getDate();
// If it's early December, default to the period that just ended
const usePriorPeriod = isDecember && dayOfMonth <= 20; 

const periodStart = new Date(isDecember && !usePriorPeriod ? year : year - 1, 11, 1);
```

### WR-02: Inaccurate Projection for Mid-Year Hires

**File:** `src/backend/src/service/AguinaldoService.ts:51`
**Issue:** The `projectedAnnual` calculation uses `monthsElapsed` since the start of the fiscal period (`Dec 1`). For an employee hired in June, `monthsElapsed` will be ~8 months by August, but they only have 2 months of salary. Dividing `totalGross` by 8 months significantly underestimates their average monthly salary and thus their projected Aguinaldo.
**Fix:** The service should ideally consider the employee's hire date to calculate `monthsSinceHire` and use `min(monthsSincePeriodStart, monthsSinceHire)` as the divisor for the average monthly salary calculation.

```typescript
// In AguinaldoService.calculateAccruedAguinaldo
// We would need to fetch the employee's hire_date
const employee = await prisma.vpg_employees.findUnique({ where: { employee_id: employeeId }, select: { employee_hire_date: true } });
const hireDate = employee?.employee_hire_date || periodStart;
const effectiveStart = hireDate > periodStart ? hireDate : periodStart;
const msSinceStart = Math.max(0, asOfDate.getTime() - effectiveStart.getTime());
const actualMonthsWorked = msSinceStart / (1000 * 60 * 60 * 24 * 365 / 12);

const projectedAnnual = actualMonthsWorked > 0.1 ? (totalGross / actualMonthsWorked) : 0;
```

## Info

### IN-01: Redundant Mathematical Operation

**File:** `src/backend/src/service/AguinaldoService.ts:51`
**Issue:** The expression `(totalGross / monthsElapsed) * 12 / 12` contains a redundant `* 12 / 12`.
**Fix:** Simplify to `totalGross / monthsElapsed`.

### IN-02: Route Redundancy

**File:** `src/backend/src/routes/PayrollRoutes.ts` & `src/backend/src/routes/EmployeeRoute.ts`
**Issue:** There are multiple routes performing similar aguinaldo calculations:
- `GET /payroll/aguinaldo/:employeeId/:year` (Legacy/Compatibility)
- `GET /employees/:id/aguinaldo` (Used by Profile)
- `GET /payroll/:id/aguinaldo-summary` (Used by Wizard)
**Fix:** While acceptable for supporting different UI contexts, consider consolidating the controller logic to ensure consistent behavior across all endpoints. Currently, `calculateAguinaldo` and `getEmployeeAguinaldo` in `PayrollController` use slightly different approaches to determine the reference date.

---

_Reviewed: 2025-03-10_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
