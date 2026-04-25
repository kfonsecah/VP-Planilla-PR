---
phase: 36-backend-payroll-state-machine
plan: 01
subsystem: backend
tags: [payroll, state-machine, aguinaldo, api]
dependency_graph:
  requires:
    - PLANILLA-04
    - PLANILLA-05
  provides:
    - Payroll state machine methods (approvePayroll, markAsPaid, reopenPayroll, recalculatePayroll)
    - Aguinaldo calculation following Costa Rica labor law
    - REST API endpoints for all transitions
  affects:
    - PayrollService.ts
    - PayrollController.ts
    - PayrollRoutes.ts
    - Payroll model interface
tech_stack:
  added:
    - PayrollStatus import from @prisma/client
    - Approval/reopen tracking fields to Payroll interface
  patterns:
    - State machine implemented as service methods (not external library)
    - Audit trail via vpg_audit_logs for reopen operations
    - Recalculation snapshot saved to vpg_payroll_recalculations
key_files:
  created: []
  modified:
    - src/backend/src/service/PayrollService.ts
    - src/backend/src/controller/PayrollController.ts
    - src/backend/src/routes/PayrollRoutes.ts
    - src/backend/src/model/payroll.ts
decisions:
  - Used Prisma PayrollStatus enum instead of custom enum
  - Implemented state machine as service methods (no FSM library)
  - Used December 1 - November 30 period for aguinaldo (Costa Rica law Article 196)
  - Created audit log entry on reopen with previous_status in details
metrics:
  duration: ~30 minutes
  completed_date: 2026-04-15
---

# Phase 36 Plan 01: Backend State Machine de Planilla + Aguinaldo

## Summary

Implemented the payroll state machine (BORRADOR → APROBADA → PAGADA) and aguinaldo calculation per Costa Rica labor law. Added REST API endpoints for all state transitions and aguinaldo calculation.

## What Was Built

- **PayrollService**: Added 5 new methods:
  - `approvePayroll`: Transitions from BORRADOR to APROBADA with user tracking
  - `markAsPaid`: Transitions from APROBADA to PAGADA with adjustment lock
  - `reopenPayroll`: Transitions from APROBADA to BORRADOR with audit trail
  - `recalculatePayroll`: Saves snapshot to vpg_payroll_recalculations before recalc
  - `calculateAguinaldo`: Calculates aguinaldo using Dec 1 - Nov 30 period

- **PayrollController**: Added HTTP handlers for all 5 operations

- **PayrollRoutes**: Added 5 new endpoints:
  - POST /payroll/:id/approve
  - POST /payroll/:id/pay
  - POST /payroll/:id/reopen
  - POST /payroll/:id/recalculate
  - GET /payroll/aguinaldo/:employeeId/:year

- **Payroll Model**: Extended with approval/reopen tracking fields

## Implementation Details

- State machine implemented as service methods (no external FSM library)
- All transitions validate current status before allowing transition
- Reopen creates audit log entry with reason and previous status
- Aguinaldo formula: sum of gross salaries / 12 (proportional for partial years)
- All endpoints require authentication via AuthMiddleware

## Verification

- Build passes: `npm run build` in backend completes without errors
- All new methods verified via grep to exist in PayrollService.ts
- All 5 new routes verified in PayrollRoutes.ts
- All endpoints use AuthMiddleware (router.use at top)

## Known Stubs

None - all functionality is implemented.

## Deviations from Plan

None - plan executed exactly as written. The implementation combined Tasks 1-3 into a single commit since the service methods, controller, and routes are all interdependent and built together.