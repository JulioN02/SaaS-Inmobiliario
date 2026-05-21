/* =============================================================================
   SaaS Inmobiliario — FeeEditModal Tests
   ============================================================================= */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeeEditModal } from '../components/FeeEditModal';
import type { Fee } from '../../types/fee';

// Mock shared components to focus on FeeEditModal logic
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
  FormField: ({ label, name, as, value, onChange, placeholder, type }: any) => {
    const fieldId = name ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div>
        <label htmlFor={fieldId}>{label}</label>
        {as === 'textarea' ? (
          <textarea
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            data-testid={`field-${name}`}
          />
        ) : (
          <input
            id={fieldId}
            name={name}
            type={type ?? 'text'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            data-testid={`field-${name}`}
          />
        )}
      </div>
    );
  },
}));

describe('FeeEditModal', () => {
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

  it('renders edit form with pre-filled values', () => {
    render(
      <FeeEditModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Editar Cuota')).toBeInTheDocument();

    const amountInput = screen.getByTestId('field-amount') as HTMLInputElement;
    expect(amountInput.value).toBe('500000');

    const dueDateInput = screen.getByTestId('field-dueDate') as HTMLInputElement;
    expect(dueDateInput.value).toBe('2026-05-31');

    const descInput = screen.getByTestId('field-description') as HTMLInputElement;
    expect(descInput.value).toBe('Cuota de mantenimiento mayo');
  });

  it('renders submit button with label Guardar Cambios', () => {
    render(
      <FeeEditModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
  });

  it('calls onSubmit with fee id and dto when form is submitted', async () => {
    render(
      <FeeEditModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    const amountInput = screen.getByTestId('field-amount');
    fireEvent.change(amountInput, { target: { value: '600000' } });

    fireEvent.click(screen.getByText('Guardar Cambios'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('fee-1', {
        amount: 600000,
        description: 'Cuota de mantenimiento mayo',
        dueDate: '2026-05-31',
      });
    });
  });

  it('calls onClose when Cancelar is clicked', () => {
    render(
      <FeeEditModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Guardando... when submitting', async () => {
    const slowOnSubmit = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <FeeEditModal
        isOpen={true}
        onClose={onClose}
        fee={mockFee}
        onSubmit={slowOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Guardar Cambios'));

    await waitFor(() => {
      expect(screen.getByText('Guardando...')).toBeInTheDocument();
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <FeeEditModal
        isOpen={false}
        onClose={onClose}
        fee={mockFee}
        onSubmit={onSubmit}
      />
    );

    expect(screen.queryByText('Editar Cuota')).not.toBeInTheDocument();
  });

  it('shows empty form when fee is null', () => {
    render(
      <FeeEditModal
        isOpen={true}
        onClose={onClose}
        fee={null}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Editar Cuota')).toBeInTheDocument();
    const amountInput = screen.getByTestId('field-amount') as HTMLInputElement;
    expect(amountInput.value).toBe('');
  });
});
