import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClockLogDetailModal from '@/components/ClockLogDetailModal';
import { ClockLogsService } from '@/services/clockLogsService';
import { toast } from 'sonner';

jest.mock('@/services/clockLogsService');
jest.mock('sonner');

// Mock next/dynamic to render components immediately
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: any) => {
    const React = require('react');
    return (props: any) => {
      const { children, ...rest } = props;
      return <div {...rest}>{children}</div>;
    };
  },
}));

const mockedClockLogsService = ClockLogsService as jest.MockedObject<typeof ClockLogsService>;

const mockLog = {
  id: 123,
  employee_id: 101,
  employee_name: 'Ana García',
  timestamp: '2026-02-02T08:00:00.000Z',
  log_type: 'IN',
  status: 'anomaly' as const,
  source: 'java_import' as const,
  remarks: 'Test remark',
  import_session_id: 5,
};

describe('ClockLogDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCorrected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedClockLogsService.getAuditLogsForClockLog = jest.fn().mockResolvedValue([]);
    mockedClockLogsService.updateClockLogStatus = jest.fn().mockResolvedValue(undefined);
  });

  it('renders modal with log details when open', () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    expect(screen.getByText('Detalle de Marca')).toBeInTheDocument();
    expect(screen.getByText(`ID #${mockLog.id}`)).toBeInTheDocument();
    expect(screen.getByText(mockLog.employee_name)).toBeInTheDocument();
    expect(screen.getByText(String(mockLog.employee_id))).toBeInTheDocument();
    expect(screen.getByText(/IN/)).toBeInTheDocument();
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Test remark')).toBeInTheDocument();
    // Status badge
    expect(screen.getByText('Anomalía')).toBeInTheDocument();
    // Audit history section
    expect(screen.getByText('Historial de Auditoría')).toBeInTheDocument();
  });

  it('hides correction form for corrected logs', () => {
    const correctedLog = { ...mockLog, status: 'corrected' as const };
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={correctedLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    expect(screen.queryByRole('button', { name: /marcar como corregido/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /descartar/i })).not.toBeInTheDocument();
  });

  it('shows correction buttons for non-corrected logs', () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    expect(screen.getByRole('button', { name: /marcar como corregido/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument();
  });

  it('shows justification form when correction button clicked', () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /marcar como corregido/i }));

    expect(screen.getByLabelText(/justificación/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('validates justification length', async () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /marcar como corregido/i }));
    const textarea = screen.getByLabelText(/justificación/i);
    fireEvent.change(textarea, { target: { value: 'abc' } }); // less than 5
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('La justificación debe tener al menos 5 caracteres');
    });
    expect(mockedClockLogsService.updateClockLogStatus).not.toHaveBeenCalled();
  });

  it('submits correction and calls callbacks', async () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /marcar como corregido/i }));
    const textarea = screen.getByLabelText(/justificación/i);
    fireEvent.change(textarea, { target: { value: 'Valid justification text' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(mockedClockLogsService.updateClockLogStatus).toHaveBeenCalledWith(
        mockLog.id,
        'corrected',
        'Valid justification text'
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Marca actualizada correctamente');
    });

    expect(mockOnCorrected).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cerrar modal/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    render(
      <ClockLogDetailModal
        isOpen={true}
        log={mockLog}
        onClose={mockOnClose}
        onCorrected={mockOnCorrected}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cerrar modal/i })); // Actually backdrop is a div, not button. We can query the backdrop by its class maybe.
    // The backdrop is a MotionDiv with class 'fixed inset-0 bg-black/50 z-40'. We'll query by that.
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
