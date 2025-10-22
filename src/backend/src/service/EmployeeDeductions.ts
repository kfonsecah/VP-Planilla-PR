import { PrismaClient } from "@prisma/client";
import { DeductionsPerEmployee } from "../model/deductionsPerEmployee";

const prisma = new PrismaClient();

export class EmployeeDeductionsService {
  /**
   * Assign a deduction to an employee
   * @param employeeId - The ID of the employee
   * @param deductionId - The ID of the deduction to assign
   * @returns Promise<DeductionsPerEmployee> - The created employee deduction record
   * @throws Error if assignment fails or employee/deduction not found
   */
  static async assignDeductionToEmployee(
    employeeId: number,
    deductionId: number
  ): Promise<DeductionsPerEmployee> {
    const prismaEmployeeDeduction =
      await prisma.vpg_deductions_per_employee.create({
        data: {
          deductions_per_employee_employee_id: employeeId,
          deductions_per_employee_deduction_id: deductionId,
          deductions_per_employee_version: 1,
        },
      });

    const employeeDeduction: DeductionsPerEmployee = {
      employee_id: prismaEmployeeDeduction.deductions_per_employee_employee_id,
      deduction_id:
        prismaEmployeeDeduction.deductions_per_employee_deduction_id,
      version: prismaEmployeeDeduction.deductions_per_employee_version,
    };
    return employeeDeduction;
  }
}
