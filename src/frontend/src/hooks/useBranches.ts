import { useState, useCallback, useEffect } from 'react';
import { BranchService } from '@/services/branchService';
import { Branch, BranchFormData } from '@/types/branch';

/**
 * Hook for managing branches
 */
export const useBranches = () => {
  const [data, setData] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all branches
   */
  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const branches = await BranchService.getAllBranches();
      setData(branches);
      return branches;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al cargar sucursales';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new branch
   */
  const create = useCallback(async (branchData: BranchFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newBranch = await BranchService.createBranch(branchData);
      setData(prev => [...prev, newBranch]);
      return newBranch;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al crear sucursal';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing branch
   */
  const update = useCallback(async (id: number, branchData: Partial<BranchFormData>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedBranch = await BranchService.updateBranch(id, branchData);
      setData(prev => prev.map(b => b.id === id ? updatedBranch : b));
      return updatedBranch;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al actualizar sucursal';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a branch
   */
  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await BranchService.deleteBranch(id);
      setData(prev => prev.filter(b => b.id !== id));
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al eliminar sucursal';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch branches
   */
  const refetch = useCallback(() => {
    return fetchBranches();
  }, [fetchBranches]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    data,
    isLoading,
    error,
    create,
    update,
    remove,
    refetch,
  };
};
