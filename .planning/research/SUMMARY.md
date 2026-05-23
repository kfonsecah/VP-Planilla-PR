# Research Summary: Production Hardening & DX (v1.10)

**Domain:** Production Hardening & Developer Experience
**Researched:** 2025-05-14
**Overall confidence:** HIGH

## Executive Summary

The research for Milestone v1.10 focused on three core pillars: **Observability**, **Security**, and **Developer Experience (DX)**. 

For **Observability**, Sentry v8 is the recommended tool, utilizing the new `instrumentation.ts` hook in Next.js 15 and OpenTelemetry auto-instrumentation in Express 5. This provides deep visibility into Server Actions and backend errors.

For **Security**, the project must adapt to Express 5's immutable `req.query` by using Zod for validation rather than manual mutation. The `hpp` middleware remains the standard for preventing parameter pollution.

For **DX**, the combination of Husky 9, Commitlint, and `prisma-dbml-generator` will standardize the development workflow. These tools ensure that every commit follows the Conventional Commits spec and that database documentation (DBML) is always in sync with the Prisma schema.

## Key Findings

**Stack:** Sentry v8 (Next.js/Node) + `hpp` + Husky 9 + Commitlint + `prisma-dbml-generator`.
**Architecture:** Zero-day initialization via `instrumentation.ts` and middleware-first API protection.
**Critical pitfall:** Express 5 `req.query` is immutable; manual mutation will cause crashes.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Git & Docs Standards** - Lowest risk, immediate impact on repo health.
   - Addresses: Conventional Commits, Husky, DBML.
   - Avoids: Git history clutter from the start of the milestone.

2. **Security Hardening (Express 5)** - High priority for API integrity.
   - Addresses: HPP Protection, Zod-based query parsing.
   - Avoids: Potential `TypeError` from `req.query` mutation.

3. **Observability (Sentry)** - Highest complexity due to cross-layer configuration.
   - Addresses: Error tracking, Distributed Tracing, Session Replay.
   - Avoids: Blind spots in production by implementing `tunnelRoute`.

**Phase ordering rationale:**
- Starting with Git standards ensures all hardening work is properly documented in the history.
- Security hardening precedes observability to ensure the baseline API logic is robust before adding monitoring overhead.

**Research flags for phases:**
- Phase 3 (Sentry): Likely needs deeper research into specific React 19 hooks if `onRequestError` doesn't cover all client-side scenarios.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with latest official documentation for Next.js 15 and Express 5. |
| Features | HIGH | Standard patterns for production hardening. |
| Architecture | HIGH | Aligns with modern "Zero-day" and "Middleware-first" patterns. |
| Pitfalls | HIGH | Directly sourced from official migration guides. |

## Gaps to Address

- **Sentry Sampling Rates:** Initial rates (1.0) might be too high for a production environment with high traffic; needs adjustment during implementation.
- **HPP Whitelist:** Need to identify if any existing endpoints specifically require array-type query parameters.
