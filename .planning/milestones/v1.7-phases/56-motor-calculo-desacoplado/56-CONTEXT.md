# Phase 56 Context: Motor de Cálculo Desacoplado de Constantes Hardcoded

**Phase:** 56-motor-calculo-desacoplado
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §3.1, §3.2, §11.1

## Objective

Eliminar todos los literales numéricos de `payrollUtils.ts` y hacer que el motor reciba un objeto `LegalParamSet` con los valores de BD. `NomineeService` carga esos parámetros desde `LegalParamService` usando la fecha de inicio del período. Los resultados de planilla no cambian — solo el origen de los valores.

## Scope

### In Scope
- Nueva interface `LegalParamSet` en `src/backend/src/types/payroll.types.ts`
- Actualizar todas las funciones de `payrollUtils.ts` para recibir `params: LegalParamSet`
- Constantes del archivo pasan a ser `DEFAULT_LEGAL_PARAMS` (solo para tests y fallback)
- `NomineeService.calculatePayrollForPeriod`: carga params desde `LegalParamService.getParamsAtDate(period.startDate)`
- `PayrollService`: ajustes si también invoca utils directamente
- Unit tests actualizados y nuevos tests con params personalizados

### Out of Scope
- Política de redondeo de minutos (Fase 58)
- Tipo de jornada por empleado (Fase 66)
- Frontend (ningún cambio)

## LegalParamSet interface

```typescript
export interface LegalParamSet {
  // Jornada
  regularHoursPerDay: number        // de WORKDAY_*_DAILY según shiftType
  regularHoursPerWeek: number       // de WORKDAY_*_WEEKLY según shiftType

  // Multiplicadores
  otFactor: number                  // OT_FACTOR
  holidayMandatoryFactor: number    // HOLIDAY_MANDATORY_FACTOR
  holidayTripleFactor: number       // HOLIDAY_TRIPLE_FACTOR

  // CCSS (solo obrero — patronal se calcula aparte si se necesita)
  ccssObreroSalud: number           // CCSS_OBRERO_SALUD
  ccssObrerosPension: number        // CCSS_OBRERO_PENSION
  ccssObreroBP: number              // CCSS_OBRERO_BP

  // Política de redondeo (se agrega en Fase 58, aquí se deja como opcional)
  minuteRoundingPolicy?: string
}
```

## Regla crítica

`NomineeService` carga el `LegalParamSet` UNA SOLA VEZ por planilla (fuera del loop de empleados), usando `period.startDate`. Se pasa como argumento a cada llamada de `payrollUtils`.

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 56-01 | Interface LegalParamSet + DEFAULT_LEGAL_PARAMS en payrollUtils | Fase 55 completa |
| 56-02 | Actualizar todas las funciones de payrollUtils para recibir params | 56-01 |
| 56-03 | NomineeService + PayrollService cargan params desde BD | 56-02 |
| 56-04 | Unit tests actualizados + tests con params personalizados | 56-03 |

## Tests requeridos

- Todos los tests existentes de `payrollUtils` actualizados para pasar `DEFAULT_LEGAL_PARAMS`
- Test: calcular con `OT_FACTOR = 2.0` produce horas extra al doble
- Test: calcular con `HOLIDAY_MANDATORY_FACTOR = 3.0` produce pago triple en feriado obligatorio
- Test de regresión: resultado idéntico al actual cuando se usan `DEFAULT_LEGAL_PARAMS`

## Gap verificado antes de ejecutar

> **Verificado 2026-04-26** — `vpg_enterprise` actualmente solo tiene 5 campos (`enterprise_id`, `enterprise_name`, `enterprise_image`, `enterprise_creation_date`, `enterpise_version`). Los siguientes campos **no existen en el schema**:
> - `isCommercialActivity` — para determinar descanso semanal según tipo de empresa
> - `minuteRoundingPolicy` — política de redondeo de minutos (→ Fase 58)
> - `ordinaryShiftType` — tipo de jornada por empleado (→ Fase 66)
>
> **Impacto en Phase 56:** `regularHoursPerDay` y `regularHoursPerWeek` en `LegalParamSet` deben resolverse con el parámetro `WORKDAY_ORDINARY_DAILY` (8h) como único valor disponible hasta que Fase 66 añada el campo de jornada al empleado. No intentar leer `ordinaryShiftType` de ningún modelo — el campo no existe. Documentar este hardcode como TODO→Fase 66 en el código.

## Dependencies

- **Requiere:** Fase 55 completa (LegalParamService disponible)
- **Requerida por:** Fase 58, Fase 64, Fase 66

## Constraints

- `npm test` debe pasar sin regresiones — cero cambios en resultados de cálculo
- `npx tsc --noEmit` en `src/backend/` debe pasar después de cada plan
- No se puede usar `any` en la firma de ninguna función modificada
- No tocar `payrollUtils.ts` más allá de recibir params — cero lógica de negocio nueva en esta fase
