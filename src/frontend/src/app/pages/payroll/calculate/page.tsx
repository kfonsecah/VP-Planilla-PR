"use client";

import React, { useState } from 'react';
import { CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNominee } from '@/hooks/useNominee';
import PayrollResults from '@/components/PayrollResults';
import PayrollCreateModal from '@/components/PayrollCreateModal';
import { useModal } from '@/hooks/useModal';

export default function PayrollCalculatePage() {
  const { data, isLoading, error, calculatePayrollForPeriod } = useNominee();
  const modal = useModal();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      modal.showError('Fechas incompletas', 'Selecciona fecha de inicio y fin');
      return;
    }
    try {
      await calculatePayrollForPeriod(startDate, endDate);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-2">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full border border-[#D2B48C] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-2">
                Fecha de fin <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="w-full border border-[#D2B48C] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
              />
            </div>

            <div className="flex items-end gap-2">
              <button 
                onClick={handleCalculate} 
                disabled={isLoading || !startDate || !endDate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalculatorIcon className="w-5 h-5" />
                {isLoading ? 'Calculando...' : 'Calcular'}
              </button>
              
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }} 
                className="px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors"
                title="Limpiar fechas"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-[#E7DCC1] rounded-lg border border-[#D2B48C]">
            <p className="text-xs text-[#5D4E37]">
              💡 <strong>Nota:</strong> El cálculo incluirá todos los empleados activos en el periodo seleccionado,
              considerando salarios, bonificaciones, deducciones y horas trabajadas.
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
          periodStart={startDate} 
          periodEnd={endDate} 
          onSaved={handleSave} 
        />
      </div>
    </div>
  );
}
