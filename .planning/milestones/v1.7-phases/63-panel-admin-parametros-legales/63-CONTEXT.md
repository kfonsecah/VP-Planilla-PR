# Phase 63 Context: Panel de Administración de Parámetros Legales (UI Completa)

**Phase:** 63-panel-admin-parametros-legales
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Payroll.md §11, conversación de diseño

## Objective

Página dedicada `/pages/configuracion/parametros-legales/` donde los administradores pueden ver, editar e historializar todos los parámetros legales. Consolida lo construido en las fases 55, 61 y 62 en una interfaz coherente y segura.

## Scope

### In Scope
- Página `/pages/configuracion/parametros-legales/page.tsx` (solo accesible para rol `admin`)
- Secciones por categoría: Jornada Laboral, Horas Extraordinarias, CCSS, Salarios Mínimos, Flags de Sistema
- Por cada parámetro: valor actual, `validFrom`, `source_decree`, ícono de candado si `isCritical`, badge rojo si es FEATURE_FLAG desactivado
- Formulario "Actualizar valor" en drawer lateral: `value` + `validFrom` + `source_decree`. Params críticos abren `PasswordConfirmModal` antes de guardar
- Modal "Ver historial": timeline de todos los valores históricos del param
- Sección Salarios Mínimos: tabla por categoría con formulario "Actualizar para nuevo decreto" (actualiza todas las categorías con mismo `validFrom` y `source_decree`)
- Enlace en menú de Configuración visible solo para rol `admin`
- Backend: endpoints `GET /legal-params`, `GET /legal-params/:key/history`, `GET /legal-params?date=YYYY-MM-DD`

### Out of Scope
- Snapshot de planillas (Fase 64)
- Ninguna lógica de cálculo nueva

## Endpoints backend necesarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /legal-params | Todos los params vigentes hoy, agrupados por category |
| GET | /legal-params?date=YYYY-MM-DD | Todos los params vigentes en una fecha (para auditoría) |
| GET | /legal-params/:key/history | Historial completo de un parámetro |
| POST | /legal-params | Crear nuevo valor para una key (con validFrom) |
| POST | /legal-params/min-wages/bulk | Actualizar todos los salarios mínimos de un decreto a la vez |

Todos con `AuthMiddleware.verifyToken` + verificación de rol admin.

## Estructura de la página

```
/pages/configuracion/parametros-legales/
├── Header: "Parámetros Legales del Sistema"
│   └── Subtítulo: "Modificaciones quedan registradas y notifican a todos los administradores"
│
├── [Acordeón] Jornada Laboral
│   └── WORKDAY_DIURNA_DAILY, WORKDAY_DIURNA_WEEKLY, etc.
│
├── [Acordeón] Horas Extraordinarias
│   └── OT_FACTOR 🔒, HOLIDAY_MANDATORY_FACTOR 🔒, HOLIDAY_TRIPLE_FACTOR 🔒
│
├── [Acordeón] CCSS
│   └── CCSS_OBRERO_* 🔒, CCSS_PATRONAL_* 🔒
│   └── Nota: "Tasas vigentes desde [decreto X]"
│
├── [Acordeón] Salarios Mínimos MTSS
│   └── Tabla por categoría ocupacional
│   └── Botón "Actualizar para nuevo decreto MTSS" → formulario bulk
│
└── [Acordeón] Configuración del Sistema
    └── MIN_WAGE_CHECK_ENABLED 🔒 → toggle con badge rojo si desactivado
```

## Componentes frontend necesarios

- `LegalParamCard.tsx`: muestra un param con su valor, fecha, decreto, botones de acción
- `LegalParamDrawer.tsx`: formulario de edición en drawer lateral
- `LegalParamHistoryModal.tsx`: timeline de cambios
- `MinWageBulkUpdateModal.tsx`: formulario para actualizar todos los salarios de un decreto
- `FeatureFlagToggle.tsx`: toggle switch con badge de riesgo cuando está desactivado
- Usar `PasswordConfirmModal` de Fase 62 para params críticos

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 63-01 | Endpoints GET /legal-params y GET history | Fase 55 completa |
| 63-02 | Página base + acordeones + LegalParamCard | 63-01 |
| 63-03 | LegalParamDrawer + integración PasswordConfirmModal | Fase 62 + 63-02 |
| 63-04 | LegalParamHistoryModal + MinWageBulkUpdateModal | 63-03 |
| 63-05 | FeatureFlagToggle + badge DESACTIVADO + enlace en menú | 63-04 |

## Dependencies

- **Requiere:** Fase 55 (API), Fase 61 (alertas), Fase 62 (contraseña)
- **No tiene dependientes directos**

## Constraints

- Redirect a `/pages/main` si el usuario no tiene rol `admin`
- Params críticos (`isCritical: true`) muestran ícono de candado y siempre abren `PasswordConfirmModal`
- `payroll_manager` puede ver la página en modo solo lectura (sin botones de edición)
- `npx tsc --noEmit` y `next lint` pasan
- No raw `fetch` — todo por `@/services/http.ts`
- No `useState` para formularios — `react-hook-form` + `zodResolver`
