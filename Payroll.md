# Especificación: Cálculo de Planilla — VP-Planilla
> Dominio legal: Costa Rica  
> Referencias: Código de Trabajo CR · Criterio MTSS DAJ-AER-OFP-714-2023 · Ley CCSS · Decreto de Salarios Mínimos MTSS (actualización semestral)  
> Estado del documento: Refleja el sistema en producción más los gaps pendientes de implementar

---

## 0. Mapa de Estado del Sistema

Este documento describe el **comportamiento esperado completo** del módulo de planilla. Las secciones están marcadas con su estado real:

| Ícono | Significado |
|-------|-------------|
| ✅ **EN PRODUCCIÓN** | Implementado y funcionando en `payrollUtils.ts` o módulos relacionados |
| 🔧 **GAP — Por implementar** | No existe aún; requiere desarrollo |
| ⚠️ **DEUDA TÉCNICA** | Existe pero con constantes hardcoded que deben migrarse a BD |

---

## 1. Contexto Legal

### 1.1 Base normativa aplicable

- **Art. 162 CT**: el salario es la retribución que el patrono debe pagar en virtud del contrato de trabajo.
- **Art. 164 CT**: el salario puede pagarse por mes, quincena, semana, día u hora; en dinero, en especie, o por comisiones. Las comisiones tienen carácter de salario y deben incluirse en liquidaciones.
- **Art. 168 CT**: el plazo de pago nunca podrá ser mayor de una quincena para trabajadores manuales, ni de un mes para trabajadores intelectuales y domésticos.
- **Art. 169 CT**: el salario deberá pagarse **completo** en cada período de pago.
- **Art. 152 CT**: el día de descanso semanal es de pago obligatorio **únicamente** en establecimientos comerciales, o cuando el contrato lo estipule expresamente para otras actividades.
- **Art. 17 CT**: principio *in dubio pro operario* — en caso de duda, la interpretación debe favorecer al trabajador. Prohíbe cualquier redondeo que perjudique sistemáticamente al empleado.
- **Art. 24 CT**: el contrato debe contener la forma, período y lugar del pago.
- **Art. 83 CT**: el incumplimiento en la fecha de pago da derecho al trabajador a dar por terminada la relación laboral con responsabilidad patronal.

### 1.2 Composición del salario bruto

Toda suma percibida por el trabajador por razón del servicio prestado forma parte del **salario bruto**, incluyendo salario base, horas extraordinarias, comisiones, dietas y recargo en el servicio. El salario bruto **no tiene deducción alguna** — es la base de cálculo de cargas sociales, aguinaldo y prestaciones.

---

## 2. Períodos de Pago ✅ EN PRODUCCIÓN

El sistema soporta las siguientes modalidades, ya implementadas en el wizard de planilla:

| Modalidad | Máximo legal | Estado |
|-----------|-------------|--------|
| Quincenal | 15 días | ✅ Implementado |
| Mensual | 30 días | ✅ Implementado |
| Rango libre | Configurable | ✅ Implementado |

### 2.1 Naturaleza jurídica de la quincena
La quincena es jurídicamente un **adelanto del salario mensual**, no un período independiente (criterio MTSS DAJ-AER-OFP-714-2023). Remunera todos los días del período, sean hábiles e inhábiles. Cada empresa configura sus fechas de corte; el sistema debe respetar esas fechas y advertir si superan el límite legal de 15 días.

---

## 3. Cálculo de Horas Trabajadas ✅ EN PRODUCCIÓN (con deuda técnica)

### 3.1 Jornadas ordinarias máximas

Actualmente implementado con el cap de **8h/día, Lunes–Sábado** en `payrollUtils.ts`.

⚠️ **DEUDA TÉCNICA**: estos valores están hardcodeados. Deben migrarse a `vpg_legal_params` para soportar jornadas mixtas (7h) y nocturnas (6h) sin cambios en código.

| Tipo de jornada | Horas diarias | Horas semanales |
|----------------|--------------|----------------|
| Diurna | 8h | 48h |
| Mixta | 7h | 42h |
| Nocturna | 6h | 36h |

Toda hora trabajada más allá del límite ordinario es extraordinaria.

### 3.2 Factores de pago ✅ EN PRODUCCIÓN

| Situación | Factor | Estado |
|-----------|--------|--------|
| Hora ordinaria | 1.00× | ✅ |
| Hora extra (>8h/día o >requeridas en período) | 1.50× | ✅ |
| Hora en feriado obligatorio | 2.00× normal / 3.00× triple | ✅ |
| Hora en día de descanso no pagado laborado | 2.00× | ✅ |

⚠️ **DEUDA TÉCNICA**: los multiplicadores 1.5×, 2.0× y 3.0× están hardcodeados en `payrollUtils.ts`. Deben venir de `vpg_legal_params`.

### 3.3 Tarifa por hora base

```
tarifa_hora = salario_mensual / (horas_ordinarias_semana × 4.333)
```

> Factor 4.333 = 52 semanas / 12 meses. Si la jornada no es diurna estándar, `horas_ordinarias_semana` debe leerse de `vpg_legal_params`, no ser un literal.

### 3.4 Descanso semanal remunerado ✅ EN PRODUCCIÓN

Implementado con la fórmula:
```
descanso_semanal = (regularHours × 8 / 104) × 2
```

Aplica según la configuración de la empresa (actividad comercial vs no comercial), conforme al Art. 152 CT.

---

## 4. Manejo de Fracciones de Tiempo (Minutos) 🔧 GAP — Por implementar

### 4.1 Situación actual

El sistema actualmente trabaja con horas como unidad base. **No existe lógica de redondeo de minutos configurada por empresa**. Este es un gap legal relevante: el Código de Trabajo no define explícitamente cómo tratar fracciones de hora, pero el Art. 17 (principio *in dubio pro operario*) prohíbe cualquier redondeo que perjudique sistemáticamente al trabajador.

### 4.2 Unidad interna de tiempo requerida

Internamente, el sistema debe manejar **minutos enteros como unidad base** en todos los cálculos. La conversión a horas decimales ocurre únicamente al momento del cálculo monetario y presentación en pantalla. Esto elimina errores de redondeo acumulativos entre marcas y períodos.

```
minutos_trabajados → aplicar política → horas_efectivas → × tarifa → pago
```

### 4.3 Política de redondeo — Configuración por empresa

La política se almacena en `vpg_enterprise` (o tabla de configuración de empresa) y se aplica uniformemente a todos los cálculos del período. El campo propuesto es `minuteRoundingPolicy` de tipo enum.

---

#### Modalidad A — Cálculo Exacto (Proporcional) ✅ Recomendado legalmente

Cada minuto trabajado se paga de forma exactamente proporcional.

**Fórmula:**
```
pago_fraccion = (tarifa_hora × factor) × (minutos_fraccion / 60)
```

**Ejemplo:** 7h 11min trabajadas, jornada ordinaria completada, tarifa ₡2.000/hora:
```
horas_ordinarias : 7h  × ₡2.000              = ₡14.000
fraccion_extra   : (₡2.000 × 1.5) × (11/60)  =    ₡550
total            :                              ₡14.550
```

| | |
|--|--|
| **Apego legal** | ✅ Máximo — 100% defendible ante MTSS |
| **Costo patrono** | Proporcional exacto |
| **Complejidad recibo** | Puede mostrar céntimos |

---

#### Modalidad B — Redondeo Siempre hacia Arriba

Los minutos se redondean al cuarto de hora inmediato superior. Nunca hacia abajo.

**Tabla de redondeo:**
```
0 min        → 0.00h  (sin fracción)
1  – 15 min  → 0.25h  (15 min)
16 – 30 min  → 0.50h  (30 min)
31 – 45 min  → 0.75h  (45 min)
46 – 59 min  → 1.00h  (60 min)
```

**Ejemplo:** 7h 11min → fracción = 11min → redondea a 0.25h extra:
```
pago_extra : (₡2.000 × 1.5) × 0.25 = ₡750
total      : ₡14.000 + ₡750         = ₡14.750
```

| | |
|--|--|
| **Apego legal** | ✅ Alto — siempre favorece al trabajador |
| **Costo patrono** | Mayor que exacto en todos los casos |
| **Complejidad recibo** | Baja — múltiplos de cuarto de hora |

---

#### Modalidad C — Cuartos de Hora Bidireccionales ⚠️ Riesgo legal moderado

Los minutos se redondean al cuarto de hora más cercano, tanto arriba como abajo.

**Tabla de redondeo:**
```
0  –  7 min  → 0.00h  (se descarta)
8  – 22 min  → 0.25h  (15 min)
23 – 37 min  → 0.50h  (30 min)
38 – 52 min  → 0.75h  (45 min)
53 – 59 min  → 1.00h  (60 min)
```

**Ejemplo favorable:** 7h 18min → 18min está entre 8–22 → redondea a 0.25h:
```
total: ₡14.000 + ₡750 = ₡14.750  (empleado "gana" 12 min)
```

**Ejemplo desfavorable:** 7h 04min → 4min está entre 0–7 → se descarta:
```
total: ₡14.000  (empleado "pierde" 4 minutos trabajados)
```

| | |
|--|--|
| **Apego legal** | ⚠️ Moderado — los casos de redondeo hacia abajo pueden ser objetados por MTSS bajo Art. 17 |
| **Costo patrono** | Similar al exacto en promedio |
| **Complejidad recibo** | Baja |
| **Requisito adicional** | Debe estar documentado en el reglamento interno de trabajo de la empresa |

---

### 4.4 Resumen comparativo

| Modalidad | Apego legal | Costo patrono | Riesgo MTSS |
|-----------|-------------|--------------|-------------|
| A — Exacto | ✅ Máximo | Exacto | Ninguno |
| B — Siempre arriba | ✅ Alto | Mayor | Ninguno |
| C — Cuartos bidireccionales | ⚠️ Moderado | Neutro | Bajo-Medio |

### 4.5 Advertencia obligatoria en UI al seleccionar Modalidad C

El sistema debe bloquear la activación de la Modalidad C hasta que el administrador confirme explícitamente el siguiente aviso. La confirmación debe quedar registrada en `vpg_audit_logs` con timestamp y usuario:

> **⚠️ Advertencia legal — Redondeo bidireccional**
>
> Esta modalidad puede descartar minutos trabajados por el empleado cuando la fracción es menor a 8 minutos. Según el artículo 17 del Código de Trabajo (principio *in dubio pro operario*), esta práctica puede ser objetada por el Ministerio de Trabajo si no está respaldada en el reglamento interno de trabajo de su empresa.
>
> Al confirmar, usted declara que esta política está documentada en su reglamento interno y es del conocimiento de todos sus trabajadores.
>
> **[ Cancelar ]  [ Confirmo, activar Modalidad C ]**

---

## 5. Días Feriados ✅ EN PRODUCCIÓN

El sistema ya maneja feriados a través de `vpg_company_holidays` con soporte para feriados obligatorios (2.0×) y triples (3.0×).

### 5.1 Feriados de pago obligatorio — precargados en sistema

| Fecha | Feriado |
|-------|---------|
| 1 enero | Año Nuevo |
| Jueves Santo | Variable (semana santa) |
| Viernes Santo | Variable (semana santa) |
| 11 abril | Batalla de Rivas |
| 1 mayo | Día del Trabajador |
| 25 julio | Anexión de Guanacaste |
| 2 agosto | Virgen de los Ángeles |
| 15 agosto | Día de la Madre |
| 15 septiembre | Independencia |
| 25 diciembre | Navidad |

### 5.2 Comportamiento por tipo de feriado

| Situación | Resultado |
|-----------|-----------|
| Feriado obligatorio — no se trabaja | Se paga el día normal (incluido en salario mensual/quincenal) |
| Feriado obligatorio — se trabaja | Pago del día + recargo 100% = pago doble efectivo (2.0×) |
| Feriado triple — se trabaja | 3.0× del valor hora ordinaria |
| Feriado no obligatorio — no se trabaja | No se paga |
| Feriado no obligatorio — se trabaja | 2.0× del valor hora ordinaria |

---

## 6. Descanso Semanal ✅ EN PRODUCCIÓN

Implementado con cálculo proporcional basado en horas regulares del período.

**Regla legal (Art. 152 CT):**
- **Actividad comercial**: el día de descanso semanal se paga aunque no se trabaje. Incluido en salario mensual/quincenal.
- **Otras actividades**: el descanso no se paga salvo que el contrato lo estipule.

La configuración `isCommercialActivity` en el perfil de empresa determina cuál lógica aplica.

---

## 7. Composición del Salario Bruto por Período ✅ EN PRODUCCIÓN

```
SALARIO BRUTO
= Salario Base del Período
+ Horas Extraordinarias (1.5× u 2.0× según corresponda)
+ Recargo por feriados trabajados (2.0× o 3.0×)
+ Descanso Semanal Remunerado (solo actividad comercial)
+ Bonos del período  (vpg_bonuses)
+ Comisiones (si aplica)
+ Otros pluses configurados

DEDUCCIONES AL TRABAJADOR
= Cuota obrera CCSS
+ Retención Impuesto sobre la Renta (si aplica)
+ Deducciones autorizadas (vpg_employee_deductions: préstamos, embargos, etc.)

SALARIO NETO = SALARIO BRUTO − DEDUCCIONES AL TRABAJADOR
```

---

## 8. Deducciones CCSS ✅ EN PRODUCCIÓN (como deducción configurable en BD)

Las tasas de CCSS ya existen como deducciones configurables en BD.

⚠️ **DEUDA TÉCNICA**: deben estar vinculadas a `vpg_legal_params` con fecha de vigencia, de modo que al actualizar las tasas por decreto no se afecten planillas históricas ya calculadas.

| Concepto | Porcentaje | A cargo de |
|----------|-----------|-----------|
| Seguro de Salud (obrero) | 5.50% | Trabajador |
| Seguro de Pensión (obrero) | 4.00% | Trabajador |
| Banco Popular (obrero) | 1.00% | Trabajador |
| **Total cuota obrera** | **~10.67%** | Trabajador |
| Seguro de Salud (patronal) | 9.25% | Patrono |
| Seguro de Pensión (patronal) | 5.25% | Patrono |
| INA | 1.50% | Patrono |
| IMAS | 0.50% | Patrono |
| Asignaciones Familiares | 5.00% | Patrono |
| FONATEL | 0.25% | Patrono |
| Banco Popular (patronal) | 0.25% | Patrono |
| **Total carga patronal** | **~26.67%** | Patrono |

---

## 9. Aguinaldo ✅ EN PRODUCCIÓN (acumulación) / 🔧 GAP (proyección en UI)

El aguinaldo es obligatorio (Ley N° 2412). Se calcula sobre el **salario bruto** del período 1° diciembre → 30 noviembre.

```
aguinaldo_proporcional = suma_salarios_brutos_periodo / 12
```

- Se paga a más tardar el **20 de diciembre**.
- Si el trabajador no completó el año, recibe la parte proporcional.

🔧 **GAP**: la UI no muestra el aguinaldo acumulado proyectado por empleado en tiempo real. Debe ser visible en el perfil del empleado y en el resumen de planilla.

---

## 10. Validación de Salario Mínimo 🔧 GAP — Por implementar

**Este módulo no existe actualmente.** Es un gap legal crítico.

### 10.1 Comportamiento esperado

Antes de aprobar una planilla (transición `BORRADOR → APROBADA`), el sistema debe verificar que el salario efectivo de cada empleado en el período no sea inferior al salario mínimo legal vigente para su categoría ocupacional.

### 10.2 Fuente de datos

Los salarios mínimos son fijados por el Consejo Nacional de Salarios mediante Decreto Ejecutivo, con actualización semestral (enero y julio). Deben almacenarse en `vpg_legal_params` con su fecha de vigencia, no hardcodeados.

### 10.3 Lógica de comparación

```
salario_efectivo_periodo = salario_bruto_calculado

salario_minimo_aplicable = vpg_legal_params
  WHERE categoria = empleado.categoria_ocupacional
    AND validFrom <= fecha_inicio_periodo
  ORDER BY validFrom DESC
  LIMIT 1

Si salario_efectivo_periodo < salario_minimo_aplicable:
  → Bloquear aprobación de planilla
  → Mostrar alerta por empleado con el monto de la diferencia
```

### 10.4 Comportamiento en UI

- Se muestra una alerta individual por cada empleado que no alcanza el mínimo legal.
- La planilla no puede aprobarse hasta resolver todas las alertas (ajustando el salario o documentando excepción con justificación).
- Las alertas quedan registradas en `vpg_audit_logs`.

---

## 11. Parámetros Legales Configurables en BD 🔧 GAP — Por implementar

### 11.1 Problema actual

Los siguientes valores están hardcodeados en `payrollUtils.ts` y deben migrarse a `vpg_legal_params`:

| Parámetro | Valor actual (hardcoded) | Debe ser |
|-----------|------------------------|----------|
| Horas jornada diurna/día | 8h | Configurable por tipo de jornada |
| Horas jornada diurna/semana | 48h | Configurable |
| Factor overtime | 1.5× | `vpg_legal_params` |
| Factor feriado | 2.0× | `vpg_legal_params` |
| Factor feriado triple | 3.0× | `vpg_legal_params` |
| Tasas CCSS obrero | ~10.67% | `vpg_legal_params` con vigencia |
| Tasas CCSS patronal | ~26.67% | `vpg_legal_params` con vigencia |
| Salarios mínimos por categoría | No existen | `vpg_legal_params` con vigencia |

### 11.2 Modelo de tabla propuesto

```prisma
model VpgLegalParam {
  id           String    @id @default(cuid())
  key          String    // ej: "OT_FACTOR", "CCSS_OBRERO_RATE", "MIN_WAGE_GENERAL"
  value        Decimal
  description  String
  category     String    // "OVERTIME" | "CCSS" | "MIN_WAGE" | "WORKDAY"
  validFrom    DateTime
  validUntil   DateTime?
  createdBy    String
  createdAt    DateTime  @default(now())

  @@map("vpg_legal_params")
}
```

**Regla de consulta:** siempre usar el parámetro con `validFrom <= fecha_calculo` más reciente. Esto garantiza que planillas históricas mantengan los valores correctos aunque los parámetros hayan cambiado.

### 11.3 Sistema de alertas por cambio de parámetros

Cuando un administrador modifique cualquier valor en `vpg_legal_params`, el sistema debe:

1. Registrar el cambio en `vpg_audit_logs` con el valor anterior, el nuevo valor, la fecha de vigencia y el usuario que realizó el cambio.
2. Emitir una notificación interna a todos los usuarios con rol de administración indicando que los parámetros legales han sido actualizados.
3. Si existen planillas en estado `BORRADOR`, mostrar una alerta indicando que deben ser recalculadas con los nuevos valores antes de aprobar.

---

## 12. Configuración de Empresa — Campos Requeridos 🔧 GAP (parcial)

La tabla `vpg_enterprise` debe contener o relacionarse con los siguientes campos. Algunos pueden ya existir; se listan todos los que el motor de cálculo necesita leer:

```prisma
// Campos a agregar/verificar en vpg_enterprise o tabla relacionada

minuteRoundingPolicy        MinuteRoundingPolicy  // EXACT | ALWAYS_UP | NEAREST_QUARTER
roundingPolicyAcknowledged  Boolean               // requerido = true para NEAREST_QUARTER
isCommercialActivity        Boolean               // determina pago de descanso semanal
ordinaryShiftType           ShiftType             // DIURNA | MIXTA | NOCTURNA

enum MinuteRoundingPolicy {
  EXACT            // Modalidad A: proporcional exacto — recomendado
  ALWAYS_UP        // Modalidad B: cuarto de hora superior siempre
  NEAREST_QUARTER  // Modalidad C: cuarto más cercano — requiere confirmación legal
}

enum ShiftType {
  DIURNA    // 8h/día, 48h/semana
  MIXTA     // 7h/día, 42h/semana
  NOCTURNA  // 6h/día, 36h/semana
}
```

---

## 13. Trazabilidad y Auditoría ✅ EN PRODUCCIÓN (parcial)

El sistema ya cuenta con `vpg_audit_logs` y log de recálculos en planilla. Se debe garantizar que cada planilla cerrada registre:

| Dato | Estado |
|------|--------|
| Política de redondeo aplicada al momento del cálculo | 🔧 Por agregar |
| Snapshot de tasas CCSS utilizadas | 🔧 Por agregar |
| Salarios mínimos vigentes al inicio del período | 🔧 Por agregar |
| Desglose completo por componente (base, OT, feriados, descanso, bonos) | ✅ Existe en `EmployeePayroll` |
| Historial de recálculos | ✅ Existe |
| Inconsistencias detectadas | ✅ Existe en `inconsistencies[]` |
| Mensajes generales del período | ✅ Existe en `generalMessages[]` |

El objetivo es que cualquier planilla pueda ser auditada años después y reproducir exactamente los valores calculados, independientemente de cambios posteriores en los parámetros legales.

---

## 14. Flujo General de Generación de Planilla

```
1. PRE-REQUISITOS (configuración de empresa — una sola vez)
   ├── ✅ Tipo de actividad (comercial / no comercial)
   ├── ✅ Modalidad de pago (quincenal / mensual / rango libre)
   ├── ✅ Fechas de corte del período
   ├── 🔧 Tipo de jornada ordinaria (diurna / mixta / nocturna)
   └── 🔧 Política de redondeo de minutos (A / B / C)

2. APERTURA DEL PERÍODO
   ├── ✅ Selección de empleados a incluir
   ├── ✅ Identificación de feriados dentro del período (vpg_company_holidays)
   └── 🔧 Lectura de parámetros legales vigentes desde vpg_legal_params

3. RECOLECCIÓN Y VALIDACIÓN DE MARCAS
   ├── ✅ Marcas de asistencia (vpg_clock_logs) con pares IN/OUT validados
   ├── ✅ Estados de marcas (pending/valid/anomaly/corrected/orphan)
   ├── ✅ Ausencias y ajustes manuales (vpg_clock_log_adjustments)
   └── ✅ Validación de solapamientos y ventanas de marcaje

4. CÁLCULO POR EMPLEADO
   ├── 🔧 Convertir marcas a minutos totales trabajados por día
   ├── 🔧 Aplicar política de redondeo de minutos configurada
   ├── ✅ Clasificar horas: ordinarias vs extraordinarias
   ├── ✅ Aplicar multiplicadores según tipo de día (normal / feriado / descanso)
   ├── ✅ Calcular descanso semanal remunerado (si aplica)
   ├── ✅ Sumar bonos y deducciones por empleado
   ├── 🔧 Verificar salario mínimo legal por categoría ocupacional
   ├── ✅ = Salario Bruto
   ├── ✅ Calcular cuota obrera CCSS
   └── ✅ = Salario Neto a pagar

5. REVISIÓN Y APROBACIÓN
   ├── ✅ Vista previa de planilla completa (wizard paso 4)
   ├── ✅ Indicadores de inconsistencias por empleado
   ├── 🔧 Alerta bloqueante si algún empleado está bajo el salario mínimo
   ├── ✅ Aprobación por administrador (BORRADOR → APROBADA)
   └── ✅ Capacidad de ajuste por empleado y recálculo parcial

6. CIERRE Y DISTRIBUCIÓN
   ├── ✅ Marcar período como PAGADA
   ├── 🔧 Snapshot de parámetros legales usados en el cálculo
   ├── ✅ Acumulación proporcional de aguinaldo
   ├── 🔧 Proyección de aguinaldo visible en UI por empleado
   ├── ✅ Generación de reportes (vpg_audit_logs)
   └── ✅ Envío de recibos por correo (Resend / EmailService)
```

---

## 15. Resumen de Gaps por Prioridad

| Prioridad | Gap | Impacto legal |
|-----------|-----|--------------|
| 🔴 Alta | Migrar constantes de `payrollUtils.ts` a `vpg_legal_params` | Planillas incorrectas si MTSS actualiza tasas o multiplicadores |
| 🔴 Alta | Política de redondeo de minutos configurable por empresa | Art. 17 CT — riesgo ante inspección del MTSS |
| 🔴 Alta | Validación de salario mínimo al aprobar planilla | Infracción directa al Código de Trabajo |
| 🟡 Media | Snapshot de parámetros en planilla cerrada | Trazabilidad para auditorías CCSS/MTSS |
| 🟡 Media | Alertas por modificación de parámetros legales | Prevención operacional |
| 🟡 Media | Proyección de aguinaldo visible en UI | Transparencia y UX |
| 🟢 Baja | Soporte de jornadas mixtas y nocturnas en UI | Casos de uso minoritarios actualmente |

---
Moneda: Colones costarricenses ₡ siempre
Zona horaria: Hora estándar del centro de Costa Rica
---

*VP-Planilla — Verde Pradera Planilla*  
*Elaborado por: Kendall + Alejandro León Marín*  
*Base legal: Código de Trabajo CR · Criterio MTSS DAJ-AER-OFP-714-2023 · Ley CCSS*  
*Última actualización: Abril 2026*