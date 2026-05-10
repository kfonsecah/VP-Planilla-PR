# Plan 37-05 Summary — Gap Closure

**Completed:** 2026-04-16
**Status:** Done

## What was fixed

### Task 1 — Status badge colors (PAGADA vs PAGADO)
- `getStatusBadge` now checks `'PAGADA' || 'PAGADO'` — blue badge renders correctly for backend enum value
- Stat counter "Pagadas" also updated to count both values

### Task 2 — Contextual action buttons
- Reopen button condition changed from `p.status === 'PAGADO'` to `p.status === 'PAGADA' || p.status === 'PAGADO'`
- Approve/Mark as Paid buttons were already correct (checked BORRADOR/APROBADA)

### Task 3 — Wizard integration with real calculation data
- `PayrollWizard.tsx` fully rewritten:
  - `handleCalculate` now async: creates BORRADOR payroll (`payroll_type_id: 1`) then calls `NomineeService.calculatePayrollForPeriod` with the new `payrollId`
  - Stores both `calculationData` and `payrollId` in wizard state
  - Step 2 renders `<PayrollWizardStep2>` with real data (no more placeholder)
  - Step 3 renders `<PayrollWizardStep3>` with real data + payrollId (no more placeholder)
  - Loading spinner on "Calcular Planilla" button during API call
  - Error message displayed if calculation fails
- `PayrollWizardStep3.tsx`:
  - Replaced broken `ConfirmDialog` usage (no children support) with inline custom modal
  - Total gross/net calculations now use field name fallbacks (`gross ?? grossSalary ?? total_gross`)
  - Confirm button disabled until text === 'APROBAR'

## Files modified
- `src/frontend/src/components/PayrollWizard.tsx`
- `src/frontend/src/components/PayrollWizardStep3.tsx`
- `src/frontend/src/app/pages/payroll/list/page.tsx`

## Type check
- `npx tsc --noEmit` — no new errors introduced. Remaining errors in `clock-logs/` and legacy PENDIENTE/CALCULADO block are pre-existing.
