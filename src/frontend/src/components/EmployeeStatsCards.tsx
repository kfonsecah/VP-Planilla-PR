import React from 'react';
import { EmployeeStats } from '@/types';
import StatsCards from '@/components/ui/StatsCards';

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
}

/**
 * Componente que muestra las estadísticas de empleados usando StatsCards reutilizable
 */
const EmployeeStatsCards: React.FC<EmployeeStatsCardsProps> = ({ stats }) => {
  const statsData = [
    {
      title: 'Empleados totales',
      value: stats.total,
    },
    {
      title: 'En vacaciones',
      value: stats.onVacation,
    },
    {
      title: 'Asistencia incompleta',
      value: stats.incompleteAssistance,
    },
    {
      title: 'Incapacidad/maternidad',
      value: stats.incapacityMaternity,
    }
  ];

  return <StatsCards stats={statsData} />;
};

export default EmployeeStatsCards;
