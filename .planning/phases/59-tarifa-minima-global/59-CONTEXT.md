# Phase 59 Context: Tarifa Mínima Global (Opcional)

**Phase:** 59-tarifa-minima-global
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §10.2

## Objective

Añadir un parámetro global en `vpg_legal_params` para definir una tarifa mínima por hora de referencia. Esto simplifica la administración para el cliente, evitando el uso de un catálogo complejo de categorías ocupacionales del MTSS, y permitiendo una validación rápida y configurable.

## Scope

### In Scope
- Registro `GLOBAL_MIN_WAGE_RATE` en `vpg_legal_params` con un valor por defecto.
- Método `LegalParamService.getGlobalMinWageRate(date)` que retorna la tarifa vigente.
- Soporte para que este parámetro sea editable en el Panel de Parámetros Legales (Fase 63).

### Out of Scope
- Campo `categoria_ocupacional` en `vpg_positions` (descartado por redundante para el cliente).
- Validación de puestos individuales contra tablas del MTSS.
- Bloqueo de aprobación de planilla (Fase 60).

## Parámetros Legales

| Key en vpg_legal_params | Descripción |
|------------------------|-------------|
| GLOBAL_MIN_WAGE_RATE | Tarifa mínima por hora de referencia para advertencias en planilla. |

## LegalParamService — método nuevo

```typescript
async getGlobalMinWageRate(date: Date): Promise<number>
```
1. Llama a `getParamAtDate('GLOBAL_MIN_WAGE_RATE', date)`
2. Retorna el valor como número o un valor por defecto si no existe.

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 59-01 | Seed del parámetro `GLOBAL_MIN_WAGE_RATE` en vpg_legal_params | Fase 55 completa |
| 59-02 | `getGlobalMinWageRate` en LegalParamService | 59-01 |

## Dependencies

- **Requiere:** Fase 55 (vpg_legal_params existe)
- **Requerida por:** Fase 60 (advertencia en planilla)

## Constraints

- El valor es puramente informativo/referencial.
- `npx tsc --noEmit` debe pasar.
