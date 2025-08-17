import { useState } from 'react';
import { Employee, EmployeeProfileData } from '@/types';
import { getStatusBadgeConfig } from '@/utils/employeeUtils';

/**
 * Hook para manejar la lógica de la tabla de empleados
 */
const useEmployeeTable = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<Employee | null>(null);

  /**
   * Obtiene la configuración del badge de estado
   */
  const getStatusBadge = (status: string) => {
    return getStatusBadgeConfig(status);
  };

  /**
   * Maneja acciones sobre empleados
   */
  const handleEmployeeAction = (
    action: string, 
    employeeId: string, 
    onEmployeeAction: (action: string, employeeId: string) => void
  ) => {
    onEmployeeAction(action, employeeId);
    setSelectedEmployee(null);
  };

  /**
   * Maneja la visualización del perfil del empleado
   */
  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployeeData(employee);
    setShowProfileModal(true);
    setSelectedEmployee(null);
  };

  /**
   * Cierra el modal de perfil
   */
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedEmployeeData(null);
  };

  /**
   * Obtiene los datos del perfil del empleado para el modal
   */
  const getEmployeeProfileData = (employee: Employee | null): EmployeeProfileData | undefined => {
    if (!employee) return undefined;

    return {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      phone: "+506 8731 0761", // Placeholder - obtener de base de datos
      status: getStatusDisplayText(employee.status),
      incidences: {
        faltaTiempo: 2,
        llegadaTardia: 1,
        sobraTiempo: 0,
        sinMarcas: 0
      },
      attendanceRecords: getSampleAttendanceRecords() // Placeholder - obtener de base de datos
    };
  };

  /**
   * Convierte el estado interno a texto legible
   */
  const getStatusDisplayText = (status: string): string => {
    const statusConfig = getStatusBadgeConfig(status);
    return statusConfig.text;
  };

  /**
   * Obtiene registros de asistencia de ejemplo (placeholder)
   * TODO: Reemplazar con datos reales de la base de datos
   */
  const getSampleAttendanceRecords = () => [
    { date: "1 Lun", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
    { date: "2 Mar", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:31 PM", total: "08:00hr", balance: "+00:31" },
    { date: "3 Mié", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
    { date: "4 Jue", schedule: "Mañana 8h", entryTime: "-", exitTime: "-", total: "00:00hr", balance: "-08:00" },
    { date: "5 Vie", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
    { date: "6 Sáb", schedule: "No se esperan registros", entryTime: "", exitTime: "", total: "", balance: "", isWeekend: true },
    { date: "7 Dom", schedule: "No se esperan registros", entryTime: "", exitTime: "", total: "", balance: "", isWeekend: true },
    { date: "8 Lun", schedule: "Mañana 8h", entryTime: "08:00 AM", exitTime: "4:00 PM", total: "08:00hr", balance: "00:00" },
    { date: "9 Mar", schedule: "Tarde 8h", entryTime: "2:30 PM", exitTime: "9:07 PM", total: "06:37hr", balance: "-01:22" },
    { date: "10 Mié", schedule: "Tarde 8h", entryTime: "2:42 AM", exitTime: "9:00 PM", total: "08:00hr", balance: "00:00" }
  ];

  return {
    filterOpen,
    setFilterOpen,
    selectedEmployee,
    setSelectedEmployee,
    showProfileModal,
    selectedEmployeeData,
    getStatusBadge,
    handleEmployeeAction,
    handleViewProfile,
    closeProfileModal,
    getEmployeeProfileData
  };
};

export default useEmployeeTable;
