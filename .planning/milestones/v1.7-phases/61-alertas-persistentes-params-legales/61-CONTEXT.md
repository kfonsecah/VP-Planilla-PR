# Phase 61 Context: Alertas Persistentes por Modificación de Parámetros Legales

**Phase:** 61-alertas-persistentes-params-legales
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §11.3 (ampliado en conversación de diseño)

## Objective

Cada cambio a un parámetro legal genera una alerta persistente visible en el dashboard de todos los administradores y payroll managers, hasta que sea marcada como revisada. Mensajes específicos se muestran cuando se desactivan parámetros críticos. Las planillas en BORRADOR existentes reciben advertencia de recalculación.

## Scope

### In Scope
- Campos nuevos en `vpg_notifications`: `requires_acknowledgment`, `acknowledged_by`, `acknowledged_at`, `notification_type` (nuevo tipo: `LEGAL_PARAM_CHANGE`)
- Migración para esos campos
- `LegalParamService.upsertParam`: después de guardar, dispara `NotificationService.createLegalParamAlert`
- `NotificationService.createLegalParamAlert`: crea notificaciones para todos los admins/payroll_managers
- Mensajes específicos por parámetro desactivado (ver tabla abajo)
- Detección de planillas BORRADOR existentes → incluir en el mensaje de alerta
- Endpoint `PATCH /notifications/:id/acknowledge` (solo admin)
- Endpoint `GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true`
- Frontend: banner persistente en dashboard
- Frontend: campana de notificaciones con ícono diferenciado para tipo LEGAL_PARAM_CHANGE
- Frontend: badge rojo "DESACTIVADO — Riesgo legal" en parámetros FEATURE_FLAG con valor 0
- Frontend: banner en wizard paso 1 si params cambiaron después de crear la planilla

### Out of Scope
- Re-confirmación con contraseña al modificar (Fase 62)
- Panel completo de administración (Fase 63)

## Mensajes de alerta por parámetro desactivado

| Parámetro | Condición | Mensaje |
|-----------|-----------|---------|
| MIN_WAGE_CHECK_ENABLED | value = 0 | "Verificación de salario mínimo DESACTIVADA. Las planillas no validarán cumplimiento del Decreto MTSS." |
| OT_FACTOR | value < 1.5 | "El multiplicador de horas extra es inferior al mínimo legal (1.5×). Riesgo de incumplimiento Art. 139 CT." |
| HOLIDAY_MANDATORY_FACTOR | value < 2.0 | "El multiplicador de feriado obligatorio es inferior al mínimo legal (2.0×). Riesgo de incumplimiento Art. 148 CT." |
| HOLIDAY_TRIPLE_FACTOR | value < 3.0 | "El multiplicador de feriado triple es inferior al mínimo legal (3.0×). Riesgo de incumplimiento Art. 148 CT." |
| CCSS_OBRERO_SALUD | value < 5.50 | "Los porcentajes de CCSS no corresponden a los valores legales vigentes. Riesgo de incumplimiento ante la CCSS." |
| CCSS_PATRONAL_* | value < mínimo legal | Mismo mensaje de CCSS |

## Estructura de notificación para LEGAL_PARAM_CHANGE

```typescript
{
  notification_type: 'LEGAL_PARAM_CHANGE',
  requires_acknowledgment: true,
  title: 'Parámetro legal modificado: [nombre legible del param]',
  message: '[nombre] fue modificado por [usuario] el [fecha]. Valor anterior: X → Nuevo valor: Y. Vigente desde: [validFrom].',
  // Si hay planillas BORRADOR:
  // message += ' ATENCIÓN: Existen N planillas en estado BORRADOR que deben recalcularse.'
  // Si el valor activa una alerta de riesgo:
  // message += '\n⚠️ [mensaje específico de riesgo]'
  metadata: { paramKey, oldValue, newValue, validFrom, sourceDecree?, affectedDraftPayrolls: number }
}
```

## Frontend — Dashboard banner

- Aparece cuando existen notificaciones `LEGAL_PARAM_CHANGE` sin `acknowledged_by`
- Muestra: nombre del parámetro, valor anterior → nuevo, quién lo cambió, cuándo
- Botón "Marcar como revisado" visible solo para admin — registra en `vpg_audit_logs`
- Si hay múltiples alertas: mostrar contador y colapsar las secundarias
- El banner desaparece cuando todas las alertas están acknowledged

## Frontend — Wizard paso 1

- Al cargar: consultar si existen alertas de `LEGAL_PARAM_CHANGE` posteriores a la creación de la planilla actual
- Si sí: banner amarillo "Los parámetros legales cambiaron desde que esta planilla fue creada. Se recomienda recalcular antes de aprobar."

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 61-01 | Migración campos vpg_notifications + lógica NotificationService | Fase 55 completa |
| 61-02 | LegalParamService dispara alertas al upsert | 61-01 |
| 61-03 | Endpoint PATCH acknowledge + GET unacknowledged | 61-01 |
| 61-04 | Frontend: banner dashboard + campana diferenciada | 61-03 |
| 61-05 | Frontend: badge DESACTIVADO + banner wizard | 61-04 |

## Dependencies

- **Requiere:** Fase 55 (LegalParamService existe)
- **Requerida por:** Fase 62 (contraseña), Fase 63 (panel admin)

## Constraints

- Las notificaciones se crean para TODOS los usuarios con rol `admin` o `payroll_manager` activos — no solo el que hizo el cambio
- El usuario que hizo el cambio recibe notificación de confirmación separada (sin `requires_acknowledgment`)
- `npx tsc --noEmit` y `next lint` pasan
- `acknowledged_by` debe ser el userId del admin que marcó como revisado, no el que hizo el cambio
