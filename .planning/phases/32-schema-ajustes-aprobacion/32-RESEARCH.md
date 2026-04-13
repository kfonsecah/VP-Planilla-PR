# Phase 32: Schema — Capa de Ajustes + Campos Aprobación Planilla - Research

**Researched:** 2026-04-12
**Domain:** Database Schema (Prisma/PostgreSQL) - Adjustment Layer & Payroll State Machine
**Confidence:** HIGH

## Summary

The objective is to implement a robust, non-destructive adjustment layer for clock logs and a secure state machine for payroll approval in a Costa Rican labor law context. 

**Primary recommendation:** Use a **Side-car Adjustment Table** (`vpg_clock_log_adjustments`) for clock log corrections/anulations to keep original data immutable, and an **Enum-driven State Machine** for payroll with a dedicated history table for recalculation snapshots.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.14.0 | ORM / Migration | Project standard, robust enum/transaction support. [VERIFIED: backend package.json] |
| PostgreSQL | 15+ | Relational DB | ACID compliance, JSONB support for snapshots. [VERIFIED: schema.prisma] |
| Zod | 4.3.x | Schema Validation | Type-safe validation of adjustments and reasons. [VERIFIED: Phase 31] |

**Installation:**
```bash
npm install zod
npm install -D prisma
```

## Architecture Patterns

### Recommended Project Structure (Schema Additions)
```
src/backend/prisma/
└── schema.prisma         # New tables for adjustments and payroll history
```

### Pattern 1: Side-car Adjustment Table (Non-Destructive)
**What:** Instead of updating `vpg_clock_logs` directly, user edits create a row in `vpg_clock_log_adjustments`.
**When to use:** Whenever original data (audit trail) must be preserved while allowing "Correction" or "Anulation" (soft delete).
**Mechanism:** The "Effective Marks Engine" performs a LEFT JOIN with `vpg_clock_log_adjustments` (filter `status = 'ACTIVE'`) to resolve the current value.

### Pattern 2: Recalculation Snapshots (Payroll History)
**What:** When a payroll in `BORRADOR` status is recalculated, a JSON snapshot of the current `vpg_payroll_employee` records is saved to `vpg_payroll_recalculations`.
**When to use:** To satisfy PLANILLA-06 requirements for traceability of re-calculations without heavy schema duplication.

### Pattern 3: Enum-Driven Payroll State Machine
**What:** Standardizing `payrolls_status` to a specific Enum (`BORRADOR`, `APROBADA`, `PAGADA`).
**When to use:** Ensuring strict transitions and locking logic (e.g., `APROBADA` is read-only).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State Transitions | Custom status string logic | Prisma Enums + Transactions | Type safety and atomic updates. |
| Audit Trail | Custom audit tables per feature | `vpg_audit_logs` | Centralized audit log already exists and should be reused. |
| Timezone Logic | Manual UTC conversion | Prisma Date handling | Prisma handles UTC <-> Date conversion automatically for Postgres `Timestamp`. |

## Common Pitfalls

### Pitfall 1: Multiple Active Adjustments
**What goes wrong:** A log has two "Active" adjustments, causing duplicates in "Effective Marks".
**Prevention:** Implement a `unique` constraint (log_id, status) where status is 'ACTIVE', OR ensure logic always `Inactivates` previous adjustments before adding a new one.

### Pitfall 2: Locking in Approved State
**What goes wrong:** Calculations are accidentally updated while the payroll is in `APROBADA` status.
**Prevention:** Add a `check` constraint or service-level check that prevents updates to `vpg_payroll_employee` if the parent `vpg_payrolls` is not `BORRADOR`.

### Pitfall 3: Re-opening Audit Gap
**What goes wrong:** A payroll is re-opened, but the reason and person who did it aren't tracked.
**Prevention:** Specific audit fields (`payrolls_reopened_at`, `payrolls_reopen_reason`) in the `vpg_payrolls` table.

## Code Examples

### Prisma Schema Definition (Adjustments)
```prisma
// New Enums for Clarity
enum ClockLogAdjustmentType {
  CORRECTION
  ANULATION
}

enum ClockLogAdjustmentStatus {
  ACTIVE
  INACTIVE
}

model vpg_clock_log_adjustments {
  adjustment_id                 Int                      @id @default(autoincrement())
  adjustment_clock_log_id        Int
  adjustment_type                ClockLogAdjustmentType
  adjustment_adjusted_timestamp  DateTime?                @db.Timestamp(6)
  adjustment_adjusted_log_type   ClockLogType?
  adjustment_reason              String                   @db.Text
  adjustment_status              ClockLogAdjustmentStatus @default(ACTIVE)
  adjustment_created_at          DateTime                 @default(now()) @db.Timestamp(6)
  adjustment_created_by          Int
  vpg_clock_logs                 vpg_clock_logs           @relation(fields: [adjustment_clock_log_id], references: [clock_logs_id], onDelete: Cascade)
  vpg_users                      vpg_users                @relation(fields: [adjustment_created_by], references: [user_id])

  @@index([adjustment_clock_log_id, adjustment_status])
}
```

### Prisma Schema Definition (Payroll State Machine)
```prisma
enum PayrollStatus {
  BORRADOR
  APROBADA
  PAGADA
}

model vpg_payroll_recalculations {
  recalc_id                 Int      @id @default(autoincrement())
  recalc_payroll_id         Int
  recalc_reason             String   @db.Text
  recalc_timestamp          DateTime @default(now()) @db.Timestamp(6)
  recalc_created_by         Int
  recalc_data_snapshot      Json     // Snapshot of vpg_payroll_employee results
  vpg_payrolls              vpg_payrolls @relation(fields: [recalc_payroll_id], references: [payrolls_id])

  @@index([recalc_payroll_id])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `payrolls_status` as String | `payrolls_status` as Enum | 2026-04 (v1.5) | Type safety, prevents invalid states. |
| Updating raw marks | Side-car Adjustment table | 2026-04 (v1.5) | Preserves original data for labor law compliance. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Existing `payrolls_status` can be safely mapped to the new Enum. | Runtime State Inventory | Minor data migration required. |
| A2 | Manual marks (Additions) don't need a side-car record initially. | Architecture | Addition logic might be inconsistent with correction logic. |

## Open Questions

1. **How to handle "Additions" (MARCAS-02)?**
   - Recommendation: Insert directly into `vpg_clock_logs` with `source = 'manual'`. Any *subsequent* edit to that manual mark uses the adjustment layer. This keeps the "raw" repository consistent.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Prisma | Schema/Migrations | ✓ | 6.14.0 | — |
| PostgreSQL | Database | ✓ | 15+ | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | `jest.config.js` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MARCAS-03 | Adjustment layer non-destructive | Integration | `npm test src/__tests__/integration/schema/adjustments.test.ts` | ❌ Wave 0 |
| PLANILLA-04 | State machine transitions | Unit | `npm test src/__tests__/unit/services/PayrollService.test.ts` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Check user role before allowing adjustments or approval. |
| V5 Input Validation | yes | Validate adjustment reasons using Zod (min 10 chars). |

### Known Threat Patterns for Prisma/Postgres

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL Injection | Tampering | Prisma uses parameterized queries by default. |
| Race Conditions | Tampering | Use `version` field for optimistic locking on `vpg_clock_logs`. |

## Sources

### Primary (HIGH confidence)
- `src/backend/prisma/schema.prisma` - Current schema inspection.
- `src/backend/package.json` - Version verification.
- `.planning/milestones/v1.5-REQUIREMENTS.md` - Phase requirements.

### Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in project files.
- Architecture: HIGH - Follows industry best practices for non-destructive edits.
- Pitfalls: MEDIUM - Based on common Prisma/Relational patterns.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
