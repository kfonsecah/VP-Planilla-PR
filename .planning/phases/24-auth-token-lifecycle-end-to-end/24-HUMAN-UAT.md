---
status: partial
phase: 24-auth-token-lifecycle-end-to-end
source: [24-VERIFICATION.md]
started: 2026-04-09T19:45:00Z
updated: 2026-04-09T20:22:00Z
---

## Current Test

3. Manual end-to-end flow

## Tests

### 1. Backend auth lifecycle suites
expected: Ejecutar auth.lifecycle.test.ts, AuthMiddleware.test.ts y AuthService.test.ts; todos pasan y mantienen contrato canónico 401/403 para token revoked/expired/invalid/missing.
result: [pass] 3 suites passed, 26 tests passed; warning no bloqueante de salida de worker/open handles.

### 2. Frontend auth lifecycle suites
expected: Ejecutar http.auth.test.ts y useAuth.logout.test.tsx; validar single-flight refresh, retry-once y forced cleanup/logout.
result: [pass] 2 suites passed, 4 tests passed.

### 3. Manual end-to-end flow
expected: Login -> refresh -> logout -> acceso protegido con token viejo debe fallar con 401 canónico y redirección a /auth.
result: [pending]
notes:
- Guion recomendado:
  1) Login en frontend con usuario válido.
  2) Confirmar que `vp_access_token` y `vp_refresh_token` existen en localStorage.
  3) Invocar endpoint protegido (`/api/me`) y confirmar 200.
  4) Ejecutar logout desde UI.
  5) Confirmar que localStorage elimina `vp_access_token`, `vp_refresh_token` y `user`.
  6) Intentar reusar el access token viejo en `/api/me` (Postman/cURL) y confirmar 401 con `error.code = AUTH_TOKEN_REVOKED`.
  7) Confirmar que frontend queda/redirige a `/auth` tras logout o fallo auth forzado.

## Summary

total: 3
passed: 2
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
