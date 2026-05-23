---
status: VERIFIED FIX/ FIXED
trigger: "updateEmployee falla con PrismaClientValidationError Unknown argument employee_required_hours_biweekly"
created: 2026-03-25T00:00:00Z
updated: 2026-03-25T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED — `npx prisma generate` succeeded. The regenerated client now contains `employee_required_hours_biweekly` in 10+ type definitions.
test: grep on regenerated index.d.ts returns 10 matches. `npx tsc --noEmit` shows zero new errors related to this field or EmployeeService (only pre-existing unrelated errors remain).
expecting: Restarting the backend and editing an employee from the frontend should now save without PrismaClientValidationError.
next_action: Await human verification — restart backend with `npm run dev` from src/backend/ and test employee update

## Symptoms

expected: updateEmployee saves employee changes and returns the updated object
actual: Prisma throws PrismaClientValidationError — "Unknown argument `employee_required_hours_biweekly`"
errors: |
  Invalid `prisma.vpg_employees.update()` invocation
  Unknown argument `employee_required_hours_biweekly`. Available options are marked with ?
  El campo se está enviando como: employee_required_hours_biweekly: null
  Stack: updateEmployee → handleUpdateEmployee → onFormSubmit (react-hook-form)
reproduction: Editar cualquier empleado desde el frontend y guardar
started: Después de Phase 1 — migración de new PrismaClient() al singleton en EmployeeService.ts

## Eliminated

- hypothesis: Field is missing from schema.prisma
  evidence: schema.prisma line 133 shows `employee_required_hours_biweekly Decimal? @db.Decimal(5, 2)` — field IS present in schema
  timestamp: 2026-03-25T00:01:00Z

- hypothesis: Field is missing from the Employee TypeScript interface
  evidence: src/backend/src/model/Employee.ts line 14 shows `required_hours_biweekly?: number` — field IS present in interface
  timestamp: 2026-03-25T00:01:00Z

- hypothesis: EmployeeService.updateEmployee doesn't pass the field to Prisma
  evidence: EmployeeService.ts line 132 shows `employee_required_hours_biweekly: data.required_hours_biweekly || null` — field IS passed correctly
  timestamp: 2026-03-25T00:01:00Z

## Evidence

- timestamp: 2026-03-25T00:01:00Z
  checked: src/backend/prisma/schema.prisma vpg_employees model
  found: Line 133 — `employee_required_hours_biweekly Decimal? @db.Decimal(5, 2)` is present
  implication: Schema is correct; field was added at some point

- timestamp: 2026-03-25T00:01:00Z
  checked: node_modules/.prisma/client/index.d.ts
  found: Zero occurrences of "employee_required_hours_biweekly" in the entire generated client file. Vpg_employeesGroupByOutputType shows fields in order: employee_status → employee_version, with no biweekly hours field between them.
  implication: The Prisma client was generated BEFORE the field was added to schema.prisma. `prisma generate` was never re-run after the schema change. This is the root cause.

- timestamp: 2026-03-25T00:01:00Z
  checked: EmployeeService.ts updateEmployee method (line 118-161)
  found: Line 132 passes `employee_required_hours_biweekly: data.required_hours_biweekly || null` into the Prisma update data object
  implication: Service code is correct and intentionally sends the field — the stale client is what rejects it

## Resolution

root_cause: The generated Prisma client (node_modules/.prisma/client/) was stale — it was generated before `employee_required_hours_biweekly Decimal? @db.Decimal(5,2)` was added to the vpg_employees model in schema.prisma. The old client had no knowledge of the field and threw PrismaClientValidationError whenever it appeared in an update data object. This was unrelated to the Phase 1 singleton migration; it was a missing `prisma generate` step after a schema change.
fix: Ran `npx prisma generate` in src/backend/. The Prisma client was regenerated (v6.19.2). The field now appears in all relevant generated types.
verification: grep confirms 10 occurrences of `employee_required_hours_biweekly` in the regenerated index.d.ts. `npx tsc --noEmit` introduces no new errors.
files_changed: [src/backend/node_modules/.prisma/client/ (generated — not tracked in git)]
