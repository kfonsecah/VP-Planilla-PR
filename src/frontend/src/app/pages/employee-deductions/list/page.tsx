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
      // Refrescar las deducciones del empleado
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
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#3B4D36] dark:text-white">Deducciones por Empleado</h1>
          <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mt-1">
            Asigna y gestiona deducciones específicas para cada empleado
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Selection Panel */}
          <div className="bg-[#F9F1DC] dark:bg-gray-800 rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#3B4D36] dark:text-white">Seleccionar Empleado</h2>
              <UserGroupIcon className="w-6 h-6 text-[#6F7153]" />
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#D2B48C] dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-[#6B5B3D] dark:text-gray-400" />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmployees?.map((employee: Employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployeeId(Number(employee.id))}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEmployeeId === Number(employee.id)
                      ? 'bg-[#6F7153] text-white'
                      : 'bg-white dark:bg-gray-700 hover:bg-[#E7DCC1] dark:hover:bg-gray-600 text-[#3B4D36] dark:text-white'
                  }`}
                >
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-sm opacity-80">{employee.position}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Employee Deductions Panel */}
          <div className="bg-[#F9F1DC] dark:bg-gray-800 rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#3B4D36] dark:text-white">
                {selectedEmployee ? `Deducciones de ${selectedEmployee.name}` : 'Deducciones del Empleado'}
              </h2>
              {selectedEmployeeId && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors text-sm"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Asignar
                </button>
              )}
            </div>

            {!selectedEmployeeId ? (
              <div className="text-center py-12">
                <UserGroupIcon className="w-16 h-16 text-[#D2B48C] dark:text-gray-600 mx-auto mb-3" />
                <p className="text-[#6B5B3D] dark:text-gray-400">Selecciona un empleado para ver sus deducciones</p>
              </div>
            ) : loadingEmpDeductions ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-[#6F7153] mx-auto mb-2" />
                <p className="text-[#5D4E37] dark:text-gray-400">Cargando deducciones...</p>
              </div>
            ) : employeeDeductions.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="w-16 h-16 text-[#D2B48C] dark:text-gray-600 mx-auto mb-3" />
                <p className="text-[#6B5B3D] dark:text-gray-400 mb-4">No hay deducciones asignadas</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Asignar Primera Deducción
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {employeeDeductions.map((deduction: EmployeeDeductionWithDetails, index: number) => (
                  <div
                    key={`emp-${selectedEmployeeId}-ded-${deduction.deduction_id}-${index}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-[#E0D6B7] dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#6F7153] bg-opacity-10 dark:bg-[#6F7153]/20 rounded-lg">
                          <CurrencyDollarIcon className="w-5 h-5 text-[#6F7153]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#3B4D36] dark:text-white">
                            {deduction.deduction_name || `Deducción #${deduction.deduction_id}`}
                          </p>
                          {deduction.deduction_description && (
                            <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mt-0.5">{deduction.deduction_description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {deduction.fixed_amount > 0 && (
                              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                ₡{deduction.fixed_amount.toLocaleString()}
                              </span>
                            )}
                            {deduction.percentage > 0 && (
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                {deduction.percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDeduction(deduction.deduction_id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-2"
                      title="Eliminar deducción"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Deduction Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#F9F1DC] dark:bg-gray-800 rounded-xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#3B4D36] dark:text-white mb-4">Asignar Deducción</h3>

            {loadingDeductions ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-[#6F7153] mx-auto mb-2" />
              </div>
            ) : availableDeductions && availableDeductions.length > 0 ? (
              <>
                <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                  {availableDeductions.map((deduction) => (
                    <button
                      key={deduction.id}
                      onClick={() => setSelectedDeductionId(deduction.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedDeductionId === deduction.id
                          ? 'bg-[#6F7153] text-white'
                          : 'bg-white dark:bg-gray-700 hover:bg-[#E7DCC1] dark:hover:bg-gray-600 text-[#3B4D36] dark:text-white'
                      }`}
                    >
                      <p className="font-medium">{deduction.name}</p>
                      {deduction.description && (
                        <p className="text-sm opacity-80">{deduction.description}</p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedDeductionId(null);
                    }}
                    className="flex-1 px-4 py-2 bg-[#B8A989] dark:bg-gray-600 text-[#3B4D36] dark:text-white rounded-lg hover:bg-[#A89979] dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAssignDeduction}
                    disabled={!selectedDeductionId}
                    className="flex-1 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-50"
                  >
                    Asignar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-[#6B5B3D] dark:text-gray-400 py-8">
                  No hay más deducciones disponibles para asignar
                </p>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedDeductionId(null);
                  }}
                  className="w-full px-4 py-2 bg-[#B8A989] dark:bg-gray-600 text-[#3B4D36] dark:text-white rounded-lg hover:bg-[#A89979] dark:hover:bg-gray-500 transition-colors"
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
