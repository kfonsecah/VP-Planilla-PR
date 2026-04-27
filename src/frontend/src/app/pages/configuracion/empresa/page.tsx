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
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { 
  EnterpriseService, 
  MinuteRoundingPolicy, 
  ShiftType 
} from "@/services/enterpriseService";
import LegalRoundingModal from "@/components/LegalRoundingModal";

const enterpriseSchema = z.object({
  enterprise_minute_rounding_policy: z.nativeEnum(MinuteRoundingPolicy),
  enterprise_is_commercial_activity: z.boolean(),
  enterprise_ordinary_shift_type: z.nativeEnum(ShiftType),
  enterprise_rounding_policy_acknowledged: z.boolean(),
});

type EnterpriseFormValues = z.infer<typeof enterpriseSchema>;

export default function EnterpriseConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [initialPolicy, setInitialPolicy] = useState<MinuteRoundingPolicy>(MinuteRoundingPolicy.EXACT);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ArrowPathIcon className="w-10 h-10 text-zinc-400 animate-spin mb-4" />
        <p className="text-zinc-500">Cargando configuración laboral...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/pages/configuracion"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-green-600 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Regresar al centro de configuración
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                Configuración Laboral
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                Gestione las reglas de cálculo y políticas de cumplimiento de la empresa.
              </p>
            </div>
            
            <button
              onClick={handleSubmit(onSave)}
              disabled={isSaving || !isDirty}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md ${
                isSaving || !isDirty
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
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

        <div className="grid gap-6">
          {/* Rounding Policy Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BriefcaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                    Política de Redondeo de Minutos
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    Define cómo se procesan las fracciones de hora en las marcas de reloj según el Código de Trabajo.
                  </p>
                  
                  <div className="sm:max-w-md space-y-4">
                    <select
                      {...register("enterprise_minute_rounding_policy")}
                      onChange={(e) => {
                        register("enterprise_minute_rounding_policy").onChange(e);
                        // Reset acknowledgment if changed to something else
                        if (e.target.value !== MinuteRoundingPolicy.NEAREST_QUARTER) {
                          setValue("enterprise_rounding_policy_acknowledged", false);
                        }
                      }}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-green-500 transition-all outline-none text-zinc-800 dark:text-zinc-100"
                    >
                      <option value={MinuteRoundingPolicy.EXACT}>
                        Modalidad A: Proporcional Exacto
                      </option>
                      <option value={MinuteRoundingPolicy.ALWAYS_UP}>
                        Modalidad B: Cuarto de hora superior siempre
                      </option>
                      <option value={MinuteRoundingPolicy.NEAREST_QUARTER}>
                        Modalidad C: Cuarto más cercano (Bi-direccional)
                      </option>
                    </select>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 italic">
                      {getRoundingDescription()}
                    </p>
                    
                    {currentPolicy === MinuteRoundingPolicy.NEAREST_QUARTER && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl flex gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                            Atención: Modalidad C
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-500">
                            Esta modalidad requiere un descargo legal explícito ya que puede descartar minutos trabajados si la fracción es mínima.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ordinary Shift Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ArrowPathIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                      Jornada Ordinaria
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                      Base para el cálculo de horas extras.
                    </p>
                    
                    <select
                      {...register("enterprise_ordinary_shift_type")}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-green-500 transition-all outline-none text-zinc-800 dark:text-zinc-100"
                    >
                      <option value={ShiftType.DIURNA}>DIURNA (8h diarias)</option>
                      <option value={ShiftType.MIXTA}>MIXTA (7h diarias)</option>
                      <option value={ShiftType.NOCTURNA}>NOCTURNA (6h diarias)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial Activity Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-100">
                        Actividad Comercial
                      </h3>
                      <input
                        type="checkbox"
                        {...register("enterprise_is_commercial_activity")}
                        className="w-5 h-5 text-green-600 border-zinc-300 rounded focus:ring-green-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Si está activo, los días de descanso se pagan obligatoriamente (Pago Semanal).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 text-center">
             VP-Planilla — Enterprise Configuration Module v1.0
          </p>
        </div>
      </div>

      <LegalRoundingModal
        isOpen={showLegalModal}
        onConfirm={handleConfirmLegal}
        onCancel={handleCancelLegal}
      />
    </div>
  );
}
