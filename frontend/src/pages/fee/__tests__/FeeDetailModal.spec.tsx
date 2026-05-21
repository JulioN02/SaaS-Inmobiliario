/* =============================================================================
   SaaS Inmobiliario — FeeDetailModal Tests
   ============================================================================= */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeeDetailModal } from '../components/FeeDetailModal';
import type { Fee } from '../../types/fee';

// Mock shared components to focus on FeeDetailModal logic
vi.mock('../../../components/Shared/Modal', () => ({
  Modal: ({ isOpen, title, children, footer }: any) =>
    isOpen ? (
      <div role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <div>{children}</div>
        {footer && <div>{footer}</div>}
      </div>
    ) : null,
}));

vi.mock('../../../components/Shared/StatusBadge', () => ({
  StatusBadge: ({ variant, children }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
  feeStatusVariant: (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'PARTIAL': return 'info';
      default: return 'neutral';
    }
  },
}));

describe('FeeDetailModal', () => {
  const mockFee: Fee = {
    id: 'fee-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    unitIdentifier: 'Apto 101',
    amount: 500000,
    period: '2026-05',
    status: 'PENDING',
    feeType: 'PERIODIC',
    dueDate: '2026-05-31',
    description: 'Cuota de mantenimiento mayo',
    createdBy: 'user-1',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  };

  const onClose = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fee details: amount, status, period, dueDate, type', () => {
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Detalle de Cuota')).toBeInTheDocument();
    expect(screen.getByText('$500.000')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('2026-05')).toBeInTheDocument();
    expect(screen.getByText('Periódica')).toBeInTheDocument();
    expect(screen.getByText('Apto 101')).toBeInTheDocument();
  });

  it('shows description when present', () => {
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Cuota de mantenimiento mayo')).toBeInTheDocument();
  });

  it('does not show description section when none provided', () => {
    const feeWithoutDescription = { ...mockFee, description: undefined };
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={feeWithoutDescription}
        onEdit={onEdit}
      />
    );

    expect(screen.queryByText('Cuota de mantenimiento mayo')).not.toBeInTheDocument();
  });

  it('shows Editar Cuota button that calls onEdit with the fee', () => {
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByText((content) => content.includes('Editar Cuota'));
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockFee);
  });

  it('shows empty state when fee is null', () => {
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={null}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Detalle de Cuota')).toBeInTheDocument();
    expect(screen.queryByText('$500.000')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar Cuota')).not.toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <FeeDetailModal
        isOpen={false}
        onClose={onClose}
        fee={mockFee}
        onEdit={onEdit}
      />
    );

    expect(screen.queryByText('Detalle de Cuota')).not.toBeInTheDocument();
  });

  it('shows propertyName when present', () => {
    const feeWithProperty = {
      ...mockFee,
      propertyName: 'Conjunto Residencial Los Alamos',
    };
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={feeWithProperty}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Conjunto Residencial Los Alamos')).toBeInTheDocument();
  });

  it('shows paid amount when paidAmount is present', () => {
    const partialFee = {
      ...mockFee,
      status: 'PARTIAL' as const,
      paidAmount: 250000,
    };
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={partialFee}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('$250.000')).toBeInTheDocument();
  });

  it('shows em dash for paidAmount when not present', () => {
    render(
      <FeeDetailModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onEdit={onEdit}
      />
    );

    // Both propertyName and paidAmount show em dash when absent
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
