/* =============================================================================
   SaaS Inmobiliario — Fee Page
   Lista de cuotas con filtros, paginación y acciones CRUD
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useFeeStore } from '../../stores/feeStore';
import { toast } from '../../stores/toastStore';
import type { Fee, FeeStatus, FindAllFeesParams } from '../../types/fee';
import { StatusBadge, feeStatusVariant } from '../../components/Shared/StatusBadge';
import { DataTable } from '../../components/Shared/DataTable';
import { Pagination } from '../../components/Shared/Pagination';
import { Modal } from '../../components/Shared/Modal';
import { FormField } from '../../components/Shared/FormField';
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
    updateFeeStatus,
    clearError,
  } = useFeeStore();

  const [filterStatus, setFilterStatus] = useState<FeeStatus | undefined>(undefined);
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for create
  const [formData, setFormData] = useState({
    unitId: '',
    amount: '',
    description: '',
    period: '',
    dueDate: '',
    feeType: 'PERIODIC' as 'PERIODIC' | 'EXTRAORDINARY' | 'ADJUSTMENT',
  });

  // Form state for status update
  const [statusForm, setStatusForm] = useState<{
    status: FeeStatus;
    paidAmount: string;
  }>({
    status: 'PAID',
    paidAmount: '',
  });

  // Summary calculations
  const summary = {
    pending: fees.filter((f) => f.status === 'PENDING').reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0),
    paid: fees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0),
    partial: fees.filter((f) => f.status === 'PARTIAL').reduce((sum, f) => sum + (f.paidAmount || 0), 0),
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

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllFeesParams = {
      page: newPage,
      limit,
      status: filterStatus,
      period: filterPeriod || undefined,
    };
    fetchFees(params);
  };

  // Abrir modal para crear cuota
  const handleCreate = () => {
    setFormData({
      unitId: '',
      amount: '',
      description: '',
      period: '',
      dueDate: '',
      feeType: 'PERIODIC',
    });
    setIsCreateModalOpen(true);
  };

  // Cerrar modal de creación
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Manejar cambios en el formulario de creación
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Enviar formulario de creación
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createFee({
        unitId: formData.unitId,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        period: formData.period,
        dueDate: formData.dueDate,
        feeType: formData.feeType,
      });
      toast.success('Cuota creada exitosamente');
      handleCloseCreateModal();
      // Recargar lista
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

  // Abrir modal para cambiar estado
  const handleStatusClick = (fee: Fee) => {
    setSelectedFee(fee);
    setStatusForm({
      status: fee.status,
      paidAmount: fee.paidAmount?.toString() || '',
    });
    setIsStatusModalOpen(true);
  };

  // Cerrar modal de estado
  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedFee(null);
  };

  // Enviar cambio de estado
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    setSubmitting(true);
    try {
      await updateFeeStatus(selectedFee.id, {
        status: statusForm.status,
        paidAmount: statusForm.paidAmount ? parseFloat(statusForm.paidAmount) : undefined,
      });
      toast.success('Estado actualizado exitosamente');
      handleCloseStatusModal();
      // Recargar lista
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

  // Columnas para DataTable
  const columns = [
    {
      key: 'unitNumber',
      header: 'Unidad',
      render: (fee: Fee) => fee.unitNumber || fee.unitId.slice(0, 8),
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
  ];

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
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${!filterStatus ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus(undefined)}
        >
          Todas
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'PENDING' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('PENDING')}
        >
          Pendientes
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'PAID' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('PAID')}
        >
          Pagadas
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'PARTIAL' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('PARTIAL')}
        >
          Parciales
        </button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardTitle}>Total Pendiente</p>
          <p className={styles.summaryCardValue}>${summary.pending.toLocaleString('es-CO')}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardTitle}>Total Pagado</p>
          <p className={styles.summaryCardValue}>${summary.paid.toLocaleString('es-CO')}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardTitle}>Total Parcial</p>
          <p className={styles.summaryCardValue}>${summary.partial.toLocaleString('es-CO')}</p>
        </div>
      </div>

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

      {/* ── Modal de creación ────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        title="Nueva Cuota"
        onClose={handleCloseCreateModal}
        size="lg"
        loading={submitting}
        footer={
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={handleCloseCreateModal} disabled={submitting}>
              Cancelar
            </button>
            <button
              className={styles.submitButton}
              onClick={handleCreateSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Crear Cuota'}
            </button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleCreateSubmit}>
          <div className={styles.formRow}>
            <FormField
              label="ID de Unidad"
              name="unitId"
              value={formData.unitId}
              onChange={(e) => handleFormChange('unitId', e.target.value)}
              required
            />
            <FormField
              label="Monto"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              required
            />
          </div>
          <div className={styles.formRow}>
            <FormField
              label="Periodo (YYYY-MM)"
              name="period"
              value={formData.period}
              onChange={(e) => handleFormChange('period', e.target.value)}
              placeholder="2026-05"
              required
            />
            <FormField
              label="Fecha de Vencimiento"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleFormChange('dueDate', e.target.value)}
              required
            />
          </div>
          <FormField
            label="Tipo de Cuota"
            as="select"
            name="feeType"
            value={formData.feeType}
            onChange={(e) => handleFormChange('feeType', e.target.value)}
            options={[
              { value: 'PERIODIC', label: 'Periódica' },
              { value: 'EXTRAORDINARY', label: 'Extraordinaria' },
              { value: 'ADJUSTMENT', label: 'Ajuste' },
            ]}
          />
          <FormField
            label="Descripción"
            as="textarea"
            name="description"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            placeholder="Descripción de la cuota (opcional)"
          />
        </form>
      </Modal>

      {/* ── Modal de cambio de estado ────────────────────────────────── */}
      <Modal
        isOpen={isStatusModalOpen}
        title="Actualizar Estado de Cuota"
        onClose={handleCloseStatusModal}
        size="md"
        loading={submitting}
        footer={
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={handleCloseStatusModal} disabled={submitting}>
              Cancelar
            </button>
            <button
              className={styles.submitButton}
              onClick={handleStatusSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Actualizar Estado'}
            </button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleStatusSubmit}>
          <FormField
            label="Nuevo Estado"
            as="select"
            name="status"
            value={statusForm.status}
            onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value as FeeStatus }))}
            options={[
              { value: 'PENDING', label: 'Pendiente' },
              { value: 'PAID', label: 'Pagado' },
              { value: 'PARTIAL', label: 'Parcial' },
            ]}
          />
          {(statusForm.status === 'PAID' || statusForm.status === 'PARTIAL') && (
            <FormField
              label="Monto Pagado"
              name="paidAmount"
              type="number"
              value={statusForm.paidAmount}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
              placeholder="0"
            />
          )}
          {selectedFee && (
            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '6px', fontSize: '14px' }}>
              <p><strong>Cuota:</strong> {selectedFee.description || `${selectedFee.period}`}</p>
              <p><strong>Monto:</strong> ${selectedFee.amount.toLocaleString('es-CO')}</p>
              <p><strong>Unidad:</strong> {selectedFee.unitNumber || selectedFee.unitId.slice(0, 8)}</p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
