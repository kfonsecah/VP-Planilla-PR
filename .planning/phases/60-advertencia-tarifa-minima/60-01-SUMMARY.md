# Phase 60 Plan 01: Infraestructura de detección de salarios bajos Summary

**Phase:** 60
**Plan:** 01
**Subsystem:** Payroll / Audit
**Tags:** #frontend #backend #audit #payroll-wizard
**Duration:** 15 minutes
**Completed Date:** 2026-04-28

## Key Results
- **Frontend Service**: Created `LegalParamService.ts` to interact with legal parameters API.
- **Wizard State**: Extended `usePayrollWizard` hook to store `minWageCheckEnabled` and `globalMinWageRate`.
- **Backend Audit**: Implemented logic in `PayrollService.approvePayroll` to log a warning in `vpg_audit_logs` when a payroll with underpaid employees is approved (if the check is enabled).

## Key Files
- `src/frontend/src/services/legalParamService.ts` (Created)
- `src/frontend/src/hooks/usePayrollWizard.ts` (Modified)
- `src/backend/src/service/PayrollService.ts` (Modified)

## Deviations from Plan
- None - plan executed exactly as written.

## Decisions Made
- **Audit Action**: Defined `APPROVE_WITH_MIN_WAGE_WARNING` as the action key for audit logs when underpaid employees are detected during approval.
- **Audit Details**: The audit log details include the configured minimum wage rate, count of affected employees, and their IDs for traceability.

## Threat Flags
| Flag | File | Description |
|------|------|-------------|
| threat_flag: audit_bypass | src/backend/src/service/PayrollService.ts | The audit log only triggers if `MIN_WAGE_CHECK_ENABLED` is `1`. This is by design as per requirements. |

## Self-Check: PASSED
- [x] `LegalParamService.ts` exists and exports expected methods.
- [x] `usePayrollWizard.ts` has the new state and reset logic.
- [x] `PayrollService.ts` includes the audit logic in `approvePayroll`.
- [x] All tests passed (546 tests).
