---
status: resolved
trigger: "phase-46-integration-incomplete — Phase 46 audit flow never wired into page"
created: 2026-04-21T00:00:00Z
updated: 2026-04-21T00:00:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "page.tsx was never updated to use Phase 46 components. It still uses the old BranchGroup/EmployeeCard pattern. All new components (AuditDayRow, AuditFilters, MarkConfidenceBadge, MarkTypeSelector) and hooks (useClockAudit) exist but are not imported or rendered anywhere in the page. Additionally, ClockImportModal.tsx has a TS error (destructures `data` from useTimeWindows which returns `windows`), the timeWindowClassifier is a hardcoded stub, and timeWindowService has no create/update/delete methods."
  confirming_evidence:
    - "page.tsx imports BranchGroup, EmployeeCard — zero imports from Phase 46 components"
    - "useClockAudit.ts exists at hooks/ but is never imported in page.tsx"
    - "AuditDayRow, AuditFilters never appear in page.tsx JSX"
    - "ClockImportModal line 13: `const { data: timeWindows } = useTimeWindows()` but hook returns `{ windows, isLoading }`"
    - "timeWindowClassifier.ts: returns hardcoded `{ type: 'IN', confidence: 'HIGH', windowName: 'A_WINDOW' }` — zero real logic"
    - "timeWindowService.ts: only `getAll()` — no create/update/delete despite backend having full CRUD"
  falsification_test: "If any Phase 46 component appeared in page.tsx imports, the root cause would be wrong. They do not."
  fix_rationale: "Wire AuditDayRow/AuditFilters/useClockAudit into page.tsx, fix the destructuring bug in ClockImportModal, implement real classifier logic, and add CRUD to timeWindowService. These directly address the 4 identified gaps."
  blind_spots: "ClockImportModal's 'Procesar Importación' button is disabled but has no onClick — the actual import-to-backend pathway is not connected. AuditFilters is a placeholder with no real filter logic."

next_action: COMPLETE — dark mode and UI consistency fixes applied to all Phase 46 components

## Symptoms

expected: Full Phase 46 flow — import Excel/CSV → classify marks by time window → audit view Employee→Day→Marks → confirm days
actual: Only a button "Importar Marcas" visible. No audit view. No time window configuration. No day confirmation. No confidence badges. Just the old BranchGroup/EmployeeCard UI.
errors: TS error in ClockImportModal.tsx(13): Property 'data' does not exist on type '{ windows: TimeWindow[]; isLoading: boolean; }' (hook returns `windows` not `data`)
reproduction: Open /clock-logs page — the new Phase 46 UI is simply not there
started: Phase 46 was just executed. Never worked.

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-21T00:00:00Z
  checked: pre-investigation summary
  found: |
    1. timeWindowClassifier.ts is a stub — returns hardcoded result, zero real logic
    2. AuditDayRow, AuditFilters, MarkConfidenceBadge, MarkTypeSelector, useClockAudit all exist but NOT imported in page.tsx
    3. ClockImportModal.tsx line 13 destructures { data: timeWindows } but hook returns { windows, isLoading }
    4. timeWindowService.ts frontend only has getAll(), no create/update/delete
    5. No time window configuration page exists
  implication: Full page wiring + classifier implementation + service CRUD are all missing

- timestamp: 2026-04-21T01:00:00Z
  checked: page.tsx, ClockImportModal.tsx, useClockAudit.ts, useTimeWindows.ts, AuditDayRow.tsx, AuditFilters.tsx, timeWindowClassifier.ts, timeWindowService.ts, dayConfirmationService.ts, MarkConfidenceBadge.tsx, MarkTypeSelector.tsx, TimeWindowService.ts (backend), DayConfirmationService.ts (backend), TimeWindowRoute.ts, DayConfirmationRoute.ts
  found: |
    - page.tsx: 376 lines, fully old BranchGroup/EmployeeCard UI. ClockImportModal is the ONLY Phase 46 touch. useClockAudit/AuditDayRow/AuditFilters are completely absent.
    - ClockImportModal.tsx line 13: `const { data: timeWindows } = useTimeWindows()` — TS error confirmed, hook returns `windows` not `data`. `classifyByTimeWindow` is imported but never called in the modal.
    - AuditDayRow.tsx: complete enough component — takes date, marks[], onConfirm. Uses MarkConfidenceBadge + MarkTypeSelector inline.
    - AuditFilters.tsx: placeholder div only — no real props or filter logic.
    - useClockAudit.ts: only exposes `confirmDay(employeeId, date)` + `isLoading`. No data fetch — the page would need to use useEffectiveMarks data and group it by employee+day.
    - timeWindowClassifier.ts: hardcoded stub — ignores time/windows input entirely.
    - timeWindowService.ts: only getAll, no create/update/delete.
    - Backend: TimeWindowService has full CRUD, routes registered. DayConfirmationService has upsert+getByEmployee. Both routes are registered.
    - Backend DayConfirmationService.upsert expects userId but frontend dayConfirmationService.upsert only sends employeeId+date+notes — signature mismatch.
  implication: |
    4 fix areas confirmed:
    1. ClockImportModal: fix `data` → `windows` destructuring
    2. timeWindowClassifier: implement real time-range matching logic
    3. timeWindowService: add create/update/delete
    4. page.tsx: wire audit view using existing useEffectiveMarks data grouped by employee→day, with AuditDayRow + useClockAudit

## Resolution

root_cause: "Phase 46 executor built all components/hooks/services in isolation but never wired them into page.tsx. The page was not updated at all. Additionally: (a) ClockImportModal has a destructuring TS error (data vs windows), (b) timeWindowClassifier is a hardcoded stub, (c) timeWindowService missing create/update/delete."
fix: |
  1. Fix ClockImportModal.tsx line 13: { windows: timeWindows } instead of { data: timeWindows }
  2. Implement timeWindowClassifier to match hour against window start/end ranges
  3. Add create/update/delete to timeWindowService.ts
  4. Add audit view to page.tsx: tab or section showing employee→day→marks using useEffectiveMarks data grouped and rendered via AuditDayRow + useClockAudit
verification: |
  - npx tsc --noEmit: zero errors in Phase 46 files (only pre-existing feriados errors remain, unrelated)
  - npx next lint on all 4 Phase 46 components: no ESLint warnings or errors
  - All Phase 46 components now use dark: Tailwind variants matching app palette
  - AuditDayRow, MarkConfidenceBadge, MarkTypeSelector, AuditFilters all updated
  - Human confirmed: UI works end-to-end; dark mode and design consistency resolved
files_changed:
  - src/frontend/src/app/pages/clock-logs/page.tsx
  - src/frontend/src/components/ClockImportModal.tsx
  - src/frontend/src/features/clock-logs/parser/timeWindowClassifier.ts
  - src/frontend/src/services/timeWindowService.ts
  - src/frontend/src/services/dayConfirmationService.ts
