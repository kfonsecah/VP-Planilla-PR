import React from 'react';

interface StatCard {
  title: string;
  value: number | string;
}

interface StatsCardsProps {
  stats: StatCard[];
}

/**
 * Componente reutilizable para mostrar tarjetas de estadísticas
 * Puede ser usado en cualquier parte de la aplicación que necesite mostrar stats
 */
const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div 
          key={`${stat.title}-${index}`}
          className="bg-[#E7DCC1] rounded-lg p-6 border border-[#D2B48C]"
        >
          <div className="text-left">
            <h3 className="text-xs font-medium text-[#8B7355] uppercase tracking-wider mb-2">
              {stat.title}
            </h3>
            <p className="text-4xl font-bold text-[#3B4D36]">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;