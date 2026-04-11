import React from 'react';
import { render, screen } from '@testing-library/react';
import ClockLogStatusBadge from '@/components/ClockLogStatusBadge';

describe('ClockLogStatusBadge', () => {
  it('renders pending status with gray class', () => {
    render(<ClockLogStatusBadge status="pending" />);
    const badge = screen.getByText('Pendiente');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('renders valid status with green class', () => {
    render(<ClockLogStatusBadge status="valid" />);
    const badge = screen.getByText('Valida');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders anomaly status with amber class', () => {
    render(<ClockLogStatusBadge status="anomaly" />);
    const badge = screen.getByText('Anomalia');
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('renders orphan status with red class', () => {
    render(<ClockLogStatusBadge status="orphan" />);
    const badge = screen.getByText('Huerfana');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders corrected status with blue class', () => {
    render(<ClockLogStatusBadge status="corrected" />);
    const badge = screen.getByText('Corregida');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders unknown status with gray neutral class', () => {
    render(<ClockLogStatusBadge status="unknown" />);
    const badge = screen.getByText('unknown');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-600');
  });

  it('applies rounded-full class', () => {
    render(<ClockLogStatusBadge status="pending" />);
    const badge = screen.getByText('Pendiente');
    expect(badge).toHaveClass('rounded-full');
  });
});
