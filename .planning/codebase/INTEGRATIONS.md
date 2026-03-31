# External Integrations

**Analysis Date:** 2026-03-31

## APIs & External Services

**Email Dispatch:**
- Nodemailer - Email sending for payroll reports
  - SDK/Client: `nodemailer` package 8.0.1
  - Used in: `src/backend/src/service/ReportsService.ts`
  - Configuration: SMTP settings stored in `vpg_mail_server_settings` table in PostgreSQL
  - Fields: `mail_server_settings_host`, `mail_server_settings_port`, `mail_server_settings_username`, `mail_server_settings_password`, `mail_server_settings_use_ssl`, `mail_server_settings_use_tls`

**Report Webhooks (Future):**
- HTTP endpoints configured in `vpg_report_targets` table
  - Fields: `report_targets_institution`, `report_targets_endpoint_url`, `report_targets_auth_token`, `report_targets_contact_email`
  - Currently defined but not actively integrated; infrastructure ready for CCSS and Hacienda report dispatch

## Data Storage

**Databases:**
- PostgreSQL (primary)
  - Connection: `DATABASE_URL` environment variable (required at startup)
  - Client: Prisma 6.14.0 (`@prisma/client`)
  - Schema: `src/backend/prisma/schema.prisma`
  - Tables use `vpg_` prefix convention throughout schema

**File Storage:**
- Local filesystem only
  - PDF reports: `REPORTS_OUTPUT_DIR` environment variable (default: `storage/reports/`)
  - Payment receipts: Generated in-memory via Puppeteer, returned as Base64 or file via HTTP
  - Employee documents: File paths stored in `vpg_employee_documents.employee_documents_file_path` field; actual files stored externally or in `storage/documents/`

**Caching:**
- None currently implemented
- Note: Token blocklist stored in `vpg_token_blocklist` table for JWT revocation tracking

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no third-party OAuth)
  - Implementation: `src/backend/src/service/AuthService.ts`
  - Token type: Bearer token (JWT)
  - Token storage (frontend): `localStorage` with keys `vp_access_token` (short-lived) and `vp_refresh_token` (long-lived)
  - Token verification: `src/backend/src/middleware/AuthMiddleware.ts`

**Password Management:**
- Bcrypt hashing (version 6.0.0)
  - Used in: `AuthService.hashPassword()` and `AuthService.verifyPassword()`
  - Fallback: Supports plain-text password comparison for legacy credentials (documented tech debt)

**JWT Configuration:**
- Secret: `JWT_SECRET` environment variable (fatal startup check at `src/backend/src/index.ts` line 25)
- Fallback secret: `'your-default-secret-key'` (documented tech debt - should require explicit override)
- Expiration: Configurable in `AuthService` (needs verification in implementation)

## Monitoring & Observability

**Error Tracking:**
- None detected
- Console logging present in services (e.g., `console.log`, `console.error`)

**Logs:**
- Application logs: Console output from Express server
- Audit logs: `vpg_audit_logs` table tracks user actions with fields `audit_logs_action`, `audit_logs_entity`, `audit_logs_timestamp`
- Report logs: `vpg_report_logs` table tracks generated reports with `report_logs_status` and version history via `vpg_report_versions`

**Database Versioning:**
- Optimistic locking via `_version` suffix on all tables (e.g., `audit_logs_version`, `employees_version`)

## CI/CD & Deployment

**Hosting:**
- Likely Vercel for frontend (hardcoded allowlist in CORS: `origin.endsWith('.vercel.app') || origin === 'https://vp-planilla.vercel.app'`)
- Backend hosting: Not explicitly configured; could be any Node-compatible platform

**CI Pipeline:**
- None detected
- No GitHub Actions, GitLab CI, or similar in codebase

**Deployment Artifacts:**
- Frontend: Next.js build output from `npm run build`
- Backend: TypeScript compiled to JavaScript via `tsc` to `dist/` directory
- Prisma: Client auto-generated on `npm install` or `npx prisma generate`

## Environment Configuration

**Required Backend env vars:**
- `DATABASE_URL` - PostgreSQL connection string (fatal if missing)
- `JWT_SECRET` - JWT signing secret (fatal if missing)
- `PORT` - Server port (default: 3001)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (parsed in `src/backend/src/index.ts`)
- `REPORTS_OUTPUT_DIR` - Directory for PDF report storage (default: `storage/reports/`)

**Required Frontend env vars:**
- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:3001`)

**Optional Backend env vars:**
- Mail server configuration (can be read from `vpg_mail_server_settings` table instead of env)
- Any custom report output paths or caching strategies

**Optional Frontend env vars:**
- None currently used beyond `NEXT_PUBLIC_API_URL`

**Secrets location:**
- Backend: `.env` file (plaintext, source control ignored via `.gitignore`)
- Frontend: `.env` file (plaintext; only `NEXT_PUBLIC_*` variables are safe)
- Production: Environment variables injected by deployment platform (Vercel, etc.)

## Webhooks & Callbacks

**Incoming:**
- Payment receipt generation endpoint: `POST /api/payment-receipts` (route in `src/backend/src/routes/PaymentReceiptRoute.ts`)
- Report dispatch webhook targets: Infrastructure in `vpg_report_targets` but no active webhook receiver (one-way HTTP POST to external endpoints)

**Outgoing:**
- Email notifications via Nodemailer (SMTP)
- Report webhook dispatch: `ReportsService` sends HTTP POST to endpoints configured in `vpg_report_targets` table (not yet implemented in service)

---

*Integration audit: 2026-03-31*
