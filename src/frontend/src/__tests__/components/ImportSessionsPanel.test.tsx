import React from 'react';
import { render, screen } from '@testing-library/react';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import { ImportSession } from '@/services/clockLogsService';

describe('ImportSessionsPanel', () => {
  const mockSessions: ImportSession[] = [
    {
      id: 1,
      started_at: '2026-04-05T10:00:00.000Z',
      completed_at: '2026-04-05T10:30:00.000Z',
      source: 'java_import',
      status: 'completed',
      total_records: 100,
      created_count: 95,
      skipped_count: 5,
      anomaly_count: 3,
      created_by: 2,
    },
    {
      id: 2,
      started_at: '2026-04-04T09:00:00.000Z',
      source: 'excel_import',
      status: 'failed',
      total_records: 50,
      created_count: 0,
      skipped_count: 50,
      anomaly_count: 0,
      created_by: 1,
    },
  ];

  it('renders loading state', () => {
    render(<ImportSessionsPanel sessions={[]} isLoading={true} />);
    expect(screen.getByText(/cargando sesiones/i)).toBeInTheDocument();
  });

  it('renders empty state when no sessions and not loading', () => {
    render(<ImportSessionsPanel sessions={[]} isLoading={false} />);
    expect(screen.getByText(/no hay sesiones de importación recientes/i)).toBeInTheDocument();
  });

  it('renders sessions with formatted columns', () => {
    render(<ImportSessionsPanel sessions={mockSessions} isLoading={false} />);

    // Check dates formatted (locale es-CR) — we just check that the date strings are present in some form
    expect(screen.getByText(/5\/4\/2026/)).toBeInTheDocument();

    // Check source labels
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('Completada')).toBeInTheDocument();
    expect(screen.getByText('Fallida')).toBeInTheDocument();

    // Check counts
    expect(screen.getByText('95')).toBeInTheDocument(); // created_count first session
    expect(screen.getByText('5')).toBeInTheDocument();  // skipped_count first session
    expect(screen.getByText('0')).toBeInTheDocument(); // created_count for failed
    expect(screen.getByText('50')).toBeInTheDocument(); // skipped_count for failed
  });

  it('handles missing completed_at', () => {
    const sessionWithoutCompleted = {
      ...mockSessions[0],
      completed_at: undefined,
    };
    render(<ImportSessionsPanel sessions={[sessionWithoutCompleted]} isLoading={false} />);

    // Should still render without error
    expect(screen.getByText('Java')).toBeInTheDocument();
  });
});
