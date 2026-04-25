import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getEmployeeById } from '@/services/employeeService';
import { ClockAliasService, ClockAlias } from '@/services/clockAliasService';
import { VacationsService, Vacation } from '@/services/vacationsService';

/**
 * Datos del empleado ya mapeados del backend (Employee model)
 * Backend EmployeeService.getEmployeeById retorna campos sin prefijo employee_
 */
export interface EmployeeProfileData {
  id: number;
  name: string;
  first_name?: string;
  last_name: string;
  middle_name: string;
  national_id: string;
  social_code: string;
  email: string;
  phone?: string | null;
  position_id: number;
  hire_date: string;
  exit_date?: string | null;
  fired: boolean;
  status: string;
  gender?: string | null;
  required_hours_biweekly?: number;
  version: number;
  // Campos enriquecidos del backend
  position_name?: string | null;
  position_base_salary?: number | null;
}

/**
 * Hook para cargar y manejar el perfil completo de un empleado
 * @param employeeId - ID del empleado
 * @returns { employee, aliases, vacations, isLoading, error, refresh }
 */
const useEmployeeProfile = (employeeId: string | number) => {
  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
  const [aliases, setAliases] = useState<ClockAlias[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Cargar empleado base (ya incluye position_name y position_base_salary)
      const emp = await getEmployeeById(employeeId);
      setEmployee(emp as unknown as EmployeeProfileData);

      // Cargar aliases en paralelo (no bloquea)
      try {
        const al = await ClockAliasService.getAliases(employeeId);
        setAliases(al);
      } catch {
        setAliases([]);
      }

      // Cargar vacaciones del empleado
      try {
        const allVacations = await VacationsService.getAll();
        const empId = Number(employeeId);
        setVacations(allVacations.filter(v => v.employee_id === empId));
      } catch {
        setVacations([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando perfil';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    employee,
    aliases,
    vacations,
    isLoading,
    error,
    refresh: fetchProfile,
  };
};

export default useEmployeeProfile;
