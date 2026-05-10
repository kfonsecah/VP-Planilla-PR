# Phase 64: Snapshot de Params en Planilla Cerrada - Research

**Researched:** 2026-04-29
**Domain:** Payroll parameter historical capture & traceability
**Confidence:** HIGH

## Summary

Phase 64 implements a critical audit trail feature: capturing legal parameter snapshots when a payroll is approved, enabling exact reproduction of historical payroll calculations and CCSS/MTSS compliance verification. The architecture is straightforward: on approval, store a denormalized copy of active legal parameters plus enterprise config into `vpg_payroll_param_snapshots`. The frontend displays these in a collapsible details section.

**Primary recommendation:** Execute in the planned 3-task breakdown (schema → backend capture + endpoint → frontend UI). All dependencies (LegalParamService, EnterpriseService, PayrollService) are already in place from phases 55–57. The schema model matches CONTEXT.md exactly, requiring a standard Prisma migration.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Schema structure for `VpgPayrollParamSnapshot` with `id`, `payroll_id`, `param_key`, `param_value`, `param_valid_from`, `source_decree`, `captured_at`
- Capture triggered by `PayrollService.approvePayroll` state transition to APROBADA
- Include enterprise config as special snapshot records: `ENTERPRISE_MINUTE_ROUNDING_POLICY`, `ENTERPRISE_ORDINARY_SHIFT_TYPE`, `ENTERPRISE_IS_COMMERCIAL_ACTIVITY`
- Frontend: collapsible "Parámetros utilizados en el cálculo" section, visible only on APROBADA or PAGADA status
- Plan breakdown: 64-01 (schema) → 64-02 (backend) → 64-03 (frontend)

### Claude's Discretion
- Handling of historical payrolls (pre-phase 64) without snapshots — CONTEXT.md suggests graceful UI degradation; implementation details are flexible
- Grouping/categorization strategy in frontend table (e.g., group by parameter category: salario, CCSS, holidays, enterprise)
- Whether to add indexes to `vpg_payroll_param_snapshots` beyond the FK relationship

### Deferred Ideas (OUT OF SCOPE)
- Changes to the payroll calculation engine — snapshot is purely observational, no calculation changes
- Retroactive snapshot generation for existing historical payrolls

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Parameter capture logic | Backend API | — | Business logic (when to snapshot, what to include) belongs in service layer during approval |
| Snapshot persistence | Database / Storage | — | Denormalized snapshot storage is a data-layer responsibility |
| Snapshot retrieval & formatting | Backend API | — | Service fetches, formats, and returns snapshot data; API endpoint wraps it |
| Historical parameter display UI | Frontend / Browser | — | Client-side rendering of snapshot data in collapsible sections; pure UI concern |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-29 | Snapshot de Parámetros en Planilla Cerrada — cada planilla aprobada captura valores exactos de parámetros legales vigentes en su período para trazabilidad CCSS/MTSS | This phase fully addresses PAY-29 through (1) schema model to store snapshots, (2) capture logic in approvePayroll, (3) endpoint for retrieval, (4) frontend details section showing historical parameters |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.8.3 (backend) / 5.9.3 (frontend) | Type safety across all layers | Project standard, enforced by CLAUDE.md |
| Prisma | ^6.14.0 | ORM for DB schema & migrations | Only persistence layer; migrations auto-generated from schema.prisma |
| Express 5 | 5.1.0 | Backend routing & middleware | Existing API framework; all routes use `asyncHandler` wrapper |
| React 19 | 19.0.0 | Frontend component library | Existing frontend framework; hooks + functional components |
| Zod | ^4.0.17 | Validation for forms | Already used in project; use for snapshot display validation if needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^12.x | Animation library | Collapsible section uses `AnimatePresence` + `motion.div` pattern (existing in project) |
| @heroicons/react | (existing) | Icon components | Status badges, section headers in detail page |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Snapshot denormalization in DB | Compute on-the-fly from vpgLegalParam + join | On-the-fly is slower for historical audits; denormalization trades storage for query speed (correct choice for CCSS audits) |
| Frontend collapsible via CSS | Headless UI (existing pattern) | Framer-motion already used in project; consistency favors framer-motion |

**Installation:**
No new packages required — all dependencies are already in package.json from phases 55–57.

## Architecture Patterns

### System Architecture Diagram

```
┌─ Payroll Detail Page (React)
│  │
│  ├─ usePayroll hook
│  │  ├─ Load payrollData (payroll service)
│  │  └─ Load paramSnapshots (NEW: payrollService.getPayrollSnapshot)
│  │
│  └─ Collapsible "Parámetros Utilizados" section
│     │
│     └─ Render snapshot table (param_key, param_value, valid_from, source_decree)
│
└─ Backend API
   │
   ├─ POST /payroll/:id/approve (PayrollController)
   │  │
   │  └─ PayrollService.approvePayroll
   │     ├─ Validate payroll is BORRADOR
   │     ├─ Check min wage (audit log if enabled)
   │     ├─ Fetch legal params at period_start: LegalParamService.getActiveParams
   │     ├─ Fetch enterprise config: EnterpriseService.getConfig
   │     ├─ Create snapshot records in vpg_payroll_param_snapshots (NEW)
   │     └─ Update payroll status → APROBADA
   │
   └─ GET /payroll/:id/snapshot (NEW: PayrollController)
      │
      └─ PayrollService.getPayrollWithSnapshot (NEW)
         └─ Query vpg_payroll_param_snapshots + format
```

### Recommended Project Structure

```
src/backend/
├── prisma/
│  └── migrations/
│     └── YYYYMMDDHHMMSS_add_vpg_payroll_param_snapshots/
│        └── migration.sql (auto-generated by Prisma)
│
├── src/
│  ├── service/
│  │  ├── LegalParamService.ts (EXISTING — will call getActiveParams)
│  │  ├── EnterpriseService.ts (EXISTING — getConfig method)
│  │  └── PayrollService.ts (MODIFY: add snapshot logic to approvePayroll)
│  │
│  └── model/
│     └── VpgPayrollParamSnapshot.ts (NEW model interface)

src/frontend/
├── src/
│  ├── services/
│  │  └── payrollService.ts (ADD: getPayrollSnapshot method)
│  │
│  ├── hooks/
│  │  └── usePayrollDetail.ts (MODIFY: add snapshot loading)
│  │
│  └── components/
│     └── PayrollParamSnapshot.tsx (NEW: collapsible table component)
```

### Pattern 1: Snapshot Capture on State Transition
**What:** When `approvePayroll` transitions status BORRADOR → APROBADA, capture legal parameters in a denormalized snapshot table to preserve exact values used for calculation audit trails.

**When to use:** Any time you need to preserve historical configuration values that can change in the future. Prevents audits from saying "I don't know what rate was used when this payroll was calculated."

**Example:**
```typescript
// Source: CONTEXT.md (64-CONTEXT.md) — Phase 64 design
static async approvePayroll(payrollId: number, userId: number): Promise<Payroll> {
  const payroll = await prisma.vpg_payrolls.findUnique({
    where: { payrolls_id: payrollId }
  });
  if (!payroll) throw new Error('Payroll not found');
  if (payroll.payrolls_status !== PayrollStatus.BORRADOR) {
    throw new Error('Solo planillas en BORRADOR pueden ser aprobadas');
  }

  // CAPTURE SNAPSHOT AT PERIOD START
  const paramsAtPeriodStart = await LegalParamService.getActiveParams(payroll.payrolls_period_start);
  const enterprise = await prisma.vpg_enterprise.findFirst();

  // Build snapshot data: legal params + enterprise config
  const snapshotData = [
    ...paramsAtPeriodStart.map(p => ({
      payroll_id: payrollId,
      param_key: p.key,
      param_value: p.value,
      param_valid_from: p.validFrom,
      source_decree: p.source_decree
    })),
    {
      payroll_id: payrollId,
      param_key: 'ENTERPRISE_MINUTE_ROUNDING_POLICY',
      param_value: String(enterprise.enterprise_minute_rounding_policy),
      param_valid_from: new Date(),
      source_decree: null
    },
    // ... ENTERPRISE_ORDINARY_SHIFT_TYPE, ENTERPRISE_IS_COMMERCIAL_ACTIVITY
  ];

  await prisma.vpgPayrollParamSnapshot.createMany({ data: snapshotData, skipDuplicates: true });

  // NOW APPROVE
  return await prisma.vpg_payrolls.update({
    where: { payrolls_id: payrollId },
    data: { payrolls_status: PayrollStatus.APROBADA, payrolls_approved_at: new Date(), ... }
  });
}
```

### Pattern 2: Denormalized Retrieval for Display
**What:** Query `vpg_payroll_param_snapshots` to reconstruct the exact parameter state at approval time, bypassing current legal parameter values.

**When to use:** Historical audits, payroll details page, CCSS report generation — any read-only scenario where you need "what was true when this payroll was calculated."

**Example:**
```typescript
// Source: CONTEXT.md design pattern (Phase 64 — 64-02 backend spec)
static async getPayrollWithSnapshot(payrollId: number): Promise<{
  payroll: Payroll,
  snapshot: Array<{ param_key: string, param_value: Decimal, param_valid_from: Date, source_decree?: string }>
}> {
  const payroll = await prisma.vpg_payrolls.findUnique({
    where: { payrolls_id: payrollId }
  });
  if (!payroll) throw new Error('Payroll not found');

  const snapshot = await prisma.vpgPayrollParamSnapshot.findMany({
    where: { payroll_id: payrollId },
    select: { param_key: true, param_value: true, param_valid_from: true, source_decree: true },
    orderBy: { param_key: 'asc' }
  });

  return { payroll, snapshot };
}
```

### Anti-Patterns to Avoid
- **Fetching live params for historical payroll displays:** If you load a 2024 payroll in 2025 and query `vpgLegalParam` for current values, you'll see 2025 rates, not what was used. Always use the snapshot.
- **Capturing snapshot AFTER status update:** If you update status first, concurrent reads might see APROBADA with no snapshot (race condition). Capture within same transaction.
- **Duplicating snapshots on re-approvals:** If a payroll is reopened and re-approved, use `skipDuplicates: true` to avoid duplicate key errors.
- **Forgetting enterprise config in snapshot:** Enterprise settings (rounding policy, shift type) are not in `vpgLegalParam` — they're in `vpg_enterprise`. Must be captured separately or the snapshot is incomplete.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Denormalization of changing config | Custom timestamp + if/else logic per field | Snapshot table with Prisma createMany | Prevents typos, guarantees consistency, auditable |
| Parameter retrieval at date | String parsing + manual lookups | LegalParamService.getActiveParams (existing) | Already built, tested, handles null/inactive params |
| Transaction safety on state changes | Separate update + insert | Prisma.$transaction with both operations | Guarantees atomic all-or-nothing (no partial snapshots) |
| Collapsible UI animations | CSS toggles + opacity changes | framer-motion AnimatePresence (existing pattern) | Matches project conventions, smooth transitions |

**Key insight:** Payroll calculations are legally binding in Costa Rica. A snapshot that's incorrect or incomplete breaks audit trails. Use proven patterns (Prisma transactions, existing services) instead of custom logic.

## Runtime State Inventory

> Trigger: This is NOT a rename/refactor phase. No runtime state changes needed.

N/A — This phase introduces new data capture only, does not rename or refactor existing runtime identifiers.

## Common Pitfalls

### Pitfall 1: Snapshot Captured at Approval Time, But Parameters Are Effective at Period Start
**What goes wrong:** You capture params using `new Date()` (approval date), but the payroll was calculated using params effective at `period_start`. Snapshot values don't match calculation.

**Why it happens:** Confusion about "effective date" — legal params have a `validFrom` date that may be different from when the payroll was approved.

**How to avoid:** ALWAYS call `LegalParamService.getActiveParams(payroll.payrolls_period_start)`, not `getActiveParams(new Date())`. The period_start date is the correct context for the calculation.

**Warning signs:** If a payroll from 2026-01-15 is approved 2026-04-29, and the snapshot shows different rates than 2026-01-15, you captured at approval time instead of period start.

### Pitfall 2: Enterprise Config Captured at Approval, But It May Have Changed Since Period Start
**What goes wrong:** Enterprise rounding policy changes 2026-03-01. Payroll from 2026-02-15 approved 2026-04-29 captures the 2026-03-01 policy, not the 2026-02-15 policy.

**Why it happens:** Unlike `vpgLegalParam`, `vpg_enterprise` has no `validFrom` date — it's just the current state.

**How to avoid:** For a robust solution: add `updated_at` to `vpg_enterprise` and filter to "updated before period_start" (Phase 65+). For now, document in CONTEXT.md or code comment that enterprise config snapshot is approximate — the system doesn't track historical enterprise settings. This is a known limitation, not a bug.

**Warning signs:** If payroll detail shows enterprise config different from what was actually used, this is the root cause.

### Pitfall 3: Historical Payrolls Before Phase 64 Have No Snapshot
**What goes wrong:** User views a 2025 payroll (before phase 64 shipped), gets "Parameters not available" error.

**Why it happens:** Snapshots are only created going forward; we can't retroactively create them for closed payrolls.

**How to avoid:** Frontend must check `if (snapshot.length === 0 && payroll.status === APROBADA)` and show a graceful message: "Datos de parámetros no disponibles para planillas anteriores a [implementation date]" instead of crashing.

**Warning signs:** Null pointer exceptions when accessing snapshot on old payrolls, or blank tables instead of error messages.

### Pitfall 4: createMany Without skipDuplicates on Payroll Reopen/Re-Approve
**What goes wrong:** Payroll is reopened → re-approved → createMany tries to insert same snapshot records → unique key violation.

**Why it happens:** No logic to delete old snapshot before creating new one.

**How to avoid:** Always use `skipDuplicates: true` in `createMany`. Or delete old snapshot before creating: `await prisma.vpgPayrollParamSnapshot.deleteMany({ where: { payroll_id: payrollId } })`.

**Warning signs:** Errors like "Unique constraint violation on (payroll_id, param_key)" when re-approving a payroll.

## Code Examples

### Backend: Capture Logic in approvePayroll
```typescript
// Source: PayrollService.ts — Phase 64 implementation
import { prisma } from '../lib/prisma';
import { LegalParamService } from './LegalParamService';

static async approvePayroll(payrollId: number, userId: number): Promise<Payroll> {
  const payroll = await prisma.vpg_payrolls.findUnique({
    where: { payrolls_id: payrollId }
  });

  if (!payroll) throw new Error('Payroll not found');
  if (payroll.payrolls_status !== PayrollStatus.BORRADOR) {
    throw new Error('Solo planillas en BORRADOR pueden ser aprobadas');
  }

  // Fetch legal parameters EFFECTIVE AT PERIOD START (not now)
  const paramsAtPeriodStart = await LegalParamService.getActiveParams(payroll.payrolls_period_start);

  // Fetch enterprise config (limitation: not versioned, captures current state)
  const enterprise = await prisma.vpg_enterprise.findFirst({
    select: {
      enterprise_minute_rounding_policy: true,
      enterprise_ordinary_shift_type: true,
      enterprise_is_commercial_activity: true
    }
  });

  // Build snapshot records
  const snapshotData = [
    // Legal parameters
    ...paramsAtPeriodStart.map(p => ({
      payroll_id: payrollId,
      param_key: p.key,
      param_value: p.value,
      param_valid_from: p.validFrom,
      source_decree: p.source_decree
    })),
    // Enterprise config as special records
    {
      payroll_id: payrollId,
      param_key: 'ENTERPRISE_MINUTE_ROUNDING_POLICY',
      param_value: String(enterprise?.enterprise_minute_rounding_policy ?? 'EXACT'),
      param_valid_from: new Date(),
      source_decree: null
    },
    {
      payroll_id: payrollId,
      param_key: 'ENTERPRISE_ORDINARY_SHIFT_TYPE',
      param_value: enterprise?.enterprise_ordinary_shift_type ?? 'DIURNA',
      param_valid_from: new Date(),
      source_decree: null
    },
    {
      payroll_id: payrollId,
      param_key: 'ENTERPRISE_IS_COMMERCIAL_ACTIVITY',
      param_value: enterprise?.enterprise_is_commercial_activity ? '1' : '0',
      param_valid_from: new Date(),
      source_decree: null
    }
  ];

  // Use transaction to ensure atomic snapshot + approval
  const [updated] = await prisma.$transaction([
    prisma.vpgPayrollParamSnapshot.createMany({
      data: snapshotData,
      skipDuplicates: true  // Safe if re-approving same payroll
    }),
    prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_approved_by: userId,
        payrolls_approved_at: new Date(),
        payrolls_version: payroll.payrolls_version + 1
      }
    })
  ]);

  return this.mapToPayroll(updated);
}
```

### Backend: Retrieval Endpoint
```typescript
// Source: PayrollService.ts — new method
/**
 * Get payroll with parameter snapshot
 * @param payrollId - The payroll ID
 * @returns Promise with payroll and parameter snapshot
 * @throws Error if payroll not found
 */
static async getPayrollWithSnapshot(payrollId: number): Promise<{
  payroll: Payroll;
  snapshot: Array<{
    param_key: string;
    param_value: Decimal;
    param_valid_from: Date;
    source_decree?: string | null;
  }>;
}> {
  const payroll = await prisma.vpg_payrolls.findUnique({
    where: { payrolls_id: payrollId }
  });

  if (!payroll) throw new Error('Payroll not found');

  const snapshot = await prisma.vpgPayrollParamSnapshot.findMany({
    where: { payroll_id: payrollId },
    select: {
      param_key: true,
      param_value: true,
      param_valid_from: true,
      source_decree: true
    },
    orderBy: { param_key: 'asc' }
  });

  return {
    payroll: this.mapToPayroll(payroll),
    snapshot
  };
}
```

### Frontend: Service Method
```typescript
// Source: payrollService.ts — new method
export interface ParamSnapshot {
  param_key: string;
  param_value: string;
  param_valid_from: string;
  source_decree?: string;
}

export const PayrollService = {
  // ... existing methods ...

  async getPayrollSnapshot(payrollId: number): Promise<ParamSnapshot[]> {
    try {
      const response = await http.get(`/payroll/${payrollId}/snapshot`);
      // Expect { payroll, snapshot }
      return response.snapshot || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener parámetros de planilla');
    }
  }
};
```

### Frontend: Collapsible Component
```typescript
// Source: PayrollParamSnapshot.tsx — new component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface ParamSnapshot {
  param_key: string;
  param_value: string;
  param_valid_from: string;
  source_decree?: string;
}

interface PayrollParamSnapshotProps {
  snapshots: ParamSnapshot[];
  isLoading: boolean;
}

export const PayrollParamSnapshot: React.FC<PayrollParamSnapshotProps> = ({ snapshots, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!snapshots || snapshots.length === 0) {
    return null; // No snapshot for historical payrolls
  }

  const groupedByCategory = snapshots.reduce((acc, snap) => {
    const category = snap.param_key.split('_')[0] || 'OTROS';
    if (!acc[category]) acc[category] = [];
    acc[category].push(snap);
    return acc;
  }, {} as Record<string, ParamSnapshot[]>);

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 font-semibold text-gray-900 hover:text-gray-700"
      >
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        Parámetros utilizados en el cálculo
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            {isLoading ? (
              <p className="text-gray-600">Cargando parámetros...</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedByCategory).map(([category, params]) => (
                  <div key={category} className="bg-gray-50 rounded p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-3">{category}</h4>
                    <table className="w-full text-sm">
                      <thead className="text-xs font-semibold text-gray-700">
                        <tr>
                          <th className="text-left pb-2">Parámetro</th>
                          <th className="text-right pb-2">Valor</th>
                          <th className="text-left pb-2">Vigente desde</th>
                          {/* Mostrar Decreto solo si algún param tiene source_decree */}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {params.map((param) => (
                          <tr key={param.param_key}>
                            <td className="py-2 text-gray-900">{param.param_key}</td>
                            <td className="py-2 text-right text-gray-900 font-mono">
                              {Number(param.param_value).toFixed(2)}
                            </td>
                            <td className="py-2 text-gray-600">
                              {new Date(param.param_valid_from).toLocaleDateString('es-CR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Query live params for historical payroll details | Denormalized snapshot in vpg_payroll_param_snapshots | Phase 64 | Decouples calculation audit from current parameter state; enables 7-year CCSS lookback without parameter history table |
| No historical parameter retention | Create snapshot on APROBADA transition | Phase 64 | Immutable record of exact rates/factors used; prevents "I don't know what was calculated with" audits |

**Deprecated/outdated:**
- None — this is a new feature

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `LegalParamService.getActiveParams(date)` returns all active legal parameters at a given date | Standard Stack / Code Examples | If the method signature or behavior changed, snapshot capture logic breaks |
| A2 | Enterprise config (`vpg_enterprise.enterprise_minute_rounding_policy`, etc.) never changes retroactively and is safe to capture at approval time | Common Pitfalls / Pitfall 2 | If enterprise settings are versioned in the future, snapshots may not match actual calculation (known limitation documented in code) |
| A3 | `skipDuplicates: true` in `createMany` prevents errors when re-approving payrolls with existing snapshots | Code Examples | If Prisma changes behavior, re-approvals could fail; alternative is explicit delete + insert |

## Open Questions

1. **Enterprise Config Versioning (Future Phase)**
   - What we know: `vpg_enterprise` has no `validFrom` or historical tracking; we capture current state at approval
   - What's unclear: Should enterprise settings be versioned (like `vpgLegalParam`) for full audit compliance?
   - Recommendation: Document as known limitation; defer to Phase 65+ if CCSS audit requires 7-year enterprise history

2. **Snapshot Deletion on Payroll Reopen**
   - What we know: CONTEXT.md says use `skipDuplicates: true` to avoid duplication
   - What's unclear: Should we explicitly delete old snapshot when reopening, or let `skipDuplicates` handle it?
   - Recommendation: Use `skipDuplicates` (safer, idempotent). Add a comment in code explaining the choice.

3. **Frontend Grouping by Category**
   - What we know: CONTEXT.md shows "tabla agrupada por categoría" but doesn't specify the grouping logic
   - What's unclear: Group by (a) first word of param_key (e.g., CCSS_* → CCSS), (b) custom category map, or (c) no grouping?
   - Recommendation: Use approach (a) — split param_key on first underscore. Simple, extensible, no maintenance overhead.

## Environment Availability

**Step 2.6: SKIPPED** — This phase involves no external dependencies (PostgreSQL is already available; no new CLI tools, services, or runtimes required). Phase purely modifies codebase and database schema via existing tooling (Prisma, Node.js, npm).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (^29.7.0) |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- LegalParamService.test.ts` |
| Full suite command | `npm test` in `src/backend/` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-29 | Snapshot created when payroll approved | Unit | `npm test -- PayrollService.test.ts -t "approvePayroll"` | ✅ (Phase 54) |
| PAY-29 | Snapshot contains legal params at period_start | Unit | `npm test -- PayrollService.test.ts -t "snapshot"` | ❌ Wave 0 |
| PAY-29 | Snapshot contains enterprise config | Unit | `npm test -- PayrollService.test.ts -t "enterprise"` | ❌ Wave 0 |
| PAY-29 | GET /payroll/:id/snapshot returns snapshot | Integration | `npm test -- PayrollController.test.ts -t "snapshot"` | ❌ Wave 0 |
| PAY-29 | Historical payroll without snapshot displays gracefully | Component | Manual (UI testing) or e2e snapshot | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- PayrollService.test.ts -t "approvePayroll"` (verify snapshot capture)
- **Per wave merge:** `npm test` in both `src/backend/` and `src/frontend/` (full suite)
- **Phase gate:** Full suite green + `npx tsc --noEmit` + `npx next lint` before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/services/PayrollService.test.ts` — Add test for `approvePayroll` snapshot capture (legal params + enterprise config)
- [ ] `src/backend/src/__tests__/unit/controller/PayrollController.test.ts` — Add test for `GET /payroll/:id/snapshot` endpoint response shape
- [ ] `src/frontend/src/__tests__/components/PayrollParamSnapshot.test.tsx` — Render + collapse behavior for new component
- [ ] `src/frontend/src/__tests__/hooks/usePayrollDetail.test.ts` (or new file) — Load snapshot alongside payroll data

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | AuthMiddleware.verifyToken on all payroll endpoints (already enforced) |
| V3 Session Management | no | — (session-level, not phase-specific) |
| V4 Access Control | yes | Only authenticated users can view payroll snapshots; snapshots are read-only once captured |
| V5 Input Validation | no | — (snapshot data is read-only; no user input) |
| V6 Cryptography | no | — (no encryption needed; parameters are not sensitive) |

### Known Threat Patterns for {Node.js + Express + Prisma}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized snapshot access | Spoofing / Information Disclosure | Verify JWT token + role-based access (manager/admin only?) before returning snapshot |
| Snapshot tampering via direct DB query | Tampering | Snapshots are immutable once created; schema enforces via no UPDATE on vpg_payroll_param_snapshots |
| Denial of Service via large snapshot queries | Denial of Service | Pagination not needed (snapshots are ~30–50 records per payroll); baseline acceptable |

**No IDOR risk:** Snapshots are per-payroll-id; endpoint `GET /payroll/:id/snapshot` relies on user's authorization to view that payroll (handled by existing AuthMiddleware).

## Sources

### Primary (HIGH confidence)
- CONTEXT.md (64-CONTEXT.md) — Phase 64 specification, schema design, capture logic, UI requirements
- CLAUDE.md — Project architecture, backend/frontend conventions, naming, success criteria
- Existing codebase: `src/backend/src/service/LegalParamService.ts` (verified `getActiveParams` method signature and behavior)
- Existing codebase: `src/backend/src/service/PayrollService.ts` (verified `approvePayroll` structure and patterns)
- Existing codebase: `src/backend/prisma/schema.prisma` (verified table relationships, vpg_enterprise fields)

### Secondary (MEDIUM confidence)
- Code review of Phase 55–57: LegalParamService and EnterpriseService are production-ready; no API changes expected
- Project test patterns: Jest test structure in `src/backend/src/__tests__/unit/services/` — same patterns apply to snapshot tests

### Tertiary (LOW confidence)
- None — all critical claims verified against CONTEXT.md or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All dependencies already in project; no new packages
- Architecture: HIGH — CONTEXT.md spec is detailed; dependencies (LegalParamService, EnterpriseService) are proven
- Pitfalls: HIGH — Enterprise config versioning is documented limitation; common Prisma patterns well-known
- Environment: N/A — No external dependencies

**Research date:** 2026-04-29
**Valid until:** 2026-05-13 (14 days — legal param snapshot logic stable, unlikely to change mid-milestone)
