"use client";

import PayrollWizard from '@/components/PayrollWizard';

export default function PayrollWizardPage() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-6">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Gestión de Planillas
          </p>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 leading-none">
            Wizard de Planilla
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Calcula y aprueba planillas paso a paso
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <PayrollWizard />
        </div>
      </div>
    </div>
  );
}
