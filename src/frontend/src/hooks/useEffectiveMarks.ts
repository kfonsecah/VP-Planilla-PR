"use client";

import { useClockLogsContext } from './useClockLogsContext';

/**
 * Hook to access effective marks state and logic.
 * now wraps the global ClockLogsContext.
 */
export function useEffectiveMarks() {
  const context = useClockLogsContext();
  
  return {
    data: context.data,
    totalCount: context.totalCount,
    page: context.page,
    hasMore: context.hasMore,
    isLoading: context.isLoading,
    isLoadingMore: context.isLoadingMore,
    error: context.error,
    filters: context.filters,
    importSessions: context.importSessions,
    setFilters: context.setFilters,
    applyDatePreset: context.applyDatePreset,
    loadMore: context.loadMore,
    refresh: context.refresh,
  };
}
