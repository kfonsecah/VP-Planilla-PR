import { AuditLog, AuditLogFilters, AuditLogsResponse } from '@/types/auditLog';
import { http } from './http';

/**
 * Service for managing audit logs
 */
export const AuditLogsService = {
  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogsResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.userId !== undefined) queryParams.append('userId', filters.userId.toString());
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entity) queryParams.append('entity', filters.entity);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());
      if (filters.offset !== undefined) queryParams.append('offset', filters.offset.toString());
    }

    const query = queryParams.toString();
    const path = `audit-logs${query ? `?${query}` : ''}`;
    
    return await http.get(path);
  },

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: number): Promise<AuditLog> {
    return await http.get(`audit-logs/${id}`);
  },
};
