# Research: Phase 50 - Corrección Lógica de Nivel de Confianza y Estatus

## Problem Analysis

### 1. Confidence vs Status
- Currently, `has_issues` (the amber alert) is triggered if `confidence !== 'HIGH'` OR `status !== 'valid'`.
- Requirement: Only `status` should matter. `confidence` should be ignored for alerts.
- Problematic statuses: `anomaly`, `orphan`, `pending`.
- Clean statuses: `valid`, `corrected`.

### 2. Optimistic Updates
- When adding, editing, or voiding marks, the UI currently waits for a `refresh()` (background reload) to update the alert badge.
- Requirement: Update the badge to "green" (no issues) immediately after the action succeeds (or even before, but usually after success is safer if it's "optimistic" but here they ask for fluidity).
- `confirmDay` already does this for the "confirmed" state.
- We need similar logic for "clearing" issues.

## Code Locations

### Frontend
- `src/frontend/src/app/pages/clock-logs/page.tsx`:
    - `AuditMark` interface needs `status`.
    - `buildAuditMarksForLog` needs to populate `status`.
    - `buildAuditData` needs to update `has_issues` logic.
- `src/frontend/src/components/AuditDayRow.tsx`:
    - `DayMark` interface needs `status`.
    - `hasIssues` logic needs to be updated.
- `src/frontend/src/hooks/useClockAudit.ts`:
    - This hook handles the actions. It could manage the optimistic state for cleared issues.

### Backend
- No changes required in backend logic as it already provides the `status` we need.

## Implementation Strategy

1.  **Data Structure Update**:
    - Add `status` to `AuditMark` and `DayMark` types.
    - Pass `status` from `EffectiveClockLog` to these types.

2.  **Logic Update**:
    - Define a helper `isProblematicStatus(status: string): boolean`.
    - Update `has_issues` to use this helper and ignore `confidence`.

3.  **Optimistic UI**:
    - In `useClockAudit`, add a state `optimisticCleanDays` (Set of `employeeId_date`).
    - When `addMarkInline`, `changeMarkTypeInline`, or `voidMarkInline` is called, add the day to this set.
    - In `page.tsx`, use this set to override `has_issues` for those days/employees.

## Verification Plan

### Automated Tests
- Since this is UI logic, I should check if there are tests for `page.tsx` or `AuditDayRow.tsx`.
- I might need to add a test case to verify the alert logic.

### Manual Verification
- Load clock logs with "LOW" confidence but "valid" status -> Alert should be OFF.
- Load clock logs with "anomaly" status -> Alert should be ON.
- Add a mark to an "orphan" entry -> Alert should turn OFF immediately.
