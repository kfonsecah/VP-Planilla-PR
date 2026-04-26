# Phase 58 Context: Las 3 Modalidades de Redondeo de Minutos en el Motor

**Phase:** 58-redondeo-minutos-motor
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §4

## Objective

Implementar las tres políticas de redondeo de minutos (Exacto, Siempre Arriba, Cuartos Bidireccionales) en `payrollUtils.ts`. El motor aplica automáticamente la política configurada en `vpg_enterprise` durante cada cálculo.

## Scope

### In Scope
- Función `applyMinuteRounding(totalMinutes: number, policy: MinuteRoundingPolicy): number` en `payrollUtils.ts`
- `LegalParamSet` recibe `minuteRoundingPolicy` leído de `vpg_enterprise`
- `NomineeService`: carga `minuteRoundingPolicy` junto con los params legales
- Unit tests exhaustivos para los tres modos

### Out of Scope
- Frontend de configuración de la política (Fase 57)
- Ningún cambio de UI en esta fase

## Lógica de las 3 modalidades

### Modalidad A — EXACT
```typescript
return totalMinutes / 60;
```

### Modalidad B — ALWAYS_UP
```typescript
// Redondea al cuarto de hora inmediato superior
return Math.ceil(totalMinutes / 15) * 15 / 60;
```
Tabla:
- 0 min → 0.00h
- 1–15 min → 0.25h
- 16–30 min → 0.50h
- 31–45 min → 0.75h
- 46–59 min → 1.00h

### Modalidad C — NEAREST_QUARTER
```typescript
// Cuarto de hora más cercano, bidireccional
return Math.round(totalMinutes / 15) * 15 / 60;
```
Tabla:
- 0–7 min → 0.00h (se descarta)
- 8–22 min → 0.25h
- 23–37 min → 0.50h
- 38–52 min → 0.75h
- 53–59 min → 1.00h

## Unit tests obligatorios

Casos del Payroll.md §4 que deben reproducirse exactamente:

| Input | Política | Esperado | Descripción |
|-------|----------|----------|-------------|
| 431 min (7h11m) | EXACT | 7.1833h | Proporcional exacto |
| 431 min (7h11m) | ALWAYS_UP | 7.25h | Redondea a 0.25h siguiente |
| 424 min (7h4m) | NEAREST_QUARTER | 7.00h | 4 min < 8 → descarta |
| 438 min (7h18m) | NEAREST_QUARTER | 7.25h | 18 min entre 8–22 → 0.25h |
| 0 min | ALWAYS_UP | 0h | Sin fracción |
| 60 min | todas | 1.00h | Exactamente 1 hora |
| 15 min | ALWAYS_UP | 0.25h | Exactamente un cuarto |
| 8 min | NEAREST_QUARTER | 0.25h | Límite inferior de 0.25h |
| 7 min | NEAREST_QUARTER | 0.00h | Límite superior de descarte |

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 58-01 | `applyMinuteRounding` en payrollUtils + LegalParamSet actualizado | Fase 56 + 57 completas |
| 58-02 | NomineeService carga minuteRoundingPolicy de vpg_enterprise | 58-01 |
| 58-03 | Unit tests exhaustivos de las 3 modalidades | 58-02 |

## Dependencies

- **Requiere:** Fase 56 (LegalParamSet existe), Fase 57 (minuteRoundingPolicy en vpg_enterprise)
- **No tiene dependientes directos** — el motor ya usa esto automáticamente

## Constraints

- `npm test` pasa con todos los casos de la tabla anterior
- `npx tsc --noEmit` pasa en backend
- Si `minuteRoundingPolicy` es null/undefined: usar EXACT como fallback silencioso
- Cero cambios en resultados de planillas existentes si la empresa tiene EXACT (default)
