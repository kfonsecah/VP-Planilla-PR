# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-wizard.spec.ts >> Fase 54: Rediseño del Flujo de Planilla >> flujo completo del wizard hasta el ajuste de empleado
- Location: e2e\payroll-wizard.spec.ts:14:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="date"]').first()
    - locator resolved to <input readonly value="" type="date" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"/>
    - fill("2026-04-01")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not editable
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not editable
    - retrying fill action
      - waiting 100ms
    - waiting for element to be visible, enabled and editable
    - element is not editable
  - retrying fill action
    - waiting 500ms
    - waiting for element to be visible, enabled and editable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "Verde Gestión Logo" [ref=e6]
      - generic [ref=e7]:
        - heading "VERDE GESTIÓN" [level=1] [ref=e8]
        - paragraph [ref=e9]: Sistema de Planilla
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "Iniciar sesión" [level=2] [ref=e12]
        - paragraph [ref=e13]: Ingresá tus credenciales para acceder al sistema
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Usuario
          - generic [ref=e17]:
            - generic:
              - img
            - textbox "Username" [ref=e18]:
              - /placeholder: Tu nombre de usuario
        - generic [ref=e19]:
          - generic [ref=e20]: Contraseña
          - generic [ref=e21]:
            - generic:
              - img
            - textbox "Password" [ref=e22]:
              - /placeholder: Tu contraseña
            - button "Mostrar contraseña" [ref=e23]:
              - img [ref=e24]
        - button "Ingresar" [ref=e27] [cursor=pointer]:
          - text: Ingresar
          - img [ref=e28]
        - button "¿Olvidaste tu contraseña?" [ref=e30]
    - paragraph [ref=e31]: © 2026 Verde Gestión — Control de planilla
  - region "Notifications alt+T"
  - generic [ref=e36] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e37]:
      - img [ref=e38]
    - generic [ref=e41]:
      - button "Open issues overlay" [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]: "0"
          - generic [ref=e45]: "1"
        - generic [ref=e46]: Issue
      - button "Collapse issues badge" [ref=e47]:
        - img [ref=e48]
  - alert [ref=e50]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Fase 54: Rediseño del Flujo de Planilla', () => {
  4  |   
  5  |   test('debe redirigir de /calculate a /wizard', async ({ page }) => {
  6  |     await page.goto('/pages/payroll/calculate');
  7  |     
  8  |     // Debería terminar en el wizard
  9  |     await expect(page).toHaveURL(/\/pages\/payroll\/wizard/);
  10 |     // Usar un localizador más específico para evitar la violación de modo estricto
  11 |     await expect(page.getByRole('heading', { name: 'Nueva Planilla', exact: true })).toBeVisible();
  12 |   });
  13 | 
  14 |   test('flujo completo del wizard hasta el ajuste de empleado', async ({ page }) => {
  15 |     await page.goto('/pages/payroll/wizard');
  16 | 
  17 |     // Paso 1: Selección de Período
  18 |     await expect(page.locator('h2')).toContainText('Seleccionar Período');
  19 |     
  20 |     // Llenar fechas manualmente para asegurar que el botón se habilite
  21 |     const inputs = page.locator('input[type="date"]');
> 22 |     await inputs.first().fill('2026-04-01');
     |                          ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  23 |     await inputs.last().fill('2026-04-15');
  24 |     
  25 |     // Esperar a que el botón esté habilitado y hacer clic
  26 |     const nextBtn = page.getByRole('button', { name: 'Siguiente →' });
  27 |     await expect(nextBtn).toBeEnabled();
  28 |     await nextBtn.click();
  29 | 
  30 |     // Paso 2: Selección de Empleados
  31 |     await expect(page.locator('h2')).toContainText('Seleccionar Empleados');
  32 |     
  33 |     // Seleccionar todos
  34 |     const selectAllBtn = page.getByRole('button', { name: /Seleccionar todos/i });
  35 |     if (await selectAllBtn.isVisible()) {
  36 |       await selectAllBtn.click();
  37 |     }
  38 | 
  39 |     await expect(nextBtn).toBeEnabled();
  40 |     await nextBtn.click();
  41 | 
  42 |     // Paso 3: Revisar
  43 |     await expect(page.locator('h2')).toContainText('Revisar Resultados');
  44 |     
  45 |     // Esperar a que el cálculo termine (ajustar timeout si es pesado)
  46 |     await expect(page.locator('text=Calculando planilla…')).not.toBeVisible({ timeout: 20000 });
  47 | 
  48 |     // Si hay error de cálculo (por falta de datos en el entorno), el test termina aquí con gracia
  49 |     const errorBox = page.locator('.bg-red-50');
  50 |     if (await errorBox.isVisible()) {
  51 |       console.log('Nota: Cálculo falló por falta de datos reales, pero el flujo UI es correcto.');
  52 |       return;
  53 |     }
  54 | 
  55 |     // Si llegamos aquí, probar el ajuste
  56 |     const adjustBtn = page.locator('button:has-text("Ajustar")').first();
  57 |     if (await adjustBtn.isVisible()) {
  58 |       await adjustBtn.click();
  59 |       await expect(page.locator('h2:has-text("Ajustar horas y deducciones")')).toBeVisible();
  60 |       await page.locator('button:has-text("Cancelar")').click();
  61 |     }
  62 |   });
  63 | 
  64 |   test('sidebar debe tener el label correcto', async ({ page }) => {
  65 |     await page.goto('/pages/main');
  66 |     
  67 |     const payrollMenu = page.locator('text=Cálculo de planillas');
  68 |     await payrollMenu.click();
  69 |     
  70 |     const newPayrollLink = page.locator('text=Nueva planilla');
  71 |     await expect(newPayrollLink).toBeVisible();
  72 |     await expect(newPayrollLink).toHaveAttribute('href', '/pages/payroll/wizard');
  73 |   });
  74 | });
  75 | 
```