'use client';

import Image from 'next/image';
import SidebarItem from '@/components/SidebarItem';
import React from 'react';

export default function Sidebar() {
  // Define your sidebar items with potential submenus
  const mainMenuItems = [
    { href: "/dashboard", icon: "/images/layout/dashboard.png", text: "Dashboard" },
    {
      href: "/empleados",
      icon: "/images/layout/employees.png",
      text: "Empleados",
      subItems: [
        { href: "/empleados/lista", text: "Lista de Empleados" },
        { href: "/empleados/agregar", text: "Agregar Empleado" },
      ],
    },
    { href: "/registro-asistencia", icon: "/images/layout/attendance.png", text: "Registro de asistencia" },
    { href: "/calculo-planillas", icon: "/images/layout/payroll.png", text: "Cálculo de planillas" },
    { href: "/reportes-oficiales", icon: "/images/layout/oficial_reports.png", text: "Reportes Oficiales" },
    { href: "/usuarios-accesos", icon: "/images/layout/users_access.png", text: "Usuarios y Accesos" },
  ];

  const bottomMenuItems = [
    { href: "/configuracion", icon: "/images/layout/settings.png", text: "Configuración" },
    { href: "/", icon: "/images/layout/logOut.png", text: "Cerrar sesión" },
  ];
  return (
    <aside className="w-60 bg-[#FCF1D5] text-white flex flex-col shadow-sm border-r border-[#E0D6B7]">      <div className="px-6 py-3 flex items-center justify-start">
        <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={45} height={45} className="rounded-full mr-3" />
        <span className="text-2xl text-[#4A5D3A] font-titulo titulo-verde-gestion" style={{ fontFamily: 'VerdeFont, Inter, sans-serif' }}>VERDE GESTIÓN</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {mainMenuItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            text={item.text}
            subItems={item.subItems}
          />
        ))}
      </nav>       <div className="mt-auto p-3"> {/* Padding consistente */}
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
