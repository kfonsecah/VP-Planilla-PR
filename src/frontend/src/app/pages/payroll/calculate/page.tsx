"use client";

import React, { useState, useEffect } from 'react';
import { CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNominee } from '@/hooks/useNominee';
import { usePayrollTypes } from '@/hooks/usePayrollTypes';
import PayrollResults from '@/components/PayrollResults';
import PayrollCreateModal from '@/components/PayrollCreateModal';
import DatePicker from '@/components/DatePicker';
import { useModal } from '@/hooks/useModal';

export default function PayrollCalculatePage() {
  const { data, isLoading, error, calculatePayrollForPeriod } = useNominee();
  const { data: payrollTypes, isLoading: loadingTypes } = usePayrollTypes();
  const modal = useModal();

  const [payrollTypeId, setPayrollTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [dateRangeWarning, setDateRangeWarning] = useState<string | null>(null);

  // Función para ajustar fechas según el tipo de planilla
  const adjustDatesForPayrollType = (selectedTypeId: number, currentStartDate?: string) => {
    if (!payrollTypes) return;
    
    const selectedType = payrollTypes.find(pt => pt.id === selectedTypeId);
    if (!selectedType) return;

    const typeName = selectedType.name.toLowerCase();
    const parsedCurrent = currentStartDate ? displayDateToDate(currentStartDate) : null;
    const today = parsedCurrent ?? new Date();
    
    if (typeName.includes('quincenal') || typeName.includes('quincena')) {
      // Quincenal: del 1 al 15 o del 16 al último día del mes
      const day = today.getDate();
      let start: Date, end: Date;
      
      if (day <= 15) {
        // Primera quincena: del 1 al 15
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth(), 15);
      } else {
        // Segunda quincena: del 16 al último día del mes
        start = new Date(today.getFullYear(), today.getMonth(), 16);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes
      }
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    } else if (typeName.includes('mensual') || typeName.includes('mes')) {
      // Mensual: del primer día al último día del mes
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    } else if (typeName.includes('semanal') || typeName.includes('semana')) {
      // Semanal: 7 días desde hoy
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    } else {
      // Tipo personalizado: mantener 15 días de distancia por defecto
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      
      setStartDate(formatDateDisplay(start));
      setEndDate(formatDateDisplay(end));
    }
  };

  // Función para formatear fecha a dd/mm/yyyy
  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Función para convertir dd/mm/yy a YYYY-MM-DD (formato backend)
  const parseDisplayDate = (displayDate: string): string => {
    if (!displayDate || displayDate.length < 8) return '';
    const [day, month, year] = displayDate.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month}-${day}`;
  };

  // Convierte dd/mm/yy a objeto Date local evitando desfases por zona horaria
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

  // Efecto para ajustar fechas cuando cambia el tipo de planilla
  useEffect(() => {
    if (payrollTypeId) {
      adjustDatesForPayrollType(payrollTypeId, startDate || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollTypeId]);

  // Efecto para verificar el rango de fechas cuando cambian las fechas o el tipo
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
        warning = `⚠️ El rango actual es de ${diffDays} días. Para una planilla quincenal se recomiendan 15 días (del 1 al 15 o del 16 al último día del mes).`;
      } else if (diffDays > 16) {
        warning = `⚠️ El rango actual es de ${diffDays} días. Para una planilla quincenal se recomiendan 15 días (del 1 al 15 o del 16 al último día del mes).`;
      }
    } else if (typeName.includes('mensual') || typeName.includes('mes')) {
      if (start.getDate() !== 1) {
        warning = `⚠️ Para una planilla mensual, la fecha de inicio debe ser el primer día del mes.`;
      } else {
        const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        if (end.getDate() !== lastDay.getDate() || end.getMonth() !== start.getMonth()) {
          warning = `⚠️ Para una planilla mensual, la fecha de fin debe ser el último día del mes (${lastDay.getDate()}).`;
        }
      }
    } else if (typeName.includes('semanal') || typeName.includes('semana')) {
      if (diffDays < 6) {
        warning = `⚠️ El rango actual es de ${diffDays} días. Para una planilla semanal se requieren 7 días.`;
      } else if (diffDays > 7) {
        warning = `⚠️ El rango actual es de ${diffDays} días. Para una planilla semanal se requieren 7 días.`;
      }
    }

    setDateRangeWarning(warning);
  }, [startDate, endDate, payrollTypeId, payrollTypes]);

  // Validar que las fechas respeten el tipo de planilla seleccionado
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
      // Debe ser aproximadamente 15 días (14-16 días aceptable)
      if (diffDays < 14 || diffDays > 16) {
        return 'Para planilla quincenal, el periodo debe ser de aproximadamente 15 días';
      }
    } else if (typeName.includes('mensual') || typeName.includes('mes')) {
      // Debe ser del primer día al último día del mes
      if (start.getDate() !== 1) {
        return 'Para planilla mensual, la fecha de inicio debe ser el primer día del mes';
      }
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      if (end.getDate() !== lastDay.getDate()) {
        return 'Para planilla mensual, la fecha de fin debe ser el último día del mes';
      }
    } else if (typeName.includes('semanal') || typeName.includes('semana')) {
      // Debe ser exactamente 7 días
      if (diffDays !== 6 && diffDays !== 7) {
        return 'Para planilla semanal, el periodo debe ser de 7 días';
      }
    }

    return null;
  };

  const handleCalculate = async () => {
    if (!payrollTypeId) {
      modal.showError('Tipo de planilla requerido', 'Debes seleccionar un tipo de planilla');
      return;
    }
    if (!startDate || !endDate) {
      modal.showError('Fechas incompletas', 'Selecciona fecha de inicio y fin');
      return;
    }

    // Validar fechas según tipo de planilla
    const validationError = validateDatesForType();
    if (validationError) {
      modal.showError('Error en fechas', validationError);
      return;
    }

    try {
      // Convertir fechas del formato dd/mm/yy a YYYY-MM-DD para el backend
      const backendStartDate = parseDisplayDate(startDate);
      const backendEndDate = parseDisplayDate(endDate);
      
      await calculatePayrollForPeriod(backendStartDate, backendEndDate);
      
      modal.showSuccess('Cálculo completado', 'Se generó el resultado del cálculo');
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al calcular nómina');
    }
  };

  const handleSave = (id: number) => {
    modal.showSuccess('Planilla guardada', `Planilla creada con id ${id}`);
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-[#8B7355] dark:text-[#A3A3A3] uppercase tracking-widest mb-1">
              Gestión de Planillas
            </p>
            <h1 className="text-3xl font-bold text-[#3B4D36] dark:text-[#E5E5E5] leading-none">Cálculo de Planilla</h1>
            <p className="text-sm text-[#6B5B3D] dark:text-[#A3A3A3] mt-2">
              Selecciona el periodo para calcular la planilla y genera el resultado
            </p>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-[#404040] mb-6" />

        {/* Formulario de cálculo */}
        <div className="bg-[#F5F1E8] dark:bg-[#2d2d2d] rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-[#404040] p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <CalculatorIcon className="w-5 h-5 text-[#6F7153]" />
            <h2 className="text-lg font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">Periodo de Cálculo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Selector de tipo de planilla */}
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] dark:text-[#A3A3A3] mb-2">
                Tipo de Planilla <span className="text-red-500">*</span>
              </label>
              <select
                value={payrollTypeId || ''}
                onChange={(e) => setPayrollTypeId(e.target.value ? Number(e.target.value) : null)}
                disabled={loadingTypes}
                className="w-full border border-[#D2B48C] dark:border-[#404040] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-[#E5E5E5]"
              >
                <option value="">Seleccione...</option>
                {payrollTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5D4E37] dark:text-[#A3A3A3] mb-2">
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
                className="w-full border border-[#D2B48C] dark:border-[#404040] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-[#E5E5E5] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5D4E37] dark:text-[#A3A3A3] mb-2">
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
                className="w-full border border-[#D2B48C] dark:border-[#404040] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-[#E5E5E5] disabled:opacity-50"
              />
            </div>

            <div className="flex items-end gap-2">
              <button 
                onClick={handleCalculate} 
                disabled={isLoading || !payrollTypeId || !startDate || !endDate}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F7153] dark:bg-[#4a4a4a] text-white text-sm font-semibold rounded-lg hover:bg-[#5D614A] dark:hover:bg-[#3d3d3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                className="px-3 py-2.5 bg-[#D2B48C] dark:bg-[#404040] text-[#3B4D36] dark:text-[#E5E5E5] rounded-lg hover:bg-[#C5A87A] dark:hover:bg-[#4a4a4a] transition-colors shadow-sm"
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
                <span className="font-semibold">📋 Tipo seleccionado:</span>{' '}
                {payrollTypes.find(pt => pt.id === payrollTypeId)?.description}
              </p>
            </div>
          )}

          {/* Advertencia sobre el rango de fechas */}
          {dateRangeWarning && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                ⚠️ {dateRangeWarning}
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-5 p-4 bg-[#F9F3E3] dark:bg-[#333333] rounded-lg border border-[#E7DCC1] dark:border-[#404040]">
            <p className="text-sm text-[#5D4E37] dark:text-[#A3A3A3] leading-relaxed">
              <span className="font-semibold">💡 Nota:</span> El cálculo incluirá todos los empleados activos en el periodo seleccionado,
              considerando salarios, bonificaciones, deducciones y horas trabajadas.
              {!payrollTypeId && ' Selecciona primero un tipo de planilla para ajustar automáticamente las fechas.'}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg shadow-sm">
            <p className="text-sm font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Resultados */}
        <PayrollResults data={data} onCreate={() => setShowCreate(true)} />

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
