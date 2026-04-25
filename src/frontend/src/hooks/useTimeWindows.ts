import { useState, useCallback, useEffect } from 'react';
import { timeWindowService, TimeWindow } from '../services/timeWindowService';

export function useTimeWindows() {
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWindows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await timeWindowService.getAll();
      setWindows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWindows();
  }, [fetchWindows]);

  return { windows, isLoading };
}
