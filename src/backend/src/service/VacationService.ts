import { PrismaClient } from "@prisma/client";
import { Vacation } from "../model/vacations";

const prisma = new PrismaClient();

export class VacationService {
  /**
   * Get a vacation by its ID.
   * @param vacationId The ID of the vacation.
   * @returns The vacation record or null if not found.
   */
  static async getVacationById(vacationId: number): Promise<Vacation | null> {
    const prismaVacation = await prisma.vpg_vacations.findUnique({
      where: { vacations_id: vacationId },
    });

    if (!prismaVacation) {
      return null;
    }

    const vacation: Vacation = {
      id: prismaVacation.vacations_id,
      employee_id: prismaVacation.vacations_employee_id,
      start_date: prismaVacation.vacations_start_date,
      end_date: prismaVacation.vacations_end_date,
      total_days: prismaVacation.vacations_total_days || 0,
      paid: prismaVacation.vacations_paid || false,
      status: prismaVacation.vacations_status || "pending",
      version: prismaVacation.vacations_version,
    };
    return vacation;
  }

  /**
   * Get all vacations in the database.
   * @returns All vacations in the database
   */
  static async getAllVacations(): Promise<Vacation[]> {
    const prismaVacations = await prisma.vpg_vacations.findMany();
    return prismaVacations.map((prismaVacation) => ({
      id: prismaVacation.vacations_id,
      employee_id: prismaVacation.vacations_employee_id,
      start_date: prismaVacation.vacations_start_date,
      end_date: prismaVacation.vacations_end_date,
      total_days: prismaVacation.vacations_total_days || 0,
      paid: prismaVacation.vacations_paid || false,
      status: prismaVacation.vacations_status || "pending",
      version: prismaVacation.vacations_version,
    }));
  }

  /**
   * Create a new vacation in the database.
   * @param vacation The vacation data to create (excluding id and version).
   * @returns The created vacation with its assigned ID and version.
   */
  static async createVacation(
    vacation: Omit<Vacation, "id" | "version">
  ): Promise<Vacation> {
    const prismaVacation = await prisma.vpg_vacations.create({
      data: {
        vacations_employee_id: vacation.employee_id,
        vacations_start_date: vacation.start_date,
        vacations_end_date: vacation.end_date,
        vacations_total_days: vacation.total_days || 0,
        vacations_paid: vacation.paid || false,
        vacations_status: vacation.status || "pending",
      },
    });

    return {
      id: prismaVacation.vacations_id,
      employee_id: prismaVacation.vacations_employee_id,
      start_date: prismaVacation.vacations_start_date,
      end_date: prismaVacation.vacations_end_date,
      total_days: prismaVacation.vacations_total_days || 0,
      paid: prismaVacation.vacations_paid || false,
      status: prismaVacation.vacations_status || "pending",
      version: prismaVacation.vacations_version,
    };
  }

  /**
   * Update an existing vacation in the database.
   * @param vacationId The ID of the vacation to update.
   * @param vacation The updated vacation data (excluding id and version).
   * @returns The updated vacation record or null if not found.
   */
  static async updateVacation(
    vacationId: number,
    vacation: Omit<Vacation, "id" | "version">
  ): Promise<Vacation | null> {
    try {
      const prismaVacation = await prisma.vpg_vacations.update({
        where: { vacations_id: vacationId },
        data: {
          vacations_employee_id: vacation.employee_id,
          vacations_start_date: vacation.start_date,
          vacations_end_date: vacation.end_date,
          vacations_total_days: vacation.total_days || 0,
          vacations_paid: vacation.paid || false,
          vacations_status: vacation.status || "pending",
          // Increment version
          vacations_version: {
            increment: 1,
          },
        },
      });

      return {
        id: prismaVacation.vacations_id,
        employee_id: prismaVacation.vacations_employee_id,
        start_date: prismaVacation.vacations_start_date,
        end_date: prismaVacation.vacations_end_date,
        total_days: prismaVacation.vacations_total_days || 0,
        paid: prismaVacation.vacations_paid || false,
        status: prismaVacation.vacations_status || "pending",
        version: prismaVacation.vacations_version,
      };
    } catch (error) {
      throw error; // Re-throw other errors
    }
  }

  /**
   * Delete a vacation by its ID.
   * @param vacationId The ID of the vacation to delete.
   * @returns True if the vacation was deleted, false otherwise.
   */
  static async deleteVacation(vacationId: number): Promise<boolean> {
    try {
      await prisma.vpg_vacations.delete({
        where: { vacations_id: vacationId },
      });
      return true;
    } catch (error) {
      throw error; // Re-throw other errors
    }
  }
}
