# Tareas Pendientes (TODO)

## 1. Auditoría por Jornada - Edición de Marcas
- Permitir la edición directa de marcas ya existentes dentro del flujo de la auditoría por jornada.
- Validar que al guardar los cambios de una marca, esta se actualice tanto en la interfaz como en la base de datos (Backend/Frontend).

## 2. Lógica de Confianza (Baja Confianza y Alertas Amarillas)
- Revisar por qué marcas que parecen normales (pares correctos) se están marcando con "baja confianza" en la vista de auditoría.
- Asegurar que al corregir una marca o al validar una normal, el estado del empleado se recalcule en tiempo real, de forma que deje de aparecer en amarillo (con problemas) si ya no hay inconsistencias.

## 3. Persistencia de Estado en la Interfaz (Caché de Vista)
- Implementar un mecanismo de caché (ej. estado en URL, `localStorage` o store global) para la vista de validación/auditoría.
- El objetivo es evitar que se reinicie el estado cada vez que se navega a otra pantalla.
- Se debe recordar: 
  - La pestaña activa (ej. tab de auditoría).
  - El estado expandido/colapsado de las tarjetas de los empleados.
