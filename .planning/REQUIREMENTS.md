# Milestone v1.10 Requirements — Production Hardening & DX

## 1. Observability (OBS)

- [ ] **OBS-01**: Integrar Sentry SDK en el Backend (Express 5) usando el patrón de inicialización `--import` para instrumentación temprana.
- [ ] **OBS-02**: Integrar Sentry SDK en el Frontend (Next.js 15) usando `instrumentation.ts` y `global-error.tsx`.
- [ ] **OBS-03**: Configurar Distributed Tracing para vincular trazas entre el Frontend y el Backend.

## 2. Security (SEC)

- [ ] **SEC-01**: Implementar middleware `hpp` en Express para protección contra HTTP Parameter Pollution.
- [ ] **SEC-02**: Implementar un middleware global de normalización de `req.query` para mitigar riesgos de Express 5 y HPP, convirtiendo parámetros múltiples en valores únicos (last-value-wins). La refactorización con Zod se difiere a deuda técnica.

## 3. Developer Experience (DX)

- [ ] **DX-01**: Configurar Husky y Commitlint para forzar Conventional Commits en el repositorio.
- [ ] **DX-02**: Integrar `prisma-dbml-generator` en `schema.prisma` para generación automática de diagramas de base de datos (DBML).

## Future Requirements (Deferred)

- [ ] **DX-03**: Configurar Semantic Release para versionado automático basado en commits.
- [ ] **OBS-04**: Implementar Sentry Session Replay para el Frontend.

## Out of Scope

- **Migración a Microservicios**: Fuera del alcance para este milestone de hardening.
- **Auditoría de Seguridad Externa**: Solo se implementan protecciones básicas de middleware.

## Traceability Matrix

| REQ-ID | Phase | Status |
|--------|-------|--------|
| OBS-01 | Phase 76 | Pending |
| OBS-02 | Phase 76 | Pending |
| OBS-03 | Phase 76 | Pending |
| SEC-01 | Phase 75 | Pending |
| SEC-02 | Phase 75 | Pending |
| DX-01  | Phase 74 | Pending |
| DX-02  | Phase 74 | Pending |
