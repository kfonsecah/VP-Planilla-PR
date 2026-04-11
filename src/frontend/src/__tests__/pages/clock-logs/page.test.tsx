import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClockLogsPage from '@/app/pages/clock-logs/page';
import { useClockLogs } from '@/hooks/useClockLogs';

jest.mock('@/hooks/useClockLogs');

const mockedUseClockLogs = useClockLogs as jest.MockedFunction<typeof useClockLogs>;

const mockHookReturn = (
  partial: Partial<ReturnType<typeof useClockLogs>> = {}
): ReturnType<typeof useClockLogs> => ({
  stats: {
    byStatus: { pending: 5, valid: 10, anomaly: 2, orphan: 1, corrected: 0 },
    bySource: { java_import: 10, excel_import: 5, manual: 3 },
    total: 18,
  },
  logs: [
    {
      id: 1,
      employee_id: 101,
      employee_name: 'Ana García',
      timestamp: '2026-02-02T08:00:00.000Z',
      log_type: 'IN',
      status: 'anomaly',
      source: 'java_import',
      remarks: 'Test',
    },
  ],
  totalLogs: 18,
  page: 1,
  pageSize: 20,
  importSessions: [
    {
      id: 1,
      started_at: '2026-04-05T10:00:00.000Z',
      source: 'java_import',
      status: 'completed',
      created_count: 95,
      skipped_count: 5,
      anomaly_count: 0,
      total_records: 100,
      completed_at: undefined,
      created_by: 2,
    },
  ],
  isLoading: false,
  isStatsLoading: false,
  error: null,
  filters: {
    initDate: '2026-04-01',
    endDate: '2026-04-30',
    status: [],
    employee_id: undefined,
  },
  employees: [
    { id: 101, name: 'Ana García' },
    { id: 102, name: 'Luis Pérez' },
  ],
  setPage: jest.fn(),
  setFilters: jest.fn(),
  applyDatePreset: jest.fn(),
  refresh: jest.fn(),
  ...partial,
});

describe('/pages/clock-logs/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title and description', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    expect(screen.getByRole('heading', { name: /dashboard de marcas/i })).toBeInTheDocument();
  });

  it('renders date preset buttons and date inputs', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    expect(screen.getByRole('button', { name: /hoy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ultimos 7 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /este mes/i })).toBeInTheDocument();

    expect(screen.getByText(/desde/i)).toBeInTheDocument();
    expect(screen.getByText(/hasta/i)).toBeInTheDocument();
  });

  it('renders status cards when counts > 0, hides zero-count cards', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    // Check that cards for statuses with count > 0 are visible
    // We filter by tagName 'P' to ensure we are matching the card title and not the filter button
    expect(screen.getAllByText('Pendiente').find(el => el.tagName === 'P')).toBeInTheDocument();
    expect(screen.getAllByText('Valida').find(el => el.tagName === 'P')).toBeInTheDocument();
    expect(screen.getAllByText('Anomalia').find(el => el.tagName === 'P')).toBeInTheDocument();
    expect(screen.getAllByText('Huerfana').find(el => el.tagName === 'P')).toBeInTheDocument();
    
    // corrected count is 0 -> card should be absent (only the filter button should exist)
    const correctedElements = screen.queryAllByText('Corregida');
    expect(correctedElements.find(el => el.tagName === 'P')).toBeUndefined();
    expect(correctedElements.find(el => el.tagName === 'BUTTON')).toBeDefined();
  });

  it('renders status filter toggle buttons', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    // Buttons should be present; they likely have text of statuses
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

  it('renders employee autocomplete input with datalist', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    const input = screen.getByPlaceholderText(/buscar empleado/i);
    expect(input).toHaveAttribute('list', 'employees-datalist');

    const datalistElement = document.getElementById('employees-datalist');
    expect(datalistElement).toBeInTheDocument();
    // Check options: the datalist should have options for employees
    const options = datalistElement?.querySelectorAll('option');
    expect(options?.length).toBe(2);
    expect(options?.[0]).toHaveValue('Ana García');
  });

  it('renders import sessions panel', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    expect(screen.getByText(/sesiones de importación recientes/i)).toBeInTheDocument();
    // Check some column headers exist, e.g., Fecha, Fuente, Estado, Creados, Omitidos
    // We can approximate based on text content
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Fuente')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('renders table with correct columns and data', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    // Column headers
    expect(screen.getByRole('columnheader', { name: /empleado/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /timestamp/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /tipo/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /source/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /acciones/i })).toBeInTheDocument();

    // Row data
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('IN')).toBeInTheDocument();
    // Buttons: Ver or Corregir depending on status. For anomaly, should be Corregir.
    expect(screen.getByRole('button', { name: /corregir/i })).toBeInTheDocument();
  });

  it('renders pagination controls with correct counts', () => {
    mockedUseClockLogs.mockReturnValue(mockHookReturn());
    render(<ClockLogsPage />);

    expect(screen.getByText(/mostrando 1–18 de 18 marcas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled(); // page 1, previous disabled
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled(); // page 1 of 1, next disabled
  });

  it('calls setPage when pagination buttons clicked', () => {
    const setPage = jest.fn();
    // To have 'Siguiente' enabled, we need totalLogs > pageSize
    mockedUseClockLogs.mockReturnValue(mockHookReturn({ setPage, totalLogs: 50, pageSize: 20 }));
    render(<ClockLogsPage />);

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    expect(setPage).toHaveBeenCalledWith(2);
  });

  it('calls setFilters when employee selected from autocomplete', () => {
    const setFilters = jest.fn();
    mockedUseClockLogs.mockReturnValue(mockHookReturn({ setFilters }));
    render(<ClockLogsPage />);

    const input = screen.getByPlaceholderText(/buscar empleado/i);
    fireEvent.change(input, { target: { value: 'Ana' } });
    fireEvent.change(input, { target: { value: 'Ana García' } }); // selection from datalist would set value

    // Actually selecting from datalist triggers change event as well.
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ employee_id: 101 }));
  });

  it('calls applyDatePreset when preset button clicked', () => {
    const applyDatePreset = jest.fn();
    mockedUseClockLogs.mockReturnValue(mockHookReturn({ applyDatePreset }));
    render(<ClockLogsPage />);

    fireEvent.click(screen.getByRole('button', { name: /hoy/i }));

    expect(applyDatePreset).toHaveBeenCalledWith('today');
  });
});
