import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClockLogsPage from '@/app/pages/clock-logs/page';
import { useEffectiveMarks } from '@/hooks/useEffectiveMarks';
import { useClockLogsContext } from '@/hooks/useClockLogsContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/hooks/useClockLogsContext');
const mockedUseClockLogsContext = useClockLogsContext as jest.MockedFunction<typeof useClockLogsContext>;

jest.mock('@/hooks/useTimeWindows', () => ({
  useTimeWindows: jest.fn().mockReturnValue({ windows: [] }),
}));

const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const mockHookReturn = (
  partial: Partial<ReturnType<typeof useEffectiveMarks>> = {}
): any => ({
  data: [
    {
      id: '1-2026-02-02-1-2',
      employee_id: '101',
      employee_name: 'Ana García',
      branch_name: 'Main Branch',
      log_date: '2026-02-02',
      original: {
        in_time: '2026-02-02T08:00:00.000Z',
        out_time: '2026-02-02T17:00:00.000Z',
        in_log_id: 1,
        out_log_id: 2,
        status: 'valid',
        source: 'device',
      },
      calculated_hours: 8,
    },
  ],
  totalCount: 1,
  page: 1,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  filters: {
    initDate: '2026-04-16',
    endDate: '2026-04-30',
    status: [],
    branch_id: undefined,
  },
  importSessions: [],
  setFilters: jest.fn(),
  applyDatePreset: jest.fn(),
  loadMore: jest.fn(),
  refresh: jest.fn(),
  confirmDay: jest.fn(),
  fetchConfirmations: jest.fn(),
  confirmedDays: new Set(),
  clearedDays: new Set(),
  addMarkInline: jest.fn(),
  changeMarkTypeInline: jest.fn(),
  voidMarkInline: jest.fn(),
  ...partial,
});

describe('ClockLogsPage - URL Persistence (Phase 49)', () => {
  const mockReplace = jest.fn();
  const mockPathname = '/clock-logs';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ replace: mockReplace, push: jest.fn() } as any);
    mockedUsePathname.mockReturnValue(mockPathname);
    mockedUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      toString: jest.fn().mockReturnValue(''),
    } as any);
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn());
  });

  it('derives activeTab from URL "tab" parameter', () => {
    mockedUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'tab' ? 'audit' : null),
      toString: () => 'tab=audit',
    } as any);

    render(<ClockLogsPage />);

    // Audit tab should be active (green bg in class)
    const auditTabBtn = screen.getByRole('button', { name: /auditoría por jornada/i });
    expect(auditTabBtn).toHaveClass('bg-green-600');
  });

  it('updates URL when changing tabs', () => {
    render(<ClockLogsPage />);

    const auditTabBtn = screen.getByRole('button', { name: /auditoría por jornada/i });
    fireEvent.click(auditTabBtn);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('tab=audit'),
      expect.objectContaining({ scroll: false })
    );
  });

  it('derives expandedEmployees from URL "expanded" parameter', () => {
    mockedUseSearchParams.mockReturnValue({
      get: (key: string) => {
        if (key === 'tab') return 'audit';
        if (key === 'expanded') return '101';
        return null;
      },
      toString: () => 'tab=audit&expanded=101',
    } as any);

    render(<ClockLogsPage />);
    screen.debug();

    // If expanded, the AuditDayRow (or its container) should be visible
    // The implementation shows days when isExpanded is true
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    // Use a more flexible regex for the date and check for marks count
    expect(screen.getByText(/02/)).toBeInTheDocument();
    expect(screen.getByText(/2 marcas/i)).toBeInTheDocument();
  });

  it('updates URL when toggling employee expansion', () => {
    mockedUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'tab' ? 'audit' : null),
      toString: () => 'tab=audit',
    } as any);

    render(<ClockLogsPage />);

    const empBtn = screen.getByRole('button', { name: /ana garcía/i });
    fireEvent.click(empBtn);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('expanded=101'),
      expect.objectContaining({ scroll: false })
    );
  });

  it('clears "expanded" parameter when date filters change', async () => {
    // Initial state: tab=audit and expanded=101
    mockedUseSearchParams.mockReturnValue({
      get: (key: string) => {
        if (key === 'tab') return 'audit';
        if (key === 'expanded') return '101';
        return null;
      },
      toString: () => 'tab=audit&expanded=101',
    } as any);

    const { rerender } = render(<ClockLogsPage />);

    // Simulate filter change by re-rendering with different filter values from hook
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn({
      filters: { initDate: '2026-05-01', endDate: '2026-05-15', status: [] }
    }));

    rerender(<ClockLogsPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.not.stringContaining('expanded=101'),
        expect.objectContaining({ scroll: false })
      );
    });
  });
});
