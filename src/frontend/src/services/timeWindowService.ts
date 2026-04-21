import { http } from './http';

export interface TimeWindow {
  time_window_id: number;
  time_window_name: string;
  time_window_type: string;
  time_window_start_hour: string;
  time_window_end_hour: string;
}

export interface CreateTimeWindowInput {
  companyId: number;
  name: string;
  type: 'IN' | 'OUT';
  startHour: string;
  endHour: string;
}

export interface UpdateTimeWindowInput {
  name?: string;
  type?: 'IN' | 'OUT';
  startHour?: string;
  endHour?: string;
}

export const timeWindowService = {
  getAll: async (): Promise<TimeWindow[]> => {
    return await http.get('/time-windows') as TimeWindow[];
  },

  create: async (data: CreateTimeWindowInput): Promise<TimeWindow> => {
    return await http.post('/time-windows', data) as TimeWindow;
  },

  update: async (id: number, data: UpdateTimeWindowInput): Promise<TimeWindow> => {
    return await http.put(`/time-windows/${id}`, data) as TimeWindow;
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`/time-windows/${id}`);
  },
};
