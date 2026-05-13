Durante la ejecución de este milestone, tené en cuenta los siguientes pitfalls confirmados por investigación previa:

PHASE 74 (Git Hygiene & DBML):
- Husky: usar exclusivamente `npx husky init` (v9+). No usar `husky install` ni comandos de v4/v8.
- prisma-dbml-generator: verificar compatibilidad con Prisma 6 antes de instalar. Si hay issues abiertos con Prisma 6, usar `prisma-markdown` como alternativa. Pinear la versión del generador y verificar el output tras la instalación.
- Commitlint en monorepo: usar scopes en los commits para distinguir contexto: `feat(api):`, `fix(ui):`, `chore(db):`, etc.

PHASE 75 (Security & API Hardening):
- HPP: configurar con whitelist explícita para parámetros que legítimamente deben ser arrays (ej. filtros de empleados, períodos). No usar hpp() sin whitelist si la API acepta arrays en algún endpoint.
- Express 5 req.query: es un getter no-writable. Nunca mutar req.query directamente. El middleware de normalización debe leer req.query y producir un objeto nuevo, nunca sobreescribir la propiedad original.

PHASE 76 (Error Observability):
- Sentry tunnelRoute: configurar obligatoriamente `tunnelRoute: "/monitoring-tunnel"` en next.config.ts para evitar que ad-blockers (uBlock, etc.) bloqueen entre 20-40% de los errores reportados.
- Sentry instrumentation.ts: mantener el archivo liviano, importar únicamente lo necesario para Sentry. Evitar importar servicios de la aplicación para no crear dependencias circulares.
- Sentry Frontend + Backend: ambas integraciones deben compartir el mismo DSN y tener tracing habilitado para que Distributed Tracing funcione correctamente.