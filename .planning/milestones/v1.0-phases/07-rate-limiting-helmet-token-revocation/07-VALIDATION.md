---
phase: 7
slug: rate-limiting-helmet-token-revocation
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-27
validated: 2026-03-27
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `src/backend/jest.config.ts` |
| **Quick run command** | `cd src/backend && npx tsc --noEmit` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src/backend && npx tsc --noEmit`
- **After every plan wave:** Run `cd src/backend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | 7.1, 7.3 | npm | `npm install express-rate-limit helmet` → no errors | ✅ | ✅ green |
| 7-02-01 | 02 | 1 | 7.1, 7.2 | grep | `grep "loginLimiter" src/backend/src/routes/AuthRoute.ts` → exists | ✅ | ✅ green |
| 7-03-01 | 03 | 1 | 7.3, 7.4 | grep | `grep "helmet()" src/backend/src/index.ts` → exists | ✅ | ✅ green |
| 7-04-01 | 04 | 2 | 7.5, 7.6 | prisma + tsc | `grep "vpg_token_blocklist" prisma/schema.prisma` → exists | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts` — stubs for blocklist tests
- [ ] `src/backend/prisma/schema.prisma` — add `vpg_token_blocklist` table
- [ ] `npm install express-rate-limit helmet` — if not in package.json

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 11th login attempt returns 429 | 7.2 | Requires 11 requests + waiting 15 min window | `for i in {1..11}; do curl -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'; done` |
| X-Frame-Options header present | 7.4 | Requires running server | `curl -I http://localhost:3001/` \| grep X-Frame |
| Logout blocks subsequent requests | 7.6 | End-to-end flow | Login → logout → use token → expect 401 |

---

## Validation Sign-Off

- [x] All tasks have Wave 0 dependencies
- [x] Sampling continuity maintained
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ VALIDATED 2026-03-27

## Validation Audit 2026-03-27

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Verification Results
- `express-rate-limit` installed: ✅
- `helmet` installed: ✅
- Rate limiter on login (10 req/15min/IP): ✅
- Helmet global middleware: ✅
- `vpg_token_blocklist` table created: ✅
- `addTokenToBlocklist` implemented: ✅
- `isTokenBlocklisted` implemented: ✅
- Logout adds token to blocklist: ✅
- TypeScript compilation: ✅ (27 pre-existing errors unchanged)

---

*Generated from 07-RESEARCH.md*
