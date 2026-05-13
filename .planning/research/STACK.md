# Technology Stack: Production Hardening & DX

**Project:** VP-Planilla
**Researched:** 2025-05-14
**Overall Confidence:** HIGH

## Recommended Stack

### Observability
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@sentry/nextjs` | ^8.0.0 | Frontend Monitoring | Native support for Next.js 15, React 19, and Server Actions. |
| `@sentry/node` | ^8.0.0 | Backend Monitoring | Powered by OpenTelemetry for deeper auto-instrumentation in Express 5. |

### Security
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `hpp` | ^0.2.3 | HPP Protection | Industry standard for flattening duplicate query parameters. |

### Developer Experience (DX)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `husky` | ^9.0.0 | Git Hooks | Standard tool for managing hooks like `commit-msg`. |
| `@commitlint/cli` | ^19.0.0 | Commit Linting | Enforces Conventional Commits specification. |
| `prisma-dbml-generator` | ^0.12.0 | Schema Documentation | Automatically syncs DBML from Prisma schema. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Monitoring | Sentry | LogRocket | Sentry is better for error tracking and has deeper Next.js integration. |
| DB Docs | DBML | Prisma Docs | DBML allows for ERD generation in third-party tools like dbdiagram.io. |
| Git Hooks | Husky | simple-git-hooks | Husky is more robust and widely adopted in the ecosystem. |

## Installation

### Root Level
```bash
npm install -D husky @commitlint/cli @commitlint/config-conventional
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Backend (`src/backend/`)
```bash
npm install @sentry/node hpp
npm install -D prisma-dbml-generator
```

### Frontend (`src/frontend/`)
```bash
npm install @sentry/nextjs
```

## Sources

- [Sentry v8 Migration Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v7-to-v8/)
- [Husky v9 Documentation](https://typicode.github.io/husky/)
- [Express 5 Query Parser Changes](https://expressjs.com/en/5x/api.html#req.query)
