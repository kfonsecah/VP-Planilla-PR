# Phase 27: Monolith Decomposition and Maintainability - Research

**Researched:** 2026-04-11
**Domain:** Frontend/Backend Architecture, Code Metrics, Refactoring
**Confidence:** HIGH

## Summary

This phase focuses on refactoring "monolithic" files in both the frontend and backend of the VP-Planilla project. The primary candidates for decomposition are `src/frontend/src/app/pages/clock-logs/page.tsx` and `src/backend/src/controller/ClockLogsController.ts`, both exceeding 400 lines and mixing concerns like data fetching, UI logic, business rules, and date normalization.

The research identifies the **Layered Feature Pattern** as the modern standard for Next.js (App Router) decomposition, separating code into **Services** (data), **Presenters** (transformation), **Hooks** (client state), and **Views** (UI). For the backend, a formal **Service Layer** is recommended to move business logic out of Express controllers. Empirical measurement of "monoliths" will be performed using ESLint-based complexity rules (Cyclomatic and Cognitive).

**Primary recommendation:** Use `eslint-plugin-sonarjs` to identify high-complexity functions and apply the "Extract to Presenter" pattern for UI-heavy pages, moving all date-parsing and status-mapping logic to pure functions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No decisions locked yet for this phase in CONTEXT.md.

### the agent's Discretion
- Selection of decomposition patterns (Hooks, Services, Presenters).
- Choice of tools for complexity analysis.
- Structure of regression tests for refactored logic.

### Deferred Ideas (OUT OF SCOPE)
- Complete rewrite of frontend/backend.
- Changing the primary framework (Next.js/Express).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOD-01 | Los archivos monoliticos de alta complejidad se separan en modulos con responsabilidad clara | Identified Layered Feature Pattern and Service Layer pattern. |
| MOD-02 | La logica de parsing/importacion de marcas queda desacoplada de componentes de pagina grandes | Identified specific candidates in `ClockLogsController` and `ClockLogsDashboardPage`. |
| MOD-03 | Los cambios de modularizacion mantienen comportamiento funcional verificado por pruebas | Recommended "Characterization Testing" and pure function unit testing. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `eslint-plugin-sonarjs` | ^1.0.0 | Cognitive Complexity | Measures how hard code is to understand, not just path count. |
| `jest` | ^29.7.0 | Unit Testing | Already in project; ideal for testing extracted pure functions. |
| `zod` | ^3.x | Input Validation | Already in project; used to decouple validation from controllers. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `eslint-plugin-complexity` | Built-in | Cyclomatic Complexity | Basic gating for "spaghetti" code paths. |
| `vitest` | ^1.x | Fast Unit Testing | Alternative if Jest performance becomes an issue (not recommended yet). |

**Installation:**
```bash
# Frontend (in src/frontend)
npm install --save-dev eslint-plugin-sonarjs

# Backend (in src/backend)
npm install --save-dev eslint eslint-plugin-sonarjs @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Architecture Patterns

### Recommended Project Structure (Feature-Based)
```
src/frontend/src/
├── features/
│   ├── clock-logs/
│   │   ├── components/    # Pure UI Views (Dumb)
│   │   ├── hooks/         # Interaction logic (useClockLogs)
│   │   ├── presenters/    # Data transformation (ViewModel)
│   │   ├── services/      # API calls (Capa HTTP)
│   │   └── index.ts       # Public API
├── app/
│   └── pages/clock-logs/page.tsx # Orchestrator (Slim)
```

### Pattern 1: Presenter (View Model)
**What:** Pure functions that take raw API data and return objects formatted for the UI.
**When to use:** When a page has complex date formatting, status color logic, or derived stats.
**Example:**
```typescript
// src/features/clock-logs/presenters/clockLogPresenter.ts
export const formatClockLogForUI = (log: RawClockLog) => ({
  ...log,
  displayDate: new Date(log.timestamp).toLocaleDateString('es-CR'),
  statusColor: STATUS_COLORS[log.status] || 'gray',
});
```

### Pattern 2: Service Layer (Backend)
**What:** Classes/Functions that handle business rules, orchestration, and DB access, leaving Controllers to handle only HTTP concerns (parsing params, status codes).
**When to use:** When a controller method (like `import`) exceeds 30 lines or contains loops/complex logic.

### Anti-Patterns to Avoid
- **Inline Helpers:** Defining `isoToDisplay` or `normalizeName` inside components or controllers.
- **Hook Monoliths:** Putting data fetching + local state + event handlers all in one `useFeature` hook.
- **Direct Database in Controller:** (Already partially addressed in the project, but some controllers still have complex resolution logic like `resolveEmployeeId`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Complexity Scoring | Custom script | `eslint-plugin-sonarjs` | Industry standard, integrates with CI/CD. |
| Date Normalization | Raw Date math | `date-fns` or native `Intl` | Handles locales and edge cases correctly. |
| State Management | Global Redux | `useState` + Hooks | Project currently uses lightweight hooks; keep it simple. |

## Common Pitfalls

### Pitfall 1: Fragile Refactor (Regressions)
**What goes wrong:** Moving logic from UI to Service breaks the page because of subtle dependencies on component state or closures.
**How to avoid:** Use **Characterization Testing**. Capture current output (or snapshots) before moving logic. Move to a pure function first, then test the function, then swap the implementation in the UI.

### Pitfall 2: Over-Engineering
**What goes wrong:** Creating "Services" for 5-line components that don't need them.
**How to avoid:** Only refactor files that fail the "Cognitive Complexity" check (Score > 15).

## Code Examples

### Decomposing `ClockLogsController.import`
Instead of having `resolveEmployeeId` inside the controller, move it to a `PayrollService`.

```typescript
// src/backend/src/service/PayrollService.ts
export class PayrollService {
  static async resolveEmployeeId(id: unknown, name: unknown): Promise<number | null> {
    // ... logic moved from controller ...
  }
}

// src/backend/src/controller/ClockLogsController.ts
async import(req: Request, res: Response) {
  // 1. Extract & Validate (HTTP concern)
  // 2. Delegate to Service (Business concern)
  const result = await ClockLogsImportService.process(req.body.logs, req.user.id);
  // 3. Return response (HTTP concern)
  return res.status(201).json(result);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Presenter/Container | RSC (Server Components) | Next.js 13+ | Logic stays on server; views are lighter. |
| Cyclomatic Complexity | Cognitive Complexity | 2017+ (Sonar) | Better proxy for maintainability/readability. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Complexity tools can be easily added to ESLint 9 | Standard Stack | High - Flat config might need specific plugin updates. |
| A2 | Characterization tests (snapshots) can be added to the frontend | Validation | Medium - Requires configuring JSDOM in existing Jest. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `npm` | All | ✓ | 10.x | — |
| `eslint` | Complexity | ✓ | 9.x | — |
| `jest` | Testing | ✓ | 29.7 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | `src/frontend/jest.config.mjs` / `src/backend/jest.config.ts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOD-01 | Decomposed modules | Unit | `npm test {feature}` | ❌ Wave 0 |
| MOD-02 | Decoupled parsing | Unit | `npm test presenters` | ❌ Wave 0 |
| MOD-03 | No regression | Snapshot | `npm test {page}` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Move Zod schemas from Controllers to Services to ensure consistency across all entry points. |

## Sources

### Primary (HIGH confidence)
- `src/frontend/eslint.config.mjs` - ESLint 9 Flat Config detected.
- `src/frontend/src/app/pages/clock-logs/page.tsx` - Large component analyzed.
- `src/backend/src/controller/ClockLogsController.ts` - Controller logic analyzed.

### Secondary (MEDIUM confidence)
- [Official ESLint complexity rule docs]
- [SonarJS Cognitive Complexity paper]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tools are industry standard.
- Architecture: HIGH - Layered Feature Pattern is proven for Next.js.
- Pitfalls: MEDIUM - Regression testing without pre-existing tests is always risky.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
