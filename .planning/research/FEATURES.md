# Feature Landscape

**Domain:** Production Hardening & Developer Experience
**Researched:** 2025-05-14
**Overall Confidence:** HIGH

## Table Stakes

Features users and developers expect in a production-ready system. Missing = brittle system.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Error Observability (Sentry)** | Essential for identifying and fixing production bugs before users report them. | Medium | Requires sync between Frontend (Next.js 15) and Backend (Express 5). |
| **HPP Protection** | Standard security measure to prevent parameter pollution attacks. | Low | Critical for public-facing APIs. |
| **Git History Standards** | Ensures the codebase has a searchable, machine-readable history (Conventional Commits). | Low | Prevents "fixed bug" or "updates" commit messages. |
| **Database Documentation** | Visual schema documentation (DBML) to help developers understand data relationships. | Low | Must be automated to avoid drifting from the actual schema. |

## Differentiators

Features that set the DX and robustness apart.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Distributed Tracing** | Links a single user request from Frontend to Backend in Sentry. | Medium | Extremely valuable for debugging cross-layer failures. |
| **Session Replay** | Allows watching a video-like reproduction of user actions before a crash. | Medium | High value for UI-heavy payroll wizards. |
| **Auto-generated ERDs** | Live-updating diagrams from DBML files. | Low | Enhances onboarding and architecture discussions. |

## Anti-Features

Features to explicitly NOT build/implement.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Manual req.query mutation** | In Express 5, `req.query` is immutable; trying to modify it will crash or be ignored. | Use **Zod** to validate and extract a clean object. |
| **Custom Git hooks logic** | Hard to maintain and share across the team. | Use **Husky** as the standard wrapper. |
| **Manual ERD drawing** | Diagrams become outdated as soon as a migration is run. | Use `prisma-dbml-generator` to generate from source of truth. |

## Feature Dependencies

```
Conventional Commits → Semantic Versioning (Future)
DBML → Visual ERD Tools (dbdiagram.io)
Sentry (Frontend) + Sentry (Backend) → Distributed Tracing
```

## MVP Recommendation (Milestone v1.10)

Prioritize:
1. **Sentry Integration**: Core error tracking for both layers.
2. **HPP Protection**: Basic security hardening for the API.
3. **Conventional Commits**: Immediate improvement to repository hygiene.
4. **DBML Generator**: Documentation that stays in sync with Prisma.

Defer:
- **Full Semantic Release**: Can be added later once Conventional Commits are established.
- **Advanced Sentry Profiling**: Start with Error Tracking and Tracing first.

## Sources

- [Sentry Next.js 15 Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - HIGH confidence
- [Sentry Express 5 Docs](https://docs.sentry.io/platforms/javascript/guides/express/) - HIGH confidence
- [Express 5 Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) - HIGH confidence
- [Conventional Commits Specification](https://www.conventionalcommits.org/) - HIGH confidence
- [prisma-dbml-generator (GitHub)](https://github.com/notiz-dev/prisma-dbml-generator) - MEDIUM confidence (Community tool)
