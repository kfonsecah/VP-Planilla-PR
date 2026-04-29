# Phase 63 Research: Panel Admin Parámetros Legales UI

## 1. Current State Analysis

**Endpoints Actuales:**
- `GET /api/legal-params`: Requiere `key`. Retorna un solo parámetro.
- `GET /api/legal-params/all`: Retorna TODOS los registros históricos e inactivos.
- `GET /api/legal-params/history/:key`: Retorna el historial de un parámetro.
- `GET /api/legal-params/category/:category`: Retorna params activos de una categoría.
- `POST /api/legal-params` & `PATCH /api/legal-params/:key`: Endpoints de escritura ya soportan confirmación de contraseña (Fase 62).

**Necesidades del Frontend (Context 63):**
1. **Vista Principal**: Necesita cargar todos los parámetros vigentes hoy, agrupados por categoría. Llamar a `/category/:category` por cada una es ineficiente. Es mejor crear un nuevo endpoint `GET /api/legal-params/active` que retorne la lista de todos los parámetros activos actuales.
2. **Actualización Masiva de Salarios Mínimos**: No existe un endpoint para actualizar múltiples parámetros de un solo golpe. Necesitamos `POST /api/legal-params/min-wages/bulk`.

## 2. Technical Approach

### Backend
1. **Nuevo Endpoint `GET /api/legal-params/active`**:
   - `LegalParamService.getAllActiveParams(date)`: Similar a `getAllParamsByCategory` pero sin filtrar por categoría. Obtendrá todos los parámetros vigentes a la fecha dada (deduplicados por `key` para traer solo el más reciente `validFrom`).
   - `LegalParamController.getActiveParams`: Llama al servicio y retorna la data.
2. **Endpoint Bulk Update (`POST /api/legal-params/min-wages/bulk`)**:
   - Recibe: `updates: { key: string, value: number }[]`, `validFrom`, `source_decree`, y `confirmationPassword` (opcional si son críticos, aunque los salarios mínimos no suelen ser isCritical=true en el seed, igual debemos rutearlo por la validación si lo fuera).
   - Servicio usa Prisma `$transaction` para iterar y llamar a `upsertParam` internamente, asegurando que si falla la contraseña o algún valor, todo haga rollback.

### Frontend
1. **Estructura de la Página `/pages/configuracion/parametros-legales/page.tsx`**:
   - Usar `Next.js` Page Client Component (`"use client"`).
   - Chequeo de rol `admin` (si `user.role !== 'admin'`, redirigir a `/main`).
2. **Componentes y UI-SPEC**:
   - Respetar `63-UI-SPEC.md`: Colores Zinc-950, modales, alertas.
   - `LegalParamCard`: Muestra nombre, valor, fecha vigencia. Botón de lápiz. Si `isCritical`, muestra ícono de candado.
   - Usar el hook `usePasswordConfirmation` (desarrollado en la Fase 62) para los parámetros que tienen `isCritical: true`.
3. **Manejo de Formularios**:
   - `LegalParamDrawer` usa `react-hook-form` con esquema zod (valor, fecha de vigencia, decreto).
   - Al submitir, si es crítico, se llama a `requireConfirmation("ParamName", async (pwd) => patchParam(..., pwd))`.

## 3. Dependencies & Risks

**Riesgos:**
- Actualización Bulk sin transacciones: Si se actualizan los salarios mínimos y falla a la mitad, los datos quedan inconsistentes. **Mitigación**: Usar `$transaction` en Prisma para el endpoint `/bulk`.
- Control de Accesos: Exponer información legal o configuración crítica a usuarios sin rol de admin. **Mitigación**: Frontend debe redirigir si no es admin, Backend debe proteger todos los endpoints con `adminOnly`.

## 4. Phase Breakdown Strategy
1. **Plan 01**: Backend Endpoints (`GET /active`, `POST /bulk`).
2. **Plan 02**: Frontend Page base, componentes de tarjeta (`LegalParamCard`) y carga de datos.
3. **Plan 03**: Integración de Edición con `LegalParamDrawer` y `usePasswordConfirmation`.
4. **Plan 04**: Historial (`LegalParamHistoryModal`) y actualización masiva (`MinWageBulkUpdateModal`).
