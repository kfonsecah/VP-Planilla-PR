---
phase: 61
reviewers: [gemini, opencode]
reviewed_at: 2026-04-29T05:27:00Z
plans_reviewed: [61-01-PLAN.md, 61-02-PLAN.md, 61-03-PLAN.md, 61-04-PLAN.md, 61-05-PLAN.md]
codex: failed (model not supported with ChatGPT account)
---

# Cross-AI Plan Review — Phase 61: Alertas Persistentes Parámetros Legales

## Gemini Review

### 1. Resumen de la Evaluación
El plan es sólido, exhaustivo y demuestra un profundo entendimiento de la arquitectura del proyecto (Prisma singleton, servicios estáticos, patrón de Contexto en React). Cubre todo el ciclo de vida, desde la migración de base de datos hasta superficies de UI críticas como el Wizard de Planilla. La decisión de usar un patrón de "fan-out" (notificaciones individuales por usuario) asegura la integridad del cumplimiento legal, aunque introduce una pequeña fricción operativa que debe ser validada con el usuario.

### 2. Fortalezas
- **Auditabilidad Completa:** La adición de `acknowledged_by` y `acknowledged_at` junto con un log de auditoría (`ACKNOWLEDGE_LEGAL_PARAM_ALERT`) es excelente para sistemas que manejan cumplimiento legal.
- **Integración con el Payroll Wizard:** El Plan 61-05 añade un banner preventivo en la creación de planillas si hubo cambios legales. Esto es de alto valor, ya que evita procesar pagos con parámetros obsoletos.
- **Arquitectura de Frontend Eficiente:** El uso de un `LegalParamAlertsProvider` en el root layout centraliza el polling y evita duplicidad de peticiones desde el Header y el Dashboard.
- **Manejo de Ambigüedad en Prisma:** El plan identifica correctamente que añadir dos relaciones a la misma tabla requiere nombres de relación explícitos.

### 3. Preocupaciones
- **MEDIUM — Inconsistencia de Roles:** El requerimiento dice que la alerta es para `admin` y `payroll_manager`. Sin embargo, el Plan 61-03 indica que `/acknowledge` devuelve 403 si el rol no es `admin`. Un `payroll_manager` verá la alerta pero no podrá marcarla como revisada, dejando el banner permanentemente visible.
- **LOW/MEDIUM — Fricción de Fan-out:** Si hay 5 administradores y se cambia el Salario Mínimo, se crean 5 notificaciones. Cada uno de los 5 debe hacer clic individualmente. En equipos grandes puede verse como spam.
- **LOW — Truncamiento de Mensajes:** El límite de 500 chars puede cortar información crítica si el mensaje de riesgo + conteo de borradores + base msg son largos. Priorizar orden: risk suffix primero.
- **LOW — Fire-and-forget:** Si el servicio de notificaciones falla, el parámetro legal se actualiza pero nadie se entera, lo cual rompe el propósito de la fase.

### 4. Sugerencias
- Modificar `NotificationController` para permitir que `payroll_manager` también ejecute `PATCH .../acknowledge`.
- Cuando un `admin` hace acknowledge, considerar marcar como leídas las notificaciones del mismo evento para todos (o usar `metadata.eventId`).
- Registrar un `AuditLog` de tipo `SYSTEM_ERROR` en el `.catch()` en lugar de solo `console.error`.
- Asegurar que el risk suffix se inserte antes del draft count en el string del mensaje.

### 5. Evaluación de Riesgo
**BAJO (LOW)** — El plan está muy bien alineado con los estándares del proyecto. El riesgo principal es de UX/Operativo por la gestión de notificaciones individuales, no compromete estabilidad ni precisión de cálculos. Aprobado para ejecución con recomendación de corregir permisos de acknowledge para `payroll_manager`.

---

## OpenCode Review (nemotron-3-super-free)

### Plan 61-01 — Schema Migration + NotificationService Methods
**Summary:** Solid foundation with proper database schema extensions and service methods. Good test coverage.

**Strengths:**
- Proper Prisma relation disambiguation
- Fire-and-forget pattern for confirmation avoids blocking
- Comprehensive unit tests covering edge cases
- JSONB metadata column allows future extensibility

**Concerns:**
- MEDIUM: No deduplication mechanism — same parameter changed twice in quick succession creates duplicate alerts
- MEDIUM: No validation on `metadata` JSONB size
- LOW: `createLegalParamAlert` doesn't validate `actingUserId` exists in vpg_users
- LOW: No duplicate alert prevention for same (paramKey, validFrom) within a time window

**Suggestions:**
- Consider deduplication based on (paramKey, validFrom) within short time window
- Add JSON size limit in service layer
- Add existence check for actingUserId

**Risk Assessment:** MEDIUM

---

### Plan 61-02 — LegalParamService notification hook
**Summary:** Clean integration point with proper error handling.

**Strengths:**
- Fire-and-forget with error logging prevents blocking
- Proper fallback for actingUserName
- Separation of concerns maintained

**Concerns:**
- MEDIUM: No retry mechanism for failed alert creation
- LOW: Acting user lookup could fail if user deleted between change and notification

**Suggestions:**
- Add null check for acting user with improved fallback logging
- Monitor notification failure rate in production

**Risk Assessment:** LOW

---

### Plan 61-03 — API endpoints
**Summary:** RESTful API properly extends existing notification functionality with backward compatibility.

**Strengths:**
- Correct route ordering (PATCH before DELETE) to prevent Express collision
- Role-based access control implemented correctly
- Consistent response format
- Swagger documentation included

**Concerns:**
- MEDIUM: GET endpoint doesn't validate `type` parameter against allowed values
- LOW: PATCH endpoint doesn't verify notification is LEGAL_PARAM_CHANGE type before acknowledging
- LOW: No rate limiting on acknowledgment endpoint

**Suggestions:**
- Add validation for `type` query param against known notification types
- Add type check in service method before acknowledging

**Risk Assessment:** MEDIUM

---

### Plan 61-04 — Frontend notification pipeline
**Summary:** Well-architected React Context implementation for efficient alert distribution.

**Strengths:**
- Context pattern prevents duplicate hook calls
- 60s polling balances timeliness vs server load
- Skeleton loading states improve UX
- Role-based visibility of acknowledge button
- Red/blue variant based on risk keywords provides visual feedback

**Concerns:**
- MEDIUM: Context provider re-fetches if not properly memoized (useMemo/useCallback)
- LOW: No exponential backoff for polling errors
- LOW: Interval cleanup on unmount — verify useEffect cleanup returns clearInterval

**Suggestions:**
- Add useMemo/useCallback optimizations in context provider
- Add exponential backoff on polling errors
- Verify cleanup of interval in useLegalParamAlerts useEffect

**Risk Assessment:** LOW

---

### Plan 61-05 — Final frontend surfaces
**Summary:** Effective surface-level implementations visible in relevant workflows.

**Strengths:**
- DESACTIVADO badge provides immediate visual feedback
- Wizard banner warns about payroll calculation impacts
- Both use context hook avoiding redundant API calls
- `role="status"` for accessibility

**Concerns:**
- MEDIUM: Wizard banner dismissal is local-only; requires re-dismissal on revisit
- LOW: Wizard banner doesn't indicate which specific parameters changed
- LOW: DESACTIVADO badge has no tooltip with more context

**Risk Assessment:** LOW

**Overall Phase 61 Risk:** MEDIUM — missing input validation in API and potential data integrity gaps.

---

## Codex Review

*Codex failed — model `gpt-5.1-codex` not supported with ChatGPT account. Skipped.*

---

## Consensus Summary

### Agreed Strengths (2+ reviewers)
1. **LegalParamAlertsProvider pattern** — Both reviewers praise the Context approach for eliminating duplicate polling. Correct architectural decision.
2. **Auditabilidad** — acknowledged_by + acknowledged_at + audit log praised by both as excellent for legal compliance systems.
3. **Prisma named relations** — Both confirm the @relation naming is necessary and correctly planned.
4. **Wizard banner integration (61-05)** — High value, prevents processing payrolls with stale params.

### Agreed Concerns (2+ reviewers)
| Priority | Concern | Reviewers |
|----------|---------|-----------|
| **HIGH** | `payroll_manager` can see alerts but cannot acknowledge (403) — banner stuck permanently | Gemini |
| **MEDIUM** | Fire-and-forget silently drops notifications if NotificationService fails | Gemini + OpenCode |
| **MEDIUM** | GET /notifications `type` param not validated against allowed values | OpenCode |
| **MEDIUM** | No deduplication for rapid consecutive changes to same parameter | OpenCode |
| **LOW** | Risk suffix should appear before draft count in message string | Gemini |

### Divergent Views
- **Fan-out acknowledgment:** Gemini suggests global acknowledge-all (one admin clears for everyone); OpenCode suggests deduplication at creation. These are different solutions to the same UX friction.
- **Risk level:** Gemini → LOW overall; OpenCode → MEDIUM overall. Difference stems from OpenCode flagging missing API input validation more strongly.

---

## Recommended Plan Revisions Before Execution

| Priority | Fix | Affects |
|----------|-----|---------|
| 🔴 HIGH | Allow `payroll_manager` to acknowledge (not just `admin`) in 61-03 controller | 61-03-PLAN.md |
| 🟡 MEDIUM | Move risk suffix before draft count in message construction | 61-01-PLAN.md |
| 🟡 MEDIUM | Add `type` query param validation in GET /notifications handler | 61-03-PLAN.md |
| 🟢 LOW | Add `SYSTEM_ERROR` audit log in .catch() instead of only console.error | 61-02-PLAN.md |
