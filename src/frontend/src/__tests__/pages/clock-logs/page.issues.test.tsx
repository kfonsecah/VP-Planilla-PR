import React from 'react';
import { render, screen } from '@testing-library/react';
import ClockLogsPage from '@/app/pages/clock-logs/page';
import { useClockLogsContext } from '@/hooks/useClockLogsContext';
import { useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ replace: jest.fn() }),
  usePathname: jest.fn().mockReturnValue('/clock-logs'),
  useSearchParams: jest.fn().mockReturnValue({ get: jest.fn(), toString: jest.fn().mockReturnValue('') }),
}));

jest.mock('@/hooks/useClockLogsContext');
jest.mock('@/hooks/useTimeWindows', () => ({
  useTimeWindows: jest.fn().mockReturnValue({ windows: [] }),
}));

const mockedUseClockLogsContext = useClockLogsContext as jest.MockedFunction<typeof useClockLogsContext>;

describe('ClockLogsPage - has_issues logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockData = (status: 'pending' | 'valid' | 'anomaly' | 'corrected' | 'orphan') => [
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
        status,
        source: 'device' as const,
      },
      calculated_hours: 8,
    },
  ];

  const mockContextValue = (data: ReturnType<typeof mockData>, clearedDays: Set<string> = new Set()): ReturnType<typeof useClockLogsContext> => ({
    data,
    filters: { initDate: '2026-01-01', endDate: '2026-01-15' },
    importSessions: [],
    clearedDays,
    confirmedDays: new Set(),
    fetchConfirmations: jest.fn(),
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    totalCount: data.length,
    page: 1,
    error: null,
    setFilters: jest.fn(),
    applyDatePreset: jest.fn(),
    loadMore: jest.fn(),
    refresh: jest.fn(),
    confirmDay: jest.fn(),
    addMarkInline: jest.fn(),
    changeMarkTypeInline: jest.fn(),
    voidMarkInline: jest.fn(),
  });

  it('shows NO issues for LOW confidence + valid status', () => {
    mockedUseClockLogsContext.mockReturnValue(mockContextValue(mockData('valid')));

    render(<ClockLogsPage />);

    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((key: string) => key === 'tab' ? 'audit' : null),
      toString: jest.fn().mockReturnValue('tab=audit'),
    });

    render(<ClockLogsPage />);

    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).not.toBeInTheDocument();
  });

  it('shows issues for anomaly status', () => {
    mockedUseClockLogsContext.mockReturnValue(mockContextValue(mockData('anomaly')));

    render(<ClockLogsPage />);

    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).toBeInTheDocument();
  });

  it('hides issues optimistically if the day is in clearedDays', () => {
    mockedUseClockLogsContext.mockReturnValue(
      mockContextValue(mockData('anomaly'), new Set(['101_2026-02-02']))
    );

    render(<ClockLogsPage />);

    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).not.toBeInTheDocument();
  });

  it('hides issues for void actions optimistically', () => {
    mockedUseClockLogsContext.mockReturnValue(
      mockContextValue(mockData('orphan'), new Set(['101_2026-02-02']))
    );

    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((key: string) => key === 'tab' ? 'audit' : null),
      toString: jest.fn().mockReturnValue('tab=audit'),
    });

    render(<ClockLogsPage />);

    const issueDot = screen.queryByTitle(/Tiene marcas con problemas/i);
    expect(issueDot).not.toBeInTheDocument();
  });
});
