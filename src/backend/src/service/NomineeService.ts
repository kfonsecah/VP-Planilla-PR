import { Request, Response } from "express";
import { ClockLogsService } from "../service/ClockLogsService";
import { PrismaClient } from "@prisma/client";
import { EmployeeDeductions } from "../model/employeeDeductions";
import { DeductionsPerEmployee } from "../model/deductionsPerEmployee";
import { DeductionsService } from "./DeductionsService";
import { EmployeeService } from "./EmployeeService";
import { PositionService } from "./PositionService";
import { BonusesService } from "./BonusesService";
import { VacationService } from "./VacationService";
import { LaborEventsService } from "./LaborEventsService";
import * as PayrollUtils from "../utils/payrollUtils";

const prisma = new PrismaClient();

/**
 * Interface for payroll calculation period
 */
export interface PayrollPeriod {
  startDate: string;
  endDate: string;
}

/**
 * Interface for daily work information
 */
export interface DayWork {
  date: string;
  hoursWorked: number;
  isVacation: boolean;
  messages: string[];
}

/**
 * Interface for deduction breakdown
 */
export interface DeductionBreakdown {
  code: string;
  type: 'fixed' | 'percent';
  amount: number;
  message: string;
}

/**
 * Interface for employee inconsistencies
 */
export interface Inconsistency {
  date: string;
  message: string;
}

/**
 * Interface for employee payroll data
 */
export interface EmployeePayroll {
  employeeId: string;
  employeeName: string;
  positionId: string;
  baseHourlySalary: number;
  days: DayWork[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  bonuses: number;
  deductionsBreakdown: DeductionBreakdown[];
  inconsistencies: Inconsistency[];
  generalMessages: string[];
}

/**
 * Interface for payroll summary
 */
export interface PayrollSummary {
  employeesProcessed: number;
  employeesWithInconsistencies: number;
  messages: string[];
}

/**
 * Interface for complete payroll calculation result
 */
export interface PayrollCalculationResult {
  period: PayrollPeriod;
  employees: EmployeePayroll[];
  summary: PayrollSummary;
}

export class NomineeService {
  /**
   * Get clock logs for nominee calculation (legacy method)
   * @param req - Express request object with initDate and endDate query parameters
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with clock logs data or error
   */
  async getClockLogs(req: Request, res: Response): Promise<Response> {
    const { initDate, endDate } = req.query;

    if (!initDate || !endDate) {
      return res
        .status(400)
        .json({ error: "initDate and endDate are required" });
    }

    const service = new ClockLogsService();
    try {
      const logs = await service.getClockLogs({
        initDate: new Date(initDate as string),
        endDate: new Date(endDate as string),
      });
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Get employee deductions for a specific employee with full deduction details
   * @param employee_id - The ID of the employee
   * @returns Promise<any[]> - Array of deductions assigned to the employee with details
   */
  async getEmployeeDeductions(employee_id: number): Promise<any[]> {
    try {
      // Use raw SQL to get deductions with full details via JOIN
      const deductions: any[] = await prisma.$queryRaw`
        SELECT 
          dpe.deductions_per_employee_employee_id as employee_id,
          dpe.deductions_per_employee_deduction_id as deduction_id,
          dpe.deductions_per_employee_version as version,
          d.deductions_name as deduction_name,
          d.deductions_description as deduction_description,
          d.deductions_fixed_amount as fixed_amount,
          d.deductions_percentage as percentage
        FROM vpg_deductions_per_employee dpe
        INNER JOIN vpg_deductions d 
          ON dpe.deductions_per_employee_deduction_id = d.deductions_id
        WHERE dpe.deductions_per_employee_employee_id = ${employee_id}
      `;
      
      return deductions.map((d: any) => ({
        employee_id: d.employee_id,
        deduction_id: d.deduction_id,
        version: d.version,
        deduction_name: d.deduction_name,
        deduction_description: d.deduction_description,
        fixed_amount: parseFloat(d.fixed_amount) || 0,
        percentage: parseFloat(d.percentage) || 0,
      }));
    } catch (error) {
      console.error('Error fetching employee deductions:', error);
      // If there's an error, return empty array instead of throwing
      // This allows the UI to show "no deductions" instead of an error
      return [];
    }
  }

  /**
   * Calculate nominee (legacy method - basic implementation)
   * @returns Promise<void>
   * @deprecated Use calculatePayrollForPeriod instead for complete payroll calculations
   */
  async calculateNominee(): Promise<void> {
    console.log('Starting legacy nominee calculation...');
    
    // Init services needed for the process
    const logsService = new ClockLogsService();
    
    // Using current month as default period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const logs = await logsService.getClockLogs({
      initDate: startOfMonth,
      endDate: endOfMonth,
    });

    // Process each log to calculate the nominee
    for (const log of logs) {
      const employeeDeductions = await this.getEmployeeDeductions(
        log.employee_id
      );

      if (!employeeDeductions.length) {
        console.log(`No se encontraron deducciones para el empleado ${log.employee_id}`);
        continue;
      }

      for (const employeeDeduction of employeeDeductions) {
        const deduction = await DeductionsService.getDeductionById(
          employeeDeduction.deduction_id
        );

        if (!deduction) {
          console.log(`Deducción no encontrada con ID: ${employeeDeduction.deduction_id}`);
          continue;
        }

        let sum = 0;
        if (deduction.fixed_amount) {
          sum += deduction.fixed_amount;
        }
        if (deduction.percentage) {
          const employeeSalary = 1000;
          sum += (deduction.percentage / 100) * employeeSalary;
        }

        console.log(
          `Total de deducciones para el empleado ${log.employee_id}: $${sum.toFixed(2)}`
        );
      }
    }
  }

  /**
   * Calculate complete payroll for all employees in a given period
   * @param startDate - Start date of the payroll period (inclusive)
   * @param endDate - End date of the payroll period (inclusive)
   * @returns Promise<PayrollCalculationResult> - Complete payroll calculation with all employee data
   */
  async calculatePayrollForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<PayrollCalculationResult> {
    const result: PayrollCalculationResult = {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      employees: [],
      summary: {
        employeesProcessed: 0,
        employeesWithInconsistencies: 0,
        messages: []
      }
    };

    try {
      // Get all active employees
      const employees = await EmployeeService.getAllEmployees();
      result.summary.employeesProcessed = employees.length;

      console.log(`Processing payroll for ${employees.length} employees from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      for (const employee of employees) {
        try {
          const employeePayroll = await this.calculateEmployeePayroll(
            employee,
            startDate,
            endDate
          );
          
          result.employees.push(employeePayroll);
          
          if (employeePayroll.inconsistencies.length > 0) {
            result.summary.employeesWithInconsistencies++;
          }
          
        } catch (error) {
          console.error(`Error processing employee ${employee.id}:`, error);
          result.summary.messages.push(
            `Error procesando empleado ${employee.name} (ID: ${employee.id}): ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
          
          // Add employee with error state
          result.employees.push({
            employeeId: employee.id.toString(),
            employeeName: employee.name,
            positionId: employee.position_id?.toString() || '0',
            baseHourlySalary: 0,
            days: [],
            grossSalary: 0,
            totalDeductions: 0,
            netSalary: 0,
            bonuses: 0,
            deductionsBreakdown: [],
            inconsistencies: [],
            generalMessages: [`Error al procesar datos del empleado: ${error instanceof Error ? error.message : 'Error desconocido'}`]
          });
        }
      }

      result.summary.messages.push(
        `Procesamiento completado: ${result.employees.length} empleados procesados, ${result.summary.employeesWithInconsistencies} con inconsistencias`
      );

    } catch (error) {
      console.error('Error in payroll calculation:', error);
      result.summary.messages.push(
        `Error general en el cálculo de nómina: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }

    return result;
  }

  /**
   * Calculate payroll for a single employee
   * @param employee - Employee data
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @returns Promise<EmployeePayroll> - Complete payroll data for the employee
   */
  private async calculateEmployeePayroll(
    employee: any,
    startDate: Date,
    endDate: Date
  ): Promise<EmployeePayroll> {
    const employeePayroll: EmployeePayroll = {
      employeeId: employee.id.toString(),
      employeeName: employee.name,
      positionId: employee.position_id?.toString() || '0',
      baseHourlySalary: 0,
      days: [],
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0,
      bonuses: 0,
      deductionsBreakdown: [],
      inconsistencies: [],
      generalMessages: []
    };

    try {
      // Get employee position and salary
      if (employee.position_id) {
        const position = await PositionService.getPositionById(employee.position_id);
        if (position) {
          // Assuming base_salary is monthly, convert to hourly (assuming 160 hours/month)
          employeePayroll.baseHourlySalary = PayrollUtils.roundToMoney(position.base_salary / 160);
        } else {
          employeePayroll.generalMessages.push(
            `Advertencia: No se encontró información del puesto (ID: ${employee.position_id}). Usando salario base de 0.`
          );
        }
      } else {
        employeePayroll.generalMessages.push(
          'Advertencia: Empleado sin puesto asignado. Usando salario base de 0.'
        );
      }

      // Get clock logs for the period
      const clockLogsService = new ClockLogsService();
      const clockLogs = await clockLogsService.getClockLogs({
        initDate: startDate,
        endDate: endDate
      });
      
      const employeeClockLogs = clockLogs.filter(log => log.employee_id === employee.id);
      
      // Get vacations for the period
      const vacations = await VacationService.getAllVacations();
      const employeeVacations = vacations.filter(
        vacation => vacation.employee_id === employee.id &&
        vacation.paid &&
        this.dateRangesOverlap(
          vacation.start_date,
          vacation.end_date,
          startDate,
          endDate
        )
      );

      // Process daily work
      const dailyWork = this.processDailyWork(
        employeeClockLogs,
        employeeVacations,
        startDate,
        endDate,
        employee.name
      );
      
      employeePayroll.days = dailyWork.days;
      employeePayroll.inconsistencies = dailyWork.inconsistencies;

      // Calculate total hours worked
      const totalHoursWorked = dailyWork.days.reduce((sum, day) => sum + day.hoursWorked, 0);
      
      // Get bonuses for the period
      employeePayroll.bonuses = await this.calculateBonuses(employee.id, startDate, endDate);
      
      // Calculate gross salary
      employeePayroll.grossSalary = PayrollUtils.roundToMoney(
        totalHoursWorked * employeePayroll.baseHourlySalary + employeePayroll.bonuses
      );
      
      // Calculate deductions
      const deductionsData = await this.calculateDeductions(
        employee.id,
        employeePayroll.grossSalary
      );
      
      employeePayroll.totalDeductions = deductionsData.total;
      employeePayroll.deductionsBreakdown = deductionsData.breakdown;
      
      // Calculate net salary (never negative)
      const originalNetSalary = employeePayroll.grossSalary - employeePayroll.totalDeductions;
      employeePayroll.netSalary = PayrollUtils.calculateNetSalary(
        employeePayroll.grossSalary, 
        employeePayroll.totalDeductions
      );
      
      if (originalNetSalary < 0) {
        employeePayroll.generalMessages.push(
          'Advertencia: Salario neto calculado como negativo, se estableció en 0.'
        );
      }
      
    } catch (error) {
      console.error(`Error calculating payroll for employee ${employee.id}:`, error);
      employeePayroll.generalMessages.push(
        `Error en el cálculo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }

    return employeePayroll;
  }

  /**
   * Process daily work including clock logs and vacations
   * @param clockLogs - Employee clock logs for the period
   * @param vacations - Employee vacations for the period
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @param employeeName - Employee name for messages
   * @returns Object with processed days and inconsistencies
   */
  private processDailyWork(
    clockLogs: any[],
    vacations: any[],
    startDate: Date,
    endDate: Date,
    employeeName: string
  ): { days: DayWork[]; inconsistencies: Inconsistency[] } {
    const days: DayWork[] = [];
    const inconsistencies: Inconsistency[] = [];

    // Generate all dates in the period
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayWork: DayWork = {
        date: dateStr,
        hoursWorked: 0,
        isVacation: false,
        messages: []
      };

      // Check if it's a vacation day
      const isVacationDay = vacations.some(vacation => {
        const vacStart = new Date(vacation.start_date);
        const vacEnd = new Date(vacation.end_date);
        return currentDate >= vacStart && currentDate <= vacEnd;
      });

      if (isVacationDay) {
        dayWork.isVacation = true;
        dayWork.hoursWorked = 8.0; // Standard vacation day hours
        
        // Check if there are also clock logs for this vacation day
        const dayClockLogs = clockLogs.filter(log => {
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          return logDate === dateStr;
        });
        
        if (dayClockLogs.length > 0) {
          dayWork.messages.push(
            `Advertencia para ${employeeName} el ${dateStr}: día de vacaciones con marcajes detectados. Se prioriza vacaciones (8h).`
          );
        }
      } else {
        // Process clock logs for the day
        const dayClockLogs = clockLogs.filter(log => {
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          return logDate === dateStr;
        });

        if (dayClockLogs.length === 0) {
          // No clock logs for this day - this is normal for weekends/days off
          dayWork.hoursWorked = 0;
        } else {
          const hoursData = this.calculateDailyHours(dayClockLogs, dateStr, employeeName);
          dayWork.hoursWorked = hoursData.hours;
          dayWork.messages = hoursData.messages;
          
          if (hoursData.hasInconsistency) {
            inconsistencies.push({
              date: dateStr,
              message: hoursData.messages[hoursData.messages.length - 1] || `Inconsistencia de marcaje para ${employeeName} el ${dateStr}`
            });
          }
        }
      }

      days.push(dayWork);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { days, inconsistencies };
  }

  /**
   * Calculate daily worked hours from clock logs
   * @param dayClockLogs - Clock logs for a specific day
   * @param dateStr - Date string for messages
   * @param employeeName - Employee name for messages
   * @returns Object with calculated hours and messages
   */
  private calculateDailyHours(
    dayClockLogs: any[],
    dateStr: string,
    employeeName: string
  ): { hours: number; messages: string[]; hasInconsistency: boolean } {
    const messages: string[] = [];
    
    // Use utility function to validate clock log pairs
    const validation = PayrollUtils.validateClockLogPairs(dayClockLogs);
    
    if (!validation.isValid) {
      const inconsistencyMsg = `Inconsistencia de marcaje para ${employeeName} el ${dateStr}: ${validation.messages.join(', ')}. Revisar el marcaje manualmente.`;
      messages.push(inconsistencyMsg);
      return { hours: 0, messages, hasInconsistency: true };
    }
    
    // Check for overlapping pairs
    if (PayrollUtils.hasOverlappingPairs(validation.pairs)) {
      messages.push(
        `Inconsistencia de marcaje para ${employeeName} el ${dateStr}: periodos de trabajo superpuestos detectados. Revisar.`
      );
      return { hours: 0, messages, hasInconsistency: true };
    }
    
    // Calculate total hours from valid pairs
    const totalHours = PayrollUtils.calculateTotalHoursFromPairs(validation.pairs);
    
    return {
      hours: totalHours,
      messages,
      hasInconsistency: false
    };
  }

  /**
   * Calculate bonuses for an employee in the given period
   * @param employeeId - Employee ID
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @returns Promise<number> - Total bonus amount
   */
  private async calculateBonuses(
    employeeId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // This would need to be implemented based on your bonus structure
      // For now, returning 0 as bonuses service doesn't have a method to get by employee and period
      return 0;
    } catch (error) {
      console.error(`Error calculating bonuses for employee ${employeeId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate deductions for an employee
   * @param employeeId - Employee ID
   * @param grossSalary - Employee gross salary for percentage calculations
   * @returns Promise with total deductions and breakdown
   */
  private async calculateDeductions(
    employeeId: number,
    grossSalary: number
  ): Promise<{ total: number; breakdown: DeductionBreakdown[] }> {
    const breakdown: DeductionBreakdown[] = [];
    let total = 0;

    try {
      const employeeDeductions = await this.getEmployeeDeductions(employeeId);
      
      for (const empDeduction of employeeDeductions) {
        try {
          const deduction = await DeductionsService.getDeductionById(empDeduction.deduction_id);
          
          if (!deduction) {
            breakdown.push({
              code: `DED_${empDeduction.deduction_id}`,
              type: 'fixed',
              amount: 0,
              message: `Deducción no encontrada (ID: ${empDeduction.deduction_id})`
            });
            continue;
          }

          let amount = 0;
          let type: 'fixed' | 'percent' = 'fixed';
          
          if (deduction.fixed_amount) {
            amount = PayrollUtils.roundToMoney(deduction.fixed_amount);
            type = 'fixed';
          } else if (deduction.percentage) {
            amount = PayrollUtils.applyPercentageDeduction(grossSalary, deduction.percentage);
            type = 'percent';
          }
          
          breakdown.push({
            code: deduction.name.replace(/\s+/g, '_').toUpperCase(),
            type,
            amount,
            message: `${deduction.name}: ${type === 'percent' ? `${deduction.percentage}%` : `$${deduction.fixed_amount}`}`
          });
          
          total += amount;
          
        } catch (error) {
          console.error(`Error processing deduction ${empDeduction.deduction_id}:`, error);
          breakdown.push({
            code: `DED_${empDeduction.deduction_id}`,
            type: 'fixed',
            amount: 0,
            message: `Error procesando deducción: ${error instanceof Error ? error.message : 'Error desconocido'}`
          });
        }
      }
      
    } catch (error) {
      console.error(`Error calculating deductions for employee ${employeeId}:`, error);
    }

    return {
      total: PayrollUtils.roundToMoney(total),
      breakdown
    };
  }

  /**
   * Check if two date ranges overlap
   * @param start1 - Start date of first range
   * @param end1 - End date of first range
   * @param start2 - Start date of second range
   * @param end2 - End date of second range
   * @returns boolean - True if ranges overlap
   */
  private dateRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }
}
