# External Integrations

**Analysis Date:** 2025-05-09

## APIs & External Services

**Email Delivery:**
- Resend - Primary service for system notifications and password recovery.
  - SDK/Client: `resend` npm package.
  - Auth: `RESEND_API_KEY` env var.
  - Usage: `src/backend/src/service/EmailService.ts`.

**Reports Generation:**
- Headless Chrome - Used for rendering complex reports.
  - SDK/Client: `puppeteer`.
  - Implementation: Backend-side report generation.

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` and `DIRECT_URL` (for Prisma Accelerate/Direct access).
  - Client: Prisma ORM (`@prisma/client`).
  - Schema: `src/backend/prisma/schema.prisma`.

**File Storage:**
- Local filesystem only
  - Reports generated and stored temporarily in `storage/reports/` (configured via `REPORTS_OUTPUT_DIR`).

**Caching:**
- None - No external caching service detected (e.g., Redis).

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based Authentication
  - Implementation: `src/backend/src/service/AuthService.ts` and `src/backend/src/middleware/AuthMiddleware.ts`.
  - Tokens: JSON Web Tokens (JWT) using `jsonwebtoken`.
  - Hashing: `bcrypt` for password storage.
  - Blocklist: DB-backed token blocklist for logout (`vpg_token_blocklist` table).

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry or similar integration found.

**Logs:**
- Console-based logging with standard `console.error` and `console.log` patterns.

## CI/CD & Deployment

**Hosting:**
- Likely Vercel for Frontend (based on Next.js setup) and a Node.js compatible environment for the Backend.

**CI Pipeline:**
- None detected in the repository structure (no `.github/workflows` or similar).

## Environment Configuration

**Required env vars:**
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for signing auth tokens.
- `RESEND_API_KEY`: API key for Resend email service.

**Secrets location:**
- Stored in `.env` files (not committed).
- Validated via `src/backend/src/config/env.ts`.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected (no outgoing webhooks to third-party services).

---

*Integration audit: 2025-05-09*
