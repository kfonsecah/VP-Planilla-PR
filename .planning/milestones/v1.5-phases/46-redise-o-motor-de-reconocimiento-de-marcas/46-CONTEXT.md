# Phase 46: Rediseño Motor de Reconocimiento de Marcas - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Rediseñar el pipeline completo de importación y auditoría de marcas de reloj:
1. **Parser Excel robusto** — detección dinámica de columnas y formatos de fecha sin configuración manual
2. **Clasificación inteligente por ventanas de tiempo** — inferir IN/OUT por hora del día (configurable) sin depender del tipo explícito del reloj
3. **UI de auditoría por jornada** — vista Empleado → Día → Marcas con transparencia total, horas calculadas y confirmación por día
4. **Corrección asistida** — el sistema sugiere qué falta; el admin confirma o ajusta desde la misma vista

El backend ADD/EDIT/VOID no cambia. La nueva UI lo consume internamente.

</domain>

<decisions>
## Implementation Decisions

### Parser Excel

- **D-01:** Detección automática de columnas por contenido — el sistema analiza patrones de cada celda (formato de fecha, hora, texto de nombre) para inferir el rol de cada columna. El admin no configura nada antes de importar.
- **D-02:** Parseo automático de formatos de fecha+hora — soportar los formatos comunes sin intervención del admin: `DD/MM/YYYY HH:MM`, `YYYY-MM-DD HH:MM:SS`, timestamps numéricos de Excel, fecha y hora en celda combinada.
- **D-03:** Filas no reconocidas → saltar + reporte — las filas que el parser no puede interpretar se omiten, la importación continúa, y al final se presenta un reporte con el contenido de cada fila omitida.
- **D-04:** Vista previa obligatoria antes de confirmar — después del parseo, el admin ve una tabla con los datos detectados (nombre resuelto, fecha, hora, tipo inferido). Solo al confirmar se guardan los registros.

### Clasificación por Ventanas de Tiempo

- **D-05:** Ventanas de tiempo configurables en UI — el admin define rangos horarios desde la pantalla de configuración del sistema. Ejemplo: Entrada mañana 05:00–10:00, Salida almuerzo 10:00–13:00, Entrada almuerzo 13:00–15:00, Salida tarde 15:00–22:00. Permite adaptarse a distintos turnos.
- **D-06:** Marcas en zona ambigua → estado 'dudosa' + escalada — cuando un timestamp cae fuera de todas las ventanas o en zona de solapamiento, se clasifica con confianza baja y se destaca en la UI de auditoría para que el admin decida. No bloquea el resto de la importación.
- **D-07:** Nivel de confianza visible en UI con color/ícono — cada marca clasificada muestra un indicador visual: verde = alta confianza (dentro de ventana clara), amarillo = probable (cercana al límite), rojo = dudosa (ambigua o fuera de ventanas).

### UI de Auditoría por Jornada

- **D-08:** Organización jerárquica: Empleado → Día → Marcas — la pantalla lista empleados, cada uno expandible por día, y dentro del día se ven las marcas con su tipo inferido, confianza y estado.
- **D-09:** Filtros disponibles: Rango de fechas + "Solo con problemas" — el admin puede filtrar por período (quincena, semana, rango personalizado) y activar un toggle para ver únicamente empleados/días con marcas dudosas, huérfanas o faltantes.
- **D-10:** Confirmación por día con clic explícito — cada día en la vista del empleado tiene un botón o checkbox "Confirmar día". Al confirmar, el estado cambia visualmente a 'Revisado'. Permite al admin marcar lo que ya revisó sin corregir.
- **D-11:** Horas calculadas siempre visibles — en la vista colapsada del día se muestra el total de horas calculadas con las marcas actuales. El admin detecta inconsistencias numéricas (ej: 15h un día) sin necesidad de expandir.

### Flujo de Corrección Asistida

- **D-12:** Sugerencia de tipo y hora cuando falta una marca — cuando el sistema detecta que un día está incompleto (ej: hay entrada pero no salida), muestra una sugerencia: "Parece que falta la salida. Historial sugiere alrededor de las 17:00." El admin acepta o ajusta el valor sugerido.
- **D-13:** Coexistencia con ADD/EDIT/VOID — la nueva UI de auditoría no reemplaza el backend; llama los mismos endpoints `POST /clock-logs/adjust` internamente. El admin tiene una experiencia más fluida sin rediseño del backend.
- **D-14:** Corrección de tipo por clic inline — en el día expandido, el admin hace clic sobre una marca para cambiar su tipo (IN↔OUT) vía dropdown. Se guarda como ajuste EDIT con justificación requerida.

### Claude's Discretion

- Algoritmo exacto para inferencia de hora sugerida cuando falta una marca (promedio histórico, última ocurrencia, etc.)
- Diseño visual exacto del indicador de confianza (badge, dot, borde de color, etc.)
- Paginación o scroll infinito en la lista de empleados de auditoría
- Estrategia de persistencia del estado "Confirmado" por día (nueva tabla vs. campo en adjustments)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend existente de marcas
- `src/backend/src/service/ClockLogAdjustmentService.ts` — ADD/EDIT/VOID no cambia; la nueva UI lo consume
- `src/backend/src/service/ClockLogEffectiveService.ts` — pairing logic; base para la vista de auditoría
- `src/backend/src/service/ClockLogsImportService.ts` — pipeline de importación actual a reemplazar
- `src/backend/src/utils/clockLogNormalization.ts` — normalización actual de tipos IN/OUT

### Modelo de datos
- `src/backend/prisma/schema.prisma` — tablas `vpg_clock_logs`, `vpg_clock_log_adjustments`, `vpg_clock_aliases`

### Frontend existente de marcas
- `src/frontend/src/hooks/useEffectiveMarks.ts` — hook de marcas efectivas, base para nueva UI
- `src/frontend/src/components/AddClockLogModal.tsx` — patrón de corrección actual (referencia, no reusar)

### Requisitos del milestone
- `.planning/milestones/v1.5-REQUIREMENTS.md` — MARCAS-01 a MARCAS-06 definen el contrato de datos efectivos

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ClockLogAdjustmentService` (ADD/EDIT/VOID): se reutiliza sin cambios — la nueva UI lo llama internamente
- `ClockLogEffectiveService.pairLogs()`: lógica de emparejamiento IN/OUT usable como base para la vista de jornada
- `useEffectiveMarks.ts`: hook de paginación y filtros existente, extender para la nueva vista de auditoría
- `ClockAliasService.resolveEmployeeByAlias()`: resolución de nombres para el parser, ya implementada

### Established Patterns
- Ajustes no destructivos (EDIT/VOID dejan audit trail en `vpg_clock_log_adjustments`) — mantener
- Payroll lock: no ajustes en períodos APROBADA/PAGADA — respetar sin cambios
- Animaciones con `framer-motion` en modals y colapsables — aplicar en la nueva UI
- Import sessions (`vpg_clock_import_sessions`): patrón de sesión de importación existente, extender para incluir resultado del parser

### Integration Points
- Nueva pantalla de auditoría → reemplaza o extiende `src/frontend/src/app/pages/clock-logs/page.tsx`
- Configuración de ventanas de tiempo → nueva entidad en Prisma + pantalla de configuración (o sección en configuración existente)
- Parser Excel → reemplaza lógica en `ClockLogsImportService.ts`; mantiene misma interfaz de sesión de importación

</code_context>

<specifics>
## Specific Ideas

- "El admin necesita transparencia total — quiere poder revisar todos los empleados, no solo los problemáticos, pero los problemas deben saltar a la vista"
- El flujo actual del admin es 100% en Excel (exportar → corregir a ojo → calcular horas → planilla). El objetivo es reemplazar ese flujo con el sistema, no complementarlo.
- Las marcas nunca traen tipo (IN/OUT) del reloj — la inferencia siempre es por posición/hora, nunca por dato explícito.
- Hay variabilidad real: algunos días 2 marcas (sin almuerzo registrado), otros 4 marcas. El sistema debe aceptar ambos sin errores.

</specifics>

<deferred>
## Deferred Ideas

- Aprendizaje de patrones por empleado (historial de horarios) — podría mejorar sugerencias en el futuro, pero requiere suficiente historial y su propio análisis.
- Soporte para marcas de dispositivo en tiempo real (`source: device`) — está en el enum pero no implementado. Fuera de alcance.
- Bulk confirmation masiva por rango de fechas — el admin quiere granularidad por día, la confirmación masiva se puede considerar en una fase posterior.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 46-redise-o-motor-de-reconocimiento-de-marcas*
*Context gathered: 2026-04-20*
