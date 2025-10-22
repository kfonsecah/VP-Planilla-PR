import { useEffect, useState, useCallback } from 'react';
import { PayrollTypesService, PayrollType } from '@/services/payrollTypesService';

/**
 * Hook personalizado para manejar operaciones CRUD de tipos de planilla
 * Proporciona estado y funciones para listar, crear, actualizar y eliminar tipos de planilla
 */
export const usePayrollTypes = () => {
  const [data, setData] = useState<PayrollType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene todos los tipos de planilla del backend
   */
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await PayrollTypesService.getAllPayrollTypes();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Error cargando tipos de planilla');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  /**
   * Crea un nuevo tipo de planilla
   * @param payload - Datos del tipo de planilla a crear
   * @returns El tipo de planilla creado
   */
  const create = async (payload: any) => {
    setIsLoading(true);
    try {
      const created = await PayrollTypesService.createPayrollType(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { 
      setIsLoading(false); 
    }
  };

  /**
   * Actualiza un tipo de planilla existente
   * @param id - ID del tipo de planilla a actualizar
   * @param payload - Datos a actualizar
   * @returns El tipo de planilla actualizado
   */
  const update = async (id: number, payload: any) => {
    setIsLoading(true);
    try {
      const updated = await PayrollTypesService.updatePayrollType(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { 
      setIsLoading(false); 
    }
  };

  /**
   * Elimina un tipo de planilla
   * @param id - ID del tipo de planilla a eliminar
   */
  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      // Nota: El servicio no tiene método delete implementado aún
      // Este es un placeholder para cuando se implemente
      throw new Error('La eliminación de tipos de planilla no está disponible aún');
    } finally { 
      setIsLoading(false); 
    }
  };

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchAll, 
    create, 
    update, 
    remove 
  };
};
