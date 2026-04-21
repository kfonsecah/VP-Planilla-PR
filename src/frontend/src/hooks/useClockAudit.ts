import { useState, useCallback } from 'react';
import { dayConfirmationService } from '../services/dayConfirmationService';

export function useClockAudit() {
  const [isLoading, setIsLoading] = useState(false);

  const confirmDay = useCallback(async (employeeId: number, date: string) => {
    setIsLoading(true);
    try {
      await dayConfirmationService.upsert(employeeId, date);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, confirmDay };
}
