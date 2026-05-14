/* =============================================================================
   SaaS Inmobiliario — Announcement Page
   Lista de anuncios con DataTable, paginación y acciones CRUD
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { toast } from '../../stores/toastStore';
import type { Announcement, AnnouncementPriority, FindAllAnnouncementsParams } from '../../types/announcement';
import { DataTable } from '../../components/Shared/DataTable';
import { Pagination } from '../../components/Shared/Pagination';
import { Modal } from '../../components/Shared/Modal';
import { FormField } from '../../components/Shared/FormField';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './AnnouncementPage.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const priorityLabels: Record<AnnouncementPriority, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

function getPriorityClass(priority: AnnouncementPriority): string {
  switch (priority) {
    case 'LOW': return styles.priorityLow || '';
    case 'NORMAL': return styles.priorityNormal || '';
    case 'HIGH': return styles.priorityHigh || '';
    case 'URGENT': return styles.priorityUrgent || '';
    default: return styles.priorityNormal || '';
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AnnouncementPage() {
  const {
    announcements,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    clearError,
  } = useAnnouncementStore();

  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL' as AnnouncementPriority,
    targetRoles: [] as string[],
    targetUnits: [] as string[],
    startsAt: '',
    endsAt: '',
  });

  // Cargar anuncios al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllAnnouncementsParams = {
      page: 1,
      limit,
      isActive: filterActive,
    };
    fetchAnnouncements(params);
  }, [filterActive]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllAnnouncementsParams = {
      page: newPage,
      limit,
      isActive: filterActive,
    };
    fetchAnnouncements(params);
  };

  // Abrir modal para crear anuncio
  const handleCreate = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'NORMAL',
      targetRoles: [],
      targetUnits: [],
      startsAt: '',
      endsAt: '',
    });
    setEditingAnnouncement(null);
    setIsCreateModalOpen(true);
  };

  // Abrir modal para editar anuncio
  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles || [],
      targetUnits: announcement.targetUnits || [],
      startsAt: announcement.startsAt ? announcement.startsAt.slice(0, 10) : '',
      endsAt: announcement.endsAt ? announcement.endsAt.slice(0, 10) : '',
    });
    setEditingAnnouncement(announcement);
    setIsCreateModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingAnnouncement(null);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Enviar formulario (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          targetRoles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
          targetUnits: formData.targetUnits.length > 0 ? formData.targetUnits : undefined,
          startsAt: formData.startsAt || undefined,
          endsAt: formData.endsAt || undefined,
        });
        toast.success('Anuncio actualizado exitosamente');
      } else {
        await createAnnouncement({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          targetRoles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
          targetUnits: formData.targetUnits.length > 0 ? formData.targetUnits : undefined,
          startsAt: formData.startsAt || undefined,
          endsAt: formData.endsAt || undefined,
        });
        toast.success('Anuncio creado exitosamente');
      }
      handleCloseModal();
      // Recargar lista
      const params: FindAllAnnouncementsParams = { page, limit, isActive: filterActive };
      fetchAnnouncements(params);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar toggle de isActive
  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await updateAnnouncement(announcement.id, { isActive: !announcement.isActive });
      toast.success(`Anuncio ${!announcement.isActive ? 'activado' : 'desactivado'}`);
      // Recargar lista
      const params: FindAllAnnouncementsParams = { page, limit, isActive: filterActive };
      fetchAnnouncements(params);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  // Confirmar eliminación
  const handleDeleteClick = (announcement: Announcement) => {
    setDeleteConfirm(announcement);
  };

  // Ejecutar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteAnnouncement(deleteConfirm.id);
      toast.success(`Anuncio "${deleteConfirm.title}" eliminado`);
      setDeleteConfirm(null);
      // Recargar lista
      const params: FindAllAnnouncementsParams = { page, limit, isActive: filterActive };
      fetchAnnouncements(params);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Cancelar eliminación
  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // Columnas para DataTable
  const columns = [
    {
      key: 'priority',
      header: 'Prioridad',
      render: (announcement: Announcement) => (
        <span className={getPriorityClass(announcement.priority)}>
          {priorityLabels[announcement.priority]}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Título',
      render: (announcement: Announcement) => announcement.title,
    },
    {
      key: 'targetRoles',
      header: 'Roles Destino',
      render: (announcement: Announcement) =>
        announcement.targetRoles && announcement.targetRoles.length > 0
          ? announcement.targetRoles.join(', ')
          : 'Todos',
    },
    {
      key: 'startsAt',
      header: 'Inicio',
      render: (announcement: Announcement) =>
        announcement.startsAt
          ? new Date(announcement.startsAt).toLocaleDateString('es-CO')
          : '-',
    },
    {
      key: 'isActive',
      header: 'Activo',
      render: (announcement: Announcement) => (
        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggle} ${announcement.isActive ? styles.toggleActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(announcement);
            }}
            title={announcement.isActive ? 'Desactivar' : 'Activar'}
          >
            <span className={styles.toggleKnob} />
          </button>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {announcement.isActive ? 'Sí' : 'No'}
          </span>
        </div>
      ),
    },
  ];

  // Row actions
  const rowActions = (announcement: Announcement) => (
    <div className={styles.rowActions}>
      <button
        className={styles.actionButton}
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(announcement);
        }}
        title="Editar"
      >
        ✏️
      </button>
      <button
        className={styles.actionButton}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteClick(announcement);
        }}
        title="Eliminar"
      >
        🗑️
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Anuncios</h1>
        <div className={styles.actions}>
          <select
            className={styles.filterSelect}
            value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
            onChange={(e) => {
              const val = e.target.value;
              setFilterActive(val === '' ? undefined : val === 'true');
            }}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <button className={styles.createButton} onClick={handleCreate}>
            + Nuevo Anuncio
          </button>
        </div>
      </div>

      {/* ── Tabla ──────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={announcements}
          loading={loading}
          emptyMessage="No hay anuncios registrados"
          rowActions={rowActions}
        />
      </div>

      {/* ── Paginación ────────────────────────────────────────────── */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={handlePageChange}
      />

      {/* ── Modal de creación/edición ────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        title={editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
        onClose={handleCloseModal}
        size="lg"
        loading={submitting}
        footer={
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={handleCloseModal} disabled={submitting}>
              Cancelar
            </button>
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : editingAnnouncement ? 'Actualizar' : 'Crear Anuncio'}
            </button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField
            label="Título"
            name="title"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            required
          />
          <FormField
            label="Contenido"
            as="textarea"
            name="content"
            value={formData.content}
            onChange={(e) => handleFormChange('content', e.target.value)}
            placeholder="Contenido del anuncio (se recomienda usar texto plano por ahora)"
            required
          />
          <div className={styles.richTextNote}>
            Nota: En esta versión se usa texto plano. Rich text será agregado en una futura actualización.
          </div>
          <div className={styles.formRow}>
            <FormField
              label="Prioridad"
              as="select"
              name="priority"
              value={formData.priority}
              onChange={(e) => handleFormChange('priority', e.target.value)}
              options={[
                { value: 'LOW', label: 'Baja' },
                { value: 'NORMAL', label: 'Normal' },
                { value: 'HIGH', label: 'Alta' },
                { value: 'URGENT', label: 'Urgente' },
              ]}
            />
              <FormField
                label="Roles Destino (separados por coma)"
                name="targetRoles"
                value={formData.targetRoles.join(',')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const roles = e.target.value.split(',').map((r: string) => r.trim()).filter((r: string) => r);
                  handleFormChange('targetRoles', roles);
                }}
                placeholder="ADMIN_TENANT, ADMINISTRATIVA"
              />
          </div>
          <div className={styles.formRow}>
            <FormField
              label="Fecha Inicio"
              name="startsAt"
              type="date"
              value={formData.startsAt}
              onChange={(e) => handleFormChange('startsAt', e.target.value)}
            />
            <FormField
              label="Fecha Fin"
              name="endsAt"
              type="date"
              value={formData.endsAt}
              onChange={(e) => handleFormChange('endsAt', e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* ── ConfirmDialog para eliminación ───────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Anuncio"
        message={`¿Estás seguro de eliminar "${deleteConfirm?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </div>
  );
}
