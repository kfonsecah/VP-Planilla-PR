"use client";

import React from 'react';
import { useForm, SubmitHandler, UseFormReturn } from 'react-hook-form';

interface FormModalProps<T> {
  title?: string;
  open: boolean;
  initialValues?: Partial<T>;
  onClose: () => void;
  onSubmit: (values: Partial<T>) => Promise<void> | void;
  children: React.ReactNode | ((methods: UseFormReturn<any>) => React.ReactNode);
  resolver?: any; // optional resolver (e.g., zodResolver)
}

export default function FormModal<T>({ title, open, initialValues, onClose, onSubmit, children, resolver }: FormModalProps<T>) {
  const methods = useForm<any>({ defaultValues: initialValues || {}, resolver });
  const { handleSubmit, reset } = methods;

  React.useEffect(() => {
    reset(initialValues || {});
  }, [initialValues, reset]);

  if (!open) return null;

  const submit: SubmitHandler<any> = async (data) => {
    await onSubmit(data);
    onClose();
  };

  const renderChildren = () => {
    if (typeof children === 'function') {
      // @ts-ignore
      return (children as (m: UseFormReturn<any>) => React.ReactNode)(methods);
    }
    return children;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-2xl bg-white rounded shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title || 'Formulario'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>

        <form onSubmit={handleSubmit(submit)}>
          <div className="space-y-4">
            {renderChildren()}
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="mr-3 px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
