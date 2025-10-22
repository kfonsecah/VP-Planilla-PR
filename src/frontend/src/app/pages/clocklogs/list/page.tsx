"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import { useNominee } from '@/hooks/useNominee';
import { useModal } from '@/hooks/useModal';

export default function ClockLogsPage() {
  const { getClockLogs, isLoading } = useNominee() as any;
  const modal = useModal();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any[] | null>(null);

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      modal.showError('Fechas incompletas', 'Selecciona fecha de inicio y fin');
      return;
    }

    try {
      const res = await getClockLogs(startDate, endDate);
      setData(res as any[]);
      modal.showSuccess('Registros cargados', 'Se obtuvieron los registros de marcación');
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al obtener registros');
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'employee_id', title: 'Empleado' },
    { key: 'date', title: 'Fecha' },
    { key: 'hours', title: 'Horas' },
    { key: 'type', title: 'Tipo' },
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h1 className="text-2xl font-semibold mb-2">Registros de marcación</h1>
        <p className="text-sm text-gray-600 mb-4">Consulta las marcaciones por rango de fechas.</p>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border px-2 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border px-2 py-2 rounded" />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleFetch} disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded">{isLoading ? 'Cargando...' : 'Consultar'}</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); setData(null); }} className="px-4 py-2 bg-gray-200 rounded">Limpiar</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <Table columns={columns} data={data || []} />
      </div>
    </div>
  );
}
