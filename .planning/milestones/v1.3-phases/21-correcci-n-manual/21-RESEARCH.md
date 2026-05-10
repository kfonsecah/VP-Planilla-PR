# Phase 21: Corrección Manual - Research

**Researched:** 2026-04-05
**Domain:** Backend API (Express 5 + TypeScript) - Manual clock log correction with audit trail
**Confidence:** HIGH

## Summary

This phase implements two REST API endpoints for manual correction of clock logs with full auditability. The endpoints are: `POST /api/clock-logs/correct` to create manual clock log entries, and `PATCH /api/clock-logs/:id/status` to change a clock log's status (e.g., to `corrected`) with justification. All actions must be recorded in `vpg_audit_logs` with entity=`clock_log`, action=`manual_correction`, and change details.

The implementation follows established patterns in the codebase: Route → Controller → Service → Prisma, with Zod validation, asyncHandler error wrapping, and AuthMiddleware role protection. The existing `AuditLogsService.createAuditLog()` method provides the audit trail capability. The main integration task is to create new methods in `ClockLogsService` that combine status changes and audit logging, and to wire up the new routes and controller methods.

**Primary recommendation:** Add `createManualLog()` and `updateStatusWithAudit()` methods to ClockLogsService, new controller methods with Zod schemas and admin role protection, and register routes in ClockLogsRoute.ts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | 5.2.1 | HTTP server framework | Already in use; all existing endpoints follow Express 5 patterns |
| TypeScript | 5.8.3 | Static typing | Project uses strict TypeScript across backend and frontend |
| Prisma | 6.14.0 | ORM | Database access layer; schema already defines vpg_clock_logs and vpg_audit_logs |
| Zod | 4.3.6 | Request validation | Used throughout with validateBody middleware |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jest | 29.7.0 | Unit/integration testing | Backend test framework with 338+ existing tests |
| ts-jest | 29.1.2 | TypeScript transformer | Used for running Jest with TypeScript |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | Joi, Yup | Zod is already integrated; no reason to switch |
| Prisma | Drizzle, raw SQL | Prisma migrations and type generation are already set up |
| Jest | Vitest | Jest is already configured with 338+ passing tests |

**Installation:**
```bash
cd src/backend
npm install express@^5.2.1 typescript@^5.8.3 @prisma/client@^6.14.0 zod@^4.3.6
```

**Version verification:**
```bash
npm view express version      # 5.2.1 (confirmed)
npm view typescript version   # 5.8.3 (confirmed)
npm view prisma version       # 6.14.0 (confirmed)
npm view zod version          # 4.3.6 (confirmed)
```

## Architecture Patterns

### Recommended Project Structure
The phase adds code to existing files; no new directories needed.

```
src/backend/
├── src/
│   ├── controller/
│   │   └── ClockLogsController.ts  (+ new methods)
│   ├── service/
│   │   └── ClockLogsService.ts     (+ new methods)
│   ├── routes/
│   │   └── ClockLogsRoute.ts       (+ new endpoints)
│   ├── schemas/
│   │   └── ClockLogSchema.ts       (+ new Zod schemas)
│   └── model/
│       ├── clockLog.ts
│       └── auditLog.ts
```

### Pattern 1: Route Definition with Swagger
**What:** Routes are defined with Express Router, protected by `AuthMiddleware.verifyToken`, optionally with role restriction, and include Swagger documentation blocks.
**When to use:** For all new API endpoints.
**Example:**
```typescript
// Source: src/backend/src/routes/ClockLogsRoute.ts
router.use(AuthMiddleware.verifyToken);
router.post("/clock-logs/orphans/:id/resolve", validateBody(resolveOrphanSchema), asyncHandler((req, res) => controller.resolveOrphan(req, res)));
```

### Pattern 2: Controller Method with Error Handling
**What:** Controller methods are wrapped in `asyncHandler` to catch async errors and pass to Express error middleware. They parse inputs and delegate to service.
**When to use:** All controller methods.
**Example:**
```typescript
// Source: src/backend/src/controller/ClockLogsController.ts
async resolveOrphan(req: Request, res: Response): Promise<Response> {
    try {
        const idParam = req.params.id;
        const orphanId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);
        if (isNaN(orphanId) || orphanId <= 0) {
            return res.status(400).json({ error: 'ID de marca inválido' });
        }
        const { action, justification, complementTimestamp, complementLogType } = req.body as any;
        // ... validation ...
        const service = new ClockLogsService();
        const result = await service.resolveOrphan(orphanId, action, justification, complementData);
        return res.json({ success: true, message: result.message });
    } catch (error: any) {
        if (error.message === 'Marca no encontrada') {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        // ... other specific errors ...
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
```

### Pattern 3: Service Method with Prisma Operations
**What:** Services encapsulate all database operations using the Prisma singleton. They throw errors for the controller to handle.
**When to use:** All business logic and data access.
**Example:**
```typescript
// Source: src/backend/src/service/ClockLogsService.ts
async resolveOrphan(orphanId: number, action: 'assign_complement' | 'discard', justification: string, complementData?: { timestamp: Date; logType: 'IN' | 'OUT' }): Promise<{ success: boolean; message: string }> {
    const orphanLog = await prisma.vpg_clock_logs.findUnique({ where: { clock_logs_id: orphanId } });
    if (!orphanLog) throw new Error('Marca no encontrada');
    if (orphanLog.clock_logs_status !== 'orphan') throw new Error('La marca no tiene status orphan');
    // ... business logic and Prisma operations ...
}
```

### Pattern 4: Audit Logging via AuditLogsService
**What:** Use `AuditLogsService.createAuditLog()` to record any significant user action. Parameters: userId, action, entity, entityId, details.
**When to use:** Whenever a state change occurs that needs traceability.
**Example:**
```typescript
// Pattern to follow from existing code
await AuditLogsService.createAuditLog({
    userId: user.id,
    action: 'manual_correction',
    entity: 'clock_log',
    entityId: clockLogId,
    details: `Changed status from ${oldStatus} to ${newStatus}. Justification: ${justification}`
});
```

### Anti-Patterns to Avoid
- **Never** instantiate PrismaClient directly; always use `import { prisma } from '../lib/prisma'`
- **Never** put business logic in controllers; delegate to service methods
- **Never** omit asyncHandler wrapper on route handlers
- **Never** bypass Zod validation when validateBody middleware is used
- **Never** hardcode user IDs; extract from `req.user` set by AuthMiddleware

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audit trail | Custom logging table or ad-hoc entries | `AuditLogsService.createAuditLog()` | Already implemented, consistent format, indexed for queries |
| Status transitions | Manual field updates without audit | Service method that updates status AND creates audit log | Ensures audit trail is never forgotten |
| User identification | Extract JWT manually in each endpoint | `AuthMiddleware.verifyToken` sets `req.user` | Centralized authentication, token verification, user lookup |
| Input validation | Manual if/else checks | Zod schemas with `validateBody` middleware | Declarative, reusable, automatic error formatting |
| Error handling | Try/catch in every route handler | `asyncHandler` wrapper | DRY error propagation to Express error middleware |
| Pagination | Custom pagination each time | Enforce page >=1, pageSize 1-200 pattern as seen in getOrphans/getAnomalies | Consistent limits, prevents abuse |
| Employee resolution | Reimplement name→ID lookup | Reuse `resolveEmployeeId` helper if needed | Already exists in ClockLogsController for name-based resolution |
| Date parsing | Manual date string handling | `new Date()` with `isNaN()` check | Standard pattern prevents invalid dates |

**Key insight:** The only new logic needed is combining status updates with audit log creation. The audit log service, authentication, validation, and error handling infrastructure already exists and must be reused as shown.

## Runtime State Inventory

This phase is a code/config change only (no rename/refactor, no runtime state migration). No external systems store the new endpoint URLs or field names before implementation.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no rename of existing keys | N/A |
| Live service config | None — no external service configuration changes | N/A |
| OS-registered state | None — no scheduled tasks or daemons affected | N/A |
| Secrets/env vars | None — no new environment variables introduced | N/A |
| Build artifacts | None — pure TypeScript additions | N/A |

**Nothing found in categories:** All categories explicitly verified — this phase introduces new functionality only, no state migration required.

## Common Pitfalls

### Pitfall 1: Forgetting to Create Audit Log
**What goes wrong:** The status changes but no audit record is created, breaking compliance and traceability.
**Why it happens:** Developer updates the clock log without remembering to call `AuditLogsService.createAuditLog()`.
**How to avoid:** Create a service method that does both in the same transaction (Prisma `$transaction` if needed) so audit log is inseparable from the change.
**Warning signs:** Manual testing shows audit_logs table unchanged after status update.

### Pitfall 2: Missing Admin Authorization
**What goes wrong:** Any authenticated user can perform manual corrections, not just admins.
**Why it happens:** Route uses `AuthMiddleware.verifyToken` but not `AuthMiddleware.requireRole(['admin'])`.
**How to avoid:** Apply `AuthMiddleware.requireRole(['admin'])` to both new endpoints; add Swagger note about admin-only.
**Warning signs:** Integration test with non-admin user succeeds unexpectedly.

### Pitfall 3: Losing User Identity
**What goes wrong:** Audit logs record user_id = 1 or null instead of the actual admin performing the action.
**Why it happens:** Extracting user ID incorrectly from `req.user`. The pattern is `(req as any).user?.id ?? (req as any).user?.user_id`.
**How to avoid:** Follow the pattern used in `ClockLogsController.import()` line 212: `const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;`
**Warning signs:** All manual corrections show the same user in audit logs regardless of who performed them.

### Pitfall 4: Invalid Status Values
**What goes wrong:** Accepting arbitrary status strings that aren't in the `ClockLogStatus` enum (pending, valid, anomaly, corrected, orphan).
**Why it happens:** Controller doesn't validate status value against allowed set.
**How to avoid:** In the status PATCH endpoint, accept only specific statuses (initially only `corrected` based on requirements). Use Zod enum validation or explicit check with 400 response.
**Warning signs:** Database rejects update due to constraint violation.

### Pitfall 5: Manual Log Without Source='manual'
**What goes wrong:** Manual correction logs created with wrong source (defaults to java_import or excel_import).
**Why it happens:** Forgetting to explicitly set `clock_logs_source: 'manual'` when creating manual entries.
**How to avoid:** In service method for manual creation, always set source to `'manual'` and status to `'valid'` (unless business rules say otherwise). Verify with tests.
**Warning signs:** Querying logs by source doesn't show manual entries correctly.

### Pitfall 6: Justification Missing or Too Long
**What goes wrong:** Empty justification or overly long text breaks UI display or violates data constraints.
**Why it happens:** No validation on justification string.
**How to avoid:** Zod schema: `justification: z.string().min(1, 'Required').max(500)` (as seen in `resolveOrphanSchema` line 19).
**Warning signs:** Audit log details are empty or truncated unexpectedly.

## Code Examples

Verified patterns from existing source code.

### Example 1: Creating a Manual Clock Log (service method)
```typescript
// Source: Adapted from ClockLogsService.bulkCreate and resolveOrphan patterns
async createManualLog(params: {
    employee_id: number;
    timestamp: Date;
    log_type: 'IN' | 'OUT';
    remarks?: string | null;
    created_by: number; // user ID from JWT
    justification: string;
}): Promise<{ success: boolean; clockLogId: number }> {
    // Create the manual log with source='manual', status='valid'
    const log = await prisma.vpg_clock_logs.create({
        data: {
            clock_logs_employee_id: params.employee_id,
            clock_logs_timestamp: params.timestamp,
            clock_logs_log_type: params.log_type,
            clock_logs_remarks: params.remarks,
            clock_logs_status: 'valid',
            clock_logs_source: 'manual',
            clock_logs_version: 1,
            clock_logs_import_session_id: null, // manual not tied to import
        },
        include: { vpg_employees: true } // for potential audit detail
    });

    // Create audit log entry
    await AuditLogsService.createAuditLog({
        userId: params.created_by,
        action: 'manual_correction',
        entity: 'clock_log',
        entityId: log.clock_logs_id,
        details: `Created manual ${params.log_type} for employee ${params.employee_id}. Justification: ${params.justification}`
    });

    return { success: true, clockLogId: log.clock_logs_id };
}
```

### Example 2: Updating Clock Log Status with Audit (service method)
```typescript
// Source: Pattern from ClockLogsService.resolveOrphan (lines 284-290, 322-328) plus AuditLogsService
async updateClockLogStatus(params: {
    clockLogId: number;
    newStatus: 'corrected' | 'valid' | 'orphan' | 'anomaly'; // as needed
    justification: string;
    changed_by: number; // user ID from JWT
}): Promise<{ success: boolean }> {
    // Fetch existing log to capture old status for audit
    const existing = await prisma.vpg_clock_logs.findUnique({
        where: { clock_logs_id: params.clockLogId }
    });
    if (!existing) throw new Error('Marca no encontrada');

    const oldStatus = existing.clock_logs_status;

    // Update status and optionally remarks
    await prisma.vpg_clock_logs.update({
        where: { clock_logs_id: params.clockLogId },
        data: {
            clock_logs_status: params.newStatus,
            // Optionally append justification to remarks (preserve existing?)
            clock_logs_remarks: params.justification
        }
    });

    // Create audit log
    await AuditLogsService.createAuditLog({
        userId: params.changed_by,
        action: 'manual_correction',
        entity: 'clock_log',
        entityId: params.clockLogId,
        details: `Changed status from ${oldStatus} to ${params.newStatus}. Justification: ${params.justification}`
    });

    return { success: true };
}
```

### Example 3: Zod Schema for Status Update
```typescript
// Source: Adapted from ClockLogSchema.resolveOrphanSchema (lines 17-30)
import { z } from 'zod';

export const updateClockLogStatusSchema = z.object({
    status: z.enum(['corrected']), // Phase 21 only requires corrected; may expand later
    justification: z.string().min(1, 'La justificación es requerida').max(500),
});
```

### Example 4: Route Registration with Admin Role
```typescript
// Source: ClockLogsRoute.ts (use of AuthMiddleware.requireRole) and UserRoute.ts (pattern)
import { AuthMiddleware } from '../middleware/AuthMiddleware';

// Require admin for manual correction endpoints
router.post(
    "/clock-logs/correct",
    AuthMiddleware.requireRole(['admin']),
    validateBody(createManualLogSchema),
    asyncHandler((req, res) => controller.createManualLog(req, res))
);

router.patch(
    "/clock-logs/:id/status",
    AuthMiddleware.requireRole(['admin']),
    validateBody(updateClockLogStatusSchema),
    asyncHandler((req, res) => controller.updateClockLogStatus(req, res))
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc corrections with no audit | Mandatory audit log entry per action | This phase (21) | Full traceability for compliance |
| Manual log creation through bulk endpoint only | Dedicated manual correction endpoint with explicit justification | This phase (21) | Simplified UI/UX, clearer intent, better audit |
| Status transitions via direct DB updates (hypothetical) | Status changes always accompanied by audit trail | This phase (21) | Prevents silent changes; all modifications recorded |

**Deprecated/outdated:**
- None — this phase introduces new functionality only. No deprecated patterns to avoid.

## Open Questions

1. **Should manual creation also allow selecting an existing import_session_id?**
   - What we know: The `vpg_clock_logs` table has nullable `clock_logs_import_session_id`. Phase 19 linked imported logs to sessions.
   - What's unclear: Manual logs are conceptually outside import sessions, but could be linked for reporting. Current requirements don't specify linking.
   - Recommendation: Set `import_session_id = null` for manual logs. Simplicity and clear separation of concerns.

2. **What validation should be applied to the PATCH endpoint to prevent changing status on non-correctable logs?**
   - What we know: Requirements say "cambia el status de una marca a corrected o la descarta". The endpoint is general status change but requirement focuses on correcting anomalies/orphans.
   - What's unclear: Should any log be patchable? Or only those with status anomaly/orphan/pending?
   - Recommendation: Allow status change to `corrected` on any log that isn't already `corrected`. Keep it simple; if stricter rules needed, they can be added in a future phase.

3. **Should the manual creation endpoint also accept employee_name (text) in addition to employee_id?**
   - What we know: The `bulkCreate` endpoint already supports `employee_id` OR `employee_name` resolution via `resolveEmployeeId` helper.
   - What's unclear: Is name-resolution needed for single manual log creation? It would be convenient for UI.
   - Recommendation: Support both `employee_id` and `employee_name` (exclusive OR) using the existing `resolveEmployeeId` pattern for consistency. Validate exactly one is provided.

## Environment Availability

All required dependencies are present in the backend project; no external services or tools needed for this code-only phase.

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22.14.0 | — |
| npm | Package manager | ✓ | 10.x | — |
| PostgreSQL | Database | ✓ | (existing) | — |
| TypeScript | Compilation | ✓ | 5.8.3 | — |
| Jest | Testing | ✓ | 29.7.0 | — |

**Missing dependencies:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 with ts-jest 29.1.2 |
| Config file | `src/backend/jest.config.js` (exists) |
| Quick run command | `npm test -- --testPathPattern=ClockLogs` (runs controller/service tests) |
| Full suite command | `npm test` (all 338+ tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CORRECT-01 | POST /clock-logs/correct creates manual log with source=manual, user, justification | unit | `npm test -- --testNamePattern="createManualLog"` | ❌ Wave 0 |
| CORRECT-02 | PATCH /clock-logs/:id/status changes status to corrected/discard with justification | unit | `npm test -- --testNamePattern="updateClockLogStatus"` | ❌ Wave 0 |
| CORRECT-03 | All corrections create vpg_audit_logs entry with entity=clock_log, action=manual_correction | unit | `npm test -- --testNamePattern="AuditLog"` (existing) + new | ✅ / ❌ Wave 0 |
| (Admin auth) | Both endpoints require admin role | integration/unit | `npm test -- --testNamePattern="requireRole"` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts` — add tests for new controller methods (`createManualLog`, `updateClockLogStatus`)
- [ ] `src/backend/src/__tests__/unit/services/ClockLogsService.test.ts` — add tests for new service methods (createManualLog, updateClockLogStatus) including audit log creation verification
- [ ] Tests for admin role enforcement on the new routes (can reuse existing pattern from UserController tests)
- [ ] Integration tests for full request→service→audit flow (may be added in later test expansion)

**Wave 0 test files already exist for related functionality:** ClockLogsController.test.ts and ClockLogsService.test.ts are present; this phase will extend them with new test cases.

## Sources

### Primary (HIGH confidence)
- `src/backend/src/controller/ClockLogsController.ts` — existing endpoint implementations and patterns
- `src/backend/src/service/ClockLogsService.ts` — service layer patterns, bulkCreate, resolveOrphan
- `src/backend/src/service/AuditLogsService.ts` — audit log creation method
- `src/backend/src/middleware/AuthMiddleware.ts` — authentication and role-based authorization
- `src/backend/src/schemas/ClockLogSchema.ts` — Zod validation patterns
- `src/backend/prisma/schema.prisma` — vpg_clock_logs and vpg_audit_logs table definitions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirement definitions CORRECT-01,02,03 (primary source for scope)
- `.planning/STATE.md` — accumulated context about Phase 20 completion and existing implementations

### Tertiary (LOW confidence)
- None needed for this phase; implementation is based on existing internal patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm, all dependencies present
- Architecture: HIGH — patterns established in codebase, directly copied from existing files
- Pitfalls: HIGH — based on observed patterns and gap analysis (e.g., resolveOrphan currently lacks audit logging, which this phase will not retroactively fix but must avoid in new code)
- Validation architecture: MEDIUM — test files exist and will be extended, but specific new test cases not yet written

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for stable codebase patterns)
