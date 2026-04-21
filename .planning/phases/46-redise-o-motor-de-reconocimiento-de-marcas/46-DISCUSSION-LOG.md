# Phase 46: Rediseño Motor de Reconocimiento de Marcas - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 46-redise-o-motor-de-reconocimiento-de-marcas
**Areas discussed:** Parser Excel, Clasificación por ventanas de tiempo, UI de auditoría por jornada, Flujo de corrección asistida

---

## Parser Excel

| Option | Description | Selected |
|--------|-------------|----------|
| Detección automática | Sistema analiza contenido de cada columna para inferir su rol | ✓ |
| Mapeo manual por importación | Admin asigna columnas antes de importar | |
| Plantillas de reloj configurables | Admin define formato por reloj, se reusan | |

**User's choice:** Detección automática

---

| Option | Description | Selected |
|--------|-------------|----------|
| Parseo automático de fecha+hora | Detecta formatos comunes sin intervención | ✓ |
| El admin define el formato | Dropdown de formatos antes de procesar | |

**User's choice:** Parseo automático

---

| Option | Description | Selected |
|--------|-------------|----------|
| Saltar y reportar | Fila omitida, importación continúa, reporte al final | ✓ |
| Detener la importación | Cualquier error cancela todo | |
| Importar con estado 'sin reconocer' | Entra al sistema para revisión manual | |

**User's choice:** Saltar y reportar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Vista previa siempre | Admin ve tabla con datos detectados antes de confirmar | ✓ |
| Solo si hay filas con problemas | Vista previa solo cuando hay errores | |
| No, importar directo | Revisar resultado en auditoría | |

**User's choice:** Vista previa siempre

---

## Clasificación por Ventanas de Tiempo

| Option | Description | Selected |
|--------|-------------|----------|
| Configurables en UI | Admin define rangos horarios desde configuración | ✓ |
| Fijas, editables en código | Rangos en configuración del sistema | |
| Sin ventanas — alternancia mejorada | Mantener inferencia por posición mejorada | |

**User's choice:** Configurables en UI

---

| Option | Description | Selected |
|--------|-------------|----------|
| Marcar como 'dudosa' y escalar | Clasificación baja, destacada en UI para que admin decida | ✓ |
| Aplicar la ventana más cercana | Sistema elige sin intervención humana | |
| Usar contexto del día | Analiza otras marcas del día para inferir secuencia | |

**User's choice:** Marcar como 'dudosa' y escalar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, visible con color/ícono | Verde/amarillo/rojo según confianza | ✓ |
| Solo mostrar las dudosas | Sin indicador en las de alta confianza | |

**User's choice:** Visible siempre con color/ícono

---

## UI de Auditoría por Jornada

| Option | Description | Selected |
|--------|-------------|----------|
| Empleado → Día → Marcas | Lista de empleados expandibles por día | ✓ |
| Día → Empleado → Marcas | Vista por fecha primero | |
| Vista de cuadrícula | Tabla filas=empleados, columnas=días | |

**User's choice:** Empleado → Día → Marcas

---

**Filtros seleccionados (multiSelect):**
- ✓ Rango de fechas
- ✓ Solo con problemas
- ☐ Por sucursal
- ☐ Por estado de confianza

---

| Option | Description | Selected |
|--------|-------------|----------|
| Clic en 'Confirmar día' | Botón/checkbox por día, estado cambia a 'Confirmado' | ✓ |
| Confirmación masiva por rango | Confirmar todos los días sin problemas a la vez | |
| No hay confirmación explícita | Días sin problemas = correctos automáticamente | |

**User's choice:** Clic en 'Confirmar día' por empleado

---

| Option | Description | Selected |
|--------|-------------|----------|
| Horas siempre visibles | Total de horas en vista colapsada del día | ✓ |
| Solo al expandir | Horas visibles solo en detalle | |

**User's choice:** Sí, siempre visible

---

## Flujo de Corrección Asistida

| Option | Description | Selected |
|--------|-------------|----------|
| Sugerencia de tipo y hora | Sistema sugiere qué falta y la hora aproximada | ✓ |
| Solo el tipo faltante | Sistema indica qué tipo falta, admin ingresa hora | |
| Solo alertar | Sistema alerta, admin decide qué hacer | |

**User's choice:** Sí, con sugerencia de tipo y hora

---

| Option | Description | Selected |
|--------|-------------|----------|
| Coexiste — UI nueva, misma lógica | Nueva pantalla llama ADD/EDIT/VOID internamente | ✓ |
| Reemplaza completamente | Nuevo flujo, deprecar ADD/EDIT/VOID | |

**User's choice:** Coexiste — UI nueva encima, misma lógica

---

| Option | Description | Selected |
|--------|-------------|----------|
| Clic en marca → cambiar tipo | Dropdown IN/OUT inline, se guarda como EDIT | ✓ |
| Botones de acción junto a cada marca | Botones inline sin modal | |

**User's choice:** Clic en la marca → cambiar tipo

---

## Claude's Discretion

- Algoritmo de inferencia de hora sugerida para marcas faltantes
- Diseño visual exacto del indicador de confianza
- Paginación vs. scroll infinito en lista de empleados
- Estrategia de persistencia del estado "Confirmado" por día

## Deferred Ideas

- Aprendizaje de patrones por empleado — futura fase
- Soporte para marcas de dispositivo en tiempo real — fuera de alcance
- Confirmación masiva por rango — posible fase posterior
