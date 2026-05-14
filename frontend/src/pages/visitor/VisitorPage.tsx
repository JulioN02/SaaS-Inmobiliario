/* =============================================================================
   SaaS Inmobiliario — Visitor Page
   Vista de visitantes para el rol Portería
   ============================================================================= */

import { useState, useEffect, useCallback } from 'react';
import { useVisitorStore } from '../../stores/visitorStore';
import { useUnitStore } from '../../stores/unitStore';
import { DataTable, type Column } from '../../components/Shared/DataTable';
import { Modal } from '../../components/Shared/Modal';
import { FormField } from '../../components/Shared/FormField';
import { Pagination } from '../../components/Shared/Pagination';
import type { Visitor, CreateVisitorDto } from '../../types/visitor';
import styles from './VisitorPage.module.css';

export function VisitorPage() {
  const {
    visitors,
    loading,
    total,
    page,
    totalPages,
    limit,
    fetchVisitors,
    registerVisitor,
    checkoutVisitor,
  } = useVisitorStore();

  const { units, fetchUnits } = useUnitStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  // Filters state
  const [unitIdFilter, setUnitIdFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CreateVisitorDto>({
    unitId: '',
    visitorName: '',
    documentNumber: '',
    entryDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Checkout form
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().slice(0, 16));

  const loadVisitors = useCallback(() => {
    fetchVisitors({
      unitId: unitIdFilter || undefined,
      entryDateFrom: dateFromFilter || undefined,
      entryDateTo: dateToFilter || undefined,
      page,
      limit,
    });
  }, [fetchVisitors, unitIdFilter, dateFromFilter, dateToFilter, page, limit]);

  useEffect(() => {
    loadVisitors();
    fetchUnits({ limit: 100 });
  }, []);

  const handleOpenModal = () => {
    setFormData({
      unitId: '',
      visitorName: '',
      documentNumber: '',
      entryDate: new Date().toISOString().slice(0, 16),
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await registerVisitor(formData);
      setIsModalOpen(false);
      loadVisitors();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCheckout = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setCheckoutDate(new Date().toISOString().slice(0, 16));
    setIsCheckoutModalOpen(true);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitor) return;

    setFormLoading(true);
    try {
      await checkoutVisitor(selectedVisitor.id, { exitDate: checkoutDate });
      setIsCheckoutModalOpen(false);
      setSelectedVisitor(null);
      loadVisitors();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar salida');
    } finally {
      setFormLoading(false);
    }
  };

  const columns: Column<Visitor>[] = [
    { key: 'visitorName', header: 'Visitante' },
    { key: 'documentNumber', header: 'Documento' },
    { key: 'unitNumber', header: 'Unidad' },
    { key: 'entryDate', header: 'Entrada', render: (v) => formatDateTime(v.entryDate) },
    {
      key: 'exitDate',
      header: 'Salida',
      render: (v) => (v.exitDate ? formatDateTime(v.exitDate) : '-'),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (v) => (
        <span className={v.exitDate ? styles.statusCheckedOut : styles.statusActive}>
          {v.exitDate ? 'Registrado' : 'Activo'}
        </span>
      ),
    },
  ];

  const unitOptions = units.map((u) => ({
    value: u.id,
    label: `${u.identifier}`,
  }));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Visitantes</h1>
        <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleOpenModal}>
          + Registrar Visitante
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Unidad</label>
          <select
            className={styles.filterSelect}
            value={unitIdFilter}
            onChange={(e) => setUnitIdFilter(e.target.value)}
          >
            <option value="">Todas las unidades</option>
            {unitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Desde</label>
          <input
            type="date"
            className={styles.filterSelect}
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Hasta</label>
          <input
            type="date"
            className={styles.filterSelect}
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
          />
        </div>

        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          onClick={loadVisitors}
          style={{ alignSelf: 'flex-end' }}
        >
          Filtrar
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={visitors}
          loading={loading}
          emptyMessage="No hay visitantes registrados"
          rowActions={(visitor) => (
            !visitor.exitDate && (
              <button
                className={styles.checkoutButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout(visitor);
                }}
              >
                Registrar Salida
              </button>
            )
          )}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(newPage) => fetchVisitors({
                unitId: unitIdFilter || undefined,
                entryDateFrom: dateFromFilter || undefined,
                entryDateTo: dateToFilter || undefined,
                page: newPage,
                limit,
              })}
            />
          </div>
        )}
      </div>

      {/* Register Visitor Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Registrar Visitante"
        onClose={handleCloseModal}
        footer={
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={handleCloseModal}
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={handleSubmit}
              disabled={formLoading || !formData.unitId || !formData.visitorName}
            >
              {formLoading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '14px' }}>{formError}</div>
          )}

          <FormField
            label="Unidad"
            name="unitId"
            as="select"
            required
            value={formData.unitId}
            onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
            options={unitOptions}
            placeholder="Seleccionar unidad"
          />

          <FormField
            label="Nombre del Visitante"
            name="visitorName"
            required
            value={formData.visitorName}
            onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
            placeholder="Nombre completo"
          />

          <FormField
            label="Número de Documento"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
            placeholder="C.C, CE, PASSPORT"
          />

          <FormField
            label="Fecha y Hora de Entrada"
            name="entryDate"
            type="datetime-local"
            value={formData.entryDate}
            onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
          />

          <FormField
            label="Notas"
            name="notes"
            as="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas adicionales..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        title="Registrar Salida"
        onClose={() => setIsCheckoutModalOpen(false)}
        footer={
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={() => setIsCheckoutModalOpen(false)}
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={handleSubmitCheckout}
              disabled={formLoading}
            >
              {formLoading ? 'Registrando...' : 'Registrar Salida'}
            </button>
          </div>
        }
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>Visitante:</strong> {selectedVisitor?.visitorName}
          </p>
          <p style={{ marginBottom: '16px' }}>
            <strong>Unidad:</strong> {selectedVisitor?.unitNumber}
          </p>
          <FormField
            label="Fecha y Hora de Salida"
            name="exitDate"
            type="datetime-local"
            value={checkoutDate}
            onChange={(e) => setCheckoutDate(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default VisitorPage;