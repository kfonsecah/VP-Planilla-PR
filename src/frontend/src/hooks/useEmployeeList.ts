import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';
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
  updateEmployee,
  fireEmployee
} from '@/services/employeeService';

interface RawEmployee {
  id?: string | number;
  employee_id?: string | number;
  name?: string;
  employee_first_name?: string;
  first_name?: string;
  employee_middle_name?: string;
  middle_name?: string;
  employee_last_name?: string;
  last_name?: string;
  status?: string;
  employee_status?: string;
  position_id?: string | number | null;
  employee_position_id?: string | number | null;
  fired?: boolean;
  employee_fired?: boolean;
  employee_exit_date?: string | null;
  exit_date?: string | null;
}

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

const buildEmployeeName = (raw: RawEmployee): string => {
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

const normalizeEmployeeForEdit = (raw: RawEmployee) => {
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

  const [rawEmployees, setRawEmployees] = useState<RawEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiredEmployees, setShowFiredEmployees] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingEmployeeData, setEditingEmployeeData] = useState<RawEmployee | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissingEmployee, setDismissingEmployee] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    onVacation: 0,
    incompleteAssistance: 0,
    incapacityMaternity: 0
  });

  const mapApiEmployees = (apiEmployees: RawEmployee[]): Employee[] => {
    return apiEmployees.map((e) => {
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
      const isFired = e.fired === true || e.employee_fired === true;

      const resolvedStatus: string = isFired ? EMPLOYEE_STATUS.FIRED : normalizedStatus;

      return {
        id: String(e.employee_id ?? e.id),
        name: buildEmployeeName(e),
        position: getPositionName(positionId, positions),
        salary: getPositionSalary(positionId, positions),
        status: resolvedStatus as Employee['status'],
        fired: isFired,
        exit_date: e.employee_exit_date ?? e.exit_date ?? null,
      } as Employee;
    });
  };

  // Cargar empleados desde el backend
  useEffect(() => {
    const loadEmployees = async () => {
      const cached = readCache<RawEmployee[]>('vp_employees_cache');
      if (cached) {
        setRawEmployees(cached);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const apiEmployees = await apiGetEmployees();
        writeCache('vp_employees_cache', apiEmployees as RawEmployee[]);
        setRawEmployees(apiEmployees as RawEmployee[]);
      } catch (err) {
        console.error('Error loading employees from API', err);
        setError(err instanceof Error ? err.message : 'Error al cargar empleados');
        setRawEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    const mapped = mapApiEmployees(rawEmployees);
    setEmployees(mapped);
    setFilteredEmployees(mapped);
    updateStats(mapped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEmployees, positions]);

  // Filtrar empleados basado en el término de búsqueda y estado de despedidos
  useEffect(() => {
    let filtered = filterEmployees(employees, searchTerm);
    
    // Filtrar empleados despedidos si está desactivado
    if (!showFiredEmployees) {
      filtered = filtered.filter(emp => !emp.fired && emp.status !== 'fired');
    }
    
    setFilteredEmployees(filtered);
  }, [searchTerm, employees, showFiredEmployees]);

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
        toast.error('No se pudo cargar el empleado. Intenta de nuevo.');
        setShowEditEmployeeModal(false);
      } finally {
        setIsLoadingEmployee(false);
      }
    } else if (action === 'dismiss') {
      const emp = rawEmployees.find(
        (e) => String(e.employee_id ?? e.id) === employeeId
      );
      const empName = emp ? buildEmployeeName(emp) : 'este empleado';
      setDismissingEmployee({ id: employeeId, name: empName });
      setShowDismissModal(true);
    } else if (action === 'delete') {
      // Kept for backward compatibility — dismiss replaces this in the UI
      console.log(`Eliminar empleado: ${employeeId}`);
      toast.warning('Use la opción "Despedir" para desactivar un empleado.');
    } else {
      console.log(`Acción: ${action} para empleado: ${employeeId}`);
    }
  };

  /**
   * Maneja la actualización de un empleado
   */
  const handleUpdateEmployee = async (employeeData: Partial<EmployeeFormData>) => {
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
        employee_required_hours_biweekly: employeeData.employee_required_hours_biweekly || '',
      };

      await updateEmployee(editingEmployeeId, updates);

      // Recargar lista de empleados
      invalidateCache('vp_employees_cache');
      const apiEmployees = await apiGetEmployees();
      writeCache('vp_employees_cache', apiEmployees as RawEmployee[]);
      setRawEmployees(apiEmployees as RawEmployee[]);

      toast.success('Empleado actualizado correctamente');
    } catch (error) {
      console.error('Error updating employee', error);
      toast.error('No se pudo actualizar el empleado. Revisa la consola para más detalles.');
      throw error;
    }
  };

  /**
   * Confirma el despido: llama al servicio y actualiza la lista local
   */
  const handleConfirmDismiss = async (exitDate: string) => {
    if (!dismissingEmployee) return;
    try {
      await fireEmployee(dismissingEmployee.id, exitDate);
      invalidateCache('vp_employees_cache');
      const apiEmployees = await apiGetEmployees();
      writeCache('vp_employees_cache', apiEmployees as RawEmployee[]);
      setRawEmployees(apiEmployees as RawEmployee[]);
      setShowDismissModal(false);
      setDismissingEmployee(null);
    } catch (error) {
      console.error('Error dismissing employee', error);
      toast.error('No se pudo despedir al empleado. Intenta de nuevo.');
    }
  };

  const closeDismissModal = () => {
    setShowDismissModal(false);
    setDismissingEmployee(null);
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
  const handleAddEmployee = async (employeeData: EmployeeFormData): Promise<Employee | void> => {
    try {
      const created = await apiCreateEmployee(employeeData);
      const createdObj = created as RawEmployee;
      setRawEmployees((prev) => [...prev, createdObj]);
      invalidateCache('vp_employees_cache'); // so next mount re-fetches
      return created;
    } catch (error) {
      console.error('Error creating employee', error);
      toast.error('No se pudo guardar el empleado. Revisa la consola para más detalles.');
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
    isLoading,
    error,
    searchTerm,
    stats,
    positions,
    positionsLoading,
    positionsError,
    showAddEmployeeModal,
    showEditEmployeeModal,
    editingEmployeeData,
    isLoadingEmployee,
    showDismissModal,
    dismissingEmployee,
    showFiredEmployees,
    setShowFiredEmployees,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    handleUpdateEmployee,
    handleConfirmDismiss,
    closeDismissModal,
    createPosition,
    updatePosition,
    deletePosition,
    refreshPositions,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    closeEditEmployeeModal
    ,
    // Provide a refresh function so pages can re-fetch employees and positions on demand
    refreshEmployees: async () => {
      try {
        invalidateCache('vp_employees_cache');
        const apiEmployees = await apiGetEmployees();
        writeCache('vp_employees_cache', apiEmployees as RawEmployee[]);
        setRawEmployees(apiEmployees as RawEmployee[]);
        // Also refresh positions so both datasets stay in sync
        await refreshPositions();
      } catch (error) {
        console.error('Error refreshing employees', error);
      }
    }
  };
};

export default useEmployeeList;
