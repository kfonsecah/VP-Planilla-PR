# Codebase Structure

**Analysis Date:** 2025-05-15

## Directory Layout

```
VP-Planilla/
├── src/
│   ├── backend/        # Node.js/Express Backend
│   │   ├── prisma/     # Prisma schema and migrations
│   │   ├── src/        # Backend source code
│   │   │   ├── config/     # Environment and app config
│   │   │   ├── controller/ # Request handlers
│   │   │   ├── lib/        # Library singletons (Prisma)
│   │   │   ├── middleware/ # Express middlewares
│   │   │   ├── model/      # TS interfaces (Model-like)
│   │   │   ├── routes/     # API route definitions
│   │   │   ├── service/    # Business logic layer
│   │   │   ├── utils/      # Shared utilities (payroll math)
│   │   │   └── index.ts    # API Entry point
│   │   └── package.json
│   ├── frontend/       # Next.js Frontend
│   │   ├── src/        # Frontend source code
│   │   │   ├── app/        # Next.js App Router pages
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── services/   # API client services
│   │   │   ├── schemas/    # Zod validation schemas
│   │   │   ├── utils/      # Frontend utilities
│   │   │   └── types/      # Shared TS types
│   │   └── package.json
│   └── DB/             # SQL scripts and DB initialization
├── docs/               # Project documentation and legal specs
├── .planning/          # GSD planning and mapping documents
└── scripts/            # Automation and validation scripts
```

## Directory Purposes

**src/backend:**
- Purpose: Provides a RESTful API for payroll management.
- Contains: Express.js application, business logic, and database access layer.
- Key files: `src/backend/src/index.ts`, `src/backend/prisma/schema.prisma`.

**src/frontend:**
- Purpose: User interface for the payroll system.
- Contains: Next.js pages, Tailwind CSS styles, and client-side logic.
- Key files: `src/frontend/src/app/layout.tsx`, `src/frontend/src/services/http.ts`.

**src/DB:**
- Purpose: Legacy or reference SQL scripts.
- Contains: `script.sql` for manual database initialization or reference.

**docs:**
- Purpose: Technical and domain-specific documentation.
- Contains: Costa Rica labor law math details, security recommendations, and user guides.
- Key files: `docs/CALCULO_PLANILLA.md`, `docs/GUIA_PLANILLA.md`.

## Key File Locations

**Entry Points:**
- `src/backend/src/index.ts`: Backend API main entry point.
- `src/frontend/src/app/layout.tsx`: Frontend root layout.

**Configuration:**
- `src/backend/src/config/env.ts`: Backend environment variable management.
- `src/frontend/next.config.mjs`: Next.js configuration.
- `src/backend/prisma/schema.prisma`: Database schema definition.

**Core Logic:**
- `src/backend/src/service/`: Contains all business-critical logic.
- `src/backend/src/utils/payrollUtils.ts`: Costa Rica labor law math implementation.
- `src/frontend/src/hooks/`: Contains UI-side business logic.

**Testing:**
- `src/backend/src/__tests__/`: Backend unit and integration tests.
- `src/frontend/src/__tests__/`: Frontend component and unit tests.
- `src/frontend/e2e/`: Playwright end-to-end tests.

## Naming Conventions

**Files:**
- Backend Files/Classes: `PascalCase.ts` (e.g., `EmployeeController.ts`).
- Frontend Components: `PascalCase.tsx` (e.g., `EmployeeTable.tsx`).
- Hooks/Services: `camelCase.ts` (e.g., `useEmployeeList.ts`, `http.ts`).

**Directories:**
- Feature directories (Frontend): `kebab-case` (e.g., `audit-logs`).
- Source subdirectories: `lowercase` (e.g., `service`, `routes`).

## Where to Add New Code

**New API Endpoint:**
1. Define model/type in `src/backend/src/model/` (if new entity).
2. Create service in `src/backend/src/service/`.
3. Create controller in `src/backend/src/controller/`.
4. Register route in `src/backend/src/routes/`.
5. Add route to `src/backend/src/index.ts`.

**New Frontend Feature/Page:**
1. Create directory in `src/frontend/src/app/pages/`.
2. Implement logic in a new hook in `src/frontend/src/hooks/`.
3. Create API wrapper in `src/frontend/src/services/`.
4. Build UI using components in `src/frontend/src/components/`.

**Utilities:**
- Backend: `src/backend/src/utils/`.
- Frontend: `src/frontend/src/utils/`.

## Special Directories

**.planning:**
- Purpose: GSD-specific orchestration and codebase mapping documents.
- Generated: Yes
- Committed: Yes

**prisma/migrations:**
- Purpose: Database schema version history.
- Generated: Yes (via `npx prisma migrate dev`)
- Committed: Yes

---

*Structure analysis: 2025-05-15*
