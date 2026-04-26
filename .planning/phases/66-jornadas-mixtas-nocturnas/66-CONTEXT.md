# Phase 66 Context: Soporte de Jornadas Mixtas y Nocturnas por Empleado

**Phase:** 66-jornadas-mixtas-nocturnas
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §3.1, §12, §15

## Objective

El motor de cálculo aplica el cap de horas correcto (6/7/8) según el tipo de jornada asignado al empleado individualmente. Si el empleado no tiene jornada asignada, usa el default configurado en `vpg_enterprise`. Esto habilita el soporte de jornadas mixtas (7h) y nocturnas (6h) sin cambios de código.

## Scope

### In Scope
- Campo `shift_type` en `vpg_employees` (enum `ShiftType | USE_ENTERPRISE_DEFAULT`) — migración
- `NomineeService`: resolución de `shiftType` efectivo por empleado (employee override > enterprise default)
- `LegalParamSet`: `regularHoursPerDay` y `regularHoursPerWeek` se derivan del `shiftType` resuelto leyendo `vpg_legal_params`
- Unit tests con escenarios de jornada nocturna y mixta
- Frontend: campo `shift_type` en formulario crear/editar empleado
- Frontend: tooltip en wizard paso 3 mostrando la jornada aplicada por empleado

### Out of Scope
- Cambios a las reglas de pago de feriados o descanso semanal (no cambian por tipo de jornada)

## Schema

```prisma
enum EmployeeShiftType {
  USE_ENTERPRISE_DEFAULT  // usa vpg_enterprise.ordinaryShiftType
  DIURNA
  MIXTA
  NOCTURNA
}

// En vpg_employees:
shift_type  EmployeeShiftType  @default(USE_ENTERPRISE_DEFAULT)
```

## Resolución de jornada efectiva en NomineeService

```typescript
function resolveEffectiveShiftType(
  employeeShiftType: EmployeeShiftType,
  enterpriseShiftType: ShiftType
): ShiftType {
  if (employeeShiftType === 'USE_ENTERPRISE_DEFAULT') return enterpriseShiftType
  return employeeShiftType as ShiftType
}

// Mapeo a horas usando vpg_legal_params:
// DIURNA   → WORKDAY_DIURNA_DAILY   / WORKDAY_DIURNA_WEEKLY
// MIXTA    → WORKDAY_MIXTA_DAILY    / WORKDAY_MIXTA_WEEKLY
// NOCTURNA → WORKDAY_NOCTURNA_DAILY / WORKDAY_NOCTURNA_WEEKLY
```

## Unit tests requeridos

| Escenario | Input | Esperado |
|-----------|-------|----------|
| Empleado nocturno, 7h trabajadas | shift=NOCTURNA, hoursWorked=7 | 6h regular + 1h OT |
| Empleado mixto, 7h trabajadas | shift=MIXTA, hoursWorked=7 | 7h regular + 0h OT |
| Empleado diurno, 7h trabajadas | shift=DIURNA, hoursWorked=7 | 7h regular + 0h OT |
| Empleado diurno, 9h trabajadas | shift=DIURNA, hoursWorked=9 | 8h regular + 1h OT |
| USE_ENTERPRISE_DEFAULT con empresa MIXTA | enterprise=MIXTA, hoursWorked=7 | 7h regular + 0h OT |
| Regresión: comportamiento idéntico al actual con DIURNA | antes=después | mismo resultado |

## Frontend — Formulario de empleado

- Campo opcional `shift_type` con dropdown:
  - "Default de empresa (actualmente: [X])" — opción `USE_ENTERPRISE_DEFAULT`
  - "Jornada diurna (8h/día)"
  - "Jornada mixta (7h/día)"
  - "Jornada nocturna (6h/día)"

## Frontend — Wizard paso 3

- Tooltip en el nombre del empleado o en la columna de horas: "Jornada: Nocturna (6h/día)" si el empleado tiene una jornada diferente a la empresa

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 66-01 | Schema campo shift_type en vpg_employees + migración | Fase 57 completa (ShiftType enum existe) |
| 66-02 | resolveEffectiveShiftType + LegalParamSet por empleado en NomineeService | Fase 56 + 66-01 |
| 66-03 | Unit tests de los 6 escenarios + test de regresión | 66-02 |
| 66-04 | Frontend: campo en formulario empleado + tooltip en wizard | 66-03 |

## Dependencies

- **Requiere:** Fase 56 (motor desacoplado y LegalParamSet), Fase 57 (ShiftType enum en enterprise)
- **No tiene dependientes directos**

## Constraints

- `npm test` pasa sin regresiones — empleados sin `shift_type` explícito se comportan exactamente igual que antes
- `npx tsc --noEmit` y `next lint` pasan
- Empleados existentes en BD tienen `shift_type = USE_ENTERPRISE_DEFAULT` por defecto — la migración no rompe ningún registro
- La empresa actualmente tiene jornada DIURNA (8h) — el valor default garantiza cero cambio en planillas existentes
