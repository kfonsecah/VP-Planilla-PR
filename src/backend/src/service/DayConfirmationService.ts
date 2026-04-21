import { prisma } from '../lib/prisma';

export class DayConfirmationService {
  static async upsert(employeeId: number, date: string, userId: number, notes?: string) {
    const confirmationDate = new Date(date);
    return await prisma.vpgDayConfirmation.upsert({
      where: {
        employee_id_confirmation_date: {
          employee_id: employeeId,
          confirmation_date: confirmationDate
        }
      },
      update: { confirmed_by: userId, confirmation_notes: notes },
      create: {
        employee_id: employeeId,
        confirmation_date: confirmationDate,
        confirmed_by: userId,
        confirmation_notes: notes,
      }
    });
  }

  static async getByEmployee(employeeId: number, startDate: string, endDate: string) {
    return await prisma.vpgDayConfirmation.findMany({
      where: {
        employee_id: employeeId,
        confirmation_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
  }
}
