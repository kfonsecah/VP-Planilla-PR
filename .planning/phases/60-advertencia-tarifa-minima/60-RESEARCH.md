# Phase 60: Advertencia de Tarifa Mínima en Planilla - Research

**Researched:** 2026-04-26
**Domain:** UI Notifications, Payroll Business Logic Validation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Proveer una validación visual e informativa (no bloqueante) durante el flujo de planilla si un empleado está ganando por debajo de la tarifa mínima global configurada.
- Lógica de validación en el backend/frontend que compara `position_base_salary` vs `GLOBAL_MIN_WAGE_RATE`.
- UI: Icono de advertencia (Tooltip/Badge) en el Payroll Wizard (Paso 2/3) junto al nombre del empleado afectado.
- Comportamiento esperado si `MIN_WAGE_CHECK_ENABLED` es `1` (true): El Wizard calcula si `empleado.base_salary < GLOBAL_MIN_WAGE_RATE` y muestra un icono de "⚠️" con el texto: "Salario inferior a la tarifa mínima global (₡X.XX)".
- Comportamiento esperado si `MIN_WAGE_CHECK_ENABLED` es `0` (false): No se realizan comprobaciones ni se muestran advertencias.
- La aprobación de la planilla procede normalmente en ambos casos.

### the agent's Discretion
- Registro de auditoría si se aprueba una planilla con advertencias activas (opcional).

### Deferred Ideas (OUT OF SCOPE)
- Bloqueo de la transición `BORRADOR` → `APROBADA`.
- Requerir contraseña o justificación obligatoria para proceder con salarios bajos (se mantiene como advertencia informativa).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-25 | Validación Salario Mínimo al Aprobar | Aunque el Roadmap original dictaba bloquear, los requerimientos actualizados de esta fase (USER DECISIONS) especifican que solo debe advertir, usando `vpg_legal_params`. |
</phase_requirements>

## Summary

The objective of Phase 60 is to introduce a non-blocking visual warning during the payroll wizard flow. If the global parameter `MIN_WAGE_CHECK_ENABLED` is active and an employee's configured base salary is strictly less than the `GLOBAL_MIN_WAGE_RATE`, the UI should display a warning indicator next to the employee's name.

Crucially, **the flow must not be blocked**. This diverges from the original `ROADMAP.md` text but aligns strictly with the explicit out-of-scope boundaries defined in `60-CONTEXT.md`. The client has full autonomy over hourly rates, so the feature remains strictly informational. The validation can either be pre-calculated by the backend and sent down as warnings in the calculation payload, or performed directly on the frontend by passing the legal parameters to the wizard.

**Primary recommendation:** Evaluate the warning condition (`base_salary < GLOBAL_MIN_WAGE_RATE`) directly on the frontend using the parameters fetched from the backend, enabling the "⚠️" Tooltip rendering in the Wizard without interfering with the backend's core calculation logic.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Legal Param Retrieval | API / Backend | Database | `LegalParamService` retrieves `GLOBAL_MIN_WAGE_RATE` and `MIN_WAGE_CHECK_ENABLED`. |
| Low Wage Detection | Frontend Server / Client | API / Backend | Can be done efficiently in the React components during mapping of the payroll preview list. |
| Warning UI Display | Browser / Client | — | Rendered purely via React state and Tailwind classes on Step 2/3 of the Wizard. |
| Audit Logging (Opt.) | API / Backend | — | If enabled, the API logs "Payroll approved with wage warnings" via `vpg_audit_logs`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js / React | 15.5.6 / 19 | UI Framework | Project's standardized frontend. |
| Tailwind CSS | ^4 | Styling the Badge/Tooltip | Project's standardized CSS framework. |
| Express.js | 5.1.0 | Backend API | Project's standardized backend routing. |

## Architecture Patterns

### Recommended Project Structure
No new folders are required. Focus modifications on existing files:
- `src/frontend/src/app/pages/payroll/wizard/`: Target the component for Step 2 or 3 to add the warning icon.
- `src/frontend/src/hooks/usePayrollWizard.ts`: Provide `GLOBAL_MIN_WAGE_RATE` and `MIN_WAGE_CHECK_ENABLED` state.
- `src/backend/src/controller/` & `src/backend/src/routes/`: Ensure the frontend can efficiently query these specific parameters (or embed them in the calculate response).

### Pattern 1: Non-Blocking UI Warnings
**What:** Providing real-time validation alerts without disabling form submission.
**When to use:** When rules are informational and not strict business constraints.
**Example:**
```tsx
// Frontend UI snippet pattern
{minWageCheckEnabled && Number(employee.base_salary) < Number(globalMinWageRate) && (
  <div className="group relative inline-flex">
    <span className="text-yellow-500">⚠️</span>
    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded">
      Salario inferior a la tarifa mínima global (₡{globalMinWageRate})
    </div>
  </div>
)}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI Tooltips | Complex DOM positioning | Simple Tailwind CSS `group-hover` or existing Tooltip components in the project | Less code, responsive, avoids z-index clipping issues in tables. |
| Params API | Custom manual queries | `LegalParamService` | Centralizes legal configuration retrieval and adheres to phase 55 standard. |

## Common Pitfalls

### Pitfall 1: Type Mismatches in Comparisons
**What goes wrong:** A database `Decimal` comes back to the UI as a `string` (e.g., `"1500.50"`), resulting in Javascript lexigraphical comparison bugs.
**Why it happens:** Standard Prisma + JSON serialization behavior.
**How to avoid:** Always parse the salary and rate into floats using `Number(x)` before evaluating `<`.

### Pitfall 2: Crashing on Undefined Parameters
**What goes wrong:** UI or backend crashes trying to evaluate the rule if `GLOBAL_MIN_WAGE_RATE` is not seeded yet.
**Why it happens:** Assuming database state always exists perfectly.
**How to avoid:** Fallback to `false` logic when either parameter is null/undefined.

## Open Questions (RESOLVED)

| Question | Resolution |
|----------|------------|
| ¿Dónde debe ocurrir el fetch de parámetros en el Wizard? | En el hook `usePayrollWizard.ts` mediante un `useEffect` al montar, centralizando el estado y la lógica de carga. |
| ¿Cómo implementar el toggle de configuración cumpliendo con PHASE_CONTRACT? | Usando `react-hook-form` + `zodResolver` en la página de configuración de empresa, tratando el toggle como un campo de formulario estandarizado. |

## Environment Availability
Step 2.6: SKIPPED (no external dependencies identified)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest ^29.7.0 |
| Config file | none — see Wave 0 |
| Quick run command | `npm test -- {file_pattern}` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-25 | Fetch parameters and evaluate gracefully | unit | `npm test -- src/backend/src/service` | ✅ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- {file_pattern}`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `AuthMiddleware` |
| V3 Session Management | yes | `AuthMiddleware` |
| V4 Access Control | yes | Roles validation (e.g., `payroll_manager`, `admin`) |
| V5 Input Validation | yes | Zod |
| V6 Cryptography | no | — |

## Sources

### Primary (HIGH confidence)
- `60-CONTEXT.md` - Explicit scope definition and out-of-scope constraints.
- `ROADMAP.md` - Overall system vision and parameter prerequisites.
- `GEMINI.md` - Explicit tech stack architecture rules.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Defined explicitly in `GEMINI.md`
- Architecture: HIGH - Standard mapping within existing Next.js/Express layers
- Pitfalls: HIGH - Javascript string/number comparison bugs are typical in these features.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26
