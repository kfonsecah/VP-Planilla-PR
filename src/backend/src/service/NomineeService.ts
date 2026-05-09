import { Request, Response } from "express";
import { ClockLogsService } from "../service/ClockLogsService";
import { ClockLogEffectiveService } from "./ClockLogEffectiveService";
import { prisma } from "../lib/prisma";
import { Employee } from "../model/employee";
import { DeductionsService } from "./DeductionsService";
import { EmployeeService } from "./EmployeeService";
import { PositionService } from "./PositionService";
import { LegalParamService } from "./LegalParamService";
import * as PayrollUtils from "../utils/payrollUtils";
import { resolveEventPayForDay, getDayNumberWithinEvent } from "../utils/payrollUtils";
import {
  PayrollPeriod,
  DayWork,
  DeductionBreakdown,
  Inconsistency,
  EmployeePayroll,
  PayrollSummary,
  PayrollCalculationResult,
  LegalParamSet,
} from "../types/payroll.types";
import { MinuteRoundingPolicy, EmployeeShiftType, ShiftType } from "@prisma/client";

// Re-export types so existing consumers importing from NomineeService continue to work
export type {
  PayrollPeriod,
  DayWork,
  DeductionBreakdown,
  Inconsistency,
  EmployeePayroll,
  PayrollSummary,
  PayrollCalculationResult,
  LegalParamSet,
};

export class NomineeService {
  /**
   * Resolves the effective shift type for an employee based on their configuration
   * and the enterprise default.
   */
  static resolveEffectiveShiftType(
    employeeShiftType: EmployeeShiftType,
    enterpriseShiftType: ShiftType
  ): ShiftType {
    if (employeeShiftType === EmployeeShiftType.USE_ENTERPRISE_DEFAULT) {
      return enterpriseShiftType;
    }
    return employeeShiftType as unknown as ShiftType;
  }
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
          // Si el registro fue ajustado manualmente, NO sobrescribimos las horas ni los salarios
          // calculados, ya que el usuario ya definió valores específicos.
          if (existing.payroll_employee_is_manually_adjusted) {
            console.log(`Skipping auto-calculation update for manually adjusted employee ${employee.employeeId}`);
            // Podríamos actualizar deducciones si no están bloqueadas, pero por ahora respetamos todo el ajuste manual
          } else {
            // Update existing record with auto-calculated data
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
          }
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
    selectedEmployeeIds?: number[],
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
      // Filtrar empleados por IDs seleccionados si se proporcionan
      let employees = selectedEmployeeIds && selectedEmployeeIds.length > 0
        ? (await EmployeeService.getAllEmployees()).filter(e =>
            selectedEmployeeIds.includes(Number(e.id)))
        : await EmployeeService.getActiveEmployeesForPeriod(startDate, endDate);

      // Fallback solo cuando no hay filtro activo
      if (employees.length === 0 && !(selectedEmployeeIds && selectedEmployeeIds.length > 0)) {
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

      const clockLogsMap   = await NomineeService.preloadClockLogs(startDate, endDate);
      const vacationsMap   = await NomineeService.preloadVacations();
      const laborEventsMap = await NomineeService.preloadLaborEvents(startDate, endDate);
      const bonusesMap     = await NomineeService.preloadBonuses(startDate, endDate);
      const deductionsMap  = await NomineeService.preloadDeductions();
      const positionsMap   = await NomineeService.preloadPositions();
      const holidays       = await prisma.vpg_company_holidays.findMany({
        where: {
          company_holidays_date: {
            gte: startDate,
            lte: endDate
          },
          company_holidays_status: 'active'
        }
      });

      // Performance optimization: Pre-fetch legal params for all 3 shift types to avoid N+1 query
      const [paramsDiurna, paramsMixta, paramsNocturna] = await Promise.all([
        LegalParamService.getParamSetAtDate(startDate, ShiftType.DIURNA),
        LegalParamService.getParamSetAtDate(startDate, ShiftType.MIXTA),
        LegalParamService.getParamSetAtDate(startDate, ShiftType.NOCTURNA)
      ]);

      const legalParamMap = new Map<ShiftType, LegalParamSet>([
        [ShiftType.DIURNA, paramsDiurna],
        [ShiftType.MIXTA, paramsMixta],
        [ShiftType.NOCTURNA, paramsNocturna]
      ]);

      const enterpriseConfig = await prisma.vpg_enterprise.findFirst({
        select: { 
          enterprise_pay_unworked_holidays: true,
          enterprise_ordinary_shift_type: true
        }
      });
      const enterpriseShiftType = enterpriseConfig?.enterprise_ordinary_shift_type ?? ShiftType.DIURNA;
      const payUnworkedHolidays = enterpriseConfig?.enterprise_pay_unworked_holidays ?? true;

      for (const employee of employees) {
        try {
          const employeeShiftType = (employee.shift_type as EmployeeShiftType) ?? EmployeeShiftType.USE_ENTERPRISE_DEFAULT;
          const effectiveShift = NomineeService.resolveEffectiveShiftType(employeeShiftType, enterpriseShiftType);

          // Get pre-calculated params and add enterprise-specific flag
          const baseParams = legalParamMap.get(effectiveShift)!;
          const legalParams: LegalParamSet = {
            ...baseParams,
            payUnworkedHolidays
          };

          const employeePayroll = await this.calculateEmployeePayroll(
            employee,
            startDate,
            endDate,
            clockLogsMap.get(Number(employee.id)) || [],
            vacationsMap.get(Number(employee.id)) || [],
            laborEventsMap.get(Number(employee.id)) || [],
            bonusesMap.get(Number(employee.id)) || [],
            deductionsMap.get(Number(employee.id)) || [],
            positionsMap,
            holidays,
            legalParams,
            effectiveShift
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
            employeeName: employee.name || '',
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
            name: employee.name || '',
            employee_name: employee.name || '',
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
    employee: Employee,
    startDate: Date,
    endDate: Date,
    employeeClockLogs: any[],
    employeeVacations: any[],
    employeeLaborEvents: any[],
    employeeBonuses: any[],
    employeeDeductions: any[],
    positionsMap: Map<number, any>,
    holidays: any[],
    params: LegalParamSet,
    effectiveShift?: ShiftType
  ): Promise<EmployeePayroll> {
    const employeePayroll: EmployeePayroll = {
      employeeId: employee.id.toString(),
      employeeName: employee.name || '',
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
      shift_type: effectiveShift,
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
      name: employee.name || '',
      employee_name: employee.name || '',
      identification: employee.national_id || "",
      employee_identification: employee.national_id || "",
      national_id: employee.national_id || "",
      position: "",
      position_name: "",
    };

    try {
      // Get employee position and salary from preloaded data
      if (employee.position_id) {
        const position = positionsMap.get(employee.position_id);
        if (position) {
          employeePayroll.baseHourlySalary = PayrollUtils.roundToMoney(Number(position.position_base_salary));
          employeePayroll.position = position.position_name;
          employeePayroll.position_name = position.position_name;
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

      // Filter vacations to only those in the current period (preloaded)
      const filteredVacations = employeeVacations.filter(
        vacation =>
          vacation.paid &&
          this.dateRangesOverlap(
            vacation.start_date,
            vacation.end_date,
            startDate,
            endDate
          )
      );

      // Process daily work (using preloaded data)
      const dailyWork = this.processDailyWork(
        employeeClockLogs,
        filteredVacations,
        employeeLaborEvents,
        startDate,
        endDate,
        employee.name || '',
        params
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
          holidays,
          params
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
          params
        );
        employeePayroll.overtimeHours = PayrollUtils.calculateOvertimeHours(
          dailyWork.days,
          params
        );
      }
      employeePayroll.weeklyRestHours = PayrollUtils.calculateWeeklyRestHours(
        employeePayroll.regularHours,
        startDate,
        endDate,
      );
      // Calculate pay
      employeePayroll.weeklyRestPay = PayrollUtils.roundToMoney(
        employeePayroll.weeklyRestHours * employeePayroll.baseHourlySalary,
      );

      // Overtime Pay using the new logic
      employeePayroll.overtimePay = PayrollUtils.calculateOvertimePay(
        dailyWork.days,
        employeePayroll.baseHourlySalary,
        holidays,
        params
      );

      // Calculate bonuses from preloaded data
      employeePayroll.bonuses = this.calculateBonusesFromData(employeeBonuses);

      // Gross salary using the new holiday-aware logic
      employeePayroll.grossSalary = PayrollUtils.calculateGrossSalary(
        dailyWork.days,
        employeePayroll.baseHourlySalary,
        employeePayroll.bonuses,
        startDate,
        endDate,
        holidays,
        params
      );

      // Mandatory holiday breakdown for display (Option A) — reuses same Art. 148 logic
      const mandatoryHolidayBreakdown = PayrollUtils.getMandatoryHolidayBreakdown(
        dailyWork.days,
        employeePayroll.baseHourlySalary,
        startDate,
        endDate,
        holidays,
        params
      );
      employeePayroll.mandatoryHolidayHours = mandatoryHolidayBreakdown.hours;
      employeePayroll.mandatoryHolidayPay   = mandatoryHolidayBreakdown.pay;

      // Calculate deductions from preloaded data
      const deductionsData = this.calculateDeductionsFromData(
        employeeDeductions,
        employeePayroll.grossSalary
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

      // Add alias fields for frontend compatibility
      (employeePayroll as any).regular_hours = employeePayroll.regularHours;
      (employeePayroll as any).overtime_hours = employeePayroll.overtimeHours;
      (employeePayroll as any).total_hours = employeePayroll.regularHours + employeePayroll.overtimeHours;
      (employeePayroll as any).totalHours = employeePayroll.regularHours + employeePayroll.overtimeHours;
      (employeePayroll as any).net_salary = employeePayroll.netSalary;
      (employeePayroll as any).gross_salary = employeePayroll.grossSalary;

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
    clockPairs: any[],
    vacations: any[],
    laborEvents: any[],
    startDate: Date,
    endDate: Date,
    employeeName: string,
    params: LegalParamSet,
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
        dayWork.hoursWorked = params.regularHoursPerDay; // Use the regular hours defined for the shift

        // Check if there are also clock logs for this vacation day
        const hasLogs = clockPairs.some(pair => {
          const timestamp = (pair.in?.effectiveTimestamp || pair.out?.effectiveTimestamp);
          if (!timestamp) return false;
          const logDate = new Date(timestamp).toISOString().split('T')[0];
          return logDate === dateStr;
        });

        if (hasLogs) {
          dayWork.messages.push(
            `Advertencia para ${employeeName} el ${dateStr}: día de vacaciones con marcajes detectados. Se prioriza vacaciones (${params.regularHoursPerDay}h).`,
          );
        }
      } else if (laborEventForDay) {
        // Labor event active — resolve pay behavior from catalog
        const evStart = new Date(laborEventForDay.employee_labor_event_start_date);
        const catalog = laborEventForDay.vpg_labor_events;
        const dayNumber = getDayNumberWithinEvent(evStart, currentDate);

        const eventForDay: PayrollUtils.LaborEventForDay = {
          name: catalog?.labor_events_name || laborEventForDay.employee_labor_event_status || 'Evento',
          payBehavior: (catalog?.labor_event_pay_behavior as any) ?? 'NO_PAY',
          maxPaidDays: catalog?.labor_event_max_paid_days ?? null,
          payPercentage: catalog?.labor_event_pay_percentage != null
            ? parseFloat(catalog.labor_event_pay_percentage.toString())
            : null,
          startDate: evStart,
        };

        const payResult = resolveEventPayForDay(eventForDay, dayNumber, params.regularHoursPerDay);
        dayWork.hoursWorked = payResult.hoursWorked;
        dayWork.messages.push(`${payResult.message} — ${employeeName} el ${dateStr}.`);

        // Warn if there are clock logs for this day (they are NOT used)
        const hasLogs = clockPairs.some(pair => {
          const timestamp = pair.in?.effectiveTimestamp || pair.out?.effectiveTimestamp;
          if (!timestamp) return false;
          return new Date(timestamp).toISOString().split('T')[0] === dateStr;
        });
        if (hasLogs) {
          dayWork.messages.push(
            `Advertencia para ${employeeName} el ${dateStr}: marcajes detectados durante evento laboral. Se ignoran — prevalece el evento.`,
          );
        }
      } else {
        // Process clock logs for the day (using pre-paired marks)
        const dayPairs = clockPairs.filter(pair => {
          // Use IN mark date to assign hours to a specific day
          const timestamp = (pair.in?.effectiveTimestamp || pair.out?.effectiveTimestamp);
          if (!timestamp) return false;
          const logDate = new Date(timestamp).toISOString().split('T')[0];
          return logDate === dateStr;
        });

        if (dayPairs.length === 0) {
          // No clock logs for this day - this is normal for weekends/days off
          dayWork.hoursWorked = 0;
        } else {
          console.log(`[DEBUG] Found ${dayPairs.length} pairs for ${employeeName} on ${dateStr}`);
          const hoursData = this.calculateDailyHours(
            dayPairs,
            dateStr,
            employeeName,
            params.minuteRoundingPolicy
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
   * @param policy - MinuteRoundingPolicy to apply
   * @returns Object with calculated hours and messages
   */
  private calculateDailyHours(
    dayPairs: any[],
    dateStr: string,
    employeeName: string,
    policy: MinuteRoundingPolicy = MinuteRoundingPolicy.EXACT
  ): { hours: number; messages: string[]; hasInconsistency: boolean } {
    const messages: string[] = [];
    let totalMinutes = 0;
    let hasInconsistency = false;

    for (const pair of dayPairs) {
      if (pair.status === 'valid') {
        const inTime = new Date(pair.in.effectiveTimestamp);
        const outTime = new Date(pair.out.effectiveTimestamp);
        const minutes = Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60));
        totalMinutes += minutes;
        console.log(`[DEBUG] Adding ${minutes} minutes for pair IN: ${pair.in?.effectiveTimestamp}`);
      } else {
        hasInconsistency = true;
        const msg = pair.status === 'orphan' 
          ? `Marca huérfana detectada (sin entrada o sin salida)`
          : `Anomalía detectada (doble entrada o marca duplicada)`;
        console.log(`[DEBUG] Inconsistency: ${msg} on ${dateStr}`);
        messages.push(`${msg} para ${employeeName} el ${dateStr}.`);
      }
    }

    const totalHours = PayrollUtils.applyMinuteRounding(totalMinutes, policy);

    if (totalMinutes > 0) {
      console.log(`[DEBUG] Total daily minutes for ${dateStr}: ${totalMinutes} -> Rounded hours: ${totalHours}`);
    }

    return {
      hours: totalHours,
      messages,
      hasInconsistency,
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

  private static groupByEmployee<T>(
    items: T[],
    getEmployeeId: (item: T) => number
  ): Map<number, T[]> {
    const grouped = new Map<number, T[]>();
    for (const item of items) {
      const employeeId = getEmployeeId(item);
      const existing = grouped.get(employeeId) || [];
      existing.push(item);
      grouped.set(employeeId, existing);
    }
    return grouped;
  }

  private static async preloadClockLogs(
    startDate: Date,
    endDate: Date
  ): Promise<Map<number, any[]>> {
    // Use effective marks so EDIT/VOID adjustments are reflected in payroll
    const effectiveMarksMap = await ClockLogEffectiveService.getEffectiveMarksForAllEmployees(startDate, endDate);
    
    const result = new Map<number, any[]>();
    
    effectiveMarksMap.forEach((marks, employeeId) => {
      // Use the service's pairing logic to get valid/orphan/anomaly pairs
      const pairs = ClockLogEffectiveService.pairLogs(marks);
      result.set(employeeId, pairs);
    });
    
    return result;
  }

  private static async preloadVacations(): Promise<Map<number, any[]>> {
    const vacations = await prisma.vpg_vacations.findMany({
      where: {
        vacations_paid: true
      }
    });
    return NomineeService.groupByEmployee(vacations, (item) => item.vacations_employee_id);
  }

  private static async preloadLaborEvents(
    startDate: Date,
    endDate: Date
  ): Promise<Map<number, any[]>> {
    const events = await prisma.vpg_employee_labor_event.findMany({
      where: {
        employee_labor_event_start_date: { lte: endDate },
        OR: [
          { employee_labor_event_end_date: null },
          { employee_labor_event_end_date: { gte: startDate } }
        ]
      },
      include: { vpg_labor_events: true }
    });
    return NomineeService.groupByEmployee(events, (item) => item.employee_labor_event_employee_id);
  }

  private static async preloadBonuses(
    startDate: Date,
    endDate: Date
  ): Promise<Map<number, any[]>> {
    const bonuses = await prisma.vpg_bonuses.findMany({
      where: {
        bonuses_granted_at: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    return NomineeService.groupByEmployee(bonuses, (item) => item.bonuses_employee_id);
  }

  private static async preloadDeductions(): Promise<Map<number, any[]>> {
    const assignments = await prisma.vpg_deductions_per_employee.findMany({
      include: { vpg_deductions: true }
    });
    return NomineeService.groupByEmployee(assignments, (item) => item.deductions_per_employee_employee_id);
  }

  private static async preloadPositions(): Promise<Map<number, any>> {
    const positions = await prisma.vpg_positions.findMany();
    const positionMap = new Map<number, any>();
    for (const pos of positions) {
      positionMap.set(pos.position_id, pos);
    }
    return positionMap;
  }

  private calculateBonusesFromData(bonuses: any[]): number {
    return PayrollUtils.roundToMoney(
      bonuses.reduce((sum, b) => sum + Number(b.bonuses_amount), 0)
    );
  }

  private calculateDeductionsFromData(
    deductions: any[],
    grossSalary: number
  ): { total: number; breakdown: DeductionBreakdown[] } {
    const breakdown: DeductionBreakdown[] = [];
    let total = 0;

    for (const ded of deductions) {
      const deductionDef = ded.vpg_deductions;
      const name = deductionDef?.deductions_name || '';
      const fixed = deductionDef?.deductions_fixed_amount != null
        ? Number(deductionDef.deductions_fixed_amount)
        : 0;
      const percent = deductionDef?.deductions_percentage != null
        ? Number(deductionDef.deductions_percentage)
        : 0;

      let amount = 0;
      let type: 'fixed' | 'percent' = 'fixed';

      if (fixed && fixed > 0) {
        amount = PayrollUtils.roundToMoney(fixed);
        type = 'fixed';
      } else if (percent && percent > 0) {
        amount = PayrollUtils.applyPercentageDeduction(grossSalary, percent);
        type = 'percent';
      }

      const codeBase = (name || `DED_${ded.deductions_per_employee_deduction_id}`);
      breakdown.push({
        deduction_id: ded.deductions_per_employee_deduction_id,
        code: codeBase.replace(/\s+/g, '_').toUpperCase(),
        type,
        amount,
        message: `${codeBase}: ${type === 'percent' ? `${percent}%` : `₡${fixed}`}`
      });

      total += amount;
    }

    return {
      total: PayrollUtils.roundToMoney(total),
      breakdown
    };
  }
}
