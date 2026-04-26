# Phase 60 Context: Validación de Salario Mínimo al Aprobar Planilla

**Phase:** 60-validacion-salario-minimo-aprobacion
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §10

## Objective

Bloquear la transición `BORRADOR → APROBADA` cuando algún empleado recibe menos del salario mínimo legal para su categoría ocupacional. Introducir el toggle `MIN_WAGE_CHECK_ENABLED`, el permiso `payroll.override_legal_check` y el flujo de aprobación con excepción justificada.

## Scope

### In Scope
- `PayrollValidationService.ts` con método `validateMinimumWage(payrollId)`
- `PayrollService.approvePayroll` actualizado con validación + lógica de override
- Endpoint `POST /payroll/:id/approve` con body `{ overrideJustification?: string }`
- Permiso `payroll.override_legal_check` en sistema de roles
- Frontend: pre-check en wizard paso 4 antes de mostrar botón Aprobar
- Frontend: `BlockingAlertComponent` con lista de empleados en incumplimiento
- Frontend: flujo de override con textarea de justificación (solo para rol con permiso)
- Banner en wizard si `MIN_WAGE_CHECK_ENABLED = false`

### Out of Scope
- Panel de administración del toggle `MIN_WAGE_CHECK_ENABLED` (Fase 61 y 63)
- Alertas persistentes de cambio de parámetros (Fase 61)

## PayrollValidationService

```typescript
interface MinWageViolation {
  employeeId: number
  employeeName: string
  positionName: string
  categoria_ocupacional: string
  grossSalary: number
  minimumRequired: number
  deficit: number
}

interface MinWageValidationResult {
  passed: boolean
  violations: MinWageViolation[]
  checkEnabled: boolean  // valor de MIN_WAGE_CHECK_ENABLED al momento
}

class PayrollValidationService {
  static async validateMinimumWage(payrollId: number): Promise<MinWageValidationResult>
}
```

## Lógica de aprobación

```
approvePayroll(payrollId, userId, options?)
  → validateMinimumWage(payrollId) → result

  Si result.checkEnabled = false:
    → log en vpg_audit_logs: "Min wage check disabled — verification skipped"
    → continuar aprobación (no bloquear)

  Si result.passed = true:
    → cambiar estado a APROBADA

  Si result.passed = false AND result.checkEnabled = true:
    Si usuario tiene payroll.override_legal_check AND options.overrideJustification existe:
      → log en vpg_audit_logs: violaciones + justificación + userId
      → cambiar estado a APROBADA
    Sino:
      → lanzar error 422 con result.violations
```

## Flujo frontend — Wizard paso 4

1. Al llegar al paso 4, el wizard llama a `GET /payroll/:id/validate-min-wage` (o incluirlo en el response del cálculo)
2. Si hay violaciones y check está enabled:
   - Deshabilitar botón "Aprobar planilla"
   - Mostrar `BlockingAlertComponent` con tabla: Empleado | Puesto | Salario calculado | Mínimo requerido | Diferencia
   - Si usuario tiene override: mostrar botón secundario "Aprobar con excepción" + textarea obligatoria "Justificación (requerida)"
3. Si check disabled: banner amarillo "⚠️ Verificación de salario mínimo desactivada"
4. Si sin violaciones: flujo normal de aprobación

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 60-01 | PayrollValidationService + lógica de approvePayroll | Fase 55 + 59 completas |
| 60-02 | Endpoint /payroll/:id/approve actualizado + permiso override | 60-01 |
| 60-03 | Frontend: BlockingAlertComponent + pre-check en wizard | 60-02 |
| 60-04 | Frontend: flujo override con justificación | 60-03 |

## Dependencies

- **Requiere:** Fase 55 (MIN_WAGE_CHECK_ENABLED en BD), Fase 59 (getMinWageForPosition)
- **Requerida por:** ninguna directa

## Constraints

- La justificación de override debe tener mínimo 20 caracteres (validación Zod en frontend)
- El override queda en `vpg_audit_logs` con `entity: 'payroll'`, `action: 'APPROVED_WITH_OVERRIDE'`, lista de violaciones en JSON
- `npx tsc --noEmit` y `next lint` deben pasar
- Ningún empleado existente sin `categoria_ocupacional` en su puesto puede ser bloqueado — si no tiene categoría, la validación lo omite con mensaje informativo (no bloquea)
