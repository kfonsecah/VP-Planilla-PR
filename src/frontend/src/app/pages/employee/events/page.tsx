'use client';

import React, { useState } from 'react';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
import StatsCards from '@/components/ui/StatsCards';
import LaborEventsCalendar from '@/components/LaborEventsCalendar';
import LaborEventModal from '@/components/LaborEventModal';
import { useLaborEvents } from '@/hooks/useLaborEvents';
import useEmployeeList from '@/hooks/useEmployeeList';
import { PlusIcon } from '@heroicons/react/24/outline';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { useModal } from '@/hooks/useModal';

const LaborEventsPage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EmployeeLaborEvent | undefined>();
  const [showEventModal, setShowEventModal] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<Partial<EmployeeLaborEvent> | null>(null);
  const [modalInitialDates, setModalInitialDates] = useState<{ start?: Date; end?: Date } | null>(null);
  const { events, isLoading, createEvent, updateEvent, deleteEvent, assignEventToEmployee, refreshEvents, deleteAssignment } = useLaborEvents();
  const { employees } = useEmployeeList();
  const { showError, showSuccess } = useModal();

  // Calculate stats
  const activeEvents = events.filter(event => event.status === 'active').length;
  const completedEvents = events.filter(event => event.status === 'completed').length;
  const cancelledEvents = events.filter(event => event.status === 'cancelled').length;

  // Prepare stats data for StatsCards component
  const eventsStatsData = [
    {
      title: 'Eventos Totales',
      value: events.length
    },
    {
      title: 'Eventos Activos',
      value: activeEvents
    },
    {
      title: 'Eventos Completados',
      value: completedEvents
    },
    {
      title: 'Eventos Cancelados',
      value: cancelledEvents
    }
  ];

  const handleEventClick = (event: EmployeeLaborEvent) => {
    setSelectedEvent(event);
    setModalInitialDates(null);
    setShowEventModal(true);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedEvent(undefined);
    setModalInitialDates({ start, end });
    setShowEventModal(true);
  };

  // Visible calendar range to sync the sidebar
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);

  const handleVisibleRangeChange = (start: Date, end: Date) => {
    setVisibleRange({ start, end });
  };

  const handleSubmit = async (data: LaborEventFormData) => {
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, data);
        showSuccess('Éxito', 'Evento actualizado correctamente');
      } else {
        await createEvent(data);
        showSuccess('Éxito', 'Evento creado correctamente');
      }
      setShowEventModal(false);
      setModalInitialDates(null);
    } catch (error) {
      showError('Error', 'No se pudo guardar el evento. Por favor intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Page header aligned with employee list */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest mb-1">
              Recursos Humanos
            </p>
            <h1 className="text-3xl font-bold text-[#3B4D36] leading-none">Eventos Laborales</h1>
          </div>
          <button
            onClick={() => {
              setSelectedEvent(undefined);
              setModalInitialDates(null);
              setShowEventModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F7153] text-white text-sm font-semibold rounded-lg hover:bg-[#5D614A] transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Crear Evento
          </button>
        </div>

        <div className="border-b border-[#C8BA9A] mb-5" />

        {/* Employee Tabs */}
        <EmployeeTabs />

        <div className="mt-6">
          {/* Stats Cards using reusable component */}
          <StatsCards stats={eventsStatsData} />

          {/* Calendar and Events List */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2.2fr_1fr] pb-8">
            {/* Main Calendar Container */}
            <section className="bg-[#F5F1E8] rounded-2xl shadow-sm border border-[#E0D6B7] min-h-[600px]">
              <div className="p-6 h-full">
                <LaborEventsCalendar
                  onEventClick={handleEventClick}
                  onDateSelect={handleDateSelect}
                  onVisibleRangeChange={handleVisibleRangeChange}
                  events={events}
                  employees={employees}
                  isLoading={isLoading}
                  refreshEvents={refreshEvents}
                  deleteAssignment={deleteAssignment}
                  updateEvent={updateEvent}
                  preview={previewEvent}
                  onPreviewChange={setPreviewEvent}
                />
              </div>
            </section>

            {/* Events Sidebar */}
            <aside className="bg-[#F5F1E8] rounded-2xl shadow-sm border border-[#E0D6B7] flex flex-col min-h-[600px]">
              {/* Header del sidebar */}
              <div className="bg-[#D4B896] px-5 py-4 rounded-t-2xl border-b border-[#D2B48C] flex-shrink-0">
                <h3 className="text-xs font-semibold text-[#3B4D36] uppercase tracking-[0.25em]">
                  {(() => {
                    const refDate = visibleRange ? visibleRange.start : new Date();
                    const monthNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
                    return `Eventos · ${monthNames[refDate.getMonth()]} ${refDate.getFullYear()}`;
                  })()}
                </h3>
              </div>

              {/* Lista de eventos */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {(!visibleRange || events.length === 0) ? (
                  <div className="p-5 text-center text-[#8B8B8B] text-sm">
                    No hay eventos este mes
                  </div>
                ) : (
                  <div className="divide-y divide-[#E0D6B7]">
                    {/* Filter events that intersect the visible range */}
                    {events.filter(ev => {
                      try {
                        const evStart = ev.start_date ? new Date(ev.start_date) : null;
                        const evEnd = ev.end_date ? new Date(ev.end_date) : evStart;
                        if (!evStart || !visibleRange) return false;
                        // event intersects visible range
                        return !(evEnd! < visibleRange.start || evStart > visibleRange.end);
                      } catch (e) { return false; }
                    }).slice(0, 10).map((event) => {
                      const employee = employees.find(e => String(e.id) === String(event.employee_id));
                      const eventName = (event as any).labor_event_name || `Evento #${event.labor_event_id}`;
                      const startDate = new Date(event.start_date);
                      const endDate = event.end_date ? new Date(event.end_date) : null;
                      
                      return (
                        <div 
                          key={event.id} 
                          className="p-3 hover:bg-[#FDFCF9] transition-colors cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          {/* Fecha del evento */}
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex flex-col items-center min-w-[40px]">
                              <div className="text-lg font-bold text-[#3B4D36]">
                                {startDate.getDate()}
                              </div>
                              <div className="text-xs text-[#5D4E37] uppercase">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][startDate.getDay()]}
                              </div>
                            </div>
                            
                            {/* Información del evento */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-[#3B4D36] text-sm truncate">
                                {eventName}
                              </h4>
                              <p className="text-xs text-[#5D4E37] truncate">
                                {employee ? employee.name : 'Empleado no asignado'}
                              </p>
                              {endDate && endDate.getTime() !== startDate.getTime() && (
                                <p className="text-xs text-[#8B8B8B]">
                                  Hasta: {endDate.getDate()} {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][endDate.getDay()]}
                                </p>
                              )}
                            </div>
                            
                            {/* Estado del evento */}
                            <div className="flex flex-col items-end">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === 'active' ? 'bg-green-100 text-green-800' :
                                event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.status === 'active' ? 'Activo' :
                                 event.status === 'completed' ? 'Completado' :
                                 event.status === 'cancelled' ? 'Cancelado' :
                                 'Pendiente'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Descripción si existe */}
                          {(event as any).labor_event_description && (
                            <p className="text-xs text-[#8B8B8B] mt-1 line-clamp-2">
                              {(event as any).labor_event_description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {events.length > 10 && (
                      <div className="p-3 text-center text-[#8B8B8B] text-sm border-t border-[#E0D6B7]">
                        Y {events.length - 10} eventos más...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <LaborEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setModalInitialDates(null);
          setSelectedEvent(undefined);
          setPreviewEvent(null);
        }}
        onSubmit={handleSubmit}
        event={selectedEvent}
        employees={employees}
        initialDates={modalInitialDates}
        onPreviewChange={setPreviewEvent}
      />
    </div>
  );
};

export default LaborEventsPage;
