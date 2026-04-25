# Phase 49 Context: Persistencia de Vista (Caché de UI)

## Decisions

- **Mecanismo de Almacenamiento**: Se implementarán parámetros de URL en Next.js (`?tab=...&expanded=id_1,id_2`) para ambos elementos. Esto mantendrá la persistencia entre navegaciones interactivas (ej. entrar a un perfil y luego presionar "Atrás") y permitirá incluso compartir los links si se desea, al ser el estándar de frameworks como Next.js.
- **Ciclo de Vida de la Caché**: Se limpiará o reiniciará el arreglo de tarjetas expandidas en la URL cuando el usuario cambie parámetros mayores de la vista, es decir, el selector de "Fecha/Período" o "Sucursal". Esto previene intentar mostrar paneles de empleados ausentes en la nueva búsqueda.

## Deferred Ideas
*(No hay ideas pospuestas en esta discusión)*

## Canonical Refs
- No aplica
