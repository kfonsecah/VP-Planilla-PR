# Codebase Structure

**Analysis Date:** 2026-03-31

## Directory Layout

```
VP-Planilla/
├── src/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── index.ts      # Server entry point
│   │   │   ├── routes/       # Express route handlers
│   │   │   ├── controller/   # Request handlers, field mapping
│   │   │   ├── service/      # Business logic, Prisma queries
│   │   │   ├── model/        # TypeScript interfaces
│   │   │   ├── middleware/   # Auth, validation, etc.
│   │   │   ├── lib/          # Prisma singleton, utilities
│   │   │   ├── utils/        # Helpers (asyncHandler, payroll math, docs)
│   │   │   ├── types/        # Shared type definitions
│   │   │   ├── schemas/      # Zod validation schemas (backend)
│   │   │   └── __tests__/    # Jest unit & integration tests
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema definition
│   │   │   └── migrations/   # Prisma migrations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── jest.config.js    # Jest test configuration
│   │
│   ├── frontend/             # Next.js 15 app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx           # Root layout, loads ClientLayout
│   │   │   │   ├── page.tsx             # Root page, redirects to /pages/auth
│   │   │   │   └── pages/               # Domain-based page structure
│   │   │   │       ├── auth/            # Login page
│   │   │   │       ├── employee/        # Employee CRUD pages
│   │   │   │       │   ├── list/
│   │   │   │       │   └── edit/[id]/
│   │   │   │       ├── payroll/         # Payroll pages
│   │   │   │       ├── deductions/
│   │   │   │       ├── bonuses/
│   │   │   │       └── ...              # Other domain pages
│   │   │   ├── components/              # Reusable UI components
│   │   │   │   ├── EmployeeTable.tsx
│   │   │   │   ├── AddEmployeeModal.tsx
│   │   │   │   ├── ui/                  # Basic UI components
│   │   │   │   └── ...
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   │   ├── useAuth.tsx          # Auth context + provider
│   │   │   │   ├── useEmployeeList.ts
│   │   │   │   ├── usePayroll.ts
│   │   │   │   └── ...
│   │   │   ├── services/                # API call methods
│   │   │   │   ├── http.ts              # Central HTTP client
│   │   │   │   ├── employeeService.ts
│   │   │   │   ├── authService.ts
│   │   │   │   └── ...
│   │   │   ├── types/                   # TypeScript interfaces
│   │   │   │   ├── employee.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── ...
│   │   │   ├── schemas/                 # Zod validation schemas
│   │   │   │   ├── employee.ts
│   │   │   │   └── ...
│   │   │   ├── layouts/                 # Page layout components
│   │   │   │   └── main.tsx             # Main layout wrapper with sidebar
│   │   │   ├── styles/                  # Global CSS
│   │   │   │   └── globals.css
│   │   │   ├── config/                  # Configuration
│   │   │   │   └── index.ts             # API_CONFIG (baseUrl, etc.)
│   │   │   ├── constants/               # Constants (enums, magic values)
│   │   │   │   └── index.ts
│   │   │   └── utils/                   # Utility functions
│   │   │       └── employeeUtils.ts
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── Java/                 # Standalone clock-log parser (NOT called by Node API)
│       └── ...
│
├── .planning/
│   └── codebase/            # Codebase analysis documents (written by GSD)
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       ├── CONVENTIONS.md
│       ├── TESTING.md
│       ├── STACK.md
│       └── INTEGRATIONS.md
│
└── docs/                    # Documentation, formal thesis, contracts
```

## Directory Purposes

**`src/backend/src/`:**
- Purpose: Backend Express API source code
- Core responsibility: Accept HTTP requests, validate, execute business logic, return JSON

**`src/backend/src/routes/`:**
- Purpose: Express Router definitions
- Contains: Route definitions with HTTP verbs, middleware, swagger docs
- Key files: `EmployeeRoute.ts`, `PayrollRoutes.ts`, `AuthRoute.ts`, etc.
- Pattern: All routes wrapped in `asyncHandler`, secured with `AuthMiddleware.verifyToken`

**`src/backend/src/controller/`:**
- Purpose: Parse requests, map field names, call services
- Contains: Static async methods per entity
- Pattern: Controllers delegate all business logic to services; controllers only handle HTTP concerns
- Example: `EmployeeController.createEmployee()` maps `employee_first_name` → passes to `EmployeeService`

**`src/backend/src/service/`:**
- Purpose: Business logic, database queries, domain rules
- Contains: Static async methods with full JSDoc
- Scope: Employee management, payroll calculations, deductions, auditing, reporting
- Key services: `EmployeeService`, `PayrollService`, `NomineeService`, `ReportsService`, `VacationService`
- Database access: All use `prisma` singleton from `src/backend/src/lib/prisma.ts`

**`src/backend/src/model/`:**
- Purpose: Domain entity type definitions
- Contains: Plain TypeScript interfaces (no logic)
- Examples: `Employee`, `Payroll`, `Deduction`, `PayrollCalculation`
- No class methods or logic

**`src/backend/src/middleware/`:**
- Purpose: Cross-cutting concerns (auth, validation, etc.)
- Key files:
  - `AuthMiddleware.ts` — JWT verification, token blocklist check
  - `validateBody.ts` — Zod schema validation for request bodies
- Usage: Applied in routes via `router.use()` or `router.post('/path', middleware, handler)`

**`src/backend/src/lib/`:**
- Purpose: Infrastructure and singleton utilities
- Key files:
  - `prisma.ts` — Singleton PrismaClient with query logging
  - Used by: All services (never instantiate own PrismaClient)

**`src/backend/src/utils/`:**
- Purpose: Pure utility functions
- Key files:
  - `asyncHandler.ts` — Wraps async route handlers
  - `payrollUtils.ts` — Costa Rica payroll math (overtime, rest compensation, CCSS)
  - `docs.ts` — Swagger spec generation
- Scope: No business logic for specific entities; purely helper functions

**`src/backend/src/types/`:**
- Purpose: Shared type definitions (used across backend)
- Examples: `payroll.types.ts` for PayrollCalculation, CostRicaPayrollResult

**`src/backend/src/schemas/`:**
- Purpose: Zod validation schemas for requests
- Usage: Applied in routes via `validateBody(schema)` middleware
- Examples: `EmployeeSchema.ts`, `PayrollSchema.ts`

**`src/backend/src/__tests__/`:**
- Purpose: Jest unit and integration tests
- Structure:
  - `unit/` — Tests for individual services/utils
  - `integration/` — Tests for request → response flows
  - `setup/` — Test fixtures, test database setup

**`src/backend/prisma/`:**
- Purpose: Database schema and migrations
- Key files:
  - `schema.prisma` — Defines all tables (prefixed with `vpg_`), relations, indexes
  - `migrations/` — Prisma-generated SQL migration files
- Usage: Run `npx prisma migrate dev` after schema changes

**`src/frontend/src/app/`:**
- Purpose: Next.js 15 app directory (file-based routing)
- Contains: `layout.tsx` (root HTML), `page.tsx` (root page), `pages/` (domain pages)
- Convention: Domain pages are under `pages/<domain>/page.tsx` (e.g., `pages/employee/list/page.tsx`)

**`src/frontend/src/app/pages/`:**
- Purpose: Domain-organized page structure
- Layout: Each domain (employee, payroll, deductions, etc.) has its own directory with list/edit/detail pages
- Example structure:
  ```
  pages/
  ├── auth/
  │   └── page.tsx         # Login page
  ├── employee/
  │   ├── list/
  │   │   └── page.tsx     # Employee listing with stats & modals
  │   └── edit/
  │       └── [id]/
  │           └── page.tsx # Edit specific employee
  ├── payroll/
  │   ├── list/
  │   ├── calculate/
  │   └── [id]/
  │       └── employees/   # Payroll employees view
  └── ...
  ```

**`src/frontend/src/components/`:**
- Purpose: Reusable UI components
- Scope: Tables, modals, cards, forms
- Pattern: React.FC with typed props interface, use `@/` imports
- Key components:
  - `EmployeeTable.tsx` — Displays employee list with actions
  - `AddEmployeeModal.tsx` — Modal form to create employee
  - `EmployeeStatsCards.tsx` — Dashboard statistics
  - `PayrollCalendar.tsx` — Calendar view for payroll periods
- Animation: Use `framer-motion` with `AnimatePresence`, `motion.div`

**`src/frontend/src/hooks/`:**
- Purpose: Custom React hooks for data fetching and state management
- Naming: `use<Domain>.ts` or `use<Domain>.tsx` (e.g., `useEmployeeList.ts`, `useAuth.tsx`)
- Return shape: Always `{ data, isLoading, error, ...actions }`
- Examples:
  - `useAuth.tsx` — Provides `AuthContext`, manages login/logout, token storage
  - `useEmployeeList.ts` — Fetches employees, filters, handles create/edit/delete
  - `usePayroll.ts` — Fetches payrolls, calculates new, generates reports
- Async pattern: Use `useCallback` to wrap async operations

**`src/frontend/src/services/`:**
- Purpose: API call methods using centralized HTTP client
- Naming: `<domain>Service.ts` in camelCase (e.g., `employeeService.ts`)
- Pattern: Export async functions, all use `http.get()`, `http.post()`, etc.
- Examples:
  - `employeeService.ts` — `getEmployees()`, `createEmployee()`, `updateEmployee()`, `fireEmployee()`
  - `authService.ts` — `login()`, `logout()`, `refreshToken()`
  - `payrollService.ts` — `getPayrolls()`, `calculatePayroll()`, `getPayrollDetails()`

**`src/frontend/src/services/http.ts`:**
- Purpose: Central HTTP abstraction with automatic token management
- **CRITICAL**: All API calls must go through this client (never use raw `fetch`)
- Methods: `http.get(path)`, `http.post(path, body)`, `http.put()`, `http.delete()`
- Features:
  - Reads/writes tokens from localStorage (`vp_access_token`, `vp_refresh_token`)
  - Attaches Bearer token to all requests
  - On 401, attempts one automatic token refresh
  - On final auth failure, calls global `onAuthFailureCallback` → redirects to login

**`src/frontend/src/types/`:**
- Purpose: TypeScript interfaces for domain entities
- Files: `employee.ts`, `payrollTypes.ts`, `laborEvent.ts`, etc.
- Examples: `Employee`, `EmployeeFormData`, `EmployeeStats`, `Payroll`
- Used by: Hooks, Components, Services

**`src/frontend/src/schemas/`:**
- Purpose: Zod validation schemas for forms
- Pattern: One schema file per domain (e.g., `employee.ts`, `vacationSchema.ts`)
- Usage: Applied in hooks via `zodResolver(schema)` for react-hook-form
- Examples: `createEmployeeSchema`, `updateEmployeeSchema`, `vacationSchema`

**`src/frontend/src/layouts/`:**
- Purpose: Shared page layout components
- Key file: `main.tsx` — Wraps all pages with sidebar, navbar, `AuthProvider`
- Loaded from: `src/frontend/src/app/layout.tsx`

**`src/frontend/src/config/`:**
- Purpose: Application configuration
- Key file: `index.ts` — Exports `API_CONFIG` with baseUrl (backend API endpoint)

**`src/frontend/src/constants/`:**
- Purpose: Magic values, enums, constants
- Examples: Employee statuses (ACTIVE, VACATION, etc.), payroll periods

**`src/frontend/src/utils/`:**
- Purpose: Utility functions
- Examples: `employeeUtils.ts` — Helper functions for employee name parsing, stats calculation

## Key File Locations

**Backend Entry Points:**
- `src/backend/src/index.ts` — Server startup, route registration, middleware setup

**Database Setup:**
- `src/backend/prisma/schema.prisma` — Full database schema definition

**API Routes:**
- `src/backend/src/routes/*.ts` — All route definitions organized by entity

**Frontend Entry Point:**
- `src/frontend/src/app/layout.tsx` — Root layout wrapper

**Frontend Root Page:**
- `src/frontend/src/app/page.tsx` — Redirects to auth

**Authentication:**
- Backend: `src/backend/src/routes/AuthRoute.ts`, `src/backend/src/controller/AuthController.ts`, `src/backend/src/service/AuthService.ts`
- Frontend: `src/frontend/src/hooks/useAuth.tsx` (context provider)

**Core Business Logic:**
- Backend: `src/backend/src/service/` (all services)
- Frontend: `src/frontend/src/hooks/` (all hooks)

**HTTP Communication:**
- Frontend: `src/frontend/src/services/http.ts` — Central client (never bypass)

## Naming Conventions

**Backend Files:**
- Pattern: `PascalCase.ts`
- Examples: `EmployeeService.ts`, `EmployeeController.ts`, `EmployeeRoute.ts`

**Frontend Components:**
- Pattern: `PascalCase.tsx`
- Examples: `EmployeeTable.tsx`, `AddEmployeeModal.tsx`

**Frontend Hooks:**
- Pattern: `camelCase` prefixed with `use`
- Examples: `useEmployeeList.ts`, `usePayroll.ts`, `useAuth.tsx`

**Frontend Services:**
- Pattern: `camelCase` (no `use` prefix)
- Examples: `employeeService.ts`, `authService.ts`, `payrollService.ts`

**Database Tables:**
- Pattern: Prefixed with `vpg_`, snake_case columns
- Examples: `vpg_employees`, `vpg_payrolls`, `vpg_deductions`
- Column naming: `table_field_name` (e.g., `employee_first_name`, `employee_email`)

**Frontend Form Field Names:**
- Pattern: `entity_field_name` (matches backend schema)
- Examples: `employee_first_name`, `employee_email`, `employee_status`

**React Props Interfaces:**
- Pattern: `PascalCase` suffix with `Props` (optional) or define inline
- Example: `interface EmployeeTableProps { employees: Employee[] }`

**Constants:**
- Pattern: `SCREAMING_SNAKE_CASE`
- Examples: `REGULAR_HOURS_PER_DAY`, `OVERTIME_MULTIPLIER_STANDARD`, `CCSS_DEDUCTION_PERCENTAGE`

## Where to Add New Code

**New Backend Feature (e.g., Employee CRUD):**
1. Create model: `src/backend/src/model/<domain>.ts` — Interface definition
2. Create service: `src/backend/src/service/<Domain>Service.ts` — Business logic, Prisma queries
3. Create controller: `src/backend/src/controller/<Domain>Controller.ts` — Request/response mapping
4. Create route: `src/backend/src/routes/<Domain>Route.ts` — Express Router with swagger docs
5. Add to main: Register route in `src/backend/src/index.ts`
6. Test: Add tests in `src/backend/src/__tests__/unit/services/<Domain>Service.test.ts`

**New Frontend Feature (e.g., Employee List):**
1. Create types: `src/frontend/src/types/<domain>.ts` — Entity interfaces
2. Create schema: `src/frontend/src/schemas/<domain>.ts` — Zod validation
3. Create service: `src/frontend/src/services/<domain>Service.ts` — API call methods
4. Create hook: `src/frontend/src/hooks/use<Domain>.ts` — Data fetch & state
5. Create components: `src/frontend/src/components/<Component>.tsx` — UI (modals, tables, cards)
6. Create page: `src/frontend/src/app/pages/<domain>/list/page.tsx` — Route entry point
7. Use components in page: Consume hook, render components

**New Route/Endpoint:**
- Must be wrapped in `asyncHandler` wrapper
- Must apply `AuthMiddleware.verifyToken` (unless intentionally public — document why)
- Must have `@swagger` JSDoc annotation
- Must delegate all logic to service (controller only maps fields)
- Run `npx tsc --noEmit` and `npm test` to verify

**New Database Table:**
- Add model to `src/backend/prisma/schema.prisma` (follow `vpg_` prefix, snake_case columns)
- Run `npx prisma migrate dev --name <description>`
- Run `npx prisma generate`
- All services must use singleton `prisma` from `src/backend/src/lib/prisma.ts`

**New Zod Schema (Validation):**
- Backend: `src/backend/src/schemas/<domain>Schema.ts` → use in `validateBody` middleware
- Frontend: `src/frontend/src/schemas/<domain>.ts` → use in `zodResolver` in react-hook-form

## Special Directories

**`src/backend/__tests__/`:**
- Purpose: Jest test files
- Generated: No (manually written)
- Committed: Yes
- Structure:
  - `unit/` — Service/utility tests with mocked Prisma
  - `integration/` — End-to-end route tests
  - `setup/` — Shared test config and fixtures

**`src/backend/prisma/migrations/`:**
- Purpose: Prisma-generated migration SQL files
- Generated: Yes (by `npx prisma migrate dev`)
- Committed: Yes (checked into version control)
- Usage: Run `npx prisma migrate deploy` in production

**`src/frontend/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (ignored)
- Usage: Production deployment artifact

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents (written by GSD map-codebase)
- Generated: Yes (by automation)
- Committed: Yes
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, CONCERNS.md

---

*Structure analysis: 2026-03-31*
