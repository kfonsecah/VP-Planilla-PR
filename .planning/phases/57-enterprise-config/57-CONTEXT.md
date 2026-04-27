# Phase 57 Context: Configuración de Empresa — Campos Faltantes en vpg_enterprise

**Phase:** 57-enterprise-config-campos
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §12

## Objective

Agregar los campos de configuración que el motor de cálculo necesita leer de `vpg_enterprise` y que hoy no existen: tipo de jornada ordinaria, política de redondeo de minutos, tipo de actividad comercial.

## Scope

### In Scope
- Enums `MinuteRoundingPolicy` y `ShiftType` en `schema.prisma`
- Campos nuevos en `vpg_enterprise`: `minuteRoundingPolicy`, `roundingPolicyAcknowledged`, `isCommercialActivity`, `ordinaryShiftType`
- Migración Prisma
- Verificar si `isCommercialActivity` ya existe en el schema — si existe, no duplicar
- `EnterpriseService.ts`: métodos para leer y actualizar estos campos
- Endpoint `PATCH /enterprise/config` actualizado
- Frontend: sección "Configuración laboral" en `/pages/configuracion/`
- Modal legal para activar `NEAREST_QUARTER` (texto exacto del §4.5 del Payroll.md)
- Registro en `vpg_audit_logs` de la confirmación de `NEAREST_QUARTER`

### Out of Scope
- Implementación de las 3 modalidades de redondeo en el motor (Fase 58)
- Uso del `ordinaryShiftType` en el cálculo (Fase 66)

## Schema changes

```prisma
enum MinuteRoundingPolicy {
  EXACT            // Modalidad A: proporcional exacto
  ALWAYS_UP        // Modalidad B: cuarto de hora superior siempre
  NEAREST_QUARTER  // Modalidad C: cuarto más cercano — requiere confirmación legal
}

enum ShiftType {
  DIURNA    // 8h/día, 48h/semana
  MIXTA     // 7h/día, 42h/semana
  NOCTURNA  // 6h/día, 36h/semana
}

// En vpg_enterprise:
minuteRoundingPolicy       MinuteRoundingPolicy  @default(EXACT)
roundingPolicyAcknowledged Boolean               @default(false)
isCommercialActivity       Boolean               @default(true)
ordinaryShiftType          ShiftType             @default(DIURNA)
```

## Modal de advertencia legal — NEAREST_QUARTER

Texto exacto a mostrar antes de activar Modalidad C:

> **⚠️ Advertencia legal — Redondeo bidireccional**
>
> Esta modalidad puede descartar minutos trabajados por el empleado cuando la fracción es menor a 8 minutos. Según el artículo 17 del Código de Trabajo (principio *in dubio pro operario*), esta práctica puede ser objetada por el Ministerio de Trabajo si no está respaldada en el reglamento interno de trabajo de su empresa.
>
> Al confirmar, usted declara que esta política está documentada en su reglamento interno y es del conocimiento de todos sus trabajadores.
>
> **[ Cancelar ]  [ Confirmo, activar Modalidad C ]**

La confirmación genera un registro en `vpg_audit_logs` con `entity: 'enterprise_config'`, `action: 'NEAREST_QUARTER_ACKNOWLEDGED'`, `userId`, `timestamp`.

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 57-01 | Schema + enums + migración | — |
| 57-02 | EnterpriseService actualizado + endpoint PATCH | 57-01 |
| 57-03 | Frontend: sección configuración laboral + modal NEAREST_QUARTER | 57-02 |

## Dependencies

- **No requiere** Fase 55 ni 56 (es independiente)
- **Requerida por:** Fase 58 (redondeo de minutos), Fase 66 (jornadas)

## Constraints

- `npx tsc --noEmit` en backend y frontend después de cada plan
- `npx next lint` debe pasar
- Si `isCommercialActivity` ya existe en el schema real, NO agregar de nuevo — verificar primero con Read
- `roundingPolicyAcknowledged` debe ser `false` si se cambia `minuteRoundingPolicy` a cualquier valor diferente de NEAREST_QUARTER
