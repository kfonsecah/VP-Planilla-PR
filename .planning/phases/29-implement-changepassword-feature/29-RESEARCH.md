# Phase 29: Change Password — Research

**Phase:** 29
**Goal:** Implementar cambio de contraseña seguro con verificación por email
**Mode:** implementation

---

## Resumen

Esta fase implementa AUTH-09: permitir al usuario cambiar su contraseña de forma segura mediante un código de verificación enviado por email.

---

## Estado Actual

**Stub existente** (`AuthController.ts:305-318):
```typescript
static async changePassword(req: Request, res: Response): Promise<Response> {
  try {
    return res.status(200).json({
      success: true,
      message: 'Change password funcionando (pendiente implementar)'
    });
  } catch (error) {
    // ...
  }
}
```

---

## Secure Flow con Código por Email

```
Paso 1: Solicitar cambio
  POST /api/auth/password-request
  Input: user_id o email
  Output: Código enviado por email, token temporal guardado

Paso 2: Confirmar cambio  
  POST /api/auth/password-confirm
  Input: código, new_password
  Output: Contraseña cambiada, sesiones invalidadas
```

### Paso 1: Solicitar Código

1. Usuario indica que quiere cambiar contraseña
2. Sistema busca usuario por email
3. Sistema genera código de 6 dígitos (aleatorio)
4. Sistema guarda código + expiry (15 min) en DB o cache
5. Sistema envía código por email (usar EmailService de Phase 28)

### Paso 2: Confirmar Cambio

1. Usuario envía: código + new_password + confirm_password
2. Sistema valida código (existe, no expirado, correcto)
3. Sistema hashea nueva contraseña con bcrypt
4. Sistema actualiza en `vpg_users`
5. Sistema invalida sesiones activas (excepto actual)
6. Sistema envía email de confirmación

---

## Standard Stack

| Tecnología | Uso |
|------------|-----|
| `bcrypt` | Hash de contraseñas (ya instalado) |
| `zod` | Validación de input |
| `EmailService` | Enviar código (Phase 28) |
| `crypto` | Generar código aleatorio |

---

## Architecture Patterns

### 1. Flujo de Cambio de Contraseña

```
1. Usuario envía: current_password, new_password, confirm_password
2. Validar que current_password coincide con la actual (usando bcrypt)
3. Validar new_password (mínimo 8 caracteres, complejidad)
4. Verificar new_password == confirm_password
5. Hashear new_password con bcrypt
6. Actualizar en DB (vpg_users)
7. (Opcional) Invalidar otros tokens de sesión
8. Responder success
```

### 2. Ubicación

```
src/backend/
├── src/
│   ├── service/
│   │   └── AuthService.ts    → Añadir changePassword method
│   ├── controller/
│   │   └── AuthController.ts → Completar changePassword
│   └── routes/
│       └── AuthRoute.ts      → Ya registrado
```

---

## Don't Hand-Roll

1. **No almacenar código en texto claro** — Solo guardar hash del código
2. **Código de un solo uso** — Invalidar después de usar
3. **Tiempo de expiración** — 15 minutos máximo
4. **No almacenar contraseña en texto plano** — Siempre bcrypt
5. **No enviar password por email** — Solo código de verificación

---

## Common Pitfalls

| Problema | Solución |
|----------|---------|
| Código reutilizado | Invalidar después de usar (once) |
| Códigoexpira | Expiración de 15 minutos |
| Email no llega | UsarEmailService con Resend (confiable) |
| Fuerza bruta | Rate limiting en endpoint |

---

## DB Schema Changes Needed

Agregar campos para código de verificación:

```prisma
model password_change_request {
  id              Int       @id @default(autoincrement())
  user_id         Int
  code            String    // Hash del código de 6 dígitos
  expires_at      DateTime // 15 minutos desde creación
  used            Boolean   @default(false)
  created_at      DateTime @default(now())
  @@index([user_id])
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/password-request | Required | Solicitar código por email |
| POST | /api/auth/password-confirm | None | Confirmar con código + nueva password |

---

## Security Measures

1. **Código aleatorio de 6 dígitos** — `crypto.randomBytes(3).toString('hex')`
2. **Hash del código** — `bcrypt.hash(code, 3)` — permite verificar sin almacenar texto
3. **Expiración** — 15 minutos
4. **One-time use** — Marcar como usado después de confirmar
5. **Rate limiting** — Máximo 3 intentos por hora por usuario
6. **Invalidar sesiones** — Después del cambio, invalidate tokens anteriores

---

## Implementation Steps

### 1. Schema Prisma
- Agregar `PasswordChangeRequest` model

### 2. AuthService
- `requestPasswordChange(userId)` → generar código, enviar email
- `confirmPasswordChange(code, newPassword)` → verificar código, cambiar password

### 3. AuthController
- `requestPasswordChange(req, res)` → endpoint 1
- `confirmPasswordChange(req, res)` → endpoint 2

### 4. Rutas
- Registrar endpoints en AuthRoute

### 5. Frontend
- Modal con flujo de 2 pasos

---

## Open Questions

1. **¿Expiración del código?** — 15 minutos es estándar
2. **¿Rate limiting?** — 3 intentos/hora por usuario
3. **¿Invalidar sesiones?** — Recomendado sí

---

## Success Criteria

- [ ] AUTH-09: Usuario cambia contraseña con verificación por email