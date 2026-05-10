# 49-01-SUMMARY

## Tareas Completadas
- Se refactorizó `activeTab` para derivar de `searchParams.get('tab')`, utilizando hooks de Next.js (`useSearchParams`, `useRouter`, `usePathname`).
- Se reescribió la persistencia de `expandedEmployees` para iterar y actualizar el parámetro `expanded` en la query string de la URL a modo de conjunto serializado por comas.
- Se integró un `useEffect` para limpiar inteligentemente la caché de la URL al momento de un cambio abrupto de contexto de los parámetros de fecha u origen (`filters.initDate`, `filters.endDate`), impidiendo estados incongruentes.

## Notas / Decisiones
- Se utilizó el helper nativo de Node/Browser `URLSearchParams` junto con el objeto de solo lectura que expone `useSearchParams()` de React porque asegura una sintaxis limpia.
- Se omitió explícitamente `exhaustive-deps` en el efecto de reinicio porque enlazarlo estricto al router desencadena recálculos circulares.
