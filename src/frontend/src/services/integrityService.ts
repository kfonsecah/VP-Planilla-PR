import { http } from './http';

export interface IntegrityAlert {
  code: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  entity: 'EMPLOYEE' | 'PAYROLL' | 'CLOCK_LOG' | 'POSITION';
  message: string;
  affectedCount: number;
  sampleIds: number[];
}

export interface IntegrityDashboardStatus {
  healthScore: number;
  totalAlerts: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  lastAuditAt: string | null;
  alerts: IntegrityAlert[];
}

/**
 * Service to handle data integrity operations.
 */
export const integrityService = {
  /**
   * Fetches the current integrity status for the dashboard.
   */
  getDashboardStatus: (): Promise<IntegrityDashboardStatus> => 
    http.get('/integrity/dashboard'),

  /**
   * Triggers a manual integrity audit and returns fresh results.
   */
  runAudit: (): Promise<IntegrityAlert[]> => 
    http.post('/integrity/audit')
};
