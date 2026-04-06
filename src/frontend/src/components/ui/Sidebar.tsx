'use client';

import Image from 'next/image';
import SidebarItem from '@/components/SidebarItem';
import React from 'react';
import { XMarkIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  onClose?: () => void;
  onLogoutClick?: () => void;
  isLoggingOut?: boolean;
}

export default function Sidebar({ onClose, onLogoutClick, isLoggingOut = false }: SidebarProps) {
  const mainMenuItems = [
    { href: "/pages/main", icon: "/images/layout/dashboard.png", text: "Dashboard" },
    {
      href: "/pages/employee/list",
      icon: "/images/layout/employees.png",
      text: "Empleados"
    },
    {
      href: "/pages/attendance",
      icon: "/images/layout/attendance.png",
      text: "Registro de asistencia",
      subItems: [
        { href: '/pages/attendance', text: 'Validar marcas' },
        { href: '/pages/clock-logs', text: 'Dashboard y corrección' },
      ]
    },
    {
      href: "/pages/payroll",
      icon: "/images/layout/payroll.png",
      text: "Cálculo de planillas",
      subItems: [
        { href: '/pages/payroll/calculate', text: 'Calcular planilla' },
        { href: '/pages/payroll/list', text: 'Historial de planillas' },
        { href: '/pages/payroll-types/list', text: 'Tipos de planilla' }
      ]
    },
    {
      href: "/pages/deductions",
      icon: "/images/layout/payroll.png",
      text: "Deducciones",
      subItems: [
        { href: '/pages/deductions/list', text: 'Todas las deducciones' },
        { href: '/pages/employee-deductions/list', text: 'Por empleado' }
      ]
    },
    {
      href: "/pages/vacations",
      icon: "/images/layout/attendance.png",
      text: "Vacaciones",
      subItems: [
        { href: '/pages/vacations/list', text: 'Solicitudes' },
        { href: '/pages/vacations/create', text: 'Nueva solicitud' }
      ]
    },
    {
      href: "/pages/branches/list",
      icon: "/images/layout/settings.png",
      text: "Sucursales"
    },
    { href: "/pages/reports", icon: "/images/layout/oficial_reports.png", text: "Reportes Oficiales" },
    { href: "/pages/users", icon: "/images/layout/users_access.png", text: "Usuarios y Accesos" },
  ];

  const bottomMenuItems = [
    { href: "/configuracion", icon: "/images/layout/settings.png", text: "Configuración" },
  ];

  return (
    <aside className="w-56 lg:w-60 bg-[#FCF1D5] dark:bg-zinc-900 text-[#4A5D3A] dark:text-zinc-100 flex flex-col border-r border-[#E0D6B7] dark:border-zinc-800 h-screen overflow-hidden">

      {/* Mobile header */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden border-b border-[#E0D6B7] dark:border-zinc-800">
        <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={32} height={32} className="rounded-full" loading="eager" />
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-zinc-800 text-[#4A5D3A] dark:text-zinc-400 transition-colors"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Logo desktop */}
      <div className="hidden md:flex items-center gap-3 px-5 py-3.5 border-b border-[#E0D6B7] dark:border-zinc-800">
        <div className="relative flex-shrink-0">
          <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={36} height={36} className="rounded-full ring-2 ring-green-500/30" priority />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#FCF1D5] dark:border-zinc-900" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[#4A5D3A] dark:text-zinc-100 leading-tight" style={{ fontFamily: 'VerdeFont, Inter, sans-serif' }}>
            VERDE GESTIÓN
          </span>
          <span className="text-[10px] text-[#7A8F6A] dark:text-zinc-500 font-medium tracking-wide">
            Planilla v1.1
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest uppercase text-[#7A8F6A] dark:text-zinc-500">
          Menú principal
        </p>
        {mainMenuItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            text={item.text}
            subItems={item.subItems}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 pt-2 border-t border-[#E0D6B7] dark:border-zinc-800 space-y-0.5">
        {bottomMenuItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            text={item.text}
          />
        ))}

        <button
          onClick={onLogoutClick}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-all duration-200 text-[#4A5D3A] dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 group"
        >
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <ArrowRightStartOnRectangleIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
          <span className="flex-1 text-sm font-medium text-left">
            {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </span>
        </button>
      </div>
    </aside>
  );
}
