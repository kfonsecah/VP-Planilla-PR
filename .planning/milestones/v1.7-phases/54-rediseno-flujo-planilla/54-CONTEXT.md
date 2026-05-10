# Phase 54 Context: Rediseño del Flujo de Planilla

**Phase:** 54-rediseno-flujo-planilla
**Milestone:** v1.6
**Status:** Planning Complete — Ready for Execution

## Objective

Redesign the payroll calculation flow to:
1. Use audited effective marks as the exclusive source of truth (PAY-11)
2. Add manual employee selection + flexible period types (PAY-12)
3. Deliver a unified 4-step wizard with per-employee adjustments, < 5 clicks (PAY-13)

## Scope

### In Scope
- DB schema extension: `payrolls_period_type` in `vpg_payrolls`; 5 override columns in `vpg_payroll_employee`
- Backend: `NomineeService.calculatePayrollForPeriod()` extended with `selectedEmployeeIds?`
- Backend: New `PATCH /payroll/:id/employee/:empId/override` endpoint
- Frontend: New `/pages/payroll/wizard` page (4-step wizard replacing the old `/calculate` flow)
- Frontend: New components: `PayrollWizardPage`, `PayrollEmployeeSelector`, `PayrollEmployeeAdjustModal`
- Frontend: Hook extension: `usePayrollWizard` to track period type + selected employees

### Out of Scope
- Aguinaldo flow changes (existing aguinaldo components are untouched)
- PDF export redesign (existing report system unchanged)
- Role-based access control beyond existing `AuthMiddleware.verifyToken`
- Audit log for overrides (deferred to next milestone)

## Plan Breakdown

| Plan | Wave | Type | Description | Status |
|------|------|------|-------------|--------|
| 54-01 | 1 | execute | DB Migration: period_type + override columns | Not Started |
| 54-02 | 2 | execute | Backend API: selectedEmployeeIds + PATCH override endpoint | Not Started |
| 54-03 | 3 | execute | Frontend: New `/pages/payroll/wizard` page + 4-step wizard layout | Not Started |
| 54-04 | 3 | execute | Frontend: PayrollEmployeeSelector + PayrollEmployeeAdjustModal components | Not Started |
| 54-05 | 4 | execute | Frontend: Hook/service wiring + Sidebar link + `/calculate` redirect | Not Started |

## Wave Execution Order

```
Wave 1: [54-01] DB Migration
Wave 2: [54-02] Backend API
Wave 3: [54-03] [54-04] (parallel) — Frontend components
Wave 4: [54-05] Integration wiring
```

## Key Interfaces

### New wizard page route
- **Old:** `/pages/payroll/calculate` (keep for backward compat — redirect to `/wizard`)
- **New:** `/pages/payroll/wizard`

### Wizard step flow
```
Step 1: Período → period type (quincenal/mensual/rango libre) + dates
Step 2: Empleados → employee multi-select checkbox list
Step 3: Revisar/Ajustar → results table + per-employee override modal
Step 4: Aprobar → confirmation + PDF download link
```

### Backend contracts (from Plans 01 + 02)
- `NomineeService.calculatePayrollForPeriod(start, end, payrollId?, selectedEmployeeIds?)`
- `POST /nominee/calculate-payroll` → body: `{ startDate, endDate, payrollId?, selectedEmployeeIds? }`
- `PATCH /payroll/:id/employee/:empId/override` → body: `{ regularHours?, overtimeHours?, weeklyRestHours?, totalDeductions? }`

## Dependencies

- Plan 54-01 must complete before 54-02 (Prisma client needs new columns)
- Plan 54-02 must complete before 54-03/04 (frontend calls new endpoints)
- Plans 54-03 and 54-04 can execute in parallel (independent components)
- Plan 54-05 depends on 54-03 and 54-04 (wires everything together)

## Constraints

- No new npm packages — all functionality achievable with existing stack
- TypeScript must compile clean (`npx tsc --noEmit`) after each plan
- Existing `/pages/payroll/calculate` page must NOT be deleted (redirect only)
- All new components must use `dark:bg-zinc-950` / `dark:bg-zinc-900` palette (Tailwind 4)
- No raw `useState` for forms — always `react-hook-form` + `zodResolver`
- No raw `fetch` — always through `@/services/http.ts`
