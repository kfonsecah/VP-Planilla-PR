"use client";

import { useState, useEffect } from "react";
import { useLaborEvents } from '@/hooks/useLaborEvents';
import useEmployeeList from '@/hooks/useEmployeeList';
import { formatSalary, getStatusBadgeConfig } from '@/utils/employeeUtils';

// --- Type Definitions ---
interface Employee {
  name: string;
  position: string;
  salary: string; // Using string to keep the '€' symbol and comma formatting
  status: "Al día" | "Asistencia incompleta" | "Vacaciones";
}

interface CalendarEvent {
  date: number; // Day of the month
  type: "highlighted" | "today"; // Added 'today' type if needed for future
  title: string; // Event title for tooltip
  description?: string; // Optional event description
}

// --- Dummy Data ---


const calendarEvents: CalendarEvent[] = [
  // Events from the screenshot. Note that the highlighted days are 13, 17, 19, 26.
  // The colors imply different types of events or statuses.
  { date: 13, type: "highlighted", title: "Quincena de Pago", description: "Primera quincena del mes" }, // Grayish
  { date: 17, type: "highlighted", title: "Reunión de Equipo", description: "Reunión mensual de coordinación" }, // Grayish
  { date: 19, type: "highlighted", title: "Día de Pago", description: "Pago de salarios mensuales" }, // Yellowish
  { date: 26, type: "highlighted", title: "Cierre de Planilla", description: "Fecha límite para registro de horas" }, // Grayish
];

// Array of month names in Spanish (0-indexed)
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// --- Helper for Calendar Days ---
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  // getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday
  return new Date(year, month, 1).getDay();
};

const renderCalendarDays = (
  year: number,
  month: number,
  events: CalendarEvent[],
  onMouseEnter: (event: React.MouseEvent, eventData: CalendarEvent) => void,
  onMouseLeave: () => void,
  onClickDay?: (date: Date, dayEvents: CalendarEvent[]) => void
) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // Day of week (0=Sun, 6=Sat) for the 1st of the month
  const calendarDays: (number | null)[] = Array(firstDayIndex).fill(null); // Fill leading empty days

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Fill trailing days from the next month to complete the 6x7 grid
  const totalCells = 6 * 7;
  const remainingCells = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push(i);
  }

  return calendarDays.map((day, index) => {
    const isCurrentMonthDay =
      index >= firstDayIndex && index < daysInMonth + firstDayIndex;
    const event = isCurrentMonthDay
      ? events.find((e) => e.date === day)
      : undefined;    let highlightBgClass = "";
    if (event) {
      // Apply distinct colors for highlighted dates based on the screenshot
      if (event.date === 19) {
        // The yellowish highlight
        highlightBgClass = "bg-[#F0EAD6]"; // Specific yellowish-beige color
      } else {
        // The grayish highlights
        highlightBgClass = "bg-[#E5E1D8]"; // Specific grayish color
      }
    }

    const dayClasses = `
            text-center rounded text-xs font-medium
            ${highlightBgClass}
            ${
              !isCurrentMonthDay ? "text-[#B8B3A6]" : "text-[#4A5D3A]"
            } /* Muted gray for non-current month days */
            ${
              index % 7 === 0 || index % 7 === 6
                ? "bg-[#F8F6F1] bg-opacity-50"
                : ""
            } /* Subtle background for Sunday/Saturday columns */
            flex items-center justify-center h-8 w-8 mx-auto /* Compact size for each day cell */
            hover:bg-[#E7DCC1] transition-colors cursor-pointer
        `;    return (
      <div 
        key={index} 
        className={dayClasses.trim()}
        onMouseEnter={event && isCurrentMonthDay ? (e) => onMouseEnter(e, event) : undefined}
        onMouseLeave={event && isCurrentMonthDay ? onMouseLeave : undefined}
        onClick={isCurrentMonthDay ? () => {
          // build date and pass all events for this day
          if (typeof day === 'number') {
            const dt = new Date(year, month, day);
            const dayEvents = events.filter(ev => ev.date === day);
            if (typeof (onClickDay as any) === 'function') (onClickDay as any)(dt, dayEvents as CalendarEvent[]);
          }
        } : undefined}
      >
        {day}
      </div>
    );
  });
};

// --- React Components ---

const Home: React.FC = () => {
  // State + data hooks
  const [currentDate, setCurrentDate] = useState(() => {
    // default to first day of current month
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string; visible: boolean }>({ x: 0, y: 0, content: '', visible: false });

  // Live data hooks
  const { events, isLoading: eventsLoading, refreshEvents } = useLaborEvents();
  const { employees, refreshEmployees } = useEmployeeList();

  // Visible range (used to build monthly list)
  const [visibleRangeStart, setVisibleRangeStart] = useState<Date | null>(null);
  const [visibleRangeEnd, setVisibleRangeEnd] = useState<Date | null>(null);

  // Modal for day that has multiple events
  const [dayModal, setDayModal] = useState<{ date: Date; events: any[] } | null>(null);

  // Polling to keep data synchronized (30s)
  useEffect(() => {
    const t = setInterval(() => {
      refreshEvents().catch(() => {});
      refreshEmployees && refreshEmployees().catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [refreshEvents, refreshEmployees]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const goToPrevMonth = () => {
    setCurrentDate((prevDate) => {
      return new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
    });
  };
  const goToNextMonth = () => {
    setCurrentDate((prevDate) => {
      return new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
    });
  };

  const handleMouseEnter = (event: React.MouseEvent, eventData: CalendarEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${eventData.title}${eventData.description ? `: ${eventData.description}` : ''}`,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Update visible range when currentDate changes
  useEffect(() => {
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
    end.setHours(23,59,59,999);
    setVisibleRangeStart(start);
    setVisibleRangeEnd(end);
  }, [currentMonth, currentYear]);

  const monthlyEvents = (visibleRangeStart && visibleRangeEnd && events)
    ? (events || []).filter(ev => {
      try {
    const s = ev.start_date ? new Date(ev.start_date) : null;
    const e = ev.end_date ? new Date(ev.end_date) : s;
    if (!s || !e) return false;
    return !(e.getTime() < visibleRangeStart.getTime() || s.getTime() > visibleRangeEnd.getTime());
      } catch (err) { return false; }
    }).sort((a:any,b:any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    : [];
  return (
    <div className="h-full bg-[#E7DCC1] overflow-auto">
      <div className="flex flex-col min-h-full gap-4 p-4 font-sans">
        {/* Top Section: Events and Pending Tasks */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Events of the Month */}
          <div className="lg:col-span-3 bg-[#F5F1E8] rounded-lg shadow-sm p-4 border border-[#E0D6B7]">
            <h3 className="text-sm font-semibold text-[#4A5D3A] mb-3 text-center uppercase tracking-wider">
              EVENTOS DEL MES
            </h3>

            <div className="border border-[#D4C89A] rounded-md p-3 bg-white">
              {/* Month Navigation */}
              <div className="flex items-center justify-between text-sm text-[#6B7556] pb-2 border-b border-[#E5E1D8] mb-3">
                <button
                  className="cursor-pointer select-none text-lg hover:text-[#4A5D3A] transition-colors p-1 rounded hover:bg-[#F8F6F1]"
                  onClick={goToPrevMonth}
                >
                  ←
                </button>
                <span className="text-[#4A5D3A] text-base font-medium">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button
                  className="cursor-pointer select-none text-lg hover:text-[#4A5D3A] transition-colors p-1 rounded hover:bg-[#F8F6F1]"
                  onClick={goToNextMonth}
                >
                  →
                </button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 text-center text-[#6B7556] font-medium text-xs mb-2 pb-1 border-b border-[#F0EDE5]">
                <span>Domingo</span>
                <span>Lunes</span>
                <span>Martes</span>
                <span>Miércoles</span>
                <span>Jueves</span>
                <span>Viernes</span>
                <span>Sábado</span>
              </div>              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px">
                {renderCalendarDays(
                  currentYear,
                  currentMonth,
                  // Build a lightweight CalendarEvent[] from real events in this month
                  (events || []).filter(ev => {
                    try {
                      const s = ev.start_date ? new Date(ev.start_date) : null;
                      if (!s) return false;
                      return s.getMonth() === currentMonth && s.getFullYear() === currentYear;
                    } catch (e) { return false; }
                  }).map(ev => ({ date: new Date(ev.start_date).getDate(), type: 'highlighted' as any, title: ev.labor_event_name || 'Evento', description: ev.labor_event_description })),
                  (e, evData) => handleMouseEnter(e, evData as CalendarEvent),
                  handleMouseLeave,
                  (dateClicked: Date, dayEvents: CalendarEvent[]) => {
                    // Map lightweight CalendarEvent[] back to full event objects where possible
                    const fullEvents = (events || []).filter(ev => {
                      try {
                        const s = ev.start_date ? new Date(ev.start_date) : null;
                        return s && s.getDate() === dateClicked.getDate() && s.getMonth() === dateClicked.getMonth() && s.getFullYear() === dateClicked.getFullYear();
                      } catch (e) { return false; }
                    });
                    setDayModal({ date: dateClicked, events: fullEvents });
                  }
                )}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-[#F5F1E8] rounded-lg shadow-sm p-4 border border-[#E0D6B7]">
            <h3 className="text-sm font-semibold text-[#4A5D3A] mb-3 uppercase tracking-wider">
              TAREAS PENDIENTES
            </h3>
            <div className="h-32 bg-[#FDFCF9] border border-dashed border-[#D4C89A] rounded-md flex items-center justify-center text-[#8B8B8B] text-xs">
              No hay tareas pendientes.
            </div>
          </div>
        </div>

        

        {/* Employee Information */}
        <div className="bg-[#F5F1E8] rounded-lg shadow-sm p-4 border border-[#E0D6B7]">
          <h3 className="text-sm font-semibold text-[#4A5D3A] mb-3 uppercase tracking-wider">
            INFORMACIÓN DE EMPLEADOS | {employees.length} Empleados
          </h3>

          <div className="overflow-x-auto rounded-md border border-[#D4C89A] bg-white">
            <table className="w-full table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-[#F8F6F1] text-[#6B7556] text-xs font-medium border-b border-[#E5E1D8]">
                  <th className="w-1/4 px-3 py-2 text-left">Nombre</th>
                  <th className="w-1/4 px-3 py-2 text-left">Posición</th>
                  <th className="w-1/4 px-3 py-2 text-left">Salario</th>
                  <th className="w-1/4 px-3 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 4).map((employee, index) => {
                  const badge = getStatusBadgeConfig(String(employee.status ?? ''));
                  // employee.salary in hook is numeric (getPositionSalary) — use formatSalary util
                  const salaryDisplay = typeof employee.salary === 'number' ? formatSalary(employee.salary as number) : String(employee.salary ?? '');
                  return (
                    <tr key={index} className="hover:bg-[#FDFCF9] transition-colors duration-150">
                      <td className="py-2 px-3 text-[#4A5D3A] text-xs border-b border-[#F0EDE5]">{employee.name}</td>
                      <td className="py-2 px-3 text-[#6B7556] text-xs border-b border-[#F0EDE5]">{employee.position}</td>
                      <td className="py-2 px-3 text-[#4A5D3A] text-xs border-b border-[#F0EDE5] font-medium">{salaryDisplay}</td>
                      <td className="py-2 px-3 text-xs text-center border-b border-[#F0EDE5]">
                        <span className={badge.className}>{badge.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-[#F5F1E8] rounded-lg shadow-sm p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-[#E0D6B7] group">
            <div className="w-10 h-10 bg-[#E7DCC1] rounded-lg flex items-center justify-center mb-2 group-hover:bg-[#D4C89A] transition-colors">
              <svg className="w-5 h-5 text-[#4A5D3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#4A5D3A] text-center">
              Generar<br />Reporte
            </span>
          </div>
          <div className="bg-[#F5F1E8] rounded-lg shadow-sm p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-[#E0D6B7] group">
            <div className="w-10 h-10 bg-[#E7DCC1] rounded-lg flex items-center justify-center mb-2 group-hover:bg-[#D4C89A] transition-colors">
              <svg className="w-5 h-5 text-[#4A5D3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#4A5D3A] text-center">
              Calcular<br />planilla de<br />quincena
            </span>
          </div>
          <div className="bg-[#F5F1E8] rounded-lg shadow-sm p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-[#E0D6B7] group">
            <div className="w-10 h-10 bg-[#E7DCC1] rounded-lg flex items-center justify-center mb-2 group-hover:bg-[#D4C89A] transition-colors">
              <svg className="w-5 h-5 text-[#4A5D3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#4A5D3A] text-center">
              Completar<br />registro de<br />asistencia
            </span>          </div>
        </div>
      </div>

      {/* Tooltip */}
      {/* Day Modal - shows events for a clicked date */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg w-[90%] max-w-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-[#3B4D36]">Eventos para {dayModal.date.toLocaleDateString()}</h4>
              <button onClick={() => setDayModal(null)} className="text-sm text-[#6B7556]">Cerrar</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {dayModal.events.length === 0 ? (
                <div className="text-sm text-[#8B8B8B]">No hay eventos para este día.</div>
              ) : dayModal.events.map((ev:any) => (
                <div key={ev.id} className="border border-[#E5E1D8] rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-[#3B4D36]">{ev.labor_event_name || 'Evento'}</div>
                      <div className="text-xs text-[#6B7556]">{employees.find((em:any)=>String(em.id)===String(ev.employee_id))?.name || 'Sin asignar'}</div>
                    </div>
                    <div className="text-xs text-[#8B8B8B]">{ev.status}</div>
                  </div>
                  {ev.labor_event_description && (
                    <p className="text-xs text-[#6B7556] mt-2">{ev.labor_event_description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-[#4A5D3A] text-white text-xs rounded-md px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#4A5D3A]"></div>
        </div>
      )}
    </div>
  );
};

export default Home;



