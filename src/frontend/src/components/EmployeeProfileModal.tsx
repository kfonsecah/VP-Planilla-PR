'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, EllipsisVerticalIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AttendanceRecord {
  date: string;
  day: string;
  shift: string;
  entryTime: string;
  exitTime: string;
  totalHours: string;
  balance: string;
  balanceType: 'positive' | 'negative' | 'neutral';
  hasIncident?: boolean;
  noRecords?: boolean;
}

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: {
    id: string;
    name: string;
    position: string;
    phone: string;
    status: string;
    incidences: {
      faltaTiempo: number;
      llegadaTardia: number;
      sobraTiempo: number;
      sinMarcas: number;
    };
    attendanceRecords: AttendanceRecord[];
  };
}

/**
 * Modal que muestra el perfil completo de un empleado
 * Incluye información básica, incidencias y tabla de asistencia
 */
const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  employeeData 
}) => {
  if (!isOpen || !employeeData) return null;

  // Datos de ejemplo basados en la imagen
  const attendanceData: AttendanceRecord[] = [
    { date: '1 Lun', day: 'Lun', shift: 'Mañana 8h', entryTime: '08:00 AM', exitTime: '4:00 PM', totalHours: '08:00hr', balance: '00:00', balanceType: 'neutral' },
    { date: '2 Mar', day: 'Mar', shift: 'Mañana 8h', entryTime: '08:00 AM', exitTime: '4:31 PM', totalHours: '08:00hr', balance: '+00:31', balanceType: 'positive', hasIncident: true },
    { date: '3 Mié', day: 'Mié', shift: 'Mañana 8h', entryTime: '08:00 AM', exitTime: '4:00 PM', totalHours: '08:00hr', balance: '00:00', balanceType: 'neutral' },
    { date: '4 Jue', day: 'Jue', shift: 'Mañana 8h', entryTime: '-', exitTime: '-', totalHours: '00:00hr', balance: '-08:00', balanceType: 'negative', hasIncident: true },
    { date: '5 Vie', day: 'Vie', shift: 'Mañana 8h', entryTime: '08:00 AM', exitTime: '4:00 PM', totalHours: '08:00hr', balance: '00:00', balanceType: 'neutral' },
    { date: '6 Sáb', day: 'Sáb', shift: 'No se esperan registros', entryTime: '', exitTime: '', totalHours: '', balance: '', balanceType: 'neutral', noRecords: true },
    { date: '7 Dom', day: 'Dom', shift: 'No se esperan registros', entryTime: '', exitTime: '', totalHours: '', balance: '', balanceType: 'neutral', noRecords: true },
    { date: '8 Lun', day: 'Lun', shift: 'Mañana 8h', entryTime: '08:00 AM', exitTime: '4:00 PM', totalHours: '08:00hr', balance: '00:00', balanceType: 'neutral' },
    { date: '9 Mar', day: 'Mar', shift: 'Tarde 8h', entryTime: '2:30 PM', exitTime: '9:07 PM', totalHours: '06:37hr', balance: '-01:22', balanceType: 'negative', hasIncident: true },
    { date: '10 Mié', day: 'Mié', shift: 'Tarde 8h', entryTime: '2:42 AM', exitTime: '9:00 PM', totalHours: '08:00hr', balance: '00:00', balanceType: 'neutral', hasIncident: true },
  ];

  const incidencesData = {
    faltaTiempo: 2,
    llegadaTardia: 1,
    sobraTiempo: 0,
    sinMarcas: 0
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)',
        background: 'rgba(0,0,0,0.4)'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-[#F5F0E8] dark:bg-[#2d2d2d] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Layout principal con sidebar y contenido */}
        <div className="flex h-[90vh]">
          {/* Sidebar izquierdo */}
          <div className="w-64 bg-[#E6DCC6] dark:bg-[#252525] p-6 flex flex-col">
            {/* Información del empleado */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#3B4D36] dark:text-[#E5E5E5] mb-2">
                {employeeData.name}
              </h2>
              <p className="text-sm text-[#5D4E37] dark:text-[#A3A3A3] mb-1">
                {employeeData.position}
              </p>
              <p className="text-sm text-[#5D4E37] dark:text-[#A3A3A3] mb-3">
                {employeeData.phone}
              </p>
              <div className="inline-block">
                <span className="px-2 py-1 bg-[#D4BD80] dark:bg-[#4a4a4a] text-[#3B4D36] dark:text-[#E5E5E5] text-xs rounded-full font-medium">
                  {employeeData.status}
                </span>
              </div>
            </div>

            {/* Días con incidencia */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5] mb-3">
                Días con incidencia
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-[#5D4E37] dark:text-[#A3A3A3]">Falta tiempo</span>
                  </div>
                  <span className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">{incidencesData.faltaTiempo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-[#5D4E37] dark:text-[#A3A3A3]">Llegada tardía</span>
                  </div>
                  <span className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">{incidencesData.llegadaTardia}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-[#5D4E37] dark:text-[#A3A3A3]">Sobra tiempo</span>
                  </div>
                  <span className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">{incidencesData.sobraTiempo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-[#5D4E37] dark:text-[#A3A3A3]">Sin marcas</span>
                  </div>
                  <span className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">{incidencesData.sinMarcas}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex flex-col flex-1">
            {/* Header con navegación de mes */}
            <div className="bg-[#D4BD80] dark:bg-[#3d3d3d] px-6 py-4 flex items-center justify-between border-b border-[#C4AD70] dark:border-[#4a4a4a]">
              <div className="flex items-center gap-4">
                <button className="p-1 hover:bg-[#C4AD70] dark:hover:bg-[#4a4a4a] rounded">
                  <ChevronLeftIcon className="w-5 h-5 text-[#3B4D36] dark:text-[#E5E5E5]" />
                </button>
                <span className="font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">Julio 2025</span>
                <button className="p-1 hover:bg-[#C4AD70] dark:hover:bg-[#4a4a4a] rounded">
                  <ChevronRightIcon className="w-5 h-5 text-[#3B4D36] dark:text-[#E5E5E5]" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#3B4D36] dark:text-[#E5E5E5]">Hoy</span>
                <button 
                  onClick={onClose}
                  className="ml-4 p-1 hover:bg-[#C4AD70] dark:hover:bg-[#4a4a4a] rounded text-[#3B4D36] dark:text-[#E5E5E5]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Rango de fechas */}
            <div className="bg-[#E6DCC6] dark:bg-[#252525] px-6 py-2">
              <span className="text-sm text-[#5D4E37] dark:text-[#A3A3A3]">1 Julio, 2025 - 1 Agosto, 2025</span>
            </div>

            {/* Tabla de asistencia */}
            <div className="flex-1 overflow-auto">
              <div className="bg-white dark:bg-[#2d2d2d]">
                {/* Headers con acciones */}
                <div className="flex items-center justify-between px-6 py-3 bg-[#F0EBD8] dark:bg-[#252525] border-b border-[#D2B48C] dark:border-[#404040]">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" className="rounded dark:bg-[#404040]" />
                    <button className="flex items-center gap-2 px-3 py-1 bg-[#3B4D36] dark:bg-[#4a4a4a] text-white text-sm rounded">
                      <EllipsisVerticalIcon className="w-4 h-4" />
                      Acciones
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 text-sm text-white bg-gray-500 dark:bg-gray-600 rounded">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Declarar Ausencia
                    </button>
                  </div>
                </div>

                {/* Header de tabla */}
                <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-[#F8F4E6] dark:bg-[#1f1f1f] border-b border-[#D2B48C] dark:border-[#404040] text-sm font-medium text-[#3B4D36] dark:text-[#E5E5E5]">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded dark:bg-[#404040]" />
                    <span>Fecha</span>
                  </div>
                  <div>Horario</div>
                  <div>Entrada Registrada</div>
                  <div>Salida Registrada</div>
                  <div>Total</div>
                  <div>Balance</div>
                  <div></div>
                </div>

                {/* Filas de datos */}
                <div className="divide-y divide-[#E6DCC6] dark:divide-[#404040]">
                  {attendanceData.map((record, index) => (
                    <div key={index} className="grid grid-cols-7 gap-4 px-6 py-4 text-sm hover:bg-[#F8F4E6] dark:hover:bg-[#333333] transition-colors">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded dark:bg-[#404040]" />
                        <span className="text-[#5D4E37] dark:text-[#A3A3A3]">{record.date}</span>
                      </div>
                      <div className="text-[#5D4E37] dark:text-[#A3A3A3]">
                        {record.noRecords ? (
                          <span className="text-gray-500 dark:text-gray-400">No se esperan registros</span>
                        ) : (
                          record.shift
                        )}
                      </div>
                      <div className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">
                        {record.entryTime || '-'}
                      </div>
                      <div className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">
                        {record.exitTime || '-'}
                      </div>
                      <div className="text-[#3B4D36] dark:text-[#E5E5E5] font-medium">
                        {record.totalHours || '-'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          record.balanceType === 'positive' ? 'text-green-600 dark:text-green-400' : 
                          record.balanceType === 'negative' ? 'text-red-600 dark:text-red-400' : 
                          'text-[#3B4D36] dark:text-[#E5E5E5]'
                        }`}>
                          {record.balance}
                        </span>
                        {record.hasIncident && (
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            {record.balanceType === 'negative' && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                            )}
                            {record.balanceType === 'neutral' && record.hasIncident && (
                              <CheckCircleIcon className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileModal;
