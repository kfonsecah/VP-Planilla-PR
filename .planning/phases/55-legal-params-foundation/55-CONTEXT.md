# Phase 55 Context: Fundación — Tabla vpg_legal_params y capa de servicio

**Phase:** 55-legal-params-foundation
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §11

## Objective

Crear la tabla `vpg_legal_params` y su capa completa de backend. Migrar todas las constantes hardcodeadas de `payrollUtils.ts` a registros en BD con fecha de vigencia. Nada en el motor de cálculo cambia todavía — esta fase es infraestructura pura.

## Scope

### In Scope
- `schema.prisma`: nuevo modelo `VpgLegalParam`
- Migración Prisma
- Script de seed con los 20+ valores actuales hardcodeados
- `LegalParamService.ts` con métodos de lectura y escritura
- `LegalParamController.ts` + `LegalParamRoute.ts` (admin-only)
- Unit tests del servicio

### Out of Scope
- Cambios al motor de cálculo (Fase 56)
- Frontend de administración (Fase 63)
- Alertas por cambio de params (Fase 61)

## Schema

```prisma
model VpgLegalParam {
  id             String    @id @default(cuid())
  key            String
  value          Decimal
  description    String
  category       String    // WORKDAY | OVERTIME | CCSS | MIN_WAGE | FEATURE_FLAG
  validFrom      DateTime
  validUntil     DateTime?
  isActive       Boolean   @default(true)
  isCritical     Boolean   @default(false)
  source_decree  String?
  createdBy      String
  updatedBy      String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("vpg_legal_params")
}
```

## Seed — valores iniciales completos

| Key | Value | Category | isCritical | Fuente |
|-----|-------|----------|------------|--------|
| WORKDAY_DIURNA_DAILY | 8 | WORKDAY | false | Art. 136 CT |
| WORKDAY_DIURNA_WEEKLY | 48 | WORKDAY | false | Art. 136 CT |
| WORKDAY_MIXTA_DAILY | 7 | WORKDAY | false | Art. 136 CT |
| WORKDAY_MIXTA_WEEKLY | 42 | WORKDAY | false | Art. 136 CT |
| WORKDAY_NOCTURNA_DAILY | 6 | WORKDAY | false | Art. 136 CT |
| WORKDAY_NOCTURNA_WEEKLY | 36 | WORKDAY | false | Art. 136 CT |
| OT_FACTOR | 1.5 | OVERTIME | **true** | Art. 139 CT |
| HOLIDAY_MANDATORY_FACTOR | 2.0 | OVERTIME | **true** | Art. 148 CT |
| HOLIDAY_TRIPLE_FACTOR | 3.0 | OVERTIME | **true** | Art. 148 CT |
| CCSS_OBRERO_SALUD | 5.50 | CCSS | **true** | Ley CCSS |
| CCSS_OBRERO_PENSION | 4.00 | CCSS | **true** | Ley CCSS |
| CCSS_OBRERO_BP | 1.00 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_SALUD | 9.25 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_PENSION | 5.25 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_INA | 1.50 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_IMAS | 0.50 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_ASFAM | 5.00 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_FONATEL | 0.25 | CCSS | **true** | Ley CCSS |
| CCSS_PATRONAL_BP | 0.25 | CCSS | **true** | Ley CCSS |
| MIN_WAGE_CHECK_ENABLED | 1 | FEATURE_FLAG | **true** | MTSS |

Regla de seed: `validFrom` = fecha real del decreto para CCSS; fecha de hoy como baseline para el resto.

## Regla de consulta

Siempre usar el registro con `validFrom <= fecha_calculo` más reciente. Garantiza que planillas históricas mantengan los valores correctos aunque los parámetros cambien.

## LegalParamService — métodos requeridos

- `getParam(key: string, date: Date): Promise<Decimal>`
- `getParamAtDate(key: string, date: Date): Promise<VpgLegalParam>`
- `getAllParams(): Promise<VpgLegalParam[]>`
- `getAllParamsByCategory(category: string): Promise<VpgLegalParam[]>`
- `getParamsAtDate(date: Date): Promise<Record<string, Decimal>>` — retorna mapa clave→valor para una fecha
- `getParamHistory(key: string): Promise<VpgLegalParam[]>`
- `upsertParam(data: CreateLegalParamDto, userId: string): Promise<VpgLegalParam>` — siempre crea nuevo registro, nunca sobreescribe

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 55-01 | Schema + migración + seed | — |
| 55-02 | LegalParamService + unit tests | 55-01 |
| 55-03 | Controller + Route (admin-only) | 55-02 |

## Dependencies

- Ninguna fase anterior requerida
- Fase 56 depende de esta fase
- Fases 59, 61, 64 dependen de esta fase

## Constraints

- `createdBy` se resuelve con el userId del token JWT — nunca hardcodeado
- `npx tsc --noEmit` debe pasar en `src/backend/` después de cada plan
- `npm test` debe pasar sin regresiones en `src/backend/`
- No romper ningún endpoint existente
