---
phase: 23
slug: debug-y-correcion-marcas
milestone: v1.3
status: pending
created: 2026-04-06
---

# Phase 23 — Debug y Corrección de Funcionalidad de Marcas

## Contexto del Usuario

El usuario reportó el 2026-04-06 los siguientes bugs críticos luego de probar el sistema con el archivo `attendance_sample_valid.xlsx`:

### Bug 1 — Marcas no persisten al recargar
- Al cargar el Excel, las marcas del **6/4/26** aparecen correctamente en la UI
- Al **recargar la página** (o regresar a la vista), esas marcas **no se traen** — la tabla aparece vacía o incompleta
- Las marcas están supuestamente guardadas en DB (ya que la importación respondió exitosamente)
- Usuario que realizó la prueba: **ken**

### Bug 2 — Trazabilidad (sesión de importación) no aparece
- La sesión de importación generada por esa carga no aparece en la UI o no es encontrada
- El historial de sesiones de importación estaría vacío o no muestra esa sesión

### Instrucciones del Usuario
- Se permite consultar DB directamente (via Prisma o SQL)
- Se permite hacer TODO lo necesario para debuguear y arreglar (tests, curl, DB queries, etc.)

## Hipótesis Iniciales (para el plan)

1. **Filtro de fechas en el query de marcas** — El endpoint podría filtrar por fecha de forma incorrecta (ej. UTC vs hora local, formato de fecha mal parseado, rango de fechas exclusivo en lugar de inclusivo)
2. **sessionStorage cache** — Los hooks de datos tienen cache TTL 5min. La primera carga sirve datos frescos, pero al recargar desde cache devuelve una key distinta o sin datos
3. **import_session_id no se guarda** — El servicio de importación podría no persistir la sesión en `vpg_clock_import_sessions`
4. **Relación FK** — Los clock_logs importados podrían no tener el `import_session_id` seteado correctamente
5. **Formato de fecha en query param** — El frontend podría enviar la fecha en un formato que el backend no parsea igual al guardar

## Goal de la Fase

Identificar la causa raíz de cada bug, corregirla, y verificar con datos reales (usuario ken, fecha 6/4/26) que:
1. Las marcas importadas persisten y se traen correctamente al recargar
2. La sesión de importación aparece en el historial de trazabilidad

## Scope

- Backend: ClockLogsService, ImportSessionService, ClockLogsController
- Frontend: useAttendance/useClockLogs hook, attendanceService / clockLogService, sessionStorage cache interaction
- DB: consultas directas para verificar estado real de los datos
