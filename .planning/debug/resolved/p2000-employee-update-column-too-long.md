---
status: VERIFIED FIX - fixed 
trigger: "updateEmployee falla con Prisma P2000 — The provided value for the column is too long for the column's type. Prisma no reporta qué columna. Error en EmployeeService.ts:119"
created: 2026-03-25T00:00:00Z
updated: 2026-03-25T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMADA Y CORREGIDA
test: Se verificó que createEmployee ya tenía statusMap pero updateEmployee no — se aplicó el mismo mapeo
expecting: updateEmployee ya no enviará strings largos a Char(1) — el P2000 no debe reaparecer
next_action: Verificación humana — editar empleado desde el frontend y confirmar que guarda sin error

## Symptoms

expected: updateEmployee guarda los cambios del empleado correctamente
actual: Prisma lanza PrismaClientKnownRequestError P2000 — "The provided value for the column is too long for the column's type. Column: (not available)"
errors: |
  code: 'P2000'
  meta: { modelName: 'vpg_employees', column_name: '(not available)' }
  clientVersion: '6.19.2'
  Stack trace: EmployeeService.ts:119 → EmployeeController.ts:97
reproduction: Editar un empleado desde el frontend y guardar
started: Ocurre durante Phase 3 (después de agregar Zod validation). El error anterior (employee_required_hours_biweekly unknown field) fue resuelto con npx prisma generate.

## Eliminated

- hypothesis: Error viene de campos de fecha enviados en formato largo
  evidence: Los campos fecha en la DB son @db.Date — Prisma maneja la conversión. No son string en el schema Zod.
  timestamp: 2026-03-25T00:01:00Z

- hypothesis: El schema Zod es el único lugar donde aplicar el fix (agregar .max())
  evidence: |
    El schema Zod no puede rechazar 'active' porque el frontend legítimamente envía ese valor.
    El service layer es donde debe ocurrir la traducción, igual que en createEmployee.
  timestamp: 2026-03-25T00:03:00Z

## Evidence

- timestamp: 2026-03-25T00:00:00Z
  checked: symptoms context
  found: Error P2000 ocurre en EmployeeService.ts:119, después de agregar Zod validation en Phase 3
  implication: El schema Zod probablemente no tiene .max() en campos string

- timestamp: 2026-03-25T00:01:00Z
  checked: src/backend/prisma/schema.prisma — modelo vpg_employees
  found: |
    employee_first_name   VarChar(50)
    employee_last_name    VarChar(50)
    employee_middle_name  VarChar(50)
    employee_national_id  VarChar(30)
    employee_social_code  VarChar(100)
    employee_email        VarChar(100)
    employee_status       Char(1)   ← CLAVE: solo 1 carácter
  implication: employee_status es Char(1) — cualquier string de más de 1 carácter falla con P2000

- timestamp: 2026-03-25T00:01:00Z
  checked: src/backend/src/schemas/EmployeeSchema.ts
  found: |
    employee_status: z.string().optional().default('active')
    — ningún campo string tenía .max()
    — el default 'active' tiene 6 caracteres
  implication: 'active' (6 chars) excede Char(1) en DB → P2000 garantizado en todo update

- timestamp: 2026-03-25T00:02:00Z
  checked: src/backend/src/service/EmployeeService.ts — createEmployee (líneas 21-29)
  found: |
    createEmployee YA tiene un statusMap: { active:'A', vacation:'V', incomplete_assistance:'I', incapacity_maternity:'M' }
    updateEmployee NO tenía ese mapeo — pasaba data.status directamente a Prisma
  implication: ROOT CAUSE EXACTO — createEmployee funciona; updateEmployee siempre fallaba con P2000 al recibir cualquier status largo

- timestamp: 2026-03-25T00:02:00Z
  checked: src/frontend/src/services/employeeService.ts
  found: |
    createEmployee envía status: 'active' (hardcoded)
    updateEmployee pasa payload.status tal cual desde el frontend
    src/frontend/src/constants/index.ts define EMPLOYEE_STATUS con valores largos ('active', 'vacation', etc.)
  implication: Confirma que el frontend siempre envía strings largos; el service debe mapearlos

- timestamp: 2026-03-25T00:04:00Z
  checked: src/backend/src/routes/EmployeeRoute.ts
  found: |
    PUT /employee/:id usa validateBody(updateEmployeeSchema)
    La validación Zod corre antes del controller
  implication: La Zod schema debe aceptar los valores largos del frontend (max(25)) y dejar que el service traduzca

## Resolution

root_cause: |
  EmployeeService.updateEmployee pasaba data.status directamente a prisma.vpg_employees.update()
  sin traducir los strings largos del frontend ('active', 'vacation', etc.) al Char(1) que espera la DB.
  createEmployee ya tenía este mapeo (statusMap) pero updateEmployee nunca lo implementó.
  Resultado: cualquier update desde el frontend producía P2000 en employee_status.

fix: |
  1. src/backend/src/service/EmployeeService.ts — updateEmployee:
     Agregado statusMap idéntico al de createEmployee. statusChar traduce 'active'→'A',
     'vacation'→'V', 'incomplete_assistance'→'I', 'incapacity_maternity'→'M'.
     Si ya es un char de 1 letra, se pasa sin cambio.

  2. src/backend/src/schemas/EmployeeSchema.ts — createEmployeeSchema:
     Agregado .max(n) a todos los campos string según los VarChar del schema Prisma:
     first_name/last_name/middle_name: max(50), national_id: max(30),
     social_code: max(100), email: max(100), employee_status: max(25).
     Esto convierte errores silenciosos de DB en respuestas 400 descriptivas.

verification:
files_changed:
  - src/backend/src/service/EmployeeService.ts
  - src/backend/src/schemas/EmployeeSchema.ts
