'use client';

import React from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { EmployeeProfileData } from '@/hooks/useEmployeeProfile';
import { ClockAlias } from '@/services/clockAliasService';
import { Vacation } from '@/services/vacationsService';
import { getStatusBadgeConfig } from '@/utils/employeeUtils';
import AguinaldoCard from '@/components/AguinaldoCard';

interface ProfileSummaryTabProps {
  employee: EmployeeProfileData;
  aliases: ClockAlias[];
  vacations: Vacation[];
  onEditClick: () => void;
}

/**
 * Tab "Resumen" del perfil de empleado
 * Muestra widgets consolidados: Info Personal, Compensación, Tiempo/Marcas, Vacaciones
 */
const ProfileSummaryTab: React.FC<ProfileSummaryTabProps> = ({
  employee,
  aliases,
  vacations,
  onEditClick,
}) => {
  const isFired = employee.fired;
  const statusBadge = getStatusBadgeConfig(
    isFired ? 'fired' : (employee.status === 'A' ? 'active' : employee.status)
  );

  const positionName = employee.position_name ?? 'Sin posición';
  const baseSalary = employee.position_base_salary ?? 0;

  // Cálculo simple de vacaciones usadas
  const totalVacationDays = vacations.reduce((acc, v) => acc + (v.total_days || 0), 0);

  const formatDate = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-CR', { 
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' 
      });
    } catch {
      return '—';
    }
  };

  const formatSalary = (amount: number): string => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* ── Tarjeta: Información Personal ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Información Personal
            </h3>
          </div>
          <button
            onClick={onEditClick}
            className="text-xs font-medium text-green-700 dark:text-green-400 hover:underline"
          >
            Editar
          </button>
        </div>
        <div className="p-5 space-y-3">
          <InfoRow icon={<IdentificationIcon className="w-4 h-4" />} label="Cédula" value={employee.national_id || '—'} />
          <InfoRow icon={<EnvelopeIcon className="w-4 h-4" />} label="Email" value={employee.email || '—'} />
          <InfoRow icon={<PhoneIcon className="w-4 h-4" />} label="Teléfono" value={employee.phone || '—'} />
          <InfoRow icon={<CalendarDaysIcon className="w-4 h-4" />} label="Fecha de Ingreso" value={formatDate(employee.hire_date)} />
          {employee.gender && (
            <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Género" value={employee.gender} />
          )}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Estado:</span>
              <span className={statusBadge.className}>{statusBadge.text}</span>
            </div>
          </div>
          {isFired && employee.exit_date && (
            <InfoRow icon={<CalendarDaysIcon className="w-4 h-4 text-red-400" />} label="Fecha de Salida" value={formatDate(employee.exit_date)} />
          )}
        </div>
      </div>

      {/* ── Tarjeta: Compensación ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
          <CurrencyDollarIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Compensación
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Posición</p>
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">{positionName}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Precio por Hora</p>
            <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">{formatSalary(baseSalary)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Hora Regular</p>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">{formatSalary(baseSalary)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Hora Extra (×1.5)</p>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">{formatSalary(baseSalary * 1.5)}</p>
            </div>
          </div>
          {employee.required_hours_biweekly && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Horas Requeridas Quincenal</p>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">
                {employee.required_hours_biweekly}h
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tarjeta: Aliases de Marcas ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Aliases de Reloj
          </h3>
        </div>
        <div className="p-5">
          {aliases.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Sin aliases configurados</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {aliases.map((alias) => (
                <span
                  key={alias.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E7DCC1] dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200"
                >
                  <ClockIcon className="w-3.5 h-3.5" />
                  {alias.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tarjeta: Vacaciones ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
          <SunIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Vacaciones
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Días Utilizados</p>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">{totalVacationDays}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Registros</p>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">{vacations.length}</p>
            </div>
          </div>
          {vacations.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                Últimas vacaciones
              </p>
              {vacations.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                >
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">
                    {formatDate(v.start_date)} → {formatDate(v.end_date)}
                  </span>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                    {v.total_days} días
                  </span>
                </div>
              ))}
              {vacations.length > 3 && (
                <p className="text-xs text-green-700 dark:text-green-400 font-medium cursor-pointer hover:underline mt-1">
                  Ver todas ({vacations.length})
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Sin registros de vacaciones</p>
          )}
        </div>
      </div>

      {/* ── Tarjeta: Aguinaldo Acumulado ── */}
      <AguinaldoCard employeeId={employee.id} />
    </div>
  );
};

/**
 * Fila de info (icono + label + value)
 */
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-100 truncate">{value}</p>
    </div>
  </div>
);

export default ProfileSummaryTab;
