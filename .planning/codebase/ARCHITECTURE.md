# Architecture

**Analysis Date:** 2025-05-15

## Pattern Overview

**Overall:** N-Tier Layered Architecture with clear separation of concerns between Frontend (Next.js) and Backend (Express/Prisma).

**Key Characteristics:**
- **Layered Backend:** Routes -> Controllers -> Services -> Data Access (Prisma).
- **Hook-Driven Frontend:** Components -> Hooks -> Services -> HTTP Client.
- **Type Safety:** Shared TypeScript interfaces and Zod schemas for end-to-end validation.

## Layers

**Backend Routes:**
- Purpose: Defines API endpoints and applies middleware.
- Location: `src/backend/src/routes/`
- Contains: Express Router definitions, Swagger documentation annotations.
- Depends on: Controllers, Middlewares.
- Used by: Express App entry point.

**Backend Controllers:**
- Purpose: Orchestrates request processing and response formatting.
- Location: `src/backend/src/controller/`
- Contains: Static methods to parse request bodies/params, delegate to services, and handle HTTP responses.
- Depends on: Services, Models/Types.
- Used by: Routes.

**Backend Services:**
- Purpose: Contains all core business logic and database interactions.
- Location: `src/backend/src/service/`
- Contains: Business rules (payroll math, logic), Prisma queries.
- Depends on: Prisma Client (`src/backend/src/lib/prisma.ts`), Models/Types.
- Used by: Controllers.

**Frontend Pages:**
- Purpose: React components representing specific application routes.
- Location: `src/frontend/src/app/`
- Contains: UI layout, composition of components, and hook consumption.
- Depends on: Components, Hooks, Contexts.
- Used by: Next.js App Router.

**Frontend Hooks:**
- Purpose: Encapsulates state management and side effects.
- Location: `src/frontend/src/hooks/`
- Contains: `useEmployeeList`, `usePositions`, etc., managing data fetching and UI state.
- Depends on: Services, Utils, Constants.
- Used by: Pages, Components.

**Frontend Services:**
- Purpose: API client wrappers for backend communication.
- Location: `src/frontend/src/services/`
- Contains: Fetch/Axios calls using a central HTTP client (`http.ts`).
- Depends on: HTTP Client, Types.
- Used by: Hooks.

## Data Flow

**Standard Request Flow:**

1. User interacts with a Component in a Page (Frontend).
2. Page calls a function from a Hook.
3. Hook invokes a Service method.
4. Service uses `http.ts` to send an HTTP request to the Backend.
5. Backend Route receives the request, applies `AuthMiddleware` and `validateBody`.
6. Controller receives the validated request and calls the appropriate Service.
7. Service performs business logic and queries the Database via Prisma.
8. Response flows back through Controller (JSON format) to Frontend.

**State Management:**
- **Server State:** Managed by Hooks with local state and `sessionCache.ts` for caching.
- **Global State:** React Context API used for Auth and Theme.

## Key Abstractions

**Service Singleton:**
- Purpose: Ensures a single point of truth for business logic and DB access.
- Examples: `src/backend/src/service/EmployeeService.ts`, `src/backend/src/service/PayrollService.ts`
- Pattern: Static class methods.

**Prisma Client Singleton:**
- Purpose: Prevents multiple database connection pools.
- Examples: `src/backend/src/lib/prisma.ts`
- Pattern: Singleton exported instance.

**Custom Hooks:**
- Purpose: Reusable UI logic and data synchronization.
- Examples: `src/frontend/src/hooks/useEmployeeList.ts`
- Pattern: React Custom Hook.

## Entry Points

**Backend API:**
- Location: `src/backend/src/index.ts`
- Triggers: Node.js runtime (`npm run dev`).
- Responsibilities: Server initialization, CORS, Helmet, Route registration, Swagger setup.

**Frontend App:**
- Location: `src/frontend/src/app/layout.tsx`
- Triggers: Browser request to root or sub-paths.
- Responsibilities: Root layout, Context providers (Auth, Theme), global styles.

## Error Handling

**Strategy:** Centralized error boundary and consistent response format.

**Patterns:**
- **Backend:** `asyncHandler` wrapper for all route handlers to catch async errors and pass them to a global handler or return 500.
- **Frontend:** Try/Catch blocks within Hooks, displaying errors via `sonner` toasts.

## Cross-Cutting Concerns

**Logging:** Backend uses `console.log` and a dedicated `AuditLogsService` for business-level auditing.
**Validation:** Zod schemas in `src/backend/src/schemas/` and `src/frontend/src/schemas/`.
**Authentication:** JWT-based. Handled by `AuthMiddleware.ts` in backend and `http.ts` interceptors in frontend.

---

*Architecture analysis: 2025-05-15*
