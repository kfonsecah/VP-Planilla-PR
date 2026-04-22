# Agentes de IA - VP-Planilla (GSD Framework)

Este documento centraliza la definición y responsabilidades de los agentes de IA configurados para el proyecto **VP-Planilla**. Estos agentes operan bajo la metodología **GSD (Get Shit Done)** para garantizar la integridad arquitectónica y el cumplimiento de los requisitos legales de la planilla costarricense.

> **CONTRATO DE EJECUCIÓN:** Todo agente DEBE leer `PHASE_CONTRACT.md` antes de planificar o ejecutar.
> Ese archivo define los gates obligatorios, prohibiciones absolutas y el protocolo de bloqueo.


## Agentes Estratégicos (Planificación y Diseño)

| Agente | Responsabilidad Principal | Cuándo Invocar |
| :--- | :--- | :--- |
| **gsd-roadmapper** | Crea y mantiene el `ROADMAP.md` y `MILESTONES.md`. | Al inicio de un nuevo hito o cambio mayor de alcance. |
| **gsd-planner** | Genera planes de fase detallados con desglose de tareas y análisis de dependencias. | Antes de iniciar la ejecución de cualquier fase. |
| **gsd-project-researcher** | Investiga el ecosistema del dominio (leyes laborales CR, APIs, etc.). | Ante dudas sobre regulaciones de la CCSS o cálculos de ley. |
| **gsd-phase-researcher** | Investiga la implementación técnica de una fase específica. | Para definir el "cómo" técnico antes de planificar tareas. |
| **gsd-ui-researcher** | Produce contratos de diseño `UI-SPEC.md`. | Al iniciar fases de frontend o cambios en la interfaz. |

## Agentes de Ejecución y Desarrollo

| Agente | Responsabilidad Principal | Cuándo Invocar |
| :--- | :--- | :--- |
| **gsd-executor** | Ejecuta planes de fase con commits atómicos y gestión de estado. | Para la implementación sistemática de tareas planificadas. |
| **gsd-code-fixer** | Aplica correcciones inteligentes basadas en hallazgos de revisiones. | Para resolver bugs detectados o deudas técnicas identificadas. |
| **gsd-debugger** | Investiga bugs usando el método científico y gestiona sesiones de depuración. | Ante errores complejos o comportamientos inesperados en producción/dev. |
| **gsd-doc-writer** | Escribe y actualiza la documentación técnica y de usuario. | Al completar features o cambiar flujos de trabajo. |

## Agentes de Calidad y Verificación (Auditoría)

| Agente | Responsabilidad Principal | Cuándo Invocar |
| :--- | :--- | :--- |
| **gsd-verifier** | Verifica el logro de objetivos de fase mediante análisis de código. | Al finalizar una fase para confirmar que se entregó lo prometido. |
| **gsd-code-reviewer** | Revisa archivos fuente en busca de bugs, seguridad y calidad. | Antes de integrar cambios importantes o tras una fase de ejecución. |
| **gsd-nyquist-auditor** | Genera pruebas y verifica la cobertura de requisitos. | Para asegurar que no hay brechas de validación en la lógica de cálculo. |
| **gsd-ui-auditor** | Realiza auditorías visuales de 6 pilares en código frontend. | Para garantizar consistencia visual y accesibilidad (zinc-950, responsive). |
| **gsd-integration-checker** | Verifica flujos E2E y la conexión entre fases. | Para asegurar que el flujo (Marcas -> Planilla -> Reportes) sea consistente. |
| **gsd-security-auditor** | Verifica mitigaciones de amenazas en el código implementado. | En cada hito para asegurar la protección de datos sensibles de empleados. |

## Agentes de Inteligencia y Contexto

| Agente | Responsabilidad Principal | Cuándo Invocar |
| :--- | :--- | :--- |
| **gsd-codebase-mapper** | Explora y documenta la arquitectura del código (Tech, Arch, Quality). | Para entender dependencias o mapear nuevas áreas del sistema. |
| **gsd-intel-updater** | Actualiza archivos de inteligencia en `.planning/intel/`. | Para mantener el contexto fresco tras cambios estructurales. |
| **gsd-assumptions-analyzer** | Analiza supuestos y busca evidencia en el codebase. | Durante la fase de investigación para validar teorías. |
| **gsd-doc-verifier** | Verifica que las afirmaciones en los docs coincidan con el código real. | Periódicamente para evitar que la documentación se desactualice. |

---

## Directrices de Interacción

1. **Jerarquía:** Los agentes de planificación (`roadmapper`, `planner`) siempre preceden a los de ejecución (`executor`).
2. **Validación Obligatoria:** Ninguna fase se considera terminada sin el reporte de `gsd-verifier`.
3. **Seguridad:** El `gsd-security-auditor` tiene veto sobre implementaciones que expongan datos sensibles.
4. **Consistencia UI:** Se debe consultar al `gsd-ui-auditor` para mantener la paleta `zinc-950` y el diseño basado en `Tailwind 4`.

*Este archivo es mantenido automáticamente por el sistema GSD de VP-Planilla.*
