import { Request, Response } from "express";
import { ClockLogsService } from "../service/ClockLogsService";
import { prisma } from "../lib/prisma";
import { EmployeeDeductions } from "../model/employeeDeductions";
import { DeductionsPerEmployee } from "../model/deductionsPerEmployee";
import { DeductionsService } from "./DeductionsService";
import { EmployeeService } from "./EmployeeService";
import { PositionService } from "./PositionService";
import { BonusesService } from "./BonusesService";
import { VacationService } from "./VacationService";
import { LaborEventsService } from "./LaborEventsService";
import * as PayrollUtils from "../utils/payrollUtils";
import {
  PayrollPeriod,
  DayWork,
  DeductionBreakdown,
  Inconsistency,
  EmployeePayroll,
  PayrollSummary,
  PayrollCalculationResult,
} from "../types/payroll.types";
import { Decimal } from "@prisma/client/runtime/library";

// Re-export types so existing consumers importing from NomineeService continue to work
export type {
  PayrollPeriod,
  DayWork,
  DeductionBreakdown,
  Inconsistency,
  EmployeePayroll,
  PayrollSummary,
  PayrollCalculationResult,
};

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
      // Use Prisma client to ensure same schema/connection settings as the rest of the app
      const assignments = await prisma.vpg_deductions_per_employee.findMany({
        where: { deductions_per_employee_employee_id: employee_id },
      });

      if (!assignments || assignments.length === 0) {
        console.log(
          `[Payroll] No deductions assigned for employee ${employee_id}`,
        );
        return [];
      }

      const deductionIds = assignments.map(
        (a) => a.deductions_per_employee_deduction_id,
      );
      const deductionRows = await prisma.vpg_deductions.findMany({
        where: { deductions_id: { in: deductionIds } },
      });

      const mapped = assignments.map((a) => {
        const d = deductionRows.find(
          (dr) => dr.deductions_id === a.deductions_per_employee_deduction_id,
        );
        return {
          employee_id: a.deductions_per_employee_employee_id,
          deduction_id: a.deductions_per_employee_deduction_id,
          version: a.deductions_per_employee_version,
          deduction_name: d?.deductions_name || "",
          deduction_description: d?.deductions_description || "",
          fixed_amount:
            d?.deductions_fixed_amount != null
              ? Number(d.deductions_fixed_amount)
              : 0,
          percentage:
            d?.deductions_percentage != null
              ? Number(d.deductions_percentage)
              : 0,
        };
      });

      console.log(
        `[Payroll] Employee ${employee_id} deductions loaded:`,
        mapped,
      );
      return mapped;
    } catch (error) {
      console.error("Error fetching employee deductions:", error);
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
    console.log("Starting legacy nominee calculation...");

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
        log.employee_id,
      );

      if (!employeeDeductions.length) {
        console.log(
          `No se encontraron deducciones para el empleado ${log.employee_id}`,
        );
        continue;
      }

      for (const employeeDeduction of employeeDeductions) {
        const deduction = await DeductionsService.getDeductionById(
          employeeDeduction.deduction_id,
        );

        if (!deduction) {
          console.log(
            `Deducción no encontrada con ID: ${employeeDeduction.deduction_id}`,
          );
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
          `Total de deducciones para el empleado ${log.employee_id}: $${sum.toFixed(2)}`,
        );
      }
    }
  }

  /**
   * Save payroll employee calculations to the database
   * @param payrollId - The ID of the payroll to associate the employee records with
   * @param employees - Array of employee payroll data to save
   * @returns Promise<number> - Number of records saved
   */
  async savePayrollEmployees(
    payrollId: number,
    employees: EmployeePayroll[],
  ): Promise<number> {
    let savedCount = 0;

    // Resolve period dates from the payroll record so we can fill year/month in deductions
    const payrollRecord = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
    });
    const periodStart = payrollRecord?.payrolls_period_start ?? new Date();
    const deductionYear = periodStart.getFullYear();
    const deductionMonth = periodStart.getMonth() + 1;

    for (const employee of employees) {
      try {
        // Check if record already exists for this payroll and employee
        const existing = await prisma.vpg_payroll_employee.findFirst({
          where: {
            payroll_employee_payroll_id: payrollId,
            payroll_employee_employee_id: Number(employee.employeeId),
          },
        });

        if (existing) {
          // Update existing record
          await prisma.vpg_payroll_employee.update({
            where: {
              payroll_employee_id: existing.payroll_employee_id,
            },
            data: {
              payroll_employee_total_hours:
                employee.regularHours + employee.overtimeHours,
              payroll_employee_overtime_hours: employee.overtimeHours,
              payroll_employee_overtime_pay: employee.overtimePay,
              payroll_employee_weekly_rest_hours: employee.weeklyRestHours,
              payroll_employee_weekly_rest_pay: employee.weeklyRestPay,
              payroll_employee_bonuses: employee.bonuses,
              payroll_employee_gross_salary: employee.grossSalary,
              payroll_employee_total_deductions: employee.totalDeductions,
              payroll_employee_net_salary: employee.netSalary,
              payroll_employee_version: existing.payroll_employee_version + 1,
            },
          });
          console.log(
            `Updated payroll employee record for employee ${employee.employeeId}`,
          );
        } else {
          // Create new record
          await prisma.vpg_payroll_employee.create({
            data: {
              payroll_employee_payroll_id: payrollId,
              payroll_employee_employee_id: Number(employee.employeeId),
              payroll_employee_total_hours:
                employee.regularHours + employee.overtimeHours,
              payroll_employee_overtime_hours: employee.overtimeHours,
              payroll_employee_overtime_pay: employee.overtimePay,
              payroll_employee_weekly_rest_hours: employee.weeklyRestHours,
              payroll_employee_weekly_rest_pay: employee.weeklyRestPay,
              payroll_employee_bonuses: employee.bonuses,
              payroll_employee_gross_salary: employee.grossSalary,
              payroll_employee_total_deductions: employee.totalDeductions,
              payroll_employee_net_salary: employee.netSalary,
              payroll_employee_version: 1,
            },
          });
          console.log(
            `Created payroll employee record for employee ${employee.employeeId}`,
          );
        }

        // Persist individual deduction amounts to vpg_employee_deductions
        for (const ded of employee.deductionsBreakdown) {
          if (!ded.deduction_id || ded.amount <= 0) continue;
          await prisma.vpg_employee_deductions.upsert({
            where: {
              employee_deductions_employee_id_employee_deductions_deduction_id_employee_deductions_payroll_id:
                {
                  employee_deductions_employee_id: Number(employee.employeeId),
                  employee_deductions_deduction_id: ded.deduction_id,
                  employee_deductions_payroll_id: payrollId,
                },
            },
            create: {
              employee_deductions_employee_id: Number(employee.employeeId),
              employee_deductions_deduction_id: ded.deduction_id,
              employee_deductions_payroll_id: payrollId,
              employee_deductions_year: deductionYear,
              employee_deductions_month: deductionMonth,
              employee_deductions_amount: ded.amount,
              employee_deductions_version: 1,
            },
            update: {
              employee_deductions_amount: ded.amount,
              employee_deductions_version: { increment: 1 },
            },
          });
        }

        savedCount++;
      } catch (error) {
        console.error(
          `Error saving payroll employee ${employee.employeeId}:`,
          error,
        );
        throw error;
      }
    }

    return savedCount;
  }

  /**
   * Calculate complete payroll for all employees in a given period
   * @param startDate - Start date of the payroll period (inclusive)
   * @param endDate - End date of the payroll period (inclusive)
   * @param payrollId - Optional payroll ID to save results to database
   * @returns Promise<PayrollCalculationResult> - Complete payroll calculation with all employee data
   */
  async calculatePayrollForPeriod(
    startDate: Date,
    endDate: Date,
    payrollId?: number,
  ): Promise<PayrollCalculationResult> {
    const result: PayrollCalculationResult = {
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      employees: [],
      summary: {
        employeesProcessed: 0,
        employeesWithInconsistencies: 0,
        messages: [],
      },
    };

    try {
      // Try to get employees eligible for payroll in the given period
      let employees = await EmployeeService.getActiveEmployeesForPeriod(
        startDate,
        endDate,
      );

      // If none found, fallback to all employees to aid troubleshooting and avoid returning an empty result silently
      if (employees.length === 0) {
        const allEmployees = await EmployeeService.getAllEmployees();
        result.summary.messages.push(
          `No se encontraron empleados activos para el periodo. Total en sistema: ${allEmployees.length}.` +
            `${allEmployees.length > 0 ? " Verifique estado (A/V), fechas de contratación/salida y bandera de despedido." : ""}`,
        );
        employees = allEmployees;
      }

      result.summary.employeesProcessed = employees.length;

      console.log(
        `Processing payroll for ${employees.length} employees from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      );

      for (const employee of employees) {
        try {
          const employeePayroll = await this.calculateEmployeePayroll(
            employee,
            startDate,
            endDate,
          );

          result.employees.push(employeePayroll);

          if (employeePayroll.inconsistencies.length > 0) {
            result.summary.employeesWithInconsistencies++;
          }
        } catch (error) {
          console.error(`Error processing employee ${employee.id}:`, error);
          result.summary.messages.push(
            `Error procesando empleado ${employee.name} (ID: ${employee.id}): ${error instanceof Error ? error.message : "Error desconocido"}`,
          );

          // Add employee with error state
          result.employees.push({
            employeeId: employee.id.toString(),
            employeeName: employee.name,
            positionId: employee.position_id?.toString() || "0",
            baseHourlySalary: 0,
            days: [],
            grossSalary: 0,
            totalDeductions: 0,
            netSalary: 0,
            bonuses: 0,
            deductionsBreakdown: [],
            inconsistencies: [],
            generalMessages: [
              `Error al procesar datos del empleado: ${error instanceof Error ? error.message : "Error desconocido"}`,
            ],
            // Hour breakdown defaults
            scheduledHours: PayrollUtils.calculateScheduledHours(
              startDate,
              endDate,
            ),
            regularHours: 0,
            overtimeHours: 0,
            weeklyRestHours: 0,
            weeklyRestPay: 0,
            overtimePay: 0,
            // Frontend compatibility aliases
            id: Number(employee.id),
            employee_id: Number(employee.id),
            name: employee.name,
            employee_name: employee.name,
            national_id: employee.national_id || "",
            position: "",
            position_name: "",
          });
        }
      }

      result.summary.messages.push(
        `Procesamiento completado: ${result.employees.length} empleados procesados, ${result.summary.employeesWithInconsistencies} con inconsistencias`,
      );

      // Save to database if payrollId is provided
      if (payrollId && result.employees.length > 0) {
        try {
          const savedCount = await this.savePayrollEmployees(
            payrollId,
            result.employees,
          );
          result.summary.messages.push(
            `Registros guardados en base de datos: ${savedCount} de ${result.employees.length}`,
          );
          console.log(
            `Saved ${savedCount} payroll employee records to database for payroll ${payrollId}`,
          );
        } catch (error) {
          console.error("Error saving payroll employees to database:", error);
          result.summary.messages.push(
            `Error al guardar en base de datos: ${error instanceof Error ? error.message : "Error desconocido"}`,
          );
        }
      }
    } catch (error) {
      console.error("Error in payroll calculation:", error);
      result.summary.messages.push(
        `Error general en el cálculo de nómina: ${error instanceof Error ? error.message : "Error desconocido"}`,
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
    endDate: Date,
  ): Promise<EmployeePayroll> {
    const employeePayroll: EmployeePayroll = {
      employeeId: employee.id.toString(),
      employeeName: employee.name,
      positionId: employee.position_id?.toString() || "0",
      baseHourlySalary: 0,
      days: [],
      // Hour breakdown (populated after processDailyWork)
      scheduledHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      weeklyRestHours: 0,
      weeklyRestPay: 0,
      overtimePay: 0,
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0,
      bonuses: 0,
      deductionsBreakdown: [],
      inconsistencies: [],
      generalMessages: [],
      // Frontend compatibility aliases
      id: Number(employee.id),
      employee_id: Number(employee.id),
      name: employee.name,
      employee_name: employee.name,
      identification: employee.national_id || employee.identification || "",
      employee_identification:
        employee.national_id || employee.identification || "",
      national_id: employee.national_id || employee.identification || "",
      position: "",
      position_name: "",
    };

    try {
      // Get employee position and salary
      if (employee.position_id) {
        const position = await PositionService.getPositionById(
          employee.position_id,
        );
        if (position) {
          // Treat base_salary as hourly rate directly
          employeePayroll.baseHourlySalary = PayrollUtils.roundToMoney(
            position.base_salary,
          );
          employeePayroll.position = position.name;
          employeePayroll.position_name = position.name;
        } else {
          employeePayroll.generalMessages.push(
            `Advertencia: No se encontró información del puesto (ID: ${employee.position_id}). Usando salario base de 0.`,
          );
        }
      } else {
        employeePayroll.generalMessages.push(
          "Advertencia: Empleado sin puesto asignado. Usando salario base de 0.",
        );
      }

      // Get clock logs for the period
      const clockLogsService = new ClockLogsService();
      const clockLogs = await clockLogsService.getClockLogs({
        initDate: startDate,
        endDate: endDate,
      });

      const employeeClockLogs = clockLogs.filter(
        (log) => log.employee_id === employee.id,
      );

      // Get vacations for the period
      const vacations = await VacationService.getAllVacations();
      const employeeVacations = vacations.filter(
        (vacation) =>
          vacation.employee_id === employee.id &&
          vacation.paid &&
          this.dateRangesOverlap(
            vacation.start_date,
            vacation.end_date,
            startDate,
            endDate,
          ),
      );

      // Get active labor events (suspension, disability, etc.) overlapping the period
      const employeeLaborEvents =
        await prisma.vpg_employee_labor_event.findMany({
          where: {
            employee_labor_event_employee_id: employee.id,
            employee_labor_event_start_date: { lte: endDate },
            OR: [
              { employee_labor_event_end_date: null },
              { employee_labor_event_end_date: { gte: startDate } },
            ],
          },
          include: { vpg_labor_events: true },
        });

      // Process daily work
      const dailyWork = this.processDailyWork(
        employeeClockLogs,
        employeeVacations,
        employeeLaborEvents,
        startDate,
        endDate,
        employee.name,
      );

      employeePayroll.days = dailyWork.days;
      employeePayroll.inconsistencies = dailyWork.inconsistencies;

      // Scheduled (required) hours for the period
      // Use employee's configured hours if available, otherwise calculate from period
      if (
        employee.required_hours_biweekly &&
        employee.required_hours_biweekly > 0
      ) {
        employeePayroll.scheduledHours = employee.required_hours_biweekly;
      } else {
        employeePayroll.scheduledHours = PayrollUtils.calculateScheduledHours(
          startDate,
          endDate,
        );
      }

      // Calculate regular hours (all hours worked, will be split below)
      const totalHoursWorked = dailyWork.days.reduce(
        (sum, day) => sum + day.hoursWorked,
        0,
      );

      // Split hours into regular vs overtime based on biweekly requirement
      if (
        employee.required_hours_biweekly &&
        employee.required_hours_biweekly > 0
      ) {
        // Use biweekly requirement for overtime calculation
        employeePayroll.regularHours = Math.min(
          totalHoursWorked,
          employee.required_hours_biweekly,
        );
        employeePayroll.overtimeHours =
          PayrollUtils.calculateOvertimeHoursBiweekly(
            totalHoursWorked,
            employee.required_hours_biweekly,
          );
      } else {
        // Fallback to per-day calculation if no biweekly requirement set
        employeePayroll.regularHours = PayrollUtils.calculateRegularHours(
          dailyWork.days,
        );
        employeePayroll.overtimeHours = PayrollUtils.calculateOvertimeHours(
          dailyWork.days,
        );
      }
      employeePayroll.weeklyRestHours = PayrollUtils.calculateWeeklyRestHours(
        employeePayroll.regularHours,
        startDate,
        endDate,
      );
      // Calculate pay directly from already-computed hours to ensure consistency
      employeePayroll.weeklyRestPay = PayrollUtils.roundToMoney(
        employeePayroll.weeklyRestHours * employeePayroll.baseHourlySalary,
      );
      employeePayroll.overtimePay = PayrollUtils.roundToMoney(
        employeePayroll.overtimeHours * employeePayroll.baseHourlySalary * 1.5,
      );

      // Get bonuses for the period
      employeePayroll.bonuses = await this.calculateBonuses(
        employee.id,
        startDate,
        endDate,
      );

      // Gross salary = regular pay + overtime pay (×1.5) + weekly rest pay + bonuses
      // Use already-computed values for consistency
      employeePayroll.grossSalary = PayrollUtils.roundToMoney(
        employeePayroll.regularHours * employeePayroll.baseHourlySalary +
          employeePayroll.overtimePay +
          employeePayroll.weeklyRestPay +
          employeePayroll.bonuses,
      );

      // Calculate deductions
      const deductionsData = await this.calculateDeductions(
        employee.id,
        employeePayroll.grossSalary,
      );

      employeePayroll.totalDeductions = deductionsData.total;
      employeePayroll.deductionsBreakdown = deductionsData.breakdown;

      // Calculate net salary (never negative)
      const originalNetSalary =
        employeePayroll.grossSalary - employeePayroll.totalDeductions;
      employeePayroll.netSalary = PayrollUtils.calculateNetSalary(
        employeePayroll.grossSalary,
        employeePayroll.totalDeductions,
      );

      if (originalNetSalary < 0) {
        employeePayroll.generalMessages.push(
          "Advertencia: Salario neto calculado como negativo, se estableció en 0.",
        );
      }
    } catch (error) {
      console.error(
        `Error calculating payroll for employee ${employee.id}:`,
        error,
      );
      employeePayroll.generalMessages.push(
        `Error en el cálculo: ${error instanceof Error ? error.message : "Error desconocido"}`,
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
    laborEvents: any[],
    startDate: Date,
    endDate: Date,
    employeeName: string,
  ): { days: DayWork[]; inconsistencies: Inconsistency[] } {
    const days: DayWork[] = [];
    const inconsistencies: Inconsistency[] = [];

    // Generate all dates in the period
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayWork: DayWork = {
        date: dateStr,
        hoursWorked: 0,
        isVacation: false,
        messages: [],
      };

      // Check if it's a vacation day
      const isVacationDay = vacations.some((vacation) => {
        const vacStart = new Date(vacation.start_date);
        const vacEnd = new Date(vacation.end_date);
        return currentDate >= vacStart && currentDate <= vacEnd;
      });

      // Check if the day is covered by a labor event (suspension, disability, etc.)
      const laborEventForDay = laborEvents.find((ev) => {
        const evStart = new Date(ev.employee_labor_event_start_date);
        const evEnd = ev.employee_labor_event_end_date
          ? new Date(ev.employee_labor_event_end_date)
          : endDate;
        return currentDate >= evStart && currentDate <= evEnd;
      });

      if (isVacationDay) {
        dayWork.isVacation = true;
        dayWork.hoursWorked = 8.0; // Standard vacation day hours

        // Check if there are also clock logs for this vacation day
        const dayClockLogs = clockLogs.filter((log) => {
          const logDate = new Date(log.timestamp).toISOString().split("T")[0];
          return logDate === dateStr;
        });

        if (dayClockLogs.length > 0) {
          dayWork.messages.push(
            `Advertencia para ${employeeName} el ${dateStr}: día de vacaciones con marcajes detectados. Se prioriza vacaciones (8h).`,
          );
        }
      } else if (laborEventForDay) {
        // Labor event active — no clock-in expected, hours are 0
        dayWork.hoursWorked = 0;
        const eventName =
          laborEventForDay.vpg_labor_events?.labor_events_name ||
          laborEventForDay.employee_labor_event_status ||
          "Evento";
        dayWork.messages.push(
          `${eventName} registrado para ${employeeName} el ${dateStr}: sin marcaje requerido.`,
        );
      } else {
        // Process clock logs for the day
        const dayClockLogs = clockLogs.filter((log) => {
          const logDate = new Date(log.timestamp).toISOString().split("T")[0];
          return logDate === dateStr;
        });

        if (dayClockLogs.length === 0) {
          // No clock logs for this day - this is normal for weekends/days off
          dayWork.hoursWorked = 0;
        } else {
          const hoursData = this.calculateDailyHours(
            dayClockLogs,
            dateStr,
            employeeName,
          );
          dayWork.hoursWorked = hoursData.hours;
          dayWork.messages = hoursData.messages;

          if (hoursData.hasInconsistency) {
            inconsistencies.push({
              date: dateStr,
              message:
                hoursData.messages[hoursData.messages.length - 1] ||
                `Inconsistencia de marcaje para ${employeeName} el ${dateStr}`,
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
    employeeName: string,
  ): { hours: number; messages: string[]; hasInconsistency: boolean } {
    const messages: string[] = [];

    // Use utility function to validate clock log pairs
    const validation = PayrollUtils.validateClockLogPairs(dayClockLogs);

    if (!validation.isValid) {
      const inconsistencyMsg = `Inconsistencia de marcaje para ${employeeName} el ${dateStr}: ${validation.messages.join(", ")}. Revisar el marcaje manualmente.`;
      messages.push(inconsistencyMsg);
      return { hours: 0, messages, hasInconsistency: true };
    }

    // Check for overlapping pairs
    if (PayrollUtils.hasOverlappingPairs(validation.pairs)) {
      messages.push(
        `Inconsistencia de marcaje para ${employeeName} el ${dateStr}: periodos de trabajo superpuestos detectados. Revisar.`,
      );
      return { hours: 0, messages, hasInconsistency: true };
    }

    // Calculate total hours from valid pairs
    const totalHours = PayrollUtils.calculateTotalHoursFromPairs(
      validation.pairs,
    );

    return {
      hours: totalHours,
      messages,
      hasInconsistency: false,
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
    endDate: Date,
  ): Promise<number> {
    try {
      const bonuses = await prisma.vpg_bonuses.findMany({
        where: {
          bonuses_employee_id: employeeId,
          bonuses_granted_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      return PayrollUtils.roundToMoney(
        bonuses.reduce((sum, b) => sum + Number(b.bonuses_amount), 0),
      );
    } catch (error) {
      console.error(
        `Error calculating bonuses for employee ${employeeId}:`,
        error,
      );
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
    grossSalary: number,
  ): Promise<{ total: number; breakdown: DeductionBreakdown[] }> {
    const breakdown: DeductionBreakdown[] = [];
    let total = 0;

    try {
      const employeeDeductions = await this.getEmployeeDeductions(employeeId);
      if (!employeeDeductions || employeeDeductions.length === 0) {
        console.log(
          `[Payroll] No deductions assigned for employee ${employeeId}`,
        );
      }

      for (const empDeduction of employeeDeductions) {
        try {
          // Prefer the values already loaded by the JOIN to avoid extra roundtrips
          let name = empDeduction.deduction_name as string | undefined;
          let fixed = empDeduction.fixed_amount as number | undefined;
          let percent = empDeduction.percentage as number | undefined;

          // Fallback: fetch full definition if missing
          if ((fixed == null || percent == null) && !name) {
            const deduction = await DeductionsService.getDeductionById(
              empDeduction.deduction_id,
            );
            if (!deduction) {
              breakdown.push({
                code: `DED_${empDeduction.deduction_id}`,
                type: "fixed",
                amount: 0,
                message: `Deducción no encontrada (ID: ${empDeduction.deduction_id})`,
              });
              continue;
            }
            name = deduction.name;
            fixed = deduction.fixed_amount;
            percent = deduction.percentage;
          }

          let amount = 0;
          let type: "fixed" | "percent" = "fixed";

          if (fixed && fixed > 0) {
            amount = PayrollUtils.roundToMoney(fixed);
            type = "fixed";
          } else if (percent && percent > 0) {
            amount = PayrollUtils.applyPercentageDeduction(
              grossSalary,
              percent,
            );
            type = "percent";
          }

          const codeBase = name || `DED_${empDeduction.deduction_id}`;
          breakdown.push({
            deduction_id: empDeduction.deduction_id,
            code: codeBase.replace(/\s+/g, "_").toUpperCase(),
            type,
            amount,
            message: `${codeBase}: ${type === "percent" ? `${percent}%` : `₡${fixed ?? 0}`}`,
          });

          total += amount;
        } catch (error) {
          console.error(
            `Error processing deduction ${empDeduction.deduction_id}:`,
            error,
          );
          breakdown.push({
            code: `DED_${empDeduction.deduction_id}`,
            type: "fixed",
            amount: 0,
            message: `Error procesando deducción: ${error instanceof Error ? error.message : "Error desconocido"}`,
          });
        }
      }
    } catch (error) {
      console.error(
        `Error calculating deductions for employee ${employeeId}:`,
        error,
      );
    }

    return {
      total: PayrollUtils.roundToMoney(total),
      breakdown,
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
    end2: Date,
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }

  /**
   * Get the hire date for an employee
   * @param employeeId - The ID of the employee
   * @returns  Promise<Date | null> - Returns the employee hired date, if not found returns null
   */
  static async getHiredDate(employeeId: number): Promise<Date | null> {
    const employee = await prisma.vpg_employees.findUnique({
      where: {
        employee_id: employeeId,
      },
    });

    const hiredDate = employee?.employee_hire_date;

    return hiredDate ?? null;
  }

  /**
   * Get the payrolls ID from the date the employee is Hired
   * @param start_date Date from where to calculate
   * @param end_date Date where to end calculation
   * @returns Promise<number[] | null> Returns a list of payrolls id, if not returns null
   * @author AleLeonMarin
   */
  static async payrollsInPeriod(
    start_date: Date,
    end_date: Date,
  ): Promise<number[] | null> {
    const period = await prisma.vpg_payrolls.findMany({
      where: {
        payrolls_period_end: {
          gte: start_date,
          lte: end_date,
        },
      },
      select: {
        payrolls_id: true,
      },
      orderBy: {
        payrolls_period_end: "asc",
      },
    });

    return period.map((p) => p.payrolls_id);
  }

  /**
   * Get the net salaries of an employee
   * @param employeeID - The employee id
   * @param payroll_ids - Payroll id
   * @returns Promise <Decimal[] | null> returns a collections of all the salaries
   * @author AleLeonMarin
   */
  static async getSalaries(
    employeeID: number,
    payroll_ids: number[],
  ): Promise<Decimal[] | null> {
    if (payroll_ids.length === 0) {
      return [];
    }
    const salaries = await prisma.vpg_payroll_employee.findMany({
      where: {
        payroll_employee_employee_id: employeeID,
        payroll_employee_payroll_id: {
          in: payroll_ids,
        },
      },
      select: {
        payroll_employee_net_salary: true,
      },
    });

    return salaries.map((s) => s.payroll_employee_net_salary);
  }

  /**
   * Calculate the aguinaldo of an employee in a given dates
   * @param employeeID - Employee id
   * @param start_date - Star date
   * @param end_date - End date
   * @returns the calculation of the aguinaldo of a employee
   * @author AleLeonMarin
   */

  static async aguinaldo(employeeID: number, start_date: Date, end_date: Date) {
    const hired_date = await this.getHiredDate(employeeID);
    let payrollIds: number[] = [];

    if (!hired_date) {
      return null;
    }

    const effectiveStartDate = new Date(start_date);
    effectiveStartDate.setFullYear(effectiveStartDate.getFullYear() + 1);
    payrollIds =
      hired_date <= effectiveStartDate
        ? ((await this.payrollsInPeriod(start_date, end_date)) ?? [])
        : [];

    const salaries = (await this.getSalaries(employeeID, payrollIds)) ?? [];

    const aguinaldo = PayrollUtils.averageOfSalaries(
      salaries.map((s: Decimal) => s.toNumber()),
    );

    return aguinaldo;
  }

  /**
   * It calculates the aguinaldo of a list of employees
   * @param employeeIds - List of employees
   * @param start_date - Start date of calculation
   * @param end_date - End date of calculation
   * @returns Promise <Array<employeeID;aguinaldo>> returns an array
   * of the employee with its id and the aguinaldo calculation
   * @author AleLeonMarin
   */

  static async aguinaldoForEmployees(
    employeeIds: number[],
    start_date: Date,
    end_date: Date,
  ): Promise<
    Array<{ employeeId: number; aguinaldo: number | null; message: string }>
  > {
    const results: Array<{
      employeeId: number;
      aguinaldo: number | null;
      message: string;
    }> = [];

    for (const id of employeeIds) {
      const value = await this.aguinaldo(id, start_date, end_date);
      results.push({
        employeeId: id,
        aguinaldo: value,
        message:
          value === null ? "Sin fecha de contratación o no elegible" : "OK",
      });
    }

    return results;
  }
}
