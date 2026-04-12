"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaborEvents } from "@/hooks/useLaborEvents";
import useEmployeeList from "@/hooks/useEmployeeList";
import { formatSalary, getStatusBadgeConfig } from "@/utils/employeeUtils";
import { EmployeeLaborEvent } from "@/types/laborEvent";
import { Employee } from "@/types/employee";
import {
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

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

const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const Home: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dayModal, setDayModal] = useState<{ date: Date; events: EmployeeLaborEvent[] } | null>(null);
  const [visibleRangeStart, setVisibleRangeStart] = useState<Date | null>(null);
  const [visibleRangeEnd, setVisibleRangeEnd] = useState<Date | null>(null);

  const { events, isLoading: eventsLoading, refreshEvents } = useLaborEvents();
  const { employees, refreshEmployees, stats } = useEmployeeList();

  useEffect(() => {
    const interval = setInterval(() => {
      refreshEvents().catch(() => {});
      refreshEmployees?.().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshEvents, refreshEmployees]);

  useEffect(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()));
    end.setHours(23, 59, 59, 999);
    setVisibleRangeStart(start);
    setVisibleRangeEnd(end);
  }, [currentDate]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const safeEvents = events ?? [];
  const employeeList = employees ?? [];
  const activeEventsCount = safeEvents.filter((e) => e.status === "active").length;

  const monthlyEvents = visibleRangeStart && visibleRangeEnd
    ? safeEvents.filter((ev) => {
        try {
          const s = ev.start_date ? new Date(ev.start_date) : null;
          const e = ev.end_date ? new Date(ev.end_date) : s;
          if (!s || !e) return false;
          return !(e.getTime() < visibleRangeStart.getTime() || s.getTime() > visibleRangeEnd.getTime());
        } catch { return false; }
      }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    : [];

  const calendarHighlights = safeEvents.length > 0
    ? safeEvents.filter((ev) => {
        try {
          const s = ev.start_date ? new Date(ev.start_date) : null;
          return s && s.getMonth() === currentMonth && s.getFullYear() === currentYear;
        } catch { return false; }
      }).map((ev) => ({
        date: new Date(ev.start_date).getDate(),
        type: "highlighted" as const,
        title: ev.labor_event_name || "Evento",
        description: ev.labor_event_description
      }))
    : fallbackCalendarEvents;

  const attentionEmployees = employeeList.filter((emp) => String(emp.status ?? "").toLowerCase().includes("incompleta")).slice(0, 3);

  const statCards = [
    { label: "Empleados activos", value: employeeList.length, icon: UserGroupIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", action: () => router.push("/pages/employee/list") },
    { label: "Asistencias pendientes", value: stats?.incompleteAssistance ?? 0, icon: ClipboardDocumentCheckIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", action: () => router.push("/pages/attendance") },
    { label: "Eventos activos", value: activeEventsCount, icon: CalendarIcon, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", action: () => router.push("/pages/employee/events") },
    { label: "En vacaciones", value: stats?.onVacation ?? 0, icon: ClockIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", action: () => router.push("/pages/vacations") },
  ];

  const quickActions = [
    { label: "Calcular planilla", description: "Inicia el cálculo de la quincena", icon: CalculatorIcon, href: "/pages/payroll", color: "bg-green-600 hover:bg-green-500" },
    { label: "Generar reportes", description: "Descarga métricas y resúmenes", icon: ChartBarIcon, href: "/pages/reports", color: "bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500" },
    { label: "Registro de asistencia", description: "Valida marcaciones del día", icon: ClipboardDocumentCheckIcon, href: "/pages/attendance", color: "bg-blue-600 hover:bg-blue-500" },
    { label: "Dashboard de Marcas", description: "Revisar y corregir marcas de reloj", icon: ClockIcon, href: "/pages/clock-logs", color: "bg-indigo-600 hover:bg-indigo-500" },
  ];

  const actionItems = [
    { title: "Asistencias por revisar", value: stats?.incompleteAssistance ?? 0, description: "Registros con inconsistencias", href: "/pages/attendance", icon: ClipboardDocumentCheckIcon, accent: "text-amber-600" },
    { title: "Vacaciones activas", value: stats?.onVacation ?? 0, description: "Colaboradores fuera de oficina", href: "/pages/vacations", icon: ClockIcon, accent: "text-purple-600" },
    { title: "Eventos activos", value: activeEventsCount, description: "Actividades laborales en curso", href: "/pages/employee/events", icon: CalendarIcon, accent: "text-green-600" },
    { title: "Marcas de control", description: "Revisar anomalías y corregir", href: "/pages/clock-logs", icon: ClockIcon, accent: "text-indigo-600" },
  ];

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
    const calendarDays: (number | null)[] = Array(firstDayIndex).fill(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
    while (calendarDays.length < 42) calendarDays.push(null);

    return calendarDays.map((day, index) => {
      const isCurrentMonthDay = index >= firstDayIndex && index < daysInMonth + firstDayIndex;
      const event = isCurrentMonthDay ? calendarHighlights.find((e) => e.date === day) : undefined;
      const isToday = isCurrentMonthDay && day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

      return (
        <button
          key={`${day}-${index}`}
          type="button"
          onClick={isCurrentMonthDay && typeof day === "number" ? () => {
            const dt = new Date(currentYear, currentMonth, day);
            const dayEvents = safeEvents.filter((ev) => {
              try {
                const s = ev.start_date ? new Date(ev.start_date) : null;
                return s && s.getDate() === day && s.getMonth() === currentMonth && s.getFullYear() === currentYear;
              } catch { return false; }
            });
            setDayModal({ date: dt, events: dayEvents });
          } : undefined}
          className={`
            h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer
            ${isToday ? "bg-green-600 text-white font-semibold" : ""}
            ${event && !isToday ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : ""}
            ${isCurrentMonthDay && !isToday && !event ? "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800" : ""}
            ${!isCurrentMonthDay ? "text-zinc-300 dark:text-zinc-600" : ""}
          `}
          disabled={!isCurrentMonthDay}
        >
          {day ?? ""}
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-screen-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Panel General</p>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Dashboard</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
            {today.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={stat.action}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-left hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{stat.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Calendar and Quick actions - left side */}
          <div className="xl:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{monthlyEvents.length} eventos este mes</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  {dayNames.map((d) => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.slice(0, 2).map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0 text-white`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{action.label}</p>
                    <p className="text-xs text-zinc-400">{action.description}</p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 ml-auto group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Quick actions - second row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.slice(2).map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0 text-white`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{action.label}</p>
                    <p className="text-xs text-zinc-400">{action.description}</p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 ml-auto group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar - right side */}
          <div className="space-y-6">
            {/* Centro de tareas */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Próximos eventos</h3>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {eventsLoading ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Cargando...</p>
                ) : monthlyEvents.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Sin eventos este mes</p>
                ) : (
                  monthlyEvents.slice(0, 5).map((event) => {
                    const employee = employeeList.find((e) => String(e.id) === String(event.employee_id));
                    const start = event.start_date ? new Date(event.start_date) : null;
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CalendarIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{event.labor_event_name || "Evento"}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{employee?.name ?? "Sin asignar"}</p>
                          {start && <p className="text-[10px] text-zinc-400 mt-0.5">{start.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}</p>}
                        </div>
                        <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          event.status === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          event.status === "completed" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                          "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                        }`}>
                          {event.status === "active" ? "Activo" : event.status === "completed" ? "Completado" : "Pendiente"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Task center */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Centro de tareas</h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {actionItems.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${item.accent}`} />
                      <div>
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{item.title}</p>
                        <p className="text-[10px] text-zinc-400">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{item.value}</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Employees table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Empleados recientes</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{employeeList.length} colaboradores activos</p>
            </div>
            <button onClick={() => router.push("/pages/employee/list")} className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 font-medium flex items-center gap-1 transition-colors">
              Ver todos <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-5 py-3 text-left font-medium">Nombre</th>
                  <th className="px-5 py-3 text-left font-medium">Posición</th>
                  <th className="px-5 py-3 text-left font-medium">Salario</th>
                  <th className="px-5 py-3 text-center font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {employeeList.slice(0, 6).map((employee) => {
                  const badge = getStatusBadgeConfig(String(employee.status ?? ""));
                  const salaryDisplay = typeof employee.salary === "number" ? formatSalary(employee.salary as number) : String(employee.salary ?? "");
                  return (
                    <tr key={employee.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">{employee.name}</td>
                      <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{employee.position || "Sin asignar"}</td>
                      <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">{salaryDisplay}</td>
                      <td className="px-5 py-3 text-center"><span className={badge.className}>{badge.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attention alerts */}
        {attentionEmployees.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Asistencias incompletas</h4>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 mb-3">Estos empleados tienen registros de asistencia incompletos:</p>
                <div className="space-y-1.5">
                  {attentionEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 border border-amber-200/50 dark:border-amber-800/50">
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">{emp.name}</span>
                      <button onClick={() => router.push("/pages/attendance")} className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium">Revisar →</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day modal */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4" onClick={() => setDayModal(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-lg p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Eventos del día</p>
                <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">
                  {dayModal.date.toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })}
                </h4>
              </div>
              <button onClick={() => setDayModal(null)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dayModal.events.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">No hay eventos para este día</p>
              ) : (
                dayModal.events.map((ev) => (
                  <div key={ev.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{ev.labor_event_name || "Evento"}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {employeeList.find((em: Employee) => String(em.id) === String(ev.employee_id))?.name || "Sin asignar"}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase font-medium">
                        {ev.status}
                      </span>
                    </div>
                    {ev.labor_event_description && <p className="text-xs text-zinc-400 mt-2">{ev.labor_event_description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
