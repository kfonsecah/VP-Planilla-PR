import React from 'react';
import { EmployeeStats } from '@/types';
import { 
  UserGroupIcon, 
  SunIcon, 
  ExclamationTriangleIcon, 
  HeartIcon 
} from '@heroicons/react/24/outline';

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
}

/**
 * Componente que muestra las estadísticas de empleados en tarjetas
 */
const EmployeeStatsCards: React.FC<EmployeeStatsCardsProps> = ({ stats }) => {
  const statsConfig = [
    {
      title: 'Empleados totales',
      value: stats.total,
      icon: UserGroupIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'En vacaciones',
      value: stats.onVacation,
      icon: SunIcon,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Asistencia incompleta',
      value: stats.incompleteAssistance,
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: 'Incapacidad/maternidad',
      value: stats.incapacityMaternity,
      icon: HeartIcon,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => {
        return (
          <div 
            key={stat.title}
            className={`p-6 rounded-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#3B4D36]">
                  {stat.title}
                </h3>
                <p className="text-3xl font-extrabold text-[#3B4D36]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeStatsCards;
