'use client';

import { useState, useEffect } from 'react';
import { EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';
import { LaborEventsService } from '@/services/laborEventsService';

export const useLaborEvents = () => {
  const [events, setEvents] = useState<EmployeeLaborEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await LaborEventsService.getAllLaborEvents();
      const employeeEvents = data.employeeEvents || [];
      
      const mapped = employeeEvents.map(ev => ({
        id: ev.id,
        employee_id: ev.employee_labor_event_employee_id || ev.employee_id,
        labor_event_id: ev.labor_event_id || ev.employee_labor_event_labor_event_id,
        start_date: ev.start_date || ev.employee_labor_event_start_date,
        end_date: ev.end_date || ev.employee_labor_event_end_date,
        status: ev.status || ev.employee_labor_event_status,
        version: ev.version || ev.employee_labor_event_version,
        labor_event_name: ev.labor_event_name,
        labor_event_description: ev.labor_event_description,
      } as EmployeeLaborEvent));
      
      setEvents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: LaborEventFormData): Promise<EmployeeLaborEvent> => {
    try {
      let laborEventId: number | undefined = (eventData as any).labor_event_id;
      let created: any = undefined;

      if (!laborEventId && (eventData.name || eventData.description)) {
        created = await LaborEventsService.createLaborEvent({
          name: eventData.name!,
          description: eventData.description!
        });
        laborEventId = created.id;
      }

      const assignPayload = {
        employee_id: eventData.employee_id!,
        labor_event_id: laborEventId!,
        start_date: eventData.start_date instanceof Date ? 
          eventData.start_date.toISOString() : eventData.start_date!,
        end_date: eventData.end_date ? 
          (eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date) : null,
        status: eventData.status || 'active'
      };

      const assignedEvent = await LaborEventsService.assignLaborEventToEmployee(assignPayload);
      await fetchEvents();
      
      return {
        ...assignedEvent,
        labor_event_name: eventData.name || (created ? created.name : undefined),
        start_date: assignPayload.start_date,
        end_date: assignPayload.end_date,
      } as EmployeeLaborEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear evento');
      throw err;
    }
  };

  const updateEvent = async (id: number, eventData: Partial<LaborEventFormData>): Promise<{ success: boolean }> => {
    try {
      const updatePayload: any = {};
      
      if (eventData.start_date) {
        updatePayload.start_date = eventData.start_date instanceof Date ? 
          eventData.start_date.toISOString() : eventData.start_date;
      }
      
      if (eventData.end_date) {
        updatePayload.end_date = eventData.end_date instanceof Date ? 
          eventData.end_date.toISOString() : eventData.end_date;
      }
      
      if (eventData.status) {
        updatePayload.status = eventData.status;
      }
      
      if (eventData.employee_id) {
        updatePayload.employee_id = eventData.employee_id;
      }

      const currentEvent = events.find(e => e.id === id);
      if (currentEvent && (eventData.name || eventData.description)) {
        const eventTypePayload: any = {};
        if (eventData.name) eventTypePayload.name = eventData.name;
        if (eventData.description) eventTypePayload.description = eventData.description;
        
        await LaborEventsService.updateLaborEvent(currentEvent.labor_event_id, eventTypePayload);
      }

      await LaborEventsService.updateEmployeeLaborEvent(id, updatePayload);
      await fetchEvents();
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar evento');
      throw err;
    }
  };

  const deleteEvent = async (id: number): Promise<void> => {
    try {
      await LaborEventsService.deleteLaborEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar evento');
      throw err;
    }
  };

  const deleteAssignment = async (id: number): Promise<void> => {
    try {
      await LaborEventsService.deleteEmployeeLaborEvent(id);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar asignación');
      throw err;
    }
  };

  const assignEventToEmployee = async (eventData: EmployeeLaborEvent): Promise<EmployeeLaborEvent> => {
    try {
      const assignedEvent = await LaborEventsService.assignLaborEventToEmployee({
        employee_id: eventData.employee_id,
        labor_event_id: eventData.labor_event_id,
        start_date: eventData.start_date instanceof Date ? 
          eventData.start_date.toISOString() : eventData.start_date as string,
        end_date: eventData.end_date ? 
          (eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date as string) : null,
        status: eventData.status
      });
      await fetchEvents();
      return assignedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar evento');
      throw err;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    assignEventToEmployee,
    deleteAssignment,
    refreshEvents: fetchEvents,
  };
};