---
phase: 44
slug: core-motor-feriados-globales
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
validated: 2026-04-19
---

# Phase 44 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---


## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `src/backend/jest.config.ts` |
| **Quick run command** | `cd src/backend && npx tsc --noEmit` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~15 seconds |

---


## Sampling Rate

- **After every task commit:** Run `cd src/backend && npx tsc --noEmit`
- **After every plan wave:** Run `cd src/backend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---


## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 44-01-01 | 01 | 1 | 1.1 | grep | `grep -r "model CompanyHoliday" prisma/schema.prisma`  1 | ? green |
| 44-01-02 | 01 | 1 | 1.2 | typecheck | `cd src/backend && npx tsc --noEmit` exits 0 | ? green |
| 44-01-03 | 01 | 1 | 1.3 | grep | `grep -r "from '../lib/prisma'" src/backend/src/service/companyHolidayService.ts`  1 | ? green |
| 44-02-01 | 02 | 1 | 2.1 | grep | `grep -r "FERIADOS_CR" src/backend/src/utils/payrollUtils.ts`  0 | ? green |
| 44-02-02 | 02 | 1 | 2.2 | typecheck | `cd src/backend && npx tsc --noEmit` exits 0 | ? green |
| 44-02-03 | 02 | 1 | 2.3 | grep | `grep -r "prisma.companyHoliday.findMany" src/backend/src/service/payrollService.ts`  1 | ? green |
| 44-03-01 | 03 | 1 | 3.1 | grep | `grep -r "holidaysService" src/frontend/src/components/LaborEventsCalendar.tsx`  1 | ? green |
| 44-03-02 | 03 | 1 | 3.2 | grep | `grep -r "is_mandatory_pay" src/frontend/src/app/pages/configuracion/feriados/page.tsx`  1 | ? green |
| 44-03-03 | 03 | 1 | 3.3 | typecheck | `cd src/frontend && npx tsc --noEmit` exits 0 | ? green |

*Status: ? pending � ? green � ? red � ?? flaky*

---


## Wave 0 Requirements

No new test files needed - validation is purely via grep and TypeScript compiler.

*Existing infrastructure covers all phase requirements.*

---


## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sin cambios de comportamiento observable | 1.3 | Requiere correr el servidor y ejecutar operaciones | Iniciar backend, crear un company holiday, verificar que la operaci�n retorna 200 |
| Payroll calculations correct with holidays | 2.3 | Requiere ejecutar nomina y verificar montos | Generar planilla para un periodo que incluya un feriado obligatorio y verificar que el salario es 2x |
| Admin UI functional | 3.2 | Requiere interacci�n con la UI | Navegar a /configuracion/feriados, crear un feriado, verificar que aparece en la lista y en el calendario |

---


## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ? VALIDATED 2026-04-19

## Validation Audit 2026-04-19

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Verification Results
- `model CompanyHoliday` count: 1 ?
- `from '../lib/prisma'` count: 1 ?
- `FERIADOS_CR` count: 0 ?
- `prisma.companyHoliday.findMany` count: 1 ?
- `holidaysService` count: 1 ?
- `is_mandatory_pay` count: 1 ?