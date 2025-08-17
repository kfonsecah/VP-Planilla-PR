import { useState, useEffect } from 'react';
import { Employee, EmployeeStats, EmployeeFormData } from '@/types';
import { 
  calculateEmployeeStats, 
  filterEmployees, 
  getPositionName, 
  getPositionSalary,
  generateEmployeeId 
} from '@/utils/employeeUtils';

/**
 * Hook para manejar la lógica de la lista de empleados
 */
const useEmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    onVacation: 0,
    incompleteAssistance: 0,
    incapacityMaternity: 0
  });

  // Datos de ejemplo - reemplazar con llamada a API
  useEffect(() => {
    const loadSampleEmployees = () => {
      const sampleEmployees: Employee[] = [
        { id: '1', name: 'María Solano Rojas', position: 'Encargado(a) de caja', salary: 360000, status: 'active' },
        { id: '2', name: 'José Andrés Chavarría Soto', position: 'Cocinero(a) principal', salary: 450000, status: 'incomplete_assistance' },
        { id: '3', name: 'Gabriela Solano Méndez', position: 'Salonero(a)', salary: 320000, status: 'vacation' },
        { id: '4', name: 'Kevin Vargas Umaña', position: 'Barista', salary: 320000, status: 'active' },
        { id: '5', name: 'Maritza Días Hidalgo', position: 'Barista', salary: 320000, status: 'active' },
        { id: '6', name: 'Esteban Soto Solís', position: 'Barista', salary: 320000, status: 'active' },
        { id: '7', name: 'Karen Vargas Solorzano', position: 'Salonero(a)', salary: 320000, status: 'incomplete_assistance' },
        { id: '8', name: 'Miguel Díaz Díaz', position: 'Salonero(a)', salary: 320000, status: 'active' },
        { id: '9', name: 'Mathew Ureña Jiménez', position: 'Cocinero(a)', salary: 320000, status: 'active' },
        { id: '10', name: 'Laura Chinchilla Chavez', position: 'Cocinero(a)', salary: 320000, status: 'active' },
        { id: '11', name: 'Oscar Arias Solís', position: 'Ayudante de cocina', salary: 320000, status: 'active' },
        { id: '12', name: 'Carlos León Jiménez', position: 'Barista', salary: 320000, status: 'active' },
        { id: '13', name: 'Douglas Calvo Campos', position: 'Salonero(a)', salary: 320000, status: 'vacation' }
      ];

      setEmployees(sampleEmployees);
      setFilteredEmployees(sampleEmployees);
      updateStats(sampleEmployees);
    };

    loadSampleEmployees();
  }, []);

  // Filtrar empleados basado en el término de búsqueda
  useEffect(() => {
    const filtered = filterEmployees(employees, searchTerm);
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  /**
   * Actualiza las estadísticas de empleados
   */
  const updateStats = (employeeList: Employee[]) => {
    const newStats = calculateEmployeeStats(employeeList);
    setStats(newStats);
  };

  /**
   * Maneja acciones sobre empleados (editar, eliminar, etc.)
   */
  const handleEmployeeAction = (action: string, employeeId: string) => {
    console.log(`Acción: ${action} para empleado: ${employeeId}`);
    // TODO: Implementar las acciones específicas
  };

  /**
   * Maneja cambios en el término de búsqueda
   */
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  /**
   * Añade un nuevo empleado
   */
  const handleAddEmployee = (employeeData: EmployeeFormData) => {
    const newEmployee: Employee = {
      id: generateEmployeeId(),
      name: `${employeeData.employee_first_name} ${employeeData.employee_middle_name} ${employeeData.employee_last_name}`.trim(),
      position: getPositionName(employeeData.employee_position_id),
      salary: getPositionSalary(employeeData.employee_position_id),
      status: 'active'
    };

    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    setFilteredEmployees(updatedEmployees);
    updateStats(updatedEmployees);
  };

  /**
   * Abre el modal de añadir empleado
   */
  const openAddEmployeeModal = () => setShowAddEmployeeModal(true);

  /**
   * Cierra el modal de añadir empleado
   */
  const closeAddEmployeeModal = () => setShowAddEmployeeModal(false);

  return {
    employees: filteredEmployees,
    searchTerm,
    stats,
    showAddEmployeeModal,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    openAddEmployeeModal,
    closeAddEmployeeModal
  };
};

export default useEmployeeList;
