# Technology Stack

**Analysis Date:** 2025-05-09

## Languages

**Primary:**
- TypeScript 5.8.3 - Backend logic and API implementation.
- TypeScript 5.9.3 - Frontend application and UI components.

**Secondary:**
- Java - Standalone utility for clock-log parsing (located in `src/Java/`).

## Runtime

**Environment:**
- Node.js 22.14.0

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present in both `src/backend/` and `src/frontend/`.

## Frameworks

**Core:**
- Express 5.1.0 - Backend API framework.
- Next.js 15.5.6 - Frontend framework (using App Router).
- React 19.0.0 - UI library.

**Testing:**
- Jest 29.7.0 - Primary testing runner for both backend and frontend.
- ts-jest 29.1.2 - TypeScript support for Jest.
- Supertest 6.3.4 - API integration testing.
- Playwright 1.59.1 - Frontend E2E testing.
- React Testing Library 16.3.2 - Frontend component testing.

**Build/Dev:**
- tsx 4.20.6 - TypeScript execution for development.
- Tailwind CSS 4 - Utility-first CSS framework.
- Prisma 6.14.0 - ORM for database access and schema management.

## Key Dependencies

**Critical:**
- `jsonwebtoken` 9.0.2 - Authentication token handling.
- `bcrypt` 6.0.0 - Password hashing.
- `zod` 4.x - Schema validation (shared between frontend and backend).
- `react-hook-form` 7.62.0 - Frontend form management.

**Infrastructure:**
- `resend` 6.10.0 - Email delivery via Resend API.
- `pdf-lib` 1.17.1 - PDF generation and manipulation.
- `exceljs` 4.4.0 - Excel report generation.
- `puppeteer` 24.37.5 - Headless browser for complex report generation.

## Configuration

**Environment:**
- Managed via `dotenv` in `src/backend/src/config/env.ts`.
- Validated at runtime using Zod.
- Key configs required: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`.

**Build:**
- `tsconfig.json` in both backend and frontend.
- `next.config.ts` for frontend-specific build settings.

## Platform Requirements

**Development:**
- Node.js 22.x
- PostgreSQL database instance.

**Production:**
- Deployment target: Typically Vercel (frontend) and any Node.js host/container (backend).

---

*Stack analysis: 2025-05-09*
