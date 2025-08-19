'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EmployeeLaborEvent } from '@/types/laborEvent';
import { useModal } from '@/hooks/useModal';
import { useLaborEvents } from '@/hooks/useLaborEvents';
import '@/styles/calendar.css';

interface Props {
  onEventClick?: (event: EmployeeLaborEvent) => void;
  onDateSelect?: (start: Date, end: Date) => void;
}

const LaborEventsCalendar: React.FC<Props> = ({ onEventClick, onDateSelect }) => {
  const { events, isLoading } = useLaborEvents();
  const { showError } = useModal();

  // Función auxiliar para determinar el color del evento según su estado
  const getEventColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#3B4D36'; // Verde oscuro
      case 'completed':
        return '#6F7153'; // Verde grisáceo
      case 'cancelled':
        return '#E7DCC1'; // Beige
      default:
        return '#A7AA94'; // Verde claro
    }
  };

  // Convertir eventos a formato FullCalendar
  const calendarEvents = events.map(event => ({
    id: String(event.id),
    title: `Evento #${event.labor_event_id}`,
    start: event.start_date,
    end: event.end_date || undefined,
    backgroundColor: getEventColor(event.status),
    borderColor: getEventColor(event.status),
    extendedProps: { ...event }
  }));

  const handleEventClick = (info: any) => {
    const event = events.find(e => String(e.id) === info.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Cargando eventos...</div>;
  }

  return (
    <div className="calendar-container bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={calendarEvents}
        eventClick={handleEventClick}
        select={handleDateSelect}
        selectable={true}
        editable={true}
        locale="es"
        height="auto"
      />
    </div>
  );
};

export default LaborEventsCalendar;