"use client";

import React, { useState, useEffect } from 'react';
import { useEmployeeDeductions } from '@/hooks/useEmployeeDeductions';
import useEmployeeList from '@/hooks/useEmployeeList';
import { useDeductions } from '@/hooks/useDeductions';
import { useModal } from '@/hooks/useModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Employee } from '@/types/employee';
import { EmployeeDeductionWithDetails } from '@/types/employeeDeductions';
import {
  UserGroupIcon,
  PlusCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function EmployeeDeductionsPage() {
  const modal = useModal();
  const { employees } = useEmployeeList();
  const { data: allDeductions, isLoading: loadingDeductions } = useDeductions();
  const { 
    data: employeeDeductions, 
    isLoading: loadingEmpDeductions,
    fetchEmployeeDeductions,
    assignDeduction,
    removeDeduction 
  } = useEmployeeDeductions();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDeductionId, setSelectedDeductionId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deductionToDelete, setDeductionToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeDeductions(selectedEmployeeId);
    }
  }, [selectedEmployeeId, fetchEmployeeDeductions]);

  const selectedEmployee = employees?.find((e: Employee) => Number(e.id) === selectedEmployeeId);

  const handleAssignDeduction = async () => {
    if (!selectedEmployeeId || !selectedDeductionId) {
      modal.showError('Error', 'Debes seleccionar un empleado y una deducción');
      return;
    }

    try {
      await assignDeduction({ employeeId: selectedEmployeeId, deductionId: selectedDeductionId });
      modal.showSuccess('Éxito', 'Deducción asignada correctamente');
      setShowAssignModal(false);
      setSelectedDeductionId(null);
      if (selectedEmployeeId) {
        await fetchEmployeeDeductions(selectedEmployeeId);
      }
    } catch (error: unknown) {
      modal.showError('Error', error instanceof Error ? error.message : 'Error al asignar deducción');
    }
  };

  const handleRemoveDeduction = (deductionId: number) => {
    setDeductionToDelete(deductionId);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmployeeId || !deductionToDelete) return;

    try {
      await removeDeduction(selectedEmployeeId, deductionToDelete);
      modal.showSuccess('Éxito', 'Deducción eliminada correctamente');
    } catch (error: unknown) {
      modal.showError('Error', error instanceof Error ? error.message : 'Error al eliminar deducción');
    } finally {
      setShowConfirmDelete(false);
      setDeductionToDelete(null);
    }
  };

  const filteredEmployees = employees?.filter((emp: Employee) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableDeductions = allDeductions?.filter(
    deduction => !employeeDeductions.some((ed: EmployeeDeductionWithDetails) => ed.deduction_id === deduction.id)
  );

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Configuración</p>
          <h1 className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">Deducciones por Empleado</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Asigna y gestiona deducciones específicas para cada empleado
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-100">Seleccionar Empleado</h2>
              <UserGroupIcon className="w-5 h-5 text-green-600" />
            </div>

            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100 text-sm"
              />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredEmployees?.map((employee: Employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployeeId(Number(employee.id))}
                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                    selectedEmployeeId === Number(employee.id)
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                      : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-transparent'
                  }`}
                >
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{employee.position}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-100">
                {selectedEmployee ? `Deducciones de ${selectedEmployee.name}` : 'Deducciones del Empleado'}
              </h2>
              {selectedEmployeeId && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Asignar
                </button>
              )}
            </div>

            {!selectedEmployeeId ? (
              <div className="text-center py-12">
                <UserGroupIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Selecciona un empleado para ver sus deducciones</p>
              </div>
            ) : loadingEmpDeductions ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                    <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : employeeDeductions.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">No hay deducciones asignadas</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Asignar Primera Deducción
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {employeeDeductions.map((deduction: EmployeeDeductionWithDetails, index: number) => (
                  <div
                    key={`emp-${selectedEmployeeId}-ded-${deduction.deduction_id}-${index}`}
                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                        <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-700 dark:text-zinc-100 text-sm">
                          {deduction.deduction_name || `Deducción #${deduction.deduction_id}`}
                        </p>
                        {deduction.deduction_description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{deduction.deduction_description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {deduction.fixed_amount > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              ₡{deduction.fixed_amount.toLocaleString()}
                            </span>
                          )}
                          {deduction.percentage > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                              {deduction.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDeduction(deduction.deduction_id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar deducción"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowAssignModal(false); setSelectedDeductionId(null); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-100">Asignar Deducción</h3>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedDeductionId(null); }}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {loadingDeductions ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
              </div>
            ) : availableDeductions && availableDeductions.length > 0 ? (
              <>
                <div className="space-y-1 mb-4 max-h-64 overflow-y-auto">
                  {availableDeductions.map((deduction) => (
                    <button
                      key={deduction.id}
                      onClick={() => setSelectedDeductionId(deduction.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                        selectedDeductionId === deduction.id
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                          : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <p className="font-medium">{deduction.name}</p>
                      {deduction.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{deduction.description}</p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => { setShowAssignModal(false); setSelectedDeductionId(null); }}
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAssignDeduction}
                    disabled={!selectedDeductionId}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Asignar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm py-8">
                  No hay más deducciones disponibles para asignar
                </p>
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedDeductionId(null); }}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirmDelete}
        title="Eliminar Deducción"
        description="¿Estás seguro de que deseas eliminar esta deducción del empleado?"
        onCancel={() => {
          setShowConfirmDelete(false);
          setDeductionToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
