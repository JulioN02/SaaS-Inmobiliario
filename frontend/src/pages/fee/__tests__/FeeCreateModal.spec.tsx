/* =============================================================================
   SaaS Inmobiliario — FeeCreateModal Tests
   ============================================================================= */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeeCreateModal } from '../components/FeeCreateModal';

// Mock the API service used inside FeeCreateModal
vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock toast to avoid side effects
vi.mock('../../../stores/toastStore', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock shared components to focus on FeeCreateModal logic
vi.mock('../../../components/Shared/Modal', () => ({
  Modal: ({ isOpen, title, children, footer }: any) =>
    isOpen ? (
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
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
        ) : as === 'textarea' ? (
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
            required={required}
            placeholder={placeholder}
            data-testid={`field-${name}`}
          />
        )}
      </div>
    );
  },
}));

describe('FeeCreateModal', () => {
  const defaultUnits = [
    { id: 'unit-1', identifier: 'Apto 101' },
    { id: 'unit-2', identifier: 'Apto 102' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    units: defaultUnits,
    loadingUnits: false,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with unit selector, amount, period, dueDate, feeType, and description', () => {
    render(<FeeCreateModal {...defaultProps} />);

    expect(screen.getByText('Nueva Cuota')).toBeInTheDocument();
    expect(screen.getByText('Unidad')).toBeInTheDocument();
    expect(screen.getByText('Periodo (YYYY-MM)')).toBeInTheDocument();
    expect(screen.getByText('Fecha de Vencimiento')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Cuota')).toBeInTheDocument();
    expect(screen.getByText('Descripción')).toBeInTheDocument();
  });

  it('renders submit button with label Crear Cuota', () => {
    render(<FeeCreateModal {...defaultProps} />);

    expect(screen.getByText('Crear Cuota')).toBeInTheDocument();
  });

  it('shows Cancelar button that calls onClose', () => {
    render(<FeeCreateModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on submit button when loading is true', () => {
    render(<FeeCreateModal {...defaultProps} loading={true} />);

    expect(screen.getByText('Guardando...')).toBeInTheDocument();
    expect(screen.queryByText('Crear Cuota')).not.toBeInTheDocument();
  });

  it('disables buttons when loading is true', () => {
    render(<FeeCreateModal {...defaultProps} loading={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('does not render when isOpen is false', () => {
    render(<FeeCreateModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Nueva Cuota')).not.toBeInTheDocument();
  });

  it('renders unit options from props', () => {
    render(<FeeCreateModal {...defaultProps} />);

    expect(screen.getByTestId('field-unitId')).toBeInTheDocument();
    expect(screen.getByText('Apto 101')).toBeInTheDocument();
    expect(screen.getByText('Apto 102')).toBeInTheDocument();
  });

  it('shows loading units placeholder when loadingUnits is true', () => {
    render(<FeeCreateModal {...defaultProps} loadingUnits={true} />);

    const unitSelect = screen.getByTestId('field-unitId');
    const placeholderOption = unitSelect.querySelector('option[value=""]');
    expect(placeholderOption?.textContent).toBe('Cargando...');
  });

  it('shows default placeholder when not loading units', () => {
    render(<FeeCreateModal {...defaultProps} loadingUnits={false} />);

    const unitSelect = screen.getByTestId('field-unitId');
    const placeholderOption = unitSelect.querySelector('option[value=""]');
    expect(placeholderOption?.textContent).toBe('Selecciona una unidad');
  });
});
