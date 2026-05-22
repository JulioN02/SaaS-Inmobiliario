/* =============================================================================
   SaaS Inmobiliario — FeeStatusModal Tests
   ============================================================================= */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeeStatusModal } from '../components/FeeStatusModal';
import type { Fee } from '../../../types/fee';

// Mock shared components to focus on FeeStatusModal logic
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

vi.mock('../../../components/Shared/FormField', () => ({
  FormField: ({ label, name, as, value, onChange, required, options, placeholder, type }: any) => {
    const fieldId = name ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div>
        <label htmlFor={fieldId}>
          {label}
          {required && <span>*</span>}
        </label>
        {as === 'select' ? (
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            data-testid={`field-${name}`}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={fieldId}
            name={name}
            type={type ?? 'text'}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            data-testid={`field-${name}`}
          />
        )}
      </div>
    );
  },
}));

describe('FeeStatusModal', () => {
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
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status selector with Pendiente, Pagado, Parcial options', () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Actualizar Estado de Cuota')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Estado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Parcial')).toBeInTheDocument();
  });

  it('shows monto pagado input when status is PARTIAL', async () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId('field-status'), { target: { value: 'PARTIAL' } });

    await waitFor(() => {
      expect(screen.getByText('Monto Pagado')).toBeInTheDocument();
    });
  });

  it('shows monto pagado input when status is PAID', async () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId('field-status'), { target: { value: 'PAID' } });

    await waitFor(() => {
      expect(screen.getByText('Monto Pagado')).toBeInTheDocument();
    });
  });

  it('hides monto pagado input when status is PENDING', () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByTestId('field-status')).toHaveValue('PENDING');
    expect(screen.queryByText('Monto Pagado')).not.toBeInTheDocument();
  });

  it('calls onSubmit with fee id and data when submitted', async () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId('field-status'), { target: { value: 'PAID' } });

    await waitFor(() => {
      expect(screen.getByTestId('field-paidAmount')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('field-paidAmount'), { target: { value: '500000' } });
    fireEvent.click(screen.getByText('Actualizar Estado'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('fee-1', {
        status: 'PAID',
        paidAmount: 500000,
      });
    });
  });

  it('submits without paidAmount when field is empty', async () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId('field-status'), { target: { value: 'PAID' } });

    await waitFor(() => {
      expect(screen.getByTestId('field-paidAmount')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Actualizar Estado'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('fee-1', {
        status: 'PAID',
        paidAmount: undefined,
      });
    });
  });

  it('calls onClose when Cancelar is clicked', () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows fee info (description, amount, unit) when fee is provided', () => {
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(/Cuota de mantenimiento mayo/)).toBeInTheDocument();
    expect(screen.getByText(/\$500\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Apto 101/)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <FeeStatusModal
        isOpen={false}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.queryByText('Actualizar Estado de Cuota')).not.toBeInTheDocument();
  });

  it('initializes status from fee.status on open', () => {
    const paidFee = { ...mockFee, status: 'PAID' as const };
    render(
      <FeeStatusModal
        isOpen={true}
        onClose={onClose}
        fee={paidFee}
        onSubmit={onSubmit}
      />
    );

    const statusSelect = screen.getByTestId('field-status') as HTMLSelectElement;
    expect(statusSelect.value).toBe('PAID');
  });
});
