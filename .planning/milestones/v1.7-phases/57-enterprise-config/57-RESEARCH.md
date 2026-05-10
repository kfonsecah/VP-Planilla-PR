# Phase 57: Enterprise Config — Campos Faltantes - Research

**Researched:** 2026-04-26
**Domain:** Enterprise Configuration & Compliance
**Confidence:** HIGH

## Summary

This phase extends the `vpg_enterprise` model to include critical operational settings required by the calculation engine: minute rounding policies, shift types, and commercial activity flags. The research identifies that while "rounding policies" are standard in international payroll software, they are **highly restricted in Costa Rica**, requiring a mandatory legal disclaimer and audit trail when bidireccional rounding (NEAREST_QUARTER) is selected.

**Primary recommendation:** Implement a "High-Stakes" confirmation flow for `NEAREST_QUARTER` policy and use a singleton service pattern for Enterprise configuration to ensure data consistency.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Config Schema | Database | — | Prisma Enums and standard table extension. |
| Business Logic | Backend API | — | `EnterpriseService` handles persistence and audit logging. |
| Validation | Backend API | Frontend | Ensure shift types and policies are valid Enum values. |
| Compliance UI | Frontend | — | Modal disclaimer and acknowledgment flow before `PATCH`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.14.0 | Database ORM | Handles migrations and type-safe enums. [VERIFIED: package.json] |
| Express | 5.1.0 | API Framework | Standard for project controllers and routes. [VERIFIED: gemini.md] |
| Zod | ^3.24 | Schema Validation | Type-safe validation for incoming PATCH payloads. [VERIFIED: frontend schemas] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Lucide React | Latest | UI Icons | Settings and warning icons in the configuration panel. |

**Installation:**
```bash
# No new packages required.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── backend/src/
│   ├── controller/EnterpriseController.ts
│   ├── service/EnterpriseService.ts
│   └── routes/enterpriseRoutes.ts
└── frontend/src/
    ├── app/pages/configuracion/empresa/page.tsx
    ├── components/LegalRoundingModal.tsx
    └── services/enterpriseService.ts
```

### Pattern 1: Singleton Configuration Update
Since `vpg_enterprise` represents a single entity, the `PATCH` endpoint should always target the first (and usually only) record in the table.

```typescript
// Backend Service Pattern
static async updateConfig(data: UpdateEnterpriseDto, userId: number) {
  const enterprise = await prisma.vpg_enterprise.findFirst();
  if (!enterprise) throw new Error("Enterprise not found");

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.vpg_enterprise.update({
      where: { enterprise_id: enterprise.enterprise_id },
      data,
    });

    // Audit changes
    await AuditLogsService.createAuditLog({
      userId,
      action: 'UPDATE_CONFIG',
      entity: 'vpg_enterprise',
      entityId: updated.enterprise_id,
      details: JSON.stringify(data)
    }, tx);

    return updated;
  });
}
```

### Anti-Patterns to Avoid
- **Hardcoded IDs:** Do not assume `enterprise_id = 1`. Always use `findFirst()` or retrieve the ID from the current session/database state.
- **Silent Rounding:** Never allow changing the rounding policy to `NEAREST_QUARTER` without a persistent `vpg_audit_logs` entry of the user's acknowledgment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audit Logging | Custom JSON file | `AuditLogsService` | The project already has a standardized audit log table and service. |
| Modal Logic | Raw `useState` modals | `Dialog` (Shadcn/UI) | Consistency with existing "VoidClockLog" and "AddEmployee" modals. |

## Common Pitfalls

### Pitfall 1: Costa Rica Labor Compliance (Rounding)
**What goes wrong:** Rounding minutes "down" (e.g., 424 -> 420) is illegal in CR if not explicitly allowed by a `Reglamento Interior de Trabajo` and it results in underpayment of effective time.
**How to avoid:** The UI **must** show a disclaimer. The calculation motor (Phase 58) will rely on the `enterprise_minute_rounding_policy` flag, so the "Agreement" must be stored in DB (`enterprise_rounding_policy_acknowledged`).

### Pitfall 2: Postgres Enum Migrations
**What goes wrong:** Adding values to Enums in Postgres cannot happen inside a transaction.
**Prevention:** Prisma handles this in `migrate dev` by creating non-transactional SQL. Ensure no other manual SQL is added to the migration that requires a transaction.

## Code Examples

### Prisma Schema Extension
```prisma
enum MinuteRoundingPolicy {
  EXACT
  ALWAYS_UP
  NEAREST_QUARTER
}

enum ShiftType {
  DIURNA
  MIXTA
  NOCTURNA
}

model vpg_enterprise {
  // ... existing fields
  enterprise_minute_rounding_policy        MinuteRoundingPolicy @default(EXACT)
  enterprise_rounding_policy_acknowledged  Boolean             @default(false)
  enterprise_is_commercial_activity        Boolean             @default(false)
  enterprise_ordinary_shift_type           ShiftType           @default(DIURNA)
}
```

### Legal Disclaimer Text (CR Compliance)
> **Aviso Legal:** La política de redondeo bidireccional (NEAREST_QUARTER) puede resultar en el impago de minutos efectivamente laborados. En Costa Rica, el tiempo efectivo de trabajo es irrenunciable. Se recomienda contar con un Reglamento Interior de Trabajo aprobado por el MTSS antes de activar esta opción.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded logic | Enum-driven policy | Phase 57 | Calculation engine becomes configurable without code changes. |
| Manual DB edits | Admin UI Config | Phase 57 | Safer operations for non-technical admins. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Only one enterprise record exists | Summary | Multiple enterprises would require multi-tenant logic (out of scope). |
| A2 | NEAREST_QUARTER refers to 15m | Summary | If it refers to 10m or 30m, the motor logic (Phase 58) will change. |

## Open Questions (RESOLVED)

1. **How should `enterprise_image` (Bytes) be handled in the PATCH?**
   - Recommendation: The `PATCH` should allow partial updates. If `enterprise_image` is missing from the payload, it remains unchanged.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Prisma CLI | Migrations | ✓ | 6.14.0 | — |
| Node.js | Backend | ✓ | 22.14.0 | — |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod validation for all config fields. |
| V8 Logging | yes | All configuration changes MUST be logged in `vpg_audit_logs`. |

### Known Threat Patterns for Configuration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized Config Change | Spoofing | AuthMiddleware + Role Check (Admin only). |
| Data Tampering | Tampering | Audit logs with `entity_id` and `details`. |

## Sources

### Primary (HIGH confidence)
- `src/backend/prisma/schema.prisma` - Existing model structure.
- `Costa Rica Labor Code` - Effective work time principles. [CITED: MTSS DAJ-AE-113-09]
- `Gusto/ADP Payroll standard` - 15-minute rounding patterns. [ASSUMED]

### Secondary (MEDIUM confidence)
- `Prisma Docs` - Enum migration patterns for Postgres. [VERIFIED: prisma docs]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core project tech.
- Architecture: HIGH - Follows existing Service/Controller pattern.
- Pitfalls: HIGH - CR Labor law research confirmed.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26
