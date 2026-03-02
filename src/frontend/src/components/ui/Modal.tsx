/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import React from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export type ModalType = "success" | "error" | "warning" | "info";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showCancel = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onCancel ? onCancel() : onClose();
  };

  // Configuración de iconos y colores según el tipo
  const getModalConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircleIcon className="w-12 h-12 text-[#6F7153]" />,
          iconBg: "bg-[#E7DCC1]",
        };
      case "error":
        return {
          icon: <XCircleIcon className="w-12 h-12 text-red-600" />,
          iconBg: "bg-red-100",
        };
      case "warning":
        return {
          icon: <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />,
          iconBg: "bg-red-100",
        };
      case "info":
      default:
        return {
          icon: <InformationCircleIcon className="w-12 h-12 text-blue-600" />,
          iconBg: "bg-blue-100",
        };
    }
  };

  const config = getModalConfig();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop con color del sistema y blur */}
      <div className="absolute inset-0 bg-[#3B4D36]/20 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="relative bg-[#F5F1E8] rounded-2xl border-2 border-[#D2B48C] shadow-2xl max-w-lg w-full p-8">
        {/* Header con botón de cerrar */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-[#6B5B3D] hover:text-[#3B4D36] transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Icono centrado */}
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${config.iconBg}`}>
            {config.icon}
          </div>
        </div>

        {/* Título centrado */}
        <h2 className="text-2xl font-semibold text-[#3B4D36] text-center mb-4">
          {title}
        </h2>

        {/* Message */}
        <div className="mb-8">
          <p className="text-lg text-[#5D4E37] leading-relaxed text-center">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-[#E7DCC1] hover:bg-[#D4BC96] text-[#3B4D36] rounded-lg transition-colors duration-200 font-medium border border-[#D2B48C]"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-8 py-3 bg-[#6F7153] hover:bg-[#5D614A] text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
