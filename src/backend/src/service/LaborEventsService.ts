import { prisma } from '../lib/prisma';
import { LaborEvent } from "../model/laborEvent";
import { EmployeeLaborEvent } from "../model/employeeLaborEvent";

export class LaborEventsService {
  /**
   * Create a new labor event
   * @param laborEvent - The labor event to create
   * @returns The created labor event
   * @throws Error if the labor event could not be created
   */

  static async createLaborEvent(data: LaborEvent): Promise<LaborEvent> {
    const prismaEvent = await prisma.vpg_labor_events.create({
      data: {
        labor_events_name: data.name,
        labor_events_description: data.description,
        labor_events_version: 1,
      },
    });

    const laborEvent: LaborEvent = {
      id: prismaEvent.labor_events_id,
      name: prismaEvent.labor_events_name,
      description: prismaEvent.labor_events_description,
      version: prismaEvent.labor_events_version,
    };

    return laborEvent;
  }

  /**
   * Update an existing labor event
   * @param id - The ID of the labor event to update
   * @param data - The new data for the labor event
   * @returns The updated labor event
   * @throws Error if the labor event could not be updated
   */

  static async updateLaborEvent(
    id: number,
    data: Partial<LaborEvent>
  ): Promise<LaborEvent | null> {
    const prismaEvent = await prisma.vpg_labor_events.update({
      where: { labor_events_id: id },
      data: {
        labor_events_name: data.name,
        labor_events_description: data.description,
        labor_events_version: data.version,
      },
    });

    if (!prismaEvent) {
      throw new Error(`Labor event with ID ${id} not found`);
    }

    const laborEvent: LaborEvent = {
      id: prismaEvent.labor_events_id,
      name: prismaEvent.labor_events_name,
      description: prismaEvent.labor_events_description,
      version: prismaEvent.labor_events_version,
    };

    return laborEvent;
  }

  /**
   * Delete an existing labor event
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

    const laborEvent: LaborEvent = {
      id: prismaEvent.labor_events_id,
      name: prismaEvent.labor_events_name,
      description: prismaEvent.labor_events_description,
      version: prismaEvent.labor_events_version,
    };

    return laborEvent;
  }

  /**
   * Get all labor Events
   * @returns An array of all labor events
   * @throws Error if the labor events could not be retrieved
   */

  static async getAllLaborEvents(): Promise<LaborEvent[]> {
    const prismaEvents = await prisma.vpg_labor_events.findMany();

    const laborEvents: LaborEvent[] = prismaEvents.map((event) => ({
      id: event.labor_events_id,
      name: event.labor_events_name,
      description: event.labor_events_description,
      version: event.labor_events_version,
    }));

    return laborEvents;
  }

  /**
   * Get all assigned labor events (employee assignments)
   */
  static async getAllEmployeeLaborEvents(): Promise<EmployeeLaborEvent[]> {
    const prismaEvents = await prisma.vpg_employee_labor_event.findMany({
      include: {
        vpg_labor_events: true,
      },
    });

    const employeeLaborEvents: EmployeeLaborEvent[] = prismaEvents.map((pe) => ({
      id: pe.employee_labor_event_id,
      employee_id: pe.employee_labor_event_employee_id,
      labor_event_id: pe.employee_labor_event_labor_event_id,
      start_date: pe.employee_labor_event_start_date,
      end_date: pe.employee_labor_event_end_date,
      status: pe.employee_labor_event_status,
      version: pe.employee_labor_event_version,
      // Agregar los datos del evento laboral desde la relación incluida
      labor_event_name: pe.vpg_labor_events?.labor_events_name || null,
      labor_event_description: pe.vpg_labor_events?.labor_events_description || null,
    } as any));


    return employeeLaborEvents;
  }

  /**
   * Assign labor events to employees
   * @param data - The employee labor event data
   * @returns The updated employee with the assigned labor events
   * @throws Error if the labor events could not be assigned
   */

  static async assignLaborEventsToEmployee(
    data: EmployeeLaborEvent
  ): Promise<EmployeeLaborEvent | null> {
    const prismaEmployeeLaborEvent =
      await prisma.vpg_employee_labor_event.create({
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
      throw new Error(
        `Could not assign labor event to employee with ID ${data.employee_id}`
      );
    }

    const employeeLaborEvent: EmployeeLaborEvent = {
      id: prismaEmployeeLaborEvent.employee_labor_event_id,
      employee_id: prismaEmployeeLaborEvent.employee_labor_event_employee_id,
      labor_event_id:
        prismaEmployeeLaborEvent.employee_labor_event_labor_event_id,
      start_date: prismaEmployeeLaborEvent.employee_labor_event_start_date,
      end_date: prismaEmployeeLaborEvent.employee_labor_event_end_date,
      status: prismaEmployeeLaborEvent.employee_labor_event_status,
      version: prismaEmployeeLaborEvent.employee_labor_event_version,
    };

    return employeeLaborEvent;
  }

  /**
   * Delete an employee labor event assignment by id
   */
  static async deleteEmployeeLaborEvent(id: number): Promise<EmployeeLaborEvent | null> {
    try {
      const deleted = await prisma.vpg_employee_labor_event.delete({
        where: { employee_labor_event_id: id },
      });

      const result: EmployeeLaborEvent = {
        id: deleted.employee_labor_event_id,
        employee_id: deleted.employee_labor_event_employee_id,
        labor_event_id: deleted.employee_labor_event_labor_event_id,
        start_date: deleted.employee_labor_event_start_date,
        end_date: deleted.employee_labor_event_end_date,
        status: deleted.employee_labor_event_status,
        version: deleted.employee_labor_event_version,
      };

      return result;
    } catch (error) {
      // If not found Prisma will throw; return null to indicate not found
      return null;
    }
  }
}
