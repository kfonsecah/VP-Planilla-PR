# VP-Planilla — Gemini CLI Operating Manual

Full-stack payroll management system for Costa Rica labor law compliance.

- **Backend API**: `src/backend/` (Express 5 + TypeScript + Prisma + PostgreSQL)
- **Frontend**: `src/frontend/` (Next.js 15 + React 19 + TypeScript + Tailwind 4)
- **DB schema**: `src/backend/prisma/schema.prisma`
- **Java clock-log parser**: `src/Java/` (standalone utility)

> ⚠️ **LECTURA OBLIGATORIA ANTES DE CUALQUIER ACCIÓN:**
> Leer `PHASE_CONTRACT.md` en la raíz del proyecto. Contiene las reglas de ejecución
> estrictas para todos los agentes: gates de fase, reglas de nombrado, arquitectura,
> protocolo de bloqueo y lista de prohibiciones. No inferir, no improvisar.

---


## Stack & Versions

| Layer | Tech | Version |
|---|---|---|
| Runtime | Node.js | 22.14.0 |
| Backend TS | TypeScript | 5.8.3 |
| Frontend TS | TypeScript | 5.9.3 |
| API | Express | 5.1.0 |
| Frontend | Next.js | 15.5.6 |
| UI | React | 19.0.0 |
| ORM | Prisma | ^6.14.0 |
| CSS | Tailwind CSS | ^4 |
| Testing | Jest + ts-jest | ^29.7.0 |

---

## Core Commands

### Backend (from `src/backend/`)
- `npm run dev`: Dev server on port 3001 (tsx watch)
- `npm test`: Run Jest unit tests
- `npx tsc --noEmit`: Type check

### Frontend (from `src/frontend/`)
- `npm run dev`: Next.js dev server (Turbopack)
- `npx tsc --noEmit`: Type check
- `npx next lint`: ESLint check

---

## Architecture & Layers

### Backend (`src/backend/src/`)
- **Routes** (`routes/`): Express Router + `asyncHandler` + `AuthMiddleware`.
- **Controllers** (`controller/`): Request parsing, field mapping, service delegation.
- **Services** (`service/`): **All business logic** and Prisma queries.
- **Models** (`model/`): Plain TS interfaces only.
- **Utils** (`utils/`): Pure functions (payroll math, `asyncHandler`).

### Frontend (`src/frontend/src/`)
- **Pages** (`app/pages/`): `"use client"` components consuming hooks.
- **Hooks** (`hooks/`): Data fetching, state management, actions.
- **Services** (`services/`): API wrappers using `http.ts`.
- **HTTP Client** (`services/http.ts`): **Central client — NEVER bypass.**
- **Schemas** (`schemas/`): Zod validation.

---

## Coding Standards

### General
- **Language**: Logic comments in Spanish; infrastructure/code in English.
- **Naming**:
    - Backend Files/Classes: `PascalCase.ts` (static methods only).
    - Frontend Components: `PascalCase.tsx`.
    - Hooks/Services: `camelCase`.
    - DB/Domain Fields: `snake_case`.
    - Constants: `SCREAMING_SNAKE_CASE`.

### Backend Rules
- **Prisma**: Always use singleton `import { prisma } from '../lib/prisma'`. **NEVER `new PrismaClient()`**.
- **Methods**: static only; order: `create` → `getAll` → `getById` → `update` → `delete`.
- **JSDoc**: Mandatory `@param`, `@returns`, `@throws` for public methods.
- **Responses**: `{ success: true, data: ... }` or `{ success: false, error: "message" }`.

### Frontend Rules
- **Imports**: Always use `@/` path alias.
- **Forms**: Always `react-hook-form` + `zodResolver`. No raw `useState` for forms.
- **API**: Always through `http.ts` methods. No raw `fetch`.
- **Hooks**: Return shape `{ data, isLoading, error, ...actions }`. Wrapped in `useCallback`.

---

## Critical Files (Handle with Care)

- `src/backend/src/utils/payrollUtils.ts`: Costa Rica labor law math.
- `src/backend/prisma/schema.prisma`: Requires migrations; do not edit without generating one.
- `src/frontend/src/services/http.ts`: Central API + Auth logic.
- `src/backend/src/utils/asyncHandler.ts`: Global error boundary.
- `src/backend/src/middleware/AuthMiddleware.ts`: JWT security.

---

## Domain Context: Costa Rica Labor Law
- **Work Week**: Mon–Sat (Sun = Rest).
- **Regular**: 8h/day.
- **Overtime**: 1.5× (up to 10h), 2× (above 10h).
- **Rest Compensation**: 0.5× daily rate for worked rest days.
- **Mandatory**: CCSS deductions, Hacienda formats.

---

## GSD Workflow Integration
Use `/gsd` sub-agents for all operations:
- **Bugs**: Use `gsd-debugger` for systematic investigation.
- **Small Fixes**: Use `gsd-executor` for direct changes.
- **Features**: Use `gsd-planner` → `gsd-executor` for full lifecycle.
- **Verification**: Always run `npx tsc --noEmit` and `npm test` after changes.
