'use client';

import { useState, useEffect } from 'react';
import { LaborEvent, EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';
import { LaborEventsService } from '@/services/laborEventsService';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';

const CACHE_KEY = 'vp_labor_events_cache';

type ApiLaborEvent = EmployeeLaborEvent & {
  employee_labor_event_employee_id?: number;
  employee_labor_event_labor_event_id?: number;
  employee_labor_event_start_date?: string;
  employee_labor_event_end_date?: string | null;
  employee_labor_event_status?: string;
  employee_labor_event_version?: number;
};

export const useLaborEvents = () => {
  const [events, setEvents] = useState<EmployeeLaborEvent[]>([]);
  const [catalog, setCatalog] = useState<LaborEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await LaborEventsService.getAllLaborEvents();
      setCatalog((data.laborEvents as LaborEvent[]) || []);
      
      const employeeEvents = data.employeeEvents || [];
      const mapped = (employeeEvents as ApiLaborEvent[]).map(ev => ({
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
      writeCache(CACHE_KEY, mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateLaborEventId = async (eventData: LaborEventFormData): Promise<{ id: number; name?: string }> => {
    // If the form already sent a catalog ID, use it directly
    if (eventData.labor_event_id) {
      const catalogEntry = catalog.find(c => c.id === eventData.labor_event_id);
      return { id: eventData.labor_event_id, name: catalogEntry?.name };
    }

    // Fallback: create a new catalog entry from the name (custom / legacy path)
    if (eventData.name || eventData.description) {
      const created = await LaborEventsService.createLaborEvent({
        name: eventData.name!,
        description: eventData.description!,
        event_type: 'custom'
      });
      return { id: created.id, name: created.name };
    }

    throw new Error('No se especificó un ID de evento ni datos para crear uno');
  };

  const createEvent = async (eventData: LaborEventFormData): Promise<EmployeeLaborEvent> => {
    try {
      const { id: laborEventId, name: createdName } = await getOrCreateLaborEventId(eventData);

      const assignPayload = {
        employee_id: eventData.employee_id!,
        labor_event_id: laborEventId,
        start_date: eventData.start_date instanceof Date ? 
          eventData.start_date.toISOString() : eventData.start_date!,
        end_date: eventData.end_date ? 
          (eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date) : null,
        status: eventData.status || 'active'
      };

      const assignedEvent = await LaborEventsService.assignLaborEventToEmployee(assignPayload);
      invalidateCache(CACHE_KEY);
      await fetchEvents();
      
      return {
        ...assignedEvent,
        labor_event_name: eventData.name || createdName,
        start_date: assignPayload.start_date,
        end_date: assignPayload.end_date,
      } as EmployeeLaborEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear evento');
      throw err;
    }
  };

  const mapUpdatedEvent = (event: EmployeeLaborEvent, id: number, eventData: Partial<LaborEventFormData>): EmployeeLaborEvent => {
    if (event.id !== id) return event;
    
    const updated = { ...event };
    
    if (eventData.start_date !== undefined) {
      updated.start_date = eventData.start_date instanceof Date ?
        eventData.start_date.toISOString() : (eventData.start_date || updated.start_date);
    }
    
    if (eventData.end_date !== undefined) {
      updated.end_date = eventData.end_date ?
        (eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date) : null;
    }
    
    if (eventData.status !== undefined) updated.status = eventData.status;
    if (eventData.employee_id !== undefined) updated.employee_id = eventData.employee_id;
    if (eventData.name !== undefined) updated.labor_event_name = eventData.name;
    if (eventData.description !== undefined) updated.labor_event_description = eventData.description;
    
    return updated;
  };

  const updateEvent = async (id: number, eventData: Partial<LaborEventFormData>): Promise<{ success: boolean }> => {
    try {
      const currentEvent = events.find(e => e.id === id);
      if (!currentEvent) throw new Error('Evento no encontrado');

      let hasUpdates = false;

      if (eventData.name !== undefined || eventData.description !== undefined) {
        const payload: { name?: string; description?: string } = {};
        if (eventData.name !== undefined) payload.name = eventData.name;
        if (eventData.description !== undefined) payload.description = eventData.description;
        
        await LaborEventsService.updateLaborEvent(currentEvent.labor_event_id, payload);
        hasUpdates = true;
      }

      const isLocalUpdate = eventData.start_date !== undefined || eventData.end_date !== undefined ||
          eventData.status !== undefined || eventData.employee_id !== undefined ||
          eventData.name !== undefined || eventData.description !== undefined;

      if (isLocalUpdate) {
        setEvents(prev => prev.map(ev => mapUpdatedEvent(ev, id, eventData)));
        hasUpdates = true;
      }

      if (hasUpdates && (eventData.name !== undefined || eventData.description !== undefined)) {
        await fetchEvents();
      }
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar evento');
      throw err;
    }
  };

  const deleteEvent = async (id: number): Promise<void> => {
    try {
      await LaborEventsService.deleteLaborEvent(id);
      invalidateCache(CACHE_KEY);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar evento');
      throw err;
    }
  };

  const deleteAssignment = async (id: number): Promise<void> => {
    try {
      await LaborEventsService.deleteEmployeeLaborEvent(id);
      invalidateCache(CACHE_KEY);
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
      invalidateCache(CACHE_KEY);
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
    catalog,
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