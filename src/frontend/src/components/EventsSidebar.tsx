'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import MiniCalendar from '@/components/MiniCalendar';
import EventFilters from '@/components/EventFilters';
import { EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';

interface EventsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events: EmployeeLaborEvent[];
  employees: Employee[];
  filters: {
    employeeId: string | null;
    eventType: string | null;
    status: string | null;
  };
  onFiltersChange: (filters: Partial<{
    employeeId: string | null;
    eventType: string | null;
    status: string | null;
  }>) => void;
  onCreateEvent: () => void;
  onManageHolidays: () => void;
}

const EventsSidebar: React.FC<EventsSidebarProps> = ({
  isOpen,
  onToggle,
  selectedDate,
  onDateChange,
  events,
  employees,
  filters,
  onFiltersChange,
  onCreateEvent,
  onManageHolidays,
}) => {
  return (
    <motion.aside
      animate={{ width: isOpen ? 272 : 48 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex-shrink-0 overflow-hidden"
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-3 right-3 z-10 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label={isOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
      >
        {isOpen ? (
          <ChevronLeftIcon className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Sidebar content — solo visible cuando abierto */}
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Mini Calendar */}
          <div className="px-4 pt-4 pb-3">
            <MiniCalendar
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              events={events}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 mx-4" />

          {/* Filters — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
            <EventFilters
              employees={employees}
              selectedEmployeeId={filters.employeeId}
              onEmployeeChange={(id) => onFiltersChange({ employeeId: id })}
              selectedEventType={filters.eventType}
              onEventTypeChange={(type) => onFiltersChange({ eventType: type })}
              selectedStatus={filters.status}
              onStatusChange={(status) => onFiltersChange({ status })}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 mx-4" />

          {/* Crear Evento y Feriados buttons */}
          <div className="px-4 py-3 flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={onCreateEvent}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Crear Evento
            </button>
            <button
              onClick={onManageHolidays}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <SparklesIcon className="w-4 h-4" />
              Feriados y Leyes
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default EventsSidebar;
