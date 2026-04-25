'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { EmployeeLaborEvent } from '@/types/laborEvent';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events?: EmployeeLaborEvent[];
}

const DAYS_ES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onDateChange, events = [] }) => {
  const [displayedMonth, setDisplayedMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [direction, setDirection] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Fechas con eventos para mostrar dot indicators
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(ev => {
      try {
        const d = new Date(ev.start_date);
        if (!isNaN(d.getTime())) {
          dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        }
      } catch { /* ignorar fechas inválidas */ }
    });
    return dates;
  }, [events]);

  const handlePrevMonth = useCallback(() => {
    setDirection(-1);
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setDirection(1);
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDayClick = useCallback((day: number) => {
    const newDate = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), day);
    onDateChange(newDate);
  }, [displayedMonth, onDateChange]);

  // Calcular grid del calendario
  const calendarDays = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // lunes=0, domingo=6 (ajuste para semana empezando en lunes)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; hasEvent: boolean; isToday: boolean }[] = [];

    // Dias del mes anterior
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({ day: d, isCurrentMonth: false, hasEvent: false, isToday: false });
    }

    // Dias del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${month}-${d}`;
      const checkDate = new Date(year, month, d);
      checkDate.setHours(0, 0, 0, 0);
      days.push({
        day: d,
        isCurrentMonth: true,
        hasEvent: eventDates.has(dateKey),
        isToday: checkDate.getTime() === today.getTime(),
      });
    }

    // Dias del mes siguiente para completar grid
    const remaining = 42 - days.length; // 6 filas * 7 columnas
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, isCurrentMonth: false, hasEvent: false, isToday: false });
    }

    return days;
  }, [displayedMonth, eventDates, today]);

  const monthKey = `${displayedMonth.getFullYear()}-${displayedMonth.getMonth()}`;

  return (
    <div className="select-none">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </button>
        <span className="text-sm font-semibold text-zinc-700 dark:text-white">
          {MONTHS_ES[displayedMonth.getMonth()]} {displayedMonth.getFullYear()}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRightIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS_ES.map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthKey}
          initial={{ x: direction * 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -30, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-7 gap-0"
        >
          {calendarDays.map(({ day, isCurrentMonth, hasEvent, isToday }, idx) => (
            <button
              key={idx}
              onClick={() => isCurrentMonth && handleDayClick(day)}
              disabled={!isCurrentMonth}
              className={`
                relative flex flex-col items-center justify-center w-full aspect-square text-xs rounded-lg transition-colors
                ${isCurrentMonth
                  ? isToday
                    ? 'bg-green-600 text-white font-bold hover:bg-green-700'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                  : 'text-zinc-300 dark:text-zinc-600 cursor-default'
                }
              `}
            >
              <span>{day}</span>
              {hasEvent && isCurrentMonth && !isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-green-500" />
              )}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MiniCalendar;
