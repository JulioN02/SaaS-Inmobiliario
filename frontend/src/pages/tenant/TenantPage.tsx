/* =============================================================================
   SaaS Inmobiliario — Tenant Page
   Lista de tenants del sistema (solo SuperAdmin)
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useTenantStore } from '../../stores/tenantStore';
import { toast } from '../../stores/toastStore';
import type { Tenant, TenantStatus, TenantPlan, FindAllTenantsParams } from '../../types';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './TenantPage.module.css';
import { TenantDetailPage } from './TenantDetailPage';

// ── Componente principal ────────────────────────────────────────────────────

export function TenantPage() {
  const {
    tenants,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchTenants,
    suspendTenant,
    activateTenant,
    deleteTenant,
    clearError,
  } = useTenantStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [filterStatus, setFilterStatus] = useState<TenantStatus | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar tenants al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllTenantsParams = {
      page: 1,
      limit,
      status: filterStatus,
    };
    fetchTenants(params);
  }, [filterStatus]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nuevo tenant
  const handleCreate = () => {
    setEditingTenant(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar tenant
  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllTenantsParams = {
      page: newPage,
      limit,
      status: filterStatus,
    };
    fetchTenants(params);
  };

  // Suspender tenant
  const handleSuspend = async (tenant: Tenant) => {
    try {
      await suspendTenant(tenant.id);
      toast.success(`Tenant "${tenant.name}" suspendido`);
      const params: FindAllTenantsParams = { page, limit, status: filterStatus };
      fetchTenants(params);
    } catch (err) {
      // error manejado en el store
    }
  };

  // Activar tenant
  const handleActivate = async (tenant: Tenant) => {
    try {
      await activateTenant(tenant.id);
      toast.success(`Tenant "${tenant.name}" activado`);
      const params: FindAllTenantsParams = { page, limit, status: filterStatus };
      fetchTenants(params);
    } catch (err) {
      // error manejado en el store
    }
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteTenant(deleteConfirm.id);
      toast.success(`Tenant "${deleteConfirm.name}" eliminado`);
      setDeleteConfirm(null);
      const params: FindAllTenantsParams = { page, limit, status: filterStatus };
      fetchTenants(params);
    } catch (err) {
      // error manejado en el store
    } finally {
      setDeleting(false);
    }
  };

  // Formatear plan
  const formatPlan = (plan: TenantPlan) => {
    const labels: Record<TenantPlan, string> = {
      BASIC: 'Básico',
      PREMIUM: 'Premium',
      ENTERPRISE: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  // Formatear estado
  const formatStatus = (status: TenantStatus) => {
    const labels: Record<TenantStatus, string> = {
      ACTIVE: 'Activo',
      SUSPENDED: 'Suspendido',
      INACTIVE: 'Inactivo',
    };
    return labels[status] || status;
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Tenants</h1>
        <div className={styles.actions}>
          {/* Filtro por estado */}
          <select
            className={styles.filterSelect}
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus((e.target.value as TenantStatus) || undefined)}
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>

          {/* Botón crear */}
          <button className={styles.createButton} onClick={handleCreate}>
            + Nuevo Tenant
          </button>
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && tenants.length === 0 ? (
          <div className={styles.loading}>Cargando tenants...</div>
        ) : tenants.length === 0 ? (
          <div className={styles.empty}>No hay tenants registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Subdominio</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Contacto</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>
                    <code className={styles.subdomain}>{tenant.subdomain}</code>
                  </td>
                  <td>
                    <span className={`${styles.planBadge} ${styles[tenant.plan.toLowerCase()]}`}>
                      {formatPlan(tenant.plan)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        tenant.status === 'ACTIVE'
                          ? styles.statusActive
                          : tenant.status === 'SUSPENDED'
                          ? styles.statusSuspended
                          : styles.statusInactive
                      }`}
                    >
                      {formatStatus(tenant.status)}
                    </span>
                  </td>
                  <td>{tenant.contactEmail || '-'}</td>
                  <td>{formatDate(tenant.createdAt)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(tenant)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {tenant.status === 'ACTIVE' ? (
                        <button
                          className={styles.suspendButton}
                          onClick={() => handleSuspend(tenant)}
                          title="Suspender"
                        >
                          ⏸️
                        </button>
                      ) : (
                        <button
                          className={styles.activateButton}
                          onClick={() => handleActivate(tenant)}
                          title="Activar"
                        >
                          ▶️
                        </button>
                      )}
                      <button
                        className={styles.deleteButton}
                        onClick={() => setDeleteConfirm(tenant)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Paginación ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {page} de {totalPages} ({total} tenants)
          </span>
          <button
            className={styles.pageButton}
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal de creación/edición ───────────────────────────────────── */}
      {isModalOpen && (
        <TenantDetailPage
          tenant={editingTenant}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllTenantsParams = { page, limit, status: filterStatus };
            fetchTenants(params);
          }}
        />
      )}

      {/* ── ConfirmDialog para eliminación ───────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Tenant"
        message={`¿Estás seguro de eliminar el tenant "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}