'use client';

import Image from 'next/image';
import SidebarItem from '@/components/SidebarItem';
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
    { href: "/pages/attendance", icon: "/images/layout/attendance.png", text: "Registro de asistencia" },
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
    <aside className="w-56 lg:w-60 bg-[#FCF1D5] dark:bg-zinc-900 text-white flex flex-col shadow-sm border-r border-[#E0D6B7] dark:border-zinc-800 h-screen overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={35} height={35} className="mr-2 rounded-full" loading="eager" />
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 text-[#4A5D3A] dark:text-zinc-400"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden md:flex items-center justify-start px-6 py-4">
        <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={40} height={40} className="mr-3 rounded-full" priority />
        <span className="text-xl text-[#4A5D3A] dark:text-zinc-100 font-titulo titulo-verde-gestion" style={{ fontFamily: 'VerdeFont, Inter, sans-serif' }}>VERDE GESTIÓN</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
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

      <div className="p-3 mt-auto">
        {bottomMenuItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <SidebarItem
              href={item.href}
              icon={item.icon}
              text={item.text}
            />
            {index === 0 && bottomMenuItems.length > 1 && (
              <div className="border-t border-[#E0D6B7] dark:border-zinc-800 my-2"></div>
            )}
          </React.Fragment>
        ))}
        <div className="border-t border-[#E0D6B7] dark:border-zinc-800 my-2"></div>
        <button
          onClick={onLogoutClick}
          disabled={isLoggingOut}
          className="flex items-center w-full p-2 rounded-lg transition-colors duration-200 text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#E7DCC1] dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          <div className="mr-3 text-lg">
            <Image src="/images/layout/logOut.png" alt="Cerrar sesión" width={20} height={20} loading="lazy" />
          </div>
          <span className="flex-1 text-sm font-medium text-left">{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </aside>
  );
}
