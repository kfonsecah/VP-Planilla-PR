# Phase 31: Improve Code Quality & Automation - Research

**Researched:** 2026-04-12
**Domain:** Code Quality, Configuration Management, Test Automation
**Confidence:** HIGH

## Summary

This research focuses on two primary areas identified as technical debt in the v1.4 audit: the lack of centralized, type-safe environment configuration and the manual nature of test execution.

The primary recommendation is to move away from direct `process.env` access (found in 34+ locations) in favor of a Zod-validated configuration service. For testing, while the project uses Jest for both frontend and backend, the Java utility lacks automated tests entirely. We recommend introducing JUnit 5 for the Java component and improving the orchestration of tests across the multi-stack codebase.

**Primary recommendation:** Centralize environment variables using Zod validation and establish a baseline for Java testing to close the manual execution gap.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | ^3.23.0 | Schema validation | Industry standard for type-safe runtime validation in TS. [VERIFIED: npm] |
| `junit-jupiter` | 5.10.2 | Java Testing | Modern standard for Java unit testing (JUnit 5). [CITED: junit.org] |
| `dotenv` | ^16.4.0 | Env loading | Already present in backend; standard for loading .env files. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `ts-jest` | ^29.1.2 | TS Test Execution | Used for backend tests; ensures type safety in tests. [VERIFIED: package.json] |
| `jest-environment-jsdom` | ^29.7.0 | Frontend Testing | Used for Next.js component testing. [VERIFIED: package.json] |

**Installation:**
```bash
# Backend
cd src/backend && npm install zod

# Java (pom.xml update)
# Add junit-jupiter-api and junit-jupiter-engine
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── backend/src/
│   └── config/
│       └── env.ts        # Validated environment configuration
├── frontend/src/
│   └── config/
│       └── env.ts        # Frontend-safe environment configuration
└── Java/clocklogs/
    └── src/test/java/    # New test directory for Java logic
```

### Pattern 1: Centralized Env Validation
**What:** Create a schema-driven configuration object that parses `process.env` at startup.
**When to use:** In all TypeScript modules to avoid "undefined" runtime errors.
**Example:**
```typescript
// src/backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(10),
  DATABASE_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### Anti-Patterns to Avoid
- **Direct `process.env` access:** Hard to track, no type safety, app crashes late (at call time) instead of early (at startup).
- **Hardcoded Defaults in Logic:** Spreading `process.env.X || 'default'` makes it impossible to know the actual configuration state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env Validation | Custom `if (!env) throw` blocks | Zod | Zod handles type coercion (string to number) and complex schemas (URLs, enums) natively. |
| Test Orchestration | Custom bash scripts for `npm test` | Task Runners / CI | Use `npm test` at root or specific workspace scripts to maintain standard interfaces. |

## Common Pitfalls

### Pitfall 1: Silent Configuration Failure
**What goes wrong:** A missing environment variable doesn't cause a crash until a specific feature is used (e.g., sending an email).
**How to avoid:** Use `env.ts` and call it at the very top of `index.ts`.

### Pitfall 2: Java Test Environment
**What goes wrong:** Java tests failing because they expect a specific file structure or DB state.
**How to avoid:** Use Mockito to isolate Java logic from the filesystem/DB during unit tests.

## Code Examples

### Type-Safe Env in Backend
```typescript
// Verified pattern for 2024
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Maven wrapper is NOT available | Env Availability | May need to install Maven or use Docker for Java tests. |
| A2 | Java tests are completely missing | Summary | We might be recreating existing logic if they were hidden elsewhere. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | v22.14.0 | — |
| Java | Java Utility | ✓ | 25.0.2 | — |
| Maven (mvn) | Java Build/Test | ✗ | — | Use Docker or install mvn |
| Docker | Isolation | ✓ | 24.0.7 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (TS), JUnit 5 (Java) |
| Config file | `src/backend/jest.config.js`, `src/frontend/jest.config.js` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| QUAL-01| Env Validation | Unit | `npm test src/config/__tests__/env.test.ts` |
| QUAL-02| Java Automation| Unit | `mvn test` (or docker equivalent) |

## Sources

### Primary (HIGH confidence)
- Official Zod documentation - Environment variable validation patterns.
- Project `package.json` files - Identified existing dependencies and scripts.
- v1.4 Audit Report - Identified `weather.ts` and `process.env` debt.

### Secondary (MEDIUM confidence)
- Web search for "Mixed TS/Java test automation" - SOTA patterns for 2024.

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH

**Research date:** 2026-04-12
