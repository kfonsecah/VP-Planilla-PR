# Summary 06-01 — Feriados CR en payrollUtils.ts

**Plan:** 06-01-PLAN.md  
**Phase:** 06 — Feriados Nacionales Costa Rica  
**Executed:** 2026-03-27  

---

## Changes Made

### 1. Added FERIADOS_CR array
Added after line 10 of `payrollUtils.ts`:
```typescript
export const FERIADOS_CR: Record<number, string[]> = {
  2026: ['01-01', '04-02', '04-03', '04-11', '05-01', '07-25', '08-15', '09-15', '10-12', '12-25'],
  2027: ['01-01', '03-25', '03-26', '04-11', '05-01', '07-25', '08-15', '09-15', '10-12', '12-25'],
};
```

### 2. Added isCRHoliday function
```typescript
export function isCRHoliday(date: Date, year?: number): boolean {
  const yr = year ?? date.getUTCFullYear();
  const mmdd = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return FERIADOS_CR[yr]?.includes(mmdd) ?? false;
}
```
Note: Uses UTC methods (`getUTCMonth`, `getUTCDate`) for timezone-safe date handling.

### 3. Added getCRHolidays function
```typescript
export function getCRHolidays(year: number): Date[] {
  const holidays = FERIADOS_CR[year] ?? [];
  return holidays.map((mmdd) => {
    const [month, day] = mmdd.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date;
  });
}
```

### 4. Modified countWorkingDaysInPeriod
Updated to exclude CR holidays:
```typescript
export function countWorkingDaysInPeriod(startDate: Date, endDate: Date, year?: number): number {
  const yr = year ?? startDate.getUTCFullYear();
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getUTCDay() !== 0 && !isCRHoliday(current, yr)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}
```
Note: Uses UTC methods throughout for consistent timezone handling.

## Verification

```bash
cd src/backend && npx tsc --noEmit  # → 27 pre-existing errors, 0 new
grep "FERIADOS_CR" src/backend/src/utils/payrollUtils.ts  # → exists
grep "isCRHoliday" src/backend/src/utils/payrollUtils.ts  # → exists
```

## Success Criteria

- [x] `FERIADOS_CR` static array with 2026 and 2027 holidays
- [x] `isCRHoliday()` timezone-safe using UTC methods
- [x] `getCRHolidays()` returns 10 holidays for 2026
- [x] `countWorkingDaysInPeriod()` excludes holidays and Sundays
- [x] `npx tsc --noEmit` passes (pre-existing errors unchanged)
