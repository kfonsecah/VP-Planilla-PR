import { PrismaClient } from "@prisma/client";
import { LaborEvent } from "../model/laborEvent";

const prisma = new PrismaClient();

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
}
