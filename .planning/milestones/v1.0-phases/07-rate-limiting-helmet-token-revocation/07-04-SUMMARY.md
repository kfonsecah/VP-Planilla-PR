# Summary 07-04 — Token Blocklist para Logout Real

**Plan:** 07-04-PLAN.md  
**Phase:** 07 — Rate Limiting, Helmet y Token Revocation  
**Executed:** 2026-03-27  

---

## Changes Made

### 1. schema.prisma
Added `vpg_token_blocklist` table:
```prisma
model vpg_token_blocklist {
  blocklist_id       Int       @id @default(autoincrement())
  blocklist_token    String    @db.VarChar(500)
  blocklist_expires DateTime  @db.Timestamp(6)
  blocklist_created DateTime  @default(now()) @db.Timestamp(6)

  @@index([blocklist_token], map: "idx_token_blocklist_token")
}
```

Ran `npx prisma db push` — table created in DB.

### 2. AuthService.ts
Added three new methods:
- `addTokenToBlocklist(token, expiresAt)` — adds token to blocklist
- `isTokenBlocklisted(token)` — checks if token is blocklisted
- `cleanupExpiredTokens()` — removes expired tokens

### 3. AuthMiddleware.ts
Added blocklist check in `verifyToken`:
```typescript
const isBlocklisted = await AuthService.isTokenBlocklisted(token);
if (isBlocklisted) {
  return res.status(401).json({
    success: false,
    message: 'Token ha sido invalidado'
  });
}
```

### 4. AuthController.ts
Updated `logout` to add token to blocklist on server-side logout.

## Verification

```bash
grep "addTokenToBlocklist" src/backend/src/service/AuthService.ts  # → exists
grep "isTokenBlocklisted" src/backend/src/middleware/AuthMiddleware.ts  # → exists
grep "vpg_token_blocklist" prisma/schema.prisma  # → exists
npx tsc --noEmit  # → 27 pre-existing errors
```

## Success Criteria

- [x] `vpg_token_blocklist` table exists
- [x] `addTokenToBlocklist` method implemented
- [x] `isTokenBlocklisted` method implemented
- [x] Logout adds token to blocklist
- [x] Blocklisted token returns 401
- [x] npx tsc --noEmit passes (27 pre-existing errors)
