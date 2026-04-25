# Retrospective — VP-Planilla

---

## Milestone: v1.5 — Gestión de Marcas y Planilla para Producción

**Shipped:** 2026-04-25
**Phases:** 17 (32-48) | **Plans:** 51 | **Timeline:** 12 days (2026-04-12 → 2026-04-25)

### What Was Built

1. **Effective Marks Engine:** Non-destructive adjustment layer (ADD/EDIT/VOID) with payroll lock enforcement and full audit trail — the foundation that makes clock data trustworthy for payroll.
2. **Payroll State Machine:** BORRADOR → APROBADA → PAGADA lifecycle with aguinaldo calculation per Costa Rica labor law (6% of last semester earnings).
3. **Payroll Wizard:** 3-step guided flow replacing the flat payroll page — period selection, calculation review, executive approval summary.
4. **Clock Alias System:** Employee pseudonyms for import pipeline with IN/OUT type inference by sequence, enabling Excel files without log_type column to import correctly.
5. **Mark Recognition Engine Redesign:** Auto-detecting Excel parser, configurable time-window classifier with confidence indicators, day-confirmation audit UI.
6. **Grouped Clock Logs View:** Hierarchical layout (Branch → Employee → Day → IN/OUT pair) with infinite scroll replacing the flat clock log table.
7. **Configurable Holidays Engine:** DB-backed company holidays integrated into payroll math — mandatory pay and triple overtime on holidays configurable per company.
8. **Employee Profile Redesign:** Consolidated tabs (summary, labor, salary, marks, events, docs) with modal integration and profile navigation from table.
9. **Labor Calendar Redesign:** Modern sidebar + mini-calendar + event filters + animated EventPopover replacing the legacy FullCalendar-only view.

### What Worked

- **Incremental schema design:** Defining the adjustment layer (Phase 32) before any UI work meant backend and frontend phases had stable contracts to build against.
- **State machine first:** Implementing the payroll lifecycle in backend (Phase 36) before the wizard (Phase 37) kept the wizard as pure UI orchestration with no business logic leaking into components.
- **Gap closure plans:** Adding 37-05 explicitly to close UAT gaps (status badges, contextual buttons) rather than silently patching mid-phase kept the commit history clean and traceable.
- **Alias + inference combo:** Solving both alias resolution and type inference in the same phase (41) avoided a second import pipeline rework later.

### What Was Inefficient

- **Phase 38 test failures:** 27 test failures discovered in the integration phase required a dedicated Phase 40 to fix — tests should have been maintained incrementally throughout Phases 33-37.
- **UAT gaps at close:** 22 open items (debug sessions, partial UATs, verification gaps) were deferred rather than resolved. Several debug sessions (`position-not-in-edit-form`, `perfil-empleado-salario-base-edicion-info`) were investigating during active feature work and never closed.
- **Overlapping mark recognition:** Phase 46 (mark recognition redesign) partially overlapped with Phase 33 (effective marks engine) in scope, leading to some backend restructuring after frontend was already built.

### Patterns Established

- **Adjustment Layer Pattern:** All corrections to immutable source data go through a separate adjustments table — never overwrite originals. This is now the standard for any future correction feature.
- **Day Confirmation as Gate:** The day-confirmation UI before payroll calculation ensures data quality is owned by the user, not silently assumed by the engine.
- **Time Window Classification:** Configurable time windows (e.g., 06:00-10:00 = IN) with confidence scoring is reusable for any future mark-type inference.

### Key Lessons

- **Test-as-you-go over batch testing:** Phases 38 and 40 were essentially cleanup for tests that should have been maintained during feature phases — costly in time and context.
- **Close debug sessions before closing milestone:** At v1.5 close, 8 debug sessions were still open. Starting v1.6 with a clean debug slate should be a pre-planning requirement.
- **Scope creep via inserted phases:** v1.5 grew from 8 planned phases (32-38) to 17 (32-48) — 9 phases inserted mid-milestone. Each insertion was justified, but the cumulative effect was a 12-day milestone instead of a projected 5-day one.

### Cost Observations

- Sessions: ~40+ across 17 phases
- Notable: Phase 46 (mark recognition redesign) was the heaviest single phase — 6 plans spanning backend schema, 3 service layers, and 3 frontend component waves.

---

## Milestone: v1.4 — Stability and Integration Hardening

**Shipped:** 2026-04-12
**Phases:** 8 | **Plans:** 15 | **Timeline:** 4 dias

### What Was Built

1. **Auth Lifecycle:** Unified token refresh/revocation/logout flow with consistent error mapping across stacks.
2. **HTTP Layer:** Enforced unified client (`http.ts`) for all business services, eliminating direct fetch bypasses.
3. **Repository Hygiene:** Purged git index of build artifacts/OS noise and standardized lock file policies (`package-lock.json` tracked).
4. **Modularization:** Monolith decomposition into specialized services (`ClockLogsService`, `ImportSessionService`, etc.).
5. **Security:** Email-verified password reset flow with bcrypt hashing and 15-min expiry.
6. **Code Quality:** Centralized environment validation using **Zod** in the backend for fail-fast startup.
7. **Java Automation:** Introduced **JUnit 5** and **Mockito** testing baseline for the Java clock-log utility.

### What Worked

- **Zod for Config:** Catching missing environment variables at startup prevented several "undefined" runtime errors during development.
- **Unit Testing Java:** Decoupling `fileReader` from the database via DI made the Java logic verifiable for the first time.
- **Surgical Git Purge:** Using `git rm --cached` cleaned the repo without affecting local dev environments.

### What Was Inefficient

- **Interrupted Milestone Cierre:** Sequential shell commands and script errors led to inconsistent initial state updates during closure.
- **Java Testing Complexity:** Mocking ByteBuddy on Java 25 required specific Surefire flags that were not immediately obvious.
- **Traceability Updates:** Keeping `STATE.md` and `ROADMAP.md` in sync during rapid phase execution requires constant manual attention.

### Patterns Established

- **Fail-Fast Configuration:** All critical backend dependencies (DB, JWT, Resend) are validated at import-time.
- **Unified HTTP Handling:** Frontend services never call raw fetch; they use the centralized client to ensure token persistence.
- **App-Level Lock Files:** Tracking `package-lock.json` in application directories is now the project standard for deterministic builds.

### Key Lessons

- **Validate Config Early:** Moving from `process.env` to a validated `env.ts` object significantly improved system reliability.
- **Automate Multi-Stack Tests:** Having JUnit 5 alongside Jest ensures that core logic in both Java and TS is held to the same quality standard.
- **Consolidate Planning Documents:** Closing a milestone requires a holistic check of all master documents to ensure the "source of truth" is consistent.

---

## Milestone: v1.3 — Sistema de Marcas de Reloj Robusto

**Shipped:** 2026-04-09
**Phases:** 6 | **Plans:** 14 | **Timeline:** 4 dias
...
