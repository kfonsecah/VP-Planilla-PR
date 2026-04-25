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

  static async getByEmployee(employeeId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (employeeId && !isNaN(employeeId)) {
      where.employee_id = employeeId;
    }
    if (startDate || endDate) {
      where.confirmation_date = {};
      if (startDate) where.confirmation_date.gte = new Date(startDate);
      if (endDate) where.confirmation_date.lte = new Date(endDate);
    }
    return await prisma.vpgDayConfirmation.findMany({ where });
  }
}
