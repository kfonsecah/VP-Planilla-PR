# Requirements: VP-Planilla v1.4

**Defined:** 2026-04-09
**Milestone:** v1.4 — Stability and Integration Hardening
**Core Value:** Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

---

## v1.4 Requirements

### Auth Lifecycle (AUTH)

- [x] **AUTH-05**: El frontend renueva access tokens de forma consistente usando refresh token sin romper sesiones activas
- [x] **AUTH-06**: El backend invalida tokens revocados/expirados en todos los endpoints protegidos
- [x] **AUTH-07**: Logout invalida la sesion de forma completa (cliente + servidor) y evita reutilizacion de tokens previos
- [x] **AUTH-08**: Los errores de autenticacion son uniformes y manejables por el frontend (401/403 con payload consistente)

### HTTP Integration Layer (HTTP)

- [x] **HTTP-01**: Todas las llamadas frontend a backend pasan por `src/frontend/src/services/http.ts` (sin bypass)
- [x] **HTTP-02**: Los servicios frontend normalizan manejo de errores y retries siguiendo un patron comun
- [x] **HTTP-03**: No existen llamadas `fetch` directas en hooks/components de negocio

### Repository Hygiene (HYG)

- [x] **HYG-01**: Artefactos generados (`dist/`, `target/`, lock temporales, outputs de build) no se versionan
- [x] **HYG-02**: `.gitignore` cubre artefactos de backend, frontend y Java utility de forma consistente
- [x] **HYG-03**: Flujo de build local no depende de archivos generados ya presentes en git

### Modularization and Maintainability (MOD)

- [x] **MOD-01**: Los archivos monoliticos de alta complejidad se separan en modulos con responsabilidad clara
- [x] **MOD-02**: La logica de parsing/importacion de marcas queda desacoplada de componentes de pagina grandes
- [x] **MOD-03**: Los cambios de modularizacion mantienen comportamiento funcional verificado por pruebas

---

## v2 Requirements (Deferred)

### Security and Platform

- **SEC-01**: Rotacion automatica de secretos y llaves con politicas por entorno
- **OBS-01**: Observabilidad completa de auth/session lifecycle (tracing + dashboards)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nuevos modulos funcionales de negocio (nomina, vacaciones, reportes) | v1.4 enfocado en estabilizacion transversal |
| Reescritura completa de frontend/backend | Alto riesgo, se prioriza refactor incremental |
| Cambio de framework principal | No necesario para resolver concerns actuales |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-05 | Phase 24 | Complete |
| AUTH-06 | Phase 24 | Complete |
| AUTH-07 | Phase 24 | Complete |
| AUTH-08 | Phase 24 | Complete |
| HTTP-01 | Phase 25 | Complete |
| HTTP-02 | Phase 25 | Complete |
| HTTP-03 | Phase 25 | Complete |
| HYG-01 | Phase 26 | Complete |
| HYG-02 | Phase 26 | Complete |
| HYG-03 | Phase 26 | Complete |
| MOD-01 | Phase 27 | Complete |
| MOD-02 | Phase 27 | Complete |
| MOD-03 | Phase 27 | Complete |

**Coverage:**
- v1.4 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after v1.4 initialization*
