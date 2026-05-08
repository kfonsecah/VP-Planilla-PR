import { http } from './http';
import { AguinaldoAccrual, AguinaldoSummaryRow, AguinaldoProjectionResponse } from '@/types/aguinaldo';

export const aguinaldoService = {
  /**
   * Obtiene el aguinaldo acumulado para un empleado.
   * @param employeeId ID del empleado
   */
  getEmployeeAguinaldo: async (employeeId: number): Promise<AguinaldoAccrual> => {
    return http.get(`/employees/${employeeId}/aguinaldo`);
  },

  /**
   * Obtiene el resumen de aguinaldo para una planilla específica.
   * @param payrollId ID de la planilla
   */
  getPayrollAguinaldoSummary: async (payrollId: number): Promise<AguinaldoSummaryRow[]> => {
    return http.get(`/payroll/${payrollId}/aguinaldo-summary`);
  },

  /**
   * Obtiene la proyección de aguinaldo para todos los empleados activos (o uno específico).
   * @param employeeId ID del empleado (opcional)
   * @param fiscalYear Año fiscal (opcional, default: año actual)
   */
  getProjection: async (employeeId?: number, fiscalYear?: number): Promise<AguinaldoProjectionResponse> => {
    const params = new URLSearchParams();
    if (employeeId !== undefined) params.set('employeeId', String(employeeId));
    if (fiscalYear  !== undefined) params.set('fiscalYear',  String(fiscalYear));
    const query = params.toString() ? `?${params.toString()}` : '';
    return http.get(`/aguinaldo/projection${query}`);
  },
};
