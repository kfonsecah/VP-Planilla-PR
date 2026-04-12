"use client";

import React, { useState } from 'react';
import { AuthService } from '../services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'request' | 'confirm' | 'success';

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await AuthService.requestPasswordChange(email);
      if (result.success) {
        setStep('confirm');
        setSuccessMessage('Código enviado a tu correo electrónico');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const result = await AuthService.confirmPasswordChange(code, newPassword, confirmPassword);
      if (result.success) {
        setStep('success');
        setSuccessMessage('Contraseña cambiada exitosamente');
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-zinc-800 dark:to-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white dark:text-zinc-100">
            Cambiar Contraseña
          </h3>
          <button 
            onClick={handleClose}
            className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'request' && (
            <form onSubmit={handleRequestCode}>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Ingresa tu correo electrónico y te enviaremos un código de verificación.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirmChange}>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Ingresa el código de verificación y tu nueva contraseña.
              </p>
              <div className="mb-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Volver a solicitar código
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {successMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
