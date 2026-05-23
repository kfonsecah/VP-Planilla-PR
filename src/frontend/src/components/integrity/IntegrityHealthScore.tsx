import React from 'react';

interface IntegrityHealthScoreProps {
  score: number;
}

/**
 * Visualizes the data integrity health score using a circular progress bar.
 */
export const IntegrityHealthScore: React.FC<IntegrityHealthScoreProps> = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'text-emerald-500';
  if (score < 50) colorClass = 'text-rose-500';
  else if (score < 85) colorClass = 'text-amber-500';

  return (
    <div data-testid="integrity-health-score" className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">Salud de Integridad</h3>
      
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-52 h-52 transform -rotate-90">
          <circle
            cx="104"
            cy="104"
            r={radius}
            stroke="currentColor"
            strokeWidth="14"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="104"
            cy="104"
            r={radius}
            stroke="currentColor"
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            strokeLinecap="round"
            className={colorClass}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-6xl font-black ${colorClass}`}>{score}</span>
          <span className="text-slate-400 text-sm font-bold mt-1">SOBRE 100</span>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4 w-full text-center">
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Estado</span>
          <span className={`text-xs font-bold ${colorClass}`}>
            {score >= 85 ? 'Excelente' : score >= 50 ? 'Aceptable' : 'Crítico'}
          </span>
        </div>
        <div className="flex flex-col border-x border-slate-100">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Meta</span>
          <span className="text-xs font-bold text-slate-700">95+</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] font-bold uppercase">Trend</span>
          <span className="text-xs font-bold text-slate-700">Stable</span>
        </div>
      </div>
    </div>
  );
};
