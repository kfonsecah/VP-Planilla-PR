"use client";

import { useState } from 'react';
import Modal, { ModalType } from '@/components/ui/Modal';

interface ModalConfig {
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    type: 'info',
    title: '',
    message: ''
  });

  const openModal = (config: ModalConfig) => {
    setModalConfig(config);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // Funciones de conveniencia para diferentes tipos de modales
  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    openModal({
      type: 'success',
      title,
      message,
      onConfirm,
      confirmText: '¡Perfecto!'
    });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    openModal({
      type: 'error',
      title,
      message,
      onConfirm,
      confirmText: 'Entendido'
    });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    openModal({
      type: 'warning',
      title,
      message,
      onConfirm,
      confirmText: 'Continuar'
    });
  };

  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    openModal({
      type: 'info',
      title,
      message,
      onConfirm,
      confirmText: 'Entendido'
    });
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    openModal({
      type: 'warning',
      title,
      message,
      onConfirm,
      onCancel,
      showCancel: true,
      confirmText: 'Sí, continuar',
      cancelText: 'No, cancelar'
    });
  };

  const ModalComponent = () => (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      type={modalConfig.type}
      title={modalConfig.title}
      message={modalConfig.message}
      confirmText={modalConfig.confirmText}
      cancelText={modalConfig.cancelText}
      onConfirm={modalConfig.onConfirm}
      onCancel={modalConfig.onCancel}
      showCancel={modalConfig.showCancel}
    />
  );

  return {
    openModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    ModalComponent,
    isOpen
  };
};