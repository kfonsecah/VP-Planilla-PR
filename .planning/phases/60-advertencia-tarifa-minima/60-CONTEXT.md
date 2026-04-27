# Phase 60 Context: Advertencia de Tarifa Mínima en Planilla

**Phase:** 60-advertencia-tarifa-minima
**Milestone:** v1.7
**Status:** In Planning
**Spec reference:** Payroll.md §15

## Objective

Proveer una validación visual e informativa (no bloqueante) durante el flujo de planilla si un empleado está ganando por debajo de la tarifa mínima global configurada. Esto permite al cliente mantener el control total sobre sus tarifas base mientras recibe alertas preventivas del sistema.

## Scope

### In Scope
- Lógica de detección en el frontend que compara `position_base_salary` vs `GLOBAL_MIN_WAGE_RATE`.
- UI: Icono de advertencia (Tooltip/Badge) en el Payroll Wizard (Paso 2/3) junto al nombre del empleado afectado.
- Toggle `MIN_WAGE_CHECK_ENABLED` en `vpg_legal_params` para activar/desactivar estas advertencias globalmente.
- **Registro de auditoría en el backend** cuando se aprueba una planilla que contiene empleados con salarios por debajo del mínimo (si las advertencias están activas).

### Out of Scope
- Bloqueo de la transición `BORRADOR` → `APROBADA`.
- Requerir contraseña o justificación obligatoria para proceder con salarios bajos (se mantiene como advertencia informativa).

## Comportamiento Esperado

1. Si `MIN_WAGE_CHECK_ENABLED` es `1` (true):
   - El Wizard calcula si `empleado.base_salary < GLOBAL_MIN_WAGE_RATE`.
   - Muestra un icono de "⚠️" con el texto: "Salario inferior a la tarifa mínima global (₡X.XX)".
   - Al aprobar la planilla, el backend registra un evento en `vpg_audit_logs` indicando que se procesó con advertencias de salario mínimo.
2. Si `MIN_WAGE_CHECK_ENABLED` es `0` (false):
   - No se realizan comprobaciones ni se muestran advertencias.
   - No se genera log de auditoría especial por este motivo.
3. La aprobación de la planilla procede normalmente en ambos casos.

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 60-01 | Infraestructura: `legalParamService` (Frontend) y `PayrollService` (Backend Audit) | Fase 55 + 59 |
| 60-02 | UI: Implementación de advertencias visuales en el Payroll Wizard | 60-01 |
| 60-03 | Configuración: Hook de gestión y toggle UI en Enterprise Config | 60-01 |

## Dependencies

- **Requiere:** Fase 55 (Tabla legal_params) y Fase 59 (Parámetro GLOBAL_MIN_WAGE_RATE)
- **Requerida por:** Ninguna

## Constraints

- **No bloquear el proceso de negocio.**
- **Cumplimiento de PHASE_CONTRACT.md:**
  - Regla de formularios (4.2): Usar hooks para lógica de datos, no directamente en Pages.
  - Regla de Prisma: Usar singleton.
- `npx tsc --noEmit` y `next lint` deben pasar.
