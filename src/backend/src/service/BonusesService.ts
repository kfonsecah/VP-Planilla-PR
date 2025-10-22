import { PrismaClient } from "@prisma/client";
import { Bonus } from "../model/bonus";

const prisma = new PrismaClient();

export class BonusesService {
  /**
   * Create a new bonus
   * @param data - Bonus data to create
   * @returns The created bonus
   */
  static async createBonus(data: Bonus): Promise<Bonus> {
    const prismaBonus = await prisma.vpg_bonuses.create({
      data: {
        bonuses_employee_id: data.employee_id,
        bonuses_payroll_id: data.payroll_id,
        bonuses_year: data.year,
        bonuses_month: data.month,
        bonuses_description: data.description,
        bonuses_amount: data.amount,
        bonuses_granted_at: data.granted_at,
        bonuses_version: 1,
      },
    });

    const bonus: Bonus = {
      id: prismaBonus.bonuses_id,
      employee_id: prismaBonus.bonuses_employee_id,
      payroll_id: prismaBonus.bonuses_payroll_id,
      year: prismaBonus.bonuses_year,
      month: prismaBonus.bonuses_month,
      description: prismaBonus.bonuses_description,
      amount: Number(prismaBonus.bonuses_amount),
      granted_at: prismaBonus.bonuses_granted_at,
      version: prismaBonus.bonuses_version,
    };

    return bonus;
  }

  /**
   * Update an existing bonus
   * @param id - The ID of the bonus to update
   * @param data - The updated bonus data
   * @returns The updated bonus, or null if not found
   */
  static async updateBonus(
    id: number,
    data: Partial<Bonus>
  ): Promise<Bonus | null> {
    const existingBonus = await prisma.vpg_bonuses.findUnique({
      where: { bonuses_id: id },
    });

    if (!existingBonus) {
      return null;
    }

    const updatedBonus = await prisma.vpg_bonuses.update({
      where: { bonuses_id: id },
      data: {
        bonuses_employee_id:
          data.employee_id ?? existingBonus.bonuses_employee_id,
        bonuses_payroll_id: data.payroll_id ?? existingBonus.bonuses_payroll_id,
        bonuses_year: data.year ?? existingBonus.bonuses_year,
        bonuses_month: data.month ?? existingBonus.bonuses_month,
        bonuses_description:
          data.description ?? existingBonus.bonuses_description,
        bonuses_amount: data.amount ?? existingBonus.bonuses_amount,
        bonuses_granted_at: data.granted_at ?? existingBonus.bonuses_granted_at,
        bonuses_version: (data.version || existingBonus.bonuses_version) + 1,
      },
    });

    const bonus: Bonus = {
      id: updatedBonus.bonuses_id,
      employee_id: updatedBonus.bonuses_employee_id,
      payroll_id: updatedBonus.bonuses_payroll_id,
      year: updatedBonus.bonuses_year,
      month: updatedBonus.bonuses_month,
      description: updatedBonus.bonuses_description,
      amount: Number(updatedBonus.bonuses_amount),
      granted_at: updatedBonus.bonuses_granted_at,
      version: updatedBonus.bonuses_version,
    };

    return bonus;
  }

  /**
   * Delete a bonus by ID
   * @param id - The ID of the bonus to delete
   * @returns The deleted bonus, or null if not found
   */
  static async deleteBonus(id: number): Promise<Bonus | null> {
    const existingBonus = await prisma.vpg_bonuses.findUnique({
      where: { bonuses_id: id },
    });

    if (!existingBonus) {
      return null;
    }

    await prisma.vpg_bonuses.delete({
      where: { bonuses_id: id },
    });

    const bonus: Bonus = {
      id: existingBonus.bonuses_id,
      employee_id: existingBonus.bonuses_employee_id,
      payroll_id: existingBonus.bonuses_payroll_id,
      year: existingBonus.bonuses_year,
      month: existingBonus.bonuses_month,
      description: existingBonus.bonuses_description,
      amount: Number(existingBonus.bonuses_amount),
      granted_at: existingBonus.bonuses_granted_at,
      version: existingBonus.bonuses_version,
    };

    return bonus;
  }

  /**
   * Get a bonus by ID
   * @param id - The ID of the bonus to retrieve
   * @returns The bonus with the specified ID, or null if not found
   */
  static async getBonusById(id: number): Promise<Bonus | null> {
    const bonus = await prisma.vpg_bonuses.findUnique({
      where: { bonuses_id: id },
    });

    if (!bonus) {
      return null;
    }

    return {
      id: bonus.bonuses_id,
      employee_id: bonus.bonuses_employee_id,
      payroll_id: bonus.bonuses_payroll_id,
      year: bonus.bonuses_year,
      month: bonus.bonuses_month,
      description: bonus.bonuses_description,
      amount: Number(bonus.bonuses_amount),
      granted_at: bonus.bonuses_granted_at,
      version: bonus.bonuses_version,
    };
  }
}
