# Phase 44: Core — Motor de Feriados Globales Configurables - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

La arquitectura actual de nómina (payrollUtils.ts) asume los feriados de Costa Rica como valores quemados (hardcoded) y no soporta su uso dinámico en las matemáticas salariales, causando un vacío de cálculo con respecto al pago obligatorio (ej: si se trabaja un feriado obligatorio, la ley exige pago x2). 

Asimismo, los eventos están atados 1:1 a un empleado. La realidad B2B requiere que el cliente administre qué feriados existen, si son obligatorios, y si permiten cobros adicionales, ya que el riesgo legal recae en ellos.

Esta fase crea una tabla `CompanyHoliday` en Prisma, ajusta las reglas de cálculo salarial, y expone una UI para que RRHH tenga total flexibilidad sobre las reglas de feriados globales.
</domain>

<decisions>
## Implementation Decisions

### 1. Schema Base de Datos
- Crear modelo `CompanyHoliday` en Prisma.
- Campos mínimos: `id`, `date` (DateTime), `name` (String), `is_mandatory_pay` (Boolean, default false), `allow_triple_overtime` (Boolean, default false), `status` (active/inactive).

### 2. Backend & Math Logic
- Exponer rutas CRUD para `CompanyHoliday`.
- Modificar `payrollUtils.ts`:
  - `calculateGrossSalary` y relacionados deben recibir `CompanyHoliday[]` generados para el rango de fechas en lugar de la variable hardcodeada `FERIADOS_CR`.
  - Si un día (log) coincide con un feriado donde `is_mandatory_pay=true`, aplicar lógica de multiplicador:
    - Se suma el día automáticamente incluso sin marca (si está en su patrón).
    - Si existe marca y `allow_triple_overtime=true` y son horas extras, multiplicar x3.
    - Si hay marcas en día obligatorio (regular), multiplicar por x2.

### 3. Frontend & UX
- Construir sección en `/pages/configuracion/feriados` o en alguna vista administrativa global.
- Modificar el calendario (`LaborEventsCalendar.tsx` de la fase 43) para jalar `CompanyHolidays` desde la API (sustituir el utilitario hardcodeado en `holidays.ts` por data del endpoint).

</decisions>
