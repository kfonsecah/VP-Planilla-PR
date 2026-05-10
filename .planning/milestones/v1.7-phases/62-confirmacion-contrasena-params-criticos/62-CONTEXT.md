# Phase 62 Context: Re-confirmación con Contraseña para Parámetros Críticos

**Phase:** 62-confirmacion-contrasena-params-criticos
**Milestone:** v1.7
**Status:** Not Started
**Spec reference:** Conversación de diseño — sección "Acceso y Permisos" del Payroll.md

## Objective

Modificar cualquier parámetro marcado `isCritical: true` requiere que el usuario ingrese su contraseña antes de que el cambio sea guardado. El intento queda registrado en `vpg_audit_logs` con flag de confirmación.

## Scope

### In Scope
- `AuthService.verifyPasswordForUser(userId, plainPassword): Promise<boolean>`
- `LegalParamController`: si el param tiene `isCritical: true`, exige `confirmationPassword` en el request body antes de delegar al service
- `vpg_audit_logs`: campo adicional `password_confirmed: boolean` en el metadata del evento de cambio
- Frontend: `PasswordConfirmModal.tsx` — componente reutilizable
- Frontend: Panel de params legales usa el modal antes de guardar params críticos

### Out of Scope
- El panel completo de parámetros legales (Fase 63 lo entrega completo)
- Alertas por cambio (Fase 61)

## Backend — flujo

```
PATCH /legal-params/:key
  body: { value, validFrom, source_decree?, confirmationPassword? }

  1. Verificar AuthMiddleware.verifyToken (ya existe)
  2. Buscar el param: ¿es isCritical?
  3. Si isCritical:
     a. Si no hay confirmationPassword en body → 400 "Parámetro crítico requiere confirmación de contraseña"
     b. AuthService.verifyPasswordForUser(req.userId, confirmationPassword)
     c. Si falla → 403 "Contraseña incorrecta. El cambio no fue guardado."
     d. Si pasa → continuar con upsertParam
  4. upsertParam guarda el valor
  5. vpg_audit_logs: { action: 'LEGAL_PARAM_UPDATE', password_confirmed: true, paramKey, oldValue, newValue, userId, timestamp }
```

## AuthService — método nuevo

```typescript
static async verifyPasswordForUser(userId: string, plainPassword: string): Promise<boolean>
```
- Busca `vpg_users.password_hash` del usuario
- Compara con `bcrypt.compare(plainPassword, hash)`
- Retorna boolean
- **NO loguear la contraseña en ningún log** — solo el resultado booleano

## Frontend — PasswordConfirmModal

```tsx
interface PasswordConfirmModalProps {
  isOpen: boolean
  paramName: string          // nombre legible del parámetro
  onConfirm: (password: string) => void
  onCancel: () => void
  isLoading?: boolean
  error?: string             // mensaje si el API devolvió 403
}
```

Texto del modal:
> **Esta acción modifica un parámetro legal crítico**
>
> Está a punto de cambiar: **[paramName]**
>
> Ingrese su contraseña para confirmar que esta acción es intencional.
>
> [Input contraseña] [Cancelar] [Confirmar cambio]

- Si el API responde 403: mostrar error en el modal sin cerrarlo
- El input de contraseña es `type="password"` — no mostrar nunca en texto plano
- El botón Confirmar se deshabilita mientras `isLoading = true`

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 62-01 | AuthService.verifyPasswordForUser + lógica en Controller | Fase 55 completa |
| 62-02 | PasswordConfirmModal.tsx + integración en panel params | 62-01 |

## Dependencies

- **Requiere:** Fase 55 (LegalParamService/Controller existen)
- **Requerida por:** Fase 63 (panel admin lo usa)

## Constraints

- La contraseña nunca se almacena, loguea ni transmite en texto claro más allá del request HTTPS
- El `vpg_audit_logs` solo registra `password_confirmed: true/false` — nunca la contraseña
- Fallar la contraseña 5 veces consecutivas no bloquea la cuenta (no es el scope de esta fase)
- `npx tsc --noEmit` y `next lint` pasan
- **Backlog / Futuro:**
  - Rate limiting para el endpoint de confirmación (prevenir fuerza bruta)
  - Registro de `last_failed_confirmation` en el perfil de usuario
