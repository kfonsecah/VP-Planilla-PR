'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';

// Lazy-load FullCalendar component — plugins kept static (small ~30-50KB each, needed as objects not components)
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 text-zinc-400">
      Cargando calendario...
    </div>
  ),
});
import { EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';
import { Employee } from '@/types/employee';
import { useModal } from '@/hooks/useModal';
import EventPopover from '@/components/EventPopover';
import '@/styles/calendar.css';
import { toast } from 'sonner';
import { CompanyHoliday } from '@/services/holidaysService';

// Helper: parse backend date strings into local Date objects
function parseBackendDateToLocal(dateStr?: string | null): Date | undefined {
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
  } catch {
    return undefined;
  }
}

// Determinar clase CSS por tipo de evento
function getEventTypeClass(eventName?: string): string {
  const name = (eventName || '').toLowerCase();
  if (name.includes('vacacion')) return 'event-type-vacaciones';
  if (name.includes('incapacidad')) return 'event-type-incapacidad';
  if (name.includes('permiso')) return 'event-type-permiso';
  if (name.includes('libre')) return 'event-type-dia-libre';
  if (name.includes('suspensi')) return 'event-type-suspension';
  return 'event-type-otro';
}

// Determinar clase CSS por status (badge dot)
function getStatusBadgeClass(status?: string): string {
  if (status === 'completed') return 'status-badge-completed';
  if (status === 'cancelled') return 'status-badge-cancelled';
  return 'status-badge-active';
}

function resolveEventDate(dateValue: string | Date | null | undefined): Date | undefined {
  if (!dateValue) return undefined;
  return dateValue instanceof Date
    ? parseBackendDateToLocal(dateValue.toISOString())
    : parseBackendDateToLocal(dateValue);
}

function toCalendarEvent(event: EmployeeLaborEvent, employees: Employee[]): EventInput {
  const emp = employees.find(e => String(e.id) === String(event.employee_id));
  const employeeName = emp ? emp.name : 'Empleado';
  const titleName = event.labor_event_name || `Evento #${event.labor_event_id}`;

  const startDate = resolveEventDate(event.start_date);
  let endDate = resolveEventDate(event.end_date ?? undefined);

  const isAllDay = typeof event.start_date === 'string' && /T00:00:00(?:\.000)?Z$/.test(String(event.start_date));
  if (isAllDay && startDate && (!endDate || endDate.getTime() <= startDate.getTime())) {
    const nd = new Date(startDate);
    nd.setDate(nd.getDate() + 1);
    endDate = nd;
  }

  return {
    id: String(event.id),
    title: `${titleName} - ${employeeName}`,
    start: startDate,
    end: endDate || undefined,
    allDay: isAllDay,
    textColor: '#FFFFFF',
    classNames: [getEventTypeClass(event.labor_event_name), getStatusBadgeClass(event.status)],
    extendedProps: { ...event },
  };
}

interface Props {
  onEventClick?: (event: EmployeeLaborEvent) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onVisibleRangeChange?: (start: Date, end: Date) => void;
  events: EmployeeLaborEvent[];
  employees: Employee[];
  isLoading: boolean;
  refreshEvents: () => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;
  preview?: Partial<EmployeeLaborEvent> | null;
  updateEvent?: (id: number, data: Partial<LaborEventFormData>) => Promise<{ success: boolean }>;
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
  navigateToDate?: Date;
  dbHolidays?: any[]; // using any[] to avoid circular CompanyHoliday type dependency or we can import it
  onEditHoliday?: (holiday: any) => void;
}

const LaborEventsCalendar: React.FC<Props> = ({ 
  onEventClick, 
  onDateSelect, 
  onVisibleRangeChange,
  events, 
  employees,
  isLoading, 
  refreshEvents, 
  deleteAssignment, 
  preview,
  updateEvent,
  navigateToDate,
  dbHolidays,
  onEditHoliday,
}) => {
  const { showError } = useModal();
  const [calendarKey, setCalendarKey] = useState(0);

  // Estado del popover de acciones
  const [popoverEvent, setPopoverEvent] = useState<{
    event: EmployeeLaborEvent;
    anchor: { x: number; y: number };
  } | null>(null);

  // Force calendar re-render when events or navigation date change
  useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [events.length, employees.length, navigateToDate?.getTime(), dbHolidays]);

  const getPreviewEvent = (): EventInput | null => {
    if (!preview) return null;
    const emp = employees.find(e => String(e.id) === String(preview.employee_id));
    const empName = emp ? emp.name : 'Empleado';
    const title = preview.labor_event_name || 'Evento (previsualización)';
    const start = preview.start_date ? (preview.start_date instanceof Date ? preview.start_date : parseBackendDateToLocal(String(preview.start_date))) : undefined;
    const end = preview.end_date ? (preview.end_date instanceof Date ? preview.end_date : parseBackendDateToLocal(String(preview.end_date))) : undefined;

    if (!start) return null;

    return {
      id: 'preview',
      title: `🔍 Vista previa: ${title} - ${empName}`,
      start,
      end: end || undefined,
      allDay: false,
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      textColor: '#FFFFFF',
      classNames: ['status-preview', 'event-preview-ghost'],
      editable: false,
      extendedProps: { ...preview, __isPreview: true }
    } as EventInput;
  };

  // Convert events to FullCalendar format
  const calendarEvents: EventInput[] = events.map(event => toCalendarEvent(event, employees));
  const previewEvent = getPreviewEvent();
  if (previewEvent) {
    calendarEvents.push(previewEvent);
  }

  // Add Dynamic Costa Rica holidays from Database
  if (dbHolidays && dbHolidays.length > 0) {
    dbHolidays.forEach(h => {
      const hDate = parseBackendDateToLocal(h.company_holidays_date);
      if (!hDate) return;
      
      calendarEvents.push({
        id: `holiday-${h.company_holidays_id}`,
        title: `🇨🇷 ${h.company_holidays_name} (${h.company_holidays_is_mandatory ? 'Pago Obligatorio' : 'No Obligatorio'})`,
        start: hDate,
        allDay: true,
        editable: false,
        classNames: [h.company_holidays_is_mandatory ? 'event-type-feriado-obligatorio' : 'event-type-feriado-no-obligatorio'],
        display: 'block',
        extendedProps: { isHoliday: true, holidayDetails: h }
      });
    });
  }

  const handleEventClick = (info: EventClickArg) => {
    const jsEvent = info.jsEvent;
    if (jsEvent) {
      jsEvent.preventDefault();
      jsEvent.stopPropagation();
      if (jsEvent.button === 2) return;
    }

    if (info.event.extendedProps.isHoliday) {
      const h = info.event.extendedProps.holidayDetails;
      if (h && onEditHoliday) {
        onEditHoliday(h);
      }
      return;
    }

    if (info.event.extendedProps.__isPreview) {
      return;
    }

    const event = events.find(e => String(e.id) === info.event.id);
    if (event) {
      const rect = info.el.getBoundingClientRect();
      setPopoverEvent({
        event,
        anchor: { x: rect.right + 8, y: rect.top }
      });
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    }
  };

  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    const eventId = Number(resizeInfo.event.id);
    const payload: Partial<LaborEventFormData> = {
      start_date: resizeInfo.event.start ? resizeInfo.event.start.toISOString() : undefined,
      end_date: resizeInfo.event.end ? resizeInfo.event.end.toISOString() : undefined,
    };

    try {
      if (updateEvent) {
        await updateEvent(eventId, payload);
        await refreshEvents();
      }
    } catch {
      try { resizeInfo.revert(); } catch {}
      showError('Error', 'No se pudo actualizar la duración del evento');
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const eventId = Number(dropInfo.event.id);
    const payload: Partial<LaborEventFormData> = {
      start_date: dropInfo.event.start ? dropInfo.event.start.toISOString() : undefined,
      end_date: dropInfo.event.end ? dropInfo.event.end.toISOString() : undefined,
    };

    try {
      if (updateEvent) {
        await updateEvent(eventId, payload);
        await refreshEvents();
      }
    } catch {
      try { dropInfo.revert(); } catch {}
      showError('Error', 'No se pudo mover el evento');
    }
  };

  const handleDatesSet = (arg: { start: Date; end: Date; view: unknown }) => {
    try {
      if (!onVisibleRangeChange) return;

      const view = arg.view as typeof arg.view & { currentStart?: Date; currentEnd?: Date };
      const rawStart = view?.currentStart ?? arg.start;
      const rawEnd = view?.currentEnd ?? arg.end;

      if (rawStart && rawEnd) {
        const start = new Date(rawStart);
        start.setHours(0,0,0,0);
        const end = new Date(rawEnd);
        end.setMilliseconds(end.getMilliseconds() - 1);
        onVisibleRangeChange(start, end);
      }
    } catch {}
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96 text-zinc-400 dark:text-zinc-500">Cargando eventos...</div>;
  }

  return (
    <div className="w-full h-full">
      <div className="calendar-container h-full">
        <FullCalendar
          key={calendarKey}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={navigateToDate || undefined}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
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
            // Tooltip nativo para feriados
            if (info.event.extendedProps.isHoliday) {
              const h = info.event.extendedProps.holidayDetails as CompanyHoliday | undefined;
              if (h) {
                const tipo = h.company_holidays_is_mandatory ? 'Pago Obligatorio' : 'No Obligatorio';
                info.el.setAttribute('title', `${h.company_holidays_name} (${tipo}) - Clic para ver detalles`);
              }
            }

            // Agregar etiqueta "Vista previa" a eventos preview
            if (info.event.extendedProps.__isPreview) {
              const label = document.createElement('span');
              label.className = 'preview-label';
              label.textContent = 'Vista previa';
              info.el.prepend(label);
            }
          }}
          eventClick={handleEventClick}
          select={handleDateSelect}
          selectable={true}
          datesSet={handleDatesSet}
          locale="es"
          height="100%"
          aspectRatio={1.5}
          dayMaxEvents={2}
          moreLinkClick="popover"
          eventTextColor="#FFFFFF"
          eventDisplay="block"
        />

        {/* Click popover de acciones */}
        {popoverEvent && (
          <EventPopover
            event={popoverEvent.event}
            anchor={popoverEvent.anchor}
            employeeName={employees.find(e => String(e.id) === String(popoverEvent.event.employee_id))?.name || 'Empleado'}
            onView={() => { onEventClick?.(popoverEvent.event); setPopoverEvent(null); }}
            onEdit={() => { onEventClick?.(popoverEvent.event); setPopoverEvent(null); }}
            onDelete={async () => {
              try {
                await deleteAssignment(popoverEvent.event.id);
                await refreshEvents();
                setPopoverEvent(null);
              } catch {
                showError('Error', 'No se pudo eliminar la asignación');
              }
            }}
            onClose={() => setPopoverEvent(null)}
          />
        )}
      </div>
    </div>
  );
};

export default LaborEventsCalendar;