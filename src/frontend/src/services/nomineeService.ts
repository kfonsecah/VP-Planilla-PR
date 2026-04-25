import { http } from './http';

export interface ClockLog {
  id: number;
  employee_id: number;
  date: string;
  hours: number;
  type?: string;
}

export interface EmployeeDeduction {
  id: number;
  employee_id: number;
  deduction_id: number;
  amount: number;
}

export const NomineeService = {
  async getClockLogs(initDate: string, endDate: string): Promise<ClockLog[]> {
    try {
      const query = `?initDate=${encodeURIComponent(initDate)}&endDate=${encodeURIComponent(endDate)}`;
      return await http.get(`/nominee/clocklogs${query}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener registros de marcación');
    }
  },

  async getEmployeeDeductions(employeeId: number): Promise<EmployeeDeduction[]> {
    try {
      return await http.get(`/nominee/employee-deductions/${employeeId}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener deducciones del empleado');
    }
  },

  async calculateNominee(): Promise<unknown> {
    try {
      return await http.post('/nominee/calculate');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al ejecutar cálculo de nómina (legacy)');
    }
  },

  async calculatePayrollForPeriod(startDate: string, endDate: string, payrollId?: number): Promise<unknown> {
    try {
      const payload: { startDate: string; endDate: string; payrollId?: number } = { startDate, endDate };
      if (payrollId) {
        payload.payrollId = payrollId;
      }
      return await http.post('/nominee/calculate-payroll', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al calcular planilla para el periodo');
    }
  },

  async calculateAguinaldo(employeeIds: number[], startDate: string, endDate: string): Promise<unknown> {
    try {
      return await http.post('/nominee/calculate-aguinaldo', {
        employeeIds,
        start_date: startDate,
        end_date: endDate,
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al calcular aguinaldo');
    }
  },
};
