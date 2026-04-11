# Auditoría de Complejidad Cognitiva - Phase 27

## Resumen Ejecutivo
Se ha realizado una auditoría utilizando `eslint-plugin-sonarjs` con un umbral de complejidad cognitiva de **15**. Los resultados confirman la existencia de varios "monolitos de código" que dificultan el mantenimiento y la escalabilidad del sistema.

## Top 5 Monolitos Frontend
| Archivo | Score Máximo | Componente/Función Crítica |
|---------|--------------|---------------------------|
| `src/app/pages/attendance/page.tsx` | 33 | Gestión de estados de asistencia y filtros |
| `src/app/pages/payroll/calculate/page.tsx` | 24 | Lógica de cálculo y visualización de planilla |
| `src/components/PayrollResults.tsx` | 53 | Renderizado complejo de resultados de nómina |
| `src/services/http.ts` | 30 | Orquestación de refresco de tokens y reintentos |
| `src/hooks/useLaborEvents.ts` | 24 | Gestión de eventos laborales complejos |

*Nota: `ClockLogsDashboardPage` (en `src/app/pages/clock-logs/page.tsx`) mostró un score bajo de duplicación pero se mantiene como candidato por su importancia arquitectónica y crecimiento esperado.*

## Top 5 Monolitos Backend
| Archivo | Score Máximo | Función Crítica |
|---------|--------------|----------------|
| `src/service/NomineeService.ts` | 31 | Generación de nómina (múltiples responsabilidades) |
| `src/service/PaymentReceiptService.ts` | 31 | Generación de comprobantes de pago |
| `src/service/ReportsService.ts` | 29 | Generación de reportes PDF/Excel |
| `src/controller/ClockLogsController.ts` | 22 | CRUD y lógica de negocio de marcas de reloj |
| `src/service/ClockLogAnalysisService.ts` | 24 | Detección de anomalías y huérfanos |

## Candidatos Seleccionados para Refactor (Phase 27)

1.  **ClockLogsController (Backend):** Aunque tiene un score de 22 (menor que NomineeService), su descomposición es prioritaria para separar la lógica de CRUD de la lógica de resolución de anomalías.
2.  **Attendance/ClockLogs Pages (Frontend):** Se requiere extraer componentes de tabla y filtros que actualmente están acoplados en las páginas principales.
3.  **NomineeService (Backend):** Es el archivo con mayor complejidad funcional; requiere extracción de calculadoras específicas.

## Próximos Pasos
- Ejecutar Plan 27-02: Descomposición de `ClockLogsController`.
- Ejecutar Plan 27-03: Refactor de componentes frontend de marcas.
