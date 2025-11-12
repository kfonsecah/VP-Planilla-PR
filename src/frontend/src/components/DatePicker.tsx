"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  value: string; // formato dd/mm/yy
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rangeStart?: string; // Para mostrar el inicio del rango
  rangeEnd?: string;   // Para mostrar el fin del rango
  isStartDate?: boolean; // Indica si es el selector de fecha de inicio
}

export default function DatePicker({ 
  value, 
  onChange, 
  placeholder = "dd/mm/yy", 
  disabled, 
  className,
  rangeStart,
  rangeEnd,
  isStartDate = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Convertir dd/mm/yy a Date
  const parseDisplayDate = (displayDate: string): Date | null => {
    if (!displayDate || displayDate.length < 8) return null;
    const [day, month, year] = displayDate.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
  };

  // Convertir Date a dd/mm/yy
  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const selectedDate = parseDisplayDate(value);

  // Parsear fechas del rango
  const rangeStartDate = rangeStart ? parseDisplayDate(rangeStart) : null;
  const rangeEndDate = rangeEnd ? parseDisplayDate(rangeEnd) : null;

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    onChange(formatDateDisplay(date));
    setIsOpen(false);
  };

  const handleInputChange = (inputValue: string) => {
    let cleaned = inputValue.replace(/[^\d/]/g, '');
    
    if (cleaned.length >= 2 && cleaned[2] !== '/') {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned[5] !== '/') {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    }
    
    if (cleaned.length > 8) {
      cleaned = cleaned.slice(0, 8);
    }
    
    onChange(cleaned);
  };

  // Generar días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(viewDate);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Verificar si una fecha está en el rango
  const isInRange = (date: Date | null) => {
    if (!date || !rangeStartDate || !rangeEndDate) return false;
    const time = date.getTime();
    const startTime = rangeStartDate.getTime();
    const endTime = rangeEndDate.getTime();
    return time > startTime && time < endTime;
  };

  // Verificar si es el inicio del rango
  const isRangeStart = (date: Date | null) => {
    if (!date || !rangeStartDate) return false;
    return date.getDate() === rangeStartDate.getDate() &&
           date.getMonth() === rangeStartDate.getMonth() &&
           date.getFullYear() === rangeStartDate.getFullYear();
  };

  // Verificar si es el fin del rango
  const isRangeEnd = (date: Date | null) => {
    if (!date || !rangeEndDate) return false;
    return date.getDate() === rangeEndDate.getDate() &&
           date.getMonth() === rangeEndDate.getMonth() &&
           date.getFullYear() === rangeEndDate.getFullYear();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={8}
          className={className}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6F7153] hover:text-[#5D614A] transition-colors disabled:opacity-50"
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-[#E0D6B7] p-4 w-80">
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-[#F9F1DC] rounded transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-[#6F7153]" />
            </button>
            <span className="font-semibold text-[#3B4D36]">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-[#F9F1DC] rounded transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-[#6F7153]" />
            </button>
          </div>

          {/* Nombres de días */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-[#6B5B3D] py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day ? (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      w-full h-full flex items-center justify-center rounded-lg text-sm transition-colors relative
                      ${isSelectedDate(day) || isRangeStart(day) || isRangeEnd(day)
                        ? 'bg-[#6F7153] text-white font-semibold z-10' 
                        : isInRange(day)
                        ? 'bg-[#E7DCC1] text-[#3B4D36]'
                        : isToday(day)
                        ? 'bg-[#F9F1DC] text-[#3B4D36] font-medium'
                        : 'hover:bg-[#F9F1DC] text-[#3B4D36]'
                      }
                      ${(isRangeStart(day) || isRangeEnd(day)) && 'ring-2 ring-[#5D614A]'}
                    `}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {/* Leyenda del rango */}
          {rangeStartDate && rangeEndDate && (
            <div className="mt-3 pt-3 border-t border-[#E0D6B7]">
              <div className="flex items-center justify-center gap-2 text-xs text-[#5D4E37]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#6F7153]"></div>
                  <span>Inicio/Fin</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#E7DCC1]"></div>
                  <span>Rango</span>
                </div>
              </div>
            </div>
          )}

          {/* Botón hoy */}
          <div className={`${rangeStartDate && rangeEndDate ? 'mt-2' : 'mt-3 pt-3 border-t border-[#E0D6B7]'}`}>
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="w-full py-2 text-sm font-medium text-[#6F7153] hover:bg-[#F9F1DC] rounded-lg transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
