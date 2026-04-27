# Phase 60 Context: Advertencia de Tarifa Mínima en Planilla

**Phase:** 60-advertencia-tarifa-minima
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §15

## Objective

Proveer una validación visual e informativa (no bloqueante) durante el flujo de planilla si un empleado está ganando por debajo de la tarifa mínima global configurada. Esto permite al cliente mantener el control total sobre sus tarifas base mientras recibe alertas preventivas del sistema.

## Scope

### In Scope
- Lógica de validación en el backend/frontend que compara `position_base_salary` vs `GLOBAL_MIN_WAGE_RATE`.
- UI: Icono de advertencia (Tooltip/Badge) en el Payroll Wizard (Paso 2/3) junto al nombre del empleado afectado.
- Toggle `MIN_WAGE_CHECK_ENABLED` en `vpg_legal_params` para activar/desactivar estas advertencias globalmente.
- Registro de auditoría si se aprueba una planilla con advertencias activas (opcional).

### Out of Scope
- Bloqueo de la transición `BORRADOR` → `APROBADA`.
- Requerir contraseña o justificación obligatoria para proceder con salarios bajos (se mantiene como advertencia informativa).

## Comportamiento Esperado

1. Si `MIN_WAGE_CHECK_ENABLED` es `1` (true):
   - El Wizard calcula si `empleado.base_salary < GLOBAL_MIN_WAGE_RATE`.
   - Muestra un icono de "⚠️" con el texto: "Salario inferior a la tarifa mínima global (₡X.XX)".
2. Si `MIN_WAGE_CHECK_ENABLED` es `0` (false):
   - No se realizan comprobaciones ni se muestran advertencias.
3. La aprobación de la planilla procede normalmente en ambos casos.

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 60-01 | Lógica de detección de salarios bajos en el cálculo de planilla | Fase 59 completa |
| 60-02 | UI: Implementación de advertencias visuales en el Payroll Wizard | 60-01 |
| 60-03 | Toggle de configuración `MIN_WAGE_CHECK_ENABLED` | Fase 55 + 59 |

## Dependencies

- **Requiere:** Fase 59 (parámetro global disponible)
- **Requerida por:** Ninguna (fase final de este flujo)

## Constraints

- **No bloquear el proceso de negocio.** El cliente define sus precios por hora y el sistema no debe impedir la operación.
- `npx tsc --noEmit` y `next lint` deben pasar.
