"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaborEvents } from "@/hooks/useLaborEvents";
import useEmployeeList from "@/hooks/useEmployeeList";
import { useHolidays } from "@/hooks/useHolidays";
import { useUser } from "@/hooks/user";
import { LegalParamAlertBanner } from "@/components/LegalParamAlertBanner";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { formatSalary, getStatusBadgeConfig } from "@/utils/employeeUtils";
import { EmployeeLaborEvent } from "@/types/laborEvent";
import { CompanyHoliday } from "@/services/holidaysService";
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
  SparklesIcon,
} from "@heroicons/react/24/outline";
import PayrollTrendChart from "@/components/PayrollTrendChart";

const ATTENDANCE_PATH = "/pages/attendance";
const CARD_CONTAINER_CLASSES = "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800";
const ICON_BUTTON_CLASSES = "p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors";
const EVENT_STATUS_ACTIVE = "active";
const EVENT_STATUS_COMPLETED = "completed";
const ACTIVE_BADGE_CLASSES = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
const COMPLETED_BADGE_CLASSES = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
const TEXT_ZINC_400_10PX = "text-[10px] text-zinc-400";
const NOT_ASSIGNED = "Sin asignar";
const MANDATORY_LABEL = "Pago Obligatorio";
const NON_MANDATORY_LABEL = "Pago No Obligatorio";

interface CalendarEvent {
  date: number;
  type: "event" | "holiday" | "today" | "both";
  title: string;
  description?: string;
}

const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const Home: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dayModal, setDayModal] = useState<{ date: Date; events: EmployeeLaborEvent[]; holidays: CompanyHoliday[] } | null>(null);
  const [visibleRangeStart, setVisibleRangeStart] = useState<Date | null>(null);
  const [visibleRangeEnd, setVisibleRangeEnd] = useState<Date | null>(null);

  const { events, isLoading: eventsLoading, refreshEvents } = useLaborEvents();
  const { employees, refreshEmployees, stats } = useEmployeeList();
  const { data: dbHolidays } = useHolidays();
  const { user: currentUser } = useUser();
  const userRole = currentUser?.role ?? '';

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
  const activeEventsCount = safeEvents.filter((e) => e.status === EVENT_STATUS_ACTIVE).length;

  const nextHoliday = dbHolidays
    ? [...dbHolidays]
        .filter(h => new Date(h.company_holidays_date).getTime() >= new Date().setHours(0,0,0,0))
        .sort((a,b) => new Date(a.company_holidays_date).getTime() - new Date(b.company_holidays_date).getTime())[0]
    : null;

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

  const calendarHighlights = (() => {
    const highlights: CalendarEvent[] = [];
    
    // Add labor events - ONLY START DATE
    safeEvents.forEach((ev) => {
      try {
        const s = ev.start_date ? new Date(ev.start_date) : null;

        if (s && s.getMonth() === currentMonth && s.getFullYear() === currentYear) {
          highlights.push({
            date: s.getDate(),
            type: "event",
            title: ev.labor_event_name || "Evento",
            description: ev.labor_event_description
          });
        }
      } catch {}
    });

    // Add holidays
    dbHolidays?.forEach((h) => {
      const d = new Date(h.company_holidays_date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        highlights.push({
          date: d.getDate(),
          type: "holiday",
          title: h.company_holidays_name,
          description: h.company_holidays_is_mandatory ? MANDATORY_LABEL : NON_MANDATORY_LABEL
        });
      }
    });

    return highlights;
  })();

  const attentionEmployees = employeeList.filter((emp) => String(emp.status ?? "").toLowerCase().includes("incompleta")).slice(0, 3);

  const statCards = [
    { label: "Empleados activos", value: employeeList.length, icon: UserGroupIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", action: () => router.push("/pages/employee/list") },
    { label: "Asistencias pendientes", value: stats?.incompleteAssistance ?? 0, icon: ClipboardDocumentCheckIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", action: () => router.push(ATTENDANCE_PATH) },
    { label: "Eventos activos", value: activeEventsCount, icon: CalendarIcon, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", action: () => router.push("/pages/employee/events") },
    { label: "En vacaciones", value: stats?.onVacation ?? 0, icon: ClockIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", action: () => router.push("/pages/vacations") },
  ];

  const quickActions = [
    { label: "Calcular planilla", description: "Inicia el cálculo de la quincena", icon: CalculatorIcon, href: "/pages/payroll/wizard", color: "bg-green-600 hover:bg-green-500", testId: "quick-action-payroll" },
    { label: "Generar reportes", description: "Descarga métricas y resúmenes", icon: ChartBarIcon, href: "/pages/reports", color: "bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500", testId: "quick-action-reports" },
    { label: "Registro de asistencia", description: "Valida marcaciones del día", icon: ClipboardDocumentCheckIcon, href: ATTENDANCE_PATH, color: "bg-blue-600 hover:bg-blue-500", testId: "quick-action-attendance" },
    { label: "Dashboard de Marcas", description: "Revisar y corregir marcas de reloj", icon: ClockIcon, href: "/pages/clock-logs", color: "bg-indigo-600 hover:bg-indigo-500", testId: "quick-action-clock-logs" },
  ];

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
    const calendarDays: (number | null)[] = Array(firstDayIndex).fill(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
    while (calendarDays.length < 42) calendarDays.push(null);

    // eslint-disable-next-line sonarjs/cognitive-complexity
    return calendarDays.map((day, index) => {
      const isCurrentMonthDay = index >= firstDayIndex && index < daysInMonth + firstDayIndex;
      const dayEvents = isCurrentMonthDay ? calendarHighlights.filter((e) => e.date === day) : [];
      const hasHoliday = dayEvents.some(e => e.type === "holiday");
      const hasEvent = dayEvents.some(e => e.type === "event");
      const isToday = isCurrentMonthDay && day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

      return (
        <button
          key={`${day}-${index}`}
          type="button"
          onClick={isCurrentMonthDay && typeof day === "number" ? () => {
            const dt = new Date(currentYear, currentMonth, day);
            const dtStart = new Date(dt);
            dtStart.setHours(0, 0, 0, 0);
            const dtEnd = new Date(dt);
            dtEnd.setHours(23, 59, 59, 999);

            const laborEvents = safeEvents.filter((ev) => {
              try {
                const s = ev.start_date ? new Date(ev.start_date) : null;
                const e = ev.end_date ? new Date(ev.end_date) : s;
                if (!s || !e) return false;
                const eventStart = new Date(s);
                eventStart.setHours(0, 0, 0, 0);
                const eventEnd = new Date(e);
                eventEnd.setHours(23, 59, 59, 999);
                return !(eventEnd.getTime() < dtStart.getTime() || eventStart.getTime() > dtEnd.getTime());
              } catch { return false; }
            });

            const dayHolidays = dbHolidays?.filter((h) => {
              const d = new Date(h.company_holidays_date);
              return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }) || [];
            setDayModal({ date: dt, events: laborEvents, holidays: dayHolidays });
          } : undefined}
          className={`
            h-8 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer relative
            ${isToday ? "bg-green-600 text-white font-semibold shadow-md ring-2 ring-green-500 ring-offset-1 dark:ring-offset-zinc-950" : ""}
            ${!isToday && hasHoliday ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50" : ""}
            ${!isToday && !hasHoliday && hasEvent ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-800/50" : ""}
            ${isCurrentMonthDay && !isToday && !hasHoliday && !hasEvent ? "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800" : ""}
            ${!isCurrentMonthDay ? "text-zinc-300 dark:text-zinc-600" : ""}
          `}
          disabled={!isCurrentMonthDay}
        >
          <span>{day ?? ""}</span>
          {isCurrentMonthDay && dayEvents.length > 0 && (
             <div className="flex gap-0.5 mt-0.5">
                {hasHoliday && <div className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-amber-500"}`} />}
                {hasEvent && <div className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-green-500"}`} />}
             </div>
          )}
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-screen-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Panel General
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
            {today.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Legal parameter alerts banner */}
        <LegalParamAlertBanner userRole={userRole} />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={stat.action}
              className={`${CARD_CONTAINER_CLASSES} p-4 text-left hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                <AnimatedCounter value={Number(stat.value)} />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Calendar and Quick actions - left side */}
          <div className="xl:col-span-2 space-y-6">
            {/* Calendar */}
            <div className={`${CARD_CONTAINER_CLASSES} overflow-hidden`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{monthlyEvents.length} eventos este mes</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className={ICON_BUTTON_CLASSES}>
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className={ICON_BUTTON_CLASSES}>
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
                  data-testid={action.testId}
                  className={`flex items-center gap-4 px-5 py-4 ${CARD_CONTAINER_CLASSES} hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left cursor-pointer group`}
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

            {/* Quick actions - second row restored */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.slice(2).map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  data-testid={action.testId}
                  className={`flex items-center gap-4 px-5 py-4 ${CARD_CONTAINER_CLASSES} hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left cursor-pointer group`}
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
            <div className={`${CARD_CONTAINER_CLASSES} overflow-hidden`}>
              <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Próximos eventos</h3>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {eventsLoading ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Cargando...</p>
                ) : monthlyEvents.length === 0 && !nextHoliday ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Sin eventos este mes</p>
                ) : (
                  <>
                    {/* Render next holiday if available */}
                    {nextHoliday && (
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <SparklesIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">
                              Feriado: {nextHoliday.company_holidays_name}
                            </p>
                          </div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            {nextHoliday.company_holidays_is_mandatory ? MANDATORY_LABEL : NON_MANDATORY_LABEL}
                          </p>
                          <p className={`${TEXT_ZINC_400_10PX} mt-0.5`}>
                            {new Date(nextHoliday.company_holidays_date).toLocaleDateString("es-CR", { day: "numeric", month: "long" })}
                          </p>
                        </div>
                      </div>
                    )}

                    {monthlyEvents.slice(0, 5).map((event) => {
                      const employee = employeeList.find((e) => String(e.id) === String(event.employee_id));
                      const start = event.start_date ? new Date(event.start_date) : null;
                      return (
                        <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{event.labor_event_name || "Evento"}</p>
                            <p className={`${TEXT_ZINC_400_10PX} truncate`}>{employee?.name ?? NOT_ASSIGNED}</p>
                            {start && <p className={`${TEXT_ZINC_400_10PX} mt-0.5`}>{start.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}</p>}
                          </div>
                          <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            event.status === EVENT_STATUS_ACTIVE ? ACTIVE_BADGE_CLASSES :
                            event.status === EVENT_STATUS_COMPLETED ? COMPLETED_BADGE_CLASSES :
                            "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                          }`}>
                            {event.status === EVENT_STATUS_ACTIVE ? "Activo" : event.status === EVENT_STATUS_COMPLETED ? "Completado" : "Pendiente"}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Payroll trend chart */}
            <PayrollTrendChart />

            {/* Attention alerts - moved to sidebar for better visibility and balance */}
            {attentionEmployees.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Asistencias incompletas</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 mb-3">Estos empleados requieren atención:</p>
                    <div className="space-y-1.5">
                      {attentionEmployees.map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 border border-amber-200/50 dark:border-amber-800/50">
                          <span className="font-medium text-zinc-700 dark:text-zinc-200 truncate pr-2">{emp.name}</span>
                          <button onClick={() => router.push(ATTENDANCE_PATH)} className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium flex-shrink-0">Revisar →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Employees Table */}
        <div className={`${CARD_CONTAINER_CLASSES} overflow-hidden`}>
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
                      <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{employee.position || NOT_ASSIGNED}</td>
                      <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">{salaryDisplay}</td>
                      <td className="px-5 py-3 text-center"><span className={badge.className}>{badge.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {/* Holidays section */}
              {dayModal.holidays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Feriados</p>
                  {dayModal.holidays.map((h) => (
                    <div key={h.company_holidays_id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{h.company_holidays_name}</p>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        {h.company_holidays_is_mandatory ? MANDATORY_LABEL : NON_MANDATORY_LABEL}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Labor Events section */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Eventos Laborales</p>
                {dayModal.events.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No hay eventos laborales para este día</p>
                ) : (
                  dayModal.events.map((ev) => (
                    <div key={ev.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{ev.labor_event_name || "Evento"}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {employeeList.find((em: Employee) => String(em.id) === String(ev.employee_id))?.name || NOT_ASSIGNED}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          ev.status === EVENT_STATUS_ACTIVE ? ACTIVE_BADGE_CLASSES :
                          ev.status === EVENT_STATUS_COMPLETED ? COMPLETED_BADGE_CLASSES :
                          "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase"
                        }`}>
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
        </div>
      )}
    </div>
  );
};

export default Home;
