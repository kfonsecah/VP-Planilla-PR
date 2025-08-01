import React from 'react';

interface EmployeeStats {
  total: number;
  onVacation: number;
  incompleteAssistance: number;
  incapacityMaternity: number;
}

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
}

const EmployeeStatsCards: React.FC<EmployeeStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
      <div className="p-6 rounded-lg">
        <h3 className="mb-2 text-sm font-medium text-[#3B4D36]">Empleados totales</h3>
        <p className="text-3xl font-extrabold text-[#3B4D36]">{stats.total}</p>
      </div>
      <div className="p-6 rounded-lg">
        <h3 className="mb-2 text-sm font-medium text-[#3B4D36]">Empleados en vacaciones</h3>
        <p className="text-3xl font-extrabold text-[#3B4D36]">{stats.onVacation}</p>
      </div>
      <div className="p-6 rounded-lg">
        <h3 className="mb-2 text-sm font-medium text-[#3B4D36]">Empleados con asistencia incompleta</h3>
        <p className="text-3xl font-extrabold text-[#3B4D36]">{stats.incompleteAssistance}</p>
      </div>
      <div className="p-6 rounded-lg">
        <h3 className="mb-2 text-sm font-medium text-[#3B4D36]">Empleados en incapacidad/maternidad</h3>
        <p className="text-3xl font-extrabold text-[#3B4D36]">{stats.incapacityMaternity}</p>
      </div>
    </div>
  );
};

export default EmployeeStatsCards;
