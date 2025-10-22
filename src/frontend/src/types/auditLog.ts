/**
 * Audit Log Types
 * Tipos para logs de auditoría del sistema
 */

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id: number;
  timestamp: Date;
  details?: string;
}

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogsResponse {
  success: boolean;
  data?: AuditLog[];
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
  message?: string;
}
