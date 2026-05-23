import { ReportsService } from '../../../service/ReportsService';
import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    vpg_payroll_employee: {
      findMany: jest.fn(),
    },
    vpg_payrolls: {
      findUnique: jest.fn(),
    },
    vpg_employee_deductions: {
      findMany: jest.fn(),
    },
  },
}));

describe('ReportsService - Hacienda D-151', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate gross salary by employee for a given year', async () => {
    const mockData = [
      {
        payroll_employee_gross_salary: 100000,
        vpg_employees: {
          employee_id: 1,
          employee_national_id: '1-1111-1111',
          employee_first_name: 'Juan',
          employee_last_name: 'Perez',
          employee_middle_name: 'Mora',
        },
      },
      {
        payroll_employee_gross_salary: 50000,
        vpg_employees: {
          employee_id: 1,
          employee_national_id: '1-1111-1111',
          employee_first_name: 'Juan',
          employee_last_name: 'Perez',
          employee_middle_name: 'Mora',
        },
      },
      {
        payroll_employee_gross_salary: 200000,
        vpg_employees: {
          employee_id: 2,
          employee_national_id: '2-2222-2222',
          employee_first_name: 'Maria',
          employee_last_name: 'Gomez',
          employee_middle_name: '',
        },
      },
    ];

    (prisma.vpg_payroll_employee.findMany as jest.Mock).mockResolvedValue(mockData);

    const result = await ReportsService.generateHaciendaD151CSV(2025);

    expect(result.filename).toContain('Hacienda_D151_2025');
    expect(result.content).toContain('"Tipo Identificación","Identificación","Nombre / Razón Social","Monto Acumulado","Código de Operación"');
    
    // Juan Perez Mora (J comes before M)
    expect(result.content).toContain('"1","111111111","Juan Perez Mora","150000.00","SP"');
    
    // Maria Gomez
    expect(result.content).toContain('"1","222222222","Maria Gomez","200000.00","SP"');
  });

  it('should remove hyphens from national IDs', async () => {
    const mockData = [
      {
        payroll_employee_gross_salary: 100000,
        vpg_employees: {
          employee_id: 1,
          employee_national_id: '1-1111-1111',
          employee_first_name: 'Juan',
          employee_last_name: 'Perez',
        },
      },
    ];

    (prisma.vpg_payroll_employee.findMany as jest.Mock).mockResolvedValue(mockData);

    const result = await ReportsService.generateHaciendaD151CSV(2025);

    expect(result.content).toContain('"111111111"');
    expect(result.content).not.toContain('"1-1111-1111"');
  });
});

describe('ReportsService - Annual Salary Summary Excel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate totals and deductions by employee and return an excel buffer', async () => {
    const mockPayrollEmployees = [
      {
        payroll_employee_employee_id: 1,
        payroll_employee_gross_salary: 1000000,
        payroll_employee_net_salary: 800000,
        vpg_employees: {
          employee_id: 1,
          employee_national_id: '1-1111-1111',
          employee_first_name: 'Juan',
          employee_last_name: 'Perez',
          employee_middle_name: 'Mora',
        },
      },
    ];

    const mockDeductions = [
      {
        employee_deductions_employee_id: 1,
        employee_deductions_amount: 90000,
        vpg_deductions: { deductions_name: 'CCSS Obrero' },
      },
      {
        employee_deductions_employee_id: 1,
        employee_deductions_amount: 50000,
        vpg_deductions: { deductions_name: 'ISR' },
      },
      {
        employee_deductions_employee_id: 1,
        employee_deductions_amount: 60000,
        vpg_deductions: { deductions_name: 'Ahorro' },
      },
    ];

    (prisma.vpg_payroll_employee.findMany as jest.Mock).mockResolvedValue(mockPayrollEmployees);
    (prisma.vpg_employee_deductions.findMany as jest.Mock).mockResolvedValue(mockDeductions);

    const result = await ReportsService.generateAnnualSalarySummaryExcel(2025);

    expect(result.filename).toContain('Resumen_Anual_Salarios_2025');
    expect(result.buffer).toBeDefined();
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });
});
