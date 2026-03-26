'use client';

import Image from 'next/image';
import React from 'react';

export interface EmployeeIncidenceCardProps {
  faltaTiempo: number;
  llegadaTardia: number;
  sobraTiempo: number;
  sinMarcas: number;
}

// Client Component
const EmployeeIncidenceCard: React.FC<EmployeeIncidenceCardProps> = ({ faltaTiempo, llegadaTardia, sobraTiempo, sinMarcas }) => {
  return (
    <div className="bg-[#FCF1D5] dark:bg-[#2d2d2d] p-4 rounded-lg min-w-[220px]">
      <div className="mb-2 text-sm font-semibold text-black dark:text-[#E5E5E5]">Días con incidencia</div>
      <ul className="text-xs text-[#5D4E37] dark:text-[#A3A3A3]">
        <li className="flex justify-between mb-1"><span><Image src="/images/layout/timeLeft.png" alt="Falta tiempo" width={26} height={25} /></span><span className="">Falta tiempo</span> <span>{faltaTiempo}</span></li>
        <li className="flex justify-between mb-1"><span><Image src="/images/layout/lateArrival.png" alt="Llegada tardía" width={26} height={25} /></span><span className="">Llegada tardía</span> <span>{llegadaTardia}</span></li>
        <li className="flex justify-between mb-1"><span><Image src="/images/layout/overtime.png" alt="Sobra tiempo" width={26} height={25} /></span><span className="">Sobra tiempo</span> <span>{sobraTiempo}</span></li>
        <li className="flex justify-between"><span><Image src="/images/layout/noMarks.png" alt="Sin marcas" width={26} height={25} /></span><span className="">Sin marcas</span> <span>{sinMarcas}</span></li>
      </ul>
    </div>
  );
};

export default EmployeeIncidenceCard;
