"use client";

import React from 'react';

interface PayrollResultsProps {
  data: any;
  onCreate?: () => void;
}

export default function PayrollResults({ data, onCreate }: PayrollResultsProps) {
  if (!data) return null;

  // Try to find an array of employee results
  const employees = Array.isArray(data.employeeResults) ? data.employeeResults : Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : null;

  const total = (employees && employees.reduce) ? employees.reduce((acc: number, e: any) => acc + (Number(e.net) || 0), 0) : null;

  return (
    <div className="mt-6 bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Resultados del cálculo</h3>
        {onCreate && (
          <button onClick={onCreate} className="px-4 py-2 bg-green-600 text-white rounded">Guardar planilla</button>
        )}
      </div>

      {!employees && (
        <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      )}

      {employees && (
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Empleado</th>
                <th className="px-3 py-2 text-right">Horas</th>
                <th className="px-3 py-2 text-right">Bruto</th>
                <th className="px-3 py-2 text-right">Deducciones</th>
                <th className="px-3 py-2 text-right">Bonificaciones</th>
                <th className="px-3 py-2 text-right">Neto</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp: any) => (
                <tr key={emp.employee_id || emp.id || Math.random()} className="border-t">
                  <td className="px-3 py-2 text-sm">{emp.name || emp.employee_name || emp.employee || `#${emp.employee_id || emp.id}`}</td>
                  <td className="px-3 py-2 text-sm text-right">{emp.hours ?? emp.total_hours ?? '-'}</td>
                  <td className="px-3 py-2 text-sm text-right">{typeof emp.gross !== 'undefined' ? Number(emp.gross).toFixed(2) : '-'}</td>
                  <td className="px-3 py-2 text-sm text-right">{typeof emp.deductions !== 'undefined' ? Number(emp.deductions).toFixed(2) : (emp.total_deductions ? Number(emp.total_deductions).toFixed(2) : '-')}</td>
                  <td className="px-3 py-2 text-sm text-right">{typeof emp.bonuses !== 'undefined' ? Number(emp.bonuses).toFixed(2) : (emp.total_bonuses ? Number(emp.total_bonuses).toFixed(2) : '-')}</td>
                  <td className="px-3 py-2 text-sm text-right font-semibold">{typeof emp.net !== 'undefined' ? Number(emp.net).toFixed(2) : '-'}</td>
                </tr>
              ))}
            </tbody>
            {total !== null && (
              <tfoot>
                <tr className="border-t">
                  <td colSpan={5} className="px-3 py-2 text-right font-semibold">Total</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(total).toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
