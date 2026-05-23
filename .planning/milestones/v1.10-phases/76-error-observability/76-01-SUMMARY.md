---
phase: 76-error-observability
plan: 01
subsystem: Observability
tags: ["sentry", "monitoring", "tracing", "nextjs", "express"]
dependency_graph:
  requires: ["75-01"]
  provides: ["error-tracking"]
  affects: ["backend-runtime", "frontend-build"]
tech_stack:
  added: ["@sentry/node", "@sentry/profiling-node", "@sentry/nextjs"]
  patterns: ["Distributed Tracing", "Node --import", "instrumentation.ts"]
key_files:
  created: [
    "src/backend/instrument.js",
    "src/frontend/src/instrumentation.ts",
    "src/frontend/sentry.server.config.ts",
    "src/frontend/sentry.client.config.ts",
    "src/frontend/sentry.edge.config.ts"
  ]
  modified: [
    "src/backend/package.json",
    "src/backend/src/index.ts",
    "src/frontend/package.json",
    "src/frontend/next.config.ts"
  ]
decisions:
  - "Configured Sentry in the backend using `--import ./instrument.js` to enable OpenTelemetry based auto-instrumentation before any other modules load."
  - "Added `Sentry.setupExpressErrorHandler(app)` in `src/backend/src/index.ts`."
  - "Configured Sentry in the frontend using App Router `instrumentation.ts`."
  - "Added `tunnelRoute: '/monitoring-tunnel'` to `next.config.ts` to prevent ad-blockers from dropping client-side Sentry events, as directed by TODO.md."
  - "Removed deprecated options `disableLogger` and `automaticVercelMonitors` from `next.config.ts`."
metrics:
  duration: "10m"
  completed_date: "2026-05-13"
---

# Phase 76 Plan 01: Error Observability & Tracing Summary

Successfully integrated Sentry into both the Express backend and the Next.js frontend to provide full-stack error tracking and distributed tracing.

## Deviations from Plan

### Cleaned up Sentry Deprecation Warnings
- **Found during:** Running `npx next lint`
- **Issue:** Deprecation warnings for `disableLogger` and `automaticVercelMonitors` in `withSentryConfig`.
- **Fix:** Removed the deprecated options from `next.config.ts` to ensure a clean build.

## Self-Check: PASSED

1. Created files exist:
   - src/backend/instrument.js: FOUND
   - src/frontend/src/instrumentation.ts: FOUND
2. Functionality verified:
   - Sentry packages are installed in both workspaces.
   - Sentry initialization logic is correctly positioned (`--import` for backend, `instrumentation.ts` for frontend).
   - Typechecks and linters completed without new errors.
