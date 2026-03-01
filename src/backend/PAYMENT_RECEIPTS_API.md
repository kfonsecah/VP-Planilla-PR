# API de Comprobantes de Pago (Payment Receipts)

Sistema para generar comprobantes de pago en PDF para empleados de una planilla específica.

## 📋 Endpoints Disponibles

### 1. Generar Comprobante en PDF
Genera y descarga el comprobante de pago en formato PDF para un empleado específico.

**Endpoint:**
```
GET /api/payment-receipts/:payrollId/employee/:employeeId
```

**Parámetros:**
- `payrollId` (number): ID de la planilla
- `employeeId` (number): ID del empleado

**Respuesta:**
- Content-Type: `application/pdf`
- Descarga directa del archivo PDF

**Ejemplo:**
```bash
curl -X GET "http://localhost:3001/api/payment-receipts/1/employee/5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o comprobante.pdf
```

---

### 2. Obtener Datos del Comprobante
Obtiene los datos estructurados del comprobante sin generar el PDF (útil para preview o validación).

**Endpoint:**
```
GET /api/payment-receipts/:payrollId/employee/:employeeId/data
```

**Parámetros:**
- `payrollId` (number): ID de la planilla
- `employeeId` (number): ID del empleado

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "numero_comprobante": "Nº 2026-001-0005",
    "periodo_texto": "Periodo: febrero 2026",
    "fecha_inicio": "01/02/2026",
    "fecha_fin": "28/02/2026",
    "fecha_pago": "05/03/2026",
    "dias_laborados": "28 días",
    "empleado_nombre": "Juan Carlos Pérez García",
    "empleado_cedula": "1-1234-5678",
    "empleado_codigo": "EMP-00005",
    "empleado_puesto": "Desarrollador Senior",
    "empleado_departamento": "Tecnología",
    "empleado_fecha_ingreso": "15/01/2024",
    "metodo_pago": "Transferencia Bancaria",
    "banco": "Banco Nacional de Costa Rica",
    "iban": "CR1201520200123456789",
    "fecha_emision": "26/02/2026 10:30 AM",
    "total_ingresos": "₡1,100,000.00",
    "total_deducciones": "-₡289,870.00",
    "neto_pagar": "₡810,130.00",
    "ingresos": [
      {
        "concepto": "Salario Base",
        "detalle": "Desarrollador Senior",
        "monto": "₡950,000.00"
      },
      {
        "concepto": "Bono por Desempeño",
        "detalle": "28/02/2026",
        "monto": "₡150,000.00"
      }
    ],
    "deducciones": [
      {
        "concepto": "CCSS - Obrero",
        "detalle": "10.67%",
        "monto": "-₡117,370.00"
      },
      {
        "concepto": "Impuesto sobre la Renta",
        "detalle": "Escala progresiva",
        "monto": "-₡85,000.00"
      }
    ]
  }
}
```

**Ejemplo:**
```bash
curl -X GET "http://localhost:3001/api/payment-receipts/1/employee/5/data" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Preview HTML del Comprobante
Genera el HTML renderizado del comprobante (útil para preview en navegador antes de generar PDF).

**Endpoint:**
```
GET /api/payment-receipts/:payrollId/employee/:employeeId/html
```

**Parámetros:**
- `payrollId` (number): ID de la planilla
- `employeeId` (number): ID del empleado

**Respuesta:**
- Content-Type: `text/html`
- HTML completo del comprobante

**Ejemplo:**
```bash
# Abrir en navegador directamente
open "http://localhost:3001/api/payment-receipts/1/employee/5/html"
```

---

### 4. Generar Comprobantes en Lote
Genera comprobantes para todos los empleados de una planilla específica.

**Endpoint:**
```
POST /api/payment-receipts/:payrollId/batch
```

**Parámetros:**
- `payrollId` (number): ID de la planilla

**Respuesta:**
```json
{
  "success": true,
  "message": "Se generaron 15 comprobantes",
  "receipts": [
    {
      "employeeId": 1,
      "employeeName": "Juan Pérez",
      "size": 45678
    },
    {
      "employeeId": 2,
      "employeeName": "María González",
      "size": 45892
    }
  ]
}
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:3001/api/payment-receipts/1/batch" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Estructura de Datos

### PaymentReceiptData
```typescript
interface PaymentReceiptData {
  numero_comprobante: string;        // Nº 2026-001-0005
  periodo_texto: string;             // Periodo: febrero 2026
  fecha_inicio: string;              // 01/02/2026
  fecha_fin: string;                 // 28/02/2026
  fecha_pago: string;                // 05/03/2026
  dias_laborados: string;            // 28 días
  empleado_nombre: string;           // Juan Carlos Pérez García
  empleado_cedula: string;           // 1-1234-5678
  empleado_codigo: string;           // EMP-00005
  empleado_puesto: string;           // Desarrollador Senior
  empleado_departamento: string;     // Tecnología
  empleado_fecha_ingreso: string;    // 15/01/2024
  metodo_pago: string;               // Transferencia Bancaria
  banco: string;                     // Banco Nacional de CR
  iban: string;                      // CR12015202001234567890
  fecha_emision: string;             // 26/02/2026 10:30 AM
  total_ingresos: string;            // ₡1,100,000.00
  total_deducciones: string;         // -₡289,870.00
  neto_pagar: string;                // ₡810,130.00
  ingresos: IngresoItem[];
  deducciones: DeduccionItem[];
}

interface IngresoItem {
  concepto: string;
  detalle: string;
  monto: string;
}

interface DeduccionItem {
  concepto: string;
  detalle: string;
  monto: string;
}
```

---

## 🚀 Uso desde el Frontend

### Ejemplo con Fetch API
```typescript
// Descargar PDF
async function downloadPaymentReceipt(payrollId: number, employeeId: number) {
  const response = await fetch(
    `http://localhost:3001/api/payment-receipts/${payrollId}/employee/${employeeId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comprobante_${employeeId}.pdf`;
  a.click();
}

// Obtener datos para preview
async function getReceiptData(payrollId: number, employeeId: number) {
  const response = await fetch(
    `http://localhost:3001/api/payment-receipts/${payrollId}/employee/${employeeId}/data`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const { data } = await response.json();
  return data;
}
```

### Ejemplo con Axios
```typescript
import axios from 'axios';

// Descargar PDF
async function downloadPDF(payrollId: number, employeeId: number) {
  const response = await axios.get(
    `/api/payment-receipts/${payrollId}/employee/${employeeId}`,
    {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `comprobante_${employeeId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

---

## ⚙️ Configuración

### Variables de Entorno
No se requieren variables de entorno adicionales. El sistema utiliza la configuración existente de Prisma y Express.

### Dependencias
```json
{
  "puppeteer": "^21.x",
  "handlebars": "^4.x",
  "@types/node": "^20.x"
}
```

---

## 📝 Notas Técnicas

1. **Performance**: La generación de PDF puede tomar 2-5 segundos por documento debido a Puppeteer.

2. **Caché**: Se recomienda implementar caché para comprobantes ya generados si se van a solicitar múltiples veces.

3. **Límites**: El endpoint batch está limitado a la cantidad de empleados en la planilla. Para planillas muy grandes (>100 empleados), considere implementar procesamiento asíncrono con jobs.

4. **Template**: El template HTML está ubicado en `/templates/payment-receipt-dynamic.html` y utiliza Handlebars como motor de templates.

5. **Formato**: Los PDFs se generan en formato A4 landscape con márgenes de 10mm.

---

## 🐛 Manejo de Errores

### Códigos de Error Comunes

**400 Bad Request**
```json
{
  "error": "IDs de planilla y empleado deben ser números válidos"
}
```

**404 Not Found**
```json
{
  "error": "Error al generar el comprobante de pago",
  "message": "Planilla con ID 999 no encontrada"
}
```

**500 Internal Server Error**
```json
{
  "error": "Error al generar el comprobante de pago",
  "message": "Error detallado del servidor"
}
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante JWT. Incluye el token en el header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📊 Testing

### Prueba Rápida
```bash
# 1. Verificar que el servicio está funcionando
curl http://localhost:3001/health

# 2. Obtener datos de ejemplo
curl -X GET "http://localhost:3001/api/payment-receipts/1/employee/1/data"

# 3. Ver HTML en navegador
open "http://localhost:3001/api/payment-receipts/1/employee/1/html"

# 4. Descargar PDF
curl -X GET "http://localhost:3001/api/payment-receipts/1/employee/1" -o test.pdf
```

---

## 📄 Licencia

Parte del sistema VP-Planilla. Uso interno únicamente.
