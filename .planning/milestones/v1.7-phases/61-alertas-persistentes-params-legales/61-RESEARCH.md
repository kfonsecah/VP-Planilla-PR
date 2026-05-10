# Phase 61: Alertas Persistentes Parámetros Legales — Research

**Researched:** 2026-04-28
**Domain:** Notification persistence, acknowledgment workflow, Prisma migration, backend service extension, React dashboard banner
**Confidence:** HIGH

---

## Summary

Phase 61 adds a persistent alert mechanism to the existing notification system. When a legal parameter (`vpg_legal_params`) is changed via `LegalParamService.upsertParam`, the system must generate a `LEGAL_PARAM_CHANGE`-typed notification for every active admin and payroll_manager user, keep it visible until an admin explicitly acknowledges it, and surface it as a banner on the dashboard and as a differentiated icon in the notification bell.

The existing `vpg_notifications` table is missing three columns required by this phase: `notifications_requires_acknowledgment` (Boolean), `notifications_acknowledged_by` (Int, nullable FK to `vpg_users`), and `notifications_acknowledged_at` (DateTime, nullable). The `notifications_type` field already exists as a `VarChar(30)` and simply needs the `LEGAL_PARAM_CHANGE` string value to be accepted — no enum migration is required.

The existing `NotificationService`, `NotificationController`, and `NotificationRoute` all need extension rather than replacement. The backend needs one new service method (`createLegalParamAlert`), two new endpoints (`PATCH /notifications/:id/acknowledge` and `GET /notifications` with `type` and `unacknowledged` query filters), and a post-upsert hook in `LegalParamService.upsertParam`. The frontend needs a new `LegalParamAlertBanner` component on `main/page.tsx`, badge inline in `configuracion/empresa/page.tsx`, differentiated icon in `NotificationPanel.tsx`, and an informational banner inside the payroll wizard step 1.

**Primary recommendation:** Extend the notifications table with three new columns via a Prisma migration, then layer the acknowledge workflow cleanly on top of the existing service/controller/route structure without touching the existing read/mark-as-read paths.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Campos nuevos en `vpg_notifications`: `requires_acknowledgment`, `acknowledged_by`, `acknowledged_at`, `notification_type` (nuevo tipo: `LEGAL_PARAM_CHANGE`)
- Migración Prisma requerida para esos campos
- `LegalParamService.upsertParam` dispara `NotificationService.createLegalParamAlert` post-save
- `NotificationService.createLegalParamAlert` crea notificaciones para todos los admins/payroll_managers activos
- Mensajes específicos por parámetro desactivado (tabla en CONTEXT.md)
- Detección de planillas BORRADOR: contar `vpg_payrolls` con status = `BORRADOR` e incluir en el mensaje
- Endpoint `PATCH /notifications/:id/acknowledge` (solo admin)
- Endpoint `GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true`
- Frontend: banner persistente en dashboard (`main/page.tsx`)
- Frontend: campana diferenciada para tipo `LEGAL_PARAM_CHANGE` (en `NotificationPanel.tsx`)
- Frontend: badge rojo "DESACTIVADO — Riesgo legal" en parámetros FEATURE_FLAG con valor 0
- Frontend: banner en wizard paso 1 si params cambiaron después de crear la planilla
- `acknowledged_by` debe ser el userId del admin que marcó, no el que hizo el cambio
- Usuario que hizo el cambio recibe notificación de confirmación separada (sin `requires_acknowledgment`)

### Claude's Discretion
- Nombre y ubicación exactos del hook frontend para las alertas del dashboard
- Estrategia de polling (frecuencia, separar del polling de unread-count existente o reutilizarlo)
- Formato exacto de visualización de múltiples alertas colapsadas
- Decisión de si el GET de alertas legales va dentro de `useNotifications` extendido o un hook separado `useLegalParamAlerts`

### Deferred Ideas (OUT OF SCOPE)
- Re-confirmación con contraseña al modificar (Fase 62)
- Panel completo de administración (Fase 63)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-26 | Cada cambio a vpg_legal_params genera alerta persistente en dashboard visible para admins hasta ser marcada como revisada. Mensajes específicos por parámetro desactivado. | Migration adds acknowledgment fields; LegalParamService.upsertParam triggers NotificationService.createLegalParamAlert; PATCH /acknowledge endpoint; GET with filters; dashboard LegalParamAlertBanner component |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Generate alert on param change | API / Backend | — | Side-effect of LegalParamService.upsertParam, must run server-side |
| Fan-out to all admins/payroll_managers | API / Backend | — | Requires a DB query for all target users — cannot be done in browser |
| Persist acknowledgment | API / Backend | Database | PATCH endpoint updates nullable fields on vpg_notifications |
| Serve unacknowledged alerts to dashboard | API / Backend | — | GET /notifications with query filters |
| Dashboard banner visibility | Frontend Server (SSR) | Browser / Client | "use client" Next.js page, component fetches on mount |
| Bell icon differentiation | Browser / Client | — | Driven by notification type field already in API response |
| DESACTIVADO badge | Browser / Client | — | Pure UI conditional, no new data fetch needed |
| Wizard step 1 banner | Browser / Client | — | Reads from hook state, compares param change timestamp to payroll creation date |

---

## Standard Stack

### Core (all already installed in project)
[VERIFIED: codebase grep]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.14.0 | DB migration + ORM | Project standard — all DB access goes through Prisma |
| Express 5 | 5.1.0 | API routing | Project standard |
| framer-motion | ^12.x | AnimatePresence for banner entry/exit | Project standard for modals and animated components |
| @heroicons/react | 24/outline | Icons in banner, bell badge | Project standard — all pages use this library |
| sonner | installed (used in useLegalParamConfig) | Toast feedback on acknowledge | Project standard for toast notifications |
| react-hook-form + zodResolver | ^7.62.0 | Forms in existing hooks | Not needed for this phase's new components, but used in companion hooks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest-mock-extended | installed | Prisma mock in tests | Used in all existing service tests — follow same pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma migration for new columns | Raw SQL | Prisma migration is project standard; raw SQL bypasses generate step |
| Polling every 30s (existing pattern) | WebSocket / SSE | WebSocket adds infra complexity; polling already established in useNotifications |

---

## Architecture Patterns

### System Architecture Diagram

```
[Admin user saves legal param]
       |
       v
LegalParamRoute (POST /legal-params or PATCH /legal-params/:key)
       |
       v
LegalParamController.upsertParam / patchParam
       |
       v
LegalParamService.upsertParam (existing)
       | after successful DB write
       v
NotificationService.createLegalParamAlert(paramKey, oldValue, newValue, validFrom, actingUserId)
       |
       |--> Query vpg_payrolls WHERE status = BORRADOR → count
       |--> Build message string (param-specific risk suffix if applicable)
       |--> Query vpg_users WHERE role IN ('admin', 'payroll_manager') AND active
       |--> prisma.vpg_notifications.createMany → one row per target user
            (notifications_requires_acknowledgment = true,
             notifications_type = 'LEGAL_PARAM_CHANGE',
             notifications_acknowledged_by = null,
             notifications_acknowledged_at = null)
       |
       +--> Create confirmation notification for actingUserId
            (notifications_requires_acknowledgment = false,
             notifications_type = 'LEGAL_PARAM_CHANGE')

[Admin views dashboard]
       |
       v
Frontend: useNotifications (or useLegalParamAlerts hook)
   GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true
       |
       v
NotificationController.getNotifications (extended with query filter)
       |
       v
NotificationService.getUnacknowledgedLegalParamAlerts(userId)
       |
       v
LegalParamAlertBanner renders if results.length > 0

[Admin clicks "Marcar como revisado"]
       |
       v
PATCH /notifications/:id/acknowledge
       |
       v
NotificationController.acknowledgeNotification
       |
       v
NotificationService.acknowledgeNotification(id, adminUserId)
   --> validates: notification exists, requires_acknowledgment = true, admin role
   --> prisma.vpg_notifications.update:
         acknowledged_by = adminUserId, acknowledged_at = now()
   --> AuditLogsService.createLog: action = 'ACKNOWLEDGE_LEGAL_PARAM_ALERT'
       |
       v
Frontend banner refetches → if no more unacknowledged → AnimatePresence exit
```

### Recommended Project Structure for New Files

```
src/backend/
├── prisma/migrations/
│   └── [timestamp]_add_notification_acknowledgment_fields/  # new migration
├── src/
│   ├── service/
│   │   └── NotificationService.ts  # extend: createLegalParamAlert, acknowledgeNotification, getUnacknowledgedLegalParamAlerts
│   ├── controller/
│   │   └── NotificationController.ts  # extend: acknowledgeNotification, extend getNotifications with filters
│   └── routes/
│       └── NotificationRoute.ts  # add: PATCH /:id/acknowledge, extend GET with filter params

src/frontend/src/
├── components/
│   └── LegalParamAlertBanner.tsx  # new component
├── services/
│   └── notificationService.ts  # extend: acknowledgeNotification, getLegalParamAlerts
├── types/
│   └── notification.ts  # extend: add acknowledged fields, notification_type
└── hooks/
    └── useLegalParamAlerts.ts  # new hook (or extend useNotifications — Claude's discretion)
```

### Pattern 1: Schema Migration with New Nullable Columns

[VERIFIED: codebase — existing migration patterns in src/backend/prisma/migrations/]

The `vpg_notifications` table currently has:
- `notifications_id`, `notifications_user_id`, `notifications_title`, `notifications_message`, `notifications_type`, `notifications_is_read`, `notifications_created_at`, `notifications_version`

Three new columns are required:

```prisma
// In schema.prisma — vpg_notifications model additions
notifications_requires_acknowledgment Boolean   @default(false)
notifications_acknowledged_by         Int?
notifications_acknowledged_at         DateTime? @db.Timestamp(6)
// Relation:
vpg_users_acknowledged                vpg_users? @relation("NotificationAcknowledger", fields: [notifications_acknowledged_by], references: [user_id], onDelete: SetNull, onUpdate: NoAction)
```

Note: `vpg_users` already has a `vpg_notifications` relation (FK fk_vpg_notifications_users_24). The new relation needs a distinct relation name to avoid Prisma ambiguous relation error. Use `@relation("NotificationAcknowledger")` on the new FK and `@relation("NotificationOwner")` on the existing one.

Run:
```bash
cd src/backend && npx prisma migrate dev --name add_notification_acknowledgment_fields
npx prisma generate
```

### Pattern 2: createLegalParamAlert — Fan-out to multiple users

[VERIFIED: codebase — NotificationService.ts uses prisma.vpg_notifications.create (single); extend to createMany]

```typescript
// NotificationService — new static method
static async createLegalParamAlert(
  paramKey: string,
  oldValue: string,
  newValue: string,
  validFrom: Date,
  actingUserId: number,
  actingUserName: string,
): Promise<void> {
  // 1. Count BORRADOR payrolls
  const draftCount = await prisma.vpg_payrolls.count({
    where: { payrolls_status: 'BORRADOR' },
  });

  // 2. Build message
  const baseMsg = `${paramKey} fue modificado por ${actingUserName}. Valor anterior: ${oldValue} → Nuevo valor: ${newValue}.`;
  const draftSuffix = draftCount > 0
    ? ` ATENCIÓN: Existen ${draftCount} planillas en estado BORRADOR que deben recalcularse.`
    : '';
  const riskSuffix = LEGAL_PARAM_RISK_MESSAGES[paramKey]?.(Number(newValue)) ?? '';
  const fullMessage = baseMsg + draftSuffix + (riskSuffix ? '\n' + riskSuffix : '');

  // 3. Fetch target users (admin + payroll_manager)
  const targetUsers = await prisma.vpg_users.findMany({
    where: { user_role: { in: ['admin', 'payroll_manager'] } },
    select: { user_id: true },
  });

  // 4. Fan-out createMany
  await prisma.vpg_notifications.createMany({
    data: targetUsers.map(u => ({
      notifications_user_id: u.user_id,
      notifications_title: `Parámetro legal modificado: ${PARAM_READABLE_NAMES[paramKey] ?? paramKey}`,
      notifications_message: fullMessage.substring(0, 500), // column is VarChar(500)
      notifications_type: 'LEGAL_PARAM_CHANGE',
      notifications_requires_acknowledgment: true,
      notifications_acknowledged_by: null,
      notifications_acknowledged_at: null,
    })),
  });

  // 5. Confirmation notification for acting user (no acknowledgment required)
  await prisma.vpg_notifications.create({
    data: {
      notifications_user_id: actingUserId,
      notifications_title: `Confirmación: ${PARAM_READABLE_NAMES[paramKey] ?? paramKey} actualizado`,
      notifications_message: `Has actualizado el parámetro ${paramKey}. Valor: ${newValue}.`,
      notifications_type: 'LEGAL_PARAM_CHANGE',
      notifications_requires_acknowledgment: false,
    },
  });
}
```

### Pattern 3: acknowledgeNotification — Admin-only update

[VERIFIED: codebase — existing markAsRead pattern in NotificationService.ts as reference]

```typescript
static async acknowledgeNotification(
  notificationId: number,
  adminUserId: number,
): Promise<void> {
  const notification = await prisma.vpg_notifications.findFirst({
    where: {
      notifications_id: notificationId,
      notifications_requires_acknowledgment: true,
      notifications_acknowledged_by: null,
    },
  });

  if (!notification) {
    throw new Error('Notification not found or already acknowledged');
  }

  await prisma.vpg_notifications.update({
    where: { notifications_id: notificationId },
    data: {
      notifications_acknowledged_by: adminUserId,
      notifications_acknowledged_at: new Date(),
      notifications_is_read: true,
    },
  });

  // Audit log
  await prisma.vpg_audit_logs.create({
    data: {
      audit_logs_user_id: adminUserId,
      audit_logs_action: 'ACKNOWLEDGE_LEGAL_PARAM_ALERT',
      audit_logs_entity: 'vpg_notifications',
      audit_logs_entity_id: notificationId,
      audit_logs_timestamp: new Date(),
      audit_logs_details: JSON.stringify({ notificationId }),
    },
  });
}
```

### Pattern 4: GET with type + unacknowledged filters

[VERIFIED: codebase — existing getNotifications uses findMany with where clause]

The `GET /notifications` route currently reads userId from `req.user`. Extend it to accept:
- `?type=LEGAL_PARAM_CHANGE` — filter by notifications_type
- `?unacknowledged=true` — filter where `notifications_acknowledged_by IS NULL AND notifications_requires_acknowledgment = true`

Controller reads `req.query.type` and `req.query.unacknowledged`, passes to service.

### Pattern 5: PATCH /:id/acknowledge route

[VERIFIED: codebase — existing route follows asyncHandler + verifyToken pattern]

```typescript
// NotificationRoute.ts — add after existing routes
router.patch(
  '/:id/acknowledge',
  asyncHandler(NotificationController.acknowledgeNotification),
);
```

Controller checks `req.user.role === 'admin'` (403 otherwise), then calls `NotificationService.acknowledgeNotification`.

### Pattern 6: LegalParamAlertBanner — frontend component

[VERIFIED: codebase — main/page.tsx amber alert at lines 396-413; NotificationPanel.tsx animation variants]

The banner sits between the dashboard page header and the stats grid:

```tsx
// main/page.tsx — after header div, before stats grid
<LegalParamAlertBanner userRole={currentUserRole} />
```

Component:
- Fetches `GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true` on mount
- Uses `AnimatePresence` + `motion.div` for entry/exit
- Entry: `opacity 0→1, y -8→0` in 150ms; Exit: `opacity 1→0, y 0→-8` in 100ms
- Red variant (`ShieldExclamationIcon`) when any alert has a risk suffix
- "Marcar como revisado" button calls `PATCH /notifications/:id/acknowledge` → refetch
- "×" dismiss = local session state only, no API call
- `acknowledged_by` button hidden for `payroll_manager` role (shown only for `admin`)

### Pattern 7: Risk messages lookup table

[VERIFIED: codebase — CONTEXT.md defines exact conditions and messages]

```typescript
// Utility constant in NotificationService.ts or a shared utils file
const LEGAL_PARAM_RISK_MESSAGES: Record<string, (value: number) => string | null> = {
  MIN_WAGE_CHECK_ENABLED: (v) => v === 0
    ? 'Verificación de salario mínimo DESACTIVADA. Las planillas no validarán cumplimiento del Decreto MTSS.'
    : null,
  OT_FACTOR: (v) => v < 1.5
    ? 'El multiplicador de horas extra es inferior al mínimo legal (1.5×). Riesgo de incumplimiento Art. 139 CT.'
    : null,
  HOLIDAY_MANDATORY_FACTOR: (v) => v < 2.0
    ? 'El multiplicador de feriado obligatorio es inferior al mínimo legal (2.0×). Riesgo de incumplimiento Art. 148 CT.'
    : null,
  HOLIDAY_TRIPLE_FACTOR: (v) => v < 3.0
    ? 'El multiplicador de feriado triple es inferior al mínimo legal (3.0×). Riesgo de incumplimiento Art. 148 CT.'
    : null,
  CCSS_OBRERO_SALUD: (v) => v < 5.50
    ? 'Los porcentajes de CCSS no corresponden a los valores legales vigentes. Riesgo de incumplimiento ante la CCSS.'
    : null,
};

const PARAM_READABLE_NAMES: Record<string, string> = {
  OT_FACTOR: 'Factor de Horas Extra',
  HOLIDAY_MANDATORY_FACTOR: 'Factor de Feriado Obligatorio',
  HOLIDAY_TRIPLE_FACTOR: 'Factor de Feriado Triple',
  CCSS_OBRERO_SALUD: 'CCSS Obrero — Salud',
  MIN_WAGE_CHECK_ENABLED: 'Verificación de Salario Mínimo',
  GLOBAL_MIN_WAGE_RATE: 'Tarifa Mínima Global',
};
```

### Anti-Patterns to Avoid

- **Widening the CreateNotificationInput type for the existing `createNotification` method:** The new `createLegalParamAlert` is a separate method. Do not force the existing public interface to accept `requires_acknowledgment` — keep backward compatibility.
- **Putting role-check logic in the service:** Role authorization (admin-only acknowledge) belongs in the controller/route layer, not the service. Service receives validated `adminUserId`.
- **Using `notifications_is_read` as the acknowledgment signal:** `is_read` and `acknowledged_by` are different concepts. A notification can be read but not formally acknowledged. Keep them separate.
- **Truncating the message silently:** `notifications_message` is `VarChar(500)`. The generated message can approach or exceed 500 characters when risk suffix and draft warning are both present. Apply `.substring(0, 500)` explicitly before insert.
- **Duplicate relation name in Prisma:** Adding a second FK from `vpg_notifications` to `vpg_users` without explicit `@relation` names will cause a Prisma schema validation error. Both relations must have distinct names.
- **Blocking upsertParam on notification failure:** Wrap the `createLegalParamAlert` call in a try/catch so a notification fan-out error does not roll back the successful param save.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fan-out to multiple users | Loop with individual `create()` calls | `prisma.vpg_notifications.createMany()` | Atomic, single round-trip to DB |
| Role check on acknowledge endpoint | Custom inline role check | `AuthMiddleware.requireRole(['admin'])` | Already implemented, consistent with LegalParamRoute pattern |
| Toast feedback | Custom toast component | `sonner` (already installed via useLegalParamConfig, configuracion page) | Project standard |
| AnimatePresence for banner | CSS transitions | `framer-motion` AnimatePresence + motion.div | Project standard for all animated components |
| Audit log for acknowledge | Manual SQL | `prisma.vpg_audit_logs.create()` (same pattern as PayrollService.approvePayroll) | Consistent audit trail |

---

## Runtime State Inventory

> This is a greenfield extension (new columns + new behavior). No rename or migration of existing data.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing `vpg_notifications` rows have no `requires_acknowledgment` column | Prisma migration adds column with `@default(false)` — existing rows unaffected |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None — no new packages, no egg-info | None |

**Nothing found in remaining categories:** Verified by codebase inspection.

---

## Common Pitfalls

### Pitfall 1: Prisma Ambiguous Relation on vpg_notifications
**What goes wrong:** Adding `notifications_acknowledged_by Int?` with a FK to `vpg_users` without a named relation causes `npx prisma validate` to fail with "Ambiguous relation detected."
**Why it happens:** `vpg_users` already has a `vpg_notifications` back-relation. A second FK creates ambiguity.
**How to avoid:** Add `@relation("NotificationAcknowledger")` to the new FK field and add `@relation("NotificationOwner")` to the existing FK field. Update the `vpg_users` model to list both named back-relations.
**Warning signs:** `npx tsc --noEmit` or `npx prisma generate` errors mentioning "ambiguous" or "relation name."

### Pitfall 2: VarChar(500) Message Truncation
**What goes wrong:** The generated notification message (base + draft suffix + risk suffix) can exceed 500 characters.
**Why it happens:** Risk suffix messages are up to 120 chars; draft suffix adds ~80 chars; base message adds ~120 chars.
**How to avoid:** Always `.substring(0, 500)` before inserting into `notifications_message`. Consider storing the full message in a JSON metadata column if audit trail requires full text (but CONTEXT.md only requests `metadata` as a separate field — see below).
**Warning signs:** PostgreSQL `value too long for type character varying(500)` error.

### Pitfall 3: metadata field not in current schema
**What goes wrong:** CONTEXT.md specifies `metadata: { paramKey, oldValue, newValue, validFrom, sourceDecree?, affectedDraftPayrolls: number }` on the notification — but `vpg_notifications` has no `metadata` column.
**Why it happens:** The existing schema was designed before this phase.
**How to avoid:** Either (a) encode the metadata in the message body string (already does so partially) and skip a dedicated column, or (b) add a `notifications_metadata Json?` column in the migration. Given the CONTEXT.md structure explicitly calls out the metadata field as a separate object, adding `notifications_metadata Json?` is the correct path. Include it in the migration.
**Warning signs:** Information loss during acknowledge — admin can't see old vs. new value distinction.

### Pitfall 4: payroll_manager role is NOT in the current ROLE_DEFINITIONS
**What goes wrong:** `UserService.ts` defines roles as `admin`, `supervisor`, `analyst`, `viewer`. `payroll_manager` appears only once in the codebase (EnterpriseRoute.ts `requireRole(['admin', 'payroll_manager'])`). The notification fan-out queries `WHERE user_role IN ('admin', 'payroll_manager')` — if no users have this role, only admins get notified.
**Why it happens:** Role set is flexible (stored as VarChar, not enum), so `payroll_manager` may exist in production even though not in the catalog.
**How to avoid:** The query is correct as written — it will return whoever has that role. No action needed. But the CONTEXT.md constraint ("todos los admins/payroll_managers") is satisfied as long as the query includes both role values.
**Warning signs:** None in code — this is a data concern, not a code bug.

### Pitfall 5: upsertParam failure if createLegalParamAlert throws
**What goes wrong:** If notification fan-out fails (e.g., Prisma error, network issue), it propagates up and the HTTP response to the admin becomes a 500, even though the param was saved successfully.
**Why it happens:** No error isolation around the notification side-effect.
**How to avoid:** Wrap `createLegalParamAlert` in try/catch inside `upsertParam` or in the controller after calling `upsertParam`. Log the error but do not re-throw.

### Pitfall 6: GET /notifications filter breaks existing unread-count polling
**What goes wrong:** Adding `type` and `unacknowledged` query params to `GET /notifications` changes backend behavior only when those params are present. The existing `useNotifications` hook calls `GET /notifications?page=1&limit=20` without those params and must continue working unchanged.
**Why it happens:** Risk of over-eager conditional logic in the service.
**How to avoid:** Apply filters only when the query param is present (`if (req.query.type)...`). Test that existing hook behavior is unaffected.

---

## Code Examples

### Migration file pattern (matches existing migrations)
[VERIFIED: codebase — migrations use plain SQL ALTER TABLE]

The migration generated by `npx prisma migrate dev` will produce:
```sql
ALTER TABLE "vpg_notifications"
  ADD COLUMN "notifications_requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifications_acknowledged_by" INTEGER,
  ADD COLUMN "notifications_acknowledged_at" TIMESTAMP(6),
  ADD COLUMN "notifications_metadata" JSONB;

ALTER TABLE "vpg_notifications"
  ADD CONSTRAINT "fk_vpg_notifications_acknowledged_by"
  FOREIGN KEY ("notifications_acknowledged_by")
  REFERENCES "vpg_users"("user_id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
```

### Frontend: LegalParamAlertBanner skeleton (based on existing patterns)
[VERIFIED: codebase — main/page.tsx amber alert pattern lines 396-413, NotificationPanel.tsx animation]

```tsx
// src/frontend/src/components/LegalParamAlertBanner.tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldExclamationIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface Props {
  userRole: string;
}

export const LegalParamAlertBanner: React.FC<Props> = ({ userRole }) => {
  // fetch GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true
  // render AnimatePresence wrapping motion.div
  // "Marcar como revisado" calls PATCH /notifications/:id/acknowledge → refetch
  // "×" sets local dismissed state
};
```

### Backend: PATCH /:id/acknowledge controller method
[VERIFIED: codebase — existing markAsRead pattern in NotificationController.ts]

```typescript
static async acknowledgeNotification(req: Request, res: Response): Promise<void> {
  const notificationId = parseInt(req.params.id, 10);
  const userId = (req.user as { user_id: number; user_role: string }).user_id;
  const userRole = (req.user as { user_id: number; user_role: string }).user_role;

  if (userRole !== 'admin') {
    res.status(403).json({ success: false, error: 'Solo los administradores pueden marcar alertas como revisadas' });
    return;
  }
  if (isNaN(notificationId)) {
    res.status(400).json({ success: false, error: 'Invalid notification ID' });
    return;
  }

  await NotificationService.acknowledgeNotification(notificationId, userId);
  res.status(200).json({ success: true });
}
```

---

## Environment Availability

Step 2.6: SKIPPED — Phase is pure code and DB migration changes. No new external tools, services, or runtimes required beyond the existing Node.js + PostgreSQL stack already confirmed operational.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- --testPathPattern=NotificationService` |
| Full suite command | `cd src/backend && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-26 | `createLegalParamAlert` creates rows for all admin/payroll_manager users | unit | `npm test -- --testPathPattern=NotificationService` | ✅ (`NotificationService.test.ts` — extend) |
| PAY-26 | `createLegalParamAlert` appends draft-payroll count to message | unit | `npm test -- --testPathPattern=NotificationService` | ✅ (extend) |
| PAY-26 | Risk suffix appended for OT_FACTOR < 1.5 | unit | `npm test -- --testPathPattern=NotificationService` | ✅ (extend) |
| PAY-26 | `acknowledgeNotification` updates acknowledged_by and creates audit log | unit | `npm test -- --testPathPattern=NotificationService` | ✅ (extend) |
| PAY-26 | `upsertParam` calls `createLegalParamAlert` after save | unit | `npm test -- --testPathPattern=LegalParamService` | ✅ (`LegalParamService.test.ts` — extend) |
| PAY-26 | GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true returns only unacknowledged | unit | `npm test -- --testPathPattern=NotificationController` | ❌ Wave 0 |
| PAY-26 | PATCH /notifications/:id/acknowledge returns 403 for non-admin | unit | `npm test -- --testPathPattern=NotificationController` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src/backend && npm test -- --testPathPattern=Notification`
- **Per wave merge:** `cd src/backend && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/controller/NotificationController.test.ts` — covers PATCH acknowledge + GET with filters (new controller methods not yet tested)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `AuthMiddleware.verifyToken` (existing, applied to all /notifications routes) |
| V3 Session Management | no | Stateless JWT — no session state changes |
| V4 Access Control | yes | `AuthMiddleware.requireRole(['admin'])` on PATCH /:id/acknowledge |
| V5 Input Validation | yes | Validate `notificationId` is integer, `type` and `unacknowledged` are expected strings |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on acknowledge endpoint | Elevation of Privilege | Service validates notification exists AND requires_acknowledgment = true; controller enforces admin role |
| Notification spam (fan-out on every param save) | Denial of Service | `createLegalParamAlert` is called once per `upsertParam`; no loop or external trigger |
| Message injection via param values | Tampering | Message is built from controlled server-side strings; old/new values come from Prisma Decimal — no user-controlled HTML |
| Over-broad read access (non-admin reading legal alerts) | Information Disclosure | GET filter returns alerts for `userId` = authenticated user — only that user's notifications are returned |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `payroll_manager` role users may exist in production even though not defined in UserService.ROLE_DEFINITIONS | Common Pitfalls #4 | If assumed wrong: no harm — the WHERE IN query simply returns 0 payroll_manager rows; only admins get notified. Still satisfies minimum viable behavior. |
| A2 | `notifications_metadata Json?` column should be added in the migration (CONTEXT.md calls it out) | Pitfall #3 | If skipped: old/new value distinction is only in the message string, not machine-readable. Fase 63 (admin panel) may need it. Low risk for Phase 61, higher risk for Phase 63. |
| A3 | `upsertParam` should NOT be wrapped in a DB transaction that rolls back the param save if notification fan-out fails | Architecture / Pitfall #5 | If wrong (fan-out should be atomic): would require a Prisma $transaction wrapping both the param upsert and the createMany. CONTEXT.md does not specify atomicity requirement, so non-atomic is safe. |

---

## Open Questions

1. **Should `notifications_metadata` be added to the migration?**
   - What we know: CONTEXT.md specifies it; current schema has no such column; VarChar(500) message is insufficient for machine-readable old/new values.
   - What's unclear: Whether Phase 63 (admin panel) will need queryable metadata or just display text.
   - Recommendation: Add `notifications_metadata Json?` in the migration now. Cost is one additional column; benefit is future-proofing for Phase 63.

2. **Separate hook `useLegalParamAlerts` or extend `useNotifications`?**
   - What we know: `useNotifications` polls `unread-count` every 30s and manages general notifications. Legal param alerts need a separate fetch with different filters. The dashboard is the primary consumer of legal alerts; the notification bell panel is a secondary consumer.
   - What's unclear: Whether mixing legal-alert state into the general notification hook creates coupling.
   - Recommendation: Create a separate `useLegalParamAlerts` hook. It has distinct fetch URL, distinct state shape (includes `acknowledged_by`), and distinct polling concern. Keeps `useNotifications` unchanged and backward-compatible.

3. **Banner placement in `main/page.tsx` for non-admin users**
   - What we know: CONTEXT.md says the banner is visible to admins AND payroll_managers (but only admins can mark as reviewed). The "Marcar como revisado" button is hidden for payroll_manager.
   - What's unclear: Current `main/page.tsx` does not expose `userRole` to the component — it would need to be passed from a user context or auth hook.
   - Recommendation: Read `userRole` from `useAuth` hook (already exists at `src/frontend/src/hooks/useAuth.ts`) and pass as prop to `LegalParamAlertBanner`.

---

## Sources

### Primary (HIGH confidence)
- Codebase grep + direct file reads — `src/backend/prisma/schema.prisma`, `NotificationService.ts`, `LegalParamService.ts`, `NotificationRoute.ts`, `NotificationController.ts`, `AuthMiddleware.ts`, `UserService.ts`, `main/page.tsx`, `useNotifications.ts`, `useLegalParamConfig.ts`, `notificationService.ts` (frontend)
- `61-CONTEXT.md` — user decisions and locked requirements
- `61-UI-SPEC.md` — UI design contract for frontend components

### Secondary (MEDIUM confidence)
- `CLAUDE.md` — project conventions, layer rules, naming conventions
- `.planning/STATE.md` and `.planning/REQUIREMENTS.md` — milestone context

### Tertiary (LOW confidence)
- None — all claims verified against codebase or CONTEXT.md

---

## Project Constraints (from CLAUDE.md)

- Backend files: PascalCase (`NotificationService.ts`, `NotificationController.ts`, `NotificationRoute.ts`)
- All Prisma access via singleton `import { prisma } from '../lib/prisma'` — never `new PrismaClient()`
- All routes use `asyncHandler` wrapper
- All routes apply `AuthMiddleware.verifyToken`
- Static methods only in service/controller classes
- Every public method requires `@param`, `@returns`, `@throws` JSDoc
- `npx tsc --noEmit` must pass in both `src/backend/` and `src/frontend/`
- `npx next lint` must pass in `src/frontend/`
- Frontend API calls only through `http.ts` — never raw `fetch` in components or hooks
- Frontend imports use `@/` alias only — no relative imports more than 1 level deep
- Modals and animated components use `AnimatePresence` + `motion.div` with `backdropVariants` / `modalVariants`
- `src/backend/src/utils/payrollUtils.ts` — DO NOT TOUCH (not affected by this phase)
- `src/backend/prisma/schema.prisma` changes require `npx prisma migrate dev` + `npx prisma generate`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use in codebase
- Architecture: HIGH — verified against existing service/controller/route patterns
- Pitfalls: HIGH — all identified from direct schema and code inspection
- Schema migration details: HIGH — Prisma pattern verified against existing migrations

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (stable stack, no fast-moving dependencies)
