import express from 'express';
import { PaymentReceiptController } from '../controller/PaymentReceiptController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @swagger
 * /api/payment-receipts/{payrollId}/employee/{employeeId}:
 *   get:
 *     summary: Genera y descarga el comprobante de pago en PDF
 *     tags: [Payment Receipts]
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la planilla
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del empleado
 *     responses:
 *       200:
 *         description: PDF del comprobante generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Planilla o empleado no encontrado
 *       500:
 *         description: Error al generar el comprobante
 */
router.get(
  '/:payrollId/employee/:employeeId',
  asyncHandler(PaymentReceiptController.generateReceiptPDF)
);

/**
 * @swagger
 * /api/payment-receipts/{payrollId}/employee/{employeeId}/data:
 *   get:
 *     summary: Obtiene los datos del comprobante sin generar PDF
 *     tags: [Payment Receipts]
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la planilla
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del empleado
 *     responses:
 *       200:
 *         description: Datos del comprobante obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Planilla o empleado no encontrado
 *       500:
 *         description: Error al obtener los datos
 */
router.get(
  '/:payrollId/employee/:employeeId/data',
  asyncHandler(PaymentReceiptController.getReceiptData)
);

/**
 * @swagger
 * /api/payment-receipts/{payrollId}/employee/{employeeId}/html:
 *   get:
 *     summary: Genera el HTML del comprobante (para preview)
 *     tags: [Payment Receipts]
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la planilla
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del empleado
 *     responses:
 *       200:
 *         description: HTML del comprobante generado exitosamente
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Planilla o empleado no encontrado
 *       500:
 *         description: Error al generar el HTML
 */
router.get(
  '/:payrollId/employee/:employeeId/html',
  asyncHandler(PaymentReceiptController.getReceiptHTML)
);

/**
 * @swagger
 * /api/payment-receipts/{payrollId}/batch:
 *   post:
 *     summary: Genera comprobantes para todos los empleados de una planilla
 *     tags: [Payment Receipts]
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la planilla
 *     responses:
 *       200:
 *         description: Comprobantes generados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 receipts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employeeId:
 *                         type: integer
 *                       employeeName:
 *                         type: string
 *                       size:
 *                         type: integer
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Planilla no encontrada
 *       500:
 *         description: Error al generar los comprobantes
 */
router.post('/:payrollId/batch', asyncHandler(PaymentReceiptController.generateBatchReceipts));

export default router;
