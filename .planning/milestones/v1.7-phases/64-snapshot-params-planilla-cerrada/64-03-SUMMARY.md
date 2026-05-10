# Plan 64-03 Summary — Frontend: PayrollParamSnapshotSection

## What was built

- **`ParamSnapshot` interface** and **`PayrollWithSnapshot` interface** added to `payrollService.ts`.
- **`PayrollService.getPayrollSnapshot`** method: calls `GET /payroll/:id/snapshot` via `http.get` (which auto-unwraps `response.data`).
- **`PayrollParamSnapshotSection.tsx`**: collapsible component with:
  - ChevronDown toggle with `aria-expanded` for accessibility.
  - `AnimatePresence + motion.div` for smooth open/close animation.
  - Params grouped by key prefix (OT, CCSS, ENTERPRISE, GLOBAL…) with sub-header rows.
  - `ENTERPRISE_*` values shown as human-readable labels (EXACT → Exacto, etc.).
  - "Decreto" column only rendered when at least one row has `source_decree`.
  - Returns `null` for empty snapshot arrays (graceful degradation for pre-Phase-64 payrolls).
- **Payroll detail page** (`/pages/payroll/[id]`):
  - Added `snapshots: ParamSnapshot[]` and `snapshotsLoading: boolean` state.
  - `loadPayrollDetails` conditionally fetches snapshot for APROBADA/PAGADA status.
  - Snapshot section inserted after employee table, gated on `payroll.status === 'APROBADA' || 'PAGADA'`.

## Key Technical Decisions

- `http.get` already unwraps `response.data` — no extra unwrapping needed.
- Snapshot loading errors degrade gracefully (`console.warn` + empty array) so old payrolls don't crash the page.
- Used Lucide `ChevronDown` (not heroicons) to match UI-SPEC requirement.

## Verification

- `npx tsc --noEmit` (frontend) → exit 0
- `npx next lint` → No ESLint warnings or errors
