"use client";

import React, { useState } from 'react';
import FormModal from '@/components/ui/FormModal';
import { usePayroll } from '@/hooks/usePayroll';

interface Props {
  open: boolean;
  onClose: () => void;
  periodStart: string;
  periodEnd: string;
  onSaved?: (payrollId: number) => void;
}

export default function PayrollCreateModal({ open, onClose, periodStart, periodEnd, onSaved }: Props) {
  const { createPayroll, isLoading } = usePayroll() as any;
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        payroll_type_id: values.payroll_type_id || 1,
        period_start: periodStart,
        period_end: periodEnd,
        status: values.status || 'draft'
      };
      const created = await createPayroll(payload);

      // store id in local history
      try {
        const key = 'vp_payroll_history';
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(created.id);
        localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
      } catch (_e) {}

      if (onSaved) onSaved(created.id);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <FormModal open={open} onClose={onClose} title="Guardar planilla" initialValues={{ payroll_type_id: 1, status: 'draft' }} onSubmit={handleSave}>
      {(methods: any) => (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de planilla (ID)</label>
            <input {...methods.register('payroll_type_id', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <input {...methods.register('status')} className="w-full border px-2 py-1 rounded" />
          </div>

          <div>
            <p className="text-sm text-gray-600">Periodo: {periodStart} — {periodEnd}</p>
          </div>
        </div>
      )}
    </FormModal>
  );
}
