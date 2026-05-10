---
status: partial
phase: 22-dashboard-ui-de-marcas
source: [22-VERIFICATION.md]
started: 2026-04-06T00:54:21Z
updated: 2026-04-06T00:54:21Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Stats cards render with correct colors; zero-count cards hidden
expected: Cards for pending (gray), valid (green), anomaly (amber), orphan (red), corrected (blue) visible; any with 0 count are hidden
result: [pending]

### 2. Status filter toggles re-fetch table with correct filter
expected: Table content updates immediately, pagination resets to page 1 on each toggle
result: [pending]

### 3. Employee autocomplete filters table by selected employee
expected: Filtered results show only rows for the selected employee; clear button resets filter
result: [pending]

### 4. Clicking "Ver"/"Corregir" opens modal with all 8 detail fields, audit history, and action buttons
expected: Modal slides in with spring animation; all fields populated; Historial de Auditoria section present; "Marcar como Corregido" and "Descartar" buttons visible
result: [pending]

### 5. End-to-end correction flow updates status in table
expected: PATCH /api/clock-logs/:id/status called; toast success shown; modal closes; table row status badge updates to "Corregida"
result: [pending]

### 6. Import Sessions Panel shows up to 5 recent sessions with correct columns
expected: Panel visible above table; each row shows locale-formatted date, source label (Java/Excel/Manual), status badge, and counts
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
