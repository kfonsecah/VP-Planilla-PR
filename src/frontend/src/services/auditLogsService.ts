import { AuditLog, AuditLogFilters, AuditLogsResponse } from '@/types/auditLog';
import { API_CONFIG } from '@/config';

const BASE_URL = `${API_CONFIG.baseUrl}/api`;

/**
 * Service for managing audit logs
 */
export const AuditLogsService = {
  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        if (filters.userId) queryParams.append('userId', filters.userId.toString());
        if (filters.action) queryParams.append('action', filters.action);
        if (filters.entity) queryParams.append('entity', filters.entity);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
        if (filters.offset) queryParams.append('offset', filters.offset.toString());
      }

      const url = `${BASE_URL}/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener logs de auditoría');
      }

      const data: AuditLogsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: number): Promise<AuditLog> {
    try {
      const response = await fetch(`${BASE_URL}/audit-logs/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener log de auditoría');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  },
};
