# Phase 6 Research — Feriados Nacionales Costa Rica

**Phase:** 06  
**Goal:** `countWorkingDaysInPeriod()` debe excluir feriados nacionales de CR  
**Gathered:** 2026-03-27  
**Status:** Ready for planning

---

## Domain Context

### Costa Rica Official National Holidays (Feriados Nacionales Obligatorios)

Per Código de Trabajo de Costa Rica (Ley N° 2, 1943 y reformas):

| # | Date | Holiday | Notes |
|---|------|---------|-------|
| 1 | January 1 | Año Nuevo | Fixed |
| 2 | Thursday before Easter | Jueves Santo | Movable — Thursday before Easter Sunday |
| 3 | Friday before Easter | Viernes Santo | Movable — Friday before Easter Sunday |
| 4 | April 11 | Día de Juan Santamaría | Fixed (Law 9803 from 2019) |
| 5 | May 1 | Día del Trabajo | Fixed |
| 6 | July 25 | Anexión de Guanacaste | Fixed |
| 7 | August 15 | Día de la Asunción | Fixed (Law 9698 from 2019) |
| 8 | September 15 | Independencia de CR | Fixed |
| 9 | October 12 | Día de las Culturas | Fixed (Law 10088 from 2021) |
| 10 | December 25 | Navidad | Fixed |

**Movable holidays:** Jueves/Viernes Santo change each year based on Easter:
- 2026: Easter = April 5 → Jueves Santo = April 2, Viernes Santo = April 3
- 2027: Easter = March 28 → Jueves Santo = March 25, Viernes Santo = March 26

### Key Rules

1. **Sunday = día de descanso** (no se trabaja, ya excluido en código actual)
2. **Holiday on Sunday** = ya excluido por getDay() === 0, no double-count
3. **Holiday on Saturday** = si cae sábado NO cuenta como día laboral (semana laboral = L-S)
4. **Holiday en período** = se descuenta del conteo de días laborales

---

## Implementation Strategy

### Option A: Static Array (RECOMMENDED for MVP)

```typescript
// Static array of MM-DD strings per year
const FERiados_CR: Record<number, string[]> = {
  2026: ['01-01', '04-02', '04-03', '04-11', '05-01', '07-25', '08-15', '09-15', '10-12', '12-25'],
  2027: ['01-01', '03-25', '03-26', '04-11', '05-01', '07-25', '08-15', '09-15', '10-12', '12-25'],
};

// Helper to check if date is a CR holiday
function isCRHoliday(date: Date, year: number): boolean {
  const mmdd = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return FERiados_CR[year]?.includes(mmdd) ?? false;
}
```

**Pros:** Simple, testable, easy to update yearly
**Cons:** Requires annual update

### Option B: Date-Functions Library

```typescript
import { holidays } from 'date-fns/locale/es';
```

**Pros:** Auto-updates, handles Easter automatically
**Cons:** New dependency, more complex

### Recommended: Option A (Static Array)

Matches the success criteria: "estática, actualizable por año". The array is in `payrollUtils.ts` and can be updated annually.

### countWorkingDaysInPeriod() Modification

Current implementation (payrollUtils.ts:306-314):
```typescript
export function countWorkingDaysInPeriod(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getDay() !== 0) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}
```

**New implementation:**
```typescript
export function countWorkingDaysInPeriod(
  startDate: Date,
  endDate: Date,
  year?: number  // optional year override
): number {
  const yr = year ?? startDate.getFullYear();
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    // Exclude Sunday (0) and CR holidays
    if (current.getDay() !== 0 && !isCRHoliday(current, yr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}
```

### Also need to add:

1. `isCRHoliday(date: Date, year: number): boolean` — check if a date is a CR holiday
2. `getCRHolidays(year: number): Date[]` — return array of holiday dates for a year
3. Update `calculateScheduledHours` since it calls `countWorkingDaysInPeriod`

---

## Test Cases Needed

| Test | Input | Expected | Req |
|------|-------|----------|-----|
| Normal week (no holidays) | Jan 5-10, 2026 (Mon-Sat) | 6 days | 6.2 |
| Holiday on weekday | Jan 1, 2026 | 0 working days in [Jan 1-Jan 1] | 6.2 |
| Holiday on Sunday | Dec 21, 2025 (Sunday, no holiday) | 6 days in Dec 15-20 | 6.2 |
| Period with May 1 | May 1-15, 2026 | 12 working days (15 - 2 Sundays - 1 May 1) | 6.3 |
| Period with Sep 15 | Sep 11-17, 2026 (Fri-Thu) | 5 working days (Sep 15 + Sunday excluded) | 6.3 |
| Period with Dec 25 | Dec 21-27, 2026 | 5 working days (7 - 1 Sunday - 1 Dec 25) | 6.3 |
| Easter (Jueves Santo) | Apr 2-8, 2026 | 4 working days (Apr 2,3 excluded) | 6.3 |

---

## Files to Modify

1. `src/backend/src/utils/payrollUtils.ts` — add holidays array + `isCRHoliday()` + modify `countWorkingDaysInPeriod()`
2. `src/backend/src/__tests__/unit/payrollUtils.test.ts` — NEW file with holiday test cases

---

## Validation Architecture

### Dimension 8 Requirements

| Verification | Method | Command |
|---|---|---|
| `isCRHoliday` returns true for May 1, 2026 | unit test | `npm test` |
| `isCRHoliday` returns false for regular day | unit test | `npm test` |
| `countWorkingDaysInPeriod` excludes holidays | unit test | `npm test` |
| Period May 1-15 has 14 working days | unit test | `npm test` |
| Period Sep 11-17 has 6 working days | unit test | `npm test` |
| Period Dec 21-27 has 6 working days | unit test | `npm test` |
| TypeScript compiles | tsc | `npx tsc --noEmit` |
| All tests pass | jest | `npm test` |

### Test File Location
`src/backend/src/__tests__/unit/payrollUtils.test.ts` (new file)

### Framework: Jest (same as existing PayrollService.test.ts)
