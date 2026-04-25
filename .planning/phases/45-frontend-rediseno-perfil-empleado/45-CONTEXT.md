# Phase 45 Context: Frontend — Rediseño del Perfil de Empleado

This document captures required implementation decisions. Downstream agents (researcher, planner) must follow these constraints.

## Goal
Restructuración completa de la vista "Ver Perfil" de Empleado (/pages/employee/list) para presentar de forma consolidada estado, labor, salario, marcas, eventos y documentos.

## Decisions

### 1. View Layout: Tabs
- **Pattern:** Use the existing `EmployeeTabs` pattern.
- **Why:** Keeps context isolated by category. Easy to navigate without overwhelming the user with a single massive page.

### 2. Edit Flow: Modal
- **Pattern:** Use overlay modals (matching the existing `EditEmployeeModal`).
- **Why:** Maintains UI consistency across the app. Keeps the user in the context of the profile while editing.

### 3. Data Density: Summary Default
- **Pattern:** Show high-level summaries by default (e.g., top 5 rows for recent bonuses, recent clock logs).
- **Why:** Faster load times and cleaner UI. Users must click a "view all" link or button to drill down into full tables if they need deep data.

## Canonical Refs
- `.planning/ROADMAP.md` (Phase 45 definition)
- `src/backend/prisma/schema.prisma` (Employee relations)
