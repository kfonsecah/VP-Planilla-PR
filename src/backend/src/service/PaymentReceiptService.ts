import { prisma } from '../lib/prisma';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

export interface PaymentReceiptData {
  logo_src: string;
  numero_comprobante: string;
  periodo_texto: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  dias_laborados: string;
  empleado_nombre: string;
  empleado_cedula: string;
  empleado_codigo: string;
  empleado_puesto: string;
  empleado_departamento: string;
  empleado_fecha_ingreso: string;
  metodo_pago: string;
  banco: string;
  iban: string;
  fecha_emision: string;
  total_ingresos: string;
  total_deducciones: string;
  neto_pagar: string;
  ingresos: Array<{
    concepto: string;
    detalle: string;
    monto: string;
  }>;
  deducciones: Array<{
    concepto: string;
    detalle: string;
    monto: string;
  }>;
  nombre_empresa: string;
  nombre_patron: string;
  cedula_patron: string;
  telefono: string;
  horas_diurnas: string;
  precio_hora_diurna: string;
  horas_extra_diurnas: string;
  precio_hora_extra_diurna: string;
  salario_base_calculo: string;
}

export class PaymentReceiptService {
  private static buildConsolidatedHtml(receiptHtmlDocuments: string[]): string {
    const bodySections = receiptHtmlDocuments.map((doc) => {
      const bodyMatch = doc.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      return bodyMatch ? bodyMatch[1] : doc;
    });

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    html, body { margin: 0; padding: 0; }
    .receipt-page { page-break-after: always; }
    .receipt-page:last-child { page-break-after: auto; }
  </style>
</head>
<body>
  ${bodySections.map((section) => `<div class="receipt-page">${section}</div>`).join('\n')}
</body>
</html>`;
  }

  private static async renderPdfFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      
      // Esperar a que se rendericen los estilos
      await new Promise(resolve => setTimeout(resolve, 1500));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Obtiene los datos del recibo de pago para un empleado en una planilla específica
   */
  static async getPaymentReceiptData(
    payrollId: number,
    employeeId: number
  ): Promise<PaymentReceiptData> {
    // Obtener información de la planilla
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
      include: {
        vpg_payroll_types: true,
      },
    });

    if (!payroll) {
      throw new Error(`Planilla con ID ${payrollId} no encontrada`);
    }

    // Obtener información del empleado y su registro en la planilla
    const payrollEmployee = await prisma.vpg_payroll_employee.findFirst({
      where: {
        payroll_employee_payroll_id: payrollId,
        payroll_employee_employee_id: employeeId,
      },
      include: {
        vpg_employees: {
          include: {
            vpg_positions: true,
          },
        },
      },
    });

    if (!payrollEmployee) {
      throw new Error(
        `Empleado ${employeeId} no encontrado en la planilla ${payrollId}`
      );
    }

    const employee = payrollEmployee.vpg_employees;

    const periodStart = new Date(payroll.payrolls_period_start);
    const periodEnd = new Date(payroll.payrolls_period_end);
    const daysWorked = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Formatear fechas y moneda
    const formatDate = (date: Date): string => {
      return new Intl.DateTimeFormat('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date));
    };

    const formatCurrency = (amount: number | string): string => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 2,
      }).format(numAmount);
    };

    // Leer horas y pagos guardados en vpg_payroll_employee (ya calculados y persistidos)
    let totalHours = parseFloat(payrollEmployee.payroll_employee_total_hours?.toString() || '0');
    let overtimeHours = parseFloat(payrollEmployee.payroll_employee_overtime_hours?.toString() || '0');
    let regularHours = totalHours - overtimeHours;
    let overtimePay = parseFloat(payrollEmployee.payroll_employee_overtime_pay?.toString() || '0');
    let weeklyRestHours = parseFloat(payrollEmployee.payroll_employee_weekly_rest_hours?.toString() || '0');
    let weeklyRestPay = parseFloat(payrollEmployee.payroll_employee_weekly_rest_pay?.toString() || '0');

    const baseHourlyRate = parseFloat(employee.vpg_positions.position_base_salary.toString());

    // Si los valores guardados están vacíos (NULL), recalcular desde clock logs
    if (totalHours === 0 && overtimeHours === 0) {
      console.log(`[PaymentReceiptService] Datos guardados vacíos para empleado ${employeeId}, recalculando desde clock logs`);
      
      const clockLogs = await prisma.vpg_clock_logs.findMany({
        where: {
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: {
            gte: periodStart,
            lte: new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000 - 1),
          },
        },
        orderBy: { clock_logs_timestamp: 'asc' },
      });

      const REGULAR_HOURS_PER_DAY = 8;

      let calcRegularHours = 0;
      let calcOvertimeHours = 0;

      const logsByDay: Record<string, typeof clockLogs> = {};
      for (const log of clockLogs) {
        const timestamp = log.clock_logs_timestamp;
        if (!timestamp) continue;
        const parsedDate = new Date(timestamp);
        if (isNaN(parsedDate.getTime())) continue;
        const dayKey = parsedDate.toISOString().split('T')[0];
        if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
        logsByDay[dayKey].push(log);
      }

      for (const dayLogs of Object.values(logsByDay)) {
        const sorted = dayLogs.sort(
          (a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime()
        );

        let dayHours = 0;
        for (let i = 0; i + 1 < sorted.length; i += 2) {
          const inTime = sorted[i].clock_logs_timestamp.getTime();
          const outTime = sorted[i + 1].clock_logs_timestamp.getTime();
          dayHours += (outTime - inTime) / (1000 * 60 * 60);
        }

        const regularToday = Math.min(dayHours, REGULAR_HOURS_PER_DAY);
        const overtimeToday = Math.max(0, dayHours - REGULAR_HOURS_PER_DAY);
        calcRegularHours += regularToday;
        calcOvertimeHours += overtimeToday;
      }

      regularHours = Math.round(calcRegularHours * 100) / 100;
      overtimeHours = Math.round(calcOvertimeHours * 100) / 100;
      totalHours = regularHours + overtimeHours;
      overtimePay = Math.round(overtimeHours * baseHourlyRate * 1.5 * 100) / 100;
      weeklyRestHours = Math.round((regularHours / daysWorked) * 6 * 100) / 100;
      weeklyRestPay = Math.round(weeklyRestHours * baseHourlyRate * 100) / 100;
      
      console.log(`[PaymentReceiptService] Valores recalculados: regularHours=${regularHours}, overtimeHours=${overtimeHours}`);
    } else {
      console.log(`[PaymentReceiptService] Usando datos guardados: regularHours=${regularHours}, overtimeHours=${overtimeHours}, totalHours=${totalHours}`);
    }

    const overtimeHourlyRate = overtimeHours > 0 ? Math.round(overtimePay / overtimeHours * 100) / 100 : Math.round(baseHourlyRate * 1.5 * 100) / 100;
    const salarioBase = Math.round(regularHours * baseHourlyRate * 100) / 100;

    // Obtener bonos del empleado para esta planilla
    const bonuses = await prisma.vpg_bonuses.findMany({
      where: {
        bonuses_employee_id: employeeId,
        bonuses_payroll_id: payrollId,
      },
    });

    // Obtener deducciones del empleado para esta planilla
    const deductions = await prisma.vpg_employee_deductions.findMany({
      where: {
        employee_deductions_employee_id: employeeId,
        employee_deductions_payroll_id: payrollId,
      },
      include: {
        vpg_deductions: true,
      },
    });

    // AHORA construir array de ingresos (con valores ya calculados)
    const ingresos: Array<{ concepto: string; detalle: string; monto: string }> = [];

    // Agregar salario base como primer ingreso
    ingresos.push({
      concepto: 'Salario Base',
      detalle: `${regularHours} horas × ₡${Math.round(baseHourlyRate)}`,
      monto: formatCurrency(salarioBase),
    });

    // Agregar horas extra como ingreso
    if (overtimeHours > 0) {
      ingresos.push({
        concepto: 'Horas Extra',
        detalle: `${overtimeHours} horas × ₡${Math.round(overtimeHourlyRate)}`,
        monto: formatCurrency(overtimePay),
      });
    }

    // Agregar descanso semanal como ingreso
    if (weeklyRestHours > 0) {
      ingresos.push({
        concepto: 'Descanso Semanal',
        detalle: `${weeklyRestHours} horas × ₡${Math.round(baseHourlyRate)}`,
        monto: formatCurrency(weeklyRestPay),
      });
    }

    // Agregar bonos como ingresos
    bonuses.forEach((bonus) => {
      ingresos.push({
        concepto: bonus.bonuses_description,
        detalle: `${formatDate(bonus.bonuses_granted_at)}`,
        monto: formatCurrency(parseFloat(bonus.bonuses_amount.toString())),
      });
    });

    console.log(`[PaymentReceiptService] Ingresos para empleado ${employeeId}:`, ingresos);

    // Construir array de deducciones
    const deduccionesArray = deductions.map((deduction) => ({
      concepto: deduction.vpg_deductions.deductions_name,
      detalle: deduction.vpg_deductions.deductions_description,
      monto: `-${formatCurrency(parseFloat(deduction.employee_deductions_amount.toString()))}`,
    }));

    // Calcular totales
    const totalIngresos = parseFloat(
      payrollEmployee.payroll_employee_gross_salary.toString()
    );
    const totalDeducciones = parseFloat(
      payrollEmployee.payroll_employee_total_deductions.toString()
    );
    const netoPagar = parseFloat(
      payrollEmployee.payroll_employee_net_salary.toString()
    );

    // Generar número de comprobante
    const numeroComprobante = `Nº ${new Date().getFullYear()}-${String(payroll.payrolls_id).padStart(3, '0')}-${String(employeeId).padStart(4, '0')}`;

    // Período en texto
    const periodoTexto = `Periodo: ${new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(periodStart)}`;

    // Nombre completo del empleado
    const empleadoNombre = `${employee.employee_first_name} ${employee.employee_middle_name} ${employee.employee_last_name}`.trim();

    const logoPath = path.join(
      __dirname,
      '../../../frontend/public/images/Logo.png'
    );
    const logoBase64 = fs.existsSync(logoPath)
      ? fs.readFileSync(logoPath, 'base64')
      : '';
    const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';

    return {
      logo_src: logoSrc,
      numero_comprobante: numeroComprobante,
      periodo_texto: periodoTexto,
      fecha_inicio: formatDate(payroll.payrolls_period_start),
      fecha_fin: formatDate(payroll.payrolls_period_end),
      fecha_pago: formatDate(payroll.payrolls_payment_date),
      dias_laborados: `${daysWorked} días`,
      empleado_nombre: empleadoNombre,
      empleado_cedula: employee.employee_national_id,
      empleado_codigo: `EMP-${String(employee.employee_id).padStart(5, '0')}`,
      empleado_puesto: employee.vpg_positions.position_name,
      empleado_departamento: 'N/A',
      empleado_fecha_ingreso: formatDate(employee.employee_hire_date),
      metodo_pago: 'N/A',
      banco: 'N/A',
      iban: 'N/A',
      fecha_emision: new Intl.DateTimeFormat('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date()),
      total_ingresos: formatCurrency(totalIngresos),
      total_deducciones: `-${formatCurrency(totalDeducciones)}`,
      neto_pagar: formatCurrency(netoPagar),
      ingresos,
      deducciones: deduccionesArray,
      nombre_empresa: 'VERDE PRADERA',
      nombre_patron: 'VP BAKERY SRL',
      cedula_patron: '3-102-923372',
      telefono: '27710078',
      horas_diurnas: String(Math.round(regularHours * 100) / 100),
      precio_hora_diurna: String(Math.round(baseHourlyRate)),
      horas_extra_diurnas: String(Math.round(overtimeHours * 100) / 100),
      precio_hora_extra_diurna: String(Math.round(overtimeHourlyRate)),
      salario_base_calculo: formatCurrency(salarioBase),
    };
  }

  /**
   * Genera el HTML del comprobante con los datos proporcionados
   */
  static async generateReceiptHTML(data: PaymentReceiptData): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../../templates/payment-receipt-dynamic.html'
    );

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    return template(data);
  }

  /**
   * Genera un PDF del comprobante de pago
   */
  static async generateReceiptPDF(
    payrollId: number,
    employeeId: number
  ): Promise<Buffer> {
    // Obtener datos
    const data = await this.getPaymentReceiptData(payrollId, employeeId);

    // Generar HTML
    const html = await this.generateReceiptHTML(data);

    return this.renderPdfFromHtml(html);
  }

  /**
   * Genera un único PDF con comprobantes de uno o varios empleados.
   * Si se envía un solo empleado, el PDF contiene únicamente ese comprobante.
   * Reutiliza generateReceiptPDF() que ya tiene la lógica correcta de renderizado.
   */
  static async generateConsolidatedReceiptsPDF(
    payrollId: number,
    employeeIds?: number[]
  ): Promise<{ pdf: Buffer; employeeIds: number[] }> {
    let selectedEmployeeIds = (employeeIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (selectedEmployeeIds.length === 0) {
      const rows = await prisma.vpg_payroll_employee.findMany({
        where: { payroll_employee_payroll_id: payrollId },
        select: { payroll_employee_employee_id: true },
        orderBy: { payroll_employee_id: 'asc' },
      });
      selectedEmployeeIds = rows.map((row) => row.payroll_employee_employee_id);
    }

    selectedEmployeeIds = Array.from(new Set(selectedEmployeeIds));

    if (selectedEmployeeIds.length === 0) {
      throw new Error('No hay empleados en la planilla seleccionada');
    }

    // Si es un solo empleado, retornar directamente ese PDF
    if (selectedEmployeeIds.length === 1) {
      const pdf = await this.generateReceiptPDF(payrollId, selectedEmployeeIds[0]);
      return { pdf, employeeIds: selectedEmployeeIds };
    }

    // Para múltiples empleados, generar cada PDF y combinarlos
    const pdfBuffers: Buffer[] = [];
    for (const employeeId of selectedEmployeeIds) {
      const pdf = await this.generateReceiptPDF(payrollId, employeeId);
      pdfBuffers.push(pdf);
    }

    // Combinar todos los PDFs en uno solo
    const mergedPdf = await this.mergePdfs(pdfBuffers);
    return { pdf: mergedPdf, employeeIds: selectedEmployeeIds };
  }

  /**
   * Combina múltiples PDFs en uno solo
   */
  private static async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
    if (pdfBuffers.length === 0) {
      throw new Error('No hay PDFs para combinar');
    }

    if (pdfBuffers.length === 1) {
      return pdfBuffers[0];
    }

    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBuffer = await mergedPdf.save();
    return Buffer.from(mergedPdfBuffer);
  }

  /**
   * Genera comprobantes para todos los empleados de una planilla
   */
  static async generateBatchReceipts(payrollId: number): Promise<Array<{
    employeeId: number;
    employeeName: string;
    pdf: Buffer;
  }>> {
    const payrollEmployees = await prisma.vpg_payroll_employee.findMany({
      where: { payroll_employee_payroll_id: payrollId },
      include: {
        vpg_employees: true,
      },
    });

    const receipts = [];

    for (const pe of payrollEmployees) {
      const pdf = await this.generateReceiptPDF(payrollId, pe.payroll_employee_employee_id);
      receipts.push({
        employeeId: pe.payroll_employee_employee_id,
        employeeName: `${pe.vpg_employees.employee_first_name} ${pe.vpg_employees.employee_last_name}`,
        pdf,
      });
    }

    return receipts;
  }
}
