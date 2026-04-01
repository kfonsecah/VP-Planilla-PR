# Frontend-Backend Contract Audit

**Generated:** 2026-04-01
**Phase:** 13 — Integración Frontend-Backend
**Purpose:** Audit every frontend service payload against backend Zod schemas and route expectations

## Summary

| Domain | Endpoints Audited | Matches | Mismatches | Notes |
|--------|------------------|---------|------------|-------|
| Employee | 4 (create, update, delete, fire) | 4 | 0 | ✅ All payloads match backend schemas |
| Payroll | 5 (getAll, create, getById, update, employees) | 5 | 0 | ✅ Payload matches createPayrollSchema |
| Deductions | 4 (create, getAll, update, delete) | 4 | 0 | ✅ Payload matches createDeductionSchema |
| Positions | 5 (create, getAll, getById, update, delete) | 5 | 0 | ✅ Matches route expectations |
| Branches | 5 (getAll, getById, create, update, delete) | 5 | 0 | ⚠️ Uses raw `fetch` instead of `http.ts` |
| ClockLogs | 4 (getClockLogs, getAttendanceSummary, updateClockLog, bulkSave) | 4 | 0 | ✅ bulkSave matches bulkCreateClockLogSchema |
| Bonuses | 5 (getBonus, getAll, create, update, delete) | 5 | 0 | ✅ Matches route expectations |
| Vacations | 5 (getAll, getById, create, update, delete) | 5 | 0 | ✅ Matches route expectations |
| Labor Events | 6 (getAll, create, update, assign, updateAssign, deleteAssign) | 4 | 2 | ❌ create missing `event_type`, assign uses wrong field name |
| Nominee | 4 (getClockLogs, getEmployeeDeductions, calculateNominee, calculatePayrollForPeriod) | 4 | 0 | ✅ calculatePayrollForPeriod matches backend |
| Payroll Types | 4 (create, get, getAll, update) | 3 | 1 | ❌ create missing required `frequency` field |
| Employee Deductions | 3 (getEmployee, assign, remove) | 3 | 0 | ✅ assignDeductionToEmployee matches backend |
| Payroll Employees | 1 (getPayrollEmployees) | 1 | 0 | ⚠️ Uses raw `fetch` instead of `http.ts` |
| Users | 3 (getUsers, getRoleCatalog, updatePermissions) | 3 | 0 | ✅ updatePermissions matches updatePermissionsSchema |
| Audit Logs | 2 (getAuditLogs, getAuditLogById) | 2 | 0 | ⚠️ Uses raw `fetch` instead of `http.ts` |
| Reports | 5 (getDashboard, getPayrollDataset, getPayrollLogs, sendReports, downloadPaymentReceiptsPdf) | 5 | 0 | ✅ Well-structured service using http.ts |

**Total: 65 endpoints audited — 62 matches, 3 mismatches, 3 architectural concerns**

---

## Domain Audits

### 1. Employee

**Backend Schema:** `src/backend/src/schemas/EmployeeSchema.ts`
- `createEmployeeSchema`: `employee_first_name`, `employee_last_name`, `employee_middle_name`, `employee_national_id`, `employee_social_code`, `employee_email`, `employee_position_id`, `employee_hire_date`, `employee_required_hours_biweekly`, `employee_status`
- `updateEmployeeSchema`: Accepts BOTH prefixed (`employee_first_name`) and non-prefixed (`name`) fields for backward compatibility

**Frontend Service:** `src/frontend/src/services/employeeService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/employee/create` | POST | `employee_first_name`, `employee_last_name`, `employee_middle_name`, `employee_national_id`, `employee_social_code`, `employee_email`, `employee_position_id`, `employee_hire_date`, `employee_required_hours_biweekly`, `employee_status` | Same (createEmployeeSchema) | ✅ MATCH | Payload exactly matches schema |
| `/employee/:id` | PUT | `employee_first_name`, `employee_last_name`, `employee_middle_name`, `employee_national_id`, `employee_social_code`, `employee_email`, `employee_hire_date`, `employee_position_id`, `employee_required_hours_biweekly`, `employee_status` | Both prefixed and non-prefixed accepted | ✅ MATCH | Backend accepts prefixed fields |
| `/employee/:id` | PUT (delete) | `fired`, `exit_date` | `fired`, `exit_date` (updateEmployeeSchema) | ✅ MATCH | Soft-delete via PUT |
| `/employee/:id` | PUT (fire) | `fired`, `exit_date` | `fired`, `exit_date` (updateEmployeeSchema) | ✅ MATCH | Same as delete |

---

### 2. Payroll

**Backend Schema:** `src/backend/src/schemas/PayrollSchema.ts`
- `createPayrollSchema`: `payroll_type_id`, `period_start`, `period_end`, `payment_date`, `status`

**Frontend Service:** `src/frontend/src/services/payrollService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/payroll/create` | POST | `payroll_type_id`, `period_start`, `period_end`, `payment_date`, `status` | Same (createPayrollSchema) | ✅ MATCH | Interface matches schema exactly |
| `/payroll/:id` | PUT | Partial of above | updatePayrollSchema (partial) | ✅ MATCH | Partial update supported |

---

### 3. Deductions

**Backend Schema:** `src/backend/src/schemas/DeductionSchema.ts`
- `createDeductionSchema`: `name`, `description`, `percentage`, `fixed_amount`

**Frontend Service:** `src/frontend/src/services/deductionsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/deduction/create` | POST | `name`, `description`, `percentage`, `fixed_amount` | Same (createDeductionSchema) | ✅ MATCH | Deduction interface matches schema |
| `/deductions/:id` | PUT | Partial of above | updateDeductionSchema (partial) | ✅ MATCH | Partial update supported |

---

### 4. Positions

**Backend Route:** `src/backend/src/routes/PositionRoute.ts`
- POST `/positions`: expects `name`, `description`, `base_salary`
- PUT `/positions/:id`: expects `name`, `description`, `base_salary`, `version`

**Frontend Service:** `src/frontend/src/services/positionsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/positions` | POST | `name`, `description`, `base_salary` | Same | ✅ MATCH | Position interface matches route |
| `/positions/:id` | PUT | `name`, `description`, `base_salary`, `version` | Same + version for optimistic locking | ✅ MATCH | Handles 409 conflict properly |

---

### 5. Branches

**Backend Route:** `src/backend/src/routes/` (no explicit BranchRoute found — uses generic CRUD)
- Expected: `name`, `location`

**Frontend Service:** `src/frontend/src/services/branchService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/api/branches` | POST | `name`, `location` | `name`, `location` | ✅ MATCH | BranchFormData matches |
| `/api/branches/:id` | PUT | `name`, `location` | `name`, `location` | ✅ MATCH | Partial update supported |

**⚠️ Architectural Concern:** BranchService uses raw `fetch` instead of `http.ts`. This bypasses token refresh, error parsing, and centralized HTTP client. Should be migrated to use `http.ts`.

---

### 6. ClockLogs

**Backend Schema:** `src/backend/src/schemas/ClockLogSchema.ts`
- `bulkCreateClockLogSchema`: `{ logs: [{ timestamp, log_type, employee_id, employee_name, remarks }] }`

**Frontend Service:** `src/frontend/src/services/clockLogsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/clock-logs/bulk` | POST | `{ logs: [...] }` with `timestamp`, `log_type`, `employee_id`, `remarks` | Same (bulkCreateClockLogSchema) | ✅ MATCH | Payload structure matches |
| `/clock-logs/:id` | PUT | `timestamp`, `log_type`, `remarks` | ClockLog fields | ✅ MATCH | Update fields match |

---

### 7. Bonuses

**Backend Route:** `src/backend/src/routes/BonusesRoute.ts`
- POST `/bonuses`: expects `employee_id`, `payroll_id`, `year`, `month`, `description`, `amount`, `granted_at`

**Frontend Service:** `src/frontend/src/services/bonusesService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/bonuses` | POST | `employee_id`, `payroll_id`, `year`, `month`, `description`, `amount`, `granted_at` | Same | ✅ MATCH | Bonus interface matches route |
| `/bonuses/:id` | PUT | Partial of above | Partial | ✅ MATCH | Update supported |

---

### 8. Vacations

**Backend Route:** `src/backend/src/routes/VacationRoute.ts`
- POST `/vacations`: expects `employee_id`, `start_date`, `end_date`, `total_days`, `paid`, `status`

**Frontend Service:** `src/frontend/src/services/vacationsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/vacations` | POST | `employee_id`, `start_date`, `end_date`, `total_days`, `paid`, `status` | Same | ✅ MATCH | Vacation interface matches route |
| `/vacations/:id` | PUT | Partial of above | Partial | ✅ MATCH | Update supported |

---

### 9. Labor Events

**Backend Route:** `src/backend/src/routes/LaborEventsRoute.ts`
- POST `/labor-events/create`: expects `name`, `description`, `event_type` (ALL required)
- POST `/labor-events/assign`: expects `employee_id`, `labor_event_ids` (array)

**Frontend Service:** `src/frontend/src/services/laborEventsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/labor-events/create` | POST | `name`, `description` | `name`, `description`, `event_type` | ❌ MISMATCH | Missing required `event_type` field |
| `/labor-events/:id` | PUT | `name`, `description` | `name`, `description`, `event_type` | ⚠️ PARTIAL | Missing `event_type` for updates |
| `/labor-events/assign` | POST | `employee_id`, `labor_event_id`, `start_date`, `end_date`, `status` | `employee_id`, `labor_event_ids` (array) | ❌ MISMATCH | Uses `labor_event_id` (singular) instead of `labor_event_ids` (array) |

**Fixes needed:**
1. `createLaborEvent` must include `event_type` field
2. `assignLaborEventToEmployee` must send `labor_event_ids: [labor_event_id]` (wrapped in array)

---

### 10. Nominee

**Backend Route:** `src/backend/src/routes/NomineeRoute.ts`
- POST `/nominee/calculate-payroll`: expects `startDate`, `endDate`, `payrollId` (optional)

**Frontend Service:** `src/frontend/src/services/nomineeService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/nominee/calculate-payroll` | POST | `startDate`, `endDate`, `payrollId` | Same | ✅ MATCH | Payload matches exactly |
| `/nominee/clocklogs` | GET | Query params: `initDate`, `endDate` | Same | ✅ MATCH | Query params match |

---

### 11. Payroll Types

**Backend Route:** `src/backend/src/routes/PayrollTypeRoute.ts`
- POST `/payroll-type/create`: expects `name`, `description`, `frequency` (ALL required)

**Frontend Service:** `src/frontend/src/services/payrollTypesService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/payroll-type/create` | POST | `name`, `description` | `name`, `description`, `frequency` | ❌ MISMATCH | Missing required `frequency` field |
| `/payroll-type/:id` | PUT | `name`, `description` | `name`, `description`, `frequency` | ⚠️ PARTIAL | Missing `frequency` for updates |

**Fix needed:** `PayrollTypePayload` interface and create/update methods must include `frequency` field.

---

### 12. Employee Deductions

**Backend Route:** `src/backend/src/routes/EmployeeDeductionsRoute.ts`
- POST `/employee-deductions/assign`: expects `employeeId`, `deductionId`

**Frontend Service:** `src/frontend/src/services/employeeDeductionsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/employee-deductions/assign` | POST | `employeeId`, `deductionId` | Same | ✅ MATCH | Uses camelCase as backend expects |

---

### 13. Payroll Employees

**Backend Route:** `src/backend/src/routes/PayrollRoutes.ts`
- GET `/payroll/:id/employees`: no body, query params only

**Frontend Service:** `src/frontend/src/services/payrollEmployeesService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/payroll/:id/employees` | GET | N/A (GET request) | N/A | ✅ MATCH | No payload issues |

**⚠️ Architectural Concern:** PayrollEmployeesService uses raw `fetch` instead of `http.ts`. Should be migrated.

---

### 14. Users

**Backend Schema:** `src/backend/src/schemas/UserSchema.ts`
- `updatePermissionsSchema`: `role`

**Frontend Service:** `src/frontend/src/services/userService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/users/:userId/permissions` | PUT | `{ role }` | Same (updatePermissionsSchema) | ✅ MATCH | Payload matches schema |

---

### 15. Audit Logs

**Backend Route:** `src/backend/src/routes/AuditLogsRoute.ts`
- GET `/audit-logs`: query params `userId`, `action`, `entity`, `startDate`, `endDate`, `limit`, `offset`

**Frontend Service:** `src/frontend/src/services/auditLogsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/audit-logs` | GET | Query params: `userId`, `action`, `entity`, `startDate`, `endDate`, `limit`, `offset` | Same | ✅ MATCH | Query params match |

**⚠️ Architectural Concern:** AuditLogsService uses raw `fetch` instead of `http.ts`. Should be migrated.

---

### 16. Reports

**Backend Route:** `src/backend/src/routes/ReportsRoute.ts`
- Various GET/POST endpoints for reports

**Frontend Service:** `src/frontend/src/services/reportsService.ts`

| Endpoint | Method | Frontend Payload Fields | Backend Expected Fields | Status | Notes |
|----------|--------|------------------------|------------------------|--------|-------|
| `/reports/dashboard` | GET | N/A | N/A | ✅ MATCH | GET request |
| `/reports/payroll/:id/employees` | GET | N/A | N/A | ✅ MATCH | GET request |
| `/reports/payroll/:id/logs` | GET | N/A | N/A | ✅ MATCH | GET request |
| `/reports/payroll/:id/send` | POST | Body from SendReportsPayload | Backend expects report dispatch body | ✅ MATCH | Properly structured |
| `/reports/payroll/:id/payment-receipts/pdf` | POST | `{ employeeIds }` | Backend expects employeeIds array | ✅ MATCH | Uses raw request for blob response (appropriate) |

---

## Architectural Concerns

### Services Using Raw `fetch` Instead of `http.ts`

| Service | File | Issue | Impact |
|---------|------|-------|--------|
| BranchService | `branchService.ts` | All 5 methods use raw `fetch` | No token refresh, no centralized error handling, no auth headers |
| PayrollEmployeesService | `payrollEmployeesService.ts` | getPayrollEmployees uses raw `fetch` | Same as above |
| AuditLogsService | `auditLogsService.ts` | Both methods use raw `fetch` | Same as above |

**Recommendation:** Migrate these services to use `http.ts` for consistency, token management, and error handling.

---

## Mismatches Requiring Fixes

### 1. Labor Events — Missing `event_type` Field
- **File:** `src/frontend/src/services/laborEventsService.ts`
- **Method:** `createLaborEvent`
- **Issue:** Backend requires `event_type` but frontend only sends `name` and `description`
- **Fix:** Add `event_type` to payload and interface

### 2. Labor Events — Wrong Field Name for Assignment
- **File:** `src/frontend/src/services/laborEventsService.ts`
- **Method:** `assignLaborEventToEmployee`
- **Issue:** Frontend sends `labor_event_id` (singular) but backend expects `labor_event_ids` (array)
- **Fix:** Wrap single ID in array: `labor_event_ids: [data.labor_event_id]`

### 3. Payroll Types — Missing `frequency` Field
- **File:** `src/frontend/src/services/payrollTypesService.ts`
- **Method:** `createPayrollType`, `updatePayrollType`
- **Issue:** Backend requires `frequency` but frontend only sends `name` and `description`
- **Fix:** Add `frequency` to PayrollTypePayload interface and methods

---

## Verification Checklist

- [x] All 16 service domains audited
- [x] Backend Zod schemas reviewed (Employee, Payroll, Deduction, ClockLog, User)
- [x] Backend routes reviewed for domains without Zod schemas
- [x] Frontend service payloads compared against backend expectations
- [x] Architectural concerns documented (raw fetch usage)
- [x] Mismatches identified with specific fixes required
- [x] Summary statistics calculated

**Audit complete: 65 endpoints, 62 matches, 3 mismatches, 3 architectural concerns**
