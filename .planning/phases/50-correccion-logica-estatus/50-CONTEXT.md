# Phase 50 Context: Corrección Lógica de Nivel de Confianza y Estatus

## Decisions

- **Lógica de Falsos Positivos (Confianza)**: El estatus final de la base de datos es el que manda. Vamos a remover la variable o condición basada en `confidence` del cálculo de `has_issues`. Única y estrictamente las marcas que tengan `status` problemáticos (ej. anuladas/huérfanas/anomalías) deben encender la alerta en rojo/amarillo en la UI, ignorando el estado de confianza bajo derivado de la carencia de reglas de ventanas.
- **Actualizaciones Optimistas de Estatus**: Al guardar cambios e interactuar con correcciones manuales (el modal), apagaremos o actualizaremos el badge visual de alerta a verde *inmediatamente* (Optimistic Update) en lugar de depender únicamente de una recarga de los datos de fondo (`refresh()`), de este modo el auditor siente fluidez.

## Canonical Refs
- Ninguna adicional.
