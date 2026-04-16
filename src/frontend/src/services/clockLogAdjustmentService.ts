'use client';

import { http } from '@/services/http';

export interface AddClockLogPayload {
  employeeId: string;
  timestamp: string; // ISO 8601
  type: 'IN' | 'OUT';
  justification: string;
}

export interface ClockLog {
  id: string;
  employeeId: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  source: 'DEVICE' | 'MANUAL';
  adjustmentId?: string;
  createdAt: string;
  createdBy: string;
}

export interface EditClockLogPayload {
  timestamp: string;
  justification: string;
}

export interface VoidClockLogPayload {
  justification: string;
}

/**
 * Service for clock log adjustments (ADD, EDIT, VOID)
 * Communicates with POST /api/clock-logs/adjust
 */
export const clockLogAdjustmentService = {
  /**
   * Add a new clock log mark
   */
  async addClockLog(payload: AddClockLogPayload): Promise<ClockLog> {
    const response = await http.post('/clock-logs/adjust', {
      type: 'ADD',
      employee_id: Number(payload.employeeId),
      new_timestamp: payload.timestamp,
      log_type: payload.type,
      justification: payload.justification,
    });
    return response as ClockLog;
  },

  /**
   * Edit an existing clock log timestamp (non-destructive)
   */
  async editClockLog(id: string, timestamp: string, type: 'IN' | 'OUT', justification: string): Promise<ClockLog> {
    const response = await http.post('/clock-logs/adjust', {
      type: 'EDIT',
      clock_log_id: Number(id),
      new_timestamp: timestamp,
      log_type: type,
      justification,
    });
    return response as ClockLog;
  },

  /**
   * Void/annul a clock log (soft delete)
   */
  async voidClockLog(id: string, type: 'IN' | 'OUT', justification: string): Promise<ClockLog> {
    const response = await http.post('/clock-logs/adjust', {
      type: 'VOID',
      clock_log_id: Number(id),
      log_type: type,
      justification,
    });
    return response as ClockLog;
  },
};