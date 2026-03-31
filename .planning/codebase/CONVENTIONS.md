# Coding Conventions

**Analysis Date:** 2026-03-31

## Naming Patterns

**Files:**
- Backend: `PascalCase.ts` (e.g., `EmployeeService.ts`, `PayrollController.ts`, `AuthMiddleware.ts`)
- Frontend components: `PascalCase.tsx` (e.g., `AddEmployeeModal.tsx`, `EmployeeTable.tsx`)
- Frontend hooks: `camelCase` prefixed with `use` (e.g., `useEmployeeList.ts`, `usePositions.ts`)
- Frontend services: `camelCase` (e.g., `employeeService.ts`, `payrollService.ts`, `http.ts`)
- Test files: `*.test.ts` or `*.spec.ts` (e.g., `NomineeService.test.ts`, `payrollUtils.test.ts`)

**Functions:**
- camelCase: `calculatePayroll()`, `getEmployeeById()`, `validateClockLogPairs()`
- Static methods in service classes: `static async methodName()`
- Backend: no instance methods, only static methods

**Variables:**
- camelCase for local variables: `employeeData`, `isLoading`, `searchTerm`
- camelCase for function parameters: `data`, `id`, `date`, `options`

**Types/Interfaces:**
- PascalCase: `Employee`, `EmployeeFormData`, `Payroll`, `DayWork`
- Model interfaces: `Employee`, `Position`, `Deduction` (live in `src/backend/src/model/`)
- Frontend schemas: Zod types exported as `EmployeeSchemaType`, `EmployeeSchemaInputType`

**Database fields/table names:**
- `snake_case` matching Prisma schema: `period_start`, `employee_first_name`, `national_id`
- Table prefix convention: all tables start with `vpg_` (e.g., `vpg_employees`, `vpg_payrolls`, `vpg_positions`)
- Relation fields use underscore pattern: `employee_position_id`, `payroll_type_id`

**Form field names:**
- `entity_field_name` pattern (e.g., `employee_first_name`, `employee_social_code`, `employee_hire_date`)
- Frontend forms match backend schema with `employee_` prefix throughout

**Top-level constants:**
- `SCREAMING_SNAKE_CASE`: `REGULAR_HOURS_PER_DAY`, `OVERTIME_MULTIPLIER`, `WORKING_DAYS_PER_WEEK`, `FERIADOS_CR`
- Constant objects use `SCREAMING_SNAKE_CASE` with nested key casing: `EMPLOYEE_STATUS`, `STATUS_BADGE_CONFIG`, `MESSAGES`

## Code Style

**Formatting:**
- No explicit formatter enforced (eslint present on frontend, none detected on backend)
- Consistent 2-space indentation observed throughout
- Line lengths typically 80-100 characters (no hard limit enforced)

**Linting:**
- Frontend: ESLint with `next/core-web-vitals` and `next/typescript` presets
- Backend: No linter configured; relies on TypeScript strict mode
- Command: `npx next lint` (frontend only)

**TypeScript:**
- Strict mode enabled: `"strict": true` in both `tsconfig.json` files
- Target: ES2020 (backend), matching Node 22 capabilities
- Module resolution: node16 (backend)
- No `any` types allowed in method signatures (enforced by CLAUDE.md policy)
- Explicit type annotations on all function parameters and returns

## Import Organization

**Order:**
1. External packages (`express`, `react`, `zod`, `@prisma/client`)
2. Internal relative imports from `../` paths (backend) or `@/` aliases (frontend)
3. Type imports grouped separately if needed

**Path Aliases:**
- Frontend: `@/` prefix for all imports from `src/` (e.g., `@/components`, `@/services`, `@/types`, `@/schemas`, `@/hooks`, `@/constants`)
- Backend: relative paths only; no alias convention
- Frontend policy: Never use `../../` relative imports beyond 1 level — always use `@/`

**Example Frontend:**
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Employee } from '@/types';
import { employeeService } from '@/services/employeeService';
import useEmployeeList from '@/hooks/useEmployeeList';
```

**Example Backend:**
```typescript
import { Request, Response } from "express";
import { prisma } from '../lib/prisma';
import { EmployeeService } from "../service/EmployeeService";
```

## Error Handling

**Backend patterns:**
- Services throw native JavaScript `Error` objects with descriptive messages
- Controllers wrap try-catch and return JSON: `{ error: "message" }` with appropriate HTTP status
- No custom error classes observed; uses plain Error
- asyncHandler utility wraps all route handlers to catch promise rejections

**Frontend patterns:**
- Service methods throw native `Error` for API call failures
- Hooks catch errors and expose via hook return shape: `{ data, isLoading, error, ...actions }`
- Modal components handle submission errors with try-catch and don't re-throw
- Error messages displayed inline in UI, not propagated up

**Example Backend:**
```typescript
try {
  const employee = await EmployeeService.createEmployee(data);
  return res.status(201).json(employee);
} catch (error) {
  console.error("Error creating employee:", error);
  return res.status(500).json({ error: "Failed to create employee" });
}
```

**Example Frontend:**
```typescript
const [error, setError] = useState<string | null>(null);
try {
  await employeeService.updateEmployee(id, data);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to update');
}
```

## Logging

**Framework:** `console` (no logging library in use)

**Patterns:**
- Development logs: `console.log()` for startup messages, route access
- Error logs: `console.error()` when exceptions occur in controllers
- No structured logging; informal messages like `"Ruta raíz accesada"`, `"Servidor en ejecución..."`
- Comments in Spanish OK; infrastructure comments in English preferred

**Observed locations:**
- `src/backend/src/index.ts`: server startup messages
- `src/backend/src/controller/`: error logging on catch blocks
- `src/frontend/src/services/http.ts`: debug log for API_BASE URL during development

## Comments

**When to Comment:**
- All public methods require JSDoc with `@param`, `@returns`, `@throws`
- Inline comments for non-obvious logic (e.g., timezone offset calculations, field mapping)
- Business logic comments in Spanish allowed; technical/infrastructure comments in English

**JSDoc/TSDoc Format:**
```typescript
/**
 * Brief description of what this does
 * @param fieldName - Description of parameter
 * @returns Description of return value
 * @throws Description of exceptions
 */
static async methodName(fieldName: string): Promise<Result> {
  // implementation
}
```

**Example observed:**
```typescript
/**
 * Create a new employee in the system
 * POST /employee/create
 * @param req - Express request object containing employee data
 * @param res - Express response object
 * @returns Promise<Response> - HTTP response with created employee data or error
 */
static async createEmployee(req: Request, res: Response): Promise<Response> {
```

## Function Design

**Size:**
- Service methods typically 20-50 lines; larger methods break down complex payroll logic
- Utility functions are small (5-25 lines) and pure
- No strict length limit; follows single-responsibility principle

**Parameters:**
- Explicit object parameters preferred over positional args
- Optional fields use `?` suffix: `data?: string`
- Objects destructured in function bodies when needed

**Return Values:**
- All async service methods return Promise-wrapped domain types
- Controllers return Express `Response` (explicit `return res.status(...).json(...)`)
- Frontend hooks return object shapes: `{ data, isLoading, error, ...actions }`
- Null/undefined returned explicitly when not found (no generic fallbacks)

**Example:**
```typescript
static async getEmployeeById(id: number): Promise<Employee | null> {
  const prismaEmployee = await prisma.vpg_employees.findUnique({
    where: { employee_id: id }
  });
  if (!prismaEmployee) return null;
  return mapPrismaToEmployee(prismaEmployee);
}
```

## Module Design

**Exports:**
- Backend: class with static methods exported as named export: `export class EmployeeService { ... }`
- Frontend services: named function exports: `export const getEmployees = async () => ...`
- Frontend components: default export as `React.FC<PropsInterface>`
- Frontend hooks: default export function: `export default useEmployeeList`

**Barrel Files:**
- `src/constants/index.ts`: exports all constants
- No other barrel files observed; imports are direct from source files
- Frontend hooks imported individually: `import useEmployeeList from '@/hooks/useEmployeeList'`

**Example Backend Export:**
```typescript
export class EmployeeService {
  static async createEmployee(data: Employee): Promise<Employee> { ... }
  static async getEmployeeById(id: number): Promise<Employee | null> { ... }
  static async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | null> { ... }
}
```

**Example Frontend Export:**
```typescript
const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  // component body
};
export default AddEmployeeModal;
```

## Prisma Integration

**Pattern:**
- Always import singleton: `import { prisma } from '../lib/prisma'`
- Never instantiate `new PrismaClient()`
- Prisma queries in service layer only, never in controllers
- Direct method chaining: `prisma.vpg_employees.findUnique()`, `prisma.vpg_payrolls.create()`

**Data Mapping:**
- Services map Prisma objects to domain models: `mapPrismaToEmployee(prismaEmployee)`
- Field names use Prisma schema names (with `vpg_` prefix)
- Convert between frontend form names (`employee_first_name`) and DB names internally

---

*Convention analysis: 2026-03-31*
