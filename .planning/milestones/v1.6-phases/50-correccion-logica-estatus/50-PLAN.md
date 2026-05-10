# Plan: Phase 50 - Corrección Lógica de Nivel de Confianza y Estatus

## Goal
Decouple the "requires review" alert from the `confidence` level and rely strictly on `status`. Implement optimistic UI updates for these alerts to improve user experience during audit.

## Tasks

### 1. Data Structure Update
- [ ] Modify `AuditMark` interface in `src/frontend/src/app/pages/clock-logs/page.tsx` to include `status`.
- [ ] Modify `DayMark` interface in `src/frontend/src/components/AuditDayRow.tsx` to include `status`.
- [ ] Update `buildAuditMarksForLog` in `src/frontend/src/app/pages/clock-logs/page.tsx` to pass `status` from `log.original.status`.

### 2. Logic Update
- [ ] Update `buildAuditData` in `src/frontend/src/app/pages/clock-logs/page.tsx`:
    - Remove `confidence !== 'HIGH'` check.
    - Change `has_issues` to check for `anomaly`, `orphan`, `pending` statuses.
- [ ] Update `hasIssues` in `src/frontend/src/components/AuditDayRow.tsx` to use the same status-based logic.

### 3. Optimistic UI
- [ ] Update `src/frontend/src/hooks/useClockAudit.ts`:
    - Add `clearedDays` state (Set of `employeeId_date`).
    - Update `clearedDays` when `addMarkInline`, `changeMarkTypeInline`, or `voidMarkInline` succeed.
    - Expose `clearedDays`.
- [ ] Update `src/frontend/src/app/pages/clock-logs/page.tsx`:
    - Use `clearedDays` to override `has_issues` to `false` in `buildAuditData`.

### 4. Verification
- [ ] Add unit tests in `src/frontend/src/__tests__/pages/clock-logs/page.test.tsx` to verify:
    - Alert is OFF for LOW confidence + valid status.
    - Alert is ON for anomaly status.
    - Alert is OFF for a day that is in `clearedDays`.
- [ ] Run `npx tsc --noEmit` to ensure type safety.
