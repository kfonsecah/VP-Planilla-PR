# Phase 3: Validación de Inputs y CORS - Research

**Researched:** 2026-03-25
**Domain:** Express middleware, Zod schema validation, CORS configuration
**Confidence:** HIGH — all findings are sourced directly from the codebase

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ 3.1 | CORS configurado con `origin: process.env.ALLOWED_ORIGINS?.split(',')` | Current `app.use(cors())` in `index.ts` line 33 needs one-line change; `ALLOWED_ORIGINS` already in `.env` |
| REQ 3.2 | Schemas Zod definidos para los 5 endpoints CRUD más críticos (Employee, Payroll, ClockLog, Deduction, User) | `src/backend/src/schemas/` does not exist; all field signatures extracted from controllers and model files below |
| REQ 3.3 | `req.body` inválido retorna 400 con mensaje descriptivo | Pattern: validate in controller before calling service; return `{ success: false, error: "..." }` with status 400 |
| REQ 3.4 | `npx tsc --noEmit` pasa después del cambio | Zod 4.3.6 is already present in `node_modules` (transitive dep from frontend); must be added to `package.json` `dependencies` |
</phase_requirements>

---

## Summary

Phase 3 has two independent workstreams: a single-line CORS fix and a Zod schema layer across five controllers. Both are self-contained and have no dependencies on each other.

**CORS (REQ 3.1):** `src/backend/src/index.ts` line 33 currently calls `app.use(cors())` with no options — wildcard origin, all headers allowed. The `.env` file already has `ALLOWED_ORIGINS="http://localhost:3000"` added in anticipation of this fix. The change is a one-liner replacing the bare `cors()` call with `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })`.

**Zod schemas (REQ 3.2 and 3.3):** There is no `src/backend/src/schemas/` directory. Zero existing validation in any of the five target controllers — all five pass `req.body` or manually-mapped objects directly to the service layer without any type guard. Zod 4.3.6 is present in `node_modules` as a transitive dependency but is absent from `package.json` dependencies; it must be installed explicitly. The validation pattern is: create a schema file per domain in `src/backend/src/schemas/`, call `.safeParse(req.body)` in the controller, and return 400 with `{ success: false, error: result.error.format() }` on failure before calling any service method.

**Primary recommendation:** Create a shared `validateBody` middleware helper in `src/backend/src/utils/validateBody.ts` that accepts a Zod schema and returns an Express `RequestHandler`. Use it in routes, not in controllers, so controllers stay clean and schemas remain reusable for testing.

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint |
|-----------|-----------|
| Architecture layers | Route → Controller → Service → Prisma. Validation middleware fits at the Route layer. Controllers must not contain business logic — validation is pre-controller concern. |
| Backend file naming | `PascalCase.ts` for all modules in `src/backend/src/` |
| Error response shape | `{ success: false, error: "message" }` with appropriate HTTP status |
| No `any` in method signatures | Zod inferred types must be used — no `any` in schema or validation helper |
| Static class methods | Controllers use `static async` — schemas are plain `z.object()` exports, not class methods |
| `asyncHandler` wrapping | All route handlers use `asyncHandler`. Validation middleware must also be compatible. |
| `NEVER Change` files | `src/frontend/src/services/http.ts`, `src/backend/src/utils/asyncHandler.ts` — do not touch |
| JSDoc on every public method | Validation helper in `utils/` needs JSDoc `@param`/`@returns`/`@throws` |
| `@prisma/client` in devDependencies | Already noted as known debt — out of scope for Phase 3 |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 | Schema declaration and `req.body` parsing | Already in `node_modules`; frontend schemas already use Zod 4.x; CLAUDE.md specifies Zod for validation |
| cors | 2.8.5 | CORS middleware | Already installed in `dependencies` |
| express | 5.1.0 | HTTP framework | Already installed |

### Notes on Zod 4

Zod 4 changed the error formatting API compared to Zod 3. The `error.format()` method still exists in Zod 4, but the preferred approach for returning a structured error response uses `error.issues` (the `ZodError.issues` array). For 400 responses the simplest readable format is:

```typescript
// Zod 4 — produces a flat array of messages
const messages = result.error.issues.map(i => i.message).join(', ');
return res.status(400).json({ success: false, error: messages });
```

The frontend already consumes `{ success: false, error: string }` — joining issues to a single string keeps the response shape consistent with existing error responses throughout the codebase.

**Installation (adds to package.json dependencies):**
```bash
cd src/backend && npm install zod
```

---

## Architecture Patterns

### Recommended Project Structure After Phase 3

```
src/backend/src/
├── schemas/            # NEW — Zod schema files (one per domain)
│   ├── EmployeeSchema.ts
│   ├── PayrollSchema.ts
│   ├── ClockLogSchema.ts
│   ├── DeductionSchema.ts
│   └── UserSchema.ts
├── utils/
│   ├── asyncHandler.ts   # existing — DO NOT MODIFY
│   ├── validateBody.ts   # NEW — shared validation middleware factory
│   └── ...
├── routes/             # validation middleware applied here
├── controller/         # controllers receive already-validated body
└── ...
```

### Pattern 1: Validation Middleware Factory (recommended)

Place validation at the route layer so controllers remain pure service-delegators with no structural changes.

```typescript
// src/backend/src/utils/validateBody.ts
import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Returns an Express middleware that validates req.body against the provided Zod schema.
 * On failure returns 400 with { success: false, error: "<messages>" }.
 * On success, replaces req.body with the parsed (coerced) value and calls next().
 *
 * @param schema - Zod schema to validate against
 * @returns Express RequestHandler
 */
export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map(i => i.message).join(', ');
      res.status(400).json({ success: false, error: message });
      return;
    }
    req.body = result.data;
    next();
  };
```

**Usage in route file:**
```typescript
import { validateBody } from '../utils/validateBody';
import { createEmployeeSchema } from '../schemas/EmployeeSchema';

router.post(
  '/employee/create',
  asyncHandler(validateBody(createEmployeeSchema)),   // validation first
  asyncHandler(EmployeeController.createEmployee)     // controller second
);
```

Note: `asyncHandler` wrapping is not needed for `validateBody` since it is synchronous, but wrapping it causes no harm and keeps the route file consistent with the existing pattern.

### Pattern 2: Validate Inside Controller (alternative — NOT recommended)

This is the alternative where `.safeParse` is called at the top of each controller method. It works but puts schema knowledge inside controllers, making schemas harder to reuse in tests. Do not use this pattern.

### Anti-Patterns to Avoid

- **Passing raw `req.body` to the service layer without parsing:** This is the current problem — controllers currently call `EmployeeService.createEmployee(employeeData)` after only doing `rawData.field || rawData.altField` fallback logic with no type safety.
- **Zod `z.any()` fields:** Using `.any()` defeats the purpose of validation — every field must have a real type constraint.
- **Throwing Zod errors unhandled:** Calling `.parse()` instead of `.safeParse()` will throw `ZodError` which, if not caught, bubbles up through `asyncHandler` to Express error middleware and returns 500 instead of 400. Always use `.safeParse()`.
- **Putting validation in the Service layer:** Services operate on already-typed domain data. Validation belongs at the HTTP boundary (route/controller layer).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Body shape validation | Manual `if (!req.body.name || typeof req.body.name !== 'string')` checks | `z.object({ name: z.string().min(1) })` | Zod handles type coercion, optional fields, nested objects, and error messages automatically |
| CORS allowed-origins logic | Custom middleware reading `req.headers.origin` | `cors({ origin: ... })` | The `cors` package handles preflight OPTIONS requests, `Vary` headers, and multiple origins correctly |
| Error message formatting | Custom ZodError serializer | `error.issues.map(i => i.message).join(', ')` | Simple and sufficient for 400 responses matching existing error shape |

---

## Current State Audit (REQ 3.1)

### `src/backend/src/index.ts` — CORS line

**Line 33, current:**
```typescript
app.use(cors());
```

**Required change:**
```typescript
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
```

**`.env` — already has the variable:**
```
ALLOWED_ORIGINS="http://localhost:3000"
```

The variable exists. No `.env` change is needed. Only `index.ts` line 33 needs updating.

---

## Field Inventories by Controller (REQ 3.2)

### Employee — `EmployeeController.ts`

**Create (`POST /employee/create`)** — fields extracted from controller mapping logic:

| Frontend field name | Maps to model field | Type | Required |
|---------------------|---------------------|------|---------|
| `employee_first_name` or `name` | `name` | string | yes |
| `employee_last_name` or `last_name` | `last_name` | string | yes |
| `employee_middle_name` or `middle_name` | `middle_name` | string | no, default `''` |
| `employee_national_id` or `national_id` | `national_id` | string | no, default `''` |
| `employee_social_code` or `social_code` | `social_code` | string | no, default `''` |
| `employee_email` or `email` | `email` | string (email) | yes |
| `employee_position_id` or `position_id` | `position_id` | number | yes |
| `employee_hire_date` or `hire_date` | `hire_date` | date string | yes |
| `employee_required_hours_biweekly` or `required_hours_biweekly` | `required_hours_biweekly` | number | no, default null |
| `employee_status` or `status` | `status` | string (`activo`/`inactivo`/`suspendido`) | no, default `'active'` |

**Update (`PUT /employee/:id`)** — same fields plus:

| Field | Notes |
|-------|-------|
| `employee_exit_date` or `exit_date` | optional date string |
| `employee_fired` or `fired` | boolean, default `false` |
| `employee_version` or `version` | number, for optimistic locking |

**Zod schema approach:** Accept both frontend-prefixed names (`employee_first_name`) and bare names (`name`) since the controller currently supports both. Use `.or()` / `.refine()` or define the schema accepting the prefixed form (frontend always sends prefixed).

Looking at the frontend `employeeSchema`, the frontend sends `employee_first_name` consistently. Define backend schema accepting the prefixed names to match actual frontend behavior.

---

### Payroll — `PayrollController.ts`

**Create (`POST /payroll/create`)**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `payroll_type_id` or `payroll_type` | number | yes | FK to payroll type |
| `period_start` | string (date) | yes | Parsed with `new Date()` in controller |
| `period_end` | string (date) | yes | Parsed with `new Date()` |
| `payment_date` | string (date) | no | Defaults to `new Date()` |
| `status` | string | no | Defaults to `'PENDIENTE'` |

**Update (`PUT /payroll/:id`)** — `req.body` passed directly to `PayrollService.updatePayroll`. The service receives the entire body unmodified. Schema should validate the same fields as create, all optional for partial updates.

---

### ClockLog — `ClockLogsController.ts`

The controller has two write endpoints:

**`POST /clock-logs/bulk`** (the only write endpoint):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `logs` | array | yes | Array of clock log objects |
| `logs[].timestamp` | string (datetime) | yes | Validated with `new Date()` |
| `logs[].log_type` | string | yes | e.g. `'ENTRADA'` / `'SALIDA'` |
| `logs[].employee_id` | number | no | Either `employee_id` or `employee_name` required |
| `logs[].employee_name` | string | no | Either `employee_id` or `employee_name` required |
| `logs[].remarks` | string | no | |

Note: The controller has its own internal validation (`!Array.isArray(logs)`, `!l.timestamp || !l.log_type`). The Zod schema should mirror this at the top level. Individual array item validation with `.array(z.object(...))` covers both requirements.

---

### Deduction — `DeductionsController.ts`

**Create (`POST /deduction/create`)** — body passed raw to `DeductionsService.createDeduction(req.body)`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Deduction name |
| `description` | string | yes | |
| `percentage` | number | no | 0–100 |
| `fixed_amount` | number | no | Must be positive |

Business rule: either `percentage` or `fixed_amount` should be provided (or both). The schema can enforce this with `.refine()`.

**Update (`PUT /deductions/:id`)** — body passed raw to `DeductionsService.updateDeduction(id, req.body)`. Same fields, all optional for partial updates.

---

### User — `UserController.ts`

The `UserController` only has `updatePermissions` as a write endpoint (no create — user creation happens via `AuthController`). Current `updatePermissions` already has manual validation:

```typescript
if (!role || typeof role !== 'string') {
  return res.status(400).json({ success: false, error: "Debe indicar el rol a asignar" });
}
```

**`PUT /users/:userId/permissions`** body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `role` | string | yes | Valid roles: `'admin'`, `'employee'`, etc. |

The Zod schema for `updatePermissions` is minimal — one field. The schema can use `z.enum(['admin', 'employee'])` if the valid role list is known from `UserService.getRoleCatalog()`, or `z.string().min(1)` if roles are open-ended.

Note: User _creation_ happens in `AuthController` (registration). Phase 3 requirement says "User" schema is needed — the only mutation endpoint in `UserController` is `updatePermissions`. This schema is simpler than the others.

---

## Common Pitfalls

### Pitfall 1: Zod 4 API Differences from Zod 3

**What goes wrong:** Using `z.string().nonempty()` (removed in Zod 4) or `error.flatten()` (still available but behavior changed).
**Why it happens:** Most online examples and Claude training data show Zod 3 API.
**How to avoid:** Use `z.string().min(1)` instead of `.nonempty()`. Use `error.issues.map(i => i.message)` instead of `error.flatten().fieldErrors`. Verified: the frontend `employee.ts` schema already uses `z.string().min(1, '...')` pattern — match this.
**Warning signs:** TypeScript errors `Property 'nonempty' does not exist` at compile time.

### Pitfall 2: `date()` vs string validation for dates

**What goes wrong:** Using `z.date()` when the body sends ISO date strings — `z.date()` expects a JS `Date` object, not a string, so it fails on raw JSON body input.
**Why it happens:** JSON does not have a Date type; `express.json()` parses everything as string.
**How to avoid:** Use `z.string().datetime()` (ISO 8601 string) or `z.string()` with a custom `.refine(v => !isNaN(Date.parse(v)))` for date fields. The controller already calls `new Date(req.body.period_start)` after parsing — keep this transformation in the controller after validation.
**Warning signs:** 400 errors on valid date inputs at runtime; `z.date()` type errors when body fields are typed as `string`.

### Pitfall 3: `req.body` is typed as `any` in Express — TypeScript won't catch missing reassignment

**What goes wrong:** After validation, `req.body = result.data` sets the parsed value, but TypeScript still types `req.body` as `any` in controller methods. This means type safety downstream only works if the controller explicitly types the parsed body.
**Why it happens:** Express's `Request` type declares `body: any`.
**How to avoid:** In the `validateBody` middleware, the type enforcement is at the schema level (compile-time). The controller methods continue to work as before — they read `req.body.field` and the schema guarantees valid data is present. No additional typing is required in controllers for Phase 3.

### Pitfall 4: ClockLogsController is not a static class

**What goes wrong:** `ClockLogsController` is instantiated with `const controller = new ClockLogsController()` in `ClockLogsRoute.ts`. It does not use `static` methods unlike the other controllers.
**Why it happens:** Inconsistency in the codebase — four controllers are static-method classes, ClockLogsController is not.
**How to avoid:** The validation middleware approach (route-level `validateBody`) is not affected by whether the controller is static or not. Do not refactor ClockLogsController to static methods during this phase — CLAUDE.md says only extend, never refactor without a plan.

### Pitfall 5: `DeductionsController.createDeduction` passes `req.body` raw

**What goes wrong:** Unlike `EmployeeController` which manually maps fields before calling the service, `DeductionsController.createDeduction` does `DeductionsService.createDeduction(req.body)` directly. After validation, the Zod-parsed `req.body` will have the correct shape, but this pattern means the schema must match exactly what the service expects.
**Why it happens:** Inconsistent controller patterns in the codebase.
**How to avoid:** The deduction create schema must produce exactly the fields `DeductionsService.createDeduction` expects. Verify against `DeductionService.ts` before writing the schema.

---

## Code Examples

### Validated create route pattern (Employee)

```typescript
// src/backend/src/routes/EmployeeRoute.ts — after Phase 3
import { validateBody } from '../utils/validateBody';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas/EmployeeSchema';

router.post(
  '/employee/create',
  validateBody(createEmployeeSchema),
  asyncHandler(EmployeeController.createEmployee)
);

router.put(
  '/employee/:id',
  validateBody(updateEmployeeSchema),
  asyncHandler(EmployeeController.updateEmployee)
);
```

### Employee schema

```typescript
// src/backend/src/schemas/EmployeeSchema.ts
import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employee_first_name: z.string().min(1, 'El primer nombre es requerido'),
  employee_last_name: z.string().min(1, 'El apellido es requerido'),
  employee_middle_name: z.string().optional().default(''),
  employee_national_id: z.string().optional().default(''),
  employee_social_code: z.string().optional().default(''),
  employee_email: z.string().email('Correo electrónico inválido'),
  employee_position_id: z.number({ coerce: true }).int().positive('Position ID inválido'),
  employee_hire_date: z.string().min(1, 'Fecha de contratación requerida'),
  employee_required_hours_biweekly: z.number({ coerce: true }).optional().nullable(),
  employee_status: z.string().optional().default('active'),
});

export const updateEmployeeSchema = createEmployeeSchema.extend({
  employee_exit_date: z.string().optional(),
  employee_fired: z.boolean().optional().default(false),
  employee_version: z.number({ coerce: true }).optional(),
}).partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
```

Note: `z.number({ coerce: true })` handles cases where position_id may arrive as a string from some form submissions. Verify with the frontend behavior — if the frontend always sends a number, plain `z.number()` is sufficient.

### Payroll schema

```typescript
// src/backend/src/schemas/PayrollSchema.ts
import { z } from 'zod';

export const createPayrollSchema = z.object({
  payroll_type_id: z.number({ coerce: true }).int().positive('Tipo de planilla requerido'),
  period_start: z.string().min(1, 'Fecha inicio requerida'),
  period_end: z.string().min(1, 'Fecha fin requerida'),
  payment_date: z.string().optional(),
  status: z.string().optional().default('PENDIENTE'),
});

export const updatePayrollSchema = createPayrollSchema.partial();
```

### ClockLog bulk schema

```typescript
// src/backend/src/schemas/ClockLogSchema.ts
import { z } from 'zod';

const clockLogItemSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp requerido'),
  log_type: z.string().min(1, 'Tipo de log requerido'),
  employee_id: z.number({ coerce: true }).optional(),
  employee_name: z.string().optional(),
  remarks: z.string().optional().nullable(),
});

export const bulkCreateClockLogSchema = z.object({
  logs: z.array(clockLogItemSchema).min(1, 'Se requiere al menos un log'),
});
```

### Deduction schema

```typescript
// src/backend/src/schemas/DeductionSchema.ts
import { z } from 'zod';

export const createDeductionSchema = z.object({
  name: z.string().min(1, 'Nombre de deducción requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().positive().optional(),
});

export const updateDeductionSchema = createDeductionSchema.partial();
```

### User permissions schema

```typescript
// src/backend/src/schemas/UserSchema.ts
import { z } from 'zod';

export const updatePermissionsSchema = z.object({
  role: z.string().min(1, 'El rol es requerido'),
});
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.1.2 |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `cd src/backend && npm test -- --testPathPattern=schemas` |
| Full suite command | `cd src/backend && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ 3.1 | `cors()` replaced with origin-restricted call | manual/smoke | `curl -H "Origin: http://evil.com" http://localhost:3001/api/employees` → no CORS headers | No test file needed — verified by inspection and manual curl |
| REQ 3.2 | Zod schemas exist for 5 domains | unit | `npm test -- --testPathPattern=schemas` | ❌ Wave 0 |
| REQ 3.3 | Invalid body returns 400 with message | unit | `npm test -- --testPathPattern=validateBody` | ❌ Wave 0 |
| REQ 3.4 | `npx tsc --noEmit` passes | type check | `cd src/backend && npx tsc --noEmit` | N/A — command, not file |

### Sampling Rate

- **Per task commit:** `cd src/backend && npx tsc --noEmit`
- **Per wave merge:** `cd src/backend && npm test`
- **Phase gate:** `npx tsc --noEmit` green + manual curl test for CORS and 400 response

### Wave 0 Gaps

- [ ] `src/backend/src/__tests__/unit/schemas/EmployeeSchema.test.ts` — covers REQ 3.2 for Employee
- [ ] `src/backend/src/__tests__/unit/schemas/PayrollSchema.test.ts` — covers REQ 3.2 for Payroll
- [ ] `src/backend/src/__tests__/unit/utils/validateBody.test.ts` — covers REQ 3.3 middleware behavior

*(Existing `PayrollService.test.ts` and `prisma-mock.ts` infrastructure is reusable — no new framework install needed)*

---

## Environment Availability

Step 2.6: SKIPPED — no new external dependencies. CORS and Zod are already present in `node_modules`. The only tooling required is `npm install zod` to add Zod to `package.json` dependencies.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual field checks (`if (!req.body.name)`) | Zod `.safeParse()` with structured errors | Type-safe body, reusable schemas, standardized error messages |
| `cors()` with no options (wildcard) | `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })` | Prevents cross-origin requests from unknown origins |

---

## Open Questions

1. **Coercion for numeric IDs from frontend**
   - What we know: Frontend `employeeSchema` defines `employee_position_id` as `z.string()` (form input string). Backend `EmployeeController` calls `rawData.employee_position_id || rawData.position_id` without parsing.
   - What's unclear: Does the frontend serialize the form output and coerce position_id to a number before sending, or does it arrive as a string at the backend?
   - Recommendation: Use `z.number({ coerce: true })` in backend schemas for all ID fields as a safe default. This handles both string and number input.

2. **`payroll_type` vs `payroll_type_id` field naming**
   - What we know: `PayrollController.createPayroll` accepts both `req.body.payroll_type_id` and `req.body.payroll_type`. The Swagger doc says `payroll_type_id`.
   - What's unclear: Which does the frontend actually send?
   - Recommendation: Schema accepts `payroll_type_id` (per Swagger) using `.or()` is not needed — `z.number({ coerce: true })` for `payroll_type_id` and let the controller do the fallback mapping it already does.

3. **Valid `status` enum values for Payroll**
   - What we know: Controller defaults to `'PENDIENTE'` if not provided.
   - What's unclear: What are all the valid status values? (`PENDIENTE`, `PAGADA`, `CANCELADA`?)
   - Recommendation: Use `z.string().optional()` in the schema for now. A `z.enum(...)` can be added when valid values are confirmed from the Prisma schema or business logic.

---

## Sources

### Primary (HIGH confidence)
- Direct file reads from `src/backend/src/index.ts` — CORS current state confirmed
- Direct file reads from all 5 controller files — field inventories verified from source
- Direct file reads from all 5 model files — types confirmed
- `src/backend/package.json` — Zod confirmed absent from dependencies
- `src/backend/node_modules/zod/package.json` — Zod 4.3.6 confirmed present in node_modules
- `src/backend/.env` — `ALLOWED_ORIGINS` confirmed present
- `src/frontend/src/schemas/employee.ts` — Zod 4 usage patterns confirmed

### Secondary (MEDIUM confidence)
- Zod 4 API patterns verified against frontend usage already in codebase
- Test infrastructure inferred from `jest.config.js` and `__tests__/` directory structure

---

## Metadata

**Confidence breakdown:**
- CORS fix: HIGH — single-line change, variable already in `.env`, exact target line identified
- Zod schemas: HIGH — all field types extracted directly from controller source
- Validation middleware pattern: HIGH — pattern matches existing `asyncHandler` structure
- Zod 4 API specifics: MEDIUM — inferred from codebase usage; Zod 4 is a recent major version with known breaking changes from 3

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable library; no fast-moving changes expected)
