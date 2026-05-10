# Cross-AI Plan Review Request

You are reviewing implementation plans for a software project phase.
Provide structured feedback on plan quality, completeness, and risks.

## Project Context

VP-Planilla — Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales.

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Architecture:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Domain:** Costa Rica labor law — 8h/day regular, 1.5× OT up to 10h, 2× above 10h, rest day 0.5×
- **Tests:** 507+ backend tests (Jest). TypeScript strict mode.
- **Coding standards:** Static methods only in services. Prisma singleton. JSDoc mandatory on public methods. Responses `{ success: true, data }` or `{ success: false, error }`. Frontend uses `@/` path aliases, `http.ts` for all API calls, `react-hook-form` + `zodResolver` for forms.

## Phase 61: Alertas Persistentes Parámetros Legales

### Roadmap Goal
Cada cambio a vpg_legal_params genera alerta persistente en dashboard visible para admins hasta ser marcada como revisada. Mensajes específicos por parámetro desactivado.

### Requirements
**PAY-26** — Each legal parameter change must:
1. Create a LEGAL_PARAM_CHANGE notification for ALL admin/payroll_manager users
2. Show a persistent dashboard banner that disappears only when acknowledged
3. Show specific risk message when MIN_WAGE_CHECK_ENABLED is set to 0

### Success Criteria
1. Modificar OT_FACTOR crea notificación LEGAL_PARAM_CHANGE para todos los usuarios admin/payroll_manager.
2. Banner en dashboard aparece y desaparece al marcar como revisado.
3. Cambiar MIN_WAGE_CHECK_ENABLED a 0 muestra mensaje "Verificación de salario mínimo DESACTIVADA".

---

## Plans to Review

### Plan 61-01 (Wave 1) — Schema Migration + NotificationService Methods

**Files modified:** schema.prisma, NotificationService.ts, Notification.ts, NotificationService.test.ts

**Key changes:**
- Add 4 columns to vpg_notifications: requires_acknowledgment (bool), acknowledged_by (int? FK), acknowledged_at (datetime?), metadata (jsonb?)
- Add named @relation("NotificationOwner") and @relation("NotificationAcknowledger") to avoid Prisma ambiguous relation error
- Add vpg_users back-relations: vpg_notifications @relation("NotificationOwner") and vpg_notifications_acknowledged @relation("NotificationAcknowledger")
- New NotificationService methods:
  - createLegalParamAlert(paramKey, oldValue, newValue, validFrom, actingUserId, actingUserName): fans out to all admin/payroll_manager, appends risk suffix and draft-payroll count to message, max 500 chars, fire-and-forget for acting user confirmation
  - acknowledgeNotification(notificationId, adminUserId): updates acknowledged_by/at/is_read, creates audit log with action ACKNOWLEDGE_LEGAL_PARAM_ALERT
  - getUnacknowledgedLegalParamAlerts(userId): returns LEGAL_PARAM_CHANGE where acknowledged_by IS NULL
- Constants: LEGAL_PARAM_RISK_MESSAGES (per-param risk checker fn), PARAM_READABLE_NAMES
- Unit tests: fan-out count, risk suffix, draft suffix, truncation, acknowledge happy path, acknowledge already-acked, getUnacknowledged filter

**Method insertion order (GEMINI.md compliance):** createLegalParamAlert after createNotification, getUnacknowledgedLegalParamAlerts after getUnreadCount, acknowledgeNotification before deleteNotification.

---

### Plan 61-02 (Wave 2) — LegalParamService notification hook

**Files modified:** LegalParamService.ts, LegalParamService.test.ts

**Key change:** After `prisma.vpgLegalParam.create()` in upsertParam, fire-and-forget call to NotificationService.createLegalParamAlert. Pattern:
```typescript
NotificationService.createLegalParamAlert(
  data.key,
  existing ? existing.value.toString() : '',
  data.value.toString(),
  newValidFrom,
  parseInt(userId, 10),
  actingUserName,
).catch((err) => {
  console.error('[LegalParamService.upsertParam] Failed to create legal param alert:', err);
});
```
actingUserName resolved from vpg_users.findFirst(user_id = parseInt(userId)). Fallback: `Usuario #${userId}`.

**Tests:** createLegalParamAlert called with correct args, does not throw if rejects, passes existing.value as oldValue.

---

### Plan 61-03 (Wave 2) — API endpoints

**Files modified:** NotificationController.ts, NotificationRoute.ts, NotificationController.test.ts

**Endpoint 1: GET /notifications (extended)**
- `?type=LEGAL_PARAM_CHANGE&unacknowledged=true` → calls getUnacknowledgedLegalParamAlerts(userId), returns 200 + array
- Default (no params) → existing paginated behavior unchanged

**Endpoint 2: PATCH /notifications/:id/acknowledge**
- Admin-only (role check in controller: `userRole !== 'admin'` → 403)
- Non-integer ID → 400
- Service throws "not found" → 404
- Success → 200 `{ success: true }`
- Route registered BEFORE `router.delete('/:id')` to avoid Express path collision
- @swagger annotation included

**Tests:** GET with filter, GET default, PATCH admin success, PATCH payroll_manager 403, PATCH invalid ID 400, PATCH service throws 404.

---

### Plan 61-04 (Wave 3) — Frontend notification pipeline

**Files modified/created:** notification.ts (types), notificationService.ts, useLegalParamAlerts.ts, LegalParamAlertsContext.tsx (new), LegalParamAlertBanner.tsx (new), NotificationPanel.tsx, Header.tsx, layout.tsx, main/page.tsx

**Architecture decision (Context pattern):** useLegalParamAlerts hook runs exactly once via LegalParamAlertsProvider in root layout.tsx. Both Header.tsx and LegalParamAlertBanner.tsx consume via useLegalParamAlertsContext() — NO direct hook calls outside Provider.

**useLegalParamAlerts hook:** polls GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true every 60 seconds. Returns { alerts, isLoading, error, isAcknowledging, acknowledge, refetch }.

**LegalParamAlertBanner:** AnimatePresence entry/exit, red variant (ShieldExclamationIcon) when message contains risk keywords, blue variant (InformationCircleIcon) otherwise. Collapsible. Dismissible (session-local). "Marcar como revisado" button visible only when userRole === 'admin'. Skeleton loading state.

**NotificationPanel:** ShieldExclamationIcon + bg-red-50/50 for LEGAL_PARAM_CHANGE rows.

**Header:** 6px red dot (w-1.5 h-1.5) at bottom-right of bell when legalAlertCount > 0, distinct from the unread count badge.

**main/page.tsx:** LegalParamAlertBanner injected before stats grid.

---

### Plan 61-05 (Wave 4) — Final frontend surfaces

**Files modified:** configuracion/empresa/page.tsx, PayrollWizard.tsx

**Surface 1: DESACTIVADO badge** — Inline next to param name when `category === 'FEATURE_FLAG' && Number(param.value) === 0`:
```tsx
<span role="status" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold uppercase px-2 py-1 rounded-full ml-2">
  DESACTIVADO — Riesgo legal
</span>
```

**Surface 2: Wizard banner** — Amber banner in step 1 when legalParamAlerts.length > 0 && !wizardAlertDismissed:
```tsx
// state: const [wizardAlertDismissed, setWizardAlertDismissed] = useState(false);
// hook: const { alerts: legalParamAlerts } = useLegalParamAlertsContext();
```
Banner copy: "Los parámetros legales cambiaron desde que esta planilla fue creada. Se recomienda recalcular antes de aprobar." Dismissible with ×. Uses ExclamationTriangleIcon + amber scheme.

---

## Review Instructions

Analyze each plan and provide:

1. **Summary** — One-paragraph assessment
2. **Strengths** — What's well-designed (bullet points)
3. **Concerns** — Potential issues, gaps, risks (bullet points with severity: HIGH/MEDIUM/LOW)
4. **Suggestions** — Specific improvements (bullet points)
5. **Risk Assessment** — Overall risk level (LOW/MEDIUM/HIGH) with justification

Focus on:
- Missing edge cases or error handling
- Dependency ordering issues
- Scope creep or over-engineering
- Security considerations
- Performance implications
- Whether the plans actually achieve the phase goals

Output your review in markdown format.
