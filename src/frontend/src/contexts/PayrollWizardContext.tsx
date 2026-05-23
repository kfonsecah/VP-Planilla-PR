"use client";

import React, { createContext, useContext } from 'react';
import { usePayrollWizard } from '@/hooks/usePayrollWizard';

type WizardContextValue = ReturnType<typeof usePayrollWizard>;

const PayrollWizardContext = createContext<WizardContextValue | null>(null);

export function PayrollWizardProvider({ children }: { children: React.ReactNode }) {
  const wizard = usePayrollWizard();
  return (
    <PayrollWizardContext.Provider value={wizard}>
      {children}
    </PayrollWizardContext.Provider>
  );
}

export function usePayrollWizardContext(): WizardContextValue {
  const ctx = useContext(PayrollWizardContext);
  if (!ctx) throw new Error('usePayrollWizardContext must be used inside PayrollWizardProvider');
  return ctx;
}
