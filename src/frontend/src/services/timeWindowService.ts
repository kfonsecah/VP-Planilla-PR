import { http } from './http';

export interface TimeWindow {
  time_window_id: number;
  time_window_name: string;
  time_window_type: string;
  time_window_start_hour: string;
  time_window_end_hour: string;
}

export const timeWindowService = {
  getAll: async (): Promise<TimeWindow[]> => {
    return await http.get('/api/time-windows') as TimeWindow[];
  }
};
