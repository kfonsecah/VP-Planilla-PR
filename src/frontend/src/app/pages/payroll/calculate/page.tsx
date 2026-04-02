"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CalculatorIcon, ArrowPathIcon, DocumentTextIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { useNominee } from '@/hooks/useNominee';
import { usePayrollTypes } from '@/hooks/usePayrollTypes';
import PayrollResults from '@/components/PayrollResults';
import PayrollCreateModal from '@/components/PayrollCreateModal';
import DatePicker from '@/components/DatePicker';
import { Select, SelectItem } from '@/components/ui/Select';

export default function PayrollCalculatePage() {
  const { data, isLoading, error, calculatePayrollForPeriod } = useNominee();
  const { data: payrollTypes, isLoading: loadingTypes } = usePayrollTypes();

  const [payrollTypeId, setPayrollTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [dateRangeWarning, setDateRangeWarning] = useState<string | null>(null);

  const adjustDatesForPayrollType = (selectedTypeId: number, currentStartDate?: string) => {
    if (!payrollTypes) return;
    
    const selectedType = payrollTypes.find(pt => pt.id === selectedTypeId);
    if (!selectedType) return;

    const typeName = selectedType.name.toLowerCase();
    const parsedCurrent = currentStartDate ? displayDateToDate(currentStartDate) : null;
    const today = parsedCurrent ?? new Date();
    
    if (typeName.includes('quincenal') || typeName.includes('quincena')) {
      const day = today.getDate();
      let start: Date, end: Date;
      
      if (day <= 15) {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth(), 15);
      } else {
        start = new Date(today.getFullYear(), today.getMonth(), 16);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    } else if (typeName.includes('mensual') || typeName.includes('mes')) {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    } else if (typeName.includes('semanal') || typeName.includes('semana')) {
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    } else {
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    }
  };

  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const parseDisplayDate = (displayDate: string): string => {
    if (!displayDate || displayDate.length < 8) return '';
    const [day, month, year] = displayDate.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month}-${day}`;
  };

  const displayDateToDate = (displayDate: string): Date | null => {
    if (!displayDate || displayDate.length < 8) return null;
    const [day, month, year] = displayDate.split('/');
    const fullYear = year.length === 2 ? Number(`20${year}`) : Number(year);
    const monthNumber = Number(month);
    const dayNumber = Number(day);
    if (
      Number.isNaN(fullYear) ||
      Number.isNaN(monthNumber) ||
      Number.isNaN(dayNumber)
    ) {
      return null;
    }
    return new Date(fullYear, monthNumber - 1, dayNumber);
  };

  useEffect(() => {
    if (payrollTypeId) {
      adjustDatesForPayrollType(payrollTypeId, startDate || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollTypeId]);

  useEffect(() => {
    if (!payrollTypeId || !startDate || !endDate || startDate.length < 8 || endDate.length < 8) {
      setDateRangeWarning(null);
      return;
    }

    const selectedType = payrollTypes?.find(pt => pt.id === payrollTypeId);
    if (!selectedType) {
      setDateRangeWarning(null);
      return;
    }

    const start = displayDateToDate(startDate);
    const end = displayDateToDate(endDate);
    
    if (!start || !end) {
      setDateRangeWarning(null);
      return;
    }
    
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const typeName = selectedType.name.toLowerCase();

    let warning = null;

    if (typeName.includes('quincenal') || typeName.includes('quincena')) {
      if (diffDays < 14) {
        warning = `El rango actual es de ${diffDays} días. Para una planilla quincenal se recomiendan 15 días (del 1 al 15 o del 16 al último día del mes).`;
      } else if (diffDays > 16) {
        warning = `El rango actual es de ${diffDays} días. Para una planilla quincenal se recomiendan 15 días (del 1 al 15 o del 16 al último día del mes).`;
      }
    } else if (typeName.includes('mensual') || typeName.includes('mes')) {
      if (start.getDate() !== 1) {
        warning = `Para una planilla mensual, la fecha de inicio debe ser el primer día del mes.`;
      } else {
        const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        if (end.getDate() !== lastDay.getDate() || end.getMonth() !== start.getMonth()) {
          warning = `Para una planilla mensual, la fecha de fin debe ser el último día del mes (${lastDay.getDate()}).`;
        }
      }
    } else if (typeName.includes('semanal') || typeName.includes('semana')) {
      if (diffDays < 6) {
        warning = `El rango actual es de ${diffDays} días. Para una planilla semanal se requieren 7 días.`;
      } else if (diffDays > 7) {
        warning = `El rango actual es de ${diffDays} días. Para una planilla semanal se requieren 7 días.`;
      }
    }

    setDateRangeWarning(warning);
  }, [startDate, endDate, payrollTypeId, payrollTypes]);

  const validateDatesForType = (): string | null => {
    if (!payrollTypeId || !startDate || !endDate) return null;
    
    const selectedType = payrollTypes?.find(pt => pt.id === payrollTypeId);
    if (!selectedType) return null;

    const typeName = selectedType.name.toLowerCase();
    const start = displayDateToDate(startDate);
    const end = displayDateToDate(endDate);
    
    if (!start || !end) {
      return 'Formato de fecha inválido. Use dd/mm/yy';
    }
    
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (typeName.includes('quincenal') || typeName.includes('quincena')) {
      if (diffDays < 14 || diffDays > 16) {
        return 'Para planilla quincenal, el periodo debe ser de aproximadamente 15 días';
      }
    } else if (typeName.includes('mensual') || typeName.includes('mes')) {
      if (start.getDate() !== 1) {
        return 'Para planilla mensual, la fecha de inicio debe ser el primer día del mes';
      }
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      if (end.getDate() !== lastDay.getDate()) {
        return 'Para planilla mensual, la fecha de fin debe ser el último día del mes';
      }
    } else if (typeName.includes('semanal') || typeName.includes('semana')) {
      if (diffDays !== 6 && diffDays !== 7) {
        return 'Para planilla semanal, el periodo debe ser de 7 días';
      }
    }

    return null;
  };

  const handleCalculate = async () => {
    if (!payrollTypeId) {
      toast.error('Tipo de planilla requerido — debes seleccionar un tipo de planilla');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Selecciona fecha de inicio y fin');
      return;
    }

    const validationError = validateDatesForType();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const backendStartDate = parseDisplayDate(startDate);
      const backendEndDate = parseDisplayDate(endDate);
      
      await calculatePayrollForPeriod(backendStartDate, backendEndDate);
      
      toast.success('Se generó el resultado del cálculo');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al calcular nómina');
    }
  };

  const handleSave = (id: number) => {
    toast.success(`Planilla creada con id ${id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
              Gestión de Planillas
            </p>
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 leading-none">Cálculo de Planilla</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Selecciona el periodo para calcular la planilla y genera el resultado
            </p>
          </div>
        </div>

        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6" />

        {/* Formulario de cálculo */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <CalculatorIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Periodo de Cálculo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Selector de tipo de planilla */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Tipo de Planilla <span className="text-red-500">*</span>
              </label>
              <Select
                value={payrollTypeId ? String(payrollTypeId) : ''}
                onValueChange={(value) => setPayrollTypeId(value ? Number(value) : null)}
                disabled={loadingTypes}
                placeholder="Seleccione..."
                className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
              >
                {payrollTypes?.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="dd/mm/yy"
                disabled={!payrollTypeId}
                rangeStart={startDate}
                rangeEnd={endDate}
                isStartDate={true}
                className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Fecha de fin <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="dd/mm/yy"
                disabled={!payrollTypeId}
                rangeStart={startDate}
                rangeEnd={endDate}
                isStartDate={false}
                className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 disabled:opacity-50"
              />
            </div>

            <div className="flex items-end gap-2">
              <button 
                onClick={handleCalculate} 
                disabled={isLoading || !payrollTypeId || !startDate || !endDate}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <CalculatorIcon className="w-5 h-5" />
                {isLoading ? 'Calculando...' : 'Calcular'}
              </button>
              
              <button 
                onClick={() => { 
                  setPayrollTypeId(null);
                  setStartDate(''); 
                  setEndDate(''); 
                }} 
                className="px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                title="Limpiar formulario"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Información del tipo de planilla seleccionado */}
          {payrollTypeId && payrollTypes && (
            <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold inline-flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" /> Tipo seleccionado:
                </span>{' '}
                {payrollTypes.find(pt => pt.id === payrollTypeId)?.description}
              </p>
            </div>
          )}

          {/* Advertencia sobre el rango de fechas */}
          {dateRangeWarning && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium inline-flex items-center gap-1">
                <ExclamationTriangleIcon className="w-4 h-4" /> {dateRangeWarning}
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-5 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold inline-flex items-center gap-1">
                <LightBulbIcon className="w-4 h-4" /> Nota:
              </span>{' '}
              El cálculo incluirá todos los empleados activos en el periodo seleccionado,
              considerando salarios, bonificaciones, deducciones y horas trabajadas.
              {!payrollTypeId && ' Selecciona primero un tipo de planilla para ajustar automáticamente las fechas.'}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg shadow-sm">
            <p className="text-sm font-medium inline-flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" /> {error}
            </p>
          </div>
        )}

        {/* Loading skeleton for results */}
        {isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        {loadingTypes ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                      <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PayrollResults data={data} onCreate={() => setShowCreate(true)} />
        )}

        {/* Modal para guardar planilla */}
        <PayrollCreateModal 
          open={showCreate} 
          onClose={() => setShowCreate(false)} 
          periodStart={parseDisplayDate(startDate)} 
          periodEnd={parseDisplayDate(endDate)} 
          onSaved={handleSave} 
        />
      </div>
    </div>
  );
}
