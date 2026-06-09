/* =============================================================================
   SaaS Inmobiliario — Plan Page
   Lista de planes del sistema (solo SuperAdmin)
   ============================================================================= */

import { useEffect, useState } from 'react';
import { usePlanStore } from '../../stores/planStore';
import { toast } from '../../stores/toastStore';
import type { Plan, FindAllPlansParams } from '../../types';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './PlanPage.module.css';
import { PlanDetailPage } from './PlanDetailPage';

// ── Componente principal ────────────────────────────────────────────────────

export function PlanPage() {
  const {
    plans,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchPlans,
    toggleActive,
    deletePlan,
    clearError,
  } = usePlanStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Cargar planes al montar
  useEffect(() => {
    const params: FindAllPlansParams = { page: 1, limit };
    fetchPlans(params);
  }, []);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nuevo plan
  const handleCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar plan
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllPlansParams = { page: newPage, limit };
    fetchPlans(params);
  };

  // Toggle active/inactive
  const handleToggleActive = async (plan: Plan) => {
    setTogglingId(plan.id);
    try {
      const updated = await toggleActive(plan.id);
      toast.success(
        `Plan "${plan.name}" ${updated.isActive ? 'activado' : 'desactivado'}`,
      );
      const params: FindAllPlansParams = { page, limit };
      fetchPlans(params);
    } catch (err) {
      // error manejado en el store
    } finally {
      setTogglingId(null);
    }
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deletePlan(deleteConfirm.id);
      toast.success(`Plan "${deleteConfirm.name}" eliminado`);
      setDeleteConfirm(null);
      const params: FindAllPlansParams = { page, limit };
      fetchPlans(params);
    } catch (err) {
      // error manejado en el store
    } finally {
      setDeleting(false);
    }
  };

  // Formatear límites
  const formatLimit = (value: number) => {
    return value === -1 ? 'Ilimitado' : value.toString();
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Clase CSS para badge de plan según slug
  const getPlanBadgeClass = (slug: string) => {
    const slugClasses: Record<string, string> = {
      basic: 'basic',
      premium: 'premium',
      enterprise: 'enterprise',
    };
    return slugClasses[slug] || 'basic';
  };

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Planes</h1>
        <div className={styles.actions}>
          <button className={styles.createButton} onClick={handleCreate}>
            + Nuevo Plan
          </button>
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && plans.length === 0 ? (
          <div className={styles.loading}>Cargando planes...</div>
        ) : plans.length === 0 ? (
          <div className={styles.empty}>No hay planes registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Límites</th>
                <th>Precio Mensual</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <span
                      className={`${styles.planBadge} ${styles[getPlanBadgeClass(plan.slug)]}`}
                    >
                      {plan.name}
                    </span>
                  </td>
                  <td>
                    <code className={styles.slug}>{plan.slug}</code>
                  </td>
                  <td className={styles.limitsCell}>
                    <span>{formatLimit(plan.limits.properties)} props</span>
                    <span className={styles.limitSep}>·</span>
                    <span>{formatLimit(plan.limits.units)} unid</span>
                    <span className={styles.limitSep}>·</span>
                    <span>{formatLimit(plan.limits.users)} users</span>
                  </td>
                  <td>{formatPrice(plan.prices.monthly)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        plan.isActive ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{formatDate(plan.createdAt)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(plan)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={
                          plan.isActive ? styles.deactivateButton : styles.activateButton
                        }
                        onClick={() => handleToggleActive(plan)}
                        disabled={togglingId === plan.id}
                        title={plan.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {togglingId === plan.id
                          ? '⏳'
                          : plan.isActive
                          ? '⏸️'
                          : '▶️'}
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => setDeleteConfirm(plan)}
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
            Página {page} de {totalPages} ({total} planes)
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
        <PlanDetailPage
          plan={editingPlan}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllPlansParams = { page, limit };
            fetchPlans(params);
          }}
        />
      )}

      {/* ── ConfirmDialog para eliminación ─────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Plan"
        message={`¿Estás seguro de eliminar el plan "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
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
