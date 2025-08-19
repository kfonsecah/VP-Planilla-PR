'use client';

import React, { useState } from 'react';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
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
  const { events, isLoading, createEvent, updateEvent, deleteEvent, assignEventToEmployee, refreshEvents, deleteAssignment } = useLaborEvents();
  const { employees } = useEmployeeList();
  const { showError, showSuccess } = useModal();

  const handleEventClick = (event: EmployeeLaborEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedEvent(undefined);
    setShowEventModal(true);
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

      // No explicit refresh here: the hook updates state (createEvent calls fetchEvents and
      // updateEvent updates local state). Removing redundant double-refresh to avoid flicker.
    } catch (error) {
      showError('Error', 'No se pudo guardar el evento. Por favor intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#E7DCC1]">
      <div className="mx-auto max-w-7xl">
        {/* Tabs de navegación */}
        <EmployeeTabs />
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-light text-[#3B4D36]">
            Eventos Laborales
          </h1>
          <button 
            className="flex items-center gap-2 px-4 py-2 text-[#3B4D36] transition-colors bg-[#A7AA94] rounded-lg hover:bg-[#6F7153]/80"
            onClick={() => {
              setSelectedEvent(undefined);
              setShowEventModal(true);
            }}
          >
            <PlusIcon className="w-5 h-5" />
            Añadir Evento
          </button>
        </div>

        {/* Calendario de Eventos */}
        <LaborEventsCalendar 
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          events={events}
          isLoading={isLoading}
          refreshEvents={refreshEvents}
          deleteAssignment={deleteAssignment}
        />

        {/* Modal de Evento */}
        <LaborEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSubmit={handleSubmit}
          event={selectedEvent}
          employees={employees}
        />
      </div>
    </div>
  );
};

export default LaborEventsPage;