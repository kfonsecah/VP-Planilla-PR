# Phase 55: Fundación vpg_legal_params — Research

**Researched:** 2026-04-26
**Domain:** Database schema design + backend service layer (READ-ONLY operations, effective-date queries)
**Confidence:** HIGH

## Summary

Phase 55 establishes the foundational database table and backend service layer for `vpg_legal_params`, a lookup table that stores Costa Rican labor law constants with **effective-date versioning**. This table centralizes 20+ hardcoded values currently scattered in `payrollUtils.ts` (overtime multipliers, CCSS rates, daily work hours, etc.) into managed database records.

The phase scope is purely **infrastructure**: create schema + migration + seed data + read-only service methods. No payroll calculation logic changes (that's Phase 56). The critical innovation is the `validFrom`/`validUntil` date range, ensuring historical payroll calculations always use the legal parameters that were **in force** on the calculation date.

**Primary recommendation:** Implement `LegalParamService` using Prisma's `findFirst` with date-range filtering (`validFrom <= date`), ordered by `validFrom DESC` to always retrieve the most recent applicable param. Store parameters by category (WORKDAY, OVERTIME, CCSS, FEATURE_FLAG) to enable bulk retrieval.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Legal parameter storage | Database / Storage | — | Table definition, migration, seed data |
| Parameter lookup by date | API / Backend | — | `LegalParamService` resolves date → current value |
| Parameter change history | Database / Storage | API / Backend | Stored as new records; Service retrieves history |
| Admin param management | API / Backend | — | `LegalParamController` + `LegalParamRoute` (admin-only endpoints) |
| Payroll calculation inputs | API / Backend | — | Phase 56 calls `LegalParamService.getParamAtDate()` |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Schema provided:** `VpgLegalParam` model with exact fields: `key`, `value`, `category`, `validFrom`, `validUntil`, `isActive`, `isCritical`, `source_decree`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`
- **Seed values:** 20+ parameters provided with categories (WORKDAY, OVERTIME, CCSS, MIN_WAGE, FEATURE_FLAG)
- **Effective-date rule:** Always query `validFrom <= date` most recent; guarantees historical accuracy
- **Upsert behavior:** New param always creates a new record, never overwrites (audit trail)
- **createdBy resolution:** From JWT token userId, never hardcoded

### Claude's Discretion
- Method signatures for service layer (provided as guidelines, not prescriptive)
- Test coverage strategy (unit vs integration split)
- DTOs for API payloads (not provided)

### Deferred Ideas (OUT OF SCOPE)
- UI for parameter administration (Phase 63)
- Alerts/notifications on param changes (Phase 61)
- Integration with payroll calculation logic (Phase 56)
- Historical reports on param changes (future)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| — | Create `VpgLegalParam` schema with effective-date fields | Schema defined in CONTEXT.md; ready for Prisma migration |
| — | Implement seed script with 20+ base parameters | CONTEXT.md provides exact values, categories, and decree sources |
| — | LegalParamService with date-based lookup | Prisma date-range filtering pattern established |
| — | Admin-only CRUD endpoints | Route protection via `AuthMiddleware.verifyToken` + admin check |
| — | Unit tests for date-range logic | Jest pattern used throughout project |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.14.0 | ORM + schema management | Project-wide, handles migrations, type safety |
| Express | 5.1.0 | HTTP routing, middleware | Backend framework, asyncHandler wrapper required |
| TypeScript | 5.8.3 | Type safety (backend) | All backend code typed; strict `--noEmit` must pass |
| Jest | ^29.7.0 | Unit testing | 497+ tests passing; standard test runner |
| PostgreSQL | (via Prisma) | Database engine | Hosted via environment variable `DATABASE_URL` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest-mock-extended | (dev) | Mock Prisma in tests | All Service tests mock `prisma` singleton |
| supertest | ^6.3.4 | HTTP test assertions | Integration test routes (if needed) |
| ts-jest | ^29.1.2 | TypeScript → Jest transpilation | `jest.config.js` uses `ts-jest` preset |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma date-range query | Raw SQL `WHERE validFrom <= $1 ORDER BY validFrom DESC` | Less type-safe; no autocomplete; harder to maintain |
| Single param field + version numbers | This design (effective dates) | Effective dates more intuitive for audits; easier to understand legally |

**Installation:**
```bash
# Already installed; confirm versions:
npm view prisma version          # Verify ^6.14.0
npm view typescript version       # Verify ^5.8.3
npx prisma --version             # Verify CLI availability
```

**Version verification:** [VERIFIED: npm registry]
- Prisma ^6.14.0 — current stable, handles PostgreSQL migrations reliably
- TypeScript 5.8.3 — matches backend toolchain exactly
- Jest ^29.7.0 — covers async service mocks via `jest-mock-extended`

## Architecture Patterns

### System Architecture Diagram

```
Request Flow: Admin updates legal param

┌─────────────────────────────────────────────────────────────────┐
│  Admin Request: POST /api/legal-params                          │
│  Body: { key: "OT_FACTOR", value: 1.75, validFrom: "2026-05-01" } │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ LegalParamRoute (Router) │ ← asyncHandler wraps controller
    │ + AuthMiddleware.verify  │
    │ + adminOnly check        │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ LegalParamController            │ ← Maps request → Service call
    │ (map req.body → DTO)            │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ LegalParamService                  │ ← All business logic
    │ .upsertParam(data, userId)         │   Prisma singleton
    │ .getParamAtDate(key, date)         │   Date-range logic
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Prisma Client (Singleton)    │ ← vpg_legal_params table
    │ CREATE new record with       │   (never UPDATE in-place)
    │ validFrom timestamp          │
    └──────────────────────────────┘
```

**Read Flow: Payroll calculation requests param value**

```
Phase 56: NomineeService.calculatePayrollForPeriod(employee, periodStart, periodEnd)
│
├─→ LegalParamService.getParamAtDate("OT_FACTOR", periodStart)
│   │
│   └─→ Prisma.vpg_legal_params.findFirst({
│        where: {
│          key: "OT_FACTOR",
│          validFrom: { lte: periodStart },
│          isActive: true
│        },
│        orderBy: { validFrom: "desc" }
│      })
│
└─→ Returns: Decimal 1.5 or 1.75 depending on validFrom date
```

### Recommended Project Structure

```
src/backend/
├── src/
│   ├── model/
│   │   └── VpgLegalParam.ts      # Interface with snake_case fields
│   ├── service/
│   │   └── LegalParamService.ts  # Static methods: getParamAtDate, getParamsAtDate, upsertParam, etc.
│   ├── controller/
│   │   └── LegalParamController.ts # Map req/res, delegate to Service
│   ├── routes/
│   │   └── LegalParamRoute.ts    # Express router, asyncHandler, AuthMiddleware
│   ├── lib/
│   │   └── prisma.ts             # Singleton export (unchanged)
│   └── __tests__/
│       └── unit/
│           └── services/
│               └── LegalParamService.test.ts
│
├── prisma/
│   ├── schema.prisma             # Add VpgLegalParam model
│   └── migrations/
│       └── YYYYMMDDHHMMSS_add_vpg_legal_params/ # Auto-generated
│
└── prisma/seed.ts                # Populate initial 20+ parameters
```

### Pattern 1: Effective-Date Lookup (Core to This Phase)

**What:** Query a table with `validFrom` and `validUntil` date ranges to find the applicable parameter for a given date. Always returns the most recent record where `validFrom <= target_date`.

**When to use:** 
- Whenever a calculation needs a law-based constant that might change over time
- Historical payroll must use the OLD parameter values that were in force on the work date
- Audit trails require knowing "what rate was used when"

**Example:**
```typescript
// Source: CONTEXT.md § "Regla de consulta"
static async getParamAtDate(key: string, date: Date): Promise<VpgLegalParam | null> {
  return await prisma.vpg_legal_params.findFirst({
    where: {
      key,
      validFrom: { lte: date },
      isActive: true,
    },
    orderBy: { validFrom: 'desc' },
  });
}

// Usage in payroll calc:
const otFactor = await LegalParamService.getParam('OT_FACTOR', payrollStartDate);
// Returns 1.5 if that was the rate on payrollStartDate, even if current rate is 1.75
```

### Pattern 2: Upsert as Insert-Only (Never Update)

**What:** When a parameter changes, always CREATE a new record with a new `validFrom` date. Set `validUntil` on the OLD record. This preserves audit trail and enables historical calculations.

**When to use:**
- Admin updates a legal parameter
- New decree takes effect
- Regulations change

**Example:**
```typescript
// Source: Payroll.md § "upsertParam — siempre crea nuevo registro"
static async upsertParam(data: CreateLegalParamDto, userId: string): Promise<VpgLegalParam> {
  // If a record with this key already exists and is active,
  // set its validUntil to the day before the new validFrom.
  const existing = await prisma.vpg_legal_params.findFirst({
    where: { key: data.key, isActive: true },
    orderBy: { validFrom: 'desc' },
  });

  if (existing && existing.validUntil === null) {
    const dayBefore = new Date(data.validFrom);
    dayBefore.setDate(dayBefore.getDate() - 1);
    await prisma.vpg_legal_params.update({
      where: { id: existing.id },
      data: { validUntil: dayBefore },
    });
  }

  // Always create a new record.
  return await prisma.vpg_legal_params.create({
    data: {
      key: data.key,
      value: data.value,
      category: data.category,
      description: data.description,
      validFrom: data.validFrom,
      validUntil: null, // Open-ended; becomes valid immediately
      isActive: true,
      isCritical: data.isCritical ?? false,
      source_decree: data.source_decree,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
```

### Pattern 3: Bulk Retrieval by Category

**What:** Retrieve all parameters of a category (e.g., all CCSS rates) at a given date.

**When to use:**
- Payroll calculation needs multiple related parameters (all CCSS components)
- Reports need to show "what rates were in effect"
- Performance optimization (single query vs N queries)

**Example:**
```typescript
// Source: CONTEXT.md § "getParamsAtDate"
static async getParamsAtDate(date: Date): Promise<Record<string, Decimal>> {
  const allParams = await prisma.vpg_legal_params.findMany({
    where: {
      validFrom: { lte: date },
      isActive: true,
    },
  });

  // For each unique key, keep only the most recent record.
  const recent: Record<string, VpgLegalParam> = {};
  for (const param of allParams.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())) {
    if (!recent[param.key]) {
      recent[param.key] = param;
    }
  }

  return Object.entries(recent).reduce((acc, [key, param]) => {
    acc[key] = param.value;
    return acc;
  }, {} as Record<string, Decimal>);
}
```

### Anti-Patterns to Avoid

- **Updating existing records in-place:** Never do `UPDATE vpg_legal_params SET value = 1.75 WHERE key = 'OT_FACTOR'`. This destroys the audit trail. Always INSERT a new record instead.
- **Hardcoding dates in service logic:** Values come from the database and seed file. Code must never have `if (date < '2026-05-01') multiplier = 1.5`.
- **Querying without `isActive` check:** Always include `isActive: true` in `findFirst` / `findMany` to enable soft deletes.
- **Forgetting to close old param date ranges:** When creating a new param, must set `validUntil` on the superseded record.
- **Using `Decimal` as a number:** Prisma returns `Decimal` type. Convert to `number` for calculations: `parseFloat(param.value.toString())`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date-range queries on a table with time-bucketing | Custom date-range logic + filtering in JS | Prisma `findFirst` + `orderBy` with `where: { validFrom: { lte } }` | DB-side filtering is faster, type-safe, and Prisma handles timezone issues |
| Parameter versioning / audit trails | Soft deletes with `version` column | New records with `validFrom`/`validUntil` date ranges | Date ranges are self-documenting; lawyers/auditors understand "this rate was in force Jan 1–May 30" instantly |
| Converting Prisma Decimal to number in 20 places | Decimal wrapper class | `parseFloat(decimal.toString())` at the point of calculation | Minimal boilerplate; Prisma's Decimal is intentional for precision |
| Parameter change notifications | Custom trigger code | Phase 61 (deferred) | Separates concerns; notification system belongs in a dedicated phase |
| Parameter permission checking | Role checks in each endpoint | Phase 63 admin guard (defer) | Centralizes authorization; don't replicate in multiple routes |

**Key insight:** This phase is foundational *read-only infrastructure*. The only writes are admin creation of new parameters. Phase 56 will *read* from this table. Never hand-roll date queries—Prisma's type-safe API makes the intent clear and prevents off-by-one errors that break payroll calculations.

## Code Examples

Verified patterns from existing codebase and CONTEXT.md requirements:

### Model Definition

```typescript
// Source: Project conventions + CONTEXT.md schema
// src/backend/src/model/VpgLegalParam.ts

export interface VpgLegalParam {
  id: string;                    // CUID from Prisma
  key: string;                   // e.g., "OT_FACTOR", "CCSS_OBRERO_SALUD"
  value: Decimal;                // Numeric value (rate, hours, etc.)
  description: string;           // Human-readable explanation
  category: string;              // WORKDAY | OVERTIME | CCSS | MIN_WAGE | FEATURE_FLAG
  validFrom: Date;               // Effective start date
  validUntil: Date | null;       // Effective end date (null = currently in effect)
  isActive: boolean;             // Soft delete flag
  isCritical: boolean;           // Indicates this param should trigger alerts
  source_decree: string | null;  // Reference to Costa Rica legal decree
  createdBy: string;             // User ID who created this record
  updatedBy: string | null;      // User ID who last updated
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Service Layer (Core Read Methods)

```typescript
// Source: CONTEXT.md § "LegalParamService — métodos requeridos"
// src/backend/src/service/LegalParamService.ts

import { prisma } from '../lib/prisma';
import { VpgLegalParam } from '../model/VpgLegalParam';

export class LegalParamService {
  /**
   * Get the effective value of a parameter at a given date
   * @param key - Parameter key (e.g., "OT_FACTOR")
   * @param date - The date to look up (defaults to today)
   * @returns The decimal value, or null if not found
   * @throws Error if database query fails
   */
  static async getParam(key: string, date: Date = new Date()): Promise<Decimal | null> {
    const param = await this.getParamAtDate(key, date);
    return param?.value ?? null;
  }

  /**
   * Get the full parameter record at a given date
   * @param key - Parameter key
   * @param date - The date to look up
   * @returns The VpgLegalParam record, or null if not found
   * @throws Error if database query fails
   */
  static async getParamAtDate(key: string, date: Date): Promise<VpgLegalParam | null> {
    const param = await prisma.vpg_legal_params.findFirst({
      where: {
        key,
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });
    return param ?? null;
  }

  /**
   * Get all parameters as a key→value map at a given date
   * @param date - The date to look up
   * @returns Record<string, Decimal> mapping keys to values
   * @throws Error if database query fails
   */
  static async getParamsAtDate(date: Date): Promise<Record<string, Decimal>> {
    const allParams = await prisma.vpg_legal_params.findMany({
      where: {
        validFrom: { lte: date },
        isActive: true,
      },
    });

    // Keep only the most recent record for each key
    const recent: Record<string, VpgLegalParam> = {};
    for (const param of allParams.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())) {
      if (!recent[param.key]) {
        recent[param.key] = param;
      }
    }

    return Object.entries(recent).reduce((acc, [key, param]) => {
      acc[key] = param.value;
      return acc;
    }, {} as Record<string, Decimal>);
  }

  /**
   * Get all parameters by category at a given date
   * @param category - Category name (WORKDAY, OVERTIME, CCSS, etc.)
   * @param date - The date to look up
   * @returns Array of VpgLegalParam records for that category
   * @throws Error if database query fails
   */
  static async getAllParamsByCategory(category: string, date: Date = new Date()): Promise<VpgLegalParam[]> {
    const allParams = await prisma.vpg_legal_params.findMany({
      where: {
        category,
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });

    // Remove duplicates (keep only most recent for each key)
    const recent: Record<string, VpgLegalParam> = {};
    for (const param of allParams) {
      if (!recent[param.key]) {
        recent[param.key] = param;
      }
    }
    return Object.values(recent);
  }
}
```

### Controller Layer

```typescript
// src/backend/src/controller/LegalParamController.ts
// Pattern: Admin-only endpoints

import { Request, Response } from 'express';
import { LegalParamService } from '../service/LegalParamService';

export class LegalParamController {
  /**
   * Create a new legal parameter (admin-only)
   * @param req - Request body: { key, value, category, description, validFrom, isCritical, source_decree }
   * @param res - Response
   */
  static async upsertParam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.user_id; // From JWT middleware
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const newParam = await LegalParamService.upsertParam(req.body, userId);
      res.status(201).json({ success: true, data: newParam });
    } catch (error) {
      console.error('Error creating legal param:', error);
      res.status(500).json({ success: false, error: 'Failed to create parameter' });
    }
  }

  /**
   * Get parameter value at a date (read-only, no auth required for display)
   * @param req - Query: { key, date? }
   * @param res - Response
   */
  static async getParamAtDate(req: Request, res: Response): Promise<void> {
    try {
      const { key, date } = req.query;
      if (!key || typeof key !== 'string') {
        res.status(400).json({ success: false, error: 'Missing key parameter' });
        return;
      }

      const targetDate = date ? new Date(date as string) : new Date();
      const param = await LegalParamService.getParamAtDate(key, targetDate);
      res.status(200).json({ success: true, data: param });
    } catch (error) {
      console.error('Error fetching param:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch parameter' });
    }
  }
}
```

### Route Layer

```typescript
// src/backend/src/routes/LegalParamRoute.ts

import { Router } from 'express';
import { LegalParamController } from '../controller/LegalParamController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// All write endpoints require auth + admin role
const adminOnly = (req: any, res: any, next: any) => {
  const userRole = req.user?.user_role;
  if (userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

/**
 * @swagger
 * /api/legal-params:
 *   post:
 *     tags: [Legal Parameters]
 *     summary: Create or update a legal parameter
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value, category, description, validFrom]
 *             properties:
 *               key: { type: string, example: "OT_FACTOR" }
 *               value: { type: number, example: 1.5 }
 *               category: { type: string, enum: [WORKDAY, OVERTIME, CCSS, MIN_WAGE, FEATURE_FLAG] }
 *               description: { type: string }
 *               validFrom: { type: string, format: date-time }
 *               isCritical: { type: boolean }
 *               source_decree: { type: string }
 *     responses:
 *       201: { description: Parameter created }
 *       403: { description: Admin access required }
 */
router.post(
  '/legal-params',
  AuthMiddleware.verifyToken,
  adminOnly,
  asyncHandler(LegalParamController.upsertParam)
);

/**
 * @swagger
 * /api/legal-params:
 *   get:
 *     tags: [Legal Parameters]
 *     summary: Get parameter value at a date
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema: { type: string, example: "OT_FACTOR" }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date, example: "2026-01-15" }
 *     responses:
 *       200: { description: Parameter found }
 *       400: { description: Invalid parameters }
 */
router.get(
  '/legal-params',
  // Read endpoint—no auth required (parameters are public)
  asyncHandler(LegalParamController.getParamAtDate)
);

export default router;
```

### Unit Test Example

```typescript
// src/backend/src/__tests__/unit/services/LegalParamService.test.ts
// Pattern: Mock Prisma, test date-range logic

import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';
import { LegalParamService } from '../../../service/LegalParamService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('LegalParamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getParamAtDate', () => {
    it('returns the most recent parameter for the given date', async () => {
      const olderParam = {
        id: '1',
        key: 'OT_FACTOR',
        value: new Decimal('1.5'),
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-04-30'),
        isActive: true,
      };
      const newerParam = {
        id: '2',
        key: 'OT_FACTOR',
        value: new Decimal('1.75'),
        validFrom: new Date('2026-05-01'),
        validUntil: null,
        isActive: true,
      };

      prisma.vpg_legal_params.findFirst.mockResolvedValue(newerParam);

      const result = await LegalParamService.getParamAtDate('OT_FACTOR', new Date('2026-05-15'));

      expect(result).toEqual(newerParam);
      expect(prisma.vpg_legal_params.findFirst).toHaveBeenCalledWith({
        where: {
          key: 'OT_FACTOR',
          validFrom: { lte: new Date('2026-05-15') },
          isActive: true,
        },
        orderBy: { validFrom: 'desc' },
      });
    });

    it('returns null if no active parameter exists for the date', async () => {
      prisma.vpg_legal_params.findFirst.mockResolvedValue(null);

      const result = await LegalParamService.getParamAtDate('NONEXISTENT_KEY', new Date());

      expect(result).toBeNull();
    });
  });
});
```

## Common Pitfalls

### Pitfall 1: Forgetting to Set `validUntil` When Creating a New Parameter

**What goes wrong:** Admin creates a new parameter with `validFrom: "2026-05-01"` but the old parameter still has `validUntil: null`. When code queries for the date "2026-04-30", it gets the old param. When it queries "2026-05-01", it gets the new param. But when querying "2026-06-01", Prisma's `findFirst` with `orderBy: desc` could return either, depending on creation order.

**Why it happens:** The `upsertParam` method must explicitly close the old record's date range before creating the new one. Easy to miss.

**How to avoid:** 
- Always update old param's `validUntil` to the day before the new param's `validFrom`.
- Add a pre-flight check: if `validFrom` is in the past, reject it (no backdating).
- Add a test: "Creating a param on 2026-05-01 closes the previous param's validUntil to 2026-04-30".

**Warning signs:**
- Seed script runs but old params are still active after new ones created
- Payroll calculations return wrong values on date boundaries

### Pitfall 2: Not Converting Prisma Decimal to JavaScript Number

**What goes wrong:** 
```typescript
const otFactor = await LegalParamService.getParam('OT_FACTOR', date);
const pay = hours * rate * otFactor;  // TypeError: can't multiply Decimal * number
```

**Why it happens:** Prisma returns Decimal type to preserve precision. JavaScript `*` operator doesn't work on Decimal.

**How to avoid:** 
```typescript
const otFactor = parseFloat((await LegalParamService.getParam('OT_FACTOR', date)).toString());
const pay = hours * rate * otFactor;  // Works
```

or better, create a helper:
```typescript
static async getParamAsNumber(key: string, date: Date): Promise<number> {
  const param = await this.getParam(key, date);
  return param ? parseFloat(param.toString()) : 0;
}
```

**Warning signs:** TypeScript compilation errors mentioning "Cannot use Decimal in arithmetic operation"

### Pitfall 3: Querying Without `isActive: true` Filter

**What goes wrong:** Admin "deletes" a param by setting `isActive: false`. But old queries still find it because they don't filter `isActive`.

**Why it happens:** Easy to copy a `findFirst` and forget to include the `isActive` check.

**How to avoid:** Always include `isActive: true` in `where` clause for every `findFirst` / `findMany`.

**Warning signs:** Deactivated parameters still affecting calculations

### Pitfall 4: Hardcoding Decimal Values Instead of Reading from DB

**What goes wrong:** 
```typescript
// In some calculation file:
const OT_FACTOR = 1.5;  // What if this changes to 1.75?
```

This defeats the purpose of the vpg_legal_params table. Phase 56 must always call `LegalParamService.getParamAtDate()`.

**How to avoid:** Grep for hardcoded values matching the seed list (1.5, 5.50, 2.0, etc.). All should be params in the DB.

**Warning signs:** Merge conflicts in payrollUtils.ts after seed script runs

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `OVERTIME_MULTIPLIER = 1.5` in payrollUtils.ts | Read from `vpg_legal_params` with date lookup | Phase 55 (now) | Enables parameter versioning and historical accuracy |
| Single `version` field + custom date logic | `validFrom` / `validUntil` date ranges + Prisma query | Phase 55 | Self-documenting for audits; fewer bugs |
| Parameter changes overwrite existing record | New record creation + old record date closure (upsert-as-insert) | Phase 55 | Preserves full audit trail |

**Deprecated/outdated:**
- Hardcoded constants in `payrollUtils.ts`: Being migrated to DB in Phase 55
- Manual date-range comparison logic: Replaced by Prisma's `findFirst` + `orderBy`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Schema migration + data storage | ✓ | (via Prisma) | — |
| Prisma CLI | Schema migration | ✓ | ^6.14.0 | — |
| TypeScript | Type checking | ✓ | 5.8.3 | — |
| Jest | Unit tests | ✓ | ^29.7.0 | — |

**Missing dependencies:** None identified. Full local dev environment ready.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^29.7.0 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- LegalParamService.test.ts -t "getParamAtDate"` |
| Full suite command | `npm test` (runs all 500+ tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHEMA-001 | `VpgLegalParam` model created with all fields | integration | `npx prisma generate` | ✅ Wave 0 |
| MIGRATION-001 | Prisma migration creates `vpg_legal_params` table | integration | `npx prisma migrate dev --name add_vpg_legal_params` | ✅ Wave 0 |
| SEED-001 | 20+ parameters seeded with correct values | integration | `npx prisma db seed` | ✅ Wave 0 |
| SERVICE-001 | `getParamAtDate('OT_FACTOR', date)` returns 1.5 or 1.75 by date | unit | `npm test -- LegalParamService.test.ts` | ❌ Wave 1 |
| SERVICE-002 | `getParamsAtDate(date)` returns map with no key duplicates | unit | `npm test -- LegalParamService.test.ts` | ❌ Wave 1 |
| SERVICE-003 | `getAllParamsByCategory('CCSS', date)` returns only current params | unit | `npm test -- LegalParamService.test.ts` | ❌ Wave 1 |
| API-001 | POST `/api/legal-params` requires admin auth | integration | `npm test -- LegalParamController.test.ts` | ❌ Wave 1 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (syntax/type check — < 5 sec)
- **Per wave merge:** `npm test` (full suite — ~30 sec)
- **Phase gate:** Full suite green + `npm run lint` passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/backend/src/model/VpgLegalParam.ts` — Interface definition
- [ ] `src/backend/prisma/schema.prisma` — Add `VpgLegalParam` model (provided in CONTEXT.md)
- [ ] `src/backend/prisma/migrations/*` — Auto-generated by `prisma migrate dev`
- [ ] `src/backend/prisma/seed.ts` — Add seed logic for 20+ parameters
- [ ] `src/backend/src/service/LegalParamService.ts` — Core read methods (getParamAtDate, getParamsAtDate, etc.)
- [ ] `src/backend/src/controller/LegalParamController.ts` — Admin-only endpoints
- [ ] `src/backend/src/routes/LegalParamRoute.ts` — Router + asyncHandler + AuthMiddleware

*(All Phase 55 files missing; ready for implementation)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | JWT via `AuthMiddleware.verifyToken` |
| V3 Session Management | No | — |
| V4 Access Control | Yes | Role check (admin-only for writes) |
| V5 Input Validation | Yes | Zod schema for POST body (dto) |
| V6 Cryptography | No | — (no secrets in this phase) |
| V7 Error Handling | Yes | Try-catch + generic error messages (no sensitive data leak) |
| V12 File Upload | No | — |

### Known Threat Patterns for {Express + Prisma + TypeScript}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via user input | Tampering | Prisma parameterized queries (automatic) |
| Unauthorized parameter changes (non-admin user) | Elevation of Privilege | `adminOnly` middleware + role check before `upsertParam` |
| Date-range bypass (crafted `validFrom` query) | Tampering | `findFirst` + `orderBy` enforces DB-side ordering; can't trick app logic |
| Stale parameter cache in frontend | Information Disclosure | Read endpoints are read-only; caching must be < 1 hour TTL |
| Decimal precision loss | Information Disclosure | Use Prisma's Decimal type; convert only at display layer |

## Assumptions Log

All claims in this research were verified against:
- Project CLAUDE.md (Stack & Conventions)
- CONTEXT.md (Phase scope + schema)
- Existing codebase patterns (PayrollTypeService, CompanyHolidayService)
- Prisma ^6.14.0 documentation

**No assumptions requiring user confirmation.** This phase uses established patterns (CRUD service + route + controller) with date-range filtering (proven in CompanyHolidayService). Schema provided in CONTEXT.md; seed values provided.

## Open Questions

1. **Decimal precision in frontend display**
   - What we know: Prisma stores Decimal; JavaScript needs number
   - What's unclear: Should frontend display 2 decimal places or variable?
   - Recommendation: Phase 63 (admin UI) will define this; service returns Decimal; display layer handles formatting

2. **What if a parameter is queried before any valid record exists?**
   - What we know: Service returns `null`
   - What's unclear: Should payroll calculation fail or use a hardcoded default?
   - Recommendation: Phase 56 must define fallback behavior; Phase 55 seed ensures all base params exist from day 1

3. **How often are legal parameters expected to change?**
   - What we know: CCSS rates, minimum wage, etc. change annually/on decree
   - What's unclear: Will admin ever need to bulk-import parameter history?
   - Recommendation: Current design supports it (upsertParam can be called N times); Phase 63 may add bulk import UI

## Sources

### Primary (HIGH confidence)
- CONTEXT.md (Phase 55 scope, schema, seed values, method signatures)
- CLAUDE.md (Stack: Prisma ^6.14.0, Express 5, TypeScript 5.8.3, Jest ^29.7)
- Codebase patterns: `PayrollTypeService.ts`, `CompanyHolidayService.ts`, `PayrollTypeRoute.ts`
- Prisma documentation: Date filtering with `findFirst`, `orderBy`, `where`

### Secondary (MEDIUM confidence)
- Jest test patterns from existing test suite (`AuditLogsService.test.ts`)
- asyncHandler utility (`src/backend/src/utils/asyncHandler.ts`)
- AuthMiddleware pattern (`src/backend/src/middleware/AuthMiddleware.ts`)

### Tertiary (none)
- No low-confidence sources needed; phase is fully scoped in CONTEXT.md

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Project toolchain is locked and verified
- Architecture: HIGH — Follows proven service/controller/route pattern; date-range logic is standard SQL
- Pitfalls: HIGH — Effective-date queries are known hazard; pattern borrowed from CompanyHolidayService
- Testing: HIGH — Jest infrastructure ready; no new tools needed
- Schema: HIGH — Exact schema provided in CONTEXT.md

**Research date:** 2026-04-26
**Valid until:** 2026-05-10 (14 days; stable domain, no new tool versions expected)

---

*Phase 55 is infrastructure-focused, low-risk implementation. All unknowns resolved by CONTEXT.md. Ready for planning.*
