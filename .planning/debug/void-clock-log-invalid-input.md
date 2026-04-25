---
slug: void-clock-log-invalid-input
status: resolved
trigger: "[VoidClockLogModal] Error voiding clock log: ApiError: Invalid input: expected number, received undefined, Invalid input: expected number, received null, Invalid option: expected one of \"IN\"|\"OUT\""
created: 2026-04-16
updated: 2026-04-16
---

## Symptoms

- **Expected behavior**: User clicks "Confirmar" in VoidClockLogModal, clock log is voided successfully.
- **Actual behavior**: API call fails with validation errors: `expected number, received undefined`, `expected number, received null`, `Invalid option: expected one of "IN"|"OUT"`.
- **Error messages**:
  ```
  ApiError: Invalid input: expected number, received undefined, Invalid input: expected number, received null, Invalid option: expected one of "IN"|"OUT"
      ApiError http.ts:47
      requestJson http.ts:268
      post http.ts:290
      voidClockLog clockLogAdjustmentService.ts:69
      handleConfirm VoidClockLogModal.tsx:68
  ```
- **Stack trace**: Error originates in `VoidClockLogModal.tsx:68` → `handleConfirm` → `voidClockLog` in `clockLogAdjustmentService.ts:69` → `http.ts post`
- **Timeline**: Reported during Phase 35 integration testing
- **Reproduction**: Open VoidClockLogModal, fill in reason, click confirm → error thrown

## Current Focus

hypothesis: RESOLVED
next_action: none

## Evidence

- timestamp: 2026-04-16T00:00:00Z
  finding: EffectiveClockLog.original shape (from effectiveMarksService.ts): { in_time, out_time, in_log_id, out_log_id, status, source }. No id, timestamp, type, or created_at fields.
  source: src/frontend/src/services/effectiveMarksService.ts lines 9-18

- timestamp: 2026-04-16T00:00:01Z
  finding: page.tsx onVoidEntry constructs ClockLog with id=String(entry.original.id) [undefined], timestamp=entry.original.timestamp [undefined], type=entry.original.type [undefined], created_at=entry.original.created_at [undefined]. All four fields are undefined at runtime.
  source: src/frontend/src/app/pages/clock-logs/page.tsx lines 295-307 (pre-fix)

- timestamp: 2026-04-16T00:00:02Z
  finding: clockLogAdjustmentService.voidClockLog sends Number(id) and Number(employeeId). Number("undefined")=NaN, which fails z.number() Zod validation. log_type=undefined fails z.enum(['IN','OUT']).
  source: src/frontend/src/services/clockLogAdjustmentService.ts lines 72-81

- timestamp: 2026-04-16T00:00:03Z
  finding: AdjustmentSchema VOID requires employee_id (number, positive), clock_log_id (number, positive), log_type ('IN'|'OUT'). All three fail when undefined/NaN is passed.
  source: src/backend/src/schemas/AdjustmentSchema.ts lines 31-38

- timestamp: 2026-04-16T00:00:04Z
  finding: Same field mismatch exists in onEditEntry callback. Also DailyRow.tsx lines 59 and 200 access log.original?.id which is also undefined.
  source: src/frontend/src/app/pages/clock-logs/page.tsx lines 282-294 (pre-fix), src/frontend/src/components/DailyRow.tsx lines 59, 200 (pre-fix)

## Eliminated

- VoidClockLogModal form logic: form validates correctly before calling service; guard clause prevents null dereference.
- Backend Zod schema: schema is correct, correctly rejects undefined/NaN/null values.
- clockLogAdjustmentService.voidClockLog: payload construction is correct given valid inputs; the issue was the inputs were undefined.

## Resolution

root_cause: Field name mismatch in page.tsx onVoidEntry/onEditEntry conversion code. EffectiveClockLog.original has in_log_id/out_log_id/in_time/out_time but the code read .id/.timestamp/.type/.created_at (all undefined at runtime). This produced NaN for numeric IDs and undefined for log_type, failing Zod validation on the backend.
fix: Extracted a toAdjustmentClockLog() helper in page.tsx that correctly maps EffectiveClockLog.original.in_log_id (falling back to out_log_id) for the ID, in_time/out_time for the timestamp, and derives type as 'IN'/'OUT' from which log_id is non-null. Updated both onEditEntry and onVoidEntry to use this helper. Fixed DailyRow.tsx audit fetch and timeline to use in_log_id/out_log_id instead of the non-existent .id field. Corrected the state variable types from clockLogsService.ClockLog to clockLogAdjustmentService.ClockLog (AdjustmentClockLog) for type accuracy.
verification: npx tsc --noEmit in src/frontend/ — zero errors in any changed file.
files_changed:
  - src/frontend/src/app/pages/clock-logs/page.tsx
  - src/frontend/src/components/DailyRow.tsx
