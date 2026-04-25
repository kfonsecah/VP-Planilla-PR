'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Employee } from '@/types/employee';

// Mapa de colores por tipo de evento laboral
const EVENT_TYPE_COLORS: Record<string, string> = {
  'Vacaciones': 'bg-blue-500',
  'Incapacidad': 'bg-orange-500',
  'Permiso': 'bg-purple-500',
  'Día Libre': 'bg-teal-500',
  'Suspensión': 'bg-red-500',
  'Otro': 'bg-zinc-500',
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_COLORS);

const STATUS_OPTIONS = [
  { value: null, label: 'Todos', color: 'bg-zinc-400' },
  { value: 'active', label: 'Activo', color: 'bg-green-500' },
  { value: 'completed', label: 'Completado', color: 'bg-blue-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
] as const;

interface EventFiltersProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onEmployeeChange: (id: string | null) => void;
  selectedEventType: string | null;
  onEventTypeChange: (type: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  selectedEventType,
  onEventTypeChange,
  selectedStatus,
  onStatusChange,
}) => {
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    employee: true,
    eventType: true,
    status: true,
  });

  const activeFilterCount = [selectedEmployeeId, selectedEventType, selectedStatus].filter(Boolean).length;

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const selectedEmployee = employees.find(e => String(e.id) === String(selectedEmployeeId));

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const clearAllFilters = useCallback(() => {
    onEmployeeChange(null);
    onEventTypeChange(null);
    onStatusChange(null);
    setEmployeeSearch('');
  }, [onEmployeeChange, onEventTypeChange, onStatusChange]);

  return (
    <div className="space-y-3">
      {/* Header con contador de filtros activos */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtro por Empleado */}
      <div>
        <button
          onClick={() => toggleSection('employee')}
          className="flex items-center justify-between w-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 py-1"
        >
          <span>Empleado</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${expandedSections.employee ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.employee && (
          <div className="mt-1.5 relative">
            {selectedEmployee ? (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {selectedEmployee.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-green-800 dark:text-green-300 truncate flex-1">
                  {selectedEmployee.name}
                </span>
                <button onClick={() => { onEmployeeChange(null); setEmployeeSearch(''); }}>
                  <XMarkIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={employeeSearch}
                  onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                {showEmployeeDropdown && (
                  <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
                    <button
                      onClick={() => { onEmployeeChange(null); setShowEmployeeDropdown(false); setEmployeeSearch(''); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Todos los empleados
                    </button>
                    {filteredEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { onEmployeeChange(String(emp.id)); setShowEmployeeDropdown(false); setEmployeeSearch(''); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{emp.name}</span>
                      </button>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <div className="px-3 py-2 text-xs text-zinc-400">Sin resultados</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtro por Tipo de Evento */}
      <div>
        <button
          onClick={() => toggleSection('eventType')}
          className="flex items-center justify-between w-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 py-1"
        >
          <span>Tipo de Evento</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${expandedSections.eventType ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.eventType && (
          <div className="mt-1.5 space-y-0.5">
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => onEventTypeChange(selectedEventType === type ? null : type)}
                className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedEventType === type
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${EVENT_TYPE_COLORS[type]} flex-shrink-0`} />
                <span>{type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtro por Estado */}
      <div>
        <button
          onClick={() => toggleSection('status')}
          className="flex items-center justify-between w-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 py-1"
        >
          <span>Estado</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${expandedSections.status ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.status && (
          <div className="mt-1.5 space-y-0.5">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => onStatusChange(opt.value)}
                className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedStatus === opt.value
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${opt.color} flex-shrink-0`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFilters;
