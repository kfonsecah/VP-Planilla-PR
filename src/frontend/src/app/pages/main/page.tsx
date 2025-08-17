"use client";

import { useState } from "react";

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
const employees: Employee[] = [
  {
    name: "María Solano Rojas",
    position: "Encargada de caja",
    salary: "€360,000",
    status: "Al día",
  },
  {
    name: "José Andrés Chavarría Soto",
    position: "Cocinero principal",
    salary: "€450,000",
    status: "Asistencia incompleta",
  },
  {
    name: "Gabriela Solano Méndez",
    position: "Salonera",
    salary: "€320,000",
    status: "Vacaciones",
  },
  {
    name: "Kevin Vargas Umaña",
    position: "Barista",
    salary: "€320,000",
    status: "Al día",
  },
  {
    name: "Sofía Valverde",
    position: "Gerente",
    salary: "€500,000",
    status: "Al día",
  },
  {
    name: "Diego González",
    position: "Mesero",
    salary: "€300,000",
    status: "Al día",
  },
  {
    name: "Laura Picado",
    position: "Cajera",
    salary: "€310,000",
    status: "Asistencia incompleta",
  },
  {
    name: "Pablo Arias",
    position: "Chef de partida",
    salary: "€400,000",
    status: "Al día",
  },
  {
    name: "Valeria Solís",
    position: "Bartender",
    salary: "€330,000",
    status: "Vacaciones",
  },
  {
    name: "Andrés Mora",
    position: "Ayudante de cocina",
    salary: "€280,000",
    status: "Al día",
  },
  {
    name: "Fernanda Ureña",
    position: "Encargada de limpieza",
    salary: "€270,000",
    status: "Al día",
  },
  {
    name: "Ricardo Quesada",
    position: "Seguridad",
    salary: "€350,000",
    status: "Al día",
  },
  {
    name: "Carolina Obando",
    position: "Asistente administrativo",
    salary: "€380,000",
    status: "Al día",
  },
  {
    name: "Daniel Jiménez",
    position: "Repostero",
    salary: "€370,000",
    status: "Vacaciones",
  },
  {
    name: "Silvia Calderón",
    position: "Barista",
    salary: "€320,000",
    status: "Asistencia incompleta",
  },
  {
    name: "Felipe Guzmán",
    position: "Mesero",
    salary: "€300,000",
    status: "Al día",
  },
];

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
  onMouseLeave: () => void
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
      >
        {day}
      </div>
    );
  });
};

// --- React Components ---

const Home: React.FC = () => {
  // Initialize state with current date (June 2025 as per previous discussions/screenshot)
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // Set to 1st of the month
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string; visible: boolean }>({
    x: 0,
    y: 0,
    content: '',
    visible: false
  });

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
                {renderCalendarDays(currentYear, currentMonth, calendarEvents, handleMouseEnter, handleMouseLeave)}
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
                {employees.slice(0, 4).map((employee, index) => (
                  <tr
                    key={index}
                    className="hover:bg-[#FDFCF9] transition-colors duration-150"
                  >
                    <td className="py-2 px-3 text-[#4A5D3A] text-xs border-b border-[#F0EDE5]">
                      {employee.name}
                    </td>
                    <td className="py-2 px-3 text-[#6B7556] text-xs border-b border-[#F0EDE5]">
                      {employee.position}
                    </td>
                    <td className="py-2 px-3 text-[#4A5D3A] text-xs border-b border-[#F0EDE5] font-medium">
                      {employee.salary}
                    </td>
                    <td className="py-2 px-3 text-xs text-center border-b border-[#F0EDE5]">
                      <span
                        className={
                          `inline-block px-2 py-0.5 rounded-full text-xs font-medium min-w-[80px] text-center
                         ${employee.status === "Al día"
                           ? "bg-[#D4EDDA] text-[#155724]"
                           : ""}
                         ${employee.status === "Asistencia incompleta"
                           ? "bg-[#F8D7DA] text-[#721C24]"
                           : ""}
                         ${employee.status === "Vacaciones"
                           ? "bg-[#FFF3CD] text-[#856404]"
                           : ""}
                        `
                        }
                      >
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
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



