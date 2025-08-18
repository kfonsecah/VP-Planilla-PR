"use client";

import React, { useState } from "react";

export interface AttendanceRecord {
  date: string;
  schedule: string;
  entryTime: string;
  exitTime: string;
  total: string;
  balance: string;
  isWeekend?: boolean;
  isToday?: boolean;
}

export interface EmployeeAttendanceTableProps {
  employeeId: string;
  records: AttendanceRecord[];
}

const EmployeeAttendanceTable: React.FC<EmployeeAttendanceTableProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  employeeId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  records,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6)); // Julio 2025
  
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Obtener fecha actual de Costa Rica
  const getCostaRicaDate = () => {
    return new Date().toLocaleString("en-US", {timeZone: "America/Costa_Rica"});
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const goToToday = () => {
    const costaRicaDate = new Date(getCostaRicaDate());
    setCurrentMonth(new Date(costaRicaDate.getFullYear(), costaRicaDate.getMonth()));
  };

  const isToday = (day: number) => {
    const costaRicaDate = new Date(getCostaRicaDate());
    return day === costaRicaDate.getDate() && 
           currentMonth.getMonth() === costaRicaDate.getMonth() && 
           currentMonth.getFullYear() === costaRicaDate.getFullYear();
  };

  const getMonthDateRange = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month, 15); // Solo primeros 15 días
    
    return {
      start: startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      end: endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  };

  const generateMonthRecords = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthRecords: AttendanceRecord[] = [];
    
    for (let day = 1; day <= 15; day++) {
      const date = new Date(year, month, day);
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (isWeekend) {
        monthRecords.push({
          date: `${day} ${dayName}`,
          schedule: "No se esperan registros",
          entryTime: "",
          exitTime: "",
          total: "",
          balance: "",
          isWeekend: true,
          isToday: isToday(day)
        });
      } else {
        // Datos de ejemplo para días laborables
        const schedules = ["Mañana 8h", "Tarde 8h"];
        const randomSchedule = schedules[Math.floor(Math.random() * schedules.length)];
        const entryTime = randomSchedule === "Mañana 8h" ? "08:00 AM" : "2:30 PM";
        const exitTime = randomSchedule === "Mañana 8h" ? "4:00 PM" : "9:00 PM";
        
        monthRecords.push({
          date: `${day} ${dayName}`,
          schedule: randomSchedule,
          entryTime: entryTime,
          exitTime: exitTime,
          total: "08:00hr",
          balance: "+00:00",
          isToday: isToday(day)
        });
      }
    }
    
    return monthRecords;
  };

  const displayRecords = generateMonthRecords();
  const dateRange = getMonthDateRange();
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={goToPreviousMonth}
            className="px-2 py-2 bg-[#D5CDB3] rounded text-base hover:bg-[#B5AF9A]"
          >
            ←
          </button>
          <button className="px-4 py-2 bg-[#D5CDB3] rounded text-base">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </button>
          <button 
            onClick={goToNextMonth}
            className="px-2 py-2 bg-[#D5CDB3] rounded text-base hover:bg-[#B5AF9A]"
          >
            →
          </button>
        </div>
        <button 
          onClick={goToToday}
          className="px-4 py-2 bg-[#D5CDB3] rounded text-base hover:bg-[#B5AF9A]"
        >
          Hoy
        </button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[#5D4E37] text-lg">
          {dateRange.start} - {dateRange.end}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#B5AF9A] rounded text-[#3B4D36]">
            Acciones
          </button>
          <button className="px-4 py-2 bg-[#B5AF9A] rounded text-[#3B4D36]">
            Declarar Ausencia
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#D2B48C] h-[750px]">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-xl">
            <thead className="sticky top-0">
              <tr className="bg-[#F9F1DC]">
                <th className="px-8 py-6 text-left"></th>
                <th className="px-8 py-6 text-left">Fecha</th>
                <th className="px-8 py-6 text-left"></th>
                <th className="px-8 py-6 text-left">Horario</th>
                <th className="px-8 py-6 text-left">Entrada Registrada</th>
                <th className="px-8 py-6 text-left">Salida Registrada</th>
                <th className="px-8 py-6 text-left">Total</th>
                <th className="px-8 py-6 text-left">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D2B48C]">
            {displayRecords.map((record, index) => (
              <tr
                key={index}
                className={`${
                  record.isWeekend ? "bg-[#929292]/52" : ""
                } ${
                  record.isToday ? "bg-yellow-100 border-l-4 border-l-yellow-500" : ""
                }`}
              >
                <td className="px-8 py-5">
                  <input type="checkbox" className="w-5 h-5 text-[#B5AF9A] border-[#D2B48C] rounded focus:ring-[#B5AF9A]" />
                </td>
                <td className="px-8 py-5">{record.date}</td>
                <td className="px-8 py-5">
                  <span className="text-[#B5AF9A] text-lg">▶</span>
                </td>
                <td className="px-8 py-5">{record.schedule}</td>
                <td className="px-8 py-5">{record.entryTime}</td>
                <td className="px-8 py-5">{record.exitTime}</td>
                <td className="px-8 py-5">{record.total}</td>
                <td
                  className={`px-8 py-5 ${
                    record.balance.startsWith("+")
                      ? "text-green-600"
                      : record.balance.startsWith("-")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {record.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceTable;
