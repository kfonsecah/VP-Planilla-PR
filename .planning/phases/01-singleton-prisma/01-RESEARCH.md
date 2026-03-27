# Phase 1: Singleton Prisma — Research

**Researched:** 2026-03-25
**Domain:** Prisma ORM — singleton pattern, connection pool, TypeScript refactor
**Confidence:** HIGH

---

## Summary

Phase 1 is a pure mechanical refactor with zero ambiguity. The singleton already exists and is correctly implemented at `src/backend/src/lib/prisma.ts`. The problem is that 15 of the 16 service files each declare their own `const prisma = new PrismaClient()` at module load time, while only `NomineeService.ts` already uses the singleton import. The fix in every case is two edits per file: replace the `import { PrismaClient } from "@prisma/client"` line and replace the `const prisma = new PrismaClient()` line with a single `import { prisma } from '../lib/prisma'`.

One file — `UserService.ts` — complicates the import slightly because it imports both `PrismaClient` and `vpg_users` from `@prisma/client`. The `PrismaClient` import can be removed; the `vpg_users` type import must be kept. The `@prisma/client` import line must survive in a modified form (`import { vpg_users } from "@prisma/client"`). This is the only non-trivial case.

After all 15 files are updated, the TypeScript compiler check (`npx tsc --noEmit` from `src/backend/`) is the gate. Because this refactor makes no changes to method signatures, return types, or query logic, it carries near-zero regression risk. No database migrations, no config changes, and no frontend changes are needed.

**Primary recommendation:** Edit all 15 affected service files — two lines per file — then run `npx tsc --noEmit` and the grep verification commands to confirm completeness.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| 1.1 | All files in `src/backend/src/service/` import `prisma` from `../lib/prisma` | Singleton exists and is correct; import path verified |
| 1.2 | Zero instances of `new PrismaClient()` in `/service/` | 15 instances confirmed by grep; all are module-level `const prisma = new PrismaClient()` |
| 1.3 | `npx tsc --noEmit` passes without errors after the change | No type changes involved; compiler check is the exit gate |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@prisma/client` | ^6.14.0 (project) | Prisma generated client — provides all query types | Already in use; singleton wraps it |
| `prisma` (CLI) | ^6.14.0 (project) | Used for `generate` and `migrate` — not relevant this phase | No schema changes this phase |

### The Singleton
| File | Export | Pattern |
|------|--------|---------|
| `src/backend/src/lib/prisma.ts` | `export const prisma` | Global-cached singleton; Next.js-style hot-reload guard (`globalForPrisma`) |

The singleton uses the standard Prisma recommendation for avoiding multiple instances in Node.js development environments:
```typescript
// Source: src/backend/src/lib/prisma.ts (confirmed by Read tool)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This is already correct. No changes to `prisma.ts` are needed.

---

## Complete File Inventory

### Files requiring changes (15 total)

| Service File | Current Import Line | Current Instance Line | Import Path to Singleton |
|---|---|---|---|
| `AuthService.ts` | `import { PrismaClient } from '@prisma/client'` | `const prisma = new PrismaClient()` (line 6) | `import { prisma } from '../lib/prisma'` |
| `AuditLogsService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |
| `BonusesService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |
| `ClockLogsService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |
| `DeductionsService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 5) | `import { prisma } from '../lib/prisma'` |
| `EmployeeDeductions.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |
| `EmployeeService.ts` | `import {PrismaClient} from '@prisma/client'` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |
| `LaborEventsService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 5) | `import { prisma } from '../lib/prisma'` |
| `PaymentReceiptService.ts` | `import { PrismaClient } from '@prisma/client'` | `const prisma = new PrismaClient()` (line 8) | `import { prisma } from '../lib/prisma'` |
| `PayrollService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 5) | `import { prisma } from '../lib/prisma'` |
| `PayrollTypeService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |
| `PositionService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 5) | `import { prisma } from '../lib/prisma'` |
| `ReportsService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 7) | `import { prisma } from '../lib/prisma'` |
| `UserService.ts` | `import { PrismaClient, vpg_users } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 3) | **Special case — see below** |
| `VacationService.ts` | `import { PrismaClient } from "@prisma/client"` | `const prisma = new PrismaClient()` (line 4) | `import { prisma } from '../lib/prisma'` |

### File already using singleton (no change needed)

| Service File | Status |
|---|---|
| `NomineeService.ts` | Already uses `import { prisma } from "../lib/prisma"` — confirmed |

---

## Architecture Patterns

### Standard Replacement Pattern (14 files)

**Before:**
```typescript
import { PrismaClient } from "@prisma/client";
// ... other imports ...
const prisma = new PrismaClient();
```

**After:**
```typescript
import { prisma } from '../lib/prisma';
// ... other imports unchanged ...
// (remove the const prisma = new PrismaClient() line entirely)
```

### Special Case: UserService.ts

`UserService.ts` imports `vpg_users` (a generated Prisma model type) alongside `PrismaClient`. The `PrismaClient` import must be removed but `vpg_users` must be retained.

**Before (line 1):**
```typescript
import { PrismaClient, vpg_users } from "@prisma/client";
```

**After (line 1 split into two):**
```typescript
import { prisma } from '../lib/prisma';
import { vpg_users } from "@prisma/client";
```

Or equivalently:
```typescript
import { vpg_users } from "@prisma/client";
import { prisma } from '../lib/prisma';
```

The `const prisma = new PrismaClient()` declaration on line 3 is then removed as in all other files.

### Import Path Consistency

All service files import using `'../lib/prisma'` (relative from `src/backend/src/service/` to `src/backend/src/lib/prisma.ts`). This is consistent with how `NomineeService.ts` already imports it. Single quotes vs double quotes — project uses both; follow the existing file's quote style when editing to minimize diff noise.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Connection pooling | Custom pool management | Prisma singleton | Prisma manages the pool; multiple `PrismaClient()` instances bypass this |
| Hot-reload guard | Custom global registry | The existing `globalForPrisma` pattern in `lib/prisma.ts` | Already correctly implemented; no changes needed |

**Key insight:** The global-guard pattern (`globalForPrisma.prisma || new PrismaClient()`) prevents multiple instances from spawning during `tsx watch` hot-reloads. The singleton file already handles this correctly — the services just need to use it.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Remove the `const prisma` Declaration

**What goes wrong:** The import is updated to use the singleton, but the old `const prisma = new PrismaClient()` line is left in the file. TypeScript will error: "Cannot redeclare block-scoped variable 'prisma'".
**Why it happens:** The import is added and the old import is removed, but the instantiation line is overlooked.
**How to avoid:** Treat each file as a two-edit operation: (1) replace/remove the import line, (2) delete the `const prisma = new PrismaClient()` line. Never do just one.
**Warning signs:** `tsc --noEmit` error `TS2451: Cannot redeclare block-scoped variable 'prisma'`.

### Pitfall 2: Breaking UserService Type Imports

**What goes wrong:** The entire `import { PrismaClient, vpg_users } from "@prisma/client"` line is deleted rather than surgically removing only `PrismaClient`. This causes TypeScript errors on every usage of `vpg_users` in `UserService.ts`.
**Why it happens:** Bulk search-and-replace of the import line without noticing the bundled type import.
**How to avoid:** For `UserService.ts`, read the existing import line first, keep `vpg_users`, only remove `PrismaClient`.
**Warning signs:** `tsc --noEmit` errors referencing `vpg_users` as unknown type.

### Pitfall 3: Wrong Relative Path to Singleton

**What goes wrong:** Using the wrong number of `../` segments in the import path.
**Why it happens:** Service files are at `src/backend/src/service/`. The singleton is at `src/backend/src/lib/prisma.ts`. The correct relative path from a service file is `../lib/prisma` (one level up to `src/`, then into `lib/`).
**How to avoid:** Verify against `NomineeService.ts` which already has the correct import.
**Warning signs:** `tsc --noEmit` error `Cannot find module '../lib/prisma'`.

### Pitfall 4: Scope Creep into PayrollService's Bad Import

**What goes wrong:** While editing `PayrollService.ts`, the developer also "fixes" the `import { error } from 'console'` issue (a known technical debt item from CONCERNS.md). This is out of scope for Phase 1 and belongs to Phase 2 (requirement 2.6).
**Why it happens:** The bad import is right next to the `PrismaClient` import — easy to conflate.
**How to avoid:** In `PayrollService.ts`, only touch lines 1 and 5. Leave line 3 (`import { error } from "console"`) unchanged.
**Warning signs:** Uncommitted changes to logic paths, unexpected test failures.

---

## Code Examples

### Verified Replacement Pattern

The one file already correctly converted (`NomineeService.ts`) serves as the ground truth:

```typescript
// Source: src/backend/src/service/NomineeService.ts line 3 (confirmed by Read tool)
import { prisma } from "../lib/prisma";
```

No module-level `const prisma = new PrismaClient()` appears anywhere in `NomineeService.ts`.

### Singleton Implementation (for reference — do not modify)

```typescript
// Source: src/backend/src/lib/prisma.ts (confirmed by Read tool)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma;
```

---

## Environment Availability

Step 2.6: No external tool dependencies beyond the project's existing Node.js stack. This phase touches only TypeScript source files. No database connectivity is needed to execute the refactor — only `npx tsc --noEmit` (TypeScript compiler) and `grep` for verification. Both are confirmed available in the project environment.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `cd src/backend && npm test` |
| Full suite command | `cd src/backend && npm test -- --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-1.1 | All service files import from `../lib/prisma` | Grep (shell) | `grep -rL "from '../lib/prisma'\|from \"../lib/prisma\"" src/backend/src/service/` | N/A — grep |
| REQ-1.2 | Zero `new PrismaClient()` in service directory | Grep (shell) | `grep -r "new PrismaClient()" src/backend/src/service/` (expect 0 results) | N/A — grep |
| REQ-1.3 | TypeScript compiles without errors | Type check | `cd src/backend && npx tsc --noEmit` | N/A — compiler |

Note: Requirements 1.1, 1.2, and 1.3 are all verifiable by non-test tooling (grep + tsc). The existing `PayrollService.test.ts` continues to function as a regression guard — if the singleton swap breaks something fundamental in Prisma access, Jest will surface it.

### Sampling Rate

- **Per-file commit:** `cd src/backend && npx tsc --noEmit`
- **After all 15 files:** `grep -r "new PrismaClient()" src/backend/src/service/` (must return 0 results) then `cd src/backend && npm test`
- **Phase gate:** All three verification commands pass before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers phase validation. The phase requires no new test files. The three verification commands (grep x2, tsc) use built-in tooling. The existing `PayrollService.test.ts` provides regression coverage for the most-tested service.

---

## Sources

### Primary (HIGH confidence)
- `src/backend/src/lib/prisma.ts` — Singleton implementation confirmed by direct file read
- `src/backend/src/service/NomineeService.ts` line 3 — Correct singleton usage confirmed by grep
- Grep output across all 16 service files — All 15 offending `new PrismaClient()` instances confirmed with exact line numbers
- `src/backend/jest.config.js` — Test framework confirmed by direct file read
- `.planning/config.json` — `nyquist_validation: true` confirmed by direct file read

### Secondary (MEDIUM confidence)
- `CONCERNS.md` — Confirmed 16-instance count, identified `UserService.ts` dual-import as special case
- `ARCHITECTURE.md` — Service layer ownership of Prisma confirmed

### Tertiary (LOW confidence)
- None required — all findings are from first-party code inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — singleton file read directly, pattern confirmed from existing correct usage
- Architecture: HIGH — all 15 affected files inventoried by grep with line numbers
- Pitfalls: HIGH — derived from direct code inspection, not assumptions
- Special cases: HIGH — UserService dual-import confirmed by reading file

**Research date:** 2026-03-25
**Valid until:** Until any new service file is added to `src/backend/src/service/` (singleton adoption should be enforced at code review time for new files)

---

## RESEARCH COMPLETE
