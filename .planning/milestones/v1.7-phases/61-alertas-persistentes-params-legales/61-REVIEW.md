---
phase: 61
status: findings
files_reviewed: 11
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
---

# Code Review — Phase 61: alertas-persistentes-params-legales

## Summary

La implementación es sólida en general. El patrón fire-and-forget del backend está correctamente ejecutado, el RBAC se aplica en el controller, y el frontend tiene cleanup apropiado de intervals. Se encontró **1 problema crítico** de seguridad (IDOR en acknowledgeNotification), **4 warnings** de calidad/arquitectura, y **3 observaciones informativas**.

---

## Critical Issues (CR-*)

### CR-01: IDOR — acknowledgeNotification no verifica ownership de notificación
**File:** `src/backend/src/service/NotificationService.ts:250-256`
**Issue:** `acknowledgeNotification` busca la notificación solo por `notifications_id` y `notifications_requires_acknowledgment: true` — sin filtrar por `notifications_user_id`. Un admin podría construir una request `PATCH /notifications/:id/acknowledge` con el ID de una notificación de otro usuario y acknowledgerarla, incluso si esa notificación no le pertenece. La verificación de rol en el controller (admin/payroll_manager) no mitiga este riesgo porque todos los admins pueden mutuamente afectar notificaciones ajenas.

```typescript
// Vulnerable — no verifica ownership:
const notification = await prisma.vpg_notifications.findFirst({
  where: {
    notifications_id: notificationId,
    notifications_requires_acknowledgment: true,
    notifications_acknowledged_by: null,
  },
});
```

**Fix:**
```typescript
// Añadir filtro de usuario:
const notification = await prisma.vpg_notifications.findFirst({
  where: {
    notifications_id: notificationId,
    notifications_user_id: adminUserId,  // ← agregar
    notifications_requires_acknowledgment: true,
    notifications_acknowledged_by: null,
  },
});
```
Si el diseño intencional es que cualquier admin pueda acknowledger la notificación de otro (fan-out multi-admin), documenta la decisión explícitamente con un comentario de seguridad y elimina el filtro `notifications_user_id` del criterio — pero la lógica actual es ambigua.

---

## Warnings (WR-*)

### WR-01: PayrollWizard invoca useLegalParamAlerts directamente (instancia duplicada)
**File:** `src/frontend/src/components/PayrollWizard.tsx:57`
**Issue:** El wizard importa y llama `useLegalParamAlerts()` directamente, lo que crea una **segunda instancia del polling** independiente del `LegalParamAlertsContext` ya montado en el layout. Esto genera:
1. Dos requests simultáneas a `GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true` cada 60 segundos.
2. El estado del wizard no se sincroniza con el banner del dashboard (pueden mostrar counts diferentes).

El plan 05 decía explícitamente: *"No new API calls introduced — wizard banner reuses useLegalParamAlerts state"*.

**Fix:** Cambiar a `useLegalParamAlertsContext()` en PayrollWizard:
```typescript
// Reemplazar:
const { alerts: legalParamAlerts } = useLegalParamAlerts();
// Por:
const { alerts: legalParamAlerts } = useLegalParamAlertsContext();
```
Y actualizar el import para eliminar `useLegalParamAlerts` y agregar `useLegalParamAlertsContext`.

---

### WR-02: createLegalParamAlert envía confirmation al acting user aunque ya está en targetUsers
**File:** `src/backend/src/service/NotificationService.ts:104-113`
**Issue:** Si el admin que ejecuta la acción también tiene rol `admin` o `payroll_manager`, recibe **dos notificaciones**:
1. Una de tipo `LEGAL_PARAM_CHANGE` con `requires_acknowledgment: true` (del fan-out de targetUsers).
2. Otra de tipo `LEGAL_PARAM_CHANGE` con `requires_acknowledgment: false` (la confirmación en línea 104).

Esto puede generar confusión en el UI ya que el banner mostrará las alertas unacknowledged, incluyendo la del fan-out dirigida al mismo acting user.

**Fix:** Excluir al acting user del fan-out de targetUsers:
```typescript
const targetUsers = await prisma.vpg_users.findMany({
  where: {
    user_role: { in: ['admin', 'payroll_manager'] },
    user_id: { not: actingUserId },  // ← excluir al actor
  },
  select: { user_id: true },
});
```

---

### WR-03: fetchAlerts no limpia el estado isLoading en polling subsiguiente
**File:** `src/frontend/src/hooks/useLegalParamAlerts.ts:17-28`
**Issue:** `isLoading` se inicializa como `true` y se pone a `false` en el `finally` del primer fetch. Sin embargo, en los polls subsiguientes (cada 60s), `isLoading` no vuelve a `true`, lo que es correcto para no mostrar skeleton en cada refresco. El problema es diferente: si el primer fetch falla, `isLoading` queda en `false` pero `alerts` queda vacío — el banner se oculta (`if dismissed || (!isLoading && alerts.length === 0) return null`), sin que el usuario sepa si hubo un error o genuinamente no hay alertas. El estado `error` se setea pero el banner no lo renderiza.

**Fix:** Renderizar un indicador de error mínimo en el banner cuando `error !== null && !isLoading && alerts.length === 0`, o al menos loggear el error de forma que el dev pueda diagnosticarlo sin romper la UX:
```tsx
// En LegalParamAlertBanner.tsx, después de la guarda de dismissed:
if (error && !isLoading && alerts.length === 0) {
  // Silenciosamente ignorar — pero al menos log en dev
  if (process.env.NODE_ENV === 'development') {
    console.warn('[LegalParamAlertBanner] Failed to load alerts:', error);
  }
  return null;
}
```

---

### WR-04: POST /notifications no valida el tipo LEGAL_PARAM_CHANGE en input externo
**File:** `src/backend/src/controller/NotificationController.ts:5-8, 16-33`
**Issue:** El endpoint `POST /notifications` acepta `type: 'LEGAL_PARAM_CHANGE'` en el body (está incluido en `VALID_NOTIFICATION_TYPES`) pero no valida que los campos `requires_acknowledgment`, `metadata` sean coherentes con ese tipo. Un cliente autenticado podría crear notificaciones `LEGAL_PARAM_CHANGE` con `requires_acknowledgment: false` directamente, "contaminando" el feed de alertas legales. La lógica de negocio indica que las alertas `LEGAL_PARAM_CHANGE` solo deben crearse vía `createLegalParamAlert` internamente.

**Fix:** Bloquear la creación externa de `LEGAL_PARAM_CHANGE` en `createNotification`:
```typescript
if (type === 'LEGAL_PARAM_CHANGE') {
  res.status(403).json({ success: false, error: 'LEGAL_PARAM_CHANGE notifications must be created by the system' });
  return;
}
```

---

## Info (IN-*)

### IN-01: limit no tiene cota máxima en getNotifications
**File:** `src/backend/src/controller/NotificationController.ts:60`
**Issue:** `parseInt(req.query.limit as string, 10) || 20` no tiene un máximo. Un cliente podría pasar `limit=99999` y obtener todas las notificaciones en una sola query, lo que puede ser un vector de DoS o exfiltración masiva de datos.
**Suggestion:** `const limit = Math.min(parseInt(...) || 20, 100);`

---

### IN-02: hasRisk usa string matching frágil en el banner
**File:** `src/frontend/src/components/LegalParamAlertBanner.tsx:29-36`
**Issue:** La función `hasRisk` detecta severidad basada en strings literales del mensaje (`'Art. 139 CT'`, `'CCSS'`). Si el wording del mensaje cambia en el backend (e.g., traducción, reformateo), el banner siempre mostrará variante azul (info) en lugar de roja (risk), sin error visible. Además, `CCSS` aparece en muchos contextos no necesariamente de riesgo.
**Suggestion:** Usar `notifications_metadata.riskLevel` del backend para clasificar la severidad, o añadir un campo `notifications_severity` en lugar de inferirla del texto.

---

### IN-03: framer-motion cargado con dynamic() pero sin fallback visual
**File:** `src/frontend/src/components/LegalParamAlertBanner.tsx:16-17`
**Issue:** `MotionDiv` y `AnimatePresence` se cargan con `dynamic(..., { ssr: false })`. Si framer-motion tarda en cargar, el banner se renderiza en `null` durante el hydration y luego aparece abruptamente. La opción `loading: () => <div>...</div>` mejoraría la UX.
**Suggestion:** Agregar `loading: () => <div className="border rounded-xl p-5 mb-4 opacity-50 animate-pulse h-16" />` como fallback.

---

## Files Reviewed

| Archivo | Estado |
|---|---|
| `src/backend/src/service/NotificationService.ts` | ⚠ CR-01, WR-02 |
| `src/backend/src/service/LegalParamService.ts` | ✓ Limpio |
| `src/backend/src/controller/NotificationController.ts` | ⚠ WR-04, IN-01 |
| `src/backend/src/routes/NotificationRoute.ts` | ✓ Limpio |
| `src/backend/src/model/Notification.ts` | ✓ No revisado en detalle (sin cambios críticos observados) |
| `src/frontend/src/types/notification.ts` | ✓ Limpio |
| `src/frontend/src/services/notificationService.ts` | ✓ Limpio |
| `src/frontend/src/hooks/useLegalParamAlerts.ts` | ⚠ WR-03 |
| `src/frontend/src/context/LegalParamAlertsContext.tsx` | ✓ Limpio |
| `src/frontend/src/components/LegalParamAlertBanner.tsx` | ⚠ IN-02, IN-03 |
| `src/frontend/src/components/PayrollWizard.tsx` | ⚠ WR-01 |
