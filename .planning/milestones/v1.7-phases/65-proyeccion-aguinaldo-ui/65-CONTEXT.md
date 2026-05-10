# Phase 65 Context: Proyección de Aguinaldo en UI

**Phase:** 65-proyeccion-aguinaldo-ui
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §9

## Objective

Los empleados y el resumen de planilla muestran el aguinaldo acumulado proporcional en tiempo real. El cálculo usa el salario bruto de las planillas aprobadas o pagadas en el período diciembre→noviembre vigente.

## Scope

### In Scope
- `AguinaldoService.ts` con métodos de cálculo de acumulado y proyección
- Endpoints `GET /employees/:id/aguinaldo` y `GET /payroll/:id/aguinaldo-summary`
- Frontend: card en perfil de empleado con monto acumulado + barra de progreso del año
- Frontend: columna "Aguinaldo acum." en wizard paso 3
- Frontend: box de resumen en wizard paso 4

### Out of Scope
- Pago real del aguinaldo (flujo separado no en scope de esta fase)
- Cambios al motor de cálculo

## AguinaldoService — métodos

```typescript
interface AguinaldoAccrual {
  accrued: number             // suma grossSalary / 12 de los períodos del año
  projectedAnnual: number     // proyección al 20 de diciembre si se mantiene ritmo
  periodStart: Date           // 1° de diciembre del año anterior
  periodEnd: Date             // 30 de noviembre del año en curso
  monthsCompleted: number     // meses completados en el período (aproximado)
  payrollsIncluded: number    // cantidad de planillas incluidas en el cálculo
}

static async calculateAccruedAguinaldo(employeeId: number, asOfDate: Date): Promise<AguinaldoAccrual>
```

Lógica:
1. Determinar período aguinaldo: 1° diciembre del año anterior → asOfDate (máximo 30 noviembre)
2. Sumar `vpg_payroll_employee.gross_salary` donde `payroll.status IN ('APROBADA', 'PAGADA')` Y `payroll.period_start >= periodoStart` Y el empleado está en esa planilla
3. `accrued = suma / 12`
4. `monthsCompleted = aproximación de meses desde periodoStart a asOfDate`
5. `projectedAnnual = (suma / monthsCompleted) * 12 / 12` — proyecta la suma completa al año

```typescript
static async getAguinaldoSummaryForPayroll(payrollId: number): Promise<Array<{
  employeeId: number
  employeeName: string
  accruedBeforeThisPayroll: number  // acumulado sin incluir esta planilla
  thisPayrollContribution: number   // gross_salary de esta planilla / 12
  totalAccruedWithThis: number      // acumulado + contribución
}>>
```

## Frontend — Perfil de empleado

- Card "Aguinaldo acumulado":
  - Monto en ₡ con 2 decimales
  - Barra de progreso: % del año de aguinaldo completado (1° dic → 30 nov)
  - Label: "Acumulado a [fecha]"
  - Subtexto: "Basado en X planillas aprobadas en el período"
  - Proyección: "Proyectado al 20 dic: ₡[monto]"

## Frontend — Wizard paso 3 (Revisar)

- Columna adicional en la tabla de empleados: "Aguinaldo acum."
- Valor = `accruedBeforeThisPayroll` de `getAguinaldoSummaryForPayroll`
- Tooltip: "Acumulado antes de esta planilla. Al aprobar se agregará ₡[thisPayrollContribution]"

## Frontend — Wizard paso 4 (Aprobar)

- Box de resumen al final de la página:
  - "Compromiso total de aguinaldo generado en esta planilla: ₡[suma thisPayrollContribution]"
  - "Aguinaldo total acumulado por todos los empleados al aprobar: ₡[suma totalAccruedWithThis]"

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 65-01 | AguinaldoService + unit tests | — |
| 65-02 | Endpoints GET /employees/:id/aguinaldo y GET /payroll/:id/aguinaldo-summary | 65-01 |
| 65-03 | Frontend: card en perfil de empleado | 65-02 |
| 65-04 | Frontend: columna en wizard paso 3 + box en paso 4 | 65-02 |

## Dependencies

- **No requiere** ninguna otra fase de este milestone (es independiente)
- Depende de que `vpg_payroll_employee.gross_salary` exista (ya existe en producción)

## Constraints

- Si no hay planillas aprobadas en el período, mostrar ₡0.00 (no error)
- Período aguinaldo se calcula dinámicamente según la fecha — no hardcodear años
- `npx tsc --noEmit` y `next lint` pasan
- No raw `fetch` — todo por `@/services/http.ts`
