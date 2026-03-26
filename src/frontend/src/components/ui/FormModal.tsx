"use client";

import React from 'react';
import { useForm, SubmitHandler, UseFormReturn, Resolver, FieldValues, DefaultValues } from 'react-hook-form';

interface FormModalProps<T extends FieldValues> {
  title?: string;
  open: boolean;
  initialValues?: Partial<T>;
  onClose: () => void;
  onSubmit: (values: Partial<T>) => Promise<void> | void;
  children: React.ReactNode | ((methods: UseFormReturn<Partial<T>>) => React.ReactNode);
  resolver?: Resolver<Partial<T>>;
}

export default function FormModal<T extends FieldValues>({ title, open, initialValues, onClose, onSubmit, children, resolver }: FormModalProps<T>) {
  const methods = useForm<Partial<T>>({
    defaultValues: (initialValues ?? {}) as DefaultValues<Partial<T>>,
    resolver
  });
  const { handleSubmit, reset } = methods;

  React.useEffect(() => {
    reset((initialValues ?? {}) as DefaultValues<Partial<T>>);
  }, [initialValues, reset]);

  if (!open) return null;

  const submit: SubmitHandler<Partial<T>> = async (data) => {
    await onSubmit(data);
    onClose();
  };

  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(methods);
    }
    return children;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-[#E0D6B7] dark:border-gray-700 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-gray-700 dark:to-gray-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{title || 'Formulario'}</h3>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="p-6">
          <div className="space-y-4">
            {renderChildren()}
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#E0D6B7] dark:border-gray-600">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium shadow-md"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
