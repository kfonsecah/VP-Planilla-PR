---
status: awaiting_human_verify
trigger: "In AddEmployee modal, phone number and sex fields are filled by user but saved as null in database when creating a new employee."
created: 2026-04-18T00:00:00Z
updated: 2026-04-18T00:15:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "createEmployeeSchema in EmployeeSchema.ts does not include employee_phone or employee_gender. The validateBody middleware replaces req.body with the Zod-parsed result.data, and Zod z.object() strips unknown keys by default. So even though the frontend correctly sends both fields and the previous fix added them to the controller and service, the validateBody middleware strips them BEFORE the controller receives req.body."
  confirming_evidence:
    - "validateBody.ts line 20: req.body = result.data — replaces body with Zod-parsed output, stripping unknown keys"
    - "createEmployeeSchema lines 3-16: defines no employee_phone or employee_gender fields"
    - "updateEmployeeSchema lines 42-43: correctly includes employee_phone and employee_gender (explains why update works but create does not)"
    - "EmployeeController.createEmployee and EmployeeService.createEmployee now have the phone/gender code from the previous fix, but they never receive those values because validateBody strips them first"
    - "The frontend service (employeeService.ts lines 34-35) correctly sends employee_phone and employee_gender in the POST payload"
  falsification_test: "If employee_phone and employee_gender are added to createEmployeeSchema, validateBody will pass them through and the controller will receive them."
  fix_rationale: "Add employee_phone and employee_gender to createEmployeeSchema so validateBody does not strip them."
  blind_spots: "None — the full chain is now traced end-to-end."

next_action: Add employee_phone and employee_gender to createEmployeeSchema in src/backend/src/schemas/EmployeeSchema.ts

## Symptoms

expected: phone number and sex fields saved correctly to database when creating new employee
actual: those fields are null in DB after saving, even though user filled them in the form
errors: no visible error, save appears to succeed
reproduction: open AddEmployee modal, fill all fields including phone and sex, submit — phone and sex are null in DB
started: unknown if ever worked

## Eliminated

## Evidence

- timestamp: 2026-04-18T00:01:00Z
  checked: src/frontend/src/services/employeeService.ts createEmployee payload (lines 25-36)
  found: payload contains employee_first_name, employee_last_name, employee_middle_name, employee_national_id, employee_social_code, employee_email, employee_position_id, employee_hire_date, employee_required_hours_biweekly, employee_status — NO employee_phone, NO employee_gender
  implication: phone and gender are dropped before the HTTP POST is made

- timestamp: 2026-04-18T00:01:00Z
  checked: src/backend/src/controller/EmployeeController.ts createEmployee (lines 17-28)
  found: employeeData mapping reads no phone or gender from rawData
  implication: even if frontend sent them, controller would not pass them to service

- timestamp: 2026-04-18T00:01:00Z
  checked: src/backend/src/service/EmployeeService.ts createEmployee createPayload (lines 32-45)
  found: createPayload has no employee_phone or employee_gender field
  implication: Prisma create call never receives these fields, so DB always gets NULL (default)

- timestamp: 2026-04-18T00:01:00Z
  checked: updateEmployee path in both controller and service
  found: update path correctly handles phone and gender at every layer
  implication: DB schema supports these fields; the omission is specific to the create path

- timestamp: 2026-04-18T00:12:00Z
  checked: src/backend/src/middleware/validateBody.ts line 20 + src/backend/src/schemas/EmployeeSchema.ts createEmployeeSchema
  found: validateBody replaces req.body with result.data (Zod-parsed output). Zod z.object() strips unknown keys by default. createEmployeeSchema had no employee_phone or employee_gender fields. updateEmployeeSchema had them (lines 42-43). This is why update works but create does not — the middleware strips both fields before the controller ever sees req.body.
  implication: The real root cause. Previous fix to controller/service was correct but irrelevant — the fields were being stripped upstream by validateBody before the controller was invoked.

- timestamp: 2026-04-18T00:14:00Z
  checked: fix applied to src/backend/src/schemas/EmployeeSchema.ts — added employee_phone and employee_gender to createEmployeeSchema
  found: npx tsc --noEmit passes with no errors in src/backend/
  implication: validateBody will now pass both fields through to the controller

## Resolution

root_cause: createEmployeeSchema in src/backend/src/schemas/EmployeeSchema.ts did not include employee_phone or employee_gender. The validateBody middleware (used on POST /employee/create) replaces req.body with the Zod-parsed output, which strips all keys not declared in the schema. Both fields were being silently dropped before the controller ran, regardless of what the frontend sent.
fix: Added employee_phone: z.string().max(20).optional().nullable() and employee_gender: z.string().max(20).optional().nullable() to createEmployeeSchema.
verification: npx tsc --noEmit passes. Awaiting user confirmation in real workflow.
files_changed:
  - src/backend/src/schemas/EmployeeSchema.ts
  - src/frontend/src/services/employeeService.ts (previous fix — kept)
  - src/backend/src/controller/EmployeeController.ts (previous fix — kept)
  - src/backend/src/service/EmployeeService.ts (previous fix — kept)
