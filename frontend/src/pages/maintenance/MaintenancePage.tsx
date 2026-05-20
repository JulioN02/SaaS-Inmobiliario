/* =============================================================================
   SaaS Inmobiliario — Maintenance Page
   Vista de solicitudes de mantenimiento para AdminTenant/Admin
   Kanban board por estado
   ============================================================================= */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';
import { useUnitStore } from '../../stores/unitStore';
import { Modal } from '../../components/Shared/Modal';
import { FormField } from '../../components/Shared/FormField';
import { StatusBadge, maintenanceStatusVariant } from '../../components/Shared/StatusBadge';
import type { MaintenanceRequest, CreateMaintenanceDto, UpdateMaintenanceDto, MaintenanceStatus } from '../../types/maintenance';
import styles from './MaintenancePage.module.css';

export function MaintenancePage() {

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelto',
  CANCELLED: 'Cancelado',
};

const STATUS_COLUMNS: MaintenanceStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

  const {
    requests,
    fetchMaintenances,
    createMaintenance,
    updateMaintenance,
  } = useMaintenanceStore();

  const { units, fetchUnits } = useUnitStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateMaintenanceDto>({
    unitId: '',
    title: '',
    description: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update state
  const [updateStatus, setUpdateStatus] = useState<MaintenanceStatus | ''>('');
  const [assignTo, setAssignTo] = useState<string>('');

  const loadMaintenances = useCallback(() => {
    fetchMaintenances({ limit: 100 });
  }, [fetchMaintenances]);

  useEffect(() => {
    loadMaintenances();
    fetchUnits({ limit: 100 });
  }, []);

  // Group requests by status
  const requestsByStatus = useMemo(() => {
    const grouped: Record<MaintenanceStatus, MaintenanceRequest[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CANCELLED: [],
    };

    requests.forEach((request) => {
      if (grouped[request.status]) {
        grouped[request.status].push(request);
      }
    });

    return grouped;
  }, [requests]);

  const handleOpenModal = () => {
    setFormData({
      unitId: '',
      title: '',
      description: '',
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
      await createMaintenance(formData);
      setIsModalOpen(false);
      loadMaintenances();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear solicitud');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCardClick = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setUpdateStatus(request.status);
    setAssignTo(request.assignedTo || '');
    setIsUpdateModalOpen(true);
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setFormLoading(true);
    try {
      const dto: UpdateMaintenanceDto = {};
      if (updateStatus) dto.status = updateStatus;
      if (assignTo) dto.assignedTo = assignTo;

      await updateMaintenance(selectedRequest.id, dto);
      setIsUpdateModalOpen(false);
      setSelectedRequest(null);
      loadMaintenances();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusTransition = (newStatus: MaintenanceStatus) => {
    setUpdateStatus(newStatus);
  };

  const unitOptions = units.map((u) => ({
    value: u.id,
    label: `${u.identifier}`,
  }));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Mantenimiento</h1>
        <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleOpenModal}>
          + Nueva Solicitud
        </button>
      </div>

      {/* Kanban Board */}
      <div className={styles.board}>
        {STATUS_COLUMNS.map((status) => (
          <div key={status} className={styles.column}>
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}>{STATUS_LABELS[status]}</span>
              <span className={styles.columnCount}>
                {requestsByStatus[status].length}
              </span>
            </div>

            <div className={styles.cardsContainer}>
              {requestsByStatus[status].length === 0 ? (
                <div className={styles.emptyColumn}>
                  No hay solicitudes
                </div>
              ) : (
                requestsByStatus[status].map((request) => (
                  <div
                    key={request.id}
                    className={`${styles.card} ${styles[`status${status}`]}`}
                    onClick={() => handleCardClick(request)}
                  >
                    <h3 className={styles.cardTitle}>{request.title}</h3>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardUnit}>
                        {request.unitNumber || 'Sin unidad'}
                      </span>
                      <span className={styles.cardDate}>
                        {formatDate(request.createdAt)}
                      </span>
                      {request.assignedToName && (
                        <span className={styles.assignee}>
                          👤 {request.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Nueva Solicitud de Mantenimiento"
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
              disabled={formLoading || !formData.unitId || !formData.title}
            >
              {formLoading ? 'Creando...' : 'Crear Solicitud'}
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
            label="Título"
            name="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título de la solicitud"
          />

          <FormField
            label="Descripción"
            name="description"
            as="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción del problema..."
            rows={4}
          />
        </form>
      </Modal>

      {/* Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        title="Actualizar Solicitud"
        onClose={() => setIsUpdateModalOpen(false)}
        footer={
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={() => setIsUpdateModalOpen(false)}
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={handleSubmitUpdate}
              disabled={formLoading}
            >
              {formLoading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        }
      >
        <div>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>
              {formError}
            </div>
          )}
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>
            {selectedRequest?.title}
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <StatusBadge variant={maintenanceStatusVariant(selectedRequest?.status || 'PENDING')}>
              {selectedRequest ? STATUS_LABELS[selectedRequest.status] : 'Pendiente'}
            </StatusBadge>
          </div>

          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            <strong>Unidad:</strong> {selectedRequest?.unitNumber}
          </p>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            <strong>Creado:</strong> {selectedRequest && formatDate(selectedRequest.createdAt)}
          </p>
          {selectedRequest?.description && (
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              <strong>Descripción:</strong> {selectedRequest.description}
            </p>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            Cambiar Estado
          </label>
          <div className={styles.statusButtons}>
            {STATUS_COLUMNS.map((status) => (
              <button
                key={status}
                className={`${styles.statusButton} ${updateStatus === status ? styles.statusButtonActive : ''}`}
                onClick={() => handleStatusTransition(status)}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <FormField
            label="Asignar a"
            name="assignedTo"
            as="select"
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            options={[]}
            placeholder="Seleccionar responsable (pendiente)"
            hint="Integrar con usuarios del sistema"
          />
        </div>
      </Modal>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default MaintenancePage;