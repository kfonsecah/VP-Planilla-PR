/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import React from "react";
import Image from "next/image";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
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
          icon: <CheckCircleIcon className="w-12 h-12 text-green-600" />,
          borderColor: "border-green-400",
          buttonColor: "bg-[#3B4D36] hover:bg-green-800",
          titleColor: "text-[#3B4D36]",
          iconBg: "bg-green-50",
        };
      case "error":
        return {
          icon: <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />,
          borderColor: "border-red-400",
          buttonColor: "bg-[#3B4D36] hover:bg-green-800",
          titleColor: "text-[#3B4D36]",
          iconBg: "bg-red-50",
        };
      case "warning":
        return {
          icon: (
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600" />
          ),
          borderColor: "border-yellow-400",
          buttonColor: "bg-[#3B4D36] hover:bg-green-800",
          titleColor: "text-[#3B4D36]",
          iconBg: "bg-yellow-50",
        };
      case "info":
      default:
        return {
          icon: <InformationCircleIcon className="w-12 h-12 text-blue-600" />,
          borderColor: "border-blue-400",
          buttonColor: "bg-[#3B4D36] hover:bg-green-800",
          titleColor: "text-[#3B4D36]",
          iconBg: "bg-blue-50",
        };
    }
  };

  const config = getModalConfig();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop transparente con blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal Container con fondo verde e imagen - Ahora más rectangular */}
      <div className="relative rounded-lg shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Fondo verde con imagen */}
        <div className="absolute bg-[#344838] inset-0">
          <Image
            src="/images/LogInBackground.png"
            alt="Decorative Background Pattern"
            fill
            style={{ objectFit: "cover" }}
            className="mix-blend-multiply opacity-50"
          />
        </div>

        {/* Contenedor beige que se sobrepone */}
        <div
          className={`relative z-10 m-6 bg-[#FCF1D5] rounded-lg border-2 ${config.borderColor} p-8`}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {/* Icono centrado */}
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${config.iconBg}`}>
                  {config.icon}
                </div>
              </div>

              {/* Título centrado */}
              <h2
                className={`text-2xl font-semibold ${config.titleColor} text-center mb-2`}
              >
                {title}
              </h2>
            </div>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition-colors ml-4"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-8">
            <p className="text-lg text-[#3B4D36] leading-relaxed text-center">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-3">
            {showCancel && (
              <button
                onClick={handleCancel}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium border border-gray-300"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-8 py-3 text-[#D4BD80] rounded-md transition-colors duration-200 font-medium ${config.buttonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
