import { useState, useEffect } from 'react';
import { Employee, EmployeeStats, EmployeeFormData } from '@/types';
import { 
  calculateEmployeeStats, 
  filterEmployees, 
  getPositionName, 
  getPositionSalary
} from '@/utils/employeeUtils'
import { EMPLOYEE_STATUS } from '@/constants';
import { usePositions } from '@/hooks/usePositions';
import { 
  getEmployees as apiGetEmployees, 
  createEmployee as apiCreateEmployee,
  getEmployeeById,
  updateEmployee 
} from '@/services/employeeService';

const normalizePart = (value?: string) =>
  typeof value === 'string' ? value.trim() : '';

const removeEndingSegment = (base: string, segment?: string) => {
  const cleanedSegment = normalizePart(segment);
  if (!cleanedSegment) return base.trim();
  const escaped = cleanedSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\s*${escaped}$`, 'i');
  return base.replace(regex, '').trim();
};

const inferFirstName = (fullName?: string, middleName?: string, lastName?: string) => {
  let workingName = normalizePart(fullName);
  if (!workingName) return '';

  workingName = removeEndingSegment(workingName, lastName);
  workingName = removeEndingSegment(workingName, middleName);
  return workingName.trim();
};

const buildEmployeeName = (raw: any): string => {
  const normalize = (value?: string) =>
    typeof value === 'string' ? value.trim() : '';

  const firstName = normalize(raw.employee_first_name ?? raw.first_name);
  const middleName = normalize(raw.employee_middle_name ?? raw.middle_name);
  const lastName = normalize(raw.employee_last_name ?? raw.last_name);
  const fallbackFullName = normalize(raw.name);

  if (firstName) {
    return [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  if (fallbackFullName) {
    return fallbackFullName;
  }

  return [middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const normalizeEmployeeForEdit = (raw: any) => {
  const middleName = normalizePart(raw.employee_middle_name ?? raw.middle_name);
  const lastName = normalizePart(raw.employee_last_name ?? raw.last_name);
  const existingFirstName = normalizePart(raw.employee_first_name ?? raw.first_name);
  const inferredFirstName =
    existingFirstName || inferFirstName(raw.name, middleName, lastName);

  return {
    ...raw,
    employee_first_name: inferredFirstName,
    employee_middle_name: middleName,
    employee_last_name: lastName
  };
};

/**
 * Hook para manejar la lógica de la lista de empleados
 */
const useEmployeeList = () => {
  const {
    data: positions,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refreshPositions,
    create: createPosition,
    update: updatePosition,
    remove: deletePosition
  } = usePositions();

  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingEmployeeData, setEditingEmployeeData] = useState<any | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    onVacation: 0,
    incompleteAssistance: 0,
    incapacityMaternity: 0
  });

  const mapApiEmployees = (apiEmployees: any[]): Employee[] => {
    return (apiEmployees as any[]).map((e: any) => {
      const rawStatus = String(e.status ?? e.employee_status ?? 'active');
      let normalizedStatus: string = EMPLOYEE_STATUS.ACTIVE;
      // Map common single-letter or legacy codes to normalized constants
      if (
        rawStatus === 'A' ||
        rawStatus.toLowerCase() === 'active' ||
        rawStatus === 'Al día'
      ) {
        normalizedStatus = EMPLOYEE_STATUS.ACTIVE;
      } else if (
        rawStatus === 'V' ||
        rawStatus.toLowerCase() === 'vacation' ||
        rawStatus === 'Vacaciones'
      ) {
        normalizedStatus = EMPLOYEE_STATUS.VACATION;
      } else if (
        rawStatus === 'I' ||
        rawStatus.toLowerCase() === 'incomplete' ||
        rawStatus === 'Asistencia incompleta'
      ) {
        normalizedStatus = EMPLOYEE_STATUS.INCOMPLETE_ASSISTANCE;
      } else if (rawStatus.toLowerCase().includes('incap')) {
        normalizedStatus = EMPLOYEE_STATUS.INCAPACITY_MATERNITY;
      }

      const positionId = String(e.position_id ?? e.employee_position_id ?? '');

      return {
        id: String(e.employee_id ?? e.id),
        name: buildEmployeeName(e),
        position: getPositionName(positionId, positions),
        salary: getPositionSalary(positionId, positions),
        status: normalizedStatus as any
      } as Employee;
    });
  };

  // Cargar empleados desde el backend
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const apiEmployees = await apiGetEmployees();
        setRawEmployees(apiEmployees as any[]);
      } catch (error) {
        console.error('Error loading employees from API', error);
        // Si falla, dejar la lista vacía (o podríamos mantener datos locales)
        setRawEmployees([]);
      }
    };

  loadEmployees();

  // expose a refresh function by returning it from closure
  // (we'll create a named function below to call from outside via returned object)
  }, []);

  useEffect(() => {
    const mapped = mapApiEmployees(rawEmployees);
    setEmployees(mapped);
    setFilteredEmployees(mapped);
    updateStats(mapped);
  }, [rawEmployees, positions]);

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
  const handleEmployeeAction = async (action: string, employeeId: string) => {
    if (action === 'edit') {
      // Abrir modal de edición
      setEditingEmployeeId(employeeId);
      setShowEditEmployeeModal(true);
      setIsLoadingEmployee(true);
      
      try {
        const employeeData = await getEmployeeById(employeeId);
        setEditingEmployeeData(normalizeEmployeeForEdit(employeeData));
      } catch (error) {
        console.error('Error loading employee:', error);
        alert('No se pudo cargar el empleado. Intenta de nuevo.');
        setShowEditEmployeeModal(false);
      } finally {
        setIsLoadingEmployee(false);
      }
    } else if (action === 'delete') {
      // TODO: Implementar eliminación de empleado
      console.log(`Eliminar empleado: ${employeeId}`);
      alert('La funcionalidad de eliminar empleado no está implementada aún.');
    } else {
      console.log(`Acción: ${action} para empleado: ${employeeId}`);
    }
  };

  /**
   * Maneja la actualización de un empleado
   */
  const handleUpdateEmployee = async (employeeData: any) => {
    if (!editingEmployeeId) return;

    try {
      // Mapear los datos del formulario al formato del backend (usando nombres del EmployeeFormData)
      const updates: Partial<EmployeeFormData> = {
        employee_first_name: employeeData.employee_first_name,
        employee_middle_name: employeeData.employee_middle_name || '',
        employee_last_name: employeeData.employee_last_name,
        employee_national_id: employeeData.employee_national_id || '',
        employee_social_code: employeeData.employee_social_code || '',
        employee_email: employeeData.employee_email,
        employee_phone: employeeData.employee_phone || '',
        employee_position_id: employeeData.employee_position_id || '',
        employee_hire_date: employeeData.employee_hire_date || '',
        employee_gender: employeeData.employee_gender || '',
        employee_schedule: employeeData.employee_schedule || '',
      };

      await updateEmployee(editingEmployeeId, updates);
      
      // Recargar lista de empleados
      const apiEmployees = await apiGetEmployees();
      setRawEmployees(apiEmployees as any[]);
      
      alert('Empleado actualizado correctamente');
    } catch (error) {
      console.error('Error updating employee', error);
      alert('No se pudo actualizar el empleado. Revisa la consola para más detalles.');
      throw error;
    }
  };

  /**
   * Maneja cambios en el término de búsqueda
   */
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  /**
   * Añade un nuevo empleado (persistido en backend)
   */
  const handleAddEmployee = async (employeeData: EmployeeFormData) => {
    try {
      const created = await apiCreateEmployee(employeeData);
      const createdObj = created as any;
      setRawEmployees((prev) => [...prev, createdObj]);
    } catch (error) {
      console.error('Error creating employee', error);
      alert('No se pudo guardar el empleado. Revisa la consola para más detalles.');
    }
  };

  /**
   * Abre el modal de añadir empleado
   */
  const openAddEmployeeModal = () => setShowAddEmployeeModal(true);

  /**
   * Cierra el modal de añadir empleado
   */
  const closeAddEmployeeModal = () => setShowAddEmployeeModal(false);

  /**
   * Cierra el modal de editar empleado
   */
  const closeEditEmployeeModal = () => {
    setShowEditEmployeeModal(false);
    setEditingEmployeeId(null);
    setEditingEmployeeData(null);
  };

  return {
    employees: filteredEmployees,
    searchTerm,
    stats,
    positions,
    positionsLoading,
    positionsError,
    showAddEmployeeModal,
    showEditEmployeeModal,
    editingEmployeeData,
    isLoadingEmployee,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    handleUpdateEmployee,
    createPosition,
    updatePosition,
    deletePosition,
    refreshPositions,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    closeEditEmployeeModal
    ,
    // Provide a refresh function so pages can re-fetch employees on demand
    refreshEmployees: async () => {
      try {
        const apiEmployees = await apiGetEmployees();
        setRawEmployees(apiEmployees as any[]);
      } catch (error) {
        console.error('Error refreshing employees', error);
      }
    }
  };
};

export default useEmployeeList;
