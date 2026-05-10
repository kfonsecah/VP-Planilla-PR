# Phase 7 Research — Rate Limiting, Helmet y Token Revocation

**Phase:** 07  
**Goal:** Protección anti-fuerza bruta, headers de seguridad HTTP, y logout real  
**Gathered:** 2026-03-27  
**Status:** Ready for planning

---

## Domain Context

### Requirements Summary

| REQ | Description | Priority |
|-----|-------------|----------|
| 7.1 | `express-rate-limit` en `POST /api/login` (10 req / 15 min / IP) | Must |
| 7.2 | 11° intento retorna 429 | Must |
| 7.3 | `helmet()` global en `src/backend/src/index.ts` | Must |
| 7.4 | Headers `X-Frame-Options` y `X-Content-Type-Options` | Must |
| 7.5 | `POST /api/logout` invalida token en DB blocklist | Should |
| 7.6 | Token post-logout retorna 401 | Should |

---

## Implementation Strategy

### Task 1: Install Dependencies

```bash
cd src/backend
npm install express-rate-limit helmet
```

### Task 2: Rate Limiting on Login

**Current state:** `AuthRoute.ts` has login at `POST /api/login` (line 55+)

**New implementation:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    success: false,
    error: 'Demasiados intentos de login. Intente de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply ONLY to login route
router.post("/login", loginLimiter, asyncHandler(AuthController.login));
```

**Key points:**
- Apply ONLY to login route, not globally
- Use `legacyHeaders: false` (only standard Headers)
- Custom message in Spanish

### Task 3: Helmet Global Middleware

**Current state:** `index.ts` has basic setup (cors, express.json) — no helmet

**New implementation (index.ts after cors):**
```typescript
import helmet from 'helmet';

// After cors()
app.use(helmet());
```

Helmet automatically sets:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection` (deprecated but included)
- And more security headers

### Task 4: Token Blocklist for Real Logout

**Current state:** Logout is client-side only (just deletes token from storage). No DB table for blocklist exists.

**Implementation options:**

#### Option A: Add `vpg_token_blocklist` table (Recommended)
```prisma
model vpg_token_blocklist {
  blocklist_id       Int       @id @default(autoincrement())
  blocklist_token    String    @db.VarChar(500)
  blocklist_expires  DateTime  @db.Timestamp(6)
  blocklist_created  DateTime  @default(now()) @db.Timestamp(6)

  @@index([blocklist_token], map: "idx_token_blocklist_token")
}
```

#### Option B: Extend existing `vpg_users` with `user_token_version`
```prisma
// On each login, increment version
// Token includes version in payload
// If versions don't match, reject
```
**Pros:** No extra table, no middleware overhead
**Cons:** Requires token format change

**Recommended: Option A** — simpler, doesn't require token format changes.

### AuthMiddleware Modification

After `AuthService.verifyToken(token)` succeeds, check blocklist:
```typescript
// Check if token is blocklisted
const isBlocklisted = await AuthService.isTokenBlocklisted(token);
if (isBlocklisted) {
  return res.status(401).json({
    success: false,
    message: 'Token ha sido invalidado'
  });
}
```

---

## Files to Modify

1. `src/backend/package.json` — add `express-rate-limit`, `helmet`
2. `src/backend/src/index.ts` — add `helmet()` global
3. `src/backend/src/routes/AuthRoute.ts` — add rate limiter to login
4. `src/backend/prisma/schema.prisma` — add `vpg_token_blocklist` table
5. `src/backend/src/middleware/AuthMiddleware.ts` — check blocklist on every request
6. `src/backend/src/service/AuthService.ts` — add blocklist methods

---

## Test Cases Needed

| Test | Description |
|------|-------------|
| 11th login attempt returns 429 | Rate limit exceeded |
| Login under limit returns 200 | Normal flow |
| Logout adds token to blocklist | Token stored in DB |
| Request with blocklisted token returns 401 | Middleware check works |
| Headers present in response | helmet() active |

---

## Validation Architecture

### Dimension 8 Requirements

| Verification | Method | Command |
|---|---|---|
| `express-rate-limit` installed | grep | `grep "express-rate-limit" src/backend/package.json` → exists |
| `helmet` installed | grep | `grep "helmet" src/backend/package.json` → exists |
| Rate limiter applied to login | grep | `grep "rateLimit\|loginLimiter" src/backend/src/routes/AuthRoute.ts` → exists |
| helmet() applied globally | grep | `grep "helmet()" src/backend/src/index.ts` → exists |
| X-Frame-Options header present | manual | `curl -I http://localhost:3001/` → header present |
| vpg_token_blocklist table exists | prisma | `grep "vpg_token_blocklist" prisma/schema.prisma` → exists |
| Logout adds to blocklist | test | `npm test` → blocklist tests pass |
| Blocklisted token returns 401 | test | `npm test` → middleware tests pass |
| TypeScript compiles | tsc | `npx tsc --noEmit` → 0 new errors |

### Test File Location
`src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts` (new)

### Framework: Jest (same as existing tests)

---

## Edge Cases

1. **Token already expired:** Don't add to blocklist (waste of DB space)
2. **Race condition on logout:** Add try/catch, handle duplicates gracefully
3. **Cleanup old blocklist entries:** Add cron job or check expiration on query
4. **Rate limit bypass via distributed requests:** Not solvable without IP tracking service (acceptable for MVP)

---

## Notes

- `helmet()` is middleware — applies to ALL responses automatically
- Rate limiter should be ROUTE-SPECIFIC, not global
- Token blocklist approach: add to DB on logout, check on every authenticated request
- Cleanup: tokens should expire from blocklist when JWT expires (set `blocklist_expires` = JWT expiry)
