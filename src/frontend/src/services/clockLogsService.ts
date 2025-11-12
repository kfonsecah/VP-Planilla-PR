import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ClockLog {
  id: number;
  employee_id: number;
  employee_name?: string;
  timestamp: string;
  log_type: 'IN' | 'OUT';
  remarks?: string;
  version: number;
}

export interface AttendanceSummary {
  employee_id: number;
  employee_name: string;
  date: string;
  logs: ClockLog[];
  hours_worked: number;
  check_in: string | null;
  check_out: string | null;
  inconsistencies: string[];
}

export const ClockLogsService = {
  async getClockLogs(initDate: string, endDate: string): Promise<ClockLog[]> {
    const response = await axios.get(`${API_URL}/clock-logs`, {
      params: { initDate, endDate }
    });
    return response.data;
  },

  async getAttendanceSummary(initDate: string, endDate: string): Promise<AttendanceSummary[]> {
    const response = await axios.get(`${API_URL}/clock-logs/attendance`, {
      params: { initDate, endDate }
    });
    return response.data;
  },

  async updateClockLog(id: number, data: Partial<ClockLog>): Promise<ClockLog> {
    const response = await axios.put(`${API_URL}/clock-logs/${id}`, data);
    return response.data;
  }
};
