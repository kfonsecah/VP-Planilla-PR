import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LegalParam } from '../types/legalParam';
import { LegalParamService } from '../services/legalParamService';
import PasswordConfirmModal from './PasswordConfirmModal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const editSchema = z.object({
  value: z.string().min(1, 'El valor es requerido'),
  validFrom: z.string().min(1, 'La fecha de vigencia es requerida'),
  source_decree: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface LegalParamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  param: LegalParam | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

export const LegalParamDrawer: React.FC<LegalParamDrawerProps> = ({
  isOpen,
  onClose,
  param,
  onSuccess,
  readOnly = false,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingData, setPendingData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (isOpen && param) {
      reset({
        value: param.value.toString(),
        validFrom: new Date(param.validFrom).toISOString().split('T')[0],
        source_decree: param.source_decree || '',
      });
      setIsConfirming(false);
      setPendingData(null);
      setPasswordError(undefined);
    }
  }, [isOpen, param, reset]);

  const handleClose = () => {
    setIsConfirming(false);
    setPendingData(null);
    setPasswordError(undefined);
    onClose();
  };

  const onFormSubmit = (data: EditFormData) => {
    if (readOnly || !param) return;
    if (param.isCritical) {
      setPendingData(data);
      setIsConfirming(true);
    } else {
      executeSave(data);
    }
  };

  const executeSave = async (data: EditFormData, confirmationPassword?: string) => {
    if (!param) return;
    setIsSubmitting(true);
    setPasswordError(undefined);
    try {
      await LegalParamService.patchParam(param.key, {
        value: Number(data.value), // TODO: Handle string booleans appropriately if any
        validFrom: new Date(data.validFrom).toISOString(),
        source_decree: data.source_decree || undefined,
        confirmationPassword,
      });

      // Si la API no retorna success = false en error o lanza excepcion
      // Asumimos que patchParam tira error si el password está mal (403)
      toast.success('Parámetro actualizado exitosamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Error al actualizar el parámetro';
      if (msg.toLowerCase().includes('contraseña')) {
        setPasswordError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !param) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-100">
            Editar Parámetro
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-zinc-400 text-sm font-medium">Clave</h3>
            <p className="text-zinc-100 text-lg font-semibold">{param.key}</p>
            <p className="text-zinc-500 text-sm mt-1">{param.description}</p>
          </div>

          <form id="drawer-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Nuevo Valor
              </label>
              <input
                type="number"
                step="any"
                disabled={readOnly}
                {...register('value')}
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent disabled:opacity-50"
              />
              {errors.value && (
                <p className="text-red-400 text-xs mt-1">{errors.value.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Vigente Desde
              </label>
              <input
                type="date"
                disabled={readOnly}
                {...register('validFrom')}
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent disabled:opacity-50 [color-scheme:dark]"
              />
              {errors.validFrom && (
                <p className="text-red-400 text-xs mt-1">{errors.validFrom.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Decreto / Fuente (Opcional)
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register('source_decree')}
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Decreto Ejecutivo N°..."
              />
            </div>
          </form>
        </div>

        {!readOnly && (
          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="drawer-form"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-[#FCF1D5] text-[#4A5D3A] font-semibold hover:bg-[#e5d5b1] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>

      <PasswordConfirmModal
        isOpen={isConfirming}
        paramName={param.key}
        onConfirm={(pwd) => {
          if (pendingData) executeSave(pendingData, pwd);
        }}
        onCancel={() => {
          setIsConfirming(false);
          setPasswordError(undefined);
        }}
        isLoading={isSubmitting}
        error={passwordError}
      />
    </>
  );
};
