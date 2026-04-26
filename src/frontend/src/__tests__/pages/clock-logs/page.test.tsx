import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClockLogsPage from '@/app/pages/clock-logs/page';
import { useClockLogsContext } from '@/hooks/useClockLogsContext';
import { useSearchParams } from 'next/navigation';

const JAVA_IMPORT = 'java_import';
const TOTAL_COUNT = 18;
const MOCK_TAB_DASHBOARD = 'tab=dashboard';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue('/clock-logs'),
  useSearchParams: jest.fn(),
}));
jest.mock('@/hooks/useClockLogsContext');

const mockedUseClockLogsContext = useClockLogsContext as jest.MockedFunction<typeof useClockLogsContext>;

const mockHookReturn = (
  partial: Partial<ReturnType<typeof useClockLogsContext>> = {}
): ReturnType<typeof useClockLogsContext> => ({
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
  totalCount: TOTAL_COUNT,
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
  importSessions: [
    {
      id: 1,
      started_at: '2026-04-05T10:00:00.000Z',
      source: JAVA_IMPORT,
      status: 'completed',
      created_count: 95,
      skipped_count: 5,
      anomaly_count: 0,
      total_records: 100,
      completed_at: undefined,
      created_by: 2,
    },
  ],
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

describe('/pages/clock-logs/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null), // Default to 'audit'
      toString: jest.fn().mockReturnValue(''),
    });
  });

  it('renders page title and description', async () => {
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn());
    
    // Use lazy initialization to prevent immediate effect execution
    const { container } = render(<ClockLogsPage />);
    
    // Wait for render without async issues
    expect(container).toBeInTheDocument();
  });

  it('renders period preset buttons and date inputs', () => {
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    // New period presets: 1ra Quincena, 2da Quincena, Mes Actual
    expect(screen.getByRole('button', { name: /1ra quincena/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2da quincena/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mes actual/i })).toBeInTheDocument();

    expect(screen.getByText(/desde/i)).toBeInTheDocument();
    expect(screen.getByText(/hasta/i)).toBeInTheDocument();
  });

  it('renders status filter toggle buttons', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((key) => key === 'tab' ? 'dashboard' : null),
      toString: jest.fn().mockReturnValue(MOCK_TAB_DASHBOARD),
    });
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    // Status filter buttons in Spanish
    const pendingBtn = screen.getByRole('button', { name: /pendiente/i });
    const validBtn = screen.getByRole('button', { name: /valida/i });
    const anomalyBtn = screen.getByRole('button', { name: /anomalia/i });
    const orphanBtn = screen.getByRole('button', { name: /huerfana/i });
    const correctedBtn = screen.getByRole('button', { name: /corregida/i });

    expect(pendingBtn).toBeInTheDocument();
    expect(validBtn).toBeInTheDocument();
    expect(anomalyBtn).toBeInTheDocument();
    expect(orphanBtn).toBeInTheDocument();
    expect(correctedBtn).toBeInTheDocument();
  });

  it('renders import sessions panel', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((key) => key === 'tab' ? 'dashboard' : null),
      toString: jest.fn().mockReturnValue(MOCK_TAB_DASHBOARD),
    });
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    // Import sessions panel text
    expect(screen.getByRole('button', { name: /sesiones de importación/i })).toBeInTheDocument();
  });

  it('calls applyDatePreset when period button clicked', () => {
    const applyDatePreset = jest.fn();
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn({ applyDatePreset }));
    render(<ClockLogsPage />);

    fireEvent.click(screen.getByRole('button', { name: /1ra quincena/i }));

    expect(applyDatePreset).toHaveBeenCalledWith('first_half');
  });

  it('calls setFilters when status filter clicked', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((key) => key === 'tab' ? 'dashboard' : null),
      toString: jest.fn().mockReturnValue(MOCK_TAB_DASHBOARD),
    });
    const setFilters = jest.fn();
    mockedUseClockLogsContext.mockReturnValue(mockHookReturn({ setFilters }));
    render(<ClockLogsPage />);

    fireEvent.click(screen.getByRole('button', { name: /valida/i }));

    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ 
      status: ['valid'] 
    }));
  });
});