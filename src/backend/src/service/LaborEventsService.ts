import { prisma } from '../lib/prisma';
import { LaborEvent, LaborEventPayBehavior } from '../model/laborEvent';
import { EmployeeLaborEvent } from '../model/employeeLaborEvent';

/** Map a Prisma vpg_labor_events row to the LaborEvent domain model */
function mapLaborEvent(row: {
  labor_events_id: number;
  labor_events_name: string;
  labor_events_description: string;
  labor_events_version: number;
  labor_event_pay_behavior?: string | null;
  labor_event_max_paid_days?: number | null;
  labor_event_pay_percentage?: { toString(): string } | null;
}): LaborEvent {
  return {
    id: row.labor_events_id,
    name: row.labor_events_name,
    description: row.labor_events_description,
    version: row.labor_events_version,
    payBehavior: (row.labor_event_pay_behavior ?? 'NO_PAY') as LaborEventPayBehavior,
    maxPaidDays: row.labor_event_max_paid_days ?? null,
    payPercentage: row.labor_event_pay_percentage != null
      ? parseFloat(row.labor_event_pay_percentage.toString())
      : null,
  };
}

export class LaborEventsService {
  /**
   * Create a new labor event catalog entry.
   * @param data - The labor event to create
   * @returns The created labor event
   * @throws Error if the labor event could not be created
   */
  static async createLaborEvent(data: Partial<LaborEvent>): Promise<LaborEvent> {
    const prismaEvent = await prisma.vpg_labor_events.create({
      data: {
        labor_events_name: data.name ?? '',
        labor_events_description: data.description ?? '',
        labor_events_version: 1,
        labor_event_pay_behavior: (data.payBehavior ?? 'NO_PAY') as any,
        labor_event_max_paid_days: data.maxPaidDays ?? null,
        labor_event_pay_percentage: data.payPercentage ?? null,
      },
    });

    return mapLaborEvent(prismaEvent);
  }

  /**
   * Update an existing labor event catalog entry.
   * @param id - The ID of the labor event to update
   * @param data - The new data for the labor event
   * @returns The updated labor event
   * @throws Error if the labor event could not be updated
   */
  static async updateLaborEvent(id: number, data: Partial<LaborEvent>): Promise<LaborEvent | null> {
    const prismaEvent = await prisma.vpg_labor_events.update({
      where: { labor_events_id: id },
      data: {
        ...(data.name !== undefined && { labor_events_name: data.name }),
        ...(data.description !== undefined && { labor_events_description: data.description }),
        ...(data.version !== undefined && { labor_events_version: data.version }),
        ...(data.payBehavior !== undefined && { labor_event_pay_behavior: data.payBehavior as any }),
        ...(data.maxPaidDays !== undefined && { labor_event_max_paid_days: data.maxPaidDays }),
        ...(data.payPercentage !== undefined && { labor_event_pay_percentage: data.payPercentage }),
      },
    });

    if (!prismaEvent) {
      throw new Error(`Labor event with ID ${id} not found`);
    }

    return mapLaborEvent(prismaEvent);
  }

  /**
   * Delete an existing labor event catalog entry.
   * @param id - The ID of the labor event to delete
   * @returns The deleted labor event
   * @throws Error if the labor event could not be deleted
   */
  static async deleteLaborEvent(id: number): Promise<LaborEvent | null> {
    const prismaEvent = await prisma.vpg_labor_events.delete({
      where: { labor_events_id: id },
    });

    if (!prismaEvent) {
      throw new Error(`Labor event with ID ${id} not found`);
    }

    return mapLaborEvent(prismaEvent);
  }

  /**
   * Get all labor event catalog entries.
   * @returns An array of all labor events
   * @throws Error if the labor events could not be retrieved
   */
  static async getAllLaborEvents(): Promise<LaborEvent[]> {
    const prismaEvents = await prisma.vpg_labor_events.findMany({
      orderBy: { labor_events_name: 'asc' },
    });

    return prismaEvents.map(mapLaborEvent);
  }

  /**
   * Get all employee labor event assignments (with catalog relation included).
   * @returns Array of all employee labor event assignments
   */
  static async getAllEmployeeLaborEvents(): Promise<EmployeeLaborEvent[]> {
    const prismaEvents = await prisma.vpg_employee_labor_event.findMany({
      include: {
        vpg_labor_events: true,
      },
    });

    return prismaEvents.map((pe) => ({
      id: pe.employee_labor_event_id,
      employee_id: pe.employee_labor_event_employee_id,
      labor_event_id: pe.employee_labor_event_labor_event_id,
      start_date: pe.employee_labor_event_start_date,
      end_date: pe.employee_labor_event_end_date,
      status: pe.employee_labor_event_status,
      version: pe.employee_labor_event_version,
      labor_event_name: pe.vpg_labor_events?.labor_events_name || null,
      labor_event_description: pe.vpg_labor_events?.labor_events_description || null,
    } as any));
  }

  /**
   * Get all labor-event assignments for a single employee, with catalog
   * fields (name/description) joined in. Used by the employee profile
   * "Eventos" tab. Ordered by start_date desc (most recent first).
   * @param employeeId - The employee's id
   * @returns Array of EmployeeLaborEvent enriched with labor_event_name / labor_event_description
   */
  static async getLaborEventsByEmployee(employeeId: number): Promise<EmployeeLaborEvent[]> {
    const prismaEvents = await prisma.vpg_employee_labor_event.findMany({
      where: { employee_labor_event_employee_id: employeeId },
      include: { vpg_labor_events: true },
      orderBy: { employee_labor_event_start_date: 'desc' },
    });

    return prismaEvents.map((pe) => ({
      id: pe.employee_labor_event_id,
      employee_id: pe.employee_labor_event_employee_id,
      labor_event_id: pe.employee_labor_event_labor_event_id,
      start_date: pe.employee_labor_event_start_date,
      end_date: pe.employee_labor_event_end_date,
      status: pe.employee_labor_event_status,
      version: pe.employee_labor_event_version,
      labor_event_name: pe.vpg_labor_events?.labor_events_name || null,
      labor_event_description: pe.vpg_labor_events?.labor_events_description || null,
    } as any));
  }

  /**
   * Assign a labor event to an employee.
   * @param data - The employee labor event data
   * @returns The created assignment
   * @throws Error if the assignment could not be created
   */
  static async assignLaborEventsToEmployee(data: EmployeeLaborEvent): Promise<EmployeeLaborEvent | null> {
    const prismaEmployeeLaborEvent = await prisma.vpg_employee_labor_event.create({
      data: {
        employee_labor_event_employee_id: data.employee_id,
        employee_labor_event_labor_event_id: data.labor_event_id,
        employee_labor_event_start_date: data.start_date,
        employee_labor_event_end_date: data.end_date,
        employee_labor_event_status: data.status,
        employee_labor_event_version: 1,
      },
    });

    if (!prismaEmployeeLaborEvent) {
      throw new Error(`Could not assign labor event to employee with ID ${data.employee_id}`);
    }

    return {
      id: prismaEmployeeLaborEvent.employee_labor_event_id,
      employee_id: prismaEmployeeLaborEvent.employee_labor_event_employee_id,
      labor_event_id: prismaEmployeeLaborEvent.employee_labor_event_labor_event_id,
      start_date: prismaEmployeeLaborEvent.employee_labor_event_start_date,
      end_date: prismaEmployeeLaborEvent.employee_labor_event_end_date,
      status: prismaEmployeeLaborEvent.employee_labor_event_status,
      version: prismaEmployeeLaborEvent.employee_labor_event_version,
    };
  }

  /**
   * Delete an employee labor event assignment by id.
   * @param id - The ID of the employee labor event to delete
   * @returns The deleted assignment or null if not found
   */
  static async deleteEmployeeLaborEvent(id: number): Promise<EmployeeLaborEvent | null> {
    try {
      const deleted = await prisma.vpg_employee_labor_event.delete({
        where: { employee_labor_event_id: id },
      });

      return {
        id: deleted.employee_labor_event_id,
        employee_id: deleted.employee_labor_event_employee_id,
        labor_event_id: deleted.employee_labor_event_labor_event_id,
        start_date: deleted.employee_labor_event_start_date,
        end_date: deleted.employee_labor_event_end_date,
        status: deleted.employee_labor_event_status,
        version: deleted.employee_labor_event_version,
      };
    } catch {
      return null;
    }
  }
}
