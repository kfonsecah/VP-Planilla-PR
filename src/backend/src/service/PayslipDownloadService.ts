import { prisma } from '../lib/prisma';
import { PaymentReceiptService } from './PaymentReceiptService';

/**
 * Converts a string to a filesystem-safe ASCII slug.
 * Handles accented characters (á→a, ñ→n, etc.) and replaces non-alphanumeric with hyphens.
 */
function toAsciiSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class PayslipDownloadService {
  /**
   * Validates existence of payroll and employee, generates the PDF buffer,
   * and returns it alongside a safe filename for the Content-Disposition header.
   *
   * @param payrollId - ID of the payroll (vpg_payrolls.payrolls_id)
   * @param employeeId - ID of the employee (vpg_employees.employee_id)
   * @returns { buffer, filename } — PDF in memory and suggested filename
   * @throws Error with statusCode=404 if payroll or employee not found
   * @throws Error for PDF generation failures
   */
  static async generatePayslipBuffer(
    payrollId: number,
    employeeId: number
  ): Promise<{ buffer: Buffer; filename: string }> {
    // 1. Verify payroll exists
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
      select: { payrolls_id: true, payrolls_period_start: true },
    });

    if (!payroll) {
      const err = new Error('Planilla no encontrada');
      (err as any).statusCode = 404;
      throw err;
    }

    // 2. Verify employee belongs to this payroll
    const pe = await prisma.vpg_payroll_employee.findFirst({
      where: {
        payroll_employee_payroll_id: payrollId,
        payroll_employee_employee_id: employeeId,
      },
      include: {
        vpg_employees: {
          select: {
            employee_first_name: true,
            employee_last_name: true,
          },
        },
      },
    });

    if (!pe) {
      const err = new Error('El empleado no pertenece a esta planilla');
      (err as any).statusCode = 404;
      throw err;
    }

    // 3. Build filename: comprobante-[nombre]-[apellido]-[YYYY-MM-DD].pdf
    const firstName = toAsciiSlug(pe.vpg_employees.employee_first_name.split(' ')[0]);
    const lastName = toAsciiSlug(pe.vpg_employees.employee_last_name.split(' ')[0]);
    const periodDate = payroll.payrolls_period_start.toISOString().split('T')[0];
    const filename = `comprobante-${firstName}-${lastName}-${periodDate}.pdf`;

    // 4. Generate PDF using the existing generator (never saved to disk)
    const buffer = await PaymentReceiptService.generateReceiptPDF(payrollId, employeeId);

    return { buffer, filename };
  }
}
