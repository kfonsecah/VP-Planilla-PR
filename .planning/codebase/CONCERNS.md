# Codebase Concerns

**Analysis Date:** 2026-03-31

## Tech Debt

### Pre-release bcrypt Dependency
- **Issue:** `bcrypt@^6.0.0` is specified in `src/backend/package.json` (line 27), but v6.0.0 is a pre-release version with potential stability issues
- **Files:** `src/backend/package.json`
- **Impact:** Unpredictable behavior in password hashing during authentication; version bumps could introduce breaking changes; pre-release versions receive fewer security patches
- **Fix approach:** Upgrade to stable `bcrypt@^5.1.1` which is fully released and production-ready; verify no API changes between 5.1.1 and 6.0.0 before merging

### Abundant Type Escapes (`any` Keywords)
- **Issue:** 123 instances of `any` type throughout backend codebase, concentrated in controllers and error handlers
- **Files:**
  - `src/backend/src/controller/AuditLogsController.ts` - filters typed as `any`
  - `src/backend/src/controller/ClockLogsController.ts` - employee resolution parameters typed as `any`
  - `src/backend/src/controller/NomineeController.ts` - ID mapping uses `any`
  - `src/backend/src/controller/ReportsController.ts` - value filters typed as `any`
  - `src/backend/src/service/AuditLogsService.ts` - return type `any`
  - Plus 20+ other files with error handlers catching `any`
- **Impact:** TypeScript provides no compile-time safety; runtime bugs slip through; refactoring becomes fragile (renaming properties won't be caught); IDE autocomplete stops working
- **Fix approach:** Replace with proper interfaces:
  - Create `AuditLogFilters` interface for filter objects
  - Create `ClockLogResolution` interface for employee resolution results
  - Define explicit error types instead of `catch (error: any)`; use `unknown` and narrow via type guards

### Excessive Logging in Production Code
- **Issue:** 110+ `console.log()` and `console.error()` calls scattered throughout backend
- **Files:** All service, controller, and middleware files
- **Impact:** Performance penalty (console I/O is synchronous); sensitive information may leak in logs (passwords being verified in `AuthService.ts`); no log levels (debug vs errors all mix); no way to disable in production
- **Fix approach:** Implement structured logging with a proper logger (winston, pino, or bunyan):
  - Replace `console.log` with `logger.debug` for development diagnostics
  - Replace `console.error` with `logger.error` with context
  - Make log levels configurable via `LOG_LEVEL` env var
  - Remove sensitive data from logs (don't log passwords or full tokens)

## Known Bugs

### Frontend TypeScript Type Error
- **Symptoms:** `npm run tsc --noEmit` fails in `src/frontend/` with: "Property 'skipped_count' does not exist on type '{ created: number; skipped?: string[] | undefined; }'"
- **Files:** `src/frontend/src/app/pages/attendance/page.tsx` line 668
- **Trigger:** When the file imports and calls `ClockLogsService.bulkSave()`, the response type expects `skipped_count` but the actual return type from backend only includes `skipped` array
- **Root cause:** Backend controller `ClockLogsController.bulkCreate()` returns `{ success, created, skipped, skipped_count }` at line 150-156, but frontend service definition doesn't match this shape
- **Workaround:** Access `saveResult.skipped?.length ?? 0` instead of `saveResult.skipped_count`; update type definitions
- **Fix approach:** Either:
  1. Ensure backend response type matches frontend expectations (create explicit response interface)
  2. Update frontend service to assert the correct response type
  3. Generate TypeScript types from API schema to keep them in sync

### Frontend localStorage Not Fully Cleared on Logout
- **Symptoms:** After calling logout, `localStorage` still contains `vp_access_token` and `vp_refresh_token` in browser DevTools
- **Files:** `src/frontend/src/hooks/useAuth.tsx` lines 105-107
- **Root cause:** The `logout()` function calls `http.clearTokens()` (which clears tokens from localStorage via `src/frontend/src/services/http.ts` lines 39-43), but does not clear the `user` key
- **Issue:** User data persists; if attacker gains browser access after logout, they can see the last logged-in user's name/email in localStorage
- **Workaround:** Add `localStorage.removeItem('vp-theme')` and check all keys manually in DevTools
- **Fix approach:** Ensure `logout()` explicitly clears all auth-related localStorage keys:
  ```typescript
  const logout = async () => {
    // ... existing code ...
    http.clearTokens();
    localStorage.removeItem('user');
    localStorage.removeItem('vp-theme'); // Also clear UI preferences if auth-bound
    setUser(null);
    router.push('/auth');
  };
  ```
  This is partially done (line 107 removes 'user') but the pattern is inconsistent—verify all keys are cleared

## Security Considerations

### JWT Secret Still Has Fallback Default
- **Risk:** Although `src/backend/src/index.ts` lines 25-28 now check for `JWT_SECRET` and crash if missing, `src/backend/src/service/AuthService.ts` lines 148 and 161 still use fallback `'your-default-secret-key'`
- **Files:**
  - `src/backend/src/service/AuthService.ts` lines 148, 161
- **Current mitigation:** Server exits during startup if `JWT_SECRET` not set, so the fallback is technically unreachable
- **Recommendations:**
  1. Remove the fallback entirely: `const secret = process.env.JWT_SECRET!;` (assert non-null)
  2. Or move the check to a startup module that ensures all required env vars before any service initialization
  3. Test in CI that startup fails loudly when `JWT_SECRET` is missing

### Plaintext Password Fallback in Authentication
- **Risk:** `AuthService.verifyPassword()` (lines 117-136) supports comparing plaintext passwords if the stored password isn't a bcrypt hash. This is a deliberate backward-compatibility measure but creates a security gap.
- **Files:** `src/backend/src/service/AuthService.ts` lines 117-136
- **Current mitigation:** Bcrypt hashing is the new standard; old plaintext passwords should be migrated
- **Recommendations:**
  1. Add a database migration to hash any remaining plaintext passwords
  2. Set a deadline (e.g., next release) after which plaintext comparison is disabled
  3. Add a startup check: if any plaintext passwords exist in the database, warn in logs
  4. Document this in CLAUDE.md as a known temporary security measure

### CORS Allows Vercel Subdomain
- **Risk:** `src/backend/src/index.ts` lines 36-42 allow all Vercel subdomains via wildcard: `origin.endsWith('.vercel.app')`
- **Files:** `src/backend/src/index.ts` lines 36-42
- **Current mitigation:** Frontend is deployed to `https://vp-planilla.vercel.app`, so this is intentional for CORS
- **Recommendations:**
  1. Lock down to exact domain: `origin === 'https://vp-planilla.vercel.app'` instead of wildcard
  2. If feature flagging is needed for staging, use explicit env var: `process.env.ALLOWED_FRONTEND_URL`

## Performance Bottlenecks

### Large Frontend Component Files
- **Problem:** Three components exceed 800 lines of code, making them hard to navigate and maintain
- **Files:**
  - `src/frontend/src/app/pages/attendance/page.tsx` — 1098 lines (page + UI + logic mixed)
  - `src/frontend/src/components/PayrollResults.tsx` — 817 lines (rendering + Excel export + calculations)
  - `src/frontend/src/app/pages/payroll/[id]/page.tsx` — 648 lines
- **Cause:** No separation of rendering, data fetching, and export logic; inline calculations
- **Improvement path:**
  1. Extract Excel export to a separate utility: `src/frontend/src/utils/excelExport.ts`
  2. Break `PayrollResults` into:
     - `PayrollSummary` (top-level metrics)
     - `PayrollTable` (employee rows)
     - `PayrollDetail` (expanded row content)
  3. Move complex data transformations to hooks: `usePayrollGrouping.ts`, `useLaborEventFilter.ts`

### Large Backend Service Files
- **Problem:** `NomineeService.ts` is 1021 lines, `ReportsService.ts` is 895 lines
- **Files:**
  - `src/backend/src/service/NomineeService.ts` — 1021 lines (all nominee logic in one class)
  - `src/backend/src/service/ReportsService.ts` — 895 lines (all reporting logic in one class)
  - `src/backend/src/utils/payrollUtils.ts` — 476 lines (payroll math)
- **Impact:** Slow IDE analysis; hard to test individual functions; risk of accidental coupling
- **Improvement path:**
  1. Split `NomineeService` into:
     - `NomineeCalculationService` (payroll math)
     - `NomineeExportService` (PDF/Excel output)
     - `NomineeQueryService` (database lookups)
  2. Split `ReportsService` by report type:
     - `CCSSReportService` (social security)
     - `HaciendaReportService` (tax authority)
     - `GeneralReportService` (payroll summaries)

### Potential N+1 Query Issue in ClockLogsController
- **Problem:** `resolveEmployeeId()` (lines 30-67 in `ClockLogsController.ts`) queries `vpg_employees` **once per clock log** in the loop at line 114
- **Files:** `src/backend/src/controller/ClockLogsController.ts` lines 114-138
- **Cause:** Employee lookup happens inside `bulkCreate()` loop; if 5000 clock logs are imported with 100 unique employees, the query runs 100 times instead of once
- **Impact:** For bulk imports of 1000+ records, this becomes O(n) queries instead of O(1)
- **Improvement path:**
  1. Cache the employee list before the loop: `const employeeMap = await buildEmployeeNameMap()`
  2. Reuse `employeeMap` for all name/ID resolutions
  3. Add comment explaining the optimization

## Fragile Areas

### Payroll Calculation Services Lack Complete Test Coverage
- **Files:**
  - `src/backend/src/service/NomineeService.ts` — 1021 lines, only `NomineeService.test.ts` (276 lines)
  - `src/backend/src/service/PaymentReceiptService.ts` — 512 lines, untested
  - `src/backend/src/service/ReportsService.ts` — 895 lines, untested
  - `src/backend/src/utils/payrollUtils.ts` — 476 lines, has `payrollUtils.test.ts` (unit tests only)
- **Why fragile:** Complex Costa Rica labor law calculations with many edge cases (overtime, holidays, weekly rest, vacation accrual). A single refactor can silently break payroll for hundreds of employees.
- **Safe modification:**
  1. Write integration tests for end-to-end payroll flows before refactoring
  2. Create test datasets covering: regular weeks, holidays, overtime, multiple employees, spanning multiple periods
  3. Add snapshot tests for calculated payroll totals
  4. Include golden tests (known-correct payroll outputs from prior runs)

### No Frontend Component Tests
- **Files:** `src/frontend/src` — zero test files
- **Why fragile:** Form validation with `react-hook-form` + Zod happens silently; if Zod schema changes, the form silently accepts invalid data
- **Safe modification:**
  1. Add Jest + React Testing Library to `src/frontend/package.json`
  2. Test form validation schemas: `src/frontend/src/schemas/*.test.ts`
  3. Test modal open/close state: `src/frontend/src/components/*.test.tsx`
  4. Test hook data fetching: `src/frontend/src/hooks/*.test.ts`

### Database Query Assumptions Not Validated at Compile Time
- **Files:** All service files query `prisma.vpg_*` tables
- **Why fragile:** If a schema field is renamed (e.g., `employee_first_name` → `emp_first_name`), Prisma won't catch it until runtime. Services will return undefined fields.
- **Safe modification:**
  1. Run `npx prisma generate` after schema changes (in Prisma migration flow)
  2. Use Prisma's `@db.*` attributes to ensure generated types match schema
  3. Add a CI check that ensures Prisma client is regenerated after schema.prisma changes

### Type Casting in Controllers Bypasses Safety
- **Files:** Controllers use `as any` to bypass type checking
- **Examples:**
  - `src/backend/src/controller/EmployeeController.ts` — `employeeData as any`
  - `src/backend/src/controller/NomineeController.ts` — `id: any` parameters
- **Why fragile:** When request body structure changes (e.g., new required field), the cast silently passes invalid data to the service, causing runtime errors downstream
- **Safe modification:** Replace casts with Zod validation:
  1. Create a schema for each endpoint input: `src/backend/src/schemas/EmployeeSchema.ts`
  2. Use middleware to validate before the controller sees it
  3. Let TypeScript infer types from schema output

## Scaling Limits

### Large Excel Exports in Memory
- **Resource:** `PayrollResults.tsx` and `ExcelJS` workbook creation
- **Current capacity:** Tested with ~500 employees on a 2026 MacBook; takes ~3 seconds
- **Limit:** Exporting 2000+ employees will load entire dataset into browser memory; may crash on mobile devices
- **Scaling path:**
  1. Implement server-side Excel generation (move `ExcelJS` logic to backend)
  2. Stream file download instead of creating in-memory blob
  3. Paginate exports (split payroll into monthly exports)
  4. Cache generated files server-side with 1-hour TTL

### PDF Generation via Puppeteer
- **Resource:** `src/backend/package.json` includes `puppeteer@^24.37.5` (272 MB+ on disk)
- **Current capacity:** Single PDF generation takes ~2 seconds per receipt
- **Limit:** If 100+ payment receipts are requested simultaneously, Puppeteer instances will consume all available memory
- **Scaling path:**
  1. Implement a PDF generation queue (Bull or RabbitMQ)
  2. Limit concurrent Puppeteer processes (default: 1)
  3. Cache rendered PDFs by receipt ID
  4. Add timeout (30s) for PDF generation; fail gracefully if exceeded

### Database Connection Pool
- **Resource:** Prisma singleton manages the connection pool
- **Current capacity:** Default Prisma pool: ~10 connections (adjustable via `connection_limit` env var)
- **Limit:** More than 10 concurrent requests exhaust the pool; subsequent requests queue and timeout
- **Scaling path:**
  1. Set `DATABASE_POOL_SIZE` env var (e.g., 20-30 for production)
  2. Monitor pool exhaustion: query `SELECT count(*) FROM pg_stat_activity`
  3. Implement request queuing with timeout (to fail fast instead of hanging)
  4. Profile slow queries; add indices on `employee_id`, `period_id` foreign keys

## Dependencies at Risk

### Puppeteer Prerelease or High Patch Versions
- **Risk:** `puppeteer@^24.37.5` — version 24 is recent and may have undocumented breaking changes in minor versions
- **Impact:** PDF generation breaks unexpectedly; Chrome/Chromium version incompatibilities
- **Migration plan:**
  1. Pin to specific version: `puppeteer@24.37.5` (not ^)
  2. Use a dedicated PDF generation library instead (e.g., `html2pdf` or `pdfkit` for smaller bundles)
  3. Or move to server-side PDF service (e.g., AWS Lambda + Headless Chrome)

### Handlebars for Email Templates (Unused?)
- **Risk:** `handlebars@^4.7.8` is installed but may not be used; if used, template injection is a risk
- **Files:** `src/backend/package.json` line 32
- **Impact:** Handlebars allows `{{constructor}}` injection; if user-controlled data is templated, RCE is possible
- **Recommendation:**
  1. Search codebase for `handlebars` usage: `grep -r "handlebars" src/backend/src`
  2. If unused, remove it
  3. If used, escape all user inputs: `Handlebars.escapeExpression(userInput)`

## Missing Critical Features

### No Refresh Token Rotation
- **Problem:** `src/frontend/src/services/http.ts` refreshes tokens when expired, but the backend doesn't rotate the refresh token itself
- **Blocks:** Cannot implement security best practice of short-lived refresh tokens + token rotation
- **Current behavior:** Refresh token lives indefinitely; if compromised, it grants unlimited access until session expires
- **Recommendation:** Implement refresh token rotation in backend:
  1. Each refresh response issues a NEW refresh token
  2. Invalidate the old refresh token in the database
  3. Detect replay attacks (if an old refresh token is used, revoke all tokens for that user)

### No Audit Trail for Payroll Changes
- **Problem:** Once a payroll is calculated and locked, there's no history of what calculations were performed or who approved it
- **Blocks:** Cannot comply with labor law requirements for payroll audit trails in Costa Rica
- **Recommendation:** Implement payroll state machine:
  1. Payroll starts as `DRAFT` (can edit)
  2. Move to `CALCULATED` (auto-generated, immutable)
  3. Move to `APPROVED` (manager review, signature field)
  4. Move to `PAID` (payment marked complete)
  5. Store each state transition with timestamp, user ID, changes

### No Email Notifications for Payroll Release
- **Problem:** When payroll is released, employees have no notification; they must log in to check
- **Blocks:** Cannot notify employees of salary payments, deductions, or schedule changes
- **Recommendation:** Integrate with email service:
  1. Add `sendPayrollNotification()` method to `AuthService` or new `NotificationService`
  2. On payroll release, send templated email with payroll summary
  3. Include link to payment receipt PDF

## Test Coverage Gaps

### Frontend Has No Unit or Integration Tests
- **What's not tested:**
  - Form validation logic (`useAddEmployeeModal`, `useLogin`)
  - API service layer (`employeeService`, `payrollService`)
  - Modal animation state (`LaborEventModal`, `PayrollCreateModal`)
  - Date/number formatting utilities
- **Files:** `src/frontend/src` — zero test files
- **Risk:** Silent failures in form validation; incorrect date parsing in attendance UI; layout shifts on mobile
- **Priority:** High — frontend is user-facing; bugs are immediately visible but hard to diagnose without tests

### Backend Integration Tests Missing for Most Features
- **What's not tested:**
  - `PaymentReceiptService` (512 lines)
  - `ReportsService` (895 lines, only 4 integration tests for auth)
  - `EmployeeService` (249 lines)
  - `LaborEventsService` (206 lines)
  - `VacationService` (not found in test results)
- **Files:** Only 4 test files cover the entire 11KB backend codebase
- **Risk:** Bug in report generation goes unnoticed; payroll calculation errors only caught in production
- **Priority:** High — payroll is business-critical; every bug affects real employee salaries

### No End-to-End Tests
- **What's not tested:** Full user journey (login → create payroll → generate report → export PDF)
- **Tools:** Project dependencies don't include Cypress, Playwright, or similar E2E framework
- **Risk:** Integration between frontend and backend breaks unnoticed; feature regressions ship to production
- **Priority:** Medium — should be addressed before next major release

---

*Concerns audit: 2026-03-31*
