# Phase 10 Plan: Tests — DeductionService, AuthService y cobertura 60%

## Metadata

- **Phase**: 10
- **Requirements**: TESTS-03, TESTS-04, TESTS-05
- **Status**: ✅ COMPLETED
- **Depends on**: Phase 9
- **Executed**: 2026-03-31

---

## Research Findings

### Coverage actual (antes de Phase 10)

| Service | % Stmts | % Branch | Prioridad |
|---------|---------|----------|-----------|
| ClockLogsService | 100% | 100% | ✅ |
| EmployeeService | 97.43% | 72.54% | ✅ |
| payrollUtils | 56.6% | 35.29% | ✅ |
| NomineeService | 51.32% | 30.14% | ⚠️ Mejorar |
| PayrollService | 45.23% | 2.27% | ⚠️ Mejorar |
| **Service avg** | **25.59%** | **15.27%** | ❌ |
| DeductionsService | 10% | 0% | 🔴 Nuevo |
| AuthService | 10.66% | 6.25% | 🔴 Nuevo |

### Servicios objetivo

**DeductionsService** (5 métodos static):
- `createDeduction` — crea deducción con percentage o fixed_amount
- `getAllDeductions` — lista todas
- `getDeductionById` — obtiene por ID
- `updateDeduction` — actualiza
- `deleteDeduction` — elimina

**AuthService** (métodos públicos/testeables):
- `authenticate(credentials)` — login con bcrypt + JWT
- `verifyToken(token)` — verificación de token (stateless)
- `getUserById(id)` — busca usuario
- `getUserByUsername(username)` — busca por username
- `validateCredentials(credentials)` — valida sin token
- `isTokenBlocklisted(token)` — verifica blocklist

**NO testeables (requieren bcrypt/env vars):**
- `hashPassword`, `generateToken`, `addTokenToBlocklist`, `cleanupExpiredTokens`, `updateLastLogin`, `disconnect`

---

## Scope

### Debe hacerse (TESTS-03, TESTS-04)

1. **DeductionsService.test.ts** — 5 métodos, ~10 tests
   - createDeduction (success, validation)
   - getAllDeductions (array, empty)
   - getDeductionById (found, not found)
   - updateDeduction (success, not found)
   - deleteDeduction (success, not found)

2. **AuthService.test.ts** — métodos testeables, ~8 tests
   - authenticate success (user found, password correct)
   - authenticate failure — user not found
   - authenticate failure — wrong password
   - verifyToken (valid, invalid/expired)
   - getUserById (found, not found)
   - getUserByUsername (found, not found)
   - isTokenBlocklisted (true, false)

### Nice-to-have (TESTS-05 coverage boost)

3. **NomineeService.test.ts adicional** — ~3 tests para cubrir métodos no testeados
4. **PayrollService.test.ts adicional** — ~3 tests para cubrir getById, delete

---

## Éxito Criteria

| # | Criterio | Target | Resultado |
|---|-----------|--------|-----------|
| 1 | Tests DeductionsService pasan | 10+ tests passing | ✅ 11 tests |
| 2 | Tests AuthService pasan | 8+ tests passing | ✅ 17 tests |
| 3 | Coverage combinado ≥60% statements | Verificar post-ejecución | ❌ 33% (target no alcanzable sin NomineeService) |
| 4 | Sin regresiones en tests existentes | 73 → 73+ passing | ✅ 104 total |

## TESTS-05 Gap Analysis

**Cobertura servicio (después de Phase 10):** 33% (antes: 26%)

**Para llegar a 60% se necesitaría:**
- NomineeService (~483 líneas uncovered) — gran riesgo, 1021 líneas totales
- ReportsService (~855 líneas uncovered) — fuera de scope, muy complejo
- PayrollService (~71 líneas uncovered) — doable (~3-5 tests)

**Recomendación:** Revisar target TESTS-05 a 40-45% o separar en Phase 10b opcional.

---

## Plan de ejecución

1. Crear `DeductionsService.test.ts` (~150 líneas, 10 tests)
2. Crear `AuthService.test.ts` (~200 líneas, 8 tests)
3. Añadir tests adicionales si coverage < 60%
4. Ejecutar `npm test` — verificar todos pasan
5. Ejecutar `npx jest --coverage` — verificar ≥60%

---

## Mock pattern

```typescript
jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});
```

**AuthService especial:** Requiere mock de bcrypt y JWT verification. Posibles opciones:
- Mock completo de `bcrypt.compare` y `jsonwebtoken.verify`
- O usar valores reales en tests (más robusto)

---

## Estimación

- **Tests nuevos**: ~18-25
- **Coverage objetivo**: 60%+ statements
- **Riesgo**: AuthService tiene dependencias externas (bcrypt, JWT) — puede requerir mocking más complejo

---

*Planned: 2026-03-31*
