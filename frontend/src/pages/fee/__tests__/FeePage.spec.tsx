/* =============================================================================
   SaaS Inmobiliario — FeePage Tests
   Pruebas de integración del componente principal FeePage
   ============================================================================= */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeePage } from '../FeePage';
import type { Fee, FeeStatus } from '../../../types/fee';

// ── Mocks de stores ──────────────────────────────────────────────────────────

vi.mock('../../../stores/feeStore', () => ({
  useFeeStore: vi.fn(),
}));

vi.mock('../../../stores/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Mock de API ──────────────────────────────────────────────────────────────

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// ── Mocks de componentes hijos ───────────────────────────────────────────────

vi.mock('../components/FeeSummaryCards', () => ({
  FeeSummaryCards: ({ summary }: any) => (
    <div data-testid="summary-cards">
      <span>Total: ${summary.total}</span>
      <span>Pendiente: ${summary.pending}</span>
      <span>Pagado: ${summary.paid}</span>
      <span>Parcial: ${summary.partial}</span>
    </div>
  ),
}));

vi.mock('../components/FeeStatusTabs', () => ({
  FeeStatusTabs: ({ filterStatus, onFilterChange }: any) => (
    <div data-testid="status-tabs">
      <button
        data-testid="tab-todas"
        onClick={() => onFilterChange(undefined)}
      >
        Todas
      </button>
      <button
        data-testid="tab-pendientes"
        onClick={() => onFilterChange('PENDING')}
      >
        Pendientes
      </button>
      <button
        data-testid="tab-pagadas"
        onClick={() => onFilterChange('PAID')}
      >
        Pagadas
      </button>
      <button
        data-testid="tab-parciales"
        onClick={() => onFilterChange('PARTIAL')}
      >
        Parciales
      </button>
      {filterStatus !== undefined && (
        <span data-testid="active-filter">{filterStatus}</span>
      )}
    </div>
  ),
}));

vi.mock('../components/FeeCreateModal', () => ({
  FeeCreateModal: ({ isOpen, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <h2>Nueva Cuota</h2>
        <button onClick={onClose}>Cancelar</button>
        <button
          onClick={() =>
            onSubmit({
              unitId: 'unit-1',
              amount: 500000,
              period: '2026-05',
              dueDate: '2026-06-01',
              feeType: 'PERIODIC',
            })
          }
        >
          Crear Cuota
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/FeeDetailModal', () => ({
  FeeDetailModal: ({ isOpen, fee, onEdit }: any) =>
    isOpen ? (
      <div data-testid="detail-modal">
        <h2>Detalle de Cuota</h2>
        {fee && (
          <>
            <span data-testid="detail-fee-id">{fee.id}</span>
            <button onClick={() => onEdit(fee)}>Editar Cuota</button>
          </>
        )}
      </div>
    ) : null,
}));

vi.mock('../components/FeeEditModal', () => ({
  FeeEditModal: ({ isOpen, fee }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <h2>Editar Cuota</h2>
        {fee && <span data-testid="edit-fee-id">{fee.id}</span>}
      </div>
    ) : null,
}));

vi.mock('../components/FeeStatusModal', () => ({
  FeeStatusModal: ({ isOpen, fee, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="status-modal">
        <h2>Actualizar Estado de Cuota</h2>
        {fee && (
          <>
            <span data-testid="status-fee-id">{fee.id}</span>
            <button
              onClick={() =>
                onSubmit(fee.id, { status: 'PAID' as FeeStatus })
              }
            >
              Actualizar Estado
            </button>
          </>
        )}
      </div>
    ) : null,
}));

vi.mock('../../../components/Shared/DataTable', () => ({
  DataTable: ({ columns, data, loading, emptyMessage }: any) => (
    <div data-testid="data-table">
      {loading && data.length === 0 ? (
        <span data-testid="loading-indicator">Cargando…</span>
      ) : data.length === 0 ? (
        <span data-testid="empty-message">{emptyMessage}</span>
      ) : (
        data.map((item: any) => (
          <div key={item.id} data-testid={`fee-row-${item.id}`}>
            {columns.map((col: any) => (
              <span key={String(col.key)}>
                {col.render ? col.render(item) : String(item[col.key] ?? '')}
              </span>
            ))}
          </div>
        ))
      )}
    </div>
  ),
}));

vi.mock('../../../components/Shared/Pagination', () => ({
  Pagination: ({ page, totalPages, onPageChange }: any) =>
    totalPages > 1 ? (
      <div data-testid="pagination">
        <button
          data-testid="page-prev"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Anterior
        </button>
        <span data-testid="page-current">{page}</span>
        <button
          data-testid="page-next"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente →
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../components/Shared/StatusBadge', () => ({
  StatusBadge: ({ variant, children }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
  feeStatusVariant: (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'PARTIAL':
        return 'info';
      default:
        return 'neutral';
    }
  },
}));

// ── Imports de módulos mockeados ─────────────────────────────────────────────

import { useFeeStore } from '../../../stores/feeStore';
import { api } from '../../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockFee(overrides: Partial<Fee> = {}): Fee {
  return {
    id: 'fee-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    amount: 500000,
    period: '2026-05',
    status: 'PENDING',
    feeType: 'PERIODIC',
    dueDate: '2026-05-31',
    unitIdentifier: 'Apto 101',
    propertyName: 'Conjunto Test',
    createdBy: 'user-1',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

function createDefaultStoreState(overrides: Record<string, any> = {}) {
  return {
    fees: [],
    selectedFee: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
    fetchFees: vi.fn(),
    createFee: vi.fn(),
    updateFee: vi.fn(),
    updateFeeStatus: vi.fn(),
    setSelectedFee: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FeePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store state
    vi.mocked(useFeeStore).mockReturnValue(createDefaultStoreState());

    // Reset API mock
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
  });

  describe('Estructura general', () => {
    it('renderiza el título "Cuotas" en el encabezado', () => {
      render(<FeePage />);
      expect(screen.getByText('Cuotas')).toBeInTheDocument();
    });

    it('renderiza el botón "+ Nueva Cuota"', () => {
      render(<FeePage />);
      expect(screen.getByText('+ Nueva Cuota')).toBeInTheDocument();
    });

    it('renderiza el input de filtro por periodo', () => {
      render(<FeePage />);
      expect(
        screen.getByPlaceholderText('Periodo (YYYY-MM)')
      ).toBeInTheDocument();
    });

    it('renderiza FeeSummaryCards', () => {
      render(<FeePage />);
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    });

    it('renderiza FeeStatusTabs', () => {
      render(<FeePage />);
      expect(screen.getByTestId('status-tabs')).toBeInTheDocument();
    });

    it('renderiza DataTable', () => {
      render(<FeePage />);
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('muestra indicador de carga cuando loading es true y fees está vacío', () => {
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({ loading: true, fees: [] })
      );

      render(<FeePage />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('muestra mensaje de vacío cuando no hay cuotas', () => {
      render(<FeePage />);

      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByText('No hay cuotas registradas')).toBeInTheDocument();
    });
  });

  describe('fetchFees on mount', () => {
    it('llama a fetchFees al montar el componente con los parámetros por defecto', () => {
      const mockFetchFees = vi.fn();
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({ fetchFees: mockFetchFees })
      );

      render(<FeePage />);

      expect(mockFetchFees).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
        period: undefined,
      });
    });

    it('llama a api.get para cargar unidades al montar', async () => {
      render(<FeePage />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/units', {
          params: { limit: 200 },
        });
      });
    });
  });

  describe('Filtro por estado', () => {
    it('cambia el filtro a Pendientes y llama fetchFees con status PENDING', async () => {
      const mockFetchFees = vi.fn();
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({ fetchFees: mockFetchFees })
      );

      render(<FeePage />);
      mockFetchFees.mockClear();

      fireEvent.click(screen.getByTestId('tab-pendientes'));

      await waitFor(() => {
        expect(mockFetchFees).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          status: 'PENDING',
          period: undefined,
        });
      });
    });

    it('cambia a Todas y llama fetchFees con status undefined', async () => {
      const mockFetchFees = vi.fn();
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({ fetchFees: mockFetchFees })
      );

      render(<FeePage />);

      // First change to a different filter to ensure state changes
      fireEvent.click(screen.getByTestId('tab-pendientes'));

      await waitFor(() => {
        expect(mockFetchFees).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'PENDING' })
        );
      });

      mockFetchFees.mockClear();

      // Now click Todas to reset
      fireEvent.click(screen.getByTestId('tab-todas'));

      await waitFor(() => {
        expect(mockFetchFees).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          status: undefined,
          period: undefined,
        });
      });
    });
  });

  describe('Paginación', () => {
    it('renderiza Pagination cuando totalPages > 1', () => {
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({
          fees: [createMockFee()],
          total: 25,
          page: 1,
          totalPages: 2,
        })
      );

      render(<FeePage />);
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('NO renderiza Pagination cuando totalPages <= 1', () => {
      render(<FeePage />);
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('hace clic en Siguiente y llama fetchFees con page=2', async () => {
      const mockFetchFees = vi.fn();
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({
          fees: [createMockFee()],
          total: 25,
          page: 1,
          totalPages: 2,
          fetchFees: mockFetchFees,
        })
      );

      render(<FeePage />);
      mockFetchFees.mockClear();

      fireEvent.click(screen.getByTestId('page-next'));

      await waitFor(() => {
        expect(mockFetchFees).toHaveBeenCalledWith({
          page: 2,
          limit: 20,
          status: undefined,
          period: undefined,
        });
      });
    });
  });

  describe('Modal de creación', () => {
    it('abre el modal de creación al hacer clic en "+ Nueva Cuota"', async () => {
      render(<FeePage />);

      expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('+ Nueva Cuota'));

      await waitFor(() => {
        expect(screen.getByTestId('create-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Modal de detalle', () => {
    it('abre el modal de detalle al hacer clic en "Ver detalle"', async () => {
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({
          fees: [createMockFee()],
          total: 1,
          totalPages: 1,
        })
      );

      render(<FeePage />);
      expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();

      const verDetalleButtons = screen.getAllByText('Ver detalle');
      expect(verDetalleButtons.length).toBeGreaterThanOrEqual(1);
      const firstVerDetalle = verDetalleButtons[0]!;
      fireEvent.click(firstVerDetalle);

      await waitFor(() => {
        expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
        expect(screen.getByTestId('detail-fee-id')).toHaveTextContent('fee-1');
      });
    });

    it('abre modal de edición desde el modal de detalle', async () => {
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({
          fees: [createMockFee()],
          total: 1,
          totalPages: 1,
        })
      );

      render(<FeePage />);
      const verDetalleBtn = screen.getAllByText('Ver detalle')[0]!;
      fireEvent.click(verDetalleBtn);

      await waitFor(() => {
        expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
      });

      // Click Editar Cuota within the detail modal
      fireEvent.click(screen.getByText('Editar Cuota'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        expect(screen.getByTestId('edit-fee-id')).toHaveTextContent('fee-1');
      });
    });
  });

  describe('Modal de edición', () => {
    it('abre el modal de edición al hacer clic en "Editar"', async () => {
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({
          fees: [createMockFee()],
          total: 1,
          totalPages: 1,
        })
      );

      render(<FeePage />);
      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();

      const editButtons = screen.getAllByText('Editar');
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
      const firstEdit = editButtons[0]!;
      fireEvent.click(firstEdit);

      await waitFor(() => {
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        expect(screen.getByTestId('edit-fee-id')).toHaveTextContent('fee-1');
      });
    });
  });

  describe('Modal de estado', () => {
    it('abre el modal de estado al hacer clic en el badge de estado', async () => {
      vi.mocked(useFeeStore).mockReturnValue(
        createDefaultStoreState({
          fees: [createMockFee()],
          total: 1,
          totalPages: 1,
        })
      );

      render(<FeePage />);
      expect(screen.queryByTestId('status-modal')).not.toBeInTheDocument();

      // The mock fee has status PENDING so "Pendiente" badge is rendered
      const statusBadge = screen.getByText('Pendiente');
      expect(statusBadge).toBeInTheDocument();
      fireEvent.click(statusBadge);

      await waitFor(() => {
        expect(screen.getByTestId('status-modal')).toBeInTheDocument();
        expect(screen.getByTestId('status-fee-id')).toHaveTextContent('fee-1');
      });
    });
  });
});
