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
    const today = currentStartDate ? new Date(parseDisplayDate(currentStartDate)) : new Date();
    
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

  // Función para convertir YYYY-MM-DD a dd/mm/yy
  const formatToDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
  };

  // Función para formatear fecha a YYYY-MM-DD (para backend)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    const start = new Date(parseDisplayDate(startDate));
    const end = new Date(parseDisplayDate(endDate));
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
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
    const start = new Date(parseDisplayDate(startDate));
    const end = new Date(parseDisplayDate(endDate));
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
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
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al calcular nómina');
    }
  };

  const handleSave = (id: number) => {
    modal.showSuccess('Planilla guardada', `Planilla creada con id ${id}`);
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B4D36]">Cálculo de Planilla</h1>
            <p className="text-sm text-[#6B5B3D] mt-1">
              Selecciona el periodo para calcular la planilla y genera el resultado
            </p>
          </div>
        </div>

        {/* Formulario de cálculo */}
        <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalculatorIcon className="w-5 h-5 text-[#6F7153]" />
            <h2 className="text-lg font-medium text-[#3B4D36]">Periodo de Cálculo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Selector de tipo de planilla */}
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-2">
                Tipo de Planilla <span className="text-red-500">*</span>
              </label>
              <select
                value={payrollTypeId || ''}
                onChange={(e) => setPayrollTypeId(e.target.value ? Number(e.target.value) : null)}
                disabled={loadingTypes}
                className="w-full border border-[#D2B48C] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
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
              <label className="block text-sm font-medium text-[#5D4E37] mb-2">
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
                className="w-full border border-[#D2B48C] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-2">
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
                className="w-full border border-[#D2B48C] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36] disabled:opacity-50"
              />
            </div>

            <div className="flex items-end gap-2">
              <button 
                onClick={handleCalculate} 
                disabled={isLoading || !payrollTypeId || !startDate || !endDate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors"
                title="Limpiar formulario"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Información del tipo de planilla seleccionado */}
          {payrollTypeId && payrollTypes && (
            <div className="mt-4 p-3 bg-[#E7DCC1] rounded-lg border border-[#D2B48C]">
              <p className="text-xs text-[#5D4E37]">
                📋 <strong>Tipo seleccionado:</strong>{' '}
                {payrollTypes.find(pt => pt.id === payrollTypeId)?.description}
              </p>
            </div>
          )}

          {/* Advertencia sobre el rango de fechas */}
          {dateRangeWarning && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
              <p className="text-xs text-yellow-800">
                {dateRangeWarning}
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-[#E7DCC1] rounded-lg border border-[#D2B48C]">
            <p className="text-xs text-[#5D4E37]">
              💡 <strong>Nota:</strong> El cálculo incluirá todos los empleados activos en el periodo seleccionado,
              considerando salarios, bonificaciones, deducciones y horas trabajadas.
              {!payrollTypeId && ' Selecciona primero un tipo de planilla para ajustar automáticamente las fechas.'}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ⚠️ {error}
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
