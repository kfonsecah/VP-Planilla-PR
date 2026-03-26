"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaborEvents } from "@/hooks/useLaborEvents";
import useEmployeeList from "@/hooks/useEmployeeList";
import { formatSalary, getStatusBadgeConfig } from "@/utils/employeeUtils";
import { EmployeeLaborEvent } from "@/types/laborEvent";
import { Employee } from "@/types/employee";

interface CalendarEvent {
  date: number;
  type: "highlighted" | "today";
  title: string;
  description?: string;
}

const fallbackCalendarEvents: CalendarEvent[] = [
  { date: 13, type: "highlighted", title: "Quincena de Pago", description: "Primera quincena del mes" },
  { date: 17, type: "highlighted", title: "Reunión de Equipo", description: "Coordinación mensual" },
  { date: 19, type: "highlighted", title: "Día de Pago", description: "Depósito de salarios" },
  { date: 26, type: "highlighted", title: "Cierre de Planilla", description: "Fecha límite de horas" }
];

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
  "Diciembre"
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
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
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const calendarDays: (number | null)[] = Array(firstDayIndex).fill(null);

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const totalCells = 6 * 7;
  while (calendarDays.length < totalCells) {
    calendarDays.push(null);
  }

  return calendarDays.map((day, index) => {
    const isCurrentMonthDay = index >= firstDayIndex && index < daysInMonth + firstDayIndex;
    const event = isCurrentMonthDay ? events.find((e) => e.date === day) : undefined;

    let highlightBgClass = "";
    if (event) {
      highlightBgClass = event.date === 19 ? "bg-[#F6EFD6] dark:bg-[#3d3d3d]" : "bg-[#ECE7DC] dark:bg-[#333333]";
    }

    const dayClasses = `
      text-sm font-semibold rounded-xl h-11 flex items-center justify-center border border-transparent
      ${highlightBgClass}
      ${isCurrentMonthDay ? "text-[#3B4D36] dark:text-[#E5E5E5] bg-white dark:bg-[#333333]" : "text-[#B8B3A6] dark:text-[#737373] bg-transparent"}
      hover:border-[#C8BA9A] dark:hover:border-[#4a4a4a] transition-colors cursor-pointer
    `;

    return (
      <div
        key={`${day}-${index}`}
        className={dayClasses.trim()}
        onMouseEnter={event && isCurrentMonthDay ? (e) => onMouseEnter(e, event) : undefined}
        onMouseLeave={event && isCurrentMonthDay ? onMouseLeave : undefined}
        onClick={
          isCurrentMonthDay && typeof day === "number"
            ? () => {
                const dt = new Date(year, month, day);
                const dayEvents = events.filter((ev) => ev.date === day);
                onClickDay?.(dt, dayEvents);
              }
            : undefined
        }
      >
        {day ?? ""}
      </div>
    );
  });
};

const Home: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string; visible: boolean }>({
    x: 0,
    y: 0,
    content: "",
    visible: false
  });
  const { events, isLoading: eventsLoading, refreshEvents } = useLaborEvents();
  const { employees, refreshEmployees, stats } = useEmployeeList();
  const [visibleRangeStart, setVisibleRangeStart] = useState<Date | null>(null);
  const [visibleRangeEnd, setVisibleRangeEnd] = useState<Date | null>(null);
  const [dayModal, setDayModal] = useState<{ date: Date; events: EmployeeLaborEvent[] } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshEvents().catch(() => {});
      if (refreshEmployees) { refreshEmployees().catch(() => {}); }
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshEvents, refreshEmployees]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const formattedToday = today.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const safeEvents = events ?? [];
  const employeeList = employees ?? [];
  const activeEventsCount = safeEvents.filter((event) => event.status === "active").length;
  const goToPrevMonth = () => {
    setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };

  const handleMouseEnter = (event: React.MouseEvent, eventData: CalendarEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `${eventData.title}${eventData.description ? `: ${eventData.description}` : ""}`,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
    end.setHours(23, 59, 59, 999);
    setVisibleRangeStart(start);
    setVisibleRangeEnd(end);
  }, [currentMonth, currentYear]);

  const monthlyEvents =
    visibleRangeStart && visibleRangeEnd
      ? safeEvents
          .filter((ev) => {
            try {
              const s = ev.start_date ? new Date(ev.start_date) : null;
              const e = ev.end_date ? new Date(ev.end_date) : s;
              if (!s || !e) return false;
              return !(e.getTime() < visibleRangeStart.getTime() || s.getTime() > visibleRangeEnd.getTime());
            } catch {
              return false;
            }
          })
          .sort((a: EmployeeLaborEvent, b: EmployeeLaborEvent) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      : [];

  const currentMonthEvents =
    safeEvents.length > 0
      ? safeEvents
          .filter((ev) => {
            try {
              const s = ev.start_date ? new Date(ev.start_date) : null;
              return s && s.getMonth() === currentMonth && s.getFullYear() === currentYear;
            } catch {
              return false;
            }
          })
          .map((ev) => ({
            date: new Date(ev.start_date).getDate(),
            type: "highlighted" as const,
            title: ev.labor_event_name || "Evento",
            description: ev.labor_event_description
          }))
      : [];

  const calendarHighlights = currentMonthEvents.length > 0 ? currentMonthEvents : fallbackCalendarEvents;

  const attentionEmployees = employeeList
    .filter((emp) => String(emp.status ?? "").toLowerCase().includes("incompleta"))
    .slice(0, 3);

  const quickActions = [
    {
      label: "Generar reportes",
      description: "Descarga métricas y resúmenes.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
      action: () => router.push("/pages/reports")
    },
    {
      label: "Calcular planilla",
      description: "Inicia el cálculo de la quincena.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      ),
      action: () => router.push("/pages/payroll")
    },
    {
      label: "Registro de asistencia",
      description: "Completa y valida asistencias.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      ),
      action: () => router.push("/pages/attendance")
    }
  ];

  const actionItems = [
    {
      title: "Asistencias por revisar",
      value: stats?.incompleteAssistance ?? 0,
      description: "Registros con inconsistencias en la marcación.",
      actionLabel: "Abrir registro",
      onClick: () => router.push("/pages/attendance")
    },
    {
      title: "Vacaciones activas",
      value: stats?.onVacation ?? 0,
      description: "Colaboradores fuera de oficina.",
      actionLabel: "Ver vacaciones",
      onClick: () => router.push("/pages/vacations")
    },
    {
      title: "Eventos activos",
      value: activeEventsCount,
      description: "Actividades laborales en curso.",
      actionLabel: "Gestionar eventos",
      onClick: () => router.push("/pages/employee/events")
    }
  ];

  return (
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-[#8B7355] dark:text-[#A3A3A3] uppercase tracking-widest mb-1">Panel General</p>
            <h1 className="text-3xl font-bold text-[#3B4D36] dark:text-[#E5E5E5] leading-none">Dashboard</h1>
          </div>
          <div className="flex flex-col md:items-end text-sm text-[#6B7556] dark:text-[#A3A3A3]">
            <span className="uppercase tracking-[0.2em] text-xs text-[#A18B69] dark:text-[#737373]">Hoy</span>
            <span className="font-medium text-[#3B4D36] dark:text-[#E5E5E5]">{formattedToday}</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="bg-[#F5F1E8] dark:bg-[#2d2d2d] rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-[#404040]">
            <div className="flex flex-col gap-2 px-6 pt-6 pb-4 md:flex-row md:items-center md:justify-between border-b border-[#E5E1D8] dark:border-[#404040]">
              <div>
                <p className="text-xs font-semibold text-[#8B7355] dark:text-[#A3A3A3] uppercase tracking-[0.3em]">Eventos del mes</p>
                <h2 className="text-2xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full border border-[#C8BA9A] dark:border-[#4a4a4a] text-[#3B4D36] dark:text-[#E5E5E5] hover:bg-[#E7DCC1] dark:hover:bg-[#3d3d3d] transition-colors"
                  onClick={goToPrevMonth}
                  aria-label="Mes anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full border border-[#C8BA9A] dark:border-[#4a4a4a] text-[#3B4D36] dark:text-[#E5E5E5] hover:bg-[#E7DCC1] dark:hover:bg-[#3d3d3d] transition-colors"
                  onClick={goToNextMonth}
                  aria-label="Mes siguiente"
                >
                  →
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-7 text-center text-[#6B7556] dark:text-[#A3A3A3] font-semibold text-xs mb-3 uppercase tracking-wide">
                <span>Dom</span>
                <span>Lun</span>
                <span>Mar</span>
                <span>Mié</span>
                <span>Jue</span>
                <span>Vie</span>
                <span>Sáb</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {renderCalendarDays(
                  currentYear,
                  currentMonth,
                  calendarHighlights,
                  (e, evData) => handleMouseEnter(e, evData),
                  handleMouseLeave,
                  (dateClicked: Date) => {
                    const fullEvents = safeEvents.filter((ev) => {
                      try {
                        const s = ev.start_date ? new Date(ev.start_date) : null;
                        return (
                          s &&
                          s.getDate() === dateClicked.getDate() &&
                          s.getMonth() === dateClicked.getMonth() &&
                          s.getFullYear() === dateClicked.getFullYear()
                        );
                      } catch {
                        return false;
                      }
                    });
                    setDayModal({ date: dateClicked, events: fullEvents });
                  }
                )}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl border border-[#E0D6B7] dark:border-[#404040] bg-white dark:bg-[#333333] py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#A18B69] dark:text-[#A3A3A3]">Activos</p>
                  <p className="text-2xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{activeEventsCount}</p>
                </div>
                <div className="rounded-xl border border-[#E0D6B7] dark:border-[#404040] bg-white dark:bg-[#333333] py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#A18B69] dark:text-[#A3A3A3]">Programados</p>
                  <p className="text-2xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{monthlyEvents.length}</p>
                </div>
                <div className="rounded-xl border border-[#E0D6B7] dark:border-[#404040] bg-white dark:bg-[#333333] py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#A18B69] dark:text-[#A3A3A3]">Alertas</p>
                  <p className="text-2xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{attentionEmployees.length}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="bg-[#F5F1E8] dark:bg-[#2d2d2d] rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-[#404040] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-[#8B7355] dark:text-[#A3A3A3] uppercase tracking-[0.3em]">Eventos destacados</p>
                  <h3 className="text-lg font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">Este mes</h3>
                </div>
                <span className="text-xs text-[#6B7556] dark:text-[#A3A3A3]">{monthlyEvents.length} eventos</span>
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {eventsLoading ? (
                  <div className="text-center text-sm text-[#6B7556] dark:text-[#A3A3A3] py-6">Cargando eventos...</div>
                ) : monthlyEvents.length === 0 ? (
                  <div className="text-center text-sm text-[#8B8B8B] dark:text-[#737373] py-6">
                    No hay eventos registrados en este rango.
                  </div>
                ) : (
                  monthlyEvents.slice(0, 6).map((event) => {
                    const employee = employeeList.find((e) => String(e.id) === String(event.employee_id));
                    const start = event.start_date ? new Date(event.start_date) : null;
                    const end = event.end_date ? new Date(event.end_date) : null;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setDayModal({ date: start ?? new Date(), events: [event] })}
                        className="w-full text-left rounded-xl border border-[#E0D6B7] dark:border-[#404040] bg-white dark:bg-[#333333] px-4 py-3 hover:border-[#C7BB96] dark:hover:border-[#4a4a4a] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5] truncate">
                            {event.labor_event_name || `Evento #${event.id}`}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              event.status === "active"
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : event.status === "completed"
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : event.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {event.status || "Pendiente"}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7556] dark:text-[#A3A3A3] mt-1 truncate">{employee?.name ?? "Sin asignar"}</p>
                        {start && (
                          <p className="text-xs text-[#8B8B8B] dark:text-[#737373] mt-1">
                            {start.toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}
                            {end && end.getTime() !== start.getTime()
                              ? ` · Termina ${end.toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}`
                              : ""}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-[#F5F1E8] dark:bg-[#2d2d2d] rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-[#404040] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-[#8B7355] dark:text-[#A3A3A3] uppercase tracking-[0.3em]">Centro de tareas</p>
                  <h3 className="text-lg font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">Atiende pendientes</h3>
                </div>
              </div>
              <div className="space-y-4">
                {actionItems.map((item) => (
                  <div key={item.title} className="rounded-xl border border-[#E0D6B7] dark:border-[#404040] bg-white dark:bg-[#333333] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{item.title}</p>
                        <p className="text-xs text-[#6B7556] dark:text-[#A3A3A3]">{item.description}</p>
                      </div>
                      <span className="text-2xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{item.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="mt-3 text-xs font-semibold text-[#6F7153] dark:text-[#A3A3A3] hover:text-[#3B4D36] dark:hover:text-[#E5E5E5] transition-colors"
                    >
                      {item.actionLabel} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 bg-[#F5F1E8] dark:bg-[#2d2d2d] rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-[#404040] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-[#8B7355] dark:text-[#A3A3A3] uppercase tracking-[0.3em]">Información de empleados</p>
              <h3 className="text-xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                {employeeList.length} colaboradores activos
              </h3>
            </div>
            <span className="text-xs text-[#6B7556] dark:text-[#A3A3A3]">Vista rápida de los últimos movimientos</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#E0D6B7] dark:border-[#404040] bg-white dark:bg-[#333333]">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[#F8F6F1] dark:bg-[#252525] text-[#6B7556] dark:text-[#A3A3A3] text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Posición</th>
                  <th className="py-3 px-4 text-left">Salario</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {employeeList.slice(0, 6).map((employee) => {
                  const badge = getStatusBadgeConfig(String(employee.status ?? ""));
                  const salaryDisplay =
                    typeof employee.salary === "number" ? formatSalary(employee.salary as number) : String(employee.salary ?? "");
                  return (
                    <tr key={employee.id} className="border-t border-[#F0EDE5] dark:border-[#404040] hover:bg-[#FDFCF9] dark:hover:bg-[#3d3d3d] transition-colors">
                      <td className="px-4 py-3 text-[#3B4D36] dark:text-[#E5E5E5] font-medium">{employee.name}</td>
                      <td className="px-4 py-3 text-[#6B7556] dark:text-[#A3A3A3]">{employee.position || "Sin asignar"}</td>
                      <td className="px-4 py-3 text-[#3B4D36] dark:text-[#E5E5E5] font-semibold">{salaryDisplay}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={badge.className}>{badge.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.action}
              className="bg-[#F5F1E8] dark:bg-[#2d2d2d] rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-[#404040] p-5 text-left hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E7DCC1] dark:bg-[#3d3d3d] flex items-center justify-center mb-3 text-[#4A5D3A] dark:text-[#E5E5E5]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {action.icon}
                </svg>
              </div>
              <p className="text-base font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{action.label}</p>
              <p className="text-sm text-[#6B7556] dark:text-[#A3A3A3]">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#A18B69] dark:text-[#A3A3A3]">Eventos</p>
                <h4 className="text-xl font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                  {dayModal.date.toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })}
                </h4>
              </div>
              <button onClick={() => setDayModal(null)} className="text-sm text-[#6B7556] dark:text-[#A3A3A3] hover:text-[#3B4D36] dark:hover:text-[#E5E5E5]">
                Cerrar
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {dayModal.events.length === 0 ? (
                <div className="text-sm text-[#8B8B8B] dark:text-[#737373]">No hay eventos para este día.</div>
              ) : (
                dayModal.events.map((ev: EmployeeLaborEvent) => (
                  <div key={ev.id} className="border border-[#E5E1D8] dark:border-[#404040] rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-base font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">{ev.labor_event_name || "Evento"}</div>
                        <div className="text-xs text-[#6B7556] dark:text-[#A3A3A3]">
                          {employeeList.find((em: Employee) => String(em.id) === String(ev.employee_id))?.name || "Sin asignar"}
                        </div>
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-[#F8F6F1] dark:bg-[#333333] text-[#6B7556] dark:text-[#A3A3A3] uppercase tracking-wide">
                        {ev.status}
                      </div>
                    </div>
                    {ev.labor_event_description && (
                      <p className="text-sm text-[#6B7556] dark:text-[#A3A3A3] mt-3">{ev.labor_event_description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-[#4A5D3A] dark:bg-[#2d2d2d] text-white dark:text-[#E5E5E5] text-xs rounded-md px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y
          }}
        >
          {tooltip.content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#4A5D3A] dark:border-t-[#2d2d2d]"></div>
        </div>
      )}
    </div>
  );
};

export default Home;
