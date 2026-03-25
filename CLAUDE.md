# VP-Planilla — Claude Code Operating Manual

Full-stack payroll management system for Costa Rica labor law compliance.

- Backend API: `src/backend/` (Express 5 + TypeScript + Prisma + PostgreSQL)
- Frontend: `src/frontend/` (Next.js 15 + React 19 + TypeScript + Tailwind 4)
- DB schema: `src/backend/prisma/schema.prisma`
- Java clock-log parser: `src/Java/` (standalone utility, NOT called by the Node API at runtime)

---

## Stack & Exact Versions

| Layer | Tech | Version |
|---|---|---|
| Runtime | Node.js | 22.14.0 |
| Backend TypeScript | TypeScript | 5.8.3 |
| Frontend TypeScript | TypeScript | 5.9.3 |
| API Framework | Express | 5.1.0 |
| Frontend Framework | Next.js | 15.5.6 |
| UI Library | React | 19.0.0 |
| ORM | Prisma | ^6.14.0 |
| Database | PostgreSQL | (via Prisma) |
| CSS | Tailwind CSS | ^4 |
| Testing | Jest + ts-jest | ^29.7.0 |
| Forms | react-hook-form | ^7.62.0 |
| Validation | Zod | ^4.0.17 |
| PDF Generation | Puppeteer + pdf-lib + Handlebars | see package.json |
| Animation | framer-motion | ^12.x |
| Calendar UI | @fullcalendar/react | ^6.1.10 |

---

## Commands

```bash
# Backend (from src/backend/)
npm run dev          # tsx watch mode — dev server on port 3001
npm test             # Jest unit tests
npx tsc --noEmit     # Type check without compiling

# Frontend (from src/frontend/)
npm run dev          # Next.js dev server with Turbopack
npx tsc --noEmit     # Type check
npx next lint        # ESLint (next/core-web-vitals + next/typescript)
```

---

## Architecture — STRICT LAYERS (never skip a layer)

```
Backend:   Route → Controller → Service → Prisma (PostgreSQL)
Frontend:  Page → Hook → Service → http.ts → Backend API
```

### Backend Layers

| Layer | Location | Responsibility |
|---|---|---|
| Routes | `src/backend/src/routes/` | Express Router, middleware, `asyncHandler` wrapping |
| Controllers | `src/backend/src/controller/` | Parse req/res, map fields, call service |
| Services | `src/backend/src/service/` | All business logic, Prisma queries |
| Models | `src/backend/src/model/` | Plain TypeScript interfaces only — no logic |
| Middleware | `src/backend/src/middleware/` | JWT auth (`AuthMiddleware`) |
| Utils | `src/backend/src/utils/` | Pure utility functions (payroll math, asyncHandler, docs) |

### Frontend Layers

| Layer | Location | Responsibility |
|---|---|---|
| Pages | `src/frontend/src/app/pages/<domain>/page.tsx` | `"use client"` pages, consume hooks |
| Hooks | `src/frontend/src/hooks/use<Domain>.ts` | Data fetch, local state, actions |
| Services | `src/frontend/src/services/<domain>Service.ts` | API call methods via `http.ts` |
| http.ts | `src/frontend/src/services/http.ts` | **Central HTTP client — never bypass** |
| Components | `src/frontend/src/components/` | Reusable UI, form modals, tables |
| Schemas | `src/frontend/src/schemas/` | Zod validation schemas |
| Types | `src/frontend/src/types/` | Shared TypeScript interfaces |

---

## Code Conventions

### Backend

- **Files**: `PascalCase.ts` — e.g. `PayrollService.ts`, `PayrollController.ts`, `PayrollRoutes.ts`
- **Classes**: static methods only (`static async methodName()`) — no instantiation
- **Prisma**: always import singleton — `import { prisma } from '../lib/prisma'`. **NEVER `new PrismaClient()`**
- **Method order in classes**: create → getAll → getById → update → delete
- **JSDoc**: every public method must have `@param`, `@returns`, `@throws`
- **DB fields**: `snake_case` matching Prisma schema; all tables use `vpg_` prefix
- **Error responses**: `{ success: false, error: "message" }` with appropriate HTTP status
- **Success responses**: `{ success: true, data: ... }` or direct object (match existing endpoint style)
- **New routes**: must use `asyncHandler` wrapper + apply `AuthMiddleware.verifyToken`

### Frontend

- **Components**: `PascalCase.tsx`, typed as `React.FC<PropsInterface>` with props interface defined in same file
- **Hooks**: `camelCase` prefixed with `use` (e.g. `usePayroll.ts`)
- **Services**: `camelCase` (e.g. `payrollService.ts`)
- **Imports**: always use `@/` path alias — never relative imports more than 1 level deep
- **Forms**: always `react-hook-form` + `zodResolver` — never raw `useState` for form fields
- **Form typing**: `useForm<InputType, unknown, OutputType>({ resolver: zodResolver(schema), defaultValues })`
- **API calls**: always through `http.ts` service methods — **never raw `fetch` in components or hooks**
- **Hook return shape**: always `{ data, isLoading, error, ...actions }`
- **Async in hooks**: always wrapped in `useCallback`
- **Modals**: `AnimatePresence` + `motion.div` with `backdropVariants` / `modalVariants`
- **Language**: business logic comments in Spanish OK; infrastructure comments in English
- **Constants**: `SCREAMING_SNAKE_CASE` for top-level constants

### Naming Quick Reference

| Thing | Convention | Example |
|---|---|---|
| Backend files | PascalCase | `NomineeService.ts` |
| Frontend components | PascalCase | `EmployeeTable.tsx` |
| Frontend hooks | camelCase + `use` prefix | `useEmployeeList.ts` |
| Frontend services | camelCase | `employeeService.ts` |
| Functions / methods | camelCase | `calculatePayroll()` |
| DB / domain fields | snake_case | `period_start`, `national_id` |
| Form field names | `entity_field_name` | `employee_first_name` |
| Top-level constants | SCREAMING_SNAKE_CASE | `REGULAR_HOURS_PER_DAY` |
| Types / interfaces | PascalCase | `Employee`, `PayrollType` |

---

## NEVER Change Without Explicit Instruction

| File / Area | Why |
|---|---|
| `src/backend/src/utils/payrollUtils.ts` | Costa Rica labor law math — highly domain-specific, errors cause wrong payroll |
| `src/backend/prisma/schema.prisma` | Changing requires a Prisma migration; never edit without generating one |
| `src/frontend/src/services/http.ts` | All API calls + token refresh logic live here; breaking it breaks the entire frontend |
| `src/backend/src/utils/asyncHandler.ts` | Express error boundary — all route handlers depend on it |
| `localStorage` keys `vp_access_token` / `vp_refresh_token` | Changing breaks all active user sessions |
| `vpg_` table name prefix convention | Hardcoded throughout schema, services, and controllers |
| `src/backend/src/middleware/AuthMiddleware.ts` | JWT verification — only extend, never remove existing methods |
| `src/backend/src/types/payroll.types.ts` | Core payroll calculation return types — services and frontend both depend on this shape |

---

## Success Criteria by Task Type

### New Backend Service Method
- [ ] `npx tsc --noEmit` passes in `src/backend/`
- [ ] Uses `import { prisma } from '../lib/prisma'` — not `new PrismaClient()`
- [ ] Static method with full JSDoc
- [ ] No `any` in method signature — use proper types from `src/backend/src/model/`
- [ ] Method follows create → getAll → getById → update → delete order in the class

### New API Endpoint
- [ ] Route uses `asyncHandler` wrapper
- [ ] Route applies `AuthMiddleware.verifyToken` (document explicitly if intentionally public)
- [ ] Has `@swagger` JSDoc annotation on the route
- [ ] Controller delegates all logic to Service — zero business logic in controller
- [ ] `npx tsc --noEmit` passes in `src/backend/`

### New Frontend Component
- [ ] `npx tsc --noEmit` passes in `src/frontend/`
- [ ] `npx next lint` passes
- [ ] Uses `@/` alias throughout (no `../../` imports)
- [ ] Props interface defined in same file, component typed as `React.FC<PropsInterface>`
- [ ] No raw `fetch` calls — all API calls go through the service layer

### New Frontend Form / Modal
- [ ] Uses `react-hook-form` + `zodResolver` with a Zod schema in `src/frontend/src/schemas/`
- [ ] `useForm` is typed: `useForm<InputType, unknown, OutputType>`
- [ ] Modal uses `AnimatePresence` + `motion.div` animation pattern
- [ ] `useEffect` resets form and focuses first input when `isOpen` changes

### Payroll Calculation Change
- [ ] `npm test` passes in `src/backend/`
- [ ] Pure functions in `payrollUtils.ts` have unit tests for the changed logic
- [ ] Costa Rica labor law verified: 8h/day regular, 1.5× up to 10h, 2× above 10h, weekly rest = 0.5× daily rate
- [ ] `NomineeService.calculatePayrollForPeriod` fetches vacations + clock logs ONCE outside the employee loop

### Database Schema Change
- [ ] `npx prisma migrate dev --name <description>` run in `src/backend/`
- [ ] `npx prisma generate` run after migration
- [ ] New table name follows `vpg_` prefix + `snake_case` convention
- [ ] New field names follow `tablename_fieldname` pattern

---

## Known Technical Debt (Don't Fix Without a Plan)

These are documented issues. Do not silently "fix" them while working on something else — they require coordinated changes:

1. **Auth gap**: 13/16 route files have no `AuthMiddleware.verifyToken`. Fixing requires a public-endpoint allowlist.
2. **Multiple PrismaClient instances**: 16 services use `new PrismaClient()` instead of the singleton. Fix one service at a time.
3. **PayrollService bad import**: `import { error } from 'console'` causes `throw undefined`. Replace with `throw new Error(...)`.
4. **No backend input validation**: No Zod/joi on any backend controller. Add per-route middleware.
5. **Wildcard CORS**: `app.use(cors())` with no origin restriction. Fix: `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })`.
6. **JWT fallback secret**: Falls back to `'your-default-secret-key'`. Replace with startup assertion.
7. **bcrypt@6.0.0 pre-release**: Prefer `bcrypt@^5.1.1`.
8. **Credentials in query params**: `AuthController.login` reads `req.query.username/password` as fallback — remove.
9. **`@prisma/client` in devDependencies**: Must be in `dependencies` for production deploys.

---

## Domain Context

This is a **Costa Rican payroll system** (planilla). Key domain rules baked into the code:

- Work week: Monday–Saturday (Sunday = rest day)
- Regular hours: 8h/day
- Overtime: 1.5× up to 10h total, 2× above 10h
- Weekly rest compensation: 0.5× daily salary for worked rest days
- Social security (CCSS) deductions are mandatory
- Reports must comply with CCSS and Ministerio de Hacienda formats
- Employee status: `activo` / `inactivo` / `suspendido`

---

*Last updated: 2026-03-25 — generated from .planning/codebase/ map*
