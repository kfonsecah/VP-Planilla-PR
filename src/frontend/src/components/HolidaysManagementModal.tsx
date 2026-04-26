"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useHolidays } from '@/hooks/useHolidays';
import { CompanyHoliday, CRHoliday, getCostaRicaHolidays } from '@/services/holidaysService';
import { UseFormReturn } from 'react-hook-form';
import { ArrowPathIcon, PlusIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface HolidaysManagementModalProps {
  open: boolean;
  onClose: () => void;
  editHoliday?: CompanyHoliday | null;
}

export default function HolidaysManagementModal({ open, onClose, editHoliday }: HolidaysManagementModalProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { data, isLoading, error, refetch, create, createMany, update, remove } = useHolidays(selectedYear);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyHoliday | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CompanyHoliday | null>(null);

  React.useEffect(() => {
    if (open && editHoliday && !formOpen) {
      openEdit(editHoliday);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editHoliday]);

  if (!open) return null;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (holiday: CompanyHoliday & { id?: string | number }) => {
    // Prevent timezone shift by strictly rendering the YYYY-MM-DD local part of the date, 
    // or properly parsing backend date to YYYY-MM-DD
    let formattedDate = '';
    try {
      const d = new Date(holiday.company_holidays_date);
      const isUTCMidnight = holiday.company_holidays_date.endsWith('T00:00:00.000Z') || holiday.company_holidays_date.endsWith('T00:00:00Z');
      
      const dd = String(isUTCMidnight ? d.getUTCDate() : d.getDate()).padStart(2, '0');
      const mm = String((isUTCMidnight ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
      const yy = String(isUTCMidnight ? d.getUTCFullYear() : d.getFullYear());
      formattedDate = `${yy}-${mm}-${dd}`;
    } catch {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    setEditing({
      ...holiday,
      company_holidays_date: formattedDate
    } as unknown as CompanyHoliday);
    setFormOpen(true);
  };

  const openDelete = (holiday: CompanyHoliday & { id?: string | number }) => {
    setToDelete(holiday);
    setConfirmOpen(true);
  };

  const handleSubmit = async (values: Partial<CompanyHoliday>) => {
    try {
      // Force midnight local by splitting from native YYYY-MM-DD string
      const [y, m, d] = (values.company_holidays_date as string).split('-').map(Number);
      const localDate = new Date(y, m - 1, d, 0, 0, 0);

      const payload = {
        ...values,
        company_holidays_date: localDate.toISOString(),
      };
      
      if (editing) {
        await update(editing.company_holidays_id, payload);
        toast.success('Feriado actualizado correctamente');
      } else {
        await create(payload);
        toast.success('Feriado creado correctamente');
      }
      setFormOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el feriado');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.company_holidays_id);
      toast.success('Feriado eliminado correctamente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el feriado');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleGenerateDefaults = async () => {
    if (data && data.length > 0) {
      setGenerateConfirmOpen(true);
      return;
    }
    
    await executeGenerateDefaults();
  };

  const executeGenerateDefaults = async () => {
    setGenerateConfirmOpen(false);
    try {
      const defaultHolidays = getCostaRicaHolidays(selectedYear);
      // Construct payload skipping duplicates by exact name to avoid timezone issues
      const payload = defaultHolidays
        .filter((dh: CRHoliday) => !data?.some(eh => eh.company_holidays_name.trim().toLowerCase() === dh.name.trim().toLowerCase()))
        .map((h: CRHoliday) => ({
          company_holidays_date: h.date.toISOString(),
          company_holidays_name: h.name,
          company_holidays_is_mandatory: h.isMandatoryPay,
          company_holidays_is_triple: false
        }));

      if (payload.length === 0) {
        toast.info('Todos los feriados de ley ya estaban registrados.');
        return;
      }

      await createMany(payload);
      toast.success(`${payload.length} feriados generados correctamente para ${selectedYear}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar feriados');
    }
  };

  const columns = [
    { 
      key: 'company_holidays_date', 
      title: 'Fecha', 
      render: (r: CompanyHoliday & { id?: string | number }) => {
        // Formato dd/mm/yy
        // Extraemos partes usando timezone local por si la creación compensó mal el offset
        const d = new Date(r.company_holidays_date);
        // Ajuste defensivo: al ser creado con type="date" puede venir como Midnight UTC.
        // Convertirlo forzado sumándole un offset si se lee mal, o simplemente usar UTC date
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(d.getUTCFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
      }
    },
    { key: 'company_holidays_name', title: 'Nombre' },
    { 
      key: 'company_holidays_is_mandatory', 
      title: 'Pago Obligatorio',
      render: (r: CompanyHoliday & { id?: string | number }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${r.company_holidays_is_mandatory ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
          {r.company_holidays_is_mandatory ? 'Sí (Pago Doble)' : 'No (Pago Sencillo)'}
        </span>
      )
    },
    { 
      key: 'company_holidays_is_triple', 
      title: 'Día Libre (Pago Triple)',
      render: (r: CompanyHoliday & { id?: string | number }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${r.company_holidays_is_triple ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-transparent text-zinc-400'}`}>
          {r.company_holidays_is_triple ? 'Sí (150% extra)' : '-'}
        </span>
      )
    },
  ];

  const tableData = data ? data.map(h => ({ ...h, id: h.company_holidays_id })) : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content container */}
      <div className="relative flex flex-col w-full max-w-5xl bg-zinc-100 dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh]">
        
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Header area */}
          <div className="flex justify-between items-start mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Configuración / Leyes Laborales</p>
              <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mt-1">Días Feriados</h1>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <p className="text-sm text-zinc-500 max-w-3xl mb-6">Administra los días feriados de la compañía. Puedes usar el botón de auto-generar para cargar todos los feriados de ley de Costa Rica calculando las fechas móviles como Semana Santa.</p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Filtrar por año:</label>
              <input 
                type="number" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-24 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={() => refetch()} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Refrescar</span>
              </button>
              <button onClick={handleGenerateDefaults} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 dark:text-zinc-900 tracking-tight text-white rounded-lg transition-colors flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                Generar {selectedYear}
              </button>
              <button onClick={openCreate} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Registrar
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Table columns={columns as any} data={tableData} isLoading={isLoading} error={error} onRetry={refetch} onEdit={openEdit as any} onDelete={openDelete as any} emptyMessage={`No hay feriados registrados para ${selectedYear}`} />
          </div>
        </div>
      </div>

      <FormModal 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        title={editing ? 'Editar Feriado' : 'Nuevo Feriado'} 
        initialValues={editing || { company_holidays_is_mandatory: false, company_holidays_is_triple: false }} 
        onSubmit={handleSubmit}
      >
        {(methods: UseFormReturn<Partial<CompanyHoliday>>) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Nombre del Feriado</label>
              <input 
                {...methods.register('company_holidays_name', { required: true })} 
                placeholder="Ej: Día de la Madre"
                className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500" 
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Fecha del Feriado</label>
              <input 
                type="date"
                lang="es-CR"
                {...methods.register('company_holidays_date', { required: true })} 
                className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 min-w-[200px]" 
              />
            </div>

            <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg flex items-start gap-3 mt-2">
              <input 
                type="checkbox" 
                id="is_mandatory"
                {...methods.register('company_holidays_is_mandatory')} 
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-600"
              />
              <label htmlFor="is_mandatory" className="text-sm cursor-pointer">
                <span className="font-semibold block text-amber-900 dark:text-amber-200">Pago Obligatorio (Doble)</span>
                <span className="text-amber-700 dark:text-amber-400 font-normal">Si el empleado no trabaja este día, recibe el pago sencillo. Si trabaja, se paga doble mediante reconocimiento de feriado trabajado.</span>
              </label>
            </div>

            <div className="col-span-1 md:col-span-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg flex items-start gap-3">
              <input 
                type="checkbox" 
                id="is_triple"
                {...methods.register('company_holidays_is_triple')} 
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-600"
              />
              <label htmlFor="is_triple" className="text-sm cursor-pointer">
                <span className="font-semibold block text-red-900 dark:text-red-200">Aplica Pago Triple</span>
                <span className="text-red-700 dark:text-red-400 font-normal">Sólo debe marcarse si por convención colectiva o porque el empleado trabajó en su día libre de descanso durante un feriado de pago obligatorio. Multiplicará x3 las horas laboradas (Artículo 152 CT).</span>
              </label>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog 
        open={confirmOpen} 
        title="Eliminar feriado" 
        description={`¿Confirma eliminar el feriado "${toDelete?.company_holidays_name}"? Esto afectará los cálculos de nómina en su fecha correspondiente.`} 
        onCancel={() => setConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
      />

      <ConfirmDialog 
        open={generateConfirmOpen} 
        title="Generar Feriados" 
        description={`Ya existen ${data?.length || 0} feriados registrados para ${selectedYear}. ¿Desea autogenerar los feriados de ley faltantes?`} 
        onCancel={() => setGenerateConfirmOpen(false)} 
        onConfirm={executeGenerateDefaults} 
      />
    </div>
  );
}
