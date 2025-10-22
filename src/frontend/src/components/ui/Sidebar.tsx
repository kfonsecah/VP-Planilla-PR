'use client';

import Image from 'next/image';
import SidebarItem from '@/components/SidebarItem';
import React from 'react';

export default function Sidebar() {
  // Define your sidebar items with potential submenus
  const mainMenuItems = [
    { href: "/pages/main", icon: "/images/layout/dashboard.png", text: "Dashboard" },
    {
      href: "/pages/employee/list",
      icon: "/images/layout/employees.png",
      text: "Empleados"
    },
    { href: "pages/attendance", icon: "/images/layout/attendance.png", text: "Registro de asistencia" },
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
    { href: "pages/reports", icon: "/images/layout/oficial_reports.png", text: "Reportes Oficiales" },
    { href: "pages/users", icon: "/images/layout/users_access.png", text: "Usuarios y Accesos" },
  ];

  const bottomMenuItems = [
    { href: "/configuracion", icon: "/images/layout/settings.png", text: "Configuración" },
    { href: "/", icon: "/images/layout/logOut.png", text: "Cerrar sesión" },
  ];
  return (
    <aside className="w-60 bg-[#FCF1D5] text-white flex flex-col shadow-sm border-r border-[#E0D6B7]">      <div className="flex items-center justify-start px-6 py-3">
        <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={45} height={45} className="mr-3 rounded-full" />
        <span className="text-2xl text-[#4A5D3A] font-titulo titulo-verde-gestion" style={{ fontFamily: 'VerdeFont, Inter, sans-serif' }}>VERDE GESTIÓN</span>
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
      </nav>       <div className="p-3 mt-auto"> {/* Padding consistente */}
        {bottomMenuItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <SidebarItem
              href={item.href}
              icon={item.icon}
              text={item.text}
            />
            {/* Render the border after the first item if there are more items */}
            {index === 0 && bottomMenuItems.length > 1 && (
              <div className="border-t border-[#E0D6B7] my-2"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}
