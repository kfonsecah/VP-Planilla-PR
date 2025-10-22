import { Branch, BranchFormData, BranchResponse } from '@/types/branch';
import { API_CONFIG } from '@/config';

const BASE_URL = `${API_CONFIG.baseUrl}/api/branches`;

/**
 * Service for managing branches
 */
export const BranchService = {
  /**
   * Get all branches
   */
  async getAllBranches(): Promise<Branch[]> {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al obtener sucursales');
    }

    const data: BranchResponse = await response.json();
    return (Array.isArray(data.data) ? data.data : data.data ? [data.data] : []) as Branch[];
  },

  /**
   * Get branch by ID
   */
  async getBranchById(id: number): Promise<Branch> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al obtener sucursal');
    }

    const data: BranchResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Sucursal no encontrada');
    }

    return data.data as Branch;
  },

  /**
   * Create a new branch
   */
  async createBranch(branchData: BranchFormData): Promise<Branch> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(branchData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al crear sucursal');
    }

    const data: BranchResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Error al crear sucursal');
    }

    return data.data as Branch;
  },

  /**
   * Update an existing branch
   */
  async updateBranch(id: number, branchData: Partial<BranchFormData>): Promise<Branch> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(branchData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al actualizar sucursal');
    }

    const data: BranchResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Error al actualizar sucursal');
    }

    return data.data as Branch;
  },

  /**
   * Delete a branch
   */
  async deleteBranch(id: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al eliminar sucursal');
    }

    return true;
  },
};
