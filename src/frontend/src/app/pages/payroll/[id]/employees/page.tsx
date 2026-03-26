"use client";

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePayrollEmployees } from '@/hooks/usePayrollEmployees';
import { formatCRC } from '@/utils/number';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PayrollEmployeesPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const payrollId = parseInt(resolvedParams.id, 10);
  
  const { data: employees, isLoading, error, fetchPayrollEmployees } = usePayrollEmployees(payrollId);

  useEffect(() => {
    if (!isNaN(payrollId)) {
      fetchPayrollEmployees(payrollId);
    }
  }, [payrollId, fetchPayrollEmployees]);

  const totalGrossSalary = employees.reduce((sum, emp) => sum + emp.gross_salary, 0);
  const totalDeductions = employees.reduce((sum, emp) => sum + emp.total_deductions, 0);
  const totalNetSalary = employees.reduce((sum, emp) => sum + emp.net_salary, 0);

  return (
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#F9F1DC] dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[#3B4D36] dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#3B4D36] dark:text-white">Empleados en Planilla</h1>
              <p className="text-[#6B5B3D] dark:text-gray-400">Planilla #{payrollId}</p>
            </div>
          </div>
          <button
            onClick={() => fetchPayrollEmployees(payrollId)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] dark:bg-[#4a4a4a] text-white rounded-lg hover:bg-[#5D614A] dark:hover:bg-[#3d3d3d] transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && employees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[#6B5B3D] dark:text-gray-400">Salario Bruto Total</p>
                  <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{formatCRC(totalGrossSalary)}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <ReceiptPercentIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-[#6B5B3D] dark:text-gray-400">Deducciones Totales</p>
                  <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{formatCRC(totalDeductions)}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-[#6B5B3D] dark:text-gray-400">Salario Neto Total</p>
                  <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{formatCRC(totalNetSalary)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees List */}
        <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#6F7153] dark:bg-[#4a4a4a] bg-opacity-10 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-[#6F7153]" />
            </div>
            <h2 className="text-lg font-semibold text-[#3B4D36] dark:text-white">
              Empleados ({employees.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="w-12 h-12 animate-spin text-[#6F7153] mx-auto mb-3" />
              <p className="text-[#5D4E37] dark:text-gray-400">Cargando empleados...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-[#D2B48C] dark:text-gray-600 mx-auto mb-3" />
              <p className="text-[#6B5B3D] dark:text-gray-400">No hay empleados en esta planilla</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E0D6B7] dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#3B4D36] dark:text-white">Empleado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#3B4D36] dark:text-white">Identificación</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#3B4D36] dark:text-white">Puesto</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#3B4D36] dark:text-white">Salario Bruto</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#3B4D36] dark:text-white">Deducciones</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#3B4D36] dark:text-white">Salario Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr 
                      key={employee.id}
                      className="border-b border-[#E0D6B7] dark:border-gray-700 hover:bg-[#E7DCC1] dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#6F7153] dark:bg-[#4a4a4a] bg-opacity-10 rounded-lg">
                            <UserGroupIcon className="w-5 h-5 text-[#6F7153]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#3B4D36] dark:text-white">{employee.employee_name}</p>
                            <p className="text-xs text-[#6B5B3D] dark:text-gray-400">ID: {employee.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#5D4E37] dark:text-gray-300">
                        {employee.employee_identification}
                      </td>
                      <td className="py-3 px-4 text-[#5D4E37] dark:text-gray-300">
                        {employee.position_name || 'Sin puesto'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-green-700 dark:text-green-400">
                          {formatCRC(employee.gross_salary)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-red-700 dark:text-red-400">
                          {formatCRC(employee.total_deductions)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-[#3B4D36] dark:text-white">
                          {formatCRC(employee.net_salary)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
