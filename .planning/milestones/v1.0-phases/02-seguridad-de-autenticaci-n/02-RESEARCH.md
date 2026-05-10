# Phase 2: Seguridad de Autenticación - Research

**Researched:** 2026-03-25
**Domain:** Express 5 authentication hardening — middleware application, JWT startup assertion, credential hygiene, throw-undefined bug, temp file cleanup
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 2 is a brownfield security hardening phase. Every finding in this document is verified by reading the actual source files — there is no speculation. The problems are exactly as described in CONCERNS.md, and the fixes are highly mechanical.

The core pattern throughout is the same: protective code exists (`AuthMiddleware.verifyToken`) but was not consistently applied. Thirteen of sixteen route files expose all their endpoints without calling `verifyToken`. The two approaches for fixing this — per-router `router.use()` vs per-route inline — are both present in the existing codebase (ReportsRoute uses `router.use()`, UserRoute uses per-route). Either approach is valid; consistency within the phase is what matters.

The JWT fallback, login query-param fallback, throw-undefined bug, and temp files are all single-location, surgical fixes requiring no architectural decisions.

**Primary recommendation:** Apply `router.use(asyncHandler(AuthMiddleware.verifyToken))` at the top of each of the 13 unprotected route files, add a startup assertion in `index.ts` for `JWT_SECRET`, remove the `req.query` fallback in `AuthController.ts`, fix the `throw error(...)` in `PayrollService.ts`, and delete all 5 temp files.

---

## Project Constraints (from CLAUDE.md)

### Must Follow — Naming and Structure
- Backend files: `PascalCase.ts`
- New routes: must use `asyncHandler` wrapper AND apply `AuthMiddleware.verifyToken`
- Static methods only — no class instantiation
- JSDoc on every public method (`@param`, `@returns`, `@throws`)
- Error responses: `{ success: false, error: "message" }` with appropriate HTTP status

### Must Not Change Without Instruction
- `src/backend/src/utils/asyncHandler.ts` — all route handlers depend on it
- `src/backend/src/middleware/AuthMiddleware.ts` — only extend, never remove existing methods
- `localStorage` keys `vp_access_token` / `vp_refresh_token`

### Type Safety
- No `any` in new method signatures
- `npx tsc --noEmit` must pass after every change

### Tests
- `npm test` runs Jest + ts-jest in `src/backend/`
- Config: `src/backend/jest.config.js` — `testMatch: ['**/__tests__/**/*.test.ts']`
- Only one test file currently exists: `PayrollService.test.ts`

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| 2.1 | `AuthMiddleware.verifyToken` applied in all 13 unprotected route files | Full audit below — exact files and current state documented |
| 2.2 | `curl` without token to `/api/employees` returns 401 | Confirmed: EmployeeRoute has zero auth — currently returns 200 |
| 2.3 | Server does not start if `JWT_SECRET` absent in `.env` | `index.ts` has no assertion; AuthService falls back to hardcoded secret |
| 2.4 | Login only accepts credentials from `req.body` — remove `req.query` fallback | Exact lines: `AuthController.ts` lines 13–14 |
| 2.5 | 5 temp files deleted from repo | All 5 files confirmed to exist at exact paths |
| 2.6 | `PayrollService.updatePayroll` throws `new Error(...)` instead of `throw undefined` | Exact lines: `PayrollService.ts` line 3 (import) and line 132 (throw) |
</phase_requirements>

---

## REQ 2.1 — Complete Route Auth Audit

### Currently PROTECTED (do not touch)

| Route File | Protection Method | Endpoints |
|------------|-------------------|-----------|
| `ReportsRoute.ts` | `router.use(AuthMiddleware.verifyToken)` — router-level, covers all 5 routes | `GET /reports/dashboard`, `GET /reports/payroll/:id/employees`, `GET /reports/payroll/:id/logs`, `POST /reports/payroll/:id/send`, `POST /reports/payroll/:id/payment-receipts/pdf` |
| `UserRoute.ts` | Per-route `asyncHandler(AuthMiddleware.verifyToken)` on all 3 routes | `GET /users`, `GET /users/roles`, `PUT /users/:userId/permissions` |
| `AuthRoute.ts` | Per-route on `/me`, `/logout`, `/change-password` — `/login`, `/validate`, `/refresh` intentionally public | Mixed — public endpoints correctly unprotected |

### Currently UNPROTECTED (all 13 must be fixed in REQ 2.1)

| Route File | Endpoints Exposed Without Auth |
|------------|-------------------------------|
| `EmployeeRoute.ts` | `POST /employee/create`, `GET /employee/:id`, `PUT /employee/:id`, `GET /employee` |
| `PayrollRoutes.ts` | `GET /payrolls`, `POST /payroll/create`, `GET /payroll/:id`, `PUT /payroll/:id`, `GET /payroll/:id/employees` |
| `BonusesRoute.ts` | `POST /bonuses`, `GET /bonuses/:id`, `PUT /bonuses/:id`, `DELETE /bonuses/:id` |
| `ClockLogsRoute.ts` | `GET /clock-logs`, `POST /clock-logs/bulk` |
| `DeductionsRoute.ts` | `POST /deduction/create`, `GET /deductions`, `PUT /deductions/:id`, `DELETE /deductions/:id` |
| `EmployeeDeductionsRoute.ts` | `POST /employee-deductions/assign`, `DELETE /employee-deductions/:employeeId/:deductionId` |
| `LaborEventsRoute.ts` | `POST /labor-events/create`, `GET /labor-events`, `PUT /labor-events/:id`, `DELETE /labor-events/:id`, `POST /labor-events/assign` |
| `NomineeRoute.ts` | `GET /nominee/clocklogs`, `GET /nominee/employee-deductions/:employeeId`, `POST /nominee/calculate`, `POST /nominee/calculate-payroll` |
| `PaymentReceiptRoute.ts` | `GET /:payrollId/employee/:employeeId`, `GET /:payrollId/employee/:employeeId/data`, `GET /:payrollId/employee/:employeeId/html`, `POST /:payrollId/batch` |
| `PayrollTypeRoute.ts` | `POST /payroll-type/create`, `PUT /payroll-type/:id`, `GET /payroll-type/:id`, `GET /payroll-types` |
| `PositionRoute.ts` | `POST /positions`, `GET /positions`, `GET /positions/:id`, `PUT /positions/:id`, `DELETE /positions/:id` |
| `VacationRoute.ts` | `POST /vacations`, `GET /vacations`, `GET /vacations/:id`, `PUT /vacations/:id`, `DELETE /vacations/:id` |
| `AuditLogsRoute.ts` | `GET /audit-logs`, `GET /audit-logs/:id` |

### How AuthMiddleware.verifyToken Works (exact signature)

```typescript
// src/backend/src/middleware/AuthMiddleware.ts
static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response | void>
```

- Returns 401 `{ success: false, message: 'Token de acceso requerido' }` if `Authorization` header missing
- Returns 401 `{ success: false, message: 'Token inválido' }` if JWT verification fails
- Calls `next()` on success, attaches user to `req.user`
- Is `async` — MUST be wrapped with `asyncHandler` when used inline

### Two Valid Patterns (both exist in codebase)

**Pattern A — Router-level (used by ReportsRoute):**
```typescript
// Apply once at top of router — covers all routes in this file
router.use(AuthMiddleware.verifyToken);
```

**Pattern B — Per-route inline (used by UserRoute):**
```typescript
router.get(
  "/path",
  asyncHandler(AuthMiddleware.verifyToken),
  asyncHandler(Controller.method)
);
```

**Recommendation: Use Pattern A (`router.use(AuthMiddleware.verifyToken)`) for the 13 unprotected route files.** ReportsRoute already does this correctly. It is cleaner, harder to miss a route, and produces less diff noise. The import of `AuthMiddleware` must be added to each file that doesn't already import it.

### Special Case: EmployeeDeductionsRoute

`EmployeeDeductionsRoute.ts` defines its own inline `asyncHandler` on line 9 (it does not import from `../utils/asyncHandler`). When adding auth to this file, change the import to use the shared `asyncHandler` from `../utils/asyncHandler` to maintain consistency. The local definition is equivalent but redundant.

### Special Case: PaymentReceiptRoute

`PaymentReceiptRoute.ts` uses `express.Router()` not `Router` from express, and does NOT use `asyncHandler` at all — `PaymentReceiptController.generateBatchReceipts` is registered without wrapping. When adding auth, also add `asyncHandler` wrapping to all routes in this file.

### Endpoints That MUST Remain Public

These live in `AuthRoute.ts` and are already correctly unprotected:
- `POST /api/login`
- `POST /api/validate`
- `POST /api/refresh`

Root and health endpoints in `index.ts` are also correctly public:
- `GET /`
- `GET /health`

---

## REQ 2.2 — Current Behavior Verification

`GET /api/employee` (EmployeeRoute) currently returns 200 with employee data to any unauthenticated caller. This is confirmed by reading the route file — no `AuthMiddleware.verifyToken` call exists. After applying REQ 2.1, this endpoint must return 401 with `{ success: false, message: 'Token de acceso requerido' }`.

---

## REQ 2.3 — JWT_SECRET Startup Assertion

### Current State

`src/backend/src/index.ts` — no `JWT_SECRET` check anywhere. The file calls `dotenv.config()` on line 22, then immediately proceeds to route mounting without asserting any required env vars.

`src/backend/src/service/AuthService.ts`:
- Line 148: `const secret = process.env.JWT_SECRET || 'your-default-secret-key';` (in `generateToken`)
- Line 161: `const secret = process.env.JWT_SECRET || 'your-default-secret-key';` (in `verifyToken`)

### Fix Location

Add assertion immediately after `dotenv.config()` in `src/backend/src/index.ts`:

```typescript
dotenv.config();

// Startup assertion — must come before any route or middleware setup
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
  process.exit(1);
}
```

This is a 4-line addition. No other file needs to change for this requirement — the fallback strings in `AuthService.ts` become dead code once the assertion is in place but can remain for the moment (Phase 2 scope is the startup assertion, not removing the fallbacks — that is a future hardening step).

---

## REQ 2.4 — Login Query Param Fallback

### Exact Lines to Change

**File:** `src/backend/src/controller/AuthController.ts`

**Lines 12–15 (current):**
```typescript
const credentials: LoginCredentials = {
  username: req.body.username || req.query.username as string,
  password: req.body.password || req.query.password as string
};
```

**Lines 12–15 (fixed):**
```typescript
const credentials: LoginCredentials = {
  username: req.body.username,
  password: req.body.password
};
```

No other changes needed in this file. The validation on lines 23–38 already handles missing/empty credentials and returns 400 — those checks remain intact.

---

## REQ 2.5 — Temp File Inventory

All 5 files confirmed to exist:

| File | Location | Status |
|------|----------|--------|
| `parse_tmp.js` | Project root (`/`) | EXISTS — delete |
| `temp_script.py` | Project root (`/`) | EXISTS — delete |
| `test_hours.js` | Project root (`/`) | EXISTS — delete |
| `check_employee.ts` | `src/backend/` | EXISTS — delete |
| `query_emp.mjs` | `src/backend/` | EXISTS — delete |

**Additional action:** Add patterns to `.gitignore` to prevent re-committing ad-hoc scripts. Suggested entries:
```
# Temp/debug scripts — do not commit
parse_tmp.js
temp_script.py
test_hours.js
check_employee.ts
query_emp.mjs
*.tmp.js
*.tmp.ts
```

---

## REQ 2.6 — PayrollService throw undefined

### Exact Lines

**File:** `src/backend/src/service/PayrollService.ts`

**Line 3 (bad import):**
```typescript
import { error } from "console";
```

**Line 132 (throw that produces `throw undefined`):**
```typescript
if (!updatedPayroll) throw error("Payroll not found");
```

`console.error` (imported as `error`) returns `void` (i.e., `undefined`). So `throw error("Payroll not found")` is equivalent to `throw undefined`. The Express error handler receives a non-Error value and cannot generate a meaningful HTTP response.

**Fix:**
1. Remove line 3 entirely — delete `import { error } from "console";`
2. Change line 132 to: `if (!updatedPayroll) throw new Error('Payroll not found');`

**Note:** `prisma.vpg_payrolls.update()` with a non-existent `where` clause throws a Prisma `P2025` error rather than returning `null`, so the `if (!updatedPayroll)` check is actually unreachable in practice. However, the fix is still necessary because the import creates a confusing dead reference and the guard pattern should be correct in case the Prisma behavior ever changes. The fix is safe — it does not change the actual throw path for a missing ID (Prisma throws first), it only ensures the manual guard is correct.

---

## Architecture Patterns

### AuthMiddleware Application Order in index.ts

`index.ts` mounts all routes under `/api`. There is no global `app.use(AuthMiddleware.verifyToken)` — auth is applied per-router. This is intentional because `/api/login`, `/api/validate`, and `/api/refresh` must remain public. The per-router approach (`router.use(AuthMiddleware.verifyToken)` inside each route file) is the correct pattern for this codebase.

A global `app.use('/api', AuthMiddleware.verifyToken)` approach would require an explicit allowlist for public endpoints — more complex and fragile. The per-router approach is preferred.

### Don't Add Global Auth Middleware to index.ts

AVOID: `app.use('/api', asyncHandler(AuthMiddleware.verifyToken))` in `index.ts`. This would protect ALL endpoints including `/api/login`, requiring special bypass logic. The 13-file per-router approach is correct.

### asyncHandler Is Required

`AuthMiddleware.verifyToken` is `async` (returns `Promise<Response | void>`). Express 5 handles unhandled promise rejections natively, but the codebase convention is to wrap with `asyncHandler`. For `router.use()`, do NOT wrap: `router.use(AuthMiddleware.verifyToken)` is correct (Express 5 handles async middleware). For per-route inline, wrap: `asyncHandler(AuthMiddleware.verifyToken)`.

**Confirmed from ReportsRoute pattern:** `router.use(AuthMiddleware.verifyToken)` — no `asyncHandler` wrapper — this is the correct Pattern A usage.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| JWT verification middleware | Custom token parsing | `AuthMiddleware.verifyToken` — already exists and works |
| Startup env validation | Manual check patterns | Simple `if (!process.env.X) { process.exit(1) }` — no library needed |
| Route protection | Global `app.use` with allowlist | Per-router `router.use()` in each route file |

---

## Common Pitfalls

### Pitfall 1: Wrapping router.use() with asyncHandler
**What goes wrong:** Writing `router.use(asyncHandler(AuthMiddleware.verifyToken))` for Pattern A — this is NOT how ReportsRoute does it and is not needed.
**Why it happens:** Developers confuse per-route wrapping (Pattern B) with router-level middleware (Pattern A).
**How to avoid:** Copy ReportsRoute exactly: `router.use(AuthMiddleware.verifyToken);` — no wrapper.
**Warning signs:** TypeScript will not catch this; the app will work but the pattern is inconsistent.

### Pitfall 2: Forgetting to Import AuthMiddleware
**What goes wrong:** Adding `router.use(AuthMiddleware.verifyToken)` without importing `AuthMiddleware`.
**Why it happens:** Mechanical edits miss the import line.
**How to avoid:** Each of the 13 route files needs `import { AuthMiddleware } from "../middleware/AuthMiddleware";` added unless it already has it.
**Current imports:** None of the 13 unprotected route files import `AuthMiddleware` — all need the import added.

### Pitfall 3: Protecting the login/validate/refresh endpoints
**What goes wrong:** Applying auth to `AuthRoute.ts` at the router level — this would lock users out of logging in.
**Why it happens:** Overzealous application of the "protect all routes" rule.
**How to avoid:** Leave `AuthRoute.ts` unchanged. The per-route pattern there is intentional.

### Pitfall 4: process.exit(1) assertion in test environment
**What goes wrong:** The JWT_SECRET assertion in `index.ts` will cause Jest tests to fail if `JWT_SECRET` is not set in the test environment.
**Why it happens:** `index.ts` is imported by the test setup.
**How to avoid:** Check whether `index.ts` is imported in `src/backend/src/__tests__/setup/prisma-mock.ts`. If the test setup does not import `index.ts`, there is no problem. If it does, the test setup needs `process.env.JWT_SECRET = 'test-secret'` before the import.
**Verification:** The current test file `PayrollService.test.ts` does not appear to import `index.ts` — only `PayrollService` — so this pitfall is LOW risk for this phase.

### Pitfall 5: EmployeeDeductionsRoute local asyncHandler
**What goes wrong:** Adding `asyncHandler(AuthMiddleware.verifyToken)` but using the local `asyncHandler` (defined inline in the file) — works but is inconsistent.
**How to avoid:** When editing `EmployeeDeductionsRoute.ts`, replace the local `asyncHandler` definition with an import from `../utils/asyncHandler` and use that consistently.

---

## Code Examples

### Pattern A — Router-level auth (recommended for this phase)
```typescript
// Source: src/backend/src/routes/ReportsRoute.ts (existing working example)
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { XyzController } from "../controller/XyzController";

const router = Router();

router.use(AuthMiddleware.verifyToken);  // covers all routes below

router.get("/xyz", asyncHandler(XyzController.getAll));
router.post("/xyz", asyncHandler(XyzController.create));

export default router;
```

### Pattern B — Per-route auth (existing example, UserRoute.ts)
```typescript
// Source: src/backend/src/routes/UserRoute.ts (existing working example)
router.get(
  "/users",
  asyncHandler(AuthMiddleware.verifyToken),
  AuthMiddleware.requireRole(["admin"]),
  asyncHandler(UserController.listUsers)
);
```

### JWT Startup Assertion
```typescript
// Location: src/backend/src/index.ts — add immediately after dotenv.config()
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
  process.exit(1);
}
```

### AuthController Login Fix
```typescript
// src/backend/src/controller/AuthController.ts lines 12-15 — BEFORE
const credentials: LoginCredentials = {
  username: req.body.username || req.query.username as string,
  password: req.body.password || req.query.password as string
};

// AFTER
const credentials: LoginCredentials = {
  username: req.body.username,
  password: req.body.password
};
```

### PayrollService Fix
```typescript
// src/backend/src/service/PayrollService.ts
// REMOVE line 3: import { error } from "console";

// CHANGE line 132 from:
if (!updatedPayroll) throw error("Payroll not found");
// TO:
if (!updatedPayroll) throw new Error('Payroll not found');
```

---

## Runtime State Inventory

This is a security hardening phase — no renames, no data migrations, no string replacements. Runtime state inventory is not applicable.

- Stored data: None affected — no data model changes in this phase
- Live service config: None affected — routes are in git, changes take effect on server restart
- OS-registered state: None
- Secrets/env vars: `JWT_SECRET` must exist in `.env` — the assertion enforces this at startup. The `.env` file itself is not committed to git (and should not be)
- Build artifacts: None — no compiled artifacts affected by these changes

---

## Environment Availability

This phase is purely code changes. No external tools or services beyond the existing stack are required.

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js 22.14.0 | Backend runtime | Already used | Confirmed in CLAUDE.md |
| TypeScript 5.8.3 | Type checking | Already used | `npx tsc --noEmit` is the gate |
| Jest + ts-jest | Tests | Already configured | `jest.config.js` confirmed |
| `JWT_SECRET` env var | REQ 2.3 | Must be set in `.env` | Planner must note: set this before running the server |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.x + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test` (from `src/backend/`) |
| Full suite command | `npm test` (from `src/backend/`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-2.1 | Unprotected routes return 401 without token | curl smoke test | See Validation Commands below | N/A — manual curl |
| REQ-2.2 | `GET /api/employee` returns 401 without token | curl smoke test | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/employee` | N/A — manual |
| REQ-2.3 | Server exits if JWT_SECRET missing | Manual startup test | Start server without JWT_SECRET in .env, verify exit | N/A — manual |
| REQ-2.4 | Login ignores query params | curl smoke test | See Validation Commands below | N/A — manual curl |
| REQ-2.5 | 5 temp files gone | git/grep check | `git status` shows deletions; `ls parse_tmp.js` returns error | N/A — file system |
| REQ-2.6 | PayrollService.updatePayroll throws new Error | unit test | `npm test` (covers PayrollService) | ❌ — no test for updatePayroll yet |

### Validation Commands (to be run after implementation)

```bash
# REQ 2.1 + REQ 2.2 — Protected route returns 401 without token
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/employee
# Expected: 401

# REQ 2.1 — Verify all 13 routes protected (sample additional check)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/payrolls
# Expected: 401

curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/vacations
# Expected: 401

curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/audit-logs
# Expected: 401

# REQ 2.1 — Verify public endpoints still work
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/login -X POST
# Expected: 400 (missing body) — NOT 401

# REQ 2.3 — JWT_SECRET assertion (run from src/backend/)
# Temporarily remove JWT_SECRET from .env, then:
npm run dev
# Expected: FATAL error in console, process exits immediately

# REQ 2.4 — Login query params are ignored
curl -s -X POST "http://localhost:3001/api/login?username=admin&password=secret" \
  -H "Content-Type: application/json" -d '{}'
# Expected: 400 (missing credentials) — NOT 401 or 200 with a token

# REQ 2.5 — Temp files deleted
ls "C:/Users/Kendall Fonseca/Desktop/U/Ingeniria en sitemas/VP-Planilla/parse_tmp.js" 2>&1
# Expected: file not found error

# REQ 2.6 — No import from console
grep -n "import { error } from" src/backend/src/service/PayrollService.ts
# Expected: no output

# REQ 2.6 — Correct throw statement
grep -n "throw new Error" src/backend/src/service/PayrollService.ts
# Expected: line showing 'throw new Error('Payroll not found')'

# TypeScript gate — must pass after all changes
cd src/backend && npx tsc --noEmit
# Expected: 0 errors

# Verify AuthMiddleware imported in all 13 route files
grep -rL "AuthMiddleware" src/backend/src/routes/ | grep -v "AuthRoute.ts"
# Expected: empty output (all route files now import AuthMiddleware)

# Verify no query fallback remains in AuthController
grep -n "req\.query\." src/backend/src/controller/AuthController.ts
# Expected: no output
```

### Wave 0 Gaps

The existing `PayrollService.test.ts` does not test `updatePayroll`. Since REQ 2.6 modifies `updatePayroll`, a test for the error path would be ideal but is not strictly required for this phase — the grep verification above confirms the fix is in place. No new test infrastructure is needed.

- [ ] Optional: add test case to `PayrollService.test.ts` for `updatePayroll` with a non-existent ID — covers the corrected throw path

---

## Open Questions

1. **Should the `import { error } from 'console'` fix also remove the fallback `|| 'your-default-secret-key'` in AuthService?**
   - What we know: REQ 2.3 only requires the startup assertion in `index.ts`. The fallback in `AuthService` becomes dead code but is not explicitly in scope.
   - Recommendation: Leave the `AuthService` fallback strings in place for Phase 2. The startup assertion is sufficient to close the security gap. Removing the fallback is a clean-up task for a later phase to avoid scope creep.

2. **`router.use(AuthMiddleware.verifyToken)` vs `router.use(asyncHandler(AuthMiddleware.verifyToken))` — Express 5 behavior**
   - What we know: Express 5 natively handles rejected promises from async middleware, so `asyncHandler` is not strictly needed for `router.use()`. ReportsRoute (the existing working pattern) does NOT use `asyncHandler` in the `router.use()` call.
   - Recommendation: Follow ReportsRoute exactly — use `router.use(AuthMiddleware.verifyToken)` without `asyncHandler`. This is confirmed safe.

---

## Sources

### Primary (HIGH confidence)
- Direct read of all 16 route files in `src/backend/src/routes/`
- Direct read of `src/backend/src/middleware/AuthMiddleware.ts`
- Direct read of `src/backend/src/controller/AuthController.ts`
- Direct read of `src/backend/src/service/PayrollService.ts`
- Direct read of `src/backend/src/service/AuthService.ts` (JWT secret lines)
- Direct read of `src/backend/src/index.ts`
- File existence check: all 5 temp files confirmed present

### Secondary (HIGH confidence)
- `.planning/codebase/CONCERNS.md` — confirms all issue descriptions match source code
- `CLAUDE.md` — project conventions applied throughout

---

## Metadata

**Confidence breakdown:**
- Auth audit (REQ 2.1): HIGH — every route file read directly, auth status confirmed
- JWT assertion (REQ 2.3): HIGH — index.ts read, no assertion found, fix is a 4-line addition
- Login query param (REQ 2.4): HIGH — exact lines confirmed in AuthController.ts
- Temp files (REQ 2.5): HIGH — all 5 files confirmed to exist via bash ls
- PayrollService throw (REQ 2.6): HIGH — bad import on line 3, throw on line 132 confirmed

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (codebase is stable brownfield — findings won't drift)

---

## RESEARCH COMPLETE
