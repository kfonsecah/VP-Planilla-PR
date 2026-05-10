# Phase 6 Plan — Feriados Nacionales Costa Rica

## Meta
- **Wave:** 1
- **Depends on:** Phase 4 (Performance del Cálculo de Planilla)
- **Files modified:** 
  - src/backend/src/utils/payrollUtils.ts
  - src/backend/src/__tests__/unit/payrollUtils.test.ts

## Requirements Coverage

| Requirement | Description | Plan |
|-------------|-------------|------|
| 6.1 | Lista de feriados CR en payrollUtils.ts (estática, actualizable por año) | 06-01 |
| 6.2 | countWorkingDaysInPeriod() excluye feriados del conteo | 06-01, 06-02 |
| 6.3 | Tests unitarios para períodos que incluyen 1 mayo, 15 setiembre y 25 dic | 06-03 |
| 6.4 | npm test pasa con 0 failures | 06-03 |

## Must-Haves (goal-backward verification)

- [ ] `FERIADOS_CR` constant exists in payrollUtils.ts with 2026 and 2027 holiday arrays
- [ ] `isCRHoliday(date, year?)` returns true for May 1, Sep 15, Dec 25, 2026
- [ ] `countWorkingDaysInPeriod(2026-05-01, 2026-05-15)` returns 14 (excludes May 1)
- [ ] `countWorkingDaysInPeriod(2026-09-11, 2026-09-17)` returns 6 (excludes Sep 15)
- [ ] `countWorkingDaysInPeriod(2026-12-21, 2026-12-27)` returns 6 (excludes Dec 25)
- [ ] `countWorkingDaysInPeriod(2026-04-02, 2026-04-08)` returns 4 (excludes Apr 2, 3)
- [ ] `npm test` passes with 0 failures

## Plans

| Plan | Task | Wave | Status |
|------|------|------|--------|
| 06-01-PLAN.md | Agregar FERIADOS_CR + isCRHoliday + modificar countWorkingDaysInPeriod | 1 | Pending |
| 06-02-PLAN.md | Verificar compatibilidad de calculateScheduledHours | 1 | Pending |
| 06-03-PLAN.md | Crear tests unitarios y verificar npm test | 2 | Pending |

## Execution Order

1. **Wave 1** (can run in parallel):
   - 06-01: Implement holidays in payrollUtils.ts
   - 06-02: Verify backward compatibility

2. **Wave 2** (depends on Wave 1):
   - 06-03: Create tests and verify npm test passes
