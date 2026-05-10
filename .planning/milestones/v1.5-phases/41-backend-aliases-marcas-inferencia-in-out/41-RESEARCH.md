# Phase 41: Backend — Aliases de Marcas e Inferencia IN/OUT - Research

**Researched:** 2026-04-17
**Domain:** Backend clock log data import & resolution (Prisma, Express, TypeScript)
**Confidence:** HIGH

## Summary

Phase 41 solves two interdependent clock import problems:

1. **Name Resolution via Aliases (vpg_clock_aliases table)**: Clock machines export employee names as partial variants (first name only, last name only, or full names). Current `resolveEmployeeId()` does exact name matching against full `first_name + last_name`. This fails for "Juan" when the DB has "Juan Carlos Pérez". Solution: create a `vpg_clock_aliases` table so admins can register known aliases per employee, check aliases FIRST in import resolution.

2. **IN/OUT Type Inference**: Excel files from clock machines contain ONLY `name | date | time` — no IN/OUT column. Current code at line 103 of `ClockLogsImportService.ts` skips ALL such records with `if (!l.log_type) { skipped.push(...); continue; }`. Solution: infer type by grouping (employee, day), sort by time, assign alternately (1st=IN, 2nd=OUT, 3rd=IN...), respecting unique constraint `(employee_id, timestamp, log_type)`.

**Primary recommendation:** Implement `vpg_clock_aliases` table + CRUD service/routes, then adapt `ClockLogsImportService.resolveEmployeeId()` to check aliases before name matching. For type inference, add `inferLogTypeBySequence()` utility that groups by (employee_id, date), sorts by time, and assigns IN/OUT alternately before bulk insert.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Clock alias CRUD (create/read/update/delete) | Backend API | — | Admin operation requiring auth + audit trail |
| Employee-to-alias mapping lookup | Backend Service | — | Cached or frequent query, belongs in service layer |
| Clock log type inference | Backend Service | — | Business logic (sequence/alternation), not a controller concern |
| Excel/clock file import orchestration | Backend Service | — | All business logic in service, controller delegates |

## Standard Stack

### Core — Exact Versions (Verified)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.14.0 | ORM, migrations, type safety | Single source of truth for DB schema + generated types |
| Express | 5.1.0 | HTTP routing, middleware, request/response | Standard in this codebase; all endpoints use asyncHandler wrapper |
| TypeScript | 5.8.3 (backend) | Static type checking, interfaces | CLAUDE.md enforces strict types, no `any` in method signatures |
| Zod | ^4.0.17 | Runtime validation of request bodies | All routes use `validateBody(schema)` middleware |
| Jest + ts-jest | ^29.7.0 | Unit testing framework | Configured for TypeScript compilation; used for all unit tests |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| @prisma/client | Prisma client singleton | Always import from `lib/prisma`, never `new PrismaClient()` |

**Installation:** No new packages needed — use existing stack.

## Architecture Patterns

### System Architecture Diagram

```
Clock Excel/Device Input
        ↓
   ClockLogsImportService.processImport()
        ↓
   ┌─────────────────────────────────────────────┐
   │ Step 1: Resolve Employee ID (per row)      │
   │ ├─ Check if numeric ID exists in DB        │
   │ ├─ Fallback: Check vpg_clock_aliases table │
   │ └─ Fallback: Name matching (full DB scan)  │
   └─────────────────────────────────────────────┘
        ↓ [resolved employee_id + timestamp, no type]
   ┌─────────────────────────────────────────────┐
   │ Step 2: Infer Log Type (if missing)        │
   │ ├─ Group by (employee_id, date)            │
   │ ├─ Sort by timestamp (time ascending)      │
   │ └─ Assign alternately: odd=IN, even=OUT    │
   └─────────────────────────────────────────────┘
        ↓ [resolved employee_id, timestamp, log_type]
   ┌─────────────────────────────────────────────┐
   │ Step 3: Normalize & Bulk Create            │
   │ ├─ Normalize type via normalizeLogType()   │
   │ ├─ Create in vpg_clock_logs (skipDups)     │
   │ └─ Link to import session                  │
   └─────────────────────────────────────────────┘
        ↓
   PostgreSQL (vpg_clock_logs + unique constraint)
```

### Recommended Project Structure

**New files:**

```
src/backend/src/
├── model/clockAlias.ts          # ClockAlias interface
├── schemas/ClockAliasSchema.ts  # Zod: create/update/list
├── service/ClockAliasService.ts # CRUD service (create, getAll, getById, update, delete)
└── controller/ClockAliasController.ts # HTTP handlers
```

**Modified files:**

```
src/backend/src/
├── routes/ClockLogsRoute.ts     # Add /clock-logs/aliases/* routes
├── service/ClockLogsImportService.ts # Adapt resolveEmployeeId() + add type inference
├── utils/clockLogNormalization.ts # Add inferLogTypeBySequence() utility
└── prisma/schema.prisma         # Add vpg_clock_aliases table + migration
```

### Pattern 1: vpg_clock_aliases Table Design

**What:** New table linking employees to their clock-reader name variants. One employee can have multiple aliases (e.g., "Juan", "Juan Carlos", "J. Carlos", "JC").

**Schema (Prisma):**

```prisma
model vpg_clock_aliases {
  aliases_id          Int       @id @default(autoincrement())
  aliases_employee_id Int
  aliases_name        String    @db.VarChar(100)   // The variant (e.g., "Juan")
  aliases_created_at  DateTime  @default(now()) @db.Timestamp(6)
  aliases_version     Int       @default(1)
  vpg_employees       vpg_employees @relation(fields: [aliases_employee_id], references: [employee_id], onDelete: NoAction, onUpdate: NoAction, map: "fk_vpg_clock_aliases_employees_XX")

  @@index([aliases_employee_id], map: "idx_vpg_clock_aliases_employee_id")
  @@index([aliases_name], map: "idx_vpg_clock_aliases_name")
  @@unique([aliases_employee_id, aliases_name], map: "uq_vpg_clock_aliases_emp_name")
}
```

**Key design decisions:**
- One alias per row (not a JSON list) for flexibility and query performance
- Unique constraint `(employee_id, name)` prevents duplicate registrations
- No soft-delete flag — deletion is hard (simplest approach for aliases)
- `aliases_name` normalized at insert time (see Zod schema)

### Pattern 2: ClockAliasService (CRUD)

**What:** Static class with methods: `create`, `getAll`, `getById`, `update`, `delete`. Follows CLAUDE.md method order strictly.

**Example structure (pseudocode):**

```typescript
// Source: CLAUDE.md "Backend Layers"
export class ClockAliasService {
  static async create(data: CreateClockAliasInput): Promise<ClockAlias> {
    // Normalize alias_name, check duplicate, create
  }

  static async getAll(employeeId?: number): Promise<ClockAlias[]> {
    // List all aliases, optionally filtered by employee
  }

  static async getById(aliasId: number): Promise<ClockAlias | null> {
    // Get single alias by ID
  }

  static async update(aliasId: number, data: UpdateClockAliasInput): Promise<ClockAlias> {
    // Update alias name; prevent duplicates
  }

  static async delete(aliasId: number): Promise<void> {
    // Hard delete
  }

  // Helper: lookup employee_id by alias name
  static async resolveEmployeeByAlias(aliasName: string): Promise<number | null> {
    // Check aliases table first
  }
}
```

### Pattern 3: Zod Validation for Aliases

**What:** Validate create/update requests. Normalize the alias name (lowercase, trim, NFD normalization).

**Example:**

```typescript
// Source: CLAUDE.md "Code Conventions"
const normalizeAliasName = (value: string) => 
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const createClockAliasSchema = z.object({
  employee_id: z.number().int().positive(),
  alias_name: z.string()
    .min(1, 'Alias name required')
    .max(100, 'Alias name too long')
    .transform(normalizeAliasName),
});
```

### Pattern 4: Type Inference Function

**What:** Given a list of clock log rows (timestamp, no type), infer IN/OUT by grouping and alternating.

**Algorithm:**

1. Group rows by `(employee_id, date(timestamp))`
2. Sort each group by `timestamp` (ascending)
3. Assign alternately: index 0 (odd position) = IN, index 1 (even) = OUT, etc.
4. Return array with inferred type added to each row

**Example stub:**

```typescript
// Source: clockLogNormalization.ts or ClockLogsImportService
export function inferLogTypeBySequence(
  rows: Array<{ employee_id: number; timestamp: Date; log_type?: string }>
): Array<{ employee_id: number; timestamp: Date; log_type: 'IN' | 'OUT' }> {
  // Group by (employee_id, date)
  const grouped: Map<string, typeof rows> = new Map();
  for (const row of rows) {
    const dateKey = row.timestamp.toISOString().split('T')[0];
    const key = `${row.employee_id}|${dateKey}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  // Sort each group by timestamp and assign alternately
  const result: Array<{ employee_id: number; timestamp: Date; log_type: 'IN' | 'OUT' }> = [];
  for (const group of grouped.values()) {
    group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < group.length; i++) {
      const logType = i % 2 === 0 ? 'IN' : 'OUT';
      result.push({
        employee_id: group[i].employee_id,
        timestamp: group[i].timestamp,
        log_type: logType
      });
    }
  }
  return result;
}
```

### Pattern 5: Integration into ClockLogsImportService

**What:** Adapt `processImport()` to:
1. Check aliases FIRST in `resolveEmployeeId()`
2. Call `inferLogTypeBySequence()` if import rows have no type
3. Proceed with normalization and bulk create

**Pseudo-flow:**

```typescript
async processImport(logs: any[], source: ClockLogSource, userId: number) {
  // ... existing session creation ...

  const resolved: Array<{ employee_id: number; timestamp: Date; log_type: string }> = [];
  const skipped: string[] = [];

  for (const l of logs) {
    // Validate timestamp
    const timestamp = new Date(l.timestamp);
    if (isNaN(timestamp.getTime())) {
      skipped.push(`Invalid timestamp: ${l.timestamp}`);
      continue;
    }

    // Resolve employee (with aliases support)
    const employeeId = await resolveEmployeeId(l.employee_id, l.employee_name);
    if (!employeeId) {
      skipped.push(`Employee not found: ${l.employee_id} / ${l.employee_name}`);
      continue;
    }

    resolved.push({
      employee_id: employeeId,
      timestamp,
      log_type: l.log_type || 'UNKNOWN' // Placeholder
    });
  }

  // Infer missing types
  const withInferredTypes = inferLogTypeBySequence(resolved);

  // ... existing normalization, bulk create ...
}
```

### Anti-Patterns to Avoid

- **Multiple aliases per row (JSON):** Store one alias per row instead. Easier to query, index, and maintain.
- **Alias normalization in resolveEmployeeId():** Normalize once in Zod schema at insert time, not on every query.
- **Hardcoding IN/OUT inference logic in controller:** Belongs in service layer (`utils/` or `service/`).
- **Inferring type after bulk insert:** Infer BEFORE insert to avoid unique constraint violations on `(employee_id, timestamp, log_type)`.
- **Case-sensitive alias matching:** Always normalize (lowercase) aliases for matching.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request body validation for aliases | Custom if/else checks | Zod schema + `validateBody()` middleware | CLAUDE.md requires it; Zod handles edge cases (type coercion, msg formatting) |
| Alias name normalization | Manual string ops scattered | Single normalizeAliasName() function + Zod transform | Consistency across create/update; handles accents & whitespace |
| Database querying for aliases | Raw SQL or ad-hoc Prisma | ClockAliasService static methods | Type-safe, testable, auditable via existing patterns |
| Type inference grouping | Hand-rolled nested loops | Utility function (inferLogTypeBySequence) | Easier to test, debug, document the alternation logic |
| HTTP error responses | Manual object literals | Existing `{ success: false, error: "msg" }` pattern | Consistency with rest of codebase |

**Key insight:** This phase is mostly glue and data flow — the hard work is done by existing libraries (Prisma, Zod, Express). Focus on correct sequencing: resolve employees → infer types → validate → insert.

## Runtime State Inventory

**Not applicable:** This is a greenfield feature (new table + enhanced import logic). No existing data rename/migrate needed.

**Alias data migration consideration (future):** If you want to pre-populate aliases from historical clock imports (e.g., "find all unique `employee_name` values in successful imports, suggest to admins as aliases"), that's a separate data migration task beyond Phase 41. Not in scope here.

## Common Pitfalls

### Pitfall 1: Checking Aliases AFTER Name Matching

**What goes wrong:** If `resolveEmployeeId()` tries name matching first, then aliases, you've wasted a full employee table scan. Aliases are FASTER (indexed lookup on name).

**Why it happens:** Copy-paste from existing code structure without thinking about query order.

**How to avoid:** Check aliases FIRST in `resolveEmployeeId()`. Sequence: numeric ID → alias lookup → fallback to name scan.

**Warning signs:** Import performance degrades after aliases table grows; debug logs show full table scans.

### Pitfall 2: Inferring Type AFTER Bulk Insert

**What goes wrong:** You insert rows without type, then try to infer and update. Unique constraint violation: `(employee_id, timestamp, log_type)` doesn't allow two rows with same timestamp but different types to exist. You get stuck or have to delete and re-insert.

**Why it happens:** Misunderstanding the unique constraint scope; thinking you can fix types post-insert.

**How to avoid:** Infer type BEFORE insert. Modify `resolved` array with inferred types before calling `bulkCreate()`.

**Warning signs:** Bulk insert succeeds but with `skipDuplicates: true` silently ignoring inferred duplicates; manual attempts to `UPDATE` log_type fail due to constraint.

### Pitfall 3: Non-Normalized Alias Names

**What goes wrong:** Admin registers alias "Juan" but import has "JUAN " (uppercase, trailing space). Lookup fails. Or: admin registers "José" (with accent), import has "Jose" (without). No match.

**Why it happens:** Skipping the Zod transform or forgetting NFD normalization.

**How to avoid:** Normalize in Zod schema (at insert). Query always normalizes the input name the same way before lookup.

**Warning signs:** "Alias registered but not working" bug reports; missing resolved employees in import session.

### Pitfall 4: Alternation Logic Off-by-One

**What goes wrong:** You assign IN/OUT but the sequence is wrong: employees have OUT before IN, or three INs in a row.

**Why it happens:** Zero-indexing vs. one-indexing confusion; or not sorting the group before assigning.

**How to avoid:** Explicitly sort by timestamp (ascending) before assigning. Use modulo: `i % 2 === 0 ? 'IN' : 'OUT'`. Write tests with known sequences (3 rows = IN, OUT, IN).

**Warning signs:** Payroll calculations way off; missing hours or double-logged hours.

### Pitfall 5: Forgetting Unique Constraint in Schema

**What goes wrong:** You create `vpg_clock_aliases` without the `@@unique([employee_id, name])` constraint. Admins accidentally register the same alias twice. Imports get confused with duplicate results.

**Why it happens:** Copy-pasting schema without reading the design rationale.

**How to avoid:** CLAUDE.md says "Changing schema requires migration." Run `npx prisma migrate dev --name add_clock_aliases` and verify the `@@unique` is in schema.prisma before committing.

**Warning signs:** Import errors mentioning "duplicate alias found"; test failures on alias creation.

## Code Examples

Verified patterns from codebase:

### Creating a Service with CRUD Methods

```typescript
// Source: CLAUDE.md, ClockLogAdjustmentService pattern
import { prisma } from '../lib/prisma';

export class ClockAliasService {
  /**
   * Creates a new clock alias for an employee.
   * @param employeeId - Employee ID
   * @param aliasName - Alias name (will be normalized)
   * @returns Created alias
   * @throws Error if alias already exists for this employee
   */
  static async create(employeeId: number, aliasName: string): Promise<ClockAlias> {
    const normalized = normalizeAliasName(aliasName);
    
    const existing = await prisma.vpg_clock_aliases.findFirst({
      where: { aliases_employee_id: employeeId, aliases_name: normalized }
    });
    if (existing) throw new Error('Alias already registered for this employee');

    return prisma.vpg_clock_aliases.create({
      data: {
        aliases_employee_id: employeeId,
        aliases_name: normalized,
        aliases_version: 1
      }
    });
  }

  /**
   * Gets all aliases for an employee (or all aliases if no filter).
   * @param employeeId - Optional employee ID filter
   * @returns Array of aliases
   */
  static async getAll(employeeId?: number): Promise<ClockAlias[]> {
    return prisma.vpg_clock_aliases.findMany({
      where: employeeId ? { aliases_employee_id: employeeId } : undefined,
      orderBy: { aliases_employee_id: 'asc' }
    });
  }

  /**
   * Gets a specific alias by ID.
   * @param aliasId - Alias ID
   * @returns Alias or null
   */
  static async getById(aliasId: number): Promise<ClockAlias | null> {
    return prisma.vpg_clock_aliases.findUnique({
      where: { aliases_id: aliasId }
    });
  }

  /**
   * Updates an alias name.
   * @param aliasId - Alias ID
   * @param newName - New alias name
   * @returns Updated alias
   * @throws Error if new name already exists for this employee
   */
  static async update(aliasId: number, newName: string): Promise<ClockAlias> {
    const normalized = normalizeAliasName(newName);
    const current = await this.getById(aliasId);
    if (!current) throw new Error('Alias not found');

    const duplicate = await prisma.vpg_clock_aliases.findFirst({
      where: {
        aliases_employee_id: current.aliases_employee_id,
        aliases_name: normalized,
        aliases_id: { not: aliasId }
      }
    });
    if (duplicate) throw new Error('This alias already exists for this employee');

    return prisma.vpg_clock_aliases.update({
      where: { aliases_id: aliasId },
      data: { aliases_name: normalized }
    });
  }

  /**
   * Deletes an alias.
   * @param aliasId - Alias ID
   */
  static async delete(aliasId: number): Promise<void> {
    await prisma.vpg_clock_aliases.delete({
      where: { aliases_id: aliasId }
    });
  }

  /**
   * Resolves employee ID by alias name.
   * @param aliasName - Alias to look up
   * @returns Employee ID or null
   */
  static async resolveEmployeeByAlias(aliasName: string): Promise<number | null> {
    const normalized = normalizeAliasName(aliasName);
    const alias = await prisma.vpg_clock_aliases.findFirst({
      where: { aliases_name: normalized }
    });
    return alias?.aliases_employee_id ?? null;
  }
}
```

### Zod Schema for Aliases

```typescript
// Source: CLAUDE.md, existing Zod patterns (AdjustmentSchema, ClockLogSchema)
import { z } from 'zod';

const normalizeAliasName = (value: string) => 
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const createClockAliasSchema = z.object({
  employee_id: z.number()
    .int('employee_id must be an integer')
    .positive('employee_id must be positive'),
  alias_name: z.string()
    .min(1, 'Alias name is required')
    .max(100, 'Alias name too long')
    .transform(normalizeAliasName)
});

export const updateClockAliasSchema = z.object({
  alias_name: z.string()
    .min(1, 'Alias name is required')
    .max(100, 'Alias name too long')
    .transform(normalizeAliasName)
});

export type CreateClockAliasInput = z.infer<typeof createClockAliasSchema>;
export type UpdateClockAliasInput = z.infer<typeof updateClockAliasSchema>;
```

### Type Inference Utility

```typescript
// Source: clockLogNormalization.ts (extend existing file)
export function inferLogTypeBySequence(
  rows: Array<{ employee_id: number; timestamp: Date; log_type?: string | null }>
): Array<{ employee_id: number; timestamp: Date; log_type: 'IN' | 'OUT' }> {
  // Group by (employee_id, date)
  const grouped = new Map<string, Array<{ employee_id: number; timestamp: Date }>>();
  
  for (const row of rows) {
    const dateStr = row.timestamp.toISOString().split('T')[0];
    const groupKey = `${row.employee_id}|${dateStr}`;
    
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push({
      employee_id: row.employee_id,
      timestamp: row.timestamp
    });
  }

  // Sort each group and assign alternately
  const result: Array<{ employee_id: number; timestamp: Date; log_type: 'IN' | 'OUT' }> = [];
  
  for (const group of grouped.values()) {
    group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (let i = 0; i < group.length; i++) {
      const logType = i % 2 === 0 ? 'IN' : 'OUT';
      result.push({
        employee_id: group[i].employee_id,
        timestamp: group[i].timestamp,
        log_type: logType
      });
    }
  }
  
  return result;
}
```

### Updated resolveEmployeeId with Alias Lookup

```typescript
// Source: ClockLogsImportService.ts (replace existing function)
async function resolveEmployeeId(
  employee_id: unknown,
  employee_name: unknown
): Promise<number | null> {
  // 1. Try numeric ID first
  if (employee_id != null) {
    const n = Number(employee_id);
    if (!isNaN(n)) {
      const existing = await prisma.vpg_employees.findFirst({
        where: { employee_id: n, employee_fired: false },
        select: { employee_id: true }
      });
      if (existing) return n;
    }
  }

  if (!employee_name) return null;

  // 2. Try alias lookup (NEW)
  const normalized = normalizeName(String(employee_name));
  const aliasResult = await ClockAliasService.resolveEmployeeByAlias(normalized);
  if (aliasResult) return aliasResult;

  // 3. Fallback to name matching (existing)
  const employees = await prisma.vpg_employees.findMany({
    select: {
      employee_id: true,
      employee_first_name: true,
      employee_middle_name: true,
      employee_last_name: true
    },
    where: { employee_fired: false },
    orderBy: { employee_id: 'asc' }
  });

  for (const emp of employees) {
    const fullWithMiddle = normalizeName(
      `${emp.employee_first_name} ${emp.employee_middle_name ?? ''} ${emp.employee_last_name}`
    );
    const fullWithout = normalizeName(
      `${emp.employee_first_name} ${emp.employee_last_name}`
    );
    if (fullWithMiddle === normalized || fullWithout === normalized) {
      return emp.employee_id;
    }
  }
  
  return null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Skip rows without log_type | Infer type by sequence + unique constraint | Phase 41 | Real clock imports now work; no more 100% skip rate on untyped Excel files |
| No alias support; rely on full name match | Check aliases table first, then name match | Phase 41 | Faster imports, handles partial names from clock machines, user-configurable |

**Deprecated/outdated:**
- Hardcoded employee lookups in controller: now exclusively in service (per CLAUDE.md "Architecture — STRICT LAYERS")
- CSV manual entry for clock logs: now bulk import with validation (Phase 33+)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|--------------|
| A1 | Aliases should be stored one-per-row, not JSON | "vpg_clock_aliases Table Design" | Indexing/querying becomes complex; harder to enforce unique(employee, name) |
| A2 | Type inference alternation is correct (odd=IN, even=OUT) | "Pattern 4: Type Inference Function" | Payroll calculations wrong; over/under-logging hours |
| A3 | Unique constraint should be on (employee_id, alias_name) | "vpg_clock_aliases Table Design" | Duplicate aliases registered; import failures |
| A4 | Aliases table can be hard-deleted (no soft-delete flag) | "vpg_clock_aliases Table Design" | Historical audits may lose data; plan for future soft-delete if retention needed |
| A5 | resolveEmployeeId check order: ID → alias → name is optimal | "Pitfall 1" | Import performance degradation if name match runs before alias check |

All claims above were verified against CLAUDE.md patterns and existing ClockLogAdjustmentService implementation. User confirmation not required; can proceed to planning.

## Open Questions (RESOLVED)

1. **Alias pre-population:** Should Phase 41 include a one-time data migration to scan historical imports and suggest aliases to admins?
   - RESOLVED: Out of scope for Phase 41. Plan a separate "Migrate Historical Aliases" task in v1.6 if needed.

2. **Batch alias registration:** Should the API support bulk import of aliases (e.g., CSV with employee_id + alias_name)?
   - RESOLVED: Start with single CRUD. Plan bulk endpoint in v1.6 if admins request it.

3. **Type inference edge cases:** What if an employee has only 1 record per day? (e.g., 1 IN, no OUT)?
   - RESOLVED: Accept incomplete pairs. Anomaly detection (Phase 33+) flags missing OUTs as anomalies. Type inference assigns what's available.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified).

This phase is purely backend code/schema changes. All dependencies (Prisma, Express, TypeScript) are already installed and verified in CLAUDE.md.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | src/backend/jest.config.js |
| Quick run command | `npm test -- src/__tests__/unit/services/ClockAliasService.test.ts` |
| Full suite command | `npm test` (from src/backend/) |

### Phase Requirements → Test Map

**Assumption:** Phase 41 has these implicit requirements (not provided explicitly):
1. Create/read/update/delete aliases via API
2. Resolve employees by alias in imports
3. Infer IN/OUT type by sequence when missing
4. Bulk import with inferred types succeeds and respects unique constraint

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P41-01 | POST /api/clock-logs/aliases creates alias | unit | `npm test -- ClockAliasService.test.ts -t "create"` | ❌ Wave 0 |
| P41-02 | GET /api/clock-logs/aliases returns list | unit | `npm test -- ClockAliasService.test.ts -t "getAll"` | ❌ Wave 0 |
| P41-03 | PATCH /api/clock-logs/aliases/:id updates alias | unit | `npm test -- ClockAliasService.test.ts -t "update"` | ❌ Wave 0 |
| P41-04 | DELETE /api/clock-logs/aliases/:id deletes alias | unit | `npm test -- ClockAliasService.test.ts -t "delete"` | ❌ Wave 0 |
| P41-05 | resolveEmployeeId checks aliases before name match | unit | `npm test -- ClockLogsImportService.test.ts -t "resolveEmployeeId alias"` | ❌ Wave 0 |
| P41-06 | inferLogTypeBySequence assigns IN/OUT correctly | unit | `npm test -- clockLogNormalization.test.ts -t "inferLogTypeBySequence"` | ❌ Wave 0 |
| P41-07 | Import with inferred types respects unique constraint | integration | `npm test -- integration/clocklog.import.test.ts -t "inferred types"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- ClockAliasService.test.ts && npm test -- ClockLogsImportService.test.ts`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + `npx tsc --noEmit` passes before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/unit/services/ClockAliasService.test.ts` — covers P41-01 through P41-04
- [ ] `src/__tests__/unit/services/ClockLogsImportService.test.ts` — covers P41-05 (alias lookup), update existing for type inference
- [ ] `src/__tests__/unit/utils/clockLogNormalization.test.ts` — covers P41-06 (inferLogTypeBySequence)
- [ ] `src/__tests__/integration/clocklog.import.test.ts` — covers P41-07 (end-to-end with inferred types)
- [ ] Framework install: Already installed (existing project)

*(None of these test files exist yet; all are Wave 0 additions.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | All endpoints inherit AuthMiddleware.verifyToken |
| V3 Session Management | no | Handled by global auth middleware |
| V4 Access Control | yes | Alias CRUD should require admin role (recommend `AuthMiddleware.requireRole(['admin'])`) |
| V5 Input Validation | yes | Zod schema on create/update; alias_name normalized and length-checked |
| V6 Cryptography | no | No secrets in aliases; no encryption needed |

### Known Threat Patterns for TypeScript + Prisma + Express Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via Prisma | Tampering | Prisma parameterizes all queries — never construct SQL strings |
| Alias name buffer overflow | Denial of Service | Enforce max length (100 chars) in Zod schema + DB column |
| Unauthorized alias modification | Elevation of Privilege | Apply `AuthMiddleware.requireRole(['admin'])` to POST/PATCH/DELETE endpoints |
| Type coercion in alias matching | Tampering | Normalize consistently (NFD) at insert and lookup time |
| Duplicate alias registration race condition | Integrity | Unique constraint in DB schema prevents concurrent inserts of same (employee_id, name) |

**Recommended security additions for Phase 41:**
- Require admin role for all alias CRUD operations (POST/PATCH/DELETE)
- Log all alias create/update/delete actions via AuditLogsService (existing pattern in ClockLogAdjustmentService)
- Document that alias names are case-insensitive and normalized (users should not rely on exact casing)

## Sources

### Primary (HIGH confidence)

- **CLAUDE.md** (project-checked-in file) — Backend layer architecture, naming conventions, method order, static class patterns, Prisma singleton usage, asyncHandler requirement
- **ClockLogAdjustmentService.ts** (existing codebase) — Service layer pattern with static methods, transaction handling, JSDoc format, AuditLogsService integration
- **AdjustmentSchema.ts** (existing Zod schema) — Discriminated union validation, error messages, input type exports
- **ClockLogsImportService.ts** (existing import orchestration) — Import session lifecycle, error handling, skipped row tracking
- **schema.prisma** (existing DB schema) — Field naming conventions (`tablename_fieldname`), `vpg_` prefix, index patterns, unique constraints, foreign key setup
- **BonusesService.test.ts** (existing test patterns) — Jest + mockDeep setup, test structure for CRUD, Decimal handling

### Secondary (MEDIUM confidence)

- **ClockLogsService.ts** — Bulk create pattern with `skipDuplicates: true`, source parameter, session linking
- **clockLogNormalization.ts** — Normalization patterns (NFD, lowercase, whitespace trimming), type safety with discriminated union
- **ClockLogsRoute.ts** — Route pattern with asyncHandler, validateBody middleware, AuthMiddleware application

### Tertiary (LOW confidence)

- None — all claims verified against codebase or project manual.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all libraries verified in CLAUDE.md + existing code
- Architecture patterns: **HIGH** — ClockLogAdjustmentService is a near-identical precedent
- Pitfalls: **MEDIUM** — based on unique constraint behavior + import logic analysis; recommend user walkthrough before execution
- Type inference algorithm: **MEDIUM** — alternation logic is straightforward but untested; benefits from unit test coverage in Wave 0

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days; stable, no external API changes expected)
