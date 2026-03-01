import { Request, Response } from 'express';
import { PaymentReceiptService } from '../service/PaymentReceiptService';

export class PaymentReceiptController {
  /**
   * Genera y devuelve el comprobante de pago en PDF para un empleado específico
   * GET /api/payment-receipts/:payrollId/employee/:employeeId
   */
  static async generateReceiptPDF(req: Request, res: Response): Promise<void> {
    try {
      const payrollId = parseInt(req.params.payrollId);
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(payrollId) || isNaN(employeeId)) {
        res.status(400).json({
          error: 'IDs de planilla y empleado deben ser números válidos',
        });
        return;
      }

      const pdfBuffer = await PaymentReceiptService.generateReceiptPDF(
        payrollId,
        employeeId
      );

      // Configurar headers para descarga de PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=comprobante_pago_${payrollId}_${employeeId}.pdf`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error al generar comprobante PDF:', error);
      res.status(500).json({
        error: 'Error al generar el comprobante de pago',
        message: error.message,
      });
    }
  }

  /**
   * Obtiene los datos del comprobante sin generar PDF (para preview)
   * GET /api/payment-receipts/:payrollId/employee/:employeeId/data
   */
  static async getReceiptData(req: Request, res: Response): Promise<void> {
    try {
      const payrollId = parseInt(req.params.payrollId);
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(payrollId) || isNaN(employeeId)) {
        res.status(400).json({
          error: 'IDs de planilla y empleado deben ser números válidos',
        });
        return;
      }

      const data = await PaymentReceiptService.getPaymentReceiptData(
        payrollId,
        employeeId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Error al obtener datos del comprobante:', error);
      res.status(500).json({
        error: 'Error al obtener los datos del comprobante',
        message: error.message,
      });
    }
  }

  /**
   * Genera el HTML del comprobante (para preview en navegador)
   * GET /api/payment-receipts/:payrollId/employee/:employeeId/html
   */
  static async getReceiptHTML(req: Request, res: Response): Promise<void> {
    try {
      const payrollId = parseInt(req.params.payrollId);
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(payrollId) || isNaN(employeeId)) {
        res.status(400).json({
          error: 'IDs de planilla y empleado deben ser números válidos',
        });
        return;
      }

      const data = await PaymentReceiptService.getPaymentReceiptData(
        payrollId,
        employeeId
      );
      const html = await PaymentReceiptService.generateReceiptHTML(data);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      console.error('Error al generar HTML del comprobante:', error);
      res.status(500).json({
        error: 'Error al generar el HTML del comprobante',
        message: error.message,
      });
    }
  }

  /**
   * Genera comprobantes en PDF para todos los empleados de una planilla
   * POST /api/payment-receipts/:payrollId/batch
   */
  static async generateBatchReceipts(req: Request, res: Response): Promise<void> {
    try {
      const payrollId = parseInt(req.params.payrollId);

      if (isNaN(payrollId)) {
        res.status(400).json({
          error: 'ID de planilla debe ser un número válido',
        });
        return;
      }

      const receipts = await PaymentReceiptService.generateBatchReceipts(payrollId);

      // Crear un archivo ZIP con todos los PDFs (requiere una librería adicional)
      // Por ahora, devolvemos información de los archivos generados
      res.status(200).json({
        success: true,
        message: `Se generaron ${receipts.length} comprobantes`,
        receipts: receipts.map((r) => ({
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          size: r.pdf.length,
        })),
      });
    } catch (error: any) {
      console.error('Error al generar comprobantes en lote:', error);
      res.status(500).json({
        error: 'Error al generar los comprobantes en lote',
        message: error.message,
      });
    }
  }
}
