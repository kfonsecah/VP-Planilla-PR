import { prisma } from '../lib/prisma';
import { PayrollType } from "../model/payrollType";

export class PayrollTypeService {
  /**
   * Create a new payroll type in the system
   * @param data - PayrollType data to create (excluding id and version)
   * @returns Promise<PayrollType> - The created payroll type with assigned ID and version
   * @throws Error if payroll type creation fails
   */
  static async createPayrollType(data: PayrollType): Promise<PayrollType> {
    try {
      const createdPayrollType = await prisma.vpg_payroll_types.create({
        data: {
          payroll_types_name: data.name,
          payroll_types_description: data.description,
          payroll_types_version: 1,
        },
      });
      const payrollType: PayrollType = {
        id: createdPayrollType.payroll_types_id,
        name: createdPayrollType.payroll_types_name,
        description: createdPayrollType.payroll_types_description,
        version: createdPayrollType.payroll_types_version,
      };
      return payrollType;
    } catch (error) {
      console.error("Error creating payroll type:", error);
      throw new Error("Failed to create payroll type");
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Update an existing payroll type
   * @param id - The ID of the payroll type to update
   * @param data - Partial payroll type data to update
   * @returns Promise<PayrollType | null> - The updated payroll type or null if not found
   * @throws Error if update operation fails
   */
  static async updatePayrollType(
    id: number,
    data: Partial<PayrollType>
  ): Promise<PayrollType | null> {
    const prismaPayroll = await prisma.vpg_payroll_types.update({
      where: { payroll_types_id: id },
      data: {
        payroll_types_name: data.name,
        payroll_types_description: data.description,
        payroll_types_version: (data.version ?? 0) + 1,
      },
    });
    const payrollType: PayrollType = {
      id: prismaPayroll.payroll_types_id,
      name: prismaPayroll.payroll_types_name,
      description: prismaPayroll.payroll_types_description,
      version: prismaPayroll.payroll_types_version,
    };
    return payrollType;
  }

  /**
   * Get a payroll type by its ID
   * @param id - The ID of the payroll type to retrieve
   * @returns Promise<PayrollType | null> - The payroll type record or null if not found
   * @throws Error if database query fails
   */
  static async getPayrollTypeById(id: number): Promise<PayrollType | null> {
    const payrollType = await prisma.vpg_payroll_types.findUnique({
      where: { payroll_types_id: id },
    });
    if (!payrollType) {
      return null;
    }
    return {
      id: payrollType.payroll_types_id,
      name: payrollType.payroll_types_name,
      description: payrollType.payroll_types_description,
      version: payrollType.payroll_types_version,
    };
  }

  /**
   * Get all payroll types from the system
   * @returns Promise<PayrollType[]> - Array of all payroll types
   * @throws Error if database query fails
   */
  static async getAllPayrollTypes(): Promise<PayrollType[]> {
    const payrollTypes = await prisma.vpg_payroll_types.findMany();
    return payrollTypes.map((pt) => ({
      id: pt.payroll_types_id,
      name: pt.payroll_types_name,
      description: pt.payroll_types_description,
      version: pt.payroll_types_version,
    }));
  }
}
