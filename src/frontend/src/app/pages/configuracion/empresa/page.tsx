"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  BriefcaseIcon,
  ArrowLeftIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ShieldExclamationIcon
  } from "@heroicons/react/24/outline";
  import Link from "next/link";

  import {
  EnterpriseService,
  MinuteRoundingPolicy,
  ShiftType,
  } from "@/services/enterpriseService";
  import { CalendarDaysIcon } from "@heroicons/react/24/outline";
  import LegalRoundingModal from "@/components/LegalRoundingModal";
  import LegalArt148Modal from "@/components/LegalArt148Modal";
  import { useLegalParamConfig } from "@/hooks/useLegalParamConfig";
const enterpriseSchema = z.object({
  enterprise_minute_rounding_policy: z.nativeEnum(MinuteRoundingPolicy),
  enterprise_is_commercial_activity: z.boolean(),
  enterprise_ordinary_shift_type: z.nativeEnum(ShiftType),
  enterprise_rounding_policy_acknowledged: z.boolean(),
  enterprise_pay_unworked_holidays: z.boolean(),
  enterprise_aguinaldo_period_start_month: z.number().int().min(1).max(12),
  enterprise_aguinaldo_period_start_day: z.number().int().min(1).max(31),
  enterprise_aguinaldo_payment_deadline_day: z.number().int().min(1).max(31),
});

type EnterpriseFormValues = z.infer<typeof enterpriseSchema>;

export default function EnterpriseConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showArt148Modal, setShowArt148Modal] = useState(false);
  const [initialPolicy, setInitialPolicy] = useState<MinuteRoundingPolicy>(MinuteRoundingPolicy.EXACT);

  const {
    form: legalForm,
    saveConfig: saveLegalConfig,
    isSubmitting: isLegalSaving
  } = useLegalParamConfig();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<EnterpriseFormValues>({
    resolver: zodResolver(enterpriseSchema),
    defaultValues: {
      enterprise_minute_rounding_policy: MinuteRoundingPolicy.EXACT,
      enterprise_is_commercial_activity: true,
      enterprise_ordinary_shift_type: ShiftType.DIURNA,
      enterprise_rounding_policy_acknowledged: false,
      enterprise_pay_unworked_holidays: true,
      enterprise_aguinaldo_period_start_month: 12,
      enterprise_aguinaldo_period_start_day: 1,
      enterprise_aguinaldo_payment_deadline_day: 20,
    },
  });

  const currentPolicy = watch("enterprise_minute_rounding_policy");

  const getRoundingDescription = () => {
    switch (currentPolicy) {
      case MinuteRoundingPolicy.EXACT:
        return "Se pagan los minutos exactamente como se laboran. Opción estándar y más precisa.";
      case MinuteRoundingPolicy.ALWAYS_UP:
        return "Cualquier fracción de tiempo se redondea al cuarto de hora superior (ej: 1 min → 15 min).";
      case MinuteRoundingPolicy.NEAREST_QUARTER:
        return "Redondeo al cuarto de hora más cercano (regla de los 8 minutos). Requiere descargo legal.";
      default:
        return "";
    }
  };

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const config = await EnterpriseService.getConfig();
      reset({
        enterprise_minute_rounding_policy: config.enterprise_minute_rounding_policy,
        enterprise_is_commercial_activity: config.enterprise_is_commercial_activity,
        enterprise_ordinary_shift_type: config.enterprise_ordinary_shift_type,
        enterprise_rounding_policy_acknowledged: config.enterprise_rounding_policy_acknowledged,
        enterprise_pay_unworked_holidays: config.enterprise_pay_unworked_holidays ?? true,
        enterprise_aguinaldo_period_start_month: config.enterprise_aguinaldo_period_start_month ?? 12,
        enterprise_aguinaldo_period_start_day: config.enterprise_aguinaldo_period_start_day ?? 1,
        enterprise_aguinaldo_payment_deadline_day: config.enterprise_aguinaldo_payment_deadline_day ?? 20,
      });
      setInitialPolicy(config.enterprise_minute_rounding_policy);
    } catch (error) {
      console.error("Error loading enterprise config:", error);
      toast.error("Error al cargar la configuración de la empresa");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const onSave = async (data: EnterpriseFormValues) => {
    // If selecting NEAREST_QUARTER and it wasn't already the policy AND it's not acknowledged in the payload
    if (
      data.enterprise_minute_rounding_policy === MinuteRoundingPolicy.NEAREST_QUARTER &&
      !data.enterprise_rounding_policy_acknowledged
    ) {
      setShowLegalModal(true);
      return;
    }

    try {
      setIsSaving(true);
      await EnterpriseService.updateConfig(data);
      toast.success("Configuración actualizada correctamente");
      setInitialPolicy(data.enterprise_minute_rounding_policy);
      // Reload to ensure state is in sync with backend logic (e.g. reset acknowledged if policy changed)
      loadConfig();
    } catch (error) {
      console.error("Error updating enterprise config:", error);
      toast.error("Error al actualizar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLegal = () => {
    setShowLegalModal(false);
    setValue("enterprise_rounding_policy_acknowledged", true);
    // Submit the form with the new values
    handleSubmit(onSave)();
  };

  const handleCancelLegal = () => {
    setShowLegalModal(false);
    // Revert the select value to previous
    setValue("enterprise_minute_rounding_policy", initialPolicy);
  };

  const handlePayUnworkedHolidaysChange = (checked: boolean) => {
    if (!checked) {
      // Turning OFF is the risky action — update checkbox immediately then show disclaimer
      setValue("enterprise_pay_unworked_holidays", false, { shouldDirty: true });
      setShowArt148Modal(true);
    } else {
      // Turning ON is the safe default — save directly
      setValue("enterprise_pay_unworked_holidays", true, { shouldDirty: true });
    }
  };

  const handleConfirmArt148 = () => {
    setShowArt148Modal(false);
    // Value already set to false when modal opened — nothing to change
  };

  const handleCancelArt148 = () => {
    setShowArt148Modal(false);
    // Revert: keep it ON since user cancelled
    setValue("enterprise_pay_unworked_holidays", true, { shouldDirty: true });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ArrowPathIcon className="w-10 h-10 text-zinc-400 animate-spin mb-4" />
        <p className="text-zinc-500">Cargando configuración laboral...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen">
      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <Link
          href="/pages/configuracion"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6 group"
        >
          <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Volver a Configuración</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Configuración de Empresa</h1>
            <p className="text-zinc-400 mt-2">
              Gestione las reglas de cálculo, políticas de cumplimiento y períodos fiscales.
            </p>
          </div>
          
          <button
            onClick={handleSubmit(onSave)}
            disabled={isSaving || !isDirty}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg ${
              isSaving || !isDirty
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 shadow-none"
                : "bg-green-600 hover:bg-green-500 text-white shadow-green-600/20 active:scale-95"
            }`}
          >
            {isSaving ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <CheckIcon className="w-5 h-5" />
            )}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {/* SECTION: Cálculo y Redondeo */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-2">
            <h2 className="text-xl font-semibold text-zinc-200">Cálculo y Redondeo</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rounding Policy - Main Setting */}
            <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowPathIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">
                    Política de Redondeo de Minutos
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    Define el tratamiento de fracciones de hora según el Código de Trabajo.
                  </p>
                  
                  <div className="space-y-4">
                    <select
                      {...register("enterprise_minute_rounding_policy")}
                      onChange={(e) => {
                        register("enterprise_minute_rounding_policy").onChange(e);
                        if (e.target.value !== MinuteRoundingPolicy.NEAREST_QUARTER) {
                          setValue("enterprise_rounding_policy_acknowledged", false);
                        }
                      }}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-green-500/50 transition-all outline-none text-zinc-100"
                    >
                      <option value={MinuteRoundingPolicy.EXACT}>Modalidad A: Proporcional Exacto</option>
                      <option value={MinuteRoundingPolicy.ALWAYS_UP}>Modalidad B: Cuarto de hora superior siempre</option>
                      <option value={MinuteRoundingPolicy.NEAREST_QUARTER}>Modalidad C: Cuarto más cercano (Bi-direccional)</option>
                    </select>

                    <p className="text-xs text-zinc-500 italic">
                      {getRoundingDescription()}
                    </p>
                    
                    {currentPolicy === MinuteRoundingPolicy.NEAREST_QUARTER && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-500 mb-1">Requiere Descargo Legal</p>
                          <p className="text-xs text-yellow-500/80">
                            Esta modalidad puede descartar minutos trabajados si la fracción es inferior a 8 minutos.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ordinary Shift */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BriefcaseIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-100 mb-1">Jornada Ordinaria</h3>
                  <p className="text-xs text-zinc-400 mb-4">Base para el cálculo de horas extras.</p>
                  
                  <select
                    {...register("enterprise_ordinary_shift_type")}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-green-500/50 transition-all outline-none text-zinc-100"
                  >
                    <option value={ShiftType.DIURNA}>DIURNA (8h diarias)</option>
                    <option value={ShiftType.MIXTA}>MIXTA (7h diarias)</option>
                    <option value={ShiftType.NOCTURNA}>NOCTURNA (6h diarias)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Cumplimiento y Políticas */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-2">
            <h2 className="text-xl font-semibold text-zinc-200">Cumplimiento y Políticas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Commercial Activity */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-100">Actividad Comercial</h3>
                    <input
                      type="checkbox"
                      {...register("enterprise_is_commercial_activity")}
                      className="w-5 h-5 accent-green-600 border-zinc-700 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Si está activo, los días de descanso se pagan obligatoriamente (Pago Semanal/Mensual).
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Salario Mínimo */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CurrencyDollarIcon className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-100">Salario Mínimo</h3>
                    <input
                      type="checkbox"
                      {...legalForm.register("minWageCheckEnabled")}
                      onChange={(e) => {
                        legalForm.register("minWageCheckEnabled").onChange(e);
                        saveLegalConfig();
                      }}
                      disabled={isLegalSaving}
                      className="w-5 h-5 accent-amber-600 border-zinc-700 rounded cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Habilitar advertencias si un empleado tiene un salario inferior al mínimo global.
                  </p>
                  {!legalForm.watch("minWageCheckEnabled") && (
                    <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                      Riesgo legal detectado
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feriados no trabajados */}
            <div className="md:col-span-2 lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldExclamationIcon className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-100">Feriados No Trabajados</h3>
                    <input
                      type="checkbox"
                      checked={watch("enterprise_pay_unworked_holidays")}
                      onChange={(e) => handlePayUnworkedHolidaysChange(e.target.checked)}
                      className="w-5 h-5 accent-red-600 border-zinc-700 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Inclusión automática de feriados obligatorios no laborados en el cálculo.
                  </p>
                  {!watch("enterprise_pay_unworked_holidays") && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-400/80 leading-tight">
                        Descargo aceptado: Los feriados no trabajados se omiten del cálculo automático.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Gestión de Aguinaldo */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-2">
            <h2 className="text-xl font-semibold text-zinc-200">Gestión de Aguinaldo</h2>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-100 mb-1">Período Fiscal y Gracia</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Configuración de las fechas de acumulación y visualización del historial.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Mes de inicio
                    </label>
                    <select
                      {...register("enterprise_aguinaldo_period_start_month", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 transition-all outline-none text-zinc-100 text-sm"
                    >
                      {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Día de inicio
                    </label>
                    <select
                      {...register("enterprise_aguinaldo_period_start_day", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 transition-all outline-none text-zinc-100 text-sm"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Día límite (Gracia)
                    </label>
                    <select
                      {...register("enterprise_aguinaldo_payment_deadline_day", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 transition-all outline-none text-zinc-100 text-sm"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Hasta este día se muestra el acumulado del año anterior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-500 text-center font-medium tracking-[0.2em] uppercase">
           VP-Planilla Enterprise Configuration Module v1.0
        </p>
      </div>

      <LegalRoundingModal
        isOpen={showLegalModal}
        onConfirm={handleConfirmLegal}
        onCancel={handleCancelLegal}
      />

      <LegalArt148Modal
        isOpen={showArt148Modal}
        onConfirm={handleConfirmArt148}
        onCancel={handleCancelArt148}
      />
    </div>
  );
}
