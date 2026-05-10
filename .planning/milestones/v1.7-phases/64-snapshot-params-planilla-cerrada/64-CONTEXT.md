# Phase 64 Context: Snapshot de Parámetros Legales en Planilla Cerrada

**Phase:** 64-snapshot-params-planilla-cerrada
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §13

## Objective

Cada planilla aprobada captura en BD los valores exactos de los parámetros legales vigentes en su período. Permite reproducir cualquier planilla histórica y cumplir auditorías CCSS/MTSS años después, independientemente de cambios posteriores a los parámetros.

## Scope

### In Scope
- Nuevo modelo `VpgPayrollParamSnapshot` en schema.prisma + migración
- `PayrollService.approvePayroll`: captura snapshot al transicionar a APROBADA
- También captura `minuteRoundingPolicy` y `ordinaryShiftType` de `vpg_enterprise` al momento
- Endpoint `GET /payroll/:id/snapshot`
- `PayrollService.getPayrollWithSnapshot(payrollId)`
- Frontend: sección "Parámetros utilizados" en página de detalle de planilla

### Out of Scope
- Ningún cambio al motor de cálculo

## Schema

```prisma
model VpgPayrollParamSnapshot {
  id             String   @id @default(cuid())
  payroll_id     Int
  param_key      String
  param_value    Decimal
  param_valid_from DateTime
  source_decree  String?
  captured_at    DateTime @default(now())

  payroll        vpg_payrolls @relation(fields: [payroll_id], references: [id])

  @@map("vpg_payroll_param_snapshots")
}
```

Agregar también en el snapshot como registros especiales:
- `ENTERPRISE_MINUTE_ROUNDING_POLICY` (valor = index del enum como string)
- `ENTERPRISE_ORDINARY_SHIFT_TYPE`
- `ENTERPRISE_IS_COMMERCIAL_ACTIVITY`

## Lógica de captura

```typescript
// En PayrollService.approvePayroll, después de validar y antes de cambiar estado:
const paramsAtPeriodStart = await LegalParamService.getAllParamsWithMeta(payroll.period_start)
const enterpriseConfig = await EnterpriseService.getConfig()

const snapshotData = [
  ...paramsAtPeriodStart.map(p => ({
    payroll_id: payrollId,
    param_key: p.key,
    param_value: p.value,
    param_valid_from: p.validFrom,
    source_decree: p.source_decree
  })),
  { payroll_id, param_key: 'ENTERPRISE_MINUTE_ROUNDING_POLICY', param_value: ..., param_valid_from: now },
  { payroll_id, param_key: 'ENTERPRISE_ORDINARY_SHIFT_TYPE', param_value: ..., param_valid_from: now },
  { payroll_id, param_key: 'ENTERPRISE_IS_COMMERCIAL_ACTIVITY', param_value: ..., param_valid_from: now },
]

await prisma.vpgPayrollParamSnapshot.createMany({ data: snapshotData })
```

## Frontend — Detalle de planilla

- Sección colapsable "Parámetros utilizados en el cálculo" (visible solo cuando estado = APROBADA o PAGADA)
- Tabla agrupada por categoría: Parámetro | Valor | Vigente desde | Decreto
- Badge en header: "Calculado con Decreto [X]" si hay `source_decree` consistente
- Si la planilla es BORRADOR: sección no aparece (aún no hay snapshot)

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 64-01 | Schema VpgPayrollParamSnapshot + migración | Fase 55 + 57 completas |
| 64-02 | Captura de snapshot en approvePayroll + endpoint GET | 64-01 |
| 64-03 | Frontend: sección en detalle de planilla | 64-02 |

## Dependencies

- **Requiere:** Fase 55 (LegalParamService con getAllParamsWithMeta), Fase 56 (motor desacoplado), Fase 57 (enterprise config)
- **No tiene dependientes directos**

## Constraints

- Si el snapshot ya existe para una planilla, no duplicar — `createMany` con `skipDuplicates`
- Planillas históricas (anteriores a esta fase) no tendrán snapshot — la UI debe manejarlo gracefully con mensaje "Datos de parámetros no disponibles para planillas anteriores a [fecha de implementación]"
- `npx tsc --noEmit` y `next lint` pasan
