'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import DailyRow from '@/components/DailyRow';

interface EmployeeCardProps {
  employee_id: string;
  employee_name: string;
  daily_logs: EffectiveClockLog[];
  total_hours: number;
  worked_days: number;
  anomaly_count: number;
  onAddMark?: (employeeId: string, employeeName: string) => void;
  onEditEntry?: (entry: EffectiveClockLog) => void;
  onVoidEntry?: (entry: EffectiveClockLog) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee_id,
  employee_name,
  daily_logs,
  total_hours,
  worked_days,
  anomaly_count,
  onAddMark,
  onEditEntry,
  onVoidEntry,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div 
      className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow overflow-hidden ${
        anomaly_count > 0 ? 'border-l-4 border-l-amber-400' : ''
      }`}
    >
      <div 
        onClick={toggleExpand}
        className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 min-h-[44px]"
        aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} empleado ${employee_name}`}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {employee_name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {total_hours.toFixed(1)} horas totales — {worked_days} {worked_days === 1 ? 'día trabajado' : 'días trabajados'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Agregar marca button - triggers add modal with employee pre-filled */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddMark?.(employee_id, employee_name);
            }}
            className="px-2 py-1 text-xs font-medium rounded border border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            aria-label={`Agregar marca para ${employee_name}`}
          >
            + Agregar marca
          </button>
          {anomaly_count > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
              {anomaly_count} {anomaly_count === 1 ? 'problema' : 'problemas'}
            </span>
          )}
          
          <div className={`transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="border-t border-zinc-200 dark:border-zinc-700"
          >
            <div className="px-4 py-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/10">
              {daily_logs.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
                  No hay marcas registradas para este período.
                </p>
              ) : (
                daily_logs.map((log) => (
                  <DailyRow 
                    key={log.id} 
                    log={log}
                    onEdit={onEditEntry}
                    onVoid={onVoidEntry}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeCard;
