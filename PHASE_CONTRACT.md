# VP-Planilla — Contrato de Ejecución de Agentes

> **OBLIGATORIO.** Todo agente (planner, executor, researcher, verifier, fixer) debe leer este
> archivo antes de planificar o ejecutar cualquier tarea en este proyecto.
> Este contrato tiene precedencia sobre los valores por defecto del framework GSD.

---

## 0. Regla Maestra: Sin Inferencia

**Si una instrucción es ambigua, incompleta o contradictoria → DETENTE y reporta la ambigüedad.**

No inferas la intención del usuario. No "arregles" lo que no se te pidió. No agregues features
no solicitadas. No renombres ni reestructures sin instrucción explícita.

```
AMBIGUO → PREGUNTAR, no asumir
FUERA DE ALCANCE → IGNORAR, no implementar
FALTANTE EN EL PLAN → REPORTAR, no inventar
```

---

## 1. Gates Obligatorios por Fase

Ninguna fase se considera completa hasta que **todos** estos gates pasan:

### Gate 1 — TypeScript sin errores

```powershell
# Backend
cd src/backend && npx tsc --noEmit
# Debe salir con código 0. Si hay errores → BLOQUEAR fase, reportar errores exactos.

# Frontend
cd src/frontend && npx tsc --noEmit
# Mismo criterio. Errores preexistentes en archivos NO modificados por la fase son aceptables
# SOLO si se documentan explícitamente en el SUMMARY.md con: "Error preexistente en X, fuera del alcance".
```

### Gate 2 — Tests no se rompen

```powershell
cd src/backend && npm test -- --passWithNoTests
# Cero tests fallando NUEVOS. Si un test existente falla tras los cambios de la fase → BLOQUEAR.
# Reportar qué test falla y en qué archivo.
```

### Gate 3 — Sin imports rotos

```powershell
# Verificar que no quedan imports a archivos eliminados o movidos
Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" |
  Select-String -Pattern "from '.*ARCHIVO_ELIMINADO'" |
  Select-Object FileName, LineNumber, Line
```

### Gate 4 — Commit atómico por plan

Cada `XX-NN-PLAN.md` ejecutado = un commit git. Formato obligatorio:

```
<tipo>(<fase>-<plan>): <descripción en imperativo>

Ej: feat(46-03): implementar MarkSuggestionService con algoritmo de inferencia IN/OUT
    fix(40-02): corregir 15 tests fallidos en clock-logs page
    chore(48-01): eliminar artefactos generados y MDs obsoletos
```

Los tipos válidos son: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.

---

## 2. Reglas de Modificación de Archivos

### 2.1 Solo modificar lo que está en el plan

Un agente executor **SOLO** puede crear o modificar archivos que estén:
- Listados en `files_modified` del frontmatter del PLAN.md, O
- Listados explícitamente en el `<action>` de cada tarea del PLAN.md

**Prohibido:**
- Refactorizar archivos "de paso" que no estén en el plan
- Cambiar nombres de variables/funciones por preferencia de estilo
- Añadir imports no solicitados
- Reorganizar la estructura de carpetas salvo instrucción explícita

### 2.2 Leer antes de escribir

Antes de modificar cualquier archivo, el agente DEBE leerlo completo.
Nunca sobreescribir desde memoria o supuesto — siempre leer el estado actual.

### 2.3 Archivos críticos — doble verificación

Los siguientes archivos requieren leerlos completos antes de cualquier modificación y
verificar TypeScript inmediatamente después de cada cambio:

| Archivo | Por qué es crítico |
|---|---|
| `src/backend/src/utils/payrollUtils.ts` | Matemática de ley laboral CR — un error afecta todos los cálculos |
| `src/backend/prisma/schema.prisma` | Requiere migración. No editar sin `npx prisma migrate dev` |
| `src/frontend/src/services/http.ts` | Todas las llamadas API pasan por aquí. Un bug rompe todo el frontend |
| `src/backend/src/middleware/AuthMiddleware.ts` | Seguridad JWT. Un error expone el sistema completo |
| `src/backend/src/utils/asyncHandler.ts` | Boundary global de errores Express |

---

## 3. Reglas de Nombrado — No Negociables

| Contexto | Convención | Ejemplo |
|---|---|---|
| Backend Files/Classes | `PascalCase.ts` | `ClockLogsService.ts` |
| Frontend Components | `PascalCase.tsx` | `EmployeeCard.tsx` |
| Hooks | `camelCase.ts` | `useClockAliases.ts` |
| Services (frontend) | `camelCase.ts` | `clockAliasService.ts` |
| DB/Domain fields | `snake_case` | `employee_id`, `clock_log_date` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_HOURS_PER_DAY` |
| Routes | `PascalCase + Route.ts` | `ClockAliasRoute.ts` |
| Controllers | `PascalCase + Controller.ts` | `ClockAliasController.ts` |

**Prohibido:**
- Mezclar convenciones (`clockAlias.Service.ts`, `ClockaliasService.ts`)
- Usar nombres genéricos (`utils2.ts`, `helper.ts`, `misc.ts`)
- Abreviar nombres de forma no establecida en el codebase

---

## 4. Reglas de Arquitectura — No Delegables

### 4.1 Backend

```
Request → Route → Controller → Service → Prisma → DB
```

- **Routes**: Solo registrar endpoint + middleware. Cero lógica de negocio.
- **Controllers**: Solo parsear request, validar con Zod, delegar a service, formatear response.
- **Services**: Toda la lógica de negocio. Todas las queries Prisma.
- **Models**: Solo interfaces TypeScript planas. Sin métodos, sin lógica.
- **Utils**: Solo funciones puras sin side-effects.

**Regla de Prisma**: Siempre `import { prisma } from '../lib/prisma'`. NUNCA `new PrismaClient()`.

**Formato de response**: Siempre:
```typescript
{ success: true, data: ... }   // éxito
{ success: false, error: "mensaje específico" }  // error
```

### 4.2 Frontend

```
Page → Hook → Service → http.ts → Backend API
```

- **Pages**: Solo `"use client"` + consumir hooks. Sin lógica de datos.
- **Hooks**: Retornar `{ data, isLoading, error, ...acciones }`. Acciones wrapped en `useCallback`.
- **Services**: Solo wrappear llamadas HTTP. Sin estado.
- **http.ts**: NUNCA bypasear. Toda llamada al backend pasa por aquí.

**Regla de imports**: Siempre usar alias `@/` en frontend. Prohibido paths relativos `../../`.

**Regla de formularios**: Siempre `react-hook-form` + `zodResolver`. Prohibido `useState` para campos de formulario.

---

## 5. Reglas de Consistencia Entre Fases

### 5.1 Antes de implementar un patrón nuevo

Buscar si ya existe en el codebase:

```powershell
# Verificar si ya existe un servicio similar
Get-ChildItem "src/backend/src/service" | Select-Object Name

# Verificar si ya existe un hook similar
Get-ChildItem "src/frontend/src/hooks" | Select-Object Name
```

Si existe un patrón similar → replicarlo exactamente. No "mejorar" el patrón sin instrucción.

### 5.2 Campos de DB — Prefijo de tabla obligatorio

Todos los campos de Prisma siguen el prefijo de la tabla:

```prisma
model vpg_clock_aliases {
  clock_alias_id        Int    @id @default(autoincrement())
  clock_alias_employee  Int    // NO: employee_id, alias_employee
  clock_alias_value     String // NO: value, alias
}
```

### 5.3 No romper contratos de API existentes

Si una fase modifica un endpoint existente:
- **NUNCA** cambiar el nombre del campo de respuesta sin migrar todos los consumidores
- **NUNCA** cambiar el status HTTP de una respuesta exitosa
- Si hay cambio de contrato → debe estar explícito en el PLAN.md con lista de archivos a actualizar

---

## 6. Lo que los Agentes NO Pueden Hacer

```
❌ Instalar dependencias npm sin instrucción explícita en el PLAN.md
❌ Crear archivos fuera del directorio src/ o .planning/ sin instrucción
❌ Eliminar archivos que no estén en el plan
❌ Modificar schema.prisma sin incluir el paso de migración
❌ Bypasear http.ts con fetch() raw en el frontend
❌ Usar new PrismaClient() en lugar del singleton
❌ Crear componentes UI con estilos inline (style={{...}}) — usar clases Tailwind
❌ Hardcodear URLs de API (siempre usar constantes o env vars)
❌ Commitear archivos de .env con valores reales
❌ Añadir console.log de debug en código de producción
❌ Ignorar errores de TypeScript "por ahora"
❌ Marcar una tarea como completa sin ejecutar sus acceptance_criteria
```

---

## 7. Lo que los Agentes DEBEN Hacer Siempre

```
✅ Leer el archivo antes de modificarlo
✅ Ejecutar npx tsc --noEmit después de cada cambio de TypeScript
✅ Verificar cada acceptance_criteria del PLAN.md con un comando real
✅ Hacer un commit por cada PLAN.md completado
✅ Reportar si algo en el plan contradice el código real encontrado
✅ Usar el singleton de Prisma en todas las queries del backend
✅ Usar @/ imports en todo el frontend
✅ Mantener JSDoc en métodos públicos del backend
✅ Reportar tests que fallan, no silenciarlos
✅ Detenerse y preguntar si el plan está incompleto o es ambiguo
```

---

## 8. Protocolo de Bloqueo

Si durante la ejecución de un plan el agente encuentra alguna de estas situaciones:

| Situación | Acción |
|---|---|
| El archivo a modificar no existe | DETENER. Reportar qué archivo falta y en qué PLAN.md se esperaba. |
| Un test existente falla tras el cambio | DETENER. Revertir si es posible. Reportar el test y el error exacto. |
| TypeScript da error en un archivo del plan | DETENER. Reportar el error completo. No continuar con la siguiente tarea. |
| La acceptance_criteria de una tarea no se puede verificar | DETENER. Reportar qué criterio no es verificable y por qué. |
| El plan pide modificar un archivo crítico sin step de verificación | DETENER. Pedir confirmación antes de proceder. |

**Formato de reporte de bloqueo:**
```
🛑 BLOQUEO EN PLAN XX-NN — TAREA: [nombre de tarea]

CAUSA: [descripción específica del problema]
ARCHIVO AFECTADO: [path completo]
ERROR EXACTO: [mensaje de error completo]

OPCIONES:
1. [acción posible A]
2. [acción posible B]
3. Abortar y esperar instrucción manual
```

---

## 9. Paleta de Diseño UI — No Negociable

Para cualquier componente o página frontend:

| Elemento | Valor obligatorio |
|---|---|
| Fondo oscuro primario | `bg-zinc-950` |
| Fondo oscuro secundario | `bg-zinc-900` |
| Bordes | `border-zinc-800` (dark) / `border-zinc-200` (light) |
| Texto primario | `text-zinc-100` (dark) / `text-zinc-800` (light) |
| Texto secundario | `text-zinc-400` |
| Acento/hover | `bg-zinc-800` (dark) / `bg-zinc-50` (light) |
| Framework CSS | Tailwind CSS v4 únicamente |
| Animaciones | `framer-motion` para colapsables/animados |
| Fuente | Sistema (no importar fuentes externas sin instrucción) |

---

## 10. Verificación Final de Fase

Antes de marcar una fase como `[x]` en ROADMAP.md, el agente debe confirmar:

- [ ] Todos los planes `XX-NN-PLAN.md` tienen estado `[x]` en ROADMAP.md
- [ ] `npx tsc --noEmit` sale con código 0 en backend
- [ ] `npm test` en backend no tiene nuevas fallas
- [ ] Cada plan tiene su commit git correspondiente
- [ ] No hay archivos `TODO`, `FIXME`, `HACK` en el código nuevo de esta fase
- [ ] No hay `console.log` de debugging en el código nuevo
- [ ] Los `acceptance_criteria` de cada tarea fueron verificados con comandos reales
- [ ] El SUMMARY.md de la fase documenta decisiones tomadas durante la ejecución

---

*Este contrato es mantenido por el equipo de VP-Planilla.*
*Versión: 1.0 — 2026-04-22*
*Aplica a todos los agentes del framework GSD en este proyecto.*
