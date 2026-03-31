# Architecture

**Analysis Date:** 2026-03-31

## Pattern Overview

**Overall:** Strict layered architecture with complete separation of concerns. Backend follows classic MVC-style request path; frontend implements state management through hooks with centralized HTTP abstraction.

**Key Characteristics:**
- Request-response routing through dedicated layers (never skip)
- Singleton Prisma instance for all database access (`src/backend/src/lib/prisma.ts`)
- Centralized HTTP client abstraction (`src/frontend/src/services/http.ts`) with built-in token refresh
- Static service classes with async methods (no instantiation)
- API responses follow consistent success/error shape

## Layers

**Backend Route Layer:**
- Purpose: Express Router configuration, middleware setup, asyncHandler wrapping, JSDoc/Swagger annotations
- Location: `src/backend/src/routes/`
- Contains: Route definitions with HTTP verbs, parameter handling, middleware application (e.g., `AuthMiddleware.verifyToken`, `validateBody`)
- Depends on: Controllers (delegates logic), Middleware, Utils (asyncHandler)
- Used by: Express app
- Example: `src/backend/src/routes/EmployeeRoute.ts` — defines POST `/employee/create`, GET `/employee/:id`, etc.

**Backend Controller Layer:**
- Purpose: Parse HTTP request/response, map field names, validate input format, call service methods, format response
- Location: `src/backend/src/controller/`
- Contains: Static async methods per entity (e.g., `EmployeeController.createEmployee()`)
- Depends on: Services, Models (for field mapping)
- Used by: Routes
- Example: `src/backend/src/controller/EmployeeController.ts` — normalizes frontend field names (e.g., `employee_first_name`) to match Prisma schema

**Backend Service Layer:**
- Purpose: All business logic, database queries, validation, payroll calculations, cross-entity coordination
- Location: `src/backend/src/service/`
- Contains: Static async methods organized by domain (Employee, Payroll, Deductions, etc.)
- Depends on: Prisma singleton (`src/backend/src/lib/prisma.ts`), Models, Utils (payroll math)
- Used by: Controllers
- Key entities: `EmployeeService`, `PayrollService`, `NomineeService`, `ReportsService`
- Example: `src/backend/src/service/EmployeeService.ts` — creates/updates employees, applies status logic (A/V/I/M char mapping)

**Backend Model Layer:**
- Purpose: Plain TypeScript interfaces for domain entities — no logic
- Location: `src/backend/src/model/`
- Contains: Type definitions for Employee, Payroll, Deduction, etc.
- Depends on: Nothing
- Used by: Controllers (field mapping), Services (type hints)
- Example: `src/backend/src/model/employee.ts` — defines Employee interface

**Backend Middleware:**
- Purpose: JWT verification, body validation, cross-cutting concerns
- Location: `src/backend/src/middleware/`
- Key middleware:
  - `AuthMiddleware.verifyToken` — Checks Bearer token, verifies JWT, checks token blocklist, attaches user to request
  - `validateBody` — Validates request body against Zod schema
- Used by: Routes

**Backend Database Access:**
- Purpose: Single Prisma client instance for all database operations
- Location: `src/backend/src/lib/prisma.ts`
- Pattern: `import { prisma } from '../lib/prisma'` (never `new PrismaClient()`)
- Features: Query logging, query counting for debugging

**Frontend Page Layer:**
- Purpose: `"use client"` pages consume hooks, orchestrate layout, handle URL params, pass data to components
- Location: `src/frontend/src/app/pages/<domain>/page.tsx`
- Contains: React components, state via hooks, page-level composition
- Depends on: Hooks, Components, Types
- Used by: Next.js router
- Example: `src/frontend/src/app/pages/employee/list/page.tsx` — uses `useEmployeeList` hook, renders `EmployeeTable`, `EmployeeStatsCards`, modals

**Frontend Hook Layer:**
- Purpose: Data fetching, local state management, async actions (all business logic resides here)
- Location: `src/frontend/src/hooks/use<Domain>.ts`
- Contains: Custom React hooks following naming pattern `use<Domain>`
- Depends on: Services, Types, Utils
- Returns: Always shape `{ data, isLoading, error, ...actions }` for consistency
- Key patterns:
  - Use `useCallback` to wrap async operations
  - Use Zod schemas for input validation before API calls
  - Update state after API response
- Examples:
  - `src/frontend/src/hooks/useEmployeeList.ts` — fetches all employees, handles add/edit/delete actions
  - `src/frontend/src/hooks/useAuth.tsx` — login/logout, token refresh, auth context

**Frontend Service Layer:**
- Purpose: API call methods using centralized HTTP client
- Location: `src/frontend/src/services/<domain>Service.ts` (camelCase)
- Contains: Exported async functions that call `http.get()`, `http.post()`, etc.
- Depends on: http.ts client
- Used by: Hooks
- Example: `src/frontend/src/services/employeeService.ts` — `getEmployees()`, `createEmployee()`, `updateEmployee()`

**Frontend HTTP Client:**
- Purpose: Central HTTP abstraction with token management and retry logic
- Location: `src/frontend/src/services/http.ts`
- Contains: Methods `get()`, `post()`, `put()`, `delete()`; token storage/retrieval; automatic 401 refresh
- Features:
  - Reads/writes tokens from localStorage (`vp_access_token`, `vp_refresh_token`)
  - Attaches Bearer token to all requests automatically
  - On 401, attempts one token refresh via `AuthService.refreshToken()`
  - Calls global `onAuthFailureCallback` on auth failure
- Pattern: **Never bypass this client; never use raw `fetch()` in components or hooks**

**Frontend Component Layer:**
- Purpose: Reusable UI components (tables, modals, forms, cards)
- Location: `src/frontend/src/components/`
- Contains: React.FC components typed with props interfaces, Tailwind styling, framer-motion animations
- Depends on: Types, Schemas (for form validation)
- Used by: Pages
- Examples: `EmployeeTable`, `AddEmployeeModal`, `EmployeeStatsCards`
- Modal pattern: Uses `AnimatePresence` + `motion.div` with backdropVariants/modalVariants

**Frontend Schema/Validation Layer:**
- Purpose: Zod validation schemas for forms and API input
- Location: `src/frontend/src/schemas/`
- Contains: Zod schema definitions (e.g., `createEmployeeSchema`)
- Used by: Hooks (via `zodResolver`), Components (form submission)

**Frontend Type Layer:**
- Purpose: TypeScript interfaces/types for domain entities
- Location: `src/frontend/src/types/`
- Contains: Interfaces like `Employee`, `EmployeeFormData`, `EmployeeStats`
- Used by: Hooks, Components, Services

## Data Flow

**Create Employee (End-to-End):**

1. User fills form in `AddEmployeeModal` component
2. Form submission triggers `handleAddEmployee()` action from `useEmployeeList` hook
3. Hook calls `apiCreateEmployee()` from `employeeService.ts`
4. Service normalizes field names (e.g., `employee_first_name`) and calls `http.post('/employee/create', payload)`
5. HTTP client attaches Bearer token and sends to backend
6. Backend Route receives at `POST /api/employee/create` (from `EmployeeRoute.ts`)
7. `asyncHandler` wraps the route, `validateBody(createEmployeeSchema)` validates payload
8. `AuthMiddleware.verifyToken` runs, attaches user to request
9. Route calls `EmployeeController.createEmployee(req, res)`
10. Controller extracts/maps `req.body` fields and calls `EmployeeService.createEmployee(data)`
11. Service validates status mapping (A/V/I/M), calls `prisma.vpg_employees.create()`
12. Prisma executes SQL INSERT, returns created record
13. Service transforms Prisma response to Employee model type
14. Controller returns 201 response: `{ success: true, data: employee }`
15. Frontend service receives response, hook updates local state, UI re-renders

**Payroll Calculation (Key Business Logic):**

1. `PayrollService.calculatePayrollForPeriod()` (backend) fetches:
   - All employees for the period
   - Clock logs (IN/OUT) for date range
   - Vacation records
   - Deductions per employee
   - Bonuses
2. **Single fetch outside loop**: Clock logs fetched once and distributed to employees
3. For each employee:
   - Calculate worked hours from clock logs
   - Apply Costa Rica overtime rules: 8h regular, 1.5× up to 10h, 2× above
   - Calculate weekly rest compensation (0.5× daily salary for worked Sundays)
   - Deduct mandatory CCSS + employee deductions
   - Add bonuses
   - Return `PayrollCalculation` type
4. Service returns array of payroll results
5. Controller formats response with success flag

**Refresh Token Flow (Auth):**

1. Frontend makes authenticated request with expired access token
2. Backend returns 401
3. HTTP client intercepts 401, calls `AuthService.refreshToken(refresh_token)`
4. Backend validates refresh token, returns new access token
5. HTTP client updates localStorage and retries original request
6. If refresh fails or no refresh token available, calls `onAuthFailureCallback` → redirects to login

## Key Abstractions

**Prisma Singleton:**
- Purpose: Global database client instance
- Location: `src/backend/src/lib/prisma.ts`
- Pattern: `import { prisma } from '../lib/prisma'`
- Guarantees: Single TCP connection pool, consistent query logging
- **CRITICAL**: Never use `new PrismaClient()` in services

**AsyncHandler:**
- Purpose: Wraps async route handlers to catch promise rejections
- Location: `src/backend/src/utils/asyncHandler.ts`
- Usage: `router.post('/path', asyncHandler(EmployeeController.method))`
- Catches errors and passes to Express error handler (next middleware)

**HTTP Client with Token Refresh:**
- Purpose: Centralized API communication with automatic token management
- Location: `src/frontend/src/services/http.ts`
- Pattern: `http.get(path)`, `http.post(path, body)`, etc.
- Automatically:
  - Attaches Bearer token from localStorage
  - Refreshes token on 401 (once)
  - Calls global auth failure callback on final 401
- **CRITICAL**: All frontend API calls must go through this client

**JWT Auth Middleware:**
- Purpose: Verify tokens, attach user data to request, handle blocklist
- Location: `src/backend/src/middleware/AuthMiddleware.ts`
- Method: `static verifyToken(req, res, next)`
- Validates:
  - Bearer token format
  - JWT signature (using `AuthService.verifyToken`)
  - Token not in blocklist (DB check via `AuthService.isTokenBlocklisted`)
  - User still exists in DB
- Result: `req.user` contains decoded token data; user object attached

**Zod Schema Validation:**
- Purpose: Type-safe request/form validation
- Frontend: Used in `zodResolver(schema)` for react-hook-form
- Backend: Used in `validateBody(schema)` middleware
- Example: `createEmployeeSchema` ensures required fields, types

## Entry Points

**Backend Server:**
- Location: `src/backend/src/index.ts`
- Triggers: Node.js startup
- Responsibilities:
  - Load environment variables
  - Validate JWT_SECRET
  - Configure CORS (restricted to `ALLOWED_ORIGINS` env var or Vercel)
  - Register all route modules under `/api` prefix
  - Mount Swagger UI at `/api/docs`
  - Listen on PORT (default 3001)

**Frontend Root Page:**
- Location: `src/frontend/src/app/page.tsx`
- Triggers: User navigates to `/`
- Responsibilities:
  - Redirect to `/pages/auth` (login page)

**Frontend Root Layout:**
- Location: `src/frontend/src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities:
  - Set metadata (title, description, icons)
  - Wrap with `ClientLayout` (which loads `AuthProvider`, sidebar, layout shell)

**Authentication Provider:**
- Location: `src/frontend/src/hooks/useAuth.tsx` (exports `AuthProvider`, `useAuth`)
- Triggers: App startup via layout
- Responsibilities:
  - Initialize from localStorage (stored tokens, user data)
  - Provide global `AuthContext` for all components
  - Handle login/logout
  - Register global auth failure callback with HTTP client

## Error Handling

**Strategy:** Consistent error responses with appropriate HTTP status codes. Errors propagate through layers cleanly.

**Backend:**
- Route: `asyncHandler` catches promise rejections
- Controller: Try-catch blocks, return 400/500 with `{ success: false, error: "message" }`
- Service: Throws Error objects with descriptive messages
- Middleware: Returns 401/403 JSON responses for auth failures

**Response Shape:**
- Success: `{ success: true, data: ... }` (status 200/201)
- Error: `{ success: false, error: "message" }` (status 400/401/500)

**Frontend:**
- Services: Throw Error on HTTP error status
- Hooks: Catch errors, set `error` state
- Components: Check `error` state, display user-friendly messages
- Global: `onAuthFailureCallback` redirects to login on 401

## Cross-Cutting Concerns

**Logging:**
- Backend: Query logging via Prisma event handler in `src/backend/src/lib/prisma.ts`
- Frontend: `console.log` for debug info (HTTP base URL, etc.)

**Validation:**
- Backend: Zod schemas applied in `validateBody` middleware
- Frontend: Zod schemas in `react-hook-form` via `zodResolver`

**Authentication:**
- Backend: JWT verification in `AuthMiddleware.verifyToken`
- Frontend: Token storage in localStorage, automatic attachment in HTTP client
- Both: Token blocklist checked on backend before processing request

---

*Architecture analysis: 2026-03-31*
