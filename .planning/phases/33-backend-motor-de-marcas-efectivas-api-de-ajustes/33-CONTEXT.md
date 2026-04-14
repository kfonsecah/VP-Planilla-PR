# Context: Phase 33 — Backend: Motor de Marcas Efectivas + API de Ajustes

## Phase Objective
Implement the business logic and API endpoints to manage non-destructive adjustments (EDIT/VOID) to clock logs and expose a "Effective Marks" endpoint that provides paired entries for payroll calculation.

## Implementation Decisions

### 1. Data Structure & API Response
- **Effective Mark Model**: The API will return an object containing both the **original value** and the **adjusted value**. This enables the UI to show comparison views (e.g., original time vs. corrected time).
- **Paired Output**: The primary endpoint (`MARCAS-06`) MUST return **paired entries** (IN/OUT pairs) with calculated durations, not just a flat list of logs. This simplifies the Payroll Wizard logic.

### 2. Adjustment Logic
- **Scope**: Adjustments (`vpg_clock_log_adjustments`) will be used strictly for `EDIT` and `VOID` operations. New manual logs will continue to be created directly in `vpg_clock_logs` (Phase 21 legacy), keeping the adjustment layer focused on corrections.
- **Precedence (Stacking)**: If multiple adjustments exist for the same log, the most recent `ACTIVE` adjustment applies. If an adjustment is deactivated, the logic "falls back" to the previous adjustment or the original log if no others exist.
- **Audit Trail**: Every adjustment operation must trigger an entry in `vpg_audit_logs` including the justification (minimum 10 characters).

### 3. Business Constraints & Safety
- **Payroll Lock**: Adjustments are **FORBIDDEN** for any clock log belonging to a payroll period that is already in `PAGADA` (Paid) status. 
- **Justification**: The 10-character minimum for justifications is a strict API-level requirement (Zod validation).

## Reusable Assets & Patterns
- **Service Layer**: Logic will reside in `ClockLogAdjustmentService.ts` (New) and extend `ClockLogsService.ts`.
- **Pairing Engine**: Re-use/Refactor pairing logic from `ClockLogAnalysisService.ts` to ensure consistency between anomaly detection and effective marks calculation.
- **Audit Pattern**: Use `AuditLogsService.static` methods for consistency with Phase 31/32.

## Success Criteria for Phase 33
- [ ] Endpoint `GET /api/clock-logs/effective` returns paired IN/OUT entries for a date range/employee.
- [ ] Endpoint `POST /api/clock-logs/adjust` handles `EDIT` and `VOID` with justification.
- [ ] Attempting to adjust logs from a `PAGADA` payroll returns a 403/400 error.
- [ ] Unit tests verify the fallback logic (Adjust 2 -> Adjust 1 -> Original).
