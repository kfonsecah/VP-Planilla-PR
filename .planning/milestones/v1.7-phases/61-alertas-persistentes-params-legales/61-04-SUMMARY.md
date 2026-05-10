# Phase 61 - Plan 04 Summary

## Wave 3 — Frontend Legal Param Alerts Pipeline

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `src/frontend/src/types/notification.ts` | Modificado | +4 campos opcionales de acknowledgment + interfaz `LegalParamAlertNotification` |
| `src/frontend/src/services/notificationService.ts` | Modificado | +`getLegalParamAlerts()` + `acknowledgeNotification(id)` sobre el service existente |
| `src/frontend/src/hooks/useLegalParamAlerts.ts` | Creado | Hook con polling 60s, estado de alerts, acción `acknowledge` con toast |
| `src/frontend/src/context/LegalParamAlertsContext.tsx` | Creado | Provider singleton que ejecuta el hook una sola vez en el árbol |
| `src/frontend/src/components/LegalParamAlertBanner.tsx` | Creado | Banner con variante risk (rojo/ShieldExclamation) e info (azul/Information), expand/collapse, dismiss local, botón admin-only con spinner |
| `src/frontend/src/components/ui/NotificationPanel.tsx` | Modificado | `ShieldExclamationIcon` + fondo rojo para rows de tipo `LEGAL_PARAM_CHANGE` |
| `src/frontend/src/components/ui/Header.tsx` | Modificado | Punto rojo 6px en campana cuando `legalAlertCount > 0`, leído desde Context |
| `src/frontend/src/layouts/main.tsx` | Modificado | `LegalParamAlertsProvider` montado en árbol de providers |
| `src/frontend/src/app/pages/main/page.tsx` | Modificado | `<LegalParamAlertBanner userRole={role} />` inyectado entre header y stats grid |

### Decisiones técnicas

- **Context sobre hook directo**: `Header` y `LegalParamAlertBanner` consumen `useLegalParamAlertsContext()` — nunca `useLegalParamAlerts()` directamente — garantizando un solo fetch/polling en el árbol.
- **Campo `role`**: El tipo `User` de `user.ts` expone `role` (no `user_role`), por eso el banner compara `userRole === 'admin'`.
- **framer-motion lazy**: `MotionDiv` y `AnimatePresence` cargados con `dynamic()` para evitar SSR mismatch en Next.js.
- **Fire-and-forget en backend**: el hook en `LegalParamService.upsertParam` usa `.catch()` para no bloquear el save si las notificaciones fallan.

### Verificación

- `npx tsc --noEmit` → exit 0 (sin errores)
- Commit: `eaa2332` — 9 archivos, 308 inserciones
- Must-haves del plan: ✅ todos cubiertos

### Must-haves verificados

- [x] `LegalParamAlertBanner` renderiza en `main/page.tsx` entre header y stats grid
- [x] Variante roja (ShieldExclamationIcon) cuando mensaje contiene strings de riesgo
- [x] Admin ve botón "Marcar como revisado"; otros roles no
- [x] Botón llama `PATCH /notifications/:id/acknowledge`, muestra spinner, refetch on success
- [x] `×` dismiss oculta banner localmente sin API call
- [x] `NotificationPanel` diferencia `LEGAL_PARAM_CHANGE` con ShieldExclamationIcon + fondo rojo
- [x] Header campana con punto rojo 6px cuando hay alertas legales sin revisar
- [x] `useLegalParamAlerts` polling 60s a `GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true`
- [x] `LegalParamAlertsContext` — única instancia de fetch en el árbol
- [x] Header usa `useLegalParamAlertsContext()` — NO `useLegalParamAlerts()` directamente
- [x] AnimatePresence en mount/unmount del banner
