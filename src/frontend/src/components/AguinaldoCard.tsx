'use client';

import React from 'react';
import { CurrencyDollarIcon, CalendarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAguinaldo } from '@/hooks/useAguinaldo';

interface AguinaldoCardProps {
  employeeId: number;
}

const AguinaldoCard: React.FC<AguinaldoCardProps> = ({ employeeId }) => {
  const { data, isLoading, error } = useAguinaldo(employeeId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      // Usamos UTC para evitar desfases de zona horaria si el backend envía solo fecha
      return new Date(dateStr).toLocaleDateString('es-CR', { 
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-pulse">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 h-12" />
        <div className="p-5 space-y-4">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden">
        <div className="p-5 text-center">
          <InformationCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Error al cargar aguinaldo</p>
          <p className="text-xs text-zinc-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const progressPercentage = Math.min(100, (data.monthsCompleted / 12) * 100);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
        <CurrencyDollarIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Aguinaldo Acumulado
        </h3>
      </div>
      
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            Período: {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
          </p>
          <p className="text-3xl font-bold text-zinc-700 dark:text-zinc-100">
            {formatCurrency(data.accrued)}
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Progreso del año ({data.monthsCompleted.toFixed(1)} meses)
            </span>
            <span className="text-xs font-bold text-green-700 dark:text-green-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">Proyección 20 Dic</p>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-100">
              {formatCurrency(data.projectedAnnual)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">Planillas Incluidas</p>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-100">
              {data.payrollsIncluded}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AguinaldoCard;
