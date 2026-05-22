/* =============================================================================
   SaaS Inmobiliario — Fee Page
   Lista de cuotas con filtros, paginación y acciones CRUD
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useFeeStore } from '../../stores/feeStore';
import { toast } from '../../stores/toastStore';
import { api } from '../../services/api';
import type { Fee, FeeStatus, FindAllFeesParams, UpdateFeeDto } from '../../types/fee';
import type { CreateFeeDto } from '../../types/fee';
import { StatusBadge, feeStatusVariant } from '../../components/Shared/StatusBadge';
import { DataTable } from '../../components/Shared/DataTable';
import { Pagination } from '../../components/Shared/Pagination';
import { FeeSummaryCards } from './components/FeeSummaryCards';
import { FeeStatusTabs } from './components/FeeStatusTabs';
import { FeeCreateModal } from './components/FeeCreateModal';
import { FeeDetailModal } from './components/FeeDetailModal';
import { FeeEditModal } from './components/FeeEditModal';
import { FeeStatusModal } from './components/FeeStatusModal';
import styles from './FeePage.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusLabels: Record<FeeStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
};

const feeTypeLabels: Record<string, string> = {
  PERIODIC: 'Periódica',
  EXTRAORDINARY: 'Extraordinaria',
  ADJUSTMENT: 'Ajuste',
};

// ── Componente principal ──────────────────────────────────────────────────────

export function FeePage() {
  const {
    fees,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchFees,
    createFee,
    updateFee,
    updateFeeStatus,
    clearError,
  } = useFeeStore();

  const [filterStatus, setFilterStatus] = useState<FeeStatus | undefined>(undefined);
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Units for dropdown selector
  const [units, setUnits] = useState<Array<{ id: string; identifier: string }>>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Load units on mount for the create form selector
  useEffect(() => {
    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const res = await api.get('/units', { params: { limit: 200 } });
        setUnits(res.data?.data || []);
      } catch {
        // silent fail — user can type UUID manually
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

  // ── Detail/Edit modal state ──────────────────────────────────────────────
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [detailFee, setDetailFee] = useState<Fee | null>(null);

  // Summary calculations — based on ALL loaded fees, not just visible page
  const summary = {
    pending: fees.filter((f) => f.status === 'PENDING').reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0),
    paid: fees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + (f.amount || 0), 0),
    partial: fees.filter((f) => f.status === 'PARTIAL').reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    total: fees.reduce((sum, f) => sum + f.amount, 0),
  };

  // Cargar cuotas al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllFeesParams = {
      page: 1,
      limit,
      status: filterStatus,
      period: filterPeriod || undefined,
    };
    fetchFees(params);
  }, [filterStatus, filterPeriod]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePageChange = (newPage: number) => {
    const params: FindAllFeesParams = {
      page: newPage,
      limit,
      status: filterStatus,
      period: filterPeriod || undefined,
    };
    fetchFees(params);
  };

  // Detail modal handlers
  const handleViewDetail = (fee: Fee) => {
    setDetailFee(fee);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailFee(null);
  };

  // Edit modal handlers
  const handleEditClick = (fee: Fee) => {
    setDetailFee(fee);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setDetailFee(null);
  };

  const handleEditSubmit = async (id: string, dto: UpdateFeeDto) => {
    setSubmitting(true);
    try {
      await updateFee(id, dto);
      toast.success('Cuota actualizada exitosamente');
      handleCloseEditModal();
      const params: FindAllFeesParams = { page, limit, status: filterStatus };
      fetchFees(params);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Create modal handlers
  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateSubmit = async (dto: CreateFeeDto) => {
    setSubmitting(true);
    try {
      await createFee(dto);
      toast.success('Cuota creada exitosamente');
      handleCloseCreateModal();
      const params: FindAllFeesParams = { page, limit, status: filterStatus };
      fetchFees(params);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Status modal handlers
  const handleStatusClick = (fee: Fee) => {
    setSelectedFee(fee);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedFee(null);
  };

  const handleStatusSubmit = async (id: string, data: { status: FeeStatus; paidAmount?: number }) => {
    setSubmitting(true);
    try {
      await updateFeeStatus(id, data);
      toast.success('Estado actualizado exitosamente');
      handleCloseStatusModal();
      const params: FindAllFeesParams = { page, limit, status: filterStatus };
      fetchFees(params);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Columnas para DataTable ────────────────────────────────────────────
  const columns = [
    {
      key: 'unitIdentifier',
      header: 'Unidad',
      render: (fee: Fee) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {fee.unitIdentifier || fee.unitId.slice(0, 8)}
            {fee.unitTowerName && <span style={{ color: '#64748B', marginLeft: 4 }}>— {fee.unitTowerName}</span>}
          </div>
          {fee.propertyName && (
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: 2 }}>
              {fee.propertyName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (fee: Fee) => `$${fee.amount.toLocaleString('es-CO')}`,
    },
    {
      key: 'period',
      header: 'Periodo',
      render: (fee: Fee) => fee.period,
    },
    {
      key: 'dueDate',
      header: 'Vencimiento',
      render: (fee: Fee) => new Date(fee.dueDate).toLocaleDateString('es-CO'),
    },
    {
      key: 'feeType',
      header: 'Tipo',
      render: (fee: Fee) => feeTypeLabels[fee.feeType] || fee.feeType,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (fee: Fee) => (
        <span
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            handleStatusClick(fee);
          }}
        >
          <StatusBadge variant={feeStatusVariant(fee.status)}>
            {statusLabels[fee.status]}
          </StatusBadge>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (fee: Fee) => (
        <div className={styles.rowActions}>
          <button
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(fee);
            }}
          >
            Ver detalle
          </button>
          <button
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(fee);
            }}
          >
            Editar
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Cuotas</h1>
        <div className={styles.actions}>
          <input
            type="text"
            placeholder="Periodo (YYYY-MM)"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className={styles.filterSelect}
            style={{ padding: '8px 12px' }}
          />
          <button className={styles.createButton} onClick={handleCreate}>
            + Nueva Cuota
          </button>
        </div>
      </div>

      {/* ── Tabs de estado ────────────────────────────────────────────── */}
      <FeeStatusTabs filterStatus={filterStatus} onFilterChange={setFilterStatus} />

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <FeeSummaryCards summary={summary} />

      {/* ── Tabla ─────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={fees}
          loading={loading}
          emptyMessage="No hay cuotas registradas"
        />
      </div>

      {/* ── Paginación ───────────────────────────────────────────────── */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={handlePageChange}
      />

      {/* ── Modales ───────────────────────────────────────────────────── */}
      <FeeCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        units={units}
        loadingUnits={loadingUnits}
        onSubmit={handleCreateSubmit}
        loading={submitting}
      />

      <FeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        fee={detailFee}
        onEdit={handleEditClick}
      />

      <FeeEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        fee={detailFee}
        onSubmit={handleEditSubmit}
      />

      <FeeStatusModal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        fee={selectedFee}
        onSubmit={handleStatusSubmit}
      />
    </div>
  );
}
