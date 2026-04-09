# Phase 24: Auth Token Lifecycle End-to-End - Research

**Researched:** 2026-04-09
**Domain:** JWT auth lifecycle hardening (refresh, revocation, logout, uniform auth errors)
**Confidence:** MEDIUM-HIGH

## User Constraints

- No `24-CONTEXT.md` exists yet in `.planning/phases/24-auth-token-lifecycle-end-to-end/`, so there are no locked decisions to copy verbatim.
- Legacy file `.planning/phases/24-bug-fechas-calendario/24-CONTEXT.md` is not present in repository (file-not-found).
- Per current source of truth (`.planning/REQUIREMENTS.md` + `.planning/STATE.md`), Phase 24 scope is **AUTH-05..AUTH-08** (token refresh consistency, revocation enforcement, complete logout invalidation, uniform 401/403 payloads).
- If any future `24-CONTEXT.md` is added, it supersedes this section and must be copied verbatim in planning.

## Project Constraints (from AGENTS.md)

`./AGENTS.md` not found. Applied project constraints from `CLAUDE.md` instead:

- Backend must keep strict layering: **Route → Controller → Service → Prisma**.
- Frontend must keep strict layering: **Page → Hook → Service → `http.ts` → Backend API**.
- **Never bypass `src/frontend/src/services/http.ts`** for API calls.
- New backend routes must use `asyncHandler` and `AuthMiddleware.verifyToken` unless intentionally public.
- Use Prisma singleton (`import { prisma } from '../lib/prisma'`), never `new PrismaClient()`.
- Preserve localStorage keys `vp_access_token` / `vp_refresh_token`.
- Keep error/success response style conventions consistent.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-05 | El frontend renueva access tokens de forma consistente usando refresh token sin romper sesiones activas | Single refresh path in `http.ts` interceptor; move auth calls to `http` client only; retry-once strategy with explicit failure handling. |
| AUTH-06 | El backend invalida tokens revocados/expirados en todos los endpoints protegidos | Enforce `AuthMiddleware.verifyToken` uniformly; return RFC-aligned 401 for invalid/revoked/expired token; include token blocklist checks in middleware path. |
| AUTH-07 | Logout invalida la sesion de forma completa (cliente + servidor) y evita reutilizacion de tokens previos | Revoke server-side token family (refresh + active access token), clear client storage, and force re-auth callback path. |
| AUTH-08 | Los errores de autenticacion son uniformes y manejables por el frontend (401/403 con payload consistente) | Define canonical auth error envelope + code catalog; map authn failures to 401 and authz failures to 403 consistently across controllers/middleware. |

</phase_requirements>

## Summary

Current implementation has the right building blocks but lifecycle is fragmented: backend has access-token blocklist (`vpg_token_blocklist`) and middleware checks, frontend has a retry-on-401 refresh flow in `http.ts`, but auth endpoints remain partially stubbed (`/refresh` placeholder), and error payloads are inconsistent (`message` vs `error` vs `type`). This mismatch is exactly what causes brittle session behavior and frontend-specific workarounds.

The established pattern for this stack is to centralize token lifecycle orchestration in the transport layer (frontend `http.ts`) and centralize token validity decisions in auth middleware + auth service on backend. RFC 6750 / 7009 semantics reinforce this: expired/revoked/invalid token belongs to **401**, insufficient privileges belongs to **403**, and logout/revocation should invalidate current and related credentials.

Given current codebase conventions, the safest implementation is **incremental standardization** (no framework/library swap): complete `/refresh` and revocation semantics in backend service/controller, enforce one canonical auth error format, route all frontend auth-related HTTP through `http.ts`, and add focused backend + frontend tests around refresh retry, revoked token rejection, and logout idempotency.

**Primary recommendation:** Keep current JWT + Prisma stack, but implement a single canonical token lifecycle contract (issue/refresh/revoke/error schema) and enforce it in middleware + `http.ts` as the only auth transport path.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsonwebtoken | 9.0.3 (npm latest, modified 2026-03-13) | Sign/verify JWT access and refresh tokens | Already used; supports claim validation and algorithm controls needed for auth lifecycle. |
| express | 5.1.0 (project) | API routing and middleware chain | Existing backend framework; lifecycle checks naturally belong in middleware pipeline. |
| Prisma Client | 6.14.0 (project), 7.7.0 latest available | Persist revocation/blocklist and token metadata | Existing data access layer; required for durable revocation checks. |
| Frontend `http.ts` client | in-repo module | Single place for token attach/refresh/retry/logout trigger | Required by project constraint: never bypass transport layer. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| express-rate-limit | 8.3.1 (project), 8.3.2 latest | Protect auth endpoints from brute-force/abuse | Keep on login and apply to refresh/revoke endpoints too. |
| zod | 4.3.6 | Validate auth request payloads (`/refresh`, `/logout`, error envelope) | Use at route boundary for uniform 400/401 behavior. |
| Jest + ts-jest | 29.7.0 | Regression tests for lifecycle transitions | Use for middleware/service and transport retry behavior. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom in-memory revocation only | Redis-backed revocation set | Better scale/perf at high QPS, but introduces new infra and ops burden now. |
| Hand-written fetch calls in hooks | Axios interceptor stack | Similar capability, but violates current project “use `http.ts`” convention and adds migration risk. |
| Stateless-only short-lived access tokens | Opaque session store | Strong centralized invalidation, but larger architectural change than this phase requires. |

**Installation:**
```bash
# No new packages required for Phase 24 baseline
# (reuse existing jsonwebtoken/Prisma/Express/http.ts stack)
```

**Version verification:**
- `npm view jsonwebtoken version` → **9.0.3** (modified 2026-03-13)
- `npm view express-rate-limit version` → **8.3.2** (modified 2026-03-30)
- `npm view zod version` → **4.3.6** (modified 2026-01-25)
- `npm view @prisma/client version` → **7.7.0** (modified 2026-04-09)

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── backend/src/
│   ├── routes/AuthRoute.ts            # Auth endpoints + validation + middleware
│   ├── controller/AuthController.ts   # HTTP mapping only
│   ├── service/AuthService.ts         # token issue/refresh/revoke logic
│   ├── middleware/AuthMiddleware.ts   # protected endpoint gate + 401/403 mapping
│   └── schemas/AuthSchema.ts          # zod request schemas (refresh/logout)
└── frontend/src/
    ├── services/http.ts               # token attach, refresh-once, auth-failure callback
    ├── services/authService.ts        # auth endpoints (must delegate via http.ts)
    └── hooks/useAuth.tsx              # session state + logout UX
```

### Pattern 1: Single Auth Failure Contract
**What:** One shared JSON envelope for all authn/authz failures.
**When to use:** Every 401/403 response from middleware/controllers.
**Example:**
```typescript
// Source: RFC 6750 section 3.1 + current AuthMiddleware/AuthController alignment target
type AuthErrorCode =
  | 'AUTH_TOKEN_MISSING'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_TOKEN_REVOKED'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_INSUFFICIENT_SCOPE';

function authError(status: 401 | 403, code: AuthErrorCode, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
      status,
      retryable: status === 401,
    },
  };
}
```

### Pattern 2: Refresh-Once Retry in Transport Layer
**What:** On 401, attempt refresh once, retry original request once, then hard logout.
**When to use:** Inside `src/frontend/src/services/http.ts` only.
**Example:**
```typescript
// Source: existing http.ts (retry=true guard), hardened to prevent loops
if (res.status === 401 && retry) {
  const newToken = await tryRefreshToken();
  return fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } });
}
```

### Pattern 3: Middleware-Centric Revocation Check
**What:** Validate token signature/expiry + revocation before reaching business controllers.
**When to use:** All protected routes.
**Example:**
```typescript
// Source: current AuthMiddleware.verifyToken + AuthService.isTokenBlocklisted
const decoded = AuthService.verifyToken(token); // throws on invalid/expired
const revoked = await AuthService.isTokenBlocklisted(token);
if (revoked) return res.status(401).json(authError(401, 'AUTH_TOKEN_REVOKED', 'Token invalidado'));
```

### Anti-Patterns to Avoid
- **Dual HTTP stacks for auth:** `authService.ts` still uses raw `fetch`, while rest of app uses `http.ts`.
- **Stubbed refresh endpoint in production path:** `/refresh` currently returns placeholder success message.
- **Inconsistent error keys:** mixed `{ message }`, `{ error }`, `{ type }` breaks deterministic frontend handling.
- **Controller-side auth branching:** auth validity decisions should remain in middleware/service, not spread across controllers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT crypto primitives | Custom token parser/verifier | `jsonwebtoken` verify/sign options | Prevents subtle security bugs in claim/alg validation. |
| HTTP auth retry orchestration | Per-hook ad hoc 401 logic | Central `http.ts` refresh-once pipeline | Avoids inconsistent loops and token races. |
| Revocation consistency across endpoints | Manual checks in each controller | Single `AuthMiddleware.verifyToken` + service helpers | Guarantees AUTH-06 across protected routes. |
| HTTP auth semantics mapping | Custom status interpretation | RFC 6750/MDN mapping: invalid token→401, insufficient scope→403 | Reduces ambiguity and simplifies frontend behavior. |

**Key insight:** Token lifecycle bugs are mostly orchestration bugs, not crypto bugs; centralize orchestration, don’t duplicate it.

## Common Pitfalls

### Pitfall 1: Refresh Stampede
**What goes wrong:** Multiple concurrent 401 responses trigger parallel refresh calls and race token state.
**Why it happens:** No single-flight guard around refresh path.
**How to avoid:** Add in-flight refresh promise lock in `http.ts` and queue retries behind it.
**Warning signs:** Intermittent forced logout under bursty API calls.

### Pitfall 2: Partial Logout Invalidation
**What goes wrong:** Client clears tokens, but server still accepts previous token until expiration.
**Why it happens:** Logout only client-side; server revocation missing or incomplete.
**How to avoid:** Logout must revoke server-side token family and clear client storage.
**Warning signs:** Old token still works from another tab/device.

### Pitfall 3: 401/403 Drift
**What goes wrong:** Same auth failure yields different status/payload per endpoint.
**Why it happens:** Error shaping spread across controllers/middleware.
**How to avoid:** Central helper for auth error envelope and status mapping.
**Warning signs:** Frontend conditionals checking message strings.

### Pitfall 4: Bypassing `http.ts`
**What goes wrong:** Raw `fetch` requests miss auto-refresh and auth-failure callback.
**Why it happens:** Service-level convenience code diverges from platform transport layer.
**How to avoid:** Route all auth service calls through `http.ts` wrappers.
**Warning signs:** Some pages auto-refresh tokens; others hard-fail on 401.

## Code Examples

Verified patterns from official sources and current codebase:

### Bearer header and 401/403 semantics
```typescript
// Source: RFC 6750 section 2.1 + 3.1
// Client request:
// Authorization: Bearer <access_token>

// Server mapping:
// invalid/expired/revoked token -> 401
// insufficient scope/role -> 403
```

### Revocation behavior on logout
```typescript
// Source: RFC 7009 section 2
// POST /revoke (or logout flow) invalidates submitted token immediately,
// and SHOULD cascade related tokens per server policy.
```

### Current project transport retry hook (to harden, not replace)
```typescript
// Source: src/frontend/src/services/http.ts
if (res.status === 401 && retry) {
  try {
    const newToken = await tryRefreshToken();
    return fetch(url, { ...options, headers: { ...retryHeaders, Authorization: `Bearer ${newToken}` } });
  } catch {
    clearStoredTokens();
    onAuthFailureCallback?.();
    throw new ApiError('Authentication required', 401);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Endpoint-specific auth error payloads | Canonical auth error envelope + code catalog | Ongoing best practice | Frontend can branch by code, not string parsing. |
| Long-lived access tokens without robust revocation | Short-lived access + refresh + server-side revocation checks | RFC-era recommendation; current mainstream practice | Limits replay window and enables reliable logout invalidation. |
| Raw per-service fetch auth handling | Centralized interceptor/transport handling | Widely adopted in SPA stacks | Prevents duplicated retry/logout logic. |

**Deprecated/outdated:**
- Passing bearer token via URL query string for normal API usage (RFC 6750 marks this as not recommended due to leakage risk).

## Open Questions

1. **Refresh token persistence model is undefined in backend schema**
   - What we know: `vpg_token_blocklist` exists for access token invalidation; `/refresh` endpoint is placeholder.
   - What's unclear: where refresh tokens are stored/hashed/rotated and how token-family revocation is represented.
   - Recommendation: decide and document refresh-token store model in Wave 0 (DB table with hashed token + family id + expiry recommended).

2. **Legacy Phase 24 context mismatch**
   - What we know: user notes previous Phase 24 topic (calendar bug); repo phase directories currently stop at 23.
   - What's unclear: whether any hidden planning artifacts still reference old Phase 24 assumptions.
   - Recommendation: planner should explicitly mark old topic superseded in PLAN.md and ignore missing legacy file.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js runtime | Backend/frontend test & execution | ✗ | — | None (blocking for local execution) |
| npm | Package/version verification | ✓ | 11.2.0 | — |
| Python 3 | Optional scripts/tooling | ✓ | 3.12.3 | — |
| Docker | Optional local infra | ✗ | — | Run services directly (if installed natively) |
| PostgreSQL CLI (`psql`) | Manual DB inspection | ✗ | — | Use Prisma client/migrations without direct CLI |

**Missing dependencies with no fallback:**
- Node.js runtime binary (`node`) unavailable in this execution environment while phase depends on Node stack.

**Missing dependencies with fallback:**
- Docker missing (can proceed without Docker for code changes/tests if native services exist).
- `psql` missing (can still operate via Prisma tooling).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (backend), Jest + next/jest (frontend) |
| Config file | `src/backend/jest.config.js`, `src/frontend/jest.config.js` |
| Quick run command | `npm test -- AuthService.test.ts` (backend) |
| Full suite command | `npm test` in `src/backend/` and `src/frontend/` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-05 | 401 triggers one refresh and retries request | frontend unit/integration | `npm test -- http` (frontend) | ❌ Wave 0 |
| AUTH-06 | revoked/expired token rejected on protected routes | backend unit + route integration | `npm test -- AuthService.test.ts` + middleware tests | ⚠️ Partial |
| AUTH-07 | logout revokes and prevents token reuse | backend integration | `npm test -- auth-logout` | ❌ Wave 0 |
| AUTH-08 | consistent 401/403 payload structure | backend controller/middleware tests | `npm test -- auth-error` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** targeted auth tests (`AuthService`, middleware, `http.ts` behavior)
- **Per wave merge:** backend auth-related suite + frontend auth/http tests
- **Phase gate:** Full backend + frontend Jest suites green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts` — canonical 401/403 mapping + revoked token path
- [ ] `src/backend/src/__tests__/integration/auth.lifecycle.test.ts` — login→refresh→logout→reuse denied
- [ ] `src/frontend/src/__tests__/services/http.auth.test.ts` — single refresh retry + forced logout callback
- [ ] `src/frontend/src/__tests__/hooks/useAuth.logout.test.tsx` — client storage clearing + redirect behavior

## Sources

### Primary (HIGH confidence)
- RFC 6750 (Bearer token usage + 401/403 + WWW-Authenticate): https://www.rfc-editor.org/rfc/rfc6750
- RFC 7009 (Token revocation): https://www.rfc-editor.org/rfc/rfc7009
- MDN 401 reference (updated Jul 2025): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401
- MDN 403 reference (updated Jul 2025): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403
- Repository code (current implementation):
  - `src/backend/src/service/AuthService.ts`
  - `src/backend/src/middleware/AuthMiddleware.ts`
  - `src/backend/src/controller/AuthController.ts`
  - `src/frontend/src/services/http.ts`
  - `src/frontend/src/services/authService.ts`

### Secondary (MEDIUM confidence)
- `jsonwebtoken` README (API/options behavior): https://github.com/auth0/node-jsonwebtoken
- npm registry version checks (`npm view`) for package currency.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — verified against in-repo dependencies + npm registry current versions.
- Architecture: **MEDIUM-HIGH** — strongly grounded in current codebase and HTTP/OAuth RFCs; some project-specific refresh persistence details still unknown.
- Pitfalls: **MEDIUM** — validated against current code paths and common OAuth failure modes; needs confirmation under real concurrency load.

**Research date:** 2026-04-09
**Valid until:** 2026-05-09
