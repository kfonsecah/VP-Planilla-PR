'use client';

import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

const EmployeeTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const tabs = [
    { name: 'Lista de Empleados', href: '/pages/employee/list' },
    { name: 'Eventos Laborales', href: '/pages/employee/events' }
  ];

  return (
    <div className="mb-6">
      <nav className="flex gap-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-[#6F7153] text-white' 
                  : 'text-[#3B4D36] dark:text-gray-300 hover:bg-[#A7AA94]/50 dark:hover:bg-gray-700'
                }
              `}
            >
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default EmployeeTabs;