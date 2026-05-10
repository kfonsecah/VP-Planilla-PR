# Phase 61 - Plan 05 Summary

## Wave 4 — UI Surfaces: DESACTIVADO Badge + Wizard Legal Alert Banner

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/frontend/src/app/pages/configuracion/empresa/page.tsx` | Badge `DESACTIVADO — Riesgo legal` inline junto al título de la card "Validación de Salario Mínimo" |
| `src/frontend/src/components/PayrollWizard.tsx` | Banner amber informativo en step 1 cuando existen alertas legales sin revisar |

### Detalles de implementación

**Task 1 — Badge DESACTIVADO (empresa/page.tsx):**
- El hook `useLegalParamConfig` expone `legalForm.watch("minWageCheckEnabled")` que retorna `boolean`.
- El badge se renderiza cuando `!legalForm.watch("minWageCheckEnabled")` (checkbox desactivado = valor 0 en DB).
- Clases exactas del UI-SPEC: `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold uppercase px-2 py-1 rounded-full ml-2` + `role="status"`.
- Sin nuevas API calls — usa datos ya cargados por `useLegalParamConfig`.

**Task 2 — Banner wizard (PayrollWizard.tsx):**
- Importa `useLegalParamAlerts` (hook creado en Wave 3) y `ExclamationTriangleIcon`, `XMarkIcon` de heroicons.
- Estado local `wizardAlertDismissed` (boolean) — reset en cada montaje del componente, sin persistencia.
- Banner se renderiza cuando `legalParamAlerts.length > 0 && !wizardAlertDismissed`.
- Injección ANTES del contenido de selección de período (primera sección visible del step 1).
- Dismiss local: `onClick={() => setWizardAlertDismissed(true)}` — no hace API call.

### Verificación

- `npx tsc --noEmit` → exit 0 (sin errores TypeScript)
- Commit: `e852576` — 2 archivos, 34 inserciones

### Must-haves verificados

- [x] Badge `DESACTIVADO — Riesgo legal` en empresa/page.tsx con `role="status"` y clases rojas exactas
- [x] Badge renderizado condicionalmente — ausente cuando `minWageCheckEnabled` es `true`
- [x] Wizard step 1 muestra banner amber cuando `LEGAL_PARAM_CHANGE` alerts existen
- [x] Copy exacto: `"Los parámetros legales cambiaron desde que esta planilla fue creada..."`
- [x] Banner dismissible con × (session-only, sin API call)
- [x] Usa `ExclamationTriangleIcon` + esquema amber (consistente con main/page.tsx)
- [x] Sin nuevas API calls — reutiliza `useLegalParamAlerts` del Wave 3
- [x] TypeScript limpio
