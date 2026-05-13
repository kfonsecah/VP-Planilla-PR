"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PayrollWizardProvider, usePayrollWizardContext } from '@/contexts/PayrollWizardContext';
import Step1Period from './steps/Step1Period';
import Step2Employees from './steps/Step2Employees';
import Step3Review from './steps/Step3Review';
import Step4Approve from './steps/Step4Approve';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  DocumentCheckIcon, 
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
  { label: 'Período', icon: CalendarIcon },
  { label: 'Empleados', icon: UserGroupIcon },
  { label: 'Revisar', icon: DocumentCheckIcon },
  { label: 'Aprobar', icon: CheckCircleIcon }
] as const;

function PayrollWizardInner() {
  const {
    currentStep,
    calculationData,
    payrollId,
    goToStep,
    handleApprove,
  } = usePayrollWizardContext();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-[#A3A3A3] uppercase tracking-widest mb-1">Cálculo de Planillas</p>
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-[#E5E5E5] leading-none">
              Nueva Planilla
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              Procesa el pago de tus colaboradores de forma rápida y segura.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <DocumentCheckIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-medium">Estado</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Paso {currentStep} de 4</p>
            </div>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-[#404040] mb-5" />

        {/* Premium Animated Step Indicator (Compact) */}
        <div className="relative mb-12 px-4 sm:px-10">
          {/* Background Track */}
          <div className="absolute top-5 left-9 right-9 sm:left-[60px] sm:right-[60px] h-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full z-10 translate-y-[-50%]" />
          
          {/* Animated Progress Fill */}
          <motion.div 
            className="absolute top-5 left-9 right-9 sm:left-[60px] sm:right-[60px] h-0.5 bg-green-500 rounded-full z-10 origin-left translate-y-[-50%]"
            initial={false}
            animate={{ scaleX: (currentStep - 1) / (STEPS.length - 1) }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          <div className="relative z-20 flex justify-between">
            {STEPS.map((step, i) => {
              const stepNum = (i + 1) as 1 | 2 | 3 | 4;
              const isActive = currentStep === stepNum;
              const isDone = currentStep > stepNum;
              const Icon = step.icon;

              return (
                <div key={step.label} className="flex flex-col items-center group">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg relative z-30 border-2 ${
                      isActive 
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ring-4 ring-green-500/10 border-green-500/50' 
                        : isDone 
                          ? 'bg-green-600 border-green-600 text-white' 
                          : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </motion.div>
                  
                  <div className="mt-3 text-center">
                    <p className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${
                      isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: Período ────────────────────────────────────────────── */}
        {currentStep === 1 && <Step1Period />}

        {/* ── STEP 2: Empleados ──────────────────────────────────────────── */}
        {currentStep === 2 && <Step2Employees />}

        {/* ── STEP 3: Revisar / Ajustar ──────────────────────────────────── */}
        {currentStep === 3 && <Step3Review />}

        {/* ── STEP 4: Aprobar ────────────────────────────────────────────── */}
        {currentStep === 4 && payrollId !== null && calculationData !== null && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
            <Step4Approve
              payrollId={payrollId}
              calculationData={calculationData}
              onApprove={handleApprove}
              onBack={() => goToStep(3)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayrollWizardPage() {
  return (
    <PayrollWizardProvider>
      <PayrollWizardInner />
    </PayrollWizardProvider>
  );
}
