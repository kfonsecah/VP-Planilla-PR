# Deferred Items — Phase 02

## Pre-existing Out-of-Scope Issues

### 1. TypeScript errors in unmodified controllers (pre-existing)

Files: AuditLogsController.ts, BonusesController.ts, DeductionsController.ts, EmployeeController.ts, LaborEventsController.ts, PaymentReceiptController.ts, PayrollTypesController.ts, PositionController.ts, VacationController.ts

Issue: `string | string[]` not assignable to `string` for `req.query.*` parameters; EmployeeController missing required fields in object literal.

Root cause: Pre-existing type mismatches — not introduced by Phase 02-02 changes.

### 2. Missing @types/nodemailer (pre-existing)

File: src/service/ReportsService.ts

Issue: `Could not find a declaration file for module 'nodemailer'`

Fix: `npm i --save-dev @types/nodemailer` in src/backend/

### 3. PayrollService test failures for getAllPayrolls (pre-existing)

Tests: `should retrieve all payrolls ordered by ID descending`, `should correctly map database fields to model fields`

Issue: Tests were written against an older version of `getAllPayrolls` that did not include employee aggregations. The current implementation adds `include: { vpg_payroll_employee: true }` and 10 aggregated fields — tests need to be updated to match.

Root cause: Pre-existing mismatch between test expectations and current service implementation. Not introduced by Phase 02-02.
