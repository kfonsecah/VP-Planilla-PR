'use client';

import React from 'react';

export type ProfileTab = 'resumen' | 'planillas' | 'eventos' | 'documentos' | 'aguinaldo';

interface EmployeeProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: { key: ProfileTab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'planillas', label: 'Planillas' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'aguinaldo', label: 'Aguinaldo' },
];

/**
 * Tabs de navegación interna dentro del perfil de empleado
 * Reutiliza la estética del EmployeeTabs existente
 */
const EmployeeProfileTabs: React.FC<EmployeeProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-6">
      <nav className="flex gap-1 bg-[#E7DCC1] dark:bg-zinc-800 rounded-lg p-1 w-fit" aria-label="Profile Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-white dark:bg-zinc-700 text-[#4A5D3A] dark:text-zinc-100 shadow-sm'
                  : 'text-[#6B7556] dark:text-zinc-400 hover:text-[#4A5D3A] dark:hover:text-zinc-200'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default EmployeeProfileTabs;
