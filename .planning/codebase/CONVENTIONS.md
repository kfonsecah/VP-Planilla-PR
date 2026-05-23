# Coding Conventions

**Analysis Date:** 2026-05-09

## Naming Patterns

**Files:**
- **Backend:** `PascalCase.ts` for classes and services (e.g., `src/backend/src/service/ClockLogsService.ts`).
- **Frontend Components:** `PascalCase.tsx` (e.g., `src/frontend/src/components/EmployeeCard.tsx`).
- **Hooks:** `camelCase.ts` (e.g., `src/frontend/src/hooks/useClockLogsContext.ts`).
- **Services (Frontend):** `camelCase.ts` (e.g., `src/frontend/src/services/effectiveMarksService.ts`).
- **Routes/Controllers:** `PascalCase` with suffix (e.g., `ClockLogsRoute.ts`, `ClockLogsController.ts`).

**Functions:**
- **Methods/Functions:** `camelCase` (e.g., `calculatePayrollForPeriod`).
- **API Handlers:** Wrapped in `asyncHandler` in backend.

**Variables:**
- **General:** `camelCase` for local variables and properties.
- **DB/Prisma:** `snake_case` with mandatory table prefix (e.g., `clock_logs_employee_id` in `vpg_clock_logs`).

**Types:**
- **Interfaces/Types:** `PascalCase` (e.g., `PayrollPeriod`, `EmployeePayroll`).
- **Enums:** `PascalCase` with `SCREAMING_SNAKE_CASE` values or as defined in Prisma schema.

## Code Style

**Formatting:**
- **Tool used:** Prettier (implicit in standard Next.js/Express setups).
- **Style:** 2-space indentation, semicolons mandatory.

**Linting:**
- **Tool used:** ESLint.
- **Config:** `src/backend/eslint.config.mjs` and `src/frontend/eslint.config.mjs`.
- **Key rules:** 
  - `sonarjs/recommended` for both layers.
  - `cognitive-complexity` capped at 15.
  - `@typescript-eslint/no-explicit-any` is a warning (disabled in tests).

## Import Organization

**Order:**
1. React/Next.js core imports.
2. External dependencies (npm packages).
3. Project internal aliases (`@/...`).
4. Relative imports (discouraged in frontend, allowed in backend).

**Path Aliases:**
- `@/` used in frontend for all source paths (e.g., `@/components/EmployeeCard`).

## Error Handling

**Patterns:**
- **Backend:** Uses `asyncHandler.ts` utility. Responses follow `{ success: true, data: ... }` or `{ success: false, error: "..." }`.
- **Frontend:** Centralized in `src/frontend/src/services/http.ts` using the `ApiError` class. Standardized error parsing for Zod and server-side errors.

## Logging

**Framework:** `console` for debugging and basic audit trail in services.

**Patterns:**
- `console.log` for lifecycle events (e.g., `[Payroll] Employee X deductions loaded`).
- `console.error` for caught exceptions.

## Comments

**When to Comment:**
- Business logic complexity requires explanation.
- Multi-step algorithms (e.g., `NomineeService.ts`).

**JSDoc/TSDoc:**
- Mandatory for public methods in backend services (e.g., `src/backend/src/service/ClockLogsService.ts`).
- Includes `@param`, `@returns`, and `@throws`.

## Function Design

**Size:** Large services are broken down into private helper methods (e.g., `processDailyWork` in `NomineeService.ts`).

**Parameters:** Prefer object destructuring for functions with more than 3 parameters to improve readability.

**Return Values:** Services return DTO-like objects or typed interfaces.

## Module Design

**Exports:** Named exports are standard for classes and types.

**Barrel Files:** Not extensively used; direct imports from specific files are preferred.

---

*Convention analysis: 2026-05-09*
