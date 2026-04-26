"use client";

import { useClockLogsContext } from './useClockLogsContext';

/**
 * Hook to access clock audit state and logic.
 * now wraps the global ClockLogsContext.
 * @param _onRefresh Kept for backward compatibility, but refresh is now handled by the context.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useClockAudit(_onRefresh?: () => void) {
  const context = useClockLogsContext();

  return { 
    isLoading: context.isLoading, 
    confirmDay: context.confirmDay, 
    fetchConfirmations: context.fetchConfirmations, 
    confirmedDays: context.confirmedDays,
    clearedDays: context.clearedDays,
    addMarkInline: context.addMarkInline,
    changeMarkTypeInline: context.changeMarkTypeInline,
    voidMarkInline: context.voidMarkInline
  };
}
