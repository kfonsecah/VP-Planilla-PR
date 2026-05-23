"use client";

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const passwordConfirmSchema = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
});

type PasswordConfirmInput = z.infer<typeof passwordConfirmSchema>;

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

interface PasswordConfirmModalProps {
  isOpen: boolean;
  paramName: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  paramName,
  onConfirm,
  onCancel,
  isLoading = false,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm<PasswordConfirmInput>({
    resolver: zodResolver(passwordConfirmSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      const timerId = setTimeout(() => setFocus('password'), 50);
      return () => clearTimeout(timerId);
    }
  }, [isOpen, reset, setFocus]);

  const onSubmit = (data: PasswordConfirmInput) => {
    onConfirm(data.password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-[#FCF1D5] rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <h2 className="text-lg font-bold text-[#4A5D3A] mb-2">
              Esta acción modifica un parámetro legal crítico
            </h2>

            {/* Body */}
            <p className="text-sm text-zinc-700 mb-1">
              Está a punto de cambiar: <strong>{paramName}</strong>
            </p>
            <p className="text-sm text-zinc-600 mb-4">
              Ingrese su contraseña para confirmar que esta acción es intencional.
            </p>

            {/* Error message — modal stays open when error is present */}
            {error && (
              <p className="text-sm text-[#EF4444] mb-3" role="alert">
                {error}
              </p>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="relative mb-4">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  disabled={isLoading}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-zinc-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D3A] disabled:opacity-50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#EF4444] mb-3">{errors.password.message}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-[#4A5D3A] text-white hover:bg-[#3a4a2c] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    'Confirmar cambio'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordConfirmModal;
