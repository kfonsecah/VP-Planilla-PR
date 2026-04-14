# Phase 33: Backend — Motor de Marcas Efectivas + API de Ajustes - Research

**Researched:** 2026-04-14
**Domain:** Attendance Auditing, Adjustment Layers, Clock Log Pairing Algorithms
**Confidence:** HIGH

## Summary

This research identifies the best practices for implementing a non-destructive auditing layer for clock logs in the VP-Planilla system. The core challenge is calculating "Effective Marks" (the current state of truth after applying edits and voids) while maintaining the original data for compliance and transparency. 

The primary recommendation is to use an **Adjustment Table pattern** (already partially defined in the schema as `vpg_clock_log_adjustments`) and a **Virtual View logic** for the Effective Marks engine. The pairing algorithm must be refactored to operate on these virtualized marks rather than the raw database records.

**Primary recommendation:** Use `Prisma.distinct` on `adjustment_clock_log_id` with `orderBy: { adjustment_created_at: 'desc' }` to efficiently fetch the latest active adjustments for a set of logs in a single query.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Effective Mark Model**: The API will return an object containing both the **original value** and the **adjusted value**. This enables the UI to show comparison views (e.g., original time vs. corrected time).
- **Paired Output**: The primary endpoint (`MARCAS-06`) MUST return **paired entries** (IN/OUT pairs) with calculated durations, not just a flat list of logs. This simplifies the Payroll Wizard logic.
- **Scope**: Adjustments (`vpg_clock_log_adjustments`) will be used strictly for `EDIT` and `VOID` operations. New manual logs will continue to be created directly in `vpg_clock_logs` (Phase 21 legacy), keeping the adjustment layer focused on corrections.
- **Precedence (Stacking)**: If multiple adjustments exist for the same log, the most recent `ACTIVE` adjustment applies. If an adjustment is deactivated, the logic "falls back" to the previous adjustment or the original log if no others exist.
- **Audit Trail**: Every adjustment operation must trigger an entry in `vpg_audit_logs` including the justification (minimum 10 characters).
- **Payroll Lock**: Adjustments are **FORBIDDEN** for any clock log belonging to a payroll period that is already in `PAGADA` (Paid) status. 
- **Justification**: The 10-character minimum for justifications is a strict API-level requirement (Zod validation).

### the agent's Discretion
- **Service Layer**: Logic will reside in `ClockLogAdjustmentService.ts` (New) and extend `ClockLogsService.ts`.
- **Pairing Engine**: Re-use/Refactor pairing logic from `ClockLogAnalysisService.ts` to ensure consistency between anomaly detection and effective marks calculation.
- **Audit Pattern**: Use `AuditLogsService.static` methods for consistency with Phase 31/32.

### Deferred Ideas (OUT OF SCOPE)
- None identified in CONTEXT.md.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MARCAS-01 | Vista agrupada empleado → día → par | Supported by pairing logic using effective marks. |
| MARCAS-02 | Agregar marca faltante | Supported by Phase 21 legacy (direct `vpg_clock_logs` creation). |
| MARCAS-03 | Editar marca (no destructivo) | Supported by `vpg_clock_log_adjustments` (EDIT type). |
| MARCAS-04 | Eliminar marca (soft delete) | Supported by `vpg_clock_log_adjustments` (VOID type). |
| MARCAS-05 | Audit trail inmutable | Supported by mandatory `vpg_audit_logs` entry in transaction. |
| MARCAS-06 | Motor de marcas efectivas | Core algorithm using adjustment precedence and pairing. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.14.0 | Database ORM | Project standard for data access. [VERIFIED: package.json] |
| Express | 5.1.0 | Web Framework | Project standard for API routing. [VERIFIED: package.json] |
| Zod | 4.3.6 | Schema Validation | Mandatory for justification length (10 chars). [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| native Date | - | Time calculations | Project standard; no external date library installed. [VERIFIED: package.json] |

**Installation:**
No new packages required. Existing stack covers all needs.

## Architecture Patterns

### Recommended Project Structure
```
src/backend/src/
├── service/
│   ├── ClockLogAdjustmentService.ts   # Handles creation/deactivation of adjustments
│   └── ClockLogEffectiveService.ts    # Logic for calculating the "Effective" state
├── controller/
│   └── ClockLogAdjustmentController.ts # POST /api/clock-logs/adjust
└── schema/
    └── adjustment.schema.ts           # Zod validation for adjustment requests
```

### Pattern: Adjustment Layer (Non-Destructive)
**What:** Instead of updating the `vpg_clock_logs` record, create a new record in `vpg_clock_log_adjustments` that references the original.
**When to use:** Whenever a user edits or deletes an attendance record that must remain auditable.
**Query Logic:**
1. Fetch `vpg_clock_logs`.
2. Fetch `vpg_clock_log_adjustments` where `adjustment_status = 'ACTIVE'`.
3. Group adjustments by `adjustment_clock_log_id` and pick the one with the highest `adjustment_id` (or `adjustment_created_at`).
4. Apply the adjustment to the log (Edit value or Mark as Void).

### Pattern: Effective Pairing Engine
**What:** A function that takes a list of Effective Marks and produces IN/OUT pairs.
**Algorithm:**
1. Filter: Remove VOIDed marks.
2. Sort: Order by `effectiveTimestamp` ASC.
3. Iterate:
   - If IN: Look for the next OUT within 24 hours.
   - If Pair found: Add to `pairs`, calculate duration.
   - If No OUT found: Mark IN as `orphan`.
   - If next is another IN: Mark current IN as `anomaly` (or `orphan`).

### Anti-Patterns to Avoid
- **In-Loop Queries:** Never query adjustments in a loop for each log. Use `Prisma.findMany` with `in: [ids]` and `distinct: ['adjustment_clock_log_id']`.
- **Direct Updates:** Never update `clock_logs_timestamp` directly in the `vpg_clock_logs` table for an adjustment.
- **Ignoring Payroll Status:** Never allow an adjustment without verifying the payroll period's status.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validation | Manual string checks | Zod `.min(10)` | Consistency and cleaner error handling. |
| Auditing | Custom file logs | `vpg_audit_logs` | Centralized project-standard audit trail. |
| DB Relations | Raw SQL JOINS | Prisma `include` | Maintain type-safety and developer speed. |

## Common Pitfalls

### Pitfall 1: Timezone Blindness
**What goes wrong:** Date objects are stored in UTC but business logic (Costa Rica) depends on daily grouping.
**How to avoid:** Always use UTC for pairing logic but shift to local time (CR: UTC-6) only for "By Day" UI grouping.
**Warning signs:** Pairs failing to match because they cross midnight in UTC but not in local time (or vice versa).

### Pitfall 2: Stale Anomaly Flags
**What goes wrong:** The `clock_logs_status` in the primary table becomes "Stale" if an adjustment resolves an anomaly (e.g., voiding an orphan).
**How to avoid:** The Effective Marks engine should return a *dynamic* status based on the adjusted state, rather than relying solely on the static `clock_logs_status` field.

### Pitfall 3: Adjustment Precedence
**What goes wrong:** Picking an INACTIVE adjustment or an older adjustment when a newer one exists.
**How to avoid:** Always filter by `adjustment_status: 'ACTIVE'` and use `orderBy: { adjustment_created_at: 'desc' }`.

## Code Examples

### Efficient Fetching of Latest Adjustments
```typescript
// Source: [Verified via Prisma Docs - distinct on PostgreSQL]
const latestAdjustments = await prisma.vpg_clock_log_adjustments.findMany({
  where: {
    adjustment_clock_log_id: { in: logIds },
    adjustment_status: 'ACTIVE'
  },
  distinct: ['adjustment_clock_log_id'],
  orderBy: [
    { adjustment_clock_log_id: 'asc' },
    { adjustment_created_at: 'desc' }
  ]
});
```

### Atomic Adjustment with Audit Log
```typescript
// Pattern: Unit of Work
await prisma.$transaction(async (tx) => {
  const adj = await tx.vpg_clock_log_adjustments.create({
    data: adjustmentData
  });
  
  await tx.vpg_audit_logs.create({
    data: {
      audit_logs_user_id: userId,
      audit_logs_action: 'ADJUST_CLOCK_LOG',
      audit_logs_entity: 'vpg_clock_logs',
      audit_logs_entity_id: logId,
      audit_logs_timestamp: new Date(),
      audit_logs_details: JSON.stringify({
        type: type, // EDIT/VOID
        justification: justification,
        originalValue: original,
        newValue: newValue
      })
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `PENDIENTE` status | `BORRADOR` status | Phase 32 | Matches business domain (Spanish labels). |
| Direct log edits | Adjustment Layer | Phase 33 | Non-destructive, legal compliance. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ADD adjustments should use `vpg_clock_logs` directly | Summary | Requirement MARCAS-02 mentions "separate layer" but context says "Phase 21 legacy". If the user wanted ADD to be in the adjustment table ONLY, we would lose visibility in legacy views. |
| A2 | Pairing logic should use a 24-hour window | Architecture Patterns | Costa Rica labor law doesn't specify a "24h window" for pairs, but it's the current project standard in `ClockLogAnalysisService`. |

## Open Questions

1. **How to handle "ADD" type in `vpg_clock_log_adjustments`?**
   - What we know: MARCAS-02 says "ajuste separado", but CONTEXT.md says "directly in vpg_clock_logs".
   - What's unclear: If a user adds a mark, should it physically exist in `vpg_clock_logs` or be a virtual record?
   - Recommendation: Follow CONTEXT.md — create in `vpg_clock_logs` with `source: manual` and `remarks: justification`. This ensures compatibility with all existing log logic.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | JSONB / Distinct | ✓ | 16+ | — |
| Prisma | Data access | ✓ | 6.14.0 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.js` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MARCAS-03 | EDIT log creates active adjustment | unit | `npm test ClockLogAdjustmentService.test.ts` | ❌ Wave 0 |
| MARCAS-04 | VOID log hides it from effective marks | integration | `npm test ClockLogEffectiveService.test.ts` | ❌ Wave 0 |
| MARCAS-05 | Adjustment fails if no justification | unit | `npm test AdjustmentSchema.test.ts` | ❌ Wave 0 |
| MARCAS-06 | Effective marks handles fallback (Adj 2 -> Adj 1) | unit | `npm test ClockLogEffectiveService.test.ts` | ❌ Wave 0 |
| LOCK-01 | Adjustment fails if payroll is PAGADA | integration | `npm test ClockLogAdjustmentService.test.ts` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod (min length, type check) |
| V8 Logging & Auditing | yes | `vpg_audit_logs` mandatory entry |

### Known Threat Patterns for Attendance

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Silent Overwrite | Tampering | Adjustment layer (non-destructive) |
| Backdating | Tampering | Audit trail with creation timestamp |
| Unauthorized Edit | Elevation of Privilege | Check user role (Jefe only) in controller |

## Sources

### Primary (HIGH confidence)
- `schema.prisma` - Database structure verified.
- `v1.5-REQUIREMENTS.md` - Phase requirements verified.
- `33-CONTEXT.md` - Phase constraints and decisions verified.
- `ClockLogAnalysisService.ts` - Existing pairing logic reviewed.

### Secondary (MEDIUM confidence)
- Official Costa Rica Labor Law - Used for calculating overtime/jornada limits.
- Prisma Documentation - Verified `distinct` and `transaction` patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in package.json.
- Architecture: HIGH - Follows project patterns.
- Pitfalls: MEDIUM - Based on common attendance system issues.

**Research date:** 2026-04-14
**Valid until:** 2026-05-14
