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
          className="bg-[#F2E8CF] dark:bg-gray-800 rounded-xl p-5 border border-[#D2B48C] dark:border-gray-700 shadow-sm border-l-4 border-l-[#6F7153]"
        >
          <h3 className="text-xs font-bold text-[#8B7355] dark:text-gray-400 uppercase tracking-widest mb-3">
            {stat.title}
          </h3>
          <p className="text-4xl font-extrabold text-[#3B4D36] dark:text-white leading-none">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;