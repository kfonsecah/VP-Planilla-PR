'use client';

import { useState, useEffect } from 'react';
import { LaborEvent, EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';
import { API_CONFIG } from '@/config';

export const useLaborEvents = () => {
  const [events, setEvents] = useState<EmployeeLaborEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events`);
      if (!response.ok) throw new Error('Error al cargar eventos');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: LaborEventFormData) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) throw new Error('Error al crear evento');
      const newEvent = await response.json();
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear evento');
      throw err;
    }
  };

  const updateEvent = async (id: number, eventData: Partial<LaborEventFormData>) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Error al actualizar evento');
      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar evento');
      throw err;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar evento');
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar evento');
      throw err;
    }
  };

  const assignEventToEmployee = async (eventData: EmployeeLaborEvent) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Error al asignar evento');
      const assignedEvent = await response.json();
      setEvents(prev => [...prev, assignedEvent]);
      return assignedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar evento');
      throw err;
    }
  };

  // Cargar eventos al montar el componente
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
    refreshEvents: fetchEvents,
  };
};