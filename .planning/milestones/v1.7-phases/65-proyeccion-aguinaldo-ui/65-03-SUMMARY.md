# Phase 65 Plan 03: Frontend Profile Card Summary

Build the employee profile aguinaldo card with period visibility.

## Key Changes

### Frontend Logic & Data Layer
- Created `AguinaldoAccrual` and `AguinaldoSummaryRow` interfaces in `src/frontend/src/types/aguinaldo.ts`.
- Implemented `aguinaldoService` in `src/frontend/src/services/aguinaldoService.ts` to fetch aguinaldo data from backend.
- Created `useAguinaldo` custom hook in `src/frontend/src/hooks/useAguinaldo.ts` to handle loading, error, and data state.

### UI Components
- Created `AguinaldoCard.tsx` which displays:
  - **Period Label**: Explicitly shows "Período: [start] - [end]" (Mitigation for T-65-04).
  - **Accrued Amount**: Formatted in CRC (₡).
  - **Progress Bar**: Reflects the percentage of the fiscal year completed.
  - **Projection**: Shows the projected annual amount for December 20th.
  - **Metadata**: Shows the number of payrolls included in the calculation.
  - **Loading Skeleton**: Integrated for better UX while fetching data.
- Integrated `AguinaldoCard` into `ProfileSummaryTab.tsx`, adding it as a new section in the employee profile dashboard.

## Verification Results

### Automated Tests
- `npx tsc --noEmit` in `src/frontend` passed successfully.
- Verified that `periodStart` and "Período:" label exist in the card component.

## Deviations
None - plan executed exactly as written.

## Self-Check: PASSED
- [x] All tasks executed
- [x] Each task committed individually
- [x] npx tsc --noEmit passes in src/frontend
- [x] AguinaldoCard displays the "Período" label correctly
- [x] Accrued amount and progress bar are visible
