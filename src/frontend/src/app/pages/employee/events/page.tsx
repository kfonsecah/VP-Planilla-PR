'use client';

import React, { useState, useMemo, useEffect } from 'react';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
import StatsCards from '@/components/ui/StatsCards';
import LaborEventsCalendar from '@/components/LaborEventsCalendar';
import LaborEventModal from '@/components/LaborEventModal';
import HolidaysManagementModal from '@/components/HolidaysManagementModal';
import EventsSidebar from '@/components/EventsSidebar';
import { useLaborEvents } from '@/hooks/useLaborEvents';
import useEmployeeList from '@/hooks/useEmployeeList';
import { useHolidays } from '@/hooks/useHolidays';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { toast } from 'sonner';

const LaborEventsPage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EmployeeLaborEvent | undefined>();
  const [showEventModal, setShowEventModal] = useState(false);
  const [showHolidaysModal, setShowHolidaysModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<import('@/services/holidaysService').CompanyHoliday | null>(null);
  const [previewEvent, setPreviewEvent] = useState<Partial<EmployeeLaborEvent> | null>(null);
  const [modalInitialDates, setModalInitialDates] = useState<{ start?: Date; end?: Date } | null>(null);
  const { events, catalog, isLoading, error, createEvent, updateEvent, refreshEvents, deleteAssignment } = useLaborEvents();
  const { employees } = useEmployeeList();
  const { data: dbHolidays, refetch: refetchHolidays } = useHolidays();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState<{
    employeeId: string | null;
    eventType: string | null;
    status: string | null;
  }>({
    employeeId: null,
    eventType: null,
    status: null,
  });

  // Forzar redibujo de FullCalendar tras colapsar/expandir sidebar
  useEffect(() => {
    // 300ms es el tiempo que suele durar la transición CSS de Tailwind
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 310);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // Filtrar eventos según filtros activos del sidebar
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchesEmployee = !filters.employeeId || String(ev.employee_id) === String(filters.employeeId);
      const matchesType = !filters.eventType || (ev.labor_event_name || '').toLowerCase().includes(filters.eventType.toLowerCase());
      const matchesStatus = !filters.status || ev.status === filters.status;
      return matchesEmployee && matchesType && matchesStatus;
    });
  }, [events, filters]);

  // Stats usando eventos filtrados
  const activeEvents = filteredEvents.filter(event => event.status === 'active').length;
  const completedEvents = filteredEvents.filter(event => event.status === 'completed').length;
  const cancelledEvents = filteredEvents.filter(event => event.status === 'cancelled').length;

  const eventsStatsData = [
    { title: 'Eventos Totales', value: filteredEvents.length },
    { title: 'Eventos Activos', value: activeEvents },
    { title: 'Eventos Completados', value: completedEvents },
    { title: 'Eventos Cancelados', value: cancelledEvents },
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

  const handleCreateEvent = () => {
    setSelectedEvent(undefined);
    setModalInitialDates(null);
    setShowEventModal(true);
  };

  const handleSubmit = async (data: LaborEventFormData) => {
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, data);
        toast.success('Evento actualizado correctamente');
      } else {
        await createEvent(data);
        toast.success('Evento creado correctamente');
      }
      setShowEventModal(false);
      setModalInitialDates(null);
    } catch {
      toast.error('No se pudo guardar el evento. Por favor intente nuevamente.');
    }
  };

  const handleFiltersChange = (update: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...update }));
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
              Recursos Humanos
            </p>
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-white leading-none">Eventos Laborales</h1>
          </div>
        </div>

        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-5" />

        {/* Employee Tabs */}
        <EmployeeTabs />

        {/* Error banner */}
        {error && (
          <div className="mt-4 mb-4 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <div className="flex flex-col items-center">
                <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos</p>
                <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={refreshEvents}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-4 mt-6 pb-8">
            <div className="w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 min-h-[600px] animate-pulse flex-shrink-0">
              <div className="p-4 space-y-4">
                <div className="h-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              </div>
            </div>
            <section className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 min-h-[600px] animate-pulse">
              <div className="p-6">
                <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-6" />
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, row) => (
                  <div key={row} className="grid grid-cols-7 gap-2 mb-2">
                    {Array.from({ length: 7 }).map((_, col) => (
                      <div key={col} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Main content — sidebar + calendar (Google Calendar style) */}
        {!isLoading && (
          <div className="flex gap-4 mt-6 pb-8">
            {/* Sidebar con mini-calendar y filtros */}
            <EventsSidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(prev => !prev)}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              employees={employees}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onCreateEvent={handleCreateEvent}
              onManageHolidays={() => setShowHolidaysModal(true)}
            />

            {/* Main calendar container */}
            <section className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 min-h-[600px]">
              <div className="p-6 h-full">
                <LaborEventsCalendar
                    onEventClick={handleEventClick}
                    onDateSelect={handleDateSelect}
                    events={filteredEvents}
                    employees={employees}
                    isLoading={isLoading}
                    refreshEvents={refreshEvents}
                    deleteAssignment={deleteAssignment}
                    updateEvent={updateEvent}
                    preview={previewEvent}
                    onPreviewChange={setPreviewEvent}
                    navigateToDate={selectedDate}
                    dbHolidays={dbHolidays || []}
                    onEditHoliday={(holiday) => {
                      setEditingHoliday(holiday);
                      setShowHolidaysModal(true);
                    }}
                  />
              </div>
            </section>
          </div>
        )}
        <div className="mt-2 mb-4">
          <StatsCards stats={eventsStatsData} />
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
        laborEventCatalog={catalog}
        initialDates={modalInitialDates}
        onPreviewChange={setPreviewEvent}
        onDelete={deleteAssignment}
      />

      <HolidaysManagementModal
        open={showHolidaysModal}
        editHoliday={editingHoliday}
        onClose={() => {
          setShowHolidaysModal(false);
          setEditingHoliday(null);
          refetchHolidays();
        }}
      />
    </div>
  );
};

export default LaborEventsPage;
