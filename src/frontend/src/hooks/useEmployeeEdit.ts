import { useState, useEffect, useCallback } from 'react';
import { getEmployeeById, updateEmployee, EmployeeUpdateData } from '@/services/employeeService';

/**
 * Hook personalizado para manejar la edición de empleados individuales
 * Proporciona funciones para cargar y actualizar datos de un empleado específico
 */
export const useEmployeeEdit = (employeeId: string) => {
  const [employee, setEmployee] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga los datos del empleado desde el backend
   */
  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeeById(employeeId);
      setEmployee(data);
    } catch (e: any) {
      setError(e?.message || 'Error cargando empleado');
      console.error('Error fetching employee:', e);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Cargar empleado al montar o cuando cambie el ID
  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  /**
   * Actualiza los datos del empleado
   * @param updates - Datos a actualizar (parciales)
   * @returns Los datos actualizados del empleado
   */
  const update = async (updates: EmployeeUpdateData) => {
    if (!employeeId) throw new Error('ID de empleado no proporcionado');
    
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateEmployee(employeeId, updates);
      setEmployee(updated);
      return updated;
    } catch (e: any) {
      setError(e?.message || 'Error actualizando empleado');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    employee,
    isLoading,
    error,
    refetch: fetchEmployee,
    update
  };
};
