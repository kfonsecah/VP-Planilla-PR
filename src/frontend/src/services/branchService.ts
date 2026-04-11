import { Branch, BranchFormData } from '@/types/branch';
import { http } from './http';

/**
 * Service for managing branches
 */
export const BranchService = {
  /**
   * Get all branches
   */
  async getAllBranches(): Promise<Branch[]> {
    const data = await http.get('branches');
    return (Array.isArray(data) ? data : data ? [data] : []) as Branch[];
  },

  /**
   * Get branch by ID
   */
  async getBranchById(id: number): Promise<Branch> {
    return await http.get(`branches/${id}`);
  },

  /**
   * Create a new branch
   */
  async createBranch(branchData: BranchFormData): Promise<Branch> {
    return await http.post('branches', branchData);
  },

  /**
   * Update an existing branch
   */
  async updateBranch(id: number, branchData: Partial<BranchFormData>): Promise<Branch> {
    return await http.put(`branches/${id}`, branchData);
  },

  /**
   * Delete a branch
   */
  async deleteBranch(id: number): Promise<boolean> {
    await http.delete(`branches/${id}`);
    return true;
  },
};
