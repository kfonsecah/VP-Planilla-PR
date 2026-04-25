import { AuditLog, AuditLogFilters, AuditLogsResponse } from '@/types/auditLog';
import { http } from './http';

function buildAuditLogQueryParams(filters?: AuditLogFilters): URLSearchParams {
  const queryParams = new URLSearchParams();
  if (!filters) return queryParams;
  if (filters.userId !== undefined) queryParams.append('userId', filters.userId.toString());
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.entity) queryParams.append('entity', filters.entity);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) queryParams.append('offset', filters.offset.toString());
  return queryParams;
}

/**
 * Service for managing audit logs
 */
export const AuditLogsService = {
  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogsResponse> {
    const queryParams = buildAuditLogQueryParams(filters);
    const query = queryParams.toString();
    const suffix = query ? `?${query}` : '';
    const path = `audit-logs${suffix}`;
    return await http.get(path);
  },

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: number): Promise<AuditLog> {
    return await http.get(`audit-logs/${id}`);
  },
};
