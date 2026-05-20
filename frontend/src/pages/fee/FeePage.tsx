/* =============================================================================
   SaaS Inmobiliario — Fee Page
   Lista de cuotas con filtros, paginación y acciones CRUD
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useFeeStore } from '../../stores/feeStore';
import { toast } from '../../stores/toastStore';
import { api } from '../../services/api';
import type { Fee, FeeStatus, FindAllFeesParams, UpdateFeeDto } from '../../types/fee';
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
        // silent fail - user can type UUID manually
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

  // Form state for create
  const [formData, setFormData] = useState({
    unitId: '',
    amount: '',
    description: '',
    period: '',
    dueDate: '',
    feeType: 'PERIODIC' as 'PERIODIC' | 'EXTRAORDINARY' | 'ADJUSTMENT',
  });

  // ── Detail/Edit modal state ──────────────────────────────────────────────
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [detailFee, setDetailFee] = useState<Fee | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    dueDate: '',
  });

  // Unit details for smart creation form
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<{
    monthlyFeeAmount: number;
    propertyName: string;
    identifier: string;
  } | null>(null);
  const [currentResident, setCurrentResident] = useState<{
    id: string;
    fullName: string;
  } | null>(null);
  const [loadingUnitDetails, setLoadingUnitDetails] = useState(false);

  // Recurrence state
  const [recurrence, setRecurrence] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMESTERLY' | 'YEARLY' | 'EXTRAORDINARY'>('MONTHLY');
  const [manualAmount, setManualAmount] = useState('');

  // Recurrence month multipliers
  const RECURRENCE_MONTHS: Record<string, number> = {
    MONTHLY: 1,
    QUARTERLY: 3,
    SEMESTERLY: 6,
    YEARLY: 12,
    EXTRAORDINARY: 0,
  };

  const RECURRENCE_LABELS: Record<string, string> = {
    MONTHLY: 'Mensual (1 mes)',
    QUARTERLY: 'Trimestral (3 meses)',
    SEMESTERLY: 'Semestral (6 meses)',
    YEARLY: 'Anual (12 meses)',
    EXTRAORDINARY: 'Extraordinaria (monto manual)',
  };

  // Form state for status update
  const [statusForm, setStatusForm] = useState<{
    status: FeeStatus;
    paidAmount: string;
  }>({
    status: 'PAID',
    paidAmount: '',
  });

  // Summary calculations - based on ALL loaded fees, not just visible page
  // When a filter is active, show only that filter's totals
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

  // Auto-calculate amount, period, and dueDate when unit details or recurrence change
  useEffect(() => {
    if (!selectedUnitDetails || recurrence === 'EXTRAORDINARY') {
      if (recurrence === 'EXTRAORDINARY') {
        // Let user enter manual amount, don't auto-calculate
      }
      return;
    }

    const months = RECURRENCE_MONTHS[recurrence] || 1;
    const calculatedAmount = selectedUnitDetails.monthlyFeeAmount * months * 100; // Avoid floating point issues
    const roundedAmount = Math.round(calculatedAmount) / 100;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${currentYear}-${currentMonth}`;

    // Due date: first day of next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dueDate = nextMonth.toISOString().split('T')[0];

    setFormData((prev) => ({
      ...prev,
      amount: roundedAmount.toString(),
      period,
      dueDate,
    }));
  }, [selectedUnitDetails, recurrence]);

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

  // ── Detail modal handlers ─────────────────────────────────────────────────
  const handleViewDetail = (fee: Fee) => {
    setDetailFee(fee);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailFee(null);
  };

  // ── Edit modal handlers ────────────────────────────────────────────────────
  const handleEditClick = (fee: Fee) => {
    setDetailFee(fee);
    setEditFormData({
      amount: fee.amount.toString(),
      description: fee.description || '',
      dueDate: fee.dueDate ? fee.dueDate.toString().split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setDetailFee(null);
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailFee) return;

    setSubmitting(true);
    try {
      const dto: UpdateFeeDto = {};
      const amountNum = parseFloat(editFormData.amount);
      if (!isNaN(amountNum) && amountNum > 0) dto.amount = amountNum;
      if (editFormData.description) dto.description = editFormData.description;
      if (editFormData.dueDate) dto.dueDate = editFormData.dueDate;

      await updateFee(detailFee.id, dto);
      toast.success('Cuota actualizada exitosamente');
      handleCloseEditModal();
      // Reload list
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
    setSelectedUnitDetails(null);
    setCurrentResident(null);
    setRecurrence('MONTHLY');
    setManualAmount('');
    setIsCreateModalOpen(true);
  };

  // Cerrar modal de creación
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Manejar cambios en el formulario de creación
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // When unit changes, fetch details for auto-calculation
    if (field === 'unitId' && value) {
      fetchUnitDetails(value);
    }
  };

  // Fetch unit details and current occupancy when a unit is selected
  const fetchUnitDetails = async (unitId: string) => {
    setLoadingUnitDetails(true);
    try {
      // Fetch unit info
      const unitRes = await api.get(`/units/${unitId}`);
      const unitData = unitRes.data;
      setSelectedUnitDetails({
        monthlyFeeAmount: unitData.monthlyFeeAmount || 0,
        propertyName: unitData.property?.name || '',
        identifier: unitData.identifier || '',
      });

      // Fetch current active occupancy
      try {
        const occRes = await api.get('/occupancies', {
          params: { unitId, active: true },
        });
        const occData = occRes.data?.data || [];
        if (occData.length > 0) {
          const activeOcc = occData[0];
          setCurrentResident({
            id: activeOcc.resident?.id || '',
            fullName: activeOcc.resident?.fullName || 'Residente activo',
          });
        } else {
          setCurrentResident(null);
        }
      } catch {
        // Occupancy fetch is optional
        setCurrentResident(null);
      }
    } catch {
      setSelectedUnitDetails(null);
      setCurrentResident(null);
    } finally {
      setLoadingUnitDetails(false);
    }
  };

  // Reset auto-calculations when recurrence changes
  const handleRecurrenceChange = (value: string) => {
    setRecurrence(value as typeof recurrence);
    if (value === 'EXTRAORDINARY') {
      setFormData((prev) => ({
        ...prev,
        amount: '',
      }));
    }
  };

  // Enviar formulario de creación
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate required fields
    if (!formData.unitId || !formData.amount || !formData.period || !formData.dueDate) {
      toast.error('Todos los campos obligatorios deben estar llenos');
      setSubmitting(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error('El monto debe ser un número mayor a 0');
      setSubmitting(false);
      return;
    }

    try {
      await createFee({
        unitId: formData.unitId,
        amount,
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
          <p className={styles.summaryCardTitle}>Total Cuotas</p>
          <p className={styles.summaryCardValue}>${summary.total.toLocaleString('es-CO')}</p>
        </div>
        <div className={styles.summaryCard} style={{ borderTop: '3px solid var(--color-warning-500, #F59E0B)' }}>
          <p className={styles.summaryCardTitle}>Pendiente</p>
          <p className={styles.summaryCardValue}>${summary.pending.toLocaleString('es-CO')}</p>
        </div>
        <div className={styles.summaryCard} style={{ borderTop: '3px solid var(--color-success-500, #10B981)' }}>
          <p className={styles.summaryCardTitle}>Pagado</p>
          <p className={styles.summaryCardValue}>${summary.paid.toLocaleString('es-CO')}</p>
        </div>
        <div className={styles.summaryCard} style={{ borderTop: '3px solid var(--color-primary-500, #3B82F6)' }}>
          <p className={styles.summaryCardTitle}>Parcial</p>
          <p className={styles.summaryCardValue}>${summary.partial.toLocaleString('es-CO')}</p>
        </div>
      </div>
      {/* Info: los montos reflejan las cuotas visibles según filtro actual */}

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
              label="Unidad"
              name="unitId"
              as="select"
              value={formData.unitId}
              onChange={(e) => handleFormChange('unitId', e.target.value)}
              required
              options={units.map(u => ({ value: u.id, label: u.identifier }))}
              placeholder={loadingUnits ? 'Cargando...' : 'Selecciona una unidad'}
            />
          </div>

          {/* Unit info display */}
          {loadingUnitDetails && (
            <div style={{ padding: '12px', background: '#F0F9FF', borderRadius: '6px', fontSize: '13px', color: '#0284C7', marginBottom: '12px' }}>
              Cargando información de la unidad...
            </div>
          )}

          {selectedUnitDetails && !loadingUnitDetails && (
            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span><strong>Unidad:</strong> {selectedUnitDetails.identifier}</span>
                <span><strong>Propiedad:</strong> {selectedUnitDetails.propertyName}</span>
                <span><strong>Cuota mensual:</strong> ${selectedUnitDetails.monthlyFeeAmount.toLocaleString('es-CO')}</span>
                {currentResident && (
                  <span><strong>Residente actual:</strong> {currentResident.fullName}</span>
                )}
              </div>
            </div>
          )}

          {/* Recurrence selector */}
          {selectedUnitDetails && !loadingUnitDetails && (
            <>
              <div className={styles.formRow}>
                <FormField
                  label="Recurrencia"
                  as="select"
                  name="recurrence"
                  value={recurrence}
                  onChange={(e) => handleRecurrenceChange(e.target.value)}
                  options={[
                    { value: 'MONTHLY', label: RECURRENCE_LABELS.MONTHLY },
                    { value: 'QUARTERLY', label: RECURRENCE_LABELS.QUARTERLY },
                    { value: 'SEMESTERLY', label: RECURRENCE_LABELS.SEMESTERLY },
                    { value: 'YEARLY', label: RECURRENCE_LABELS.YEARLY },
                    { value: 'EXTRAORDINARY', label: RECURRENCE_LABELS.EXTRAORDINARY },
                  ]}
                />
                {recurrence !== 'EXTRAORDINARY' && (
                  <FormField
                    label="Monto Total"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    required
                  />
                )}
              </div>

              {recurrence !== 'EXTRAORDINARY' && (
                <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '6px', fontSize: '14px', color: '#166534', marginBottom: '12px', border: '1px solid #BBF7D0' }}>
                  <strong>Cálculo:</strong> ${selectedUnitDetails.monthlyFeeAmount.toLocaleString('es-CO')} × {RECURRENCE_MONTHS[recurrence]} mes(es) = <strong>${formData.amount ? parseFloat(formData.amount).toLocaleString('es-CO') : '0'}</strong>
                </div>
              )}
            </>
          )}

          {recurrence === 'EXTRAORDINARY' && (
            <div className={styles.formRow}>
              <FormField
                label="Monto"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                required
              />
            </div>
          )}

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

      {/* ── Modal de detalle ───────────────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        title="Detalle de Cuota"
        onClose={handleCloseDetailModal}
        size="lg"
      >
        {detailFee && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Unidad</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{detailFee.unitIdentifier || detailFee.unitId.slice(0, 8)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Propiedad</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{detailFee.propertyName || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Monto</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>${detailFee.amount.toLocaleString('es-CO')}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Estado</p>
                <p style={{ margin: 0 }}>
                  <StatusBadge variant={feeStatusVariant(detailFee.status)}>
                    {statusLabels[detailFee.status]}
                  </StatusBadge>
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Periodo</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{detailFee.period}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Vencimiento</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{new Date(detailFee.dueDate).toLocaleDateString('es-CO')}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Tipo</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{feeTypeLabels[detailFee.feeType] || detailFee.feeType}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Pagado</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{detailFee.paidAmount ? `$${detailFee.paidAmount.toLocaleString('es-CO')}` : '—'}</p>
              </div>
            </div>
            {detailFee.description && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>Descripción</p>
                <p style={{ fontSize: '14px', margin: 0 }}>{detailFee.description}</p>
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  handleCloseDetailModal();
                  handleEditClick(detailFee);
                }}
              >
                ✏️ Editar Cuota
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal de edición ────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        title="Editar Cuota"
        onClose={handleCloseEditModal}
        size="md"
        loading={submitting}
        footer={
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={handleCloseEditModal} disabled={submitting}>
              Cancelar
            </button>
            <button
              className={styles.submitButton}
              onClick={handleEditSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleEditSubmit}>
          <FormField
            label="Monto"
            name="amount"
            type="number"
            value={editFormData.amount}
            onChange={(e) => handleEditFormChange('amount', e.target.value)}
          />
          <FormField
            label="Fecha de Vencimiento"
            name="dueDate"
            type="date"
            value={editFormData.dueDate}
            onChange={(e) => handleEditFormChange('dueDate', e.target.value)}
          />
          <FormField
            label="Descripción"
            as="textarea"
            name="description"
            value={editFormData.description}
            onChange={(e) => handleEditFormChange('description', e.target.value)}
            placeholder="Descripción de la cuota"
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
              <p><strong>Unidad:</strong> {selectedFee.unitIdentifier || selectedFee.unitId.slice(0, 8)}</p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
