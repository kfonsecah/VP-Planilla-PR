# Phase 34: Frontend — Rediseño Clock Logs (Vista Agrupada) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 34-frontend-rediseno-clock-logs
**Areas discussed:** Atajos de Navegación, Jerarquía de Organización, Mapeo de Indicadores, Flujo Problemas-Primero

---

## Atajos de Navegación

| Option | Description | Selected |
|--------|-------------|----------|
| Reemplazar por Quincenas | Reemplazamos Hoy/7d por 1ra/2da Quincena + Mes actual. | ✓ |
| Complementar actuales | Mantener presets actuales y agregar los quincenales. | |

**User's choice:** Reemplazar por Quincenas (RECOMENDADO)

---

## Jerarquía de Organización

| Option | Description | Selected |
|--------|-------------|----------|
| Agrupar por Sucursal | Agrupar por Sucursal > Empleado > Día. | ✓ |
| Lista Plana | Lista plana de empleados con filtro de sucursal arriba. | |

**User's choice:** Agrupar por Sucursal (RECOMENDADO)

---

## Paginación

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll Infinito | Más fluido para revisar marcas rápidamente (useInfiniteQuery). | ✓ |
| Paginación Clásica | 10-20 empleados por página. | |

**User's choice:** Scroll Infinito (RECOMENDADO)

---

## Alertas Card Empleado

| Option | Description | Selected |
|--------|-------------|----------|
| Badge con conteo | Badge con conteo de días con problemas (ej: "3 anomalías"). | ✓ |
| Color de borde/fondo card | Borde de color (Rojo/Amarillo) en todo el card del empleado. | |

**User's choice:** Badge con conteo (RECOMENDADO)

---

## Orden de Lista

| Option | Description | Selected |
|--------|-------------|----------|
| Anomalías al principio | Primero los empleados que requieren atención. | ✓ |
| Orden Alfabético | Orden alfabético normal + filtro manual. | |

**User's choice:** Anomalías al principio (RECOMENDADO)

---

## Acción Sugerida

| Option | Description | Selected |
|--------|-------------|----------|
| Mensaje con acción | Texto claro: "Falta marca de salida. Haga clic aquí para agregarla." | ✓ |
| Solo icono/color | El jefe decide qué hacer al expandir el día. | |

**User's choice:** Mensaje con acción (RECOMENDADO)

---

## Resumen Card Empleado

| Option | Description | Selected |
|--------|-------------|----------|
| Horas + Problemas | Total Horas Período + Conteo de Anomalías + Días laborados. | ✓ |
| Solo Alertas y Nombre | Muy minimalista. | |

**User's choice:** Horas + Problemas (RECOMENDADO)

---

## Trazabilidad Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Icono de fuente | Icono de "Edición/Mano" junto al timestamp si fue manual. | ✓ |
| Ocultar fuente | Solo mostrar el tiempo efectivo. | |

**User's choice:** Icono de fuente (RECOMENDADO)

---

## Claude's Discretion
- Design of the color palette for status indicators (zinc-950 compatibility).
- Visual design and copy for the "empty state" guide.

## Deferred Ideas
- Specific modal UI components for Phase 35.
