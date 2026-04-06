# Phase 22: Dashboard UI de Marcas — Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Source:** Conversación con usuario — decisiones de diseño confirmadas

<domain>
## Phase Boundary

Esta fase entrega dos cosas:

1. **Fix del flujo de importación en `/attendance`**: cambiar `bulkSave` → `POST /clock-logs/import` para que cada carga de Excel cree una sesión, detecte anomalías automáticamente y use la infraestructura construida en Phases 18-21.

2. **Nueva página `/clock-logs`**: dashboard de monitoreo y corrección. El administrador puede ver el estado de todas las marcas, identificar anomalías, revisar sesiones de importación y ejecutar correcciones directamente desde la UI.

**Lo que NO incluye:** edición de datos maestros de empleados, reportes de planilla, configuración del sistema.

</domain>

<decisions>
## Implementation Decisions

### Arquitectura de páginas
- **DECISIÓN LOCKED**: Crear página nueva `/clock-logs` para el dashboard — NO integrar en `/attendance`
- `/attendance` mantiene su rol actual (upload de Excel + vista de logs) pero se actualiza para usar el nuevo endpoint de importación
- Razón: `/attendance` ya es grande y tiene su propio flujo; mezclar upload con monitoreo de anomalías confunde al usuario y viola SRP

### Fix en /attendance (BLOCKER para que todo funcione)
- Cambiar `ClockLogsService.bulkSave` → `POST /clock-logs/import` en el flujo de importación de attendance
- Esto activa automáticamente: sesiones, detección de anomalías, trazabilidad
- El frontend de attendance NO necesita mostrar anomalías — eso es trabajo de `/clock-logs`

### Nueva página /clock-logs
- Ruta: `/pages/clock-logs/page.tsx`
- `"use client"` — consume hooks propios

### Summary stats (tarjetas superiores)
- Mostrar conteos por status: `pending`, `valid`, `anomaly`, `orphan`, `corrected`
- Grid: 1 col mobile, 2 col tablet, 5 col desktop
- Auto-refresh cuando cambia el rango de fechas (no polling, solo al cambiar filtro)
- Ocultar tarjetas con conteo 0
- NO incluir breakdown por source en esta fase

### Filtros
- Rango de fechas con presets: Hoy, Últimos 7 días, Este mes
- Default: mes actual
- Filtro de status: multi-select (para ver orphan + anomaly juntos)
- Filtro de empleado: autocomplete (muchos empleados, dropdown no escala)
- Placement: toolbar arriba de la tabla
- Summary y tabla comparten el mismo rango de fechas

### Tabla de marcas
- Columnas: Empleado, Timestamp, Tipo (IN/OUT), Status (badge), Source, Acciones
- Server-side pagination: pageSize default 20
- Status badge: rounded-full, sin íconos
  - `valid` → verde
  - `pending` → gris
  - `anomaly` → amarillo/naranja
  - `orphan` → rojo
  - `corrected` → azul

### Modal de detalle / corrección
- Abre al hacer click en "Ver" o "Corregir" en la tabla
- Muestra: todos los campos del log + historial de auditoría del log
- Acciones disponibles (solo para admin):
  - Cambiar status a `corrected` con justificación
  - Descartar (status `corrected` con nota de descarte)
- Tamaño: compacto (no fullscreen)
- Modal de corrección SEPARADO del modal de edición de empleados — son contextos distintos
- Usa AnimatePresence + motion.div (patrón estándar del proyecto)

### Panel de sesiones de importación
- Posición: encima de la tabla de logs
- Mostrar últimas 5 sesiones
- Campos: fecha, source, status, created_count, skipped_count
- Sin vista de detalle separada por ahora

### Empty states
- Mensajes específicos por contexto:
  - Sin orphans: "No hay marcas huérfanas en este período"
  - Sin anomalías: "No se detectaron anomalías"
  - Sin logs: "No hay marcas para el período seleccionado"

### Claude's Discretion
- Estructura interna de componentes (breakdown en subcomponentes)
- Nombres exactos de los hooks y services nuevos
- Animaciones específicas de las tarjetas de stats
- Manejo de loading states (skeleton vs spinner)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Convenciones del proyecto
- `./CLAUDE.md` — Convenciones de código, estructura de capas, naming

### Backend APIs disponibles (Phase 18-21)
- `src/backend/src/routes/ClockLogsRoute.ts` — Todos los endpoints: GET /clock-logs, GET /clock-logs/stats, GET /clock-logs/orphans, GET /clock-logs/anomalies, POST /clock-logs/import, POST /clock-logs/correct, PATCH /clock-logs/:id/status, POST /clock-logs/orphans/:id/resolve
- `src/backend/src/service/ClockLogsService.ts` — Shapes de respuesta de cada método

### Frontend existente a modificar
- `src/frontend/src/app/pages/attendance/page.tsx` — Página a modificar para usar POST /clock-logs/import
- `src/frontend/src/services/clockLogsService.ts` — Service frontend a extender

### Patrones UI de referencia (seguir exactamente)
- `src/frontend/src/components/` — Componentes existentes para reusar
- Cualquier modal existente con AnimatePresence — seguir el patrón de backdropVariants/modalVariants

### Schema de datos
- `src/backend/prisma/schema.prisma` — Modelos vpg_clock_logs, vpg_clock_import_sessions

</canonical_refs>

<specifics>
## Specific Ideas

- El flujo de attendance ya funciona bien para el upload — solo cambiar el endpoint de guardado
- Los endpoints de GET /clock-logs/orphans y GET /clock-logs/anomalies ya tienen paginación y filtro de fecha incorporado
- El endpoint GET /clock-logs/stats ya existe para los conteos de summary
- `PATCH /clock-logs/:id/status` requiere rol admin — el modal de corrección debe estar oculto para usuarios no-admin

</specifics>

<deferred>
## Deferred Ideas

- Breakdown por source en las tarjetas de stats (para v1.4)
- Vista de detalle de sesión de importación (para v1.4)
- Presets de fecha custom (rango libre sin presets)
- Polling/auto-refresh automático de la tabla
- Export de la tabla filtrada a Excel

</deferred>

---

*Phase: 22-dashboard-ui-de-marcas*
*Context gathered: 2026-04-05 via conversación directa con usuario*
