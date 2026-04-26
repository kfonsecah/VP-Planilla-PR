# Phase 59 Context: Categoría Ocupacional en Puestos + Salarios Mínimos en BD

**Phase:** 59-categoria-ocupacional-salarios-minimos
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §10.2, §15

## Objective

Los puestos adquieren el campo `categoria_ocupacional`. Los salarios mínimos del Decreto MTSS vigente entran a `vpg_legal_params` con fecha de vigencia real. Se crea el método de servicio que resuelve el salario mínimo aplicable para un puesto en una fecha dada.

## Scope

### In Scope
- Campo `categoria_ocupacional` (String) en `vpg_positions` — migración
- Seed de salarios mínimos MTSS (decreto julio 2025) en `vpg_legal_params` como `MIN_WAGE_[CATEGORIA_SLUG]`
- `LegalParamService.getMinWageForPosition(positionId, date)` → número
- `PositionService`: CRUD actualizado para incluir `categoria_ocupacional`
- Frontend: dropdown `categoria_ocupacional` en formularios crear/editar puesto
- Frontend: sección de salarios mínimos en panel de parámetros legales (parte de Fase 63, pero la UI básica de gestión de min wages se entrega aquí)

### Out of Scope
- La validación al aprobar planilla (Fase 60)
- El panel completo de params legales (Fase 63)

## Categorías ocupacionales del Decreto MTSS

Usar las categorías reales del decreto vigente. Keys propuestos:

| Key en vpg_legal_params | Categoría |
|------------------------|-----------|
| MIN_WAGE_TRABAJADOR_NO_CALIFICADO | Trabajador no calificado |
| MIN_WAGE_TRABAJADOR_SEMICALIFICADO | Trabajador semicalificado |
| MIN_WAGE_TRABAJADOR_CALIFICADO | Trabajador calificado |
| MIN_WAGE_TECNICO | Técnico |
| MIN_WAGE_UNIVERSITARIO_1_3 | Universitario 1-3 años |
| MIN_WAGE_UNIVERSITARIO_4_PLUS | Universitario 4+ años o licenciatura |

`source_decree` = número del decreto MTSS más reciente. `validFrom` = fecha real de vigencia del decreto.

## LegalParamService — método nuevo

```typescript
async getMinWageForPosition(positionId: number, date: Date): Promise<number>
```
1. Busca `vpg_positions.categoria_ocupacional` para el `positionId`
2. Construye key: `MIN_WAGE_${categoria_slug}`
3. Llama a `getParamAtDate(key, date)`
4. Retorna el valor como número
5. Si no existe la categoría o el param: lanza error descriptivo

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 59-01 | Campo `categoria_ocupacional` en vpg_positions + migración | — |
| 59-02 | Seed de salarios mínimos en vpg_legal_params | Fase 55 completa |
| 59-03 | `getMinWageForPosition` en LegalParamService | 59-01 + 59-02 |
| 59-04 | PositionService + endpoint actualizados | 59-01 |
| 59-05 | Frontend: dropdown en formulario de puesto | 59-04 |

## Dependencies

- **Requiere:** Fase 55 (vpg_legal_params existe)
- **Requerida por:** Fase 60 (validación al aprobar)

## Constraints

- Los valores de salario mínimo deben ser los del decreto MTSS vigente (julio 2025) — no inventar valores
- `categoria_ocupacional` es opcional (nullable) — puestos existentes no se rompen
- `npx tsc --noEmit` y `next lint` deben pasar
