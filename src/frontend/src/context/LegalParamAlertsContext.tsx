"use client";

import React, { createContext, useContext } from 'react';
import { useLegalParamAlerts } from '@/hooks/useLegalParamAlerts';
import { Notification } from '@/types/notification';

interface LegalParamAlertsContextValue {
  alerts: Notification[];
  isLoading: boolean;
  error: string | null;
  isAcknowledging: number | null;
  acknowledge: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

const LegalParamAlertsContext = createContext<LegalParamAlertsContextValue | null>(null);

export const LegalParamAlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useLegalParamAlerts();
  return (
    <LegalParamAlertsContext.Provider value={value}>
      {children}
    </LegalParamAlertsContext.Provider>
  );
};

export const useLegalParamAlertsContext = (): LegalParamAlertsContextValue => {
  const ctx = useContext(LegalParamAlertsContext);
  if (!ctx) throw new Error('useLegalParamAlertsContext must be used inside LegalParamAlertsProvider');
  return ctx;
};
