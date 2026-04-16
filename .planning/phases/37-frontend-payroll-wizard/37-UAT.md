---
status: testing
phase: 37-frontend-payroll-wizard
source: 37-01-SUMMARY.md, 37-02-SUMMARY.md, 37-03-SUMMARY.md, 37-04-SUMMARY.md
started: 2026-04-16T17:30:00Z
updated: 2026-04-16T17:30:00Z
---

## Current Test

number: 7
name: Payroll List - Contextual Actions
expected: |
  In /payroll/list, contextual action buttons appear based on status:
  - BORRADOR row: "Aprobar" button
  - APROBADA row: "Marcar como Pagada" + "Reabrir" buttons
  - PAGADA row: "Reabrir" button
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Start the frontend and backend servers. Access the payroll page at /payroll. Both servers boot without errors.
result: pass
notes: Fixed - created missing route page.tsx

### 2. Wizard - Period Selection (Step 1)
expected: |
  Navigate to /payroll. See a list of biweekly period cards (e.g., "1-15 Abril 2026", "16-30 Abril 2026").
  Each card shows period dates and status ("Sin calcular", "Borrador", "Aprobada", "Pagada").
  Click on a period card -> card shows green border (#16a34a) indicating selection.
  Green "Continuar" button appears.
result: pass

### 3. Wizard - Review (Step 2)
expected: |
  Click "Continuar" in Step 1. See Step 2: Review screen.
  Shows summary: total employees, total hours, total gross, total deductions, total net.
  Table shows each employee with: regular hours, overtime hours, regular pay, overtime pay, deductions, net.
  Click on an employee row -> expands to show detailed breakdown.
result: issue
reported: "shows placeholder text 'Vista de revisión de cálculo' but no actual data"
severity: major

### 4. Wizard - Warning Banners
expected: |
  In Step 2 Review, if any employee has missing clock marks or anomalies,
  an amber/yellow warning banner appears per employee:
  "Juan Pérez: 3 días sin marcas en el período"
result: [pending]

### 5. Wizard - Approve (Step 3)
expected: |
  Click "Continuar" from Step 2. See Step 3: Confirm screen.
  Shows executive summary with final totals.
  Text input requires typing "APROBAR" to enable the approve button.
  Green "Aprobar Planilla" button becomes enabled after typing.
  Click approve -> payroll transitions to APROBADA status.
result: issue
reported: "same issue - no data, probably associated with step 2 and step 2 have no data"
severity: major

### 6. Payroll List - Status Badges
expected: |
  Navigate to /payroll/list (the list page).
  Each payroll row shows a status badge:
  - BORRADOR: gray/zinc badge
  - APROBADA: green badge
  - PAGADA: blue badge
result: issue
reported: "PAGADA is gray (should be blue), BORRADOR is orange (should be gray)"
severity: cosmetic

### 7. Payroll List - Contextual Actions
expected: |
  In /payroll/list, contextual action buttons appear based on status:
  - BORRADOR row: "Aprobar" button
  - APROBADA row: "Marcar como Pagada" + "Reabrir" buttons
  - PAGADA row: "Reabrir" button
result: issue
reported: "PAGADA doesn't show 'Reabrir' button, APROBADA doesn't show buttons either"
severity: major

## Summary

total: 7
passed: 2
issues: 4
pending: 1
skipped: 0
blocked: 0

## Gaps

- truth: "Step 2 Review shows placeholder instead of actual payroll calculation data"
  status: failed
  reason: "User reported: shows placeholder text 'Vista de revisión de cálculo' but no actual data"
  severity: major
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Step 3 Approve shows placeholder instead of payroll summary data"
  status: failed
  reason: "User reported: same issue as Step 2 - no data"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Status badges have wrong colors"
  status: failed
  reason: "User reported: PAGADA is gray (should be blue), BORRADOR is orange (should be gray)"
  severity: cosmetic
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Contextual action buttons not showing"
  status: failed
  reason: "User reported: PAGADA doesn't show 'Reabrir' button, APROBADA doesn't show buttons either"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""