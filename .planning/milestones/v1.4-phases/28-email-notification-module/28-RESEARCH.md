# Phase 28: Email Notification Module — Research

**Phase:** 28
**Goal:** Implementar un módulo de notificaciones por email usando Resend API
**Mode:** ecosystem

---

## Resumen

Este módulo permite enviar emails desde VP-Planilla usando la **Resend Email API**.
Resend es una plataforma developer-first con tier gratuito (100 emails/día).

**Proveedor:** Resend (https://resend.com) — NO Gmail

---

## Standard Stack

| Tecnología | Uso |
|------------|-----|
| `resend` | SDK oficial de Resend para Node.js |

**No requiere:**
- Google OAuth2 (Gmail)
- Configuración DNS compleja初始只需要 API key

---

## Architecture Patterns

### 1. Email Service Pattern
```
src/backend/
├── src/
│   ├── service/
│   │   └── EmailService.ts    → Clase principal
│   ├── utils/
│   │   └── emailTemplates.ts → Plantillas de email (HTML)
│   └── config/
│       └── emailConfig.ts     → API key de Resend
```

### 2. Resend SDK Configuration
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar email
const { data, error } = await resend.emails.send({
  from: 'VP-Planilla <onboarding@resend.dev>',  // Para testing
  to: ['empleado@empresa.com'],
  subject: 'Notificación de Nómina',
  html: '<p>Su nómina está lista...</p>'
});
```

---

## Don't Hand-Roll

1. **No hardcodear API key** — Siempre usar environment variables
2. **No usar credenciales de otros** — Solo usar tu API key de Resend
3. **No enviar spam** — Resend bloquea Emails que violan TOS

---

## Common Pitfalls

| Problema | Solución |
|----------|---------|
| Emails en spam | Usar dominio verificado en Resend |
| Rate limit (429) | Implementar backoff, usar plan mayor |
| API key expuesta | immediateMente rotar, nunca commitear |
| Envío falla | Siempre manejar error en `{ data, error }` |

---

## Resend Limits

| Tipo de cuenta | Límite diario |
|---------------|-------------|
| **Free** | 100 emails/día |
| Pro | 50,000 emails/día |
| Scale | Sin límite |

**Para VP-Planilla:** El plan Free (100/día) es suficiente.

---

## Setup Steps Requeridos

### 1. Resend Dashboard
1. Crear cuenta en https://resend.com
2. Ir a **API Keys** → Crear nueva key
3. Copiar y guardar (solo se muestra una vez)
4. Agregar a `.env`: `RESEND_API_KEY=re_xxx`

### 2. Environment Variables
```
RESEND_API_KEY=re_1234567890abcdef
```

### 3. (Opcional) Verificar dominio
- Ir a **Domains** → Add domain `vplanilla.app`
- Agregar los DNS records que Resend indica
- Después de verificado, puedes enviar como ` noreply@vplanilla.app`

---

## Email Templates para VP-Planilla

| Template | Uso |
|----------|-----|
| payroll-notification | Notificación de nómina al empleado |
| password-reset | Reset de contraseña |
| welcome | Bienvenida de nuevo empleado |

---

## Open Questions

1. **¿Qué dominio usar inicialmente?** — Testing: `onboarding@resend.dev` o Production: ` noreply@vplanilla.app` (después de verificar dominio)
2. **Necesitamos más de 100 emails/día?** — Probablemente no para notificaciones de nómina
3. **¿Cuándo verificar dominio vplanilla.app?** — Después de probar con dominio de prueba

---

## Success Criteria

- [ ] EMAIL-01: Emails se envían usando Gmail API con OAuth2
- [ ] EMAIL-02: Emails no marcados como spam
- [ ] EMAIL-03: Notificaciones de planilla enviadas a empleados

---

*Research: 2026-04-11*