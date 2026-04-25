---
status: testing
phase: 36-backend-payroll-state-machine
source: 36-01-SUMMARY.md, 36-02-SUMMARY.md
started: 2026-04-16T17:20:00Z
updated: 2026-04-16T17:20:00Z
---

## Current Test

number: 1
name: approvePayroll - BORRADOR to APROBADA transition
expected: |
  POST /payroll/:id/approve
  - With valid payroll in BORRADOR status, transitions to APROBADA
  - Sets payrolls_approved_by and payrolls_approved_at timestamps
  - Returns {success: true, data: updated payroll}
awaiting: user response

## Tests

### 1. approvePayroll - BORRADOR to APROBADA transition
expected: POST /payroll/:id/approve transitions a BORRADOR payroll to APROBADA, sets approval user and timestamp
result: pending

### 2. approvePayroll - Reject non-BORRADOR
expected: POST /payroll/:id/approve returns error when payroll is not in BORRADOR status
result: pending

### 3. markAsPaid - APROBADA to PAGADA transition
expected: POST /payroll/:id/pay transitions an APROBADA payroll to PAGADA, locks adjustments
result: pending

### 4. markAsPaid - Reject non-APROBADA
expected: POST /payroll/:id/pay returns error when payroll is not in APROBADA status
result: pending

### 5. reopenPayroll - APROBADA to BORRADOR
expected: POST /payroll/:id/reopen with reason>=10 chars transitions APROBADA back to BORRADOR, creates audit log
result: pending

### 6. reopenPayroll - Reject short reason
expected: POST /payroll/:id/reopen returns error when reason < 10 characters
result: pending

### 7. recalculatePayroll - Snapshot and recalc
expected: POST /payroll/:id/recalculate saves snapshot to vpg_payroll_recalculations before recalc
result: pending

### 8. calculateAguinaldo - Full year
expected: GET /payroll/aguinaldo/:employeeId/:year returns sum of gross salaries / 12 for full year
result: pending

### 9. calculateAguinaldo - Partial year
expected: GET /payroll/aguinaldo/:employeeId/:year returns proportional aguinaldo for partial year
result: pending

### 10. All endpoints require authentication
expected: Calling any endpoint without valid auth token returns 401 Unauthorized
result: pending

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0
blocked: 0

## Gaps

[none yet]