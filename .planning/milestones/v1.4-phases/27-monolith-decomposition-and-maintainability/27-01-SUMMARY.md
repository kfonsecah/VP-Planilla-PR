# Phase 27 Plan 01: Auditoría de complejidad y selección de candidatos Summary

## Executive Summary
Se ha configurado exitosamente el entorno de análisis de complejidad utilizando **ESLint 9** y **SonarJS** en los directorios de frontend y backend. La auditoría empírica realizada ha identificado los principales "monolitos" del sistema basándose en la métrica de **Complejidad Cognitiva** (umbral de 15), confirmando que `ClockLogsController` (backend) y las páginas de gestión de marcas (frontend) son candidatos críticos para la descomposición.

## Key Decisions
- **Métrica de Referencia:** Se adoptó la Complejidad Cognitiva de SonarJS con un umbral de 15 como estándar para el proyecto.
- **Configuración Flat (ESLint 9):** Se implementó `eslint.config.mjs` en ambos entornos para alinearse con los estándares modernos de ESLint.
- **Priorización de Refactor:** Se seleccionó `ClockLogsController` como el primer candidato para descomposición debido a su importancia en el flujo de marcas de reloj, a pesar de no ser el archivo con el score más alto (31 vs 22), permitiendo un enfoque iterativo en la lógica de negocio.

## Tech Stack
- ESLint 9.x
- eslint-plugin-sonarjs 1.0.x
- TypeScript ESLint Parser/Plugin 8.x

## Key Files
- `src/frontend/eslint.config.mjs` (Actualizado con SonarJS)
- `src/backend/eslint.config.mjs` (Creado desde cero para backend)
- `.planning/phases/27-monolith-decomposition-and-maintainability/27-AUDIT-REPORT.md` (Reporte de auditoría)

## Deviations from Plan
- **Pre-existing Errors:** La ejecución de `npm run lint` reportó miles de errores pre-existentes (especialmente en el frontend debido a archivos generados en `.next/` y reglas estrictas de `@typescript-eslint`). Se utilizó el reporte filtrado para la auditoría, ignorando errores no relacionados con la complejidad cognitiva para no bloquear el plan.
- **Backend ESLint 9 Upgrade:** Se realizó una instalación completa de dependencias de ESLint 9 en el backend ya que no contaba con una configuración moderna funcional, asegurando consistencia con el frontend.

## Self-Check: PASSED
- [x] Reporte de auditoría generado con métricas reales.
- [x] Commits realizados para cada tarea.
- [x] Configuración de ESLint funcional en ambos entornos.
