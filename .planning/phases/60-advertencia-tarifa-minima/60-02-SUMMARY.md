---
phase: 60
plan: 02
subsystem: payroll-wizard
tags:
  - ui
  - legal-params
  - warnings
dependency_graph:
  requires:
    - 60-01
  provides:
    - PAY-25 (Partial - UI implemented)
  affects:
    - src/frontend/src/hooks/usePayrollWizard.ts
    - src/frontend/src/app/pages/payroll/wizard/page.tsx
tech_stack:
  added:
    - "@radix-ui/react-tooltip" (via existing Tooltip component)
  patterns:
    - useEffect for auto-fetch
    - Conditional rendering with Tooltips
key_files:
  created: []
  modified:
    - src/frontend/src/hooks/usePayrollWizard.ts
    - src/frontend/src/app/pages/payroll/wizard/page.tsx
decisions:
  - Use Tooltip component for better UX instead of native title attribute.
  - Implement silent catch for parameter fetching to ensure the wizard remains functional even if legal params fail.
metrics:
  duration: 25m
  completed_date: "2026-04-28"
---

# Phase 60 Plan 02: Advertencia de Tarifa Mínima en Planilla Summary

Implemented a non-blocking visual warning in the Payroll Wizard to notify users when an employee's salary is below the global minimum wage rate.

## Accomplishments

### 1. Auto-fetch Legal Parameters
- Enhanced `usePayrollWizard` hook to automatically fetch `MIN_WAGE_CHECK_ENABLED` and `GLOBAL_MIN_WAGE_RATE` from the `LegalParamService` on mount.
- Implemented robust error handling that logs errors to the console but doesn't block the UI, falling back to default null values.

### 2. Low-Wage Visual Warning in Step 2
- Integrated the fetched parameters into the employee selection list in Step 2 of the Payroll Wizard.
- Added a conditional warning icon (⚠️) next to employee names when `MIN_WAGE_CHECK_ENABLED` is active and their salary is below the `GLOBAL_MIN_WAGE_RATE`.
- Wrapped the warning icon in a `Tooltip` component to provide context and the exact minimum wage threshold for comparison.
- Displayed the current configured salary for each employee in the list to facilitate immediate verification.

## Deviations from Plan

None - plan executed exactly as written, with the improvement of using the project's custom `Tooltip` component instead of the native `title` attribute.

## Self-Check: PASSED

1. **Check created files exist:**
   - Modified files exist and are verified.
2. **Check commits exist:**
   - eb8fcef: feat(60-02): fetch legal parameters in usePayrollWizard
   - 34a5806: feat(60-02): render low-wage warning in Payroll Wizard Step 2
   - 6d9b544: style(60-02): use Tooltip component for low-wage warning

## Known Stubs

None. The implementation is fully wired to the backend `LegalParamService` and reflects real data.
