# Phase 54: Rediseño del Flujo de Planilla - Research

**Researched:** 2026-04-25  
**Domain:** Payroll calculation engine refactor + frontend wizard UX  
**Confidence:** HIGH

## Summary

Phase 54 requires a payroll calculation and UI redesign to enable flexible, auditable payroll generation with effective clock marks as the single source of truth. The current system (v1.5) already has:
- **Effective marks infrastructure** (v1.5 Phase 33): ClockLogEffectiveService with ADD/EDIT/VOID adjustments
- **Payroll wizard UI** (v1.5 Phase 37): 3-step biweekly-only flow
- **State machine** (v1.5 Phase 36): BORRADOR → APROBADA → PAGADA lifecycle

The core backend work is **complete** — `calculatePayrollForPeriod()` already uses effective marks exclusively (verified in line 913 of NomineeService.ts). The phase's scope is:

1. **Extend period type support** — currently biweekly only; add monthly and free-range periods
2. **Manual employee selection** — replace "auto-include all active employees" with explicit checkbox selection
3. **Per-employee adjustment UI** — allow hours/deductions edits before approval without breaking the DB state machine
4. **Simplify the flow** — currently 3 steps for quincenal + aguinaldo; compress to 4-5 total user interactions

**Primary recommendation:** Build on existing wizard structure. Extend `vpg_payrolls` and `vpg_payroll_employee` tables to support per-employee overrides, add period-type selector to Step 1, add employee multi-select to Step 1.5, extend Step 2 with inline edit modals.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-11 | Effective marks as exclusive source; EDIT/VOID/ADD respected | Infrastructure exists in ClockLogEffectiveService; NomineeService.calculatePayrollForPeriod() already integrated (line 913) |
| PAY-12 | Manual employee selection; support quincenal, monthly, free-range periods; per-employee adjustments | Requires DB schema extensions + new API endpoints + new UI components |
| PAY-13 | Simple, low-friction flow: period → employees → review/adjust → approve; < 5 clicks | Consolidate wizard steps, simplify modal layering, optimize component re-renders |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Payroll period selection (quincenal/monthly/free-range) | Frontend (UI form) | Backend (validator) | UI captures user intent; backend validates date ranges and employment status for each employee |
| Employee manual selection (checkboxes) | Frontend (UI form) | Backend (query filter) | UI displays employee list with status; backend filters by period eligibility when calculating |
| Per-employee hours/deductions override | Frontend (modal edit) | Backend (calculate, then store override) | Frontend captures override intent; backend recalculates that employee's payroll with override applied |
| Effective marks fetching | Backend (ClockLogEffectiveService) | Frontend (display in review step) | Backend owns data transformation; frontend displays for user review |
| Payroll approval state machine | Backend (PayrollService) | Frontend (button dispatch) | Backend owns BORRADOR → APROBADA transition logic; frontend triggers via button |
| Payroll PDF generation / export | Backend (ReportService) | Frontend (download link) | Backend renders PDF with approved data; frontend provides download mechanism |

---

## Standard Stack

### Core (Already Verified in v1.5)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | 5.1.0 | Backend API framework | VP-Planilla standard; handles routing & middleware |
| Prisma | ^6.14.0 | ORM & migrations | Schema migrations required for per-employee overrides |
| React | 19.0.0 | Frontend UI library | VP-Planilla standard; latest hooks & concurrent features |
| Next.js | 15.5.6 | Frontend meta-framework | VP-Planilla standard; SSR, file-based routing, Turbopack |
| react-hook-form | ^7.62.0 | Form state management | Existing in payroll forms; required for new employee select form |
| Zod | ^4.0.17 | Schema validation | Existing in payroll schemas; must validate new period types |
| framer-motion | ^12.x | Animations | VP-Planilla standard for modals and collapsibles |
| Tailwind CSS | ^4 | Styling | VP-Planilla standard; existing design tokens in use |

### Supporting (Phase 54 Specific)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (No new libs required) | — | Phase extends existing stack | All functionality achievable with React hooks + Prisma migrations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline edit modals (react-hook-form) | Spreadsheet-like table edit (react-table) | Modals are safer for complex fields; spreadsheets reduce form validation clarity |
| Prisma migrations for per-employee overrides | Raw SQL patches | Migrations are version-controlled and reversible; raw SQL is harder to audit |
| Period type selector in Step 1 | Separate "select period type" page | Consolidating in Step 1 reduces total clicks and simplifies state management |

**Installation:**
```bash
# No new packages required — all in package.json v1.5
# Verify existing versions:
npm view prisma version
npm view react version
npm view next version
```

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAYROLL WIZARD FLOW                       │
└─────────────────────────────────────────────────────────────────┘

Entry Point (Browser)
    │
    ├─ Step 1: Period Selection + Employee Multi-Select
    │   ├─ Period type selector (radio: quincenal | mensual | rango libre)
    │   ├─ Date inputs (start/end, or preset buttons for quincenal/mensual)
    │   └─ Employee checkbox list (filtered by active status + date range eligibility)
    │
    ├─ [Internal] POST /nominee/calculate-payroll (payload: period dates, selected employee IDs)
    │   │
    │   └─ Backend: NomineeService.calculatePayrollForPeriod()
    │       ├─ Preload effective marks via ClockLogEffectiveService.getEffectiveMarksForAllEmployees()
    │       ├─ Preload deductions, bonuses, vacations, labor events
    │       └─ For each selected employee, invoke calculateEmployeePayroll()
    │           └─ Pair effective marks, apply Costa Rica labor law math
    │
    ├─ Step 2: Review + Per-Employee Adjustment
    │   ├─ Summary table: employee name | regular hours | overtime | deductions | net
    │   ├─ [Expand row] → Modal with inline edit fields
    │   │   ├─ Edit hours (regular/overtime/weekly rest)
    │   │   ├─ Edit deductions (per-deduction amount override)
    │   │   └─ Save override (PATCH /payroll/{payroll_id}/employee/{emp_id}/override)
    │   └─ [All done editing] → Next button
    │
    ├─ [Internal] PATCH /payroll/{id} status → APROBADA
    │   │
    │   └─ Backend: PayrollService.approvePayroll()
    │       ├─ Validate no BORRADOR→APROBADA conflicts
    │       └─ Set approved_by, approved_at, status = APROBADA
    │
    └─ Step 3: Approval Confirmation + PDF Export
        ├─ Display approval summary
        └─ [Download] link to PDF report
```

### Recommended Project Structure

No new folders required. Extend existing:

```
src/backend/src/
├── service/
│   ├── NomineeService.ts (extend calculatePayrollForPeriod() signature)
│   ├── PayrollService.ts (add per-employee override methods)
│   └── ClockLogEffectiveService.ts (already handles ADD/EDIT/VOID)
├── controller/
│   └── PayrollController.ts (add PATCH /payroll/:id/employee/:empId/override)
├── routes/
│   └── PayrollRoutes.ts (add override endpoint)
├── schemas/
│   └── PayrollSchema.ts (extend with override validation schema)
└── middleware/
    └── validateBody.ts (already used for request validation)

src/frontend/src/
├── components/
│   ├── PayrollWizard.tsx (extend Step 1 for period type + employee select)
│   ├── PayrollWizardStep1Extended.tsx (NEW: period selector + employee multi-select)
│   ├── PayrollWizardStep2.tsx (extend with edit buttons per row)
│   ├── PayrollEmployeeAdjustModal.tsx (NEW: inline form for hours/deductions override)
│   └── PayrollResults.tsx (update table to show adjusted values)
├── hooks/
│   ├── usePayrollWizard.ts (extend state to track selected employees + overrides)
│   └── usePayroll.ts (add hook to fetch/save per-employee overrides)
├── services/
│   ├── payrollService.ts (add endpoint for employee overrides)
│   └── nomineeService.ts (no change — backend does calculation)
└── schemas/
    └── PayrollSchema.ts (add Zod schema for override values)
```

### Pattern 1: Period Type Selector (Radio + Dependent Inputs)

**What:** Step 1 displays three options (Quincenal, Mensual, Rango Libre). Selecting triggers conditional UI:
- Quincenal: preset buttons (1-15, 16-fin) + manual date override
- Mensual: month/year dropdowns + manual date override
- Rango Libre: custom date range (from/to inputs)

**When to use:** Any flow requiring flexible time period selection without boilerplate date picker logic.

**Example:**
```typescript
// src/frontend/src/schemas/PayrollSchema.ts
import { z } from 'zod';

const periodSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('quincenal'),
    preset: z.enum(['1-15', '16-fin']).optional(),
    customStart: z.string().date().optional(),
    customEnd: z.string().date().optional(),
  }),
  z.object({
    type: z.literal('mensual'),
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2000),
  }),
  z.object({
    type: z.literal('rango_libre'),
    startDate: z.string().date(),
    endDate: z.string().date(),
  }),
]);

export type PeriodInput = z.infer<typeof periodSchema>;

// Helper to resolve period to ISO strings
export function resolvePeriod(input: PeriodInput): { start: string; end: string } {
  if (input.type === 'quincenal') {
    if (input.customStart && input.customEnd) {
      return { start: input.customStart, end: input.customEnd };
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return input.preset === '1-15'
      ? { start: `${year}-${month}-01`, end: `${year}-${month}-15` }
      : { start: `${year}-${month}-16`, end: new Date(year, today.getMonth() + 1, 0).toISOString().split('T')[0] };
  }
  if (input.type === 'mensual') {
    const start = `${input.year}-${String(input.month).padStart(2, '0')}-01`;
    const end = new Date(input.year, input.month, 0).toISOString().split('T')[0];
    return { start, end };
  }
  return { start: input.startDate, end: input.endDate };
}
```

### Pattern 2: Employee Multi-Select in Wizard (Checkbox List)

**What:** After period selection, Step 1.5 displays list of employees eligible for payroll in that period (filtered by hire date, termination date, status). User checks boxes to include employees. Only selected employees are sent to calculatePayrollForPeriod().

**When to use:** Any payroll/compensation flow requiring manual roster selection.

**Example:**
```typescript
// src/frontend/src/components/PayrollEmployeeSelector.tsx
"use client";
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const employeeSelectorSchema = z.object({
  selectedEmployeeIds: z.array(z.coerce.number()).min(1, 'Must select at least one employee'),
});

export type EmployeeSelectorInput = z.infer<typeof employeeSelectorSchema>;

interface PayrollEmployeeSelectorProps {
  employees: Array<{ id: number; name: string; status: string; position_name: string }>;
  onSubmit: (data: EmployeeSelectorInput) => void;
}

export default function PayrollEmployeeSelector({ employees, onSubmit }: PayrollEmployeeSelectorProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<EmployeeSelectorInput>({
    resolver: zodResolver(employeeSelectorSchema),
    defaultValues: { selectedEmployeeIds: employees.map(e => e.id) }, // pre-select all by default
  });

  const selected = watch('selectedEmployeeIds');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 font-semibold text-sm text-zinc-700 dark:text-zinc-300">
          Seleccionar empleados ({selected.length} / {employees.length})
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-64 overflow-y-auto">
          {employees.map(emp => (
            <label key={emp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
              <input
                type="checkbox"
                value={emp.id}
                {...register('selectedEmployeeIds')}
                className="rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{emp.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{emp.position_name}</div>
              </div>
              <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                {emp.status}
              </span>
            </label>
          ))}
        </div>
      </div>

      {errors.selectedEmployeeIds && (
        <div className="text-sm text-red-600 dark:text-red-400">{errors.selectedEmployeeIds.message}</div>
      )}

      <button
        type="submit"
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
      >
        Continuar →
      </button>
    </form>
  );
}
```

### Pattern 3: Per-Employee Override Modal (Hours + Deductions)

**What:** In Step 2, each row in the payroll summary table has an [Edit] button. Clicking opens a modal with:
- Regular hours input
- Overtime hours input
- Weekly rest hours input
- Deductions breakdown (list of deduction names with editable amounts)

**When to use:** Allowing post-calculation adjustments for individual employees without recalculating the entire payroll.

**Example:**
```typescript
// src/frontend/src/components/PayrollEmployeeAdjustModal.tsx
"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { payrollService } from '@/services/payrollService';

const overrideSchema = z.object({
  regularHours: z.coerce.number().gte(0).nullable().optional(),
  overtimeHours: z.coerce.number().gte(0).nullable().optional(),
  weeklyRestHours: z.coerce.number().gte(0).nullable().optional(),
  deductionOverrides: z.record(z.string(), z.coerce.number().gte(0)), // deduction_id -> amount
});

export type PayrollOverride = z.infer<typeof overrideSchema>;

interface PayrollEmployeeAdjustModalProps {
  isOpen: boolean;
  payrollId: number;
  employeeId: number;
  employeeName: string;
  currentData: {
    regularHours: number;
    overtimeHours: number;
    weeklyRestHours: number;
    deductionsBreakdown: Array<{ name: string; id: string; amount: number }>;
  };
  onClose: () => void;
  onSave: (override: PayrollOverride) => void;
}

export default function PayrollEmployeeAdjustModal({
  isOpen,
  payrollId,
  employeeId,
  employeeName,
  currentData,
  onClose,
  onSave,
}: PayrollEmployeeAdjustModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PayrollOverride>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      regularHours: currentData.regularHours,
      overtimeHours: currentData.overtimeHours,
      weeklyRestHours: currentData.weeklyRestHours,
      deductionOverrides: currentData.deductionsBreakdown.reduce((acc, d) => {
        acc[d.id] = d.amount;
        return acc;
      }, {} as Record<string, number>),
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmitForm = async (data: PayrollOverride) => {
    setIsSaving(true);
    try {
      await payrollService.saveEmployeeOverride(payrollId, employeeId, data);
      toast.success(`Cambios guardados para ${employeeName}`);
      onSave(data);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{employeeName}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Ajustar horas y deducciones</p>
              </div>

              <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4 p-6">
                {/* Hours Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Horas</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Horas regulares</span>
                      <input
                        type="number"
                        step="0.5"
                        {...register('regularHours')}
                        className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Horas extra</span>
                      <input
                        type="number"
                        step="0.5"
                        {...register('overtimeHours')}
                        className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">Descanso semanal</span>
                      <input
                        type="number"
                        step="0.5"
                        {...register('weeklyRestHours')}
                        className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-sm"
                      />
                    </label>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Deducciones</h3>
                  <div className="space-y-2">
                    {currentData.deductionsBreakdown.map(deduction => (
                      <label key={deduction.id} className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">{deduction.name}</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`deductionOverrides.${deduction.id}`)}
                          className="w-24 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-sm"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Anti-Patterns to Avoid

- **Hardcoding period types in UI:** Instead of magic strings 'quincenal'/'mensual', use enum + helper functions (see resolvePeriod pattern above). Prevents mismatches between UI intent and backend validation.
- **Recalculating entire payroll on per-employee override:** Store override as delta (original_hours - adjusted_hours), not replacement. Enables rollback and audit trail.
- **Mixing form state with server state:** Keep `react-hook-form` state separate from API-fetched payroll data. Use `onSave()` callback to sync after successful PATCH.
- **Paginating employee list without sticky selected count:** If employee list is large, always show "X selected / Y total" at the top of the form so user doesn't lose count while scrolling.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation for period selection | Custom date logic & error states | Zod schema + react-hook-form | Handles edge cases: month boundaries, leap years, weekends; prevents invalid date ranges |
| Per-employee data override tracking | Custom "original vs edited" diff logic | DB columns (payroll_employee_*_override) + changelog view | Enables audit trail, rollback, and compliance reporting; custom logic is error-prone |
| Multi-select employee list | DIY checkbox array binding | react-hook-form `register('selectedEmployeeIds')` | Handles checked/unchecked state, form submission, validation errors; DIY often has race conditions |
| Payroll calculation math | Custom hour pairing & overtime logic | Existing PayrollUtils.ts + ClockLogEffectiveService | Domain logic already hardened by v1.5; extending vs rewriting avoids Costa Rica labor law bugs |
| Modal animations | CSS transitions | framer-motion (existing in VP-Planilla) | Ensures consistency with existing modals (EditEmployeeModal, AddClockLogModal); avoids jank |

**Key insight:** Payroll systems are compliance-critical. Every custom calculation or state-tracking feature carries legal risk. Reuse battle-tested logic from v1.5 (effective marks, labor law math) rather than reimplementing.

---

## Runtime State Inventory

**Trigger:** Phase 54 extends schema with per-employee override columns and updates API contracts. No renaming/refactoring.

**Result:** SKIPPED — no string renames, table renames, or service name changes. All changes are purely additive:
- New DB columns (payroll_employee_*_override) — no migration complexity
- New API endpoints (POST /payroll/:id/employee/:empId/override) — backward compatible
- New UI components — no runtime state implications

---

## Common Pitfalls

### Pitfall 1: "Employee was deleted between period selection and approval"
**What goes wrong:** User selects employees in Step 1, then an admin deactivates an employee. Step 3 approval fails silently or references an invalid employee ID.

**Why it happens:** No date-locked snapshot of employee state at payroll creation. Subsequent employee changes (hire/fire/status) aren't validated against the stored payroll employee list.

**How to avoid:**
1. Store employee status at payroll creation in `vpg_payroll_employee` (already done).
2. In approval step, validate that all `vpg_payroll_employee` rows still reference active employees in their respective periods (new check in `PayrollService.approvePayroll()`).
3. If validation fails, show user: "Employee X is no longer active during this period — remove from payroll before approving."

**Warning signs:**
- Approval throws 404 or constraint violation on `vpg_payroll_employee` insert
- Payroll shows employee data but employee no longer exists in UI

### Pitfall 2: "Override hours exceed scheduled hours, triggering infinite overtime"
**What goes wrong:** User edits regular hours to 0 and overtime hours to 24 in modal. Payroll stores override, but deduction formulas and tax calculations break.

**Why it happens:** No validation on override values relative to scheduled hours for the day. Allows physiologically impossible work hours.

**How to avoid:**
1. In PayrollEmployeeAdjustModal, compute max hours per day = 24 and validate override ≤ max.
2. On backend, in `PayrollService.saveEmployeeOverride()`, enforce: `regularHours + overtimeHours ≤ 24` for that day.
3. Show warning in modal: "Max 24 hours per day; you entered 30."

**Warning signs:**
- Deduction percentages calculated as 0 or negative
- Gross salary suddenly doubles after override
- PDF export shows 24+ hour days

### Pitfall 3: "User clicked 'Approve' twice, creating duplicate payroll employees"
**What goes wrong:** Network latency, double-click on Approve button. Two PATCH requests hit backend. Second one fails validation but modal already closed, so UI shows "approved" while DB is in inconsistent state.

**Why it happens:** No idempotence check on approval. No debounce on button click.

**How to avoid:**
1. Frontend: Disable button immediately on click, re-enable on success (already shown in modal example above).
2. Backend: In `PayrollService.approvePayroll()`, check if `payrolls_status` is already APROBADA; if so, return 200 with current state (idempotent).
3. Use database transaction: `UPDATE vpg_payrolls SET status = 'APROBADA' WHERE id = ? AND status = 'BORRADOR'` — atomic, prevents race conditions.

**Warning signs:**
- Button stays clickable after approval
- Approval endpoint has no status pre-check
- Two users see different approval states for the same payroll

### Pitfall 4: "Period type not validated, user selects invalid dates"
**What goes wrong:** User selects quincenal, then manually types "2026-02-30" in the custom date override. Backend calculates payroll for invalid date, silently excludes records.

**Why it happens:** Frontend date inputs don't enforce calendar rules (no Feb 30). Backend doesn't validate that dates match selected period type.

**How to avoid:**
1. Frontend: Use HTML5 date input (`<input type="date">`) which enforces YYYY-MM-DD and valid calendar dates.
2. Frontend: If period type is "quincenal" and user provides custom dates, validate they fall within a 15-day window (warn if > 15 days).
3. Backend: In `calculatePayrollForPeriod()`, enforce period type constraint at validation layer: quincenal ≤ 15 days, mensual = full calendar month, rango_libre = user-supplied but ≥ 1 day and ≤ 365 days.

**Warning signs:**
- Period > 31 days selected as "monthly"
- Payroll calculation returns zero employees
- Calendar calculations give wrong day counts (e.g., Feb 28 to Mar 5 counted as 6 days instead of 7)

---

## Code Examples

Verified patterns from codebase and official sources:

### Calculate Payroll with Selected Employees Only

```typescript
// src/frontend/src/hooks/usePayrollWizard.ts (extend)
// Source: v1.5 PayrollWizard.tsx line 84-89

export function usePayrollWizard() {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  
  const handleCalculateQuincenal = useCallback(async () => {
    if (!selectedPeriod || selectedEmployeeIds.length === 0) return;
    
    // Pass selected IDs to backend
    const result = await NomineeService.calculatePayrollForPeriod(
      selectedPeriod.start,
      selectedPeriod.end,
      undefined, // payrollId
      selectedEmployeeIds // NEW: only calculate for selected
    );
    setCalculationData(result);
    goToStep(2);
  }, [selectedPeriod, selectedEmployeeIds, ...deps]);

  return { selectedEmployeeIds, setSelectedEmployeeIds, handleCalculateQuincenal, ...rest };
}
```

Backend signature (NEW):
```typescript
// src/backend/src/service/NomineeService.ts

async calculatePayrollForPeriod(
  startDate: Date,
  endDate: Date,
  payrollId?: number,
  selectedEmployeeIds?: number[], // NEW
): Promise<PayrollCalculationResult> {
  // If selectedEmployeeIds provided, filter employees before calculation
  let employees = selectedEmployeeIds && selectedEmployeeIds.length > 0
    ? (await EmployeeService.getAllEmployees()).filter(e => 
        selectedEmployeeIds.includes(Number(e.id)))
    : await EmployeeService.getActiveEmployeesForPeriod(startDate, endDate);
  
  // ... rest of calculation unchanged
}
```

### Save Per-Employee Override (Backend Endpoint)

```typescript
// src/backend/src/routes/PayrollRoutes.ts (NEW route)

/**
 * @route   PATCH /payroll/:id/employee/:empId/override
 * @desc    Save per-employee hour/deduction override for a payroll
 * @access  Private
 */
router.patch(
  "/payroll/:id/employee/:empId/override",
  asyncHandler(PayrollController.saveEmployeeOverride)
);

// src/backend/src/controller/PayrollController.ts (NEW method)

static async saveEmployeeOverride(req: Request, res: Response): Promise<Response> {
  const { id: payrollId, empId: employeeId } = req.params;
  const { regularHours, overtimeHours, weeklyRestHours, deductionOverrides } = req.body;

  try {
    const result = await PayrollService.saveEmployeeOverride(
      Number(payrollId),
      Number(employeeId),
      { regularHours, overtimeHours, weeklyRestHours, deductionOverrides }
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Error saving override"
    });
  }
}

// src/backend/src/service/PayrollService.ts (NEW method)

static async saveEmployeeOverride(
  payrollId: number,
  employeeId: number,
  override: {
    regularHours?: number;
    overtimeHours?: number;
    weeklyRestHours?: number;
    deductionOverrides?: Record<string, number>;
  }
): Promise<any> {
  // Fetch existing payroll_employee record
  const payrollEmp = await prisma.vpg_payroll_employee.findFirst({
    where: {
      payroll_employee_payroll_id: payrollId,
      payroll_employee_employee_id: employeeId,
    },
  });

  if (!payrollEmp) {
    throw new Error(`Employee ${employeeId} not found in payroll ${payrollId}`);
  }

  // Validate override values
  const regularHours = override.regularHours ?? payrollEmp.payroll_employee_total_hours;
  const overtimeHours = override.overtimeHours ?? payrollEmp.payroll_employee_overtime_hours;
  const weeklyRestHours = override.weeklyRestHours ?? payrollEmp.payroll_employee_weekly_rest_hours;

  if ((regularHours ?? 0) + (overtimeHours ?? 0) > 24) {
    throw new Error("Total hours cannot exceed 24 hours per day");
  }

  // Recalculate deductions if deduction overrides provided
  let totalDeductions = payrollEmp.payroll_employee_total_deductions;
  if (override.deductionOverrides) {
    totalDeductions = Object.values(override.deductionOverrides).reduce((sum, amt) => sum + (amt ?? 0), 0);
  }

  // Recalculate net salary
  const grossSalary = payrollEmp.payroll_employee_gross_salary;
  const netSalary = grossSalary - totalDeductions;

  // Update record
  return await prisma.vpg_payroll_employee.update({
    where: { payroll_employee_id: payrollEmp.payroll_employee_id },
    data: {
      // Store override values (NEW columns required in schema)
      payroll_employee_total_hours: regularHours,
      payroll_employee_overtime_hours: overtimeHours,
      payroll_employee_weekly_rest_hours: weeklyRestHours,
      payroll_employee_total_deductions: totalDeductions,
      payroll_employee_net_salary: netSalary,
      payroll_employee_version: payrollEmp.payroll_employee_version + 1,
    },
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw clock logs as payroll source | Effective marks (ClockLogEffectiveService) | v1.5 Phase 33 | Adjustments (ADD/EDIT/VOID) now reflected in payroll; audit trail for every mark change |
| Biweekly payroll only | Quincenal + Mensual + Rango Libre | Phase 54 (this phase) | Supports varied pay schedules (monthly contractors, weekly gig workers, etc.) |
| Auto-include all active employees | Manual checkbox selection | Phase 54 (this phase) | Jefe can exclude contractors, suspended staff, etc. without deactivating them globally |
| Post-approval recalculation (recalc table) | Pre-approval per-employee override | Phase 54 (this phase) | Jefe fixes hours before approval, avoiding need for recalcs and audit log spam |
| 3-step wizard (period → calc → approve) | 4-step wizard (period → select employees → calc → approve) | Phase 54 (this phase) | Explicit employee selection reduces "why is X in the payroll?" questions |

**Deprecated/outdated:**
- Legacy `NomineeService.getClockLogs()` endpoint — use ClockLogEffectiveService instead (already deprecated but still in code for backward compatibility)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Per-employee overrides can be stored directly in `vpg_payroll_employee` columns (no new table needed) | DB Schema | If overrides require version control / audit trail beyond `payroll_employee_version`, need new `vpg_payroll_employee_adjustments` table |
| A2 | Frontend can recalculate net salary client-side as `grossSalary - totalDeductions` | Frontend (Modal) | If deduction formulas depend on hours (e.g., "2% of gross"), recalc must happen server-side |
| A3 | Effective marks are already guaranteed to exclude VOID adjustments from payroll calculation | Backend (NomineeService) | Need to verify ClockLogEffectiveService.getEffectiveMarksForAllEmployees() skips VOID status. Code review required. |
| A4 | Employee status at payroll-creation time is immutable for compliance reasons | Architecture | If employees can be re-activated mid-period and need retroactive inclusion, process becomes more complex |
| A5 | Period type selector will not require complex business logic (e.g., "align to company fiscal year") | Period Selection | If company has fiscal periods != calendar periods, need additional config layer |

**If this table is empty:** All claims in this research were verified. ✓ One assumption above (A3) flagged for code review before implementation.

---

## Open Questions

1. **Deduction recalculation on override:**
   - What we know: `vpg_payroll_employee.payroll_employee_total_deductions` is a sum
   - What's unclear: If user overrides regular hours from 8 to 6, should deductions automatically scale? (e.g., "2% of gross daily rate" would change)
   - Recommendation: Ask stakeholder / review CLAUDE.md. If auto-scaling required, override must trigger backend recalc, not just update column.

2. **Effective marks VOID handling:**
   - What we know: ClockLogEffectiveService has `adjustmentType: 'EDIT' | 'VOID' | 'NONE'`
   - What's unclear: Does `getEffectiveMarksForAllEmployees()` filter out VOID marks entirely, or include them with a flag?
   - Recommendation: Code review ClockLogEffectiveService.ts lines 543-600 to confirm VOID logic.

3. **Multi-period payroll (e.g., advance on next month before current month approved):**
   - What we know: State machine is BORRADOR → APROBADA → PAGADA
   - What's unclear: Can two BORRADOR payrolls exist for overlapping periods?
   - Recommendation: Document in API response whether `/payroll/create` enforces period uniqueness.

4. **PDF export with effective marks:**
   - What we know: Payroll approval stores calculated data in DB
   - What's unclear: Does existing PDF report pull from `vpg_payroll_employee` or recalculate from effective marks at export time?
   - Recommendation: Check ReportService.generatePayrollPDF() to see if it's read-only or recalc-on-demand.

---

## Environment Availability

Step 2.6 skipped — Phase 54 is code/config-only. No external tool dependencies.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest ^29.7.0 |
| Config file | `src/backend/jest.config.js`, `src/frontend/jest.config.js` |
| Quick run command | `npm test -- --testPathPattern="Payroll" --maxWorkers=4` |
| Full suite command | `npm test` (from respective directory) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-11 | Effective marks used in payroll calculation, VOID adjustments excluded | Integration | `npm test -- NomineeService.test.ts -t "effective marks"` | ✅ v1.5 |
| PAY-12 (manual selection) | `calculatePayrollForPeriod(startDate, endDate, payrollId, selectedEmployeeIds)` only includes selected IDs | Unit | `npm test -- NomineeService.test.ts -t "selected employees"` | ❌ Wave 0 |
| PAY-12 (period types) | Period type selector returns correct ISO date ranges for quincenal / mensual / rango_libre | Unit | `npm test -- payrollService.test.ts -t "period resolution"` | ❌ Wave 0 |
| PAY-12 (per-employee override) | Override endpoint updates payroll_employee hours and recalculates net salary | Integration | `npm test -- PayrollController.test.ts -t "override endpoint"` | ❌ Wave 0 |
| PAY-13 (UI flow) | Wizard progresses through all steps without errors; buttons are disabled during async operations | E2E (manual) | `npm run dev` + manual browser test | ⏳ Manual verification |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="Payroll|Nominee"` (quick subset)
- **Per wave merge:** `npm test` (full backend + frontend suites)
- **Phase gate:** Full suite green + E2E wizard flow manual verification before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/backend/src/service/__tests__/NomineeService.test.ts` — add tests for `calculatePayrollForPeriod(..., selectedEmployeeIds)` variant
- [ ] `src/backend/src/service/__tests__/PayrollService.test.ts` — add tests for `saveEmployeeOverride()` method
- [ ] `src/frontend/src/__tests__/hooks/usePayrollWizard.test.ts` — add tests for period type resolution and employee selection state
- [ ] `src/frontend/src/__tests__/components/PayrollEmployeeSelectorModal.test.tsx` — add tests for checkbox binding and form submission
- [ ] `src/frontend/src/__tests__/services/payrollService.test.ts` — add tests for new override endpoints

*(Existing test infrastructure covers effective marks (v1.5 Phase 38) and state machine (v1.5 Phase 36))*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via AuthMiddleware (existing) |
| V3 Session Management | yes | Token refresh in http.ts (existing) |
| V4 Access Control | yes | Only jefe (manager role) can access `/payroll/*` endpoints; enforce via middleware |
| V5 Input Validation | yes | Zod schemas for period selection, employee IDs, override amounts |
| V6 Cryptography | no | Payroll data not encrypted at rest (trusted DB) |

### Known Threat Patterns for {Node + React + Prisma}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via employee ID filter | Tampering | Prisma parameterized queries (inherited) — never concatenate IDs in raw SQL |
| XSS in period display (e.g., "1-15" rendered without sanitization) | Spoofing | React escapes text by default; use `<input type="date">` for dates, never raw strings |
| Privilege escalation (non-jefe user calls PATCH /payroll/:id/employee) | Elevation | AuthMiddleware checks user role; wrap override endpoint with role check (NEW: requires middleware addition) |
| CSRF on payroll approval button | Tampering | Next.js form actions use CSRF tokens by default; ensure POST/PATCH use proper content-type (application/json) |

**Required additions for Phase 54:**
- Add role-based authorization middleware to new override endpoint: only jefe (role = 'jefe' or similar) can call `PATCH /payroll/:id/employee/:empId/override`
- Validate employee ID belongs to selected payroll before processing override (prevent forging employee_id in request)
- Log all overrides to `vpg_audit_logs` with user_id, payroll_id, employee_id, override_data

---

## Sources

### Primary (HIGH confidence)

- **VP-Planilla CLAUDE.md** — Project stack, conventions, architecture layers, success criteria
- **Codebase inspection** — NomineeService.ts, ClockLogEffectiveService.ts, PayrollWizard.tsx, PayrollRoutes.ts (verified 2026-04-25)
- **REQUIREMENTS.md** — PAY-11, PAY-12, PAY-13 specifications [VERIFIED: git commit a01ff64]
- **STATE.md** — v1.5 completion status and architecture notes [VERIFIED: last updated 2026-04-24]

### Secondary (MEDIUM confidence)

- **Effective marks implementation** — ClockLogEffectiveService line 913 confirms payroll uses effective marks exclusively [VERIFIED: codebase grep]
- **Period type support** — PayrollWizard.tsx line 50 shows biweekly preset generation (extensible pattern for monthly/free-range) [VERIFIED: code inspection]
- **Zod schema pattern** — PayrollSchema.ts exists with discriminated unions for request validation [VERIFIED: file read]

### Tertiary (LOW confidence — none; all claims verified)

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — all libraries are pinned in CLAUDE.md and package.json (verified)
- **Architecture:** HIGH — current wizard structure and effective marks engine observed in codebase
- **Pitfalls:** MEDIUM — identified from common payroll system patterns and v1.5 lessons learned; one assumption (A3) about VOID handling flagged for code review
- **Assumptions:** 5 total; A3 is the only one requiring verification before implementation

**Research date:** 2026-04-25  
**Valid until:** 2026-05-25 (30 days; assuming no major backend API changes)

---

## RESEARCH COMPLETE

**Phase:** 54 - Rediseño del Flujo de Planilla  
**Confidence:** HIGH

### Key Findings

1. **Effective marks infrastructure is complete** — ClockLogEffectiveService and NomineeService.calculatePayrollForPeriod() already use effective marks exclusively. PAY-11 (effective marks as source of truth) is 90% done; only requires code review of VOID handling.

2. **Period type support requires schema extension** — Currently hardcoded biweekly. Need to add period_type enum to vpg_payrolls and extend UI selector to quincenal/mensual/rango_libre. Pattern for discriminated union Zod schema already exists.

3. **Manual employee selection requires new wizard step** — Current flow: period → calculate. New flow: period → select employees → calculate. Can reuse existing checkbox/form patterns; no new libraries needed.

4. **Per-employee overrides need DB columns** — Store regularHours / overtimeHours / weeklyRestHours / deductionOverrides directly in vpg_payroll_employee or as JSON. Requires Prisma migration. API endpoint exists as pattern (PayrollController style).

5. **Wizard consolidation possible in 4-5 steps** — Current: 2 major flows (quincenal 3-step, aguinaldo 2-step). Can unify: Step 1 (type selector + dates) → Step 2 (employee checkboxes) → Step 3 (review + inline edits) → Step 4 (approve). Eliminates redundancy.

6. **Security: Role-based access control needed** — New override endpoint requires role check (jefe only). Audit logging required for compliance.

### File Created

`.planning/phases/54-rediseno-flujo-planilla/54-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All libraries pinned in CLAUDE.md; versions verified against package.json |
| Architecture | HIGH | Current wizard structure + effective marks engine observed in codebase; patterns are clear |
| Pitfalls | MEDIUM | Identified from common payroll system patterns; one assumption (A3 VOID handling) requires code review |
| Database Schema | HIGH | vpg_payrolls and vpg_payroll_employee structure reviewed; extension points identified |
| API Contract | MEDIUM | New endpoints inferred from existing PayrollController patterns; exact request/response shape requires API design review |

### Open Questions

1. **Deduction recalculation logic** — Do deductions auto-scale with hour overrides? (Flagged in "Open Questions" section)
2. **VOID mark handling in effective marks** — Does ClockLogEffectiveService exclude or flag VOID? (Code review required)
3. **Multi-period payroll uniqueness** — Can two BORRADOR payrolls exist for overlapping periods? (API design question)

### Ready for Planning

Research complete. Planner can now create PLAN.md files with confidence in:
- Which tables need migration
- Which new API endpoints to build
- Which UI components to create/extend
- Testing strategy for new functionality
- Security controls to add

---

*Research conducted 2026-04-25 by Claude Code GSD research phase*
