import { prisma } from "../lib/prisma";
import { CompanyHoliday } from "../model/companyHolidayModel";

export class CompanyHolidayService {
  /**
   * Retrieves all active holidays for a given year
   */
  static async getAll(year?: number): Promise<CompanyHoliday[]> {
    let whereClause = { company_holidays_status: "active" };

    if (year) {
      const startDate = new Date(Date.UTC(year, 0, 1));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
      
      whereClause = Object.assign(whereClause, {
        company_holidays_date: {
          gte: startDate,
          lte: endDate,
        },
      });
    }

    return await prisma.vpg_company_holidays.findMany({
      where: whereClause,
      orderBy: { company_holidays_date: "asc" },
    });
  }

  /**
   * Creates a new company holiday
   */
  static async create(data: CompanyHoliday): Promise<CompanyHoliday> {
    return await prisma.vpg_company_holidays.create({
      data: {
        company_holidays_name: data.company_holidays_name,
        company_holidays_date: new Date(data.company_holidays_date),
        company_holidays_is_mandatory: data.company_holidays_is_mandatory ?? false,
        company_holidays_is_triple: data.company_holidays_is_triple ?? false,
        company_holidays_status: data.company_holidays_status ?? "active",
      },
    });
  }

  /**
   * Creates multiple holidays at once (useful for batch generating a year)
   */
  static async createMany(holidays: CompanyHoliday[]): Promise<{ count: number }> {
    const data = holidays.map((h) => ({
      company_holidays_name: h.company_holidays_name,
      company_holidays_date: new Date(h.company_holidays_date),
      company_holidays_is_mandatory: h.company_holidays_is_mandatory ?? false,
      company_holidays_is_triple: h.company_holidays_is_triple ?? false,
      company_holidays_status: h.company_holidays_status ?? "active",
    }));

    return await prisma.vpg_company_holidays.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Retrieves a specific holiday by ID
   */
  static async getById(id: number): Promise<CompanyHoliday | null> {
    return await prisma.vpg_company_holidays.findUnique({
      where: { company_holidays_id: id },
    });
  }

  /**
   * Updates an existing holiday
   */
  static async update(id: number, data: Partial<CompanyHoliday>): Promise<CompanyHoliday> {
    const updateData: any = {};
    if (data.company_holidays_name !== undefined) updateData.company_holidays_name = data.company_holidays_name;
    if (data.company_holidays_date !== undefined) updateData.company_holidays_date = new Date(data.company_holidays_date);
    if (data.company_holidays_is_mandatory !== undefined) updateData.company_holidays_is_mandatory = data.company_holidays_is_mandatory;
    if (data.company_holidays_is_triple !== undefined) updateData.company_holidays_is_triple = data.company_holidays_is_triple;
    if (data.company_holidays_status !== undefined) updateData.company_holidays_status = data.company_holidays_status;

    return await prisma.vpg_company_holidays.update({
      where: { company_holidays_id: id },
      data: updateData,
    });
  }

  /**
   * Soft deletes a holiday setting it to inactive
   */
  static async delete(id: number): Promise<CompanyHoliday> {
    return await prisma.vpg_company_holidays.update({
      where: { company_holidays_id: id },
      data: { company_holidays_status: "inactive" },
    });
  }
}
