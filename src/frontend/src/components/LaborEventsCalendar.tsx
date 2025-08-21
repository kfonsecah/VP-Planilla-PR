'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';
import { useModal } from '@/hooks/useModal';
import '@/styles/calendar.css';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Props {
  onEventClick?: (event: EmployeeLaborEvent) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  events: EmployeeLaborEvent[];
  employees: Employee[];
  isLoading: boolean;
  refreshEvents: () => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;
  preview?: Partial<EmployeeLaborEvent> | null;
  updateEvent?: (id: number, data: Partial<any>) => Promise<any>;
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
}

const LaborEventsCalendar: React.FC<Props> = ({ 
  onEventClick, 
  onDateSelect, 
  events, 
  employees,
  isLoading, 
  refreshEvents, 
  deleteAssignment, 
  preview, 
  updateEvent,
  onPreviewChange 
}) => {
  const { showError } = useModal();
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EmployeeLaborEvent | null>(null);
  const menuOpenedAtRef = React.useRef<number | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);

  // Force calendar re-render when events change
  React.useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [events.length, employees.length]); // Only trigger when the count changes, not the full arrays

  // Helper: parse backend date strings into local Date objects
  function parseBackendDateToLocal(dateStr?: string | null) {
    if (!dateStr) return undefined;
    try {
      const utcMidnightRegex = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/;
      const m = String(dateStr).match(utcMidnightRegex);
      if (m) {
        const [y, mo, d] = m[1].split('-').map(Number);
        return new Date(y, mo - 1, d, 0, 0, 0);
      }

      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return undefined;
      return parsed;
    } catch (e) {
      return undefined;
    }
  }

  // Convert events to FullCalendar format
  const calendarEvents = events.map(event => {
    const emp = employees.find(e => String(e.id) === String(event.employee_id));
    const employeeName = emp ? emp.name : 'Empleado';
    const titleName = (event as any).labor_event_name || `Evento #${event.labor_event_id}`;

    const startDate = parseBackendDateToLocal(event.start_date as any);
    let endDate = parseBackendDateToLocal(event.end_date as any);

    const isAllDay = typeof event.start_date === 'string' && /T00:00:00(?:\.000)?Z$/.test(String(event.start_date));
    if (isAllDay) {
      if (!endDate || (startDate && endDate && endDate.getTime() <= (startDate.getTime()))) {
        if (startDate) {
          const nd = new Date(startDate);
          nd.setDate(nd.getDate() + 1);
          endDate = nd;
        }
      }
    }

    // Color based on status
    let backgroundColor, borderColor;
    switch (event.status) {
      case 'active':
        backgroundColor = '#10B981';
        borderColor = '#059669';
        break;
      case 'completed':
        backgroundColor = '#3B82F6';
        borderColor = '#2563EB';
        break;
      case 'cancelled':
        backgroundColor = '#EF4444';
        borderColor = '#DC2626';
        break;
      default:
        backgroundColor = '#6B7280';
        borderColor = '#4B5563';
    }

    return {
      id: String(event.id),
      title: `${titleName} - ${employeeName}`,
      start: startDate,
      end: endDate || undefined,
      allDay: isAllDay,
      backgroundColor,
      borderColor,
      textColor: '#FFFFFF',
      extendedProps: { ...event }
    };
  });

  // Add preview event if provided
  if (preview) {
    const emp = employees.find(e => String(e.id) === String(preview.employee_id));
    const empName = emp ? emp.name : 'Empleado';
    const title = (preview as any).labor_event_name || 'Evento (previsualización)';
    const start = preview.start_date ? (preview.start_date instanceof Date ? preview.start_date : parseBackendDateToLocal(String(preview.start_date))) : undefined;
    let end = preview.end_date ? (preview.end_date instanceof Date ? preview.end_date : parseBackendDateToLocal(String(preview.end_date))) : undefined;

    if (start) {
      calendarEvents.push({
        id: 'preview',
        title: `${title} - ${empName}`,
        start,
        end: end || undefined,
        allDay: false,
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        textColor: '#FFFFFF',
        extendedProps: { ...(preview as any), __isPreview: true }
      });
    }
  }

  const openMenuForEvent = (ev: any, clientX: number, clientY: number) => {
    const eventObj = events.find(e => String(e.id) === String(ev.id));
    setSelectedEvent(eventObj || null);
    setAnchor({ x: clientX, y: clientY });
    menuOpenedAtRef.current = Date.now();
  };

  const closeMenu = () => {
    setAnchor(null);
    setSelectedEvent(null);
    menuOpenedAtRef.current = null;
  };

  const handleDeleteClick = async () => {
    if (!selectedEvent) return;
    try {
      await deleteAssignment(selectedEvent.id);
      await refreshEvents();
      closeMenu();
    } catch (err) {
      showError('Error', 'No se pudo eliminar la asignación');
    }
  };

  const handleEventClick = (info: any) => {
    const jsEvent = info.jsEvent;
    if (jsEvent) {
      jsEvent.preventDefault();
      jsEvent.stopPropagation();
      if (jsEvent.button === 2) return;
    }

    const event = events.find(e => String(e.id) === info.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
  };

  // Close menu on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!anchor) return;
      if (menuOpenedAtRef.current && Date.now() - menuOpenedAtRef.current < 300) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const menu = document.querySelector('.laborevent-options-menu');
      if (menu && !menu.contains(target)) {
        closeMenu();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [anchor]);

  const handleDateSelect = (selectInfo: any) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    const eventId = Number(resizeInfo.event.id);
    const payload = {
      start_date: resizeInfo.event.start ? resizeInfo.event.start.toISOString() : null,
      end_date: resizeInfo.event.end ? resizeInfo.event.end.toISOString() : null,
    };

    try {
      if (updateEvent) {
        await updateEvent(eventId, payload);
        await refreshEvents();
      }
    } catch (err) {
      try { resizeInfo.revert(); } catch(e){}
      showError('Error', 'No se pudo actualizar la duración del evento');
    }
  };

  const handleEventDrop = async (dropInfo: any) => {
    const eventId = Number(dropInfo.event.id);
    const payload = {
      start_date: dropInfo.event.start ? dropInfo.event.start.toISOString() : null,
      end_date: dropInfo.event.end ? dropInfo.event.end.toISOString() : null,
    };

    try {
      if (updateEvent) {
        await updateEvent(eventId, payload);
        await refreshEvents();
      }
    } catch (err) {
      try { dropInfo.revert(); } catch(e){}
      showError('Error', 'No se pudo mover el evento');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96 text-[#8B8B8B]">Cargando eventos...</div>;
  }

  return (
    <div className="w-full h-full">
      <div className="calendar-container h-full">
        <FullCalendar
          key={calendarKey}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          timeZone="local"
          editable={true}
          eventResizableFromStart={true}
          eventDurationEditable={true}
          eventStartEditable={true}
          eventResize={handleEventResize}
          eventDrop={handleEventDrop}
          eventDidMount={(info) => {
            try {
              info.el.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const evObj = info.event.toPlainObject();
                  openMenuForEvent(evObj, e.clientX || 0, e.clientY || 0);
                } catch (ex) {}
              });
            } catch (e) {}
          }}
          eventClick={handleEventClick}
          select={handleDateSelect}
          selectable={true}
          locale="es"
          height="100%"
          aspectRatio={1.5}
          dayMaxEvents={2}
          moreLinkClick="popover"
          eventTextColor="#FFFFFF"
          eventDisplay="block"
        />

        {/* Options popover */}
        {anchor && selectedEvent && (
          <div
            style={{ position: 'fixed', left: anchor.x, top: anchor.y, transform: 'translate(6px, 6px)', zIndex: 1000 }}
            className="laborevent-options-menu w-48 bg-white border border-[#E0D6B7] rounded-lg shadow-lg"
          >
            <div className="py-1">
              <button
                onClick={() => { if (selectedEvent) onEventClick?.(selectedEvent); closeMenu(); }}
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#F5F1E8] transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
                Ver Detalles
              </button>
              <button
                onClick={() => { if (selectedEvent) onEventClick?.(selectedEvent); closeMenu(); }}
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#F5F1E8] transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Editar Evento
              </button>
              <div className="border-t border-[#E0D6B7] mx-2 my-1"></div>
              <button
                onClick={handleDeleteClick}
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaborEventsCalendar;