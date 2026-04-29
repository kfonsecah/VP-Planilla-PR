# UI Design Contract: Phase 63 (Panel Admin Parámetros Legales)

## 1. Layout & Spacing
- **Página Principal**: Contenedor centrado (`max-w-5xl mx-auto px-4 py-8`).
- **Header**: Título a la izquierda, subtítulo descriptivo debajo. Margen inferior de `mb-8`.
- **Acordeones / Secciones**: Se utilizarán tarjetas expandibles (o secciones en bloque separadas) para cada categoría (Jornada Laboral, Horas Extraordinarias, CCSS, Salarios Mínimos, Configuración).
  - Espaciado entre secciones: `space-y-6`.
  - Padding interno de las tarjetas: `p-6`.
- **Cuadrícula de Parámetros (LegalParamCard)**: 
  - Layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- **Drawer Lateral (LegalParamDrawer)**:
  - Ancho fijo de `w-full max-w-md`.
  - Aparece desde la derecha (transform translate-x-full a 0).
  - Padding interno de `p-6`.
- **Modales (History / Bulk Update)**:
  - Contenedores centrados con ancho máximo `max-w-2xl` y `max-w-md` respectivamente.

## 2. Typography
- **Fuente Principal**: Inter (o la fuente default de la aplicación).
- **Page Title**: `text-2xl font-bold text-[#4A5D3A] dark:text-green-500`.
- **Subtítulo**: `text-sm text-zinc-600 dark:text-zinc-400`.
- **Section Headers**: `text-xl font-semibold text-zinc-800 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-4`.
- **Card Titles (Nombre de Param)**: `text-base font-semibold text-zinc-800 dark:text-zinc-100`.
- **Card Values**: `text-2xl font-bold text-[#4A5D3A] dark:text-white my-2`.
- **Metadatos (Fechas, Decretos)**: `text-xs text-zinc-500 dark:text-zinc-400`.
- **Botones**: `text-sm font-medium`.

## 3. Color Palette (Zinc-950 & App Theme)
- **Fondos**: 
  - Página: `#E7DCC1` (light) / `bg-zinc-950` (dark).
  - Tarjetas/Modales: `#FCF1D5` (light) / `bg-zinc-900` (dark).
- **Textos Primarios**: `text-[#4A5D3A]` (light) / `text-white` (dark).
- **Textos Secundarios**: `text-zinc-600` / `text-zinc-400`.
- **Bordes**: `border-zinc-200` (light) / `border-zinc-800` (dark).
- **Acentos y Badges**:
  - Peligro / Critical: Red-500 (`bg-red-100 text-red-700` light, `bg-red-900/30 text-red-400` dark).
  - Información: Blue-500.
  - Advertencia (Desactivado): Yellow-500/Orange-500.

## 4. Interactive Elements
- **Botones Primarios**: `bg-[#4A5D3A] text-white hover:bg-[#3a4a2c] disabled:opacity-50 transition-colors rounded-lg px-4 py-2`.
- **Botones Secundarios**: `bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 rounded-lg px-4 py-2`.
- **Botones de Edición (Card)**: Botones ghost o iconos (lapicero) alineados a la derecha, color neutral con hover de color primario.
- **Toggle (Feature Flag)**: Switch animado tipo iOS (framer-motion o Tailwind puro). `bg-[#4A5D3A]` cuando activo, `bg-zinc-300` inactivo.
- **Drawer Animation**: Transición suave de 300ms `ease-in-out` desde la derecha. Fondo oscurecido (`backdrop-blur-sm bg-black/50`).
- **Candado Crítico**: Ícono de candado junto al título si `isCritical === true`. Tooltip on hover explicando que requerirá contraseña.

## 5. Copywriting & Tone
- **Tono**: Administrativo, seguro, transparente, profesional.
- **Titulares**: "Parámetros Legales del Sistema".
- **Empty States**: "No se encontraron parámetros en esta categoría".
- **Mensajes de Acción**: "Actualizar Valor", "Ver Historial", "Actualizar para nuevo decreto MTSS".
- **Advertencias**: "Esta acción modifica un parámetro crítico y quedará registrada en el registro de auditoría."
- **Fechas**: Usar formato legible (ej. "15 de Enero, 2026").

## 6. Accessibility (A11y)
- **Contraste**: Garantizar contraste ratio > 4.5:1 para todos los textos legibles sobre fondos `#FCF1D5` o `zinc-900`.
- **Foco**: `focus:outline-none focus:ring-2 focus:ring-[#4A5D3A] focus:ring-offset-1` en todos los inputs, botones y toggles.
- **ARIA**: 
  - Toggles deben usar `role="switch"` y `aria-checked`.
  - Drawers/Modales deben usar `role="dialog"` y tener `aria-modal="true"` con captura de foco.
- **Feedback**: Uso de íconos junto a los colores (ej. Candado para críticos, Check/Cross para estados) para no depender únicamente del color.
