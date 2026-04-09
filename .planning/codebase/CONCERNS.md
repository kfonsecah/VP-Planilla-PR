# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

**Auth token lifecycle is partially implemented across backend and frontend:**
- Issue: Token refresh and password change flows are exposed in routes but return placeholder responses, while frontend client code assumes a real token refresh contract.
- Files: `src/backend/src/controller/AuthController.ts`, `src/backend/src/routes/AuthRoute.ts`, `src/frontend/src/services/http.ts`, `src/frontend/src/services/authService.ts`
- Impact: Expired sessions fail hard instead of refreshing (`http.ts` expects `token` from refresh response), causing forced logout loops and brittle auth UX.
- Fix approach: Implement real refresh token issuance/rotation in `AuthController.refreshToken`, align response shape with `AuthService.refreshToken`, and add integration tests for access-token expiry + refresh path.

**HTTP client layer is bypassed in multiple frontend services:**
- Issue: Several services call `fetch` directly instead of centralizing calls through `http.ts`.
- Files: `src/frontend/src/services/branchService.ts`, `src/frontend/src/services/payrollEmployeesService.ts`, `src/frontend/src/services/auditLogsService.ts`, `src/frontend/src/services/authService.ts`
- Impact: Inconsistent error parsing, inconsistent retry/auth refresh behavior, and duplicated request logic.
- Fix approach: Route non-auth API calls through `src/frontend/src/services/http.ts`; keep `authService.ts` as the only special-case client.

**Generated build artifacts are present in source tree:**
- Issue: Built JS artifacts are committed under backend source tree.
- Files: `src/backend/dist/**`
- Impact: Drift risk between TS source and committed JS, noisy diffs, and accidental runtime confusion.
- Fix approach: Treat `src/backend/dist/` as build output only; ignore it in VCS and regenerate in CI/CD.

**Monolithic files concentrate business and UI complexity:**
- Issue: Critical logic is concentrated in very large files.
- Files: `src/backend/src/service/NomineeService.ts` (~1021 lines), `src/backend/src/service/ReportsService.ts` (~895), `src/backend/src/controller/ClockLogsController.ts` (~690), `src/frontend/src/app/pages/attendance/page.tsx` (~1178), `src/frontend/src/components/PayrollResults.tsx` (~817)
- Impact: Higher regression risk, slower onboarding, and difficult unit isolation.
- Fix approach: Split by sub-domain (parsing, calculations, persistence, presentation) into smaller modules with explicit interfaces and focused tests.

## Known Bugs

**Refresh endpoint contract mismatch breaks automatic re-authentication:**
- Symptoms: Frontend refresh flow throws `Refresh failed` and users are logged out when access token expires.
- Files: `src/backend/src/controller/AuthController.ts`, `src/frontend/src/services/http.ts`, `src/frontend/src/services/authService.ts`
- Trigger: Any API request returning `401` with refresh token present.
- Workaround: User re-login.

**Employee profile modal uses placeholder attendance and contact data:**
- Symptoms: UI shows hardcoded phone and sample attendance records unrelated to selected employee.
- Files: `src/frontend/src/hooks/useEmployeeTable.ts`
- Trigger: Opening employee profile from employee table.
- Workaround: None in current UI; data is static placeholder.

**Unimplemented hook shipped as empty module:**
- Symptoms: `useDashboard` has no implementation.
- Files: `src/frontend/src/hooks/useDashboard.ts`
- Trigger: Any future import/use of dashboard hook.
- Workaround: Use alternate hooks/pages that do not import this module.

## Security Considerations

**Plaintext password fallback still accepted during authentication:**
- Risk: Stored non-hashed passwords remain valid because auth path explicitly compares raw text when hash format is absent.
- Files: `src/backend/src/service/AuthService.ts`
- Current mitigation: bcrypt is used when stored hash matches bcrypt format.
- Recommendations: Enforce hashed-only credentials, migrate legacy rows to bcrypt hashes, and remove plaintext comparison branch.

**Sensitive operational data appears in logs:**
- Risk: Query text and auth flow details are logged broadly, increasing exposure of internal data and operational metadata.
- Files: `src/backend/src/lib/prisma.ts`, `src/backend/src/service/AuthService.ts`, `src/backend/src/controller/AuthController.ts`, `src/frontend/src/app/pages/attendance/page.tsx`, `src/frontend/src/components/PayrollResults.tsx`
- Current mitigation: Not detected beyond default console output.
- Recommendations: Replace ad-hoc `console.log` with structured logger + environment-based log levels; redact auth/user/query-sensitive fields.

**Secrets are modeled as plaintext fields in DB schema:**
- Risk: Mail and report target credentials/tokens are persisted as plain strings.
- Files: `src/backend/prisma/schema.prisma` (`vpg_mail_server_settings.mail_server_settings_password`, `vpg_report_targets.report_targets_auth_token`)
- Current mitigation: Not detected at schema/service layer.
- Recommendations: Encrypt at rest (application-level or database), restrict read paths, and rotate secrets periodically.

## Performance Bottlenecks

**Import employee resolution scales poorly with log volume:**
- Problem: Employee resolution can fetch and scan active employees repeatedly per imported log.
- Files: `src/backend/src/controller/ClockLogsController.ts`
- Cause: `resolveEmployeeId()` does DB queries and full-employee scan inside per-log loop.
- Improvement path: Preload employee lookup maps once per import session (by ID and normalized name) and resolve in-memory.

**Payroll save path performs per-employee/per-deduction DB writes:**
- Problem: Large payroll runs incur many serial queries.
- Files: `src/backend/src/service/NomineeService.ts`
- Cause: Sequential `findFirst`/`update|create` and nested deduction `upsert` per employee.
- Improvement path: Batch operations in transactions, pre-diff records, and reduce round trips with grouped writes.

**Receipt batch generation is sequential and browser-heavy:**
- Problem: Consolidated receipts generation is slow for many employees.
- Files: `src/backend/src/service/PaymentReceiptService.ts`
- Cause: Per-employee PDF generation loops sequentially and launches Puppeteer path repeatedly via `generateReceiptPDF()`.
- Improvement path: Reuse one browser/page context per batch or render multi-receipt HTML once when possible.

**Report dashboard and dispatch paths include repeated DB operations:**
- Problem: Throughput drops as payroll/employee count grows.
- Files: `src/backend/src/service/ReportsService.ts`
- Cause: `getDashboard()` executes per-payroll `findFirst`; `sendReports()` performs serial file generation + email sends + per-attachment status updates.
- Improvement path: Pre-aggregate logs in one query, parallelize safe sections, and queue email dispatch asynchronously.

## Fragile Areas

**Attendance page parsing and transformation pipeline is highly coupled:**
- Files: `src/frontend/src/app/pages/attendance/page.tsx`
- Why fragile: Parsing, normalization, import, persistence calls, and rendering logic are all in one client page with many date/time edge branches.
- Safe modification: Extract parsing utilities and import orchestration into dedicated modules with unit tests before behavior changes.
- Test coverage: Frontend tests target clock-logs page/hook area, but no dedicated tests cover this attendance parser workflow.

**Payroll core computation and persistence are tightly intertwined:**
- Files: `src/backend/src/service/NomineeService.ts`, `src/backend/src/utils/payrollUtils.ts`
- Why fragile: Domain math, fallback behavior, DB preloads, and persistence side effects are combined; minor edits can alter legal payroll outputs.
- Safe modification: Isolate pure calculation stages from data access; protect each rule with deterministic unit tests.
- Test coverage: `payrollUtils` and `NomineeService` tests exist, but end-to-end coverage of all real-world combinations remains limited.

**Clock log correction/import controller is overloaded:**
- Files: `src/backend/src/controller/ClockLogsController.ts`, `src/backend/src/service/ClockLogsService.ts`
- Why fragile: Multiple workflows (import, pagination, orphan/anomaly resolution, status transitions) share one controller and mixed typing (`any` usage).
- Safe modification: Split controller by concern (query, import, correction) and introduce strict request DTO types.
- Test coverage: Unit tests exist for controller/service, but complexity and branching depth remain high.

## Scaling Limits

**Synchronous report dispatch pipeline:**
- Current capacity: Operates per employee in-process (`for ... of`) with XML generation, filesystem write, SMTP send, and status update.
- Limit: Large payrolls can cause long request times and partial completion risk on transient SMTP/file errors.
- Scaling path: Move dispatch to background jobs (queue + worker), persist job status, and expose async progress endpoints.

**In-process heavy document generation:**
- Current capacity: PDF generation uses Puppeteer in API process.
- Limit: CPU/memory pressure increases with concurrent/batch receipt generation.
- Scaling path: Offload PDF generation to worker pool/service and cache static assets/templates.

## Dependencies at Risk

**bcrypt pre-release major (`^6.0.0`):**
- Risk: Pre-release/less-proven compatibility for production auth-critical path.
- Impact: Authentication regressions or platform-specific issues can block all login flows.
- Migration plan: Pin to stable `bcrypt@^5.1.1` and run auth regression suite after downgrade.

## Missing Critical Features

**Production-grade refresh token and password-change implementation:**
- Problem: Endpoints are present but return placeholder success messages.
- Blocks: Reliable session continuity, token rotation, and secure user credential lifecycle.

## Test Coverage Gaps

**Backend reporting and receipt generation flows:**
- What's not tested: `ReportsService` dispatch/storage flows and `PaymentReceiptService` PDF/data assembly edge cases.
- Files: `src/backend/src/service/ReportsService.ts`, `src/backend/src/service/PaymentReceiptService.ts`
- Risk: Regressions in legally relevant outputs (official reports and payment receipts) can ship undetected.
- Priority: High

**Frontend service consistency outside clock-logs domain:**
- What's not tested: Most non-clock-logs services using direct `fetch` and mixed response parsing.
- Files: `src/frontend/src/services/branchService.ts`, `src/frontend/src/services/payrollEmployeesService.ts`, `src/frontend/src/services/auditLogsService.ts`
- Risk: Runtime failures and inconsistent UX on auth/network errors.
- Priority: Medium

**Attendance import/parser edge cases:**
- What's not tested: Excel date/time parsing branches and employee name resolution behavior in attendance flow.
- Files: `src/frontend/src/app/pages/attendance/page.tsx`
- Risk: Silent misclassification of timestamps or employees during import.
- Priority: High

---

*Concerns audit: 2026-04-09*
