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
    <aside className="w-387px bg-[#FCF1D5] text-white flex flex-col p-4 shadow-lg">
      <div className="mb-8 flex items-center justify-center py-4">
        <Image src="/images/Logo.png" alt="Verde Gestión Logo" width={78} height={78} className="rounded-full mr-2" />
        <span className="text-2xl font-bold text-[#53614A]">VERDE GESTIÓN</span>
      </div>

      <nav className="flex-1 space-y-2">
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

       <div className="mt-auto pt-4"> {/* Removed border-t here */}
        {bottomMenuItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <SidebarItem
              href={item.href}
              icon={item.icon}
              text={item.text}
            />
            {/* Render the border after the first item if there are more items */}
            {index === 0 && bottomMenuItems.length > 1 && (
              <div className="border-t border-[#D6CEBA] my-2"></div> // Border line with vertical margin
            )}
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}
