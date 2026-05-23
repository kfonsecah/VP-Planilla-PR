🔴 Crítico (hacer antes del primer deploy)
   ☐ Transferir repo a organización GitHub
   ☐ Verificar que .env nunca fue commiteado
   ☐ CORS restringido al dominio real
   ☐ Variables de entorno en paneles de Vercel y Render
   ☐ prisma migrate deploy en el script de build

🟡 Importante (primera semana en producción)
   ☐ helmet + rate-limit en Express
   ☐ Manejo de errores sin exponer internos
   ☐ JWT con expiración definida
   ☐ UptimeRobot configurado
   ☐ Backup manual inicial de la DB

🟢 Bueno tener (antes de que escale)
   ☐ Sentry para monitoreo de errores
   ☐ Conventional Commits activo
   ☐ Acuerdo escrito con el cliente
   ☐ Cuentas de servicios a nombre del cliente