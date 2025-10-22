/**
 * Branch Types
 * Tipos para la gestión de sucursales
 */

export interface Branch {
  id: number;
  name: string;
  location: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface BranchFormData {
  name: string;
  location: string;
}

export interface BranchResponse {
  success: boolean;
  data?: Branch | Branch[];
  error?: string;
  message?: string;
}
