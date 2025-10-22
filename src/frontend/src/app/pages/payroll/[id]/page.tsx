"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PayrollResults from '@/components/PayrollResults';
import { usePayroll } from '@/hooks/usePayroll';
import { useModal } from '@/hooks/useModal';

export default function PayrollDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const modal = useModal();
  const { data, isLoading, error, getPayrollById } = usePayroll() as any;
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    // extract id from path like /pages/payroll/123
    const parts = pathname?.split('/') || [];
    const last = parts[parts.length - 1];
    const parsed = Number(last);
    if (!isNaN(parsed)) setId(parsed);
  }, [pathname]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        await getPayrollById(id);
      } catch (err: any) {
        modal.showError('Error', err?.message || 'No se pudo cargar la planilla');
      }
    };
    load();
  }, [id, getPayrollById, modal]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/pages/payroll/list')} className="text-sm text-gray-600 hover:underline">← Volver al historial</button>
          <h1 className="text-2xl font-semibold mt-2">Detalle de planilla {id ? `#${id}` : ''}</h1>
        </div>
      </div>

      {isLoading && <div className="p-4 bg-white rounded shadow">Cargando...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>}

      <PayrollResults data={data} />
    </div>
  );
}
