# Technology Stack

**Analysis Date:** 2026-03-31

## Languages

**Primary:**
- TypeScript 5.8.3 (Backend) - Used in `src/backend/` for API and business logic
- TypeScript 5.9.3 (Frontend) - Used in `src/frontend/` for Next.js pages and components
- Java (Utility) - Clock log parser utility at `src/Java/clocklogs/` (standalone CLI tool, not integrated with Node backend)

**Secondary:**
- HTML/CSS - Handlebars templates in `src/backend/src/service/PaymentReceiptService.ts` for PDF generation
- JavaScript/JSX - React 19 components in `src/frontend/src/components/`

## Runtime

**Environment:**
- Node.js 22.14.0 (backend and frontend dev server)
- Chromium (via Puppeteer for PDF rendering) - launched dynamically by `PaymentReceiptService`

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present in both `src/backend/` and `src/frontend/`

## Frameworks

**Core:**
- Express 5.1.0 - REST API framework in `src/backend/src/index.ts`
- Next.js 15.5.6 - Full-stack frontend framework in `src/frontend/`
- React 19.0.0 - UI component library in `src/frontend/src/components/`

**ORM & Database:**
- Prisma 6.14.0 - Database ORM for PostgreSQL migrations and queries (`src/backend/prisma/schema.prisma`)
- PostgreSQL (configured via `DATABASE_URL` environment variable)

**Testing:**
- Jest 29.7.0 - Test runner in backend (`src/backend/jest.config.js`)
- ts-jest 29.1.2 - TypeScript support for Jest
- Supertest 6.3.4 - HTTP assertions for API testing
- jest-mock-extended 3.0.5 - Mock utilities for unit tests

**Build/Dev:**
- tsx 4.20.6 - TypeScript execution for dev server (`npm run dev` uses `tsx watch`)
- Turbopack - Next.js bundler for frontend dev performance (enabled in `src/frontend/package.json`)
- tsc - TypeScript compiler for type checking and production builds

## Key Dependencies

**Critical:**
- Prisma Client 6.14.0 - ORM for all database operations; imported via `import { prisma } from '../lib/prisma'` singleton pattern across services
- Express 5.1.0 - HTTP server and routing
- Next.js 15.5.6 - Frontend SSR/static generation
- React 19.0.0 - UI rendering
- react-hook-form 7.62.0 - Form state management without useState
- Zod 4.0.17 (backend) / 4.3.6 (frontend) - Runtime type validation and schema definition

**Authentication & Security:**
- jsonwebtoken 9.0.2 - JWT token generation and verification in `src/backend/src/service/AuthService.ts`
- bcrypt 6.0.0 - Password hashing (pre-release version; documented tech debt to upgrade to 5.1.1)
- Helmet 8.1.0 - HTTP security headers in `src/backend/src/index.ts`
- CORS 2.8.5 - Cross-origin resource sharing with allowlist support

**Infrastructure:**
- express-rate-limit 8.3.1 - Rate limiting on auth routes in `src/backend/src/routes/AuthRoute.ts`
- dotenv 16.5.0 - Environment variable management via `.env` files

**PDF & Document Generation:**
- Puppeteer 24.37.5 - Headless Chrome for HTML-to-PDF rendering in `src/backend/src/service/PaymentReceiptService.ts`
- pdf-lib 1.17.1 - PDF manipulation after Puppeteer generation
- Handlebars 4.7.8 - Template engine for payment receipt HTML generation

**Frontend UI & Animation:**
- Tailwind CSS 4 - Utility-first CSS framework in `src/frontend/`
- framer-motion 12.23.12 - Animation library for modals and transitions
- @fullcalendar/react 6.1.10 - Calendar UI component for attendance tracking
- @heroicons/react 2.2.0 - Icon library
- react-draggable 4.5.0 - Drag-and-drop functionality

**Data Export:**
- ExcelJS 4.4.0 - Excel file generation in `src/frontend/src/app/pages/attendance/page.tsx` and payroll pages
- Nodemailer 8.0.1 - Email sending for report dispatch (`src/backend/src/service/ReportsService.ts`)

**API Documentation:**
- swagger-jsdoc 6.2.8 - Swagger spec generation from JSDoc comments
- @scalar/express-api-reference 0.8.16 - Interactive API docs UI at `/api/docs`

## Configuration

**Environment:**
- Backend: `.env` file in `src/backend/` (contains `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `REPORTS_OUTPUT_DIR`, `PORT`)
- Frontend: `.env` file in `src/frontend/` (contains `NEXT_PUBLIC_API_URL`)
- TypeScript: `tsconfig.json` in both `src/backend/` and `src/frontend/` with strict mode enabled

**Build Targets:**
- Backend: ES2020 module format for Node 22.14.0
- Frontend: ES2017 with Next.js optimization; uses `@/*` path alias for imports

**Prisma:**
- Provider: postgresql
- Client auto-generated from schema in `src/backend/prisma/schema.prisma`
- Migrations stored in `src/backend/prisma/migrations/`

## Platform Requirements

**Development:**
- Node.js 22.14.0
- npm (comes with Node)
- PostgreSQL database (local or remote via `DATABASE_URL`)
- Chromium/Chrome (installed by Puppeteer on demand for PDF generation)

**Production:**
- Node.js 22.14.0 runtime
- PostgreSQL database with `vpg_` prefix schema
- Disk space for PDF storage (default: `storage/reports/` relative to cwd)
- Chromium available in deployment environment (Puppeteer handles sandboxing via `--no-sandbox` flag)
- Email server accessible (SMTP configuration via `vpg_mail_server_settings` table or Nodemailer environment)

**Optional (for clock log import):**
- Java 8+ (for standalone `src/Java/clocklogs/` utility)
- JDBC PostgreSQL driver (bundled in Java project)

---

*Stack analysis: 2026-03-31*
