# Domain Pitfalls: Hardening & DX

**Domain:** Production Hardening & Developer Experience
**Researched:** 2025-05-14
**Overall Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause system instability or security gaps.

### Pitfall 1: Express 5 `req.query` Immobility
**What goes wrong:** Developers try to "clean" `req.query` by overwriting it (e.g., `req.query = filter(req.query)`). In Express 5, `req.query` is a getter and non-writable.
**Consequences:** Code crashes with a `TypeError` or silently fails to update the query object.
**Prevention:** Always use a validation library (Zod) to produce a *new* object.

### Pitfall 2: Sentry Ad-Blocking
**What goes wrong:** Client-side Sentry events are blocked by browser extensions (uBlock Origin, etc.).
**Consequences:** 20-40% of production errors are never reported.
**Prevention:** Configure `tunnelRoute` in `next.config.ts` to proxy Sentry events through your own domain.

## Moderate Pitfalls

### Pitfall 1: Husky 9 Initialization Confusion
**What goes wrong:** Using old Husky v4/v8 commands (`husky install`) in a v9+ environment.
**Prevention:** Use the new `npx husky init` which handles the setup automatically.

### Pitfall 2: DBML Generator Version Mismatch
**What goes wrong:** `prisma-dbml-generator` might lag behind Prisma's major releases (e.g., Prisma 6).
**Prevention:** Pin versions and verify output after updating `prisma` package.

## Minor Pitfalls

### Pitfall 1: Commitlint in Monorepos
**What goes wrong:** Commits that affect both backend and frontend might be hard to categorize.
**Prevention:** Use scopes in Conventional Commits: `feat(api): ...` or `fix(ui): ...`.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Sentry Setup | Circular dependencies in `instrumentation.ts` | Keep instrumentation light; only import what's necessary for Sentry. |
| HPP Config | Blocking legitimate array parameters | Use `hpp({ whitelist: [...] })` for specific keys that *should* be arrays. |

## Sources

- [Sentry Tunneling Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting/#filter-out-blocked-requests)
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [Husky v9 Release Notes](https://typicode.github.io/husky/blog/husky-9/)
