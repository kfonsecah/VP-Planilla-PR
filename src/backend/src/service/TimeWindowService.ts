import { prisma } from '../lib/prisma';
import { CreateTimeWindowInput, UpdateTimeWindowInput } from '../schemas/TimeWindowSchema';

export class TimeWindowService {
  static async create(data: CreateTimeWindowInput) {
    return await prisma.vpgTimeWindow.create({
      data: {
        company_id: data.companyId,
        time_window_name: data.name,
        time_window_type: data.type,
        time_window_start_hour: data.startHour,
        time_window_end_hour: data.endHour,
      },
    });
  }

  static async getAll(companyId: number) {
    return await prisma.vpgTimeWindow.findMany({
      where: { company_id: companyId, time_window_active: true },
      orderBy: { time_window_start_hour: 'asc' },
    });
  }

  static async update(id: number, data: UpdateTimeWindowInput) {
    return await prisma.vpgTimeWindow.update({
      where: { time_window_id: id },
      data: {
        time_window_name: data.name,
        time_window_type: data.type,
        time_window_start_hour: data.startHour,
        time_window_end_hour: data.endHour,
      },
    });
  }

  static async delete(id: number) {
    return await prisma.vpgTimeWindow.update({
      where: { time_window_id: id },
      data: { time_window_active: false },
    });
  }
}
