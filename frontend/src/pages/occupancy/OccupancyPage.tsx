/* =============================================================================
   SaaS Inmobiliario — Occupancy Page
   Lista de ocupaciones con paginación y acciones (crear/cerrar)
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useOccupancyStore } from '../../stores/occupancyStore';
import { toast } from '../../stores/toastStore';
import type { Occupancy, FindAllOccupanciesParams } from '../../types/resident';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './OccupancyPage.module.css';
import { OccupancyDetailPage } from './OccupancyDetailPage';

// ── Componente principal ────────────────────────────────────────────────────

export function OccupancyPage() {
  const {
    occupancies,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchOccupancies,
    closeOccupancy,
    clearError,
  } = useOccupancyStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOccupancy, setLocalSelectedOccupancy] = useState<Occupancy | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [closeConfirm, setCloseConfirm] = useState<Occupancy | null>(null);
  const [closing, setClosing] = useState(false);

  // Cargar ocupaciones al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllOccupanciesParams = {
      page: 1,
      limit,
      active: filterActive,
    };
    fetchOccupancies(params);
  }, [filterActive]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nueva ocupación
  const handleCreate = () => {
    setLocalSelectedOccupancy(null);
    setIsModalOpen(true);
  };

  // Abrir modal para cerrar ocupación
  const handleCloseOccupancy = (occupancy: Occupancy) => {
    setLocalSelectedOccupancy(occupancy);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLocalSelectedOccupancy(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllOccupanciesParams = {
      page: newPage,
      limit,
      active: filterActive,
    };
    fetchOccupancies(params);
  };

  // Confirmar cierre de ocupación
  const handleConfirmClose = async (endDate: string) => {
    if (!closeConfirm) return;

    setClosing(true);
    try {
      await closeOccupancy(closeConfirm.id, { endDate });
      toast.success('Ocupación cerrada exitosamente');
      setCloseConfirm(null);
      // Recargar lista
      const params: FindAllOccupanciesParams = { page, limit, active: filterActive };
      fetchOccupancies(params);
    } catch (err) {
      // error manejado en el store
    } finally {
      setClosing(false);
    }
  };

  // Formatear tipo para visualización
  const formatOccupancyType = (type: string) => {
    return type === 'OWNER' ? 'Propietario' : 'Arrendatario';
  };

  // Formatear fecha
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determinar si una ocupación está activa
  const isOccupancyActive = (occupancy: Occupancy) => {
    return !occupancy.endDate;
  };

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Ocupaciones</h1>
        <div className={styles.actions}>
          {/* Filtro por estado */}
          <select
            className={styles.filterSelect}
            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'closed'}
            onChange={(e) => {
              if (e.target.value === 'all') setFilterActive(undefined);
              else setFilterActive(e.target.value === 'active');
            }}
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="closed">Cerradas</option>
          </select>

          {/* Botón crear */}
          <button className={styles.createButton} onClick={handleCreate}>
            + Nueva Ocupación
          </button>
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && occupancies.length === 0 ? (
          <div className={styles.loading}>Cargando ocupaciones...</div>
        ) : occupancies.length === 0 ? (
          <div className={styles.empty}>No hay ocupaciones registradas</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Residente</th>
                <th>Tipo</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {occupancies.map((occupancy) => (
                <tr key={occupancy.id}>
                  <td>{occupancy.unit?.identifier || '—'}</td>
                  <td>
                    {occupancy.resident
                      ? `${occupancy.resident.firstName} ${occupancy.resident.lastName}`
                      : '—'}
                  </td>
                  <td>{formatOccupancyType(occupancy.type)}</td>
                  <td>{formatDate(occupancy.startDate)}</td>
                  <td>{formatDate(occupancy.endDate)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        isOccupancyActive(occupancy)
                          ? styles.statusActive
                          : styles.statusClosed
                      }`}
                    >
                      {isOccupancyActive(occupancy) ? 'Activa' : 'Cerrada'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {isOccupancyActive(occupancy) && (
                        <button
                          className={styles.closeButton}
                          onClick={() => handleCloseOccupancy(occupancy)}
                          title="Cerrar ocupación"
                        >
                          🔒
                        </button>
                      )}
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
            Página {page} de {totalPages} ({total} ocupaciones)
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

      {/* ── Modal de creación/cierre ───────────────────────────────────── */}
      {isModalOpen && (
        <OccupancyDetailPage
          occupancy={selectedOccupancy}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllOccupanciesParams = { page, limit, active: filterActive };
            fetchOccupancies(params);
          }}
        />
      )}

      {/* ── ConfirmDialog para cierre ───────────────────────────── */}
      <ConfirmDialog
        isOpen={!!closeConfirm}
        title="Cerrar Ocupación"
        message={`¿Estás seguro de cerrar la ocupación de "${closeConfirm?.resident?.firstName} ${closeConfirm?.resident?.lastName}" en la unidad "${closeConfirm?.unit?.identifier}"?`}
        confirmLabel="Cerrar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={() => handleConfirmClose(new Date().toISOString())}
        onCancel={() => setCloseConfirm(null)}
        loading={closing}
      />
    </div>
  );
}