/* =============================================================================
    SaaS Inmobiliario — Unit Page
    Lista de unidades con DataTable, paginación y acciones CRUD
    ============================================================================= */

import { useEffect, useState } from 'react';
import { useUnitStore } from '../../stores/unitStore';
import { usePropertyStore } from '../../stores/propertyStore';
import { useTowerStore } from '../../stores/towerStore';
import { toast } from '../../stores/toastStore';
import type { Unit, UnitType, UnitStatus, FindAllUnitsParams } from '../../types/property';
import { StatusBadge, unitStatusVariant } from '../../components/Shared/StatusBadge';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './UnitPage.module.css';
import { UnitDetailPage } from './UnitDetailPage';

// ── Helper para formatear tipo de unidad ────────────────────────────────────────

const unitTypeLabels: Record<UnitType, string> = {
  APARTMENT: 'Apartamento',
  HOUSE: 'Casa',
  COMMERCIAL: 'Local',
  PARKING: 'Parqueadero',
};

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return value.toString();
}

// ── Componente principal ────────────────────────────────────────────────────

export function UnitPage() {
  const {
    units,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchUnits,
    deleteUnit,
    updateUnit,
    clearError,
  } = useUnitStore();

  const { properties, fetchProperties: fetchProperties } = usePropertyStore();
  const { towers, fetchTowers: fetchTowers } = useTowerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('');
  const [filterTower, setFilterTower] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | ''>('');
  const [deleteConfirm, setDeleteConfirm] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar propiedades para el filtro
  useEffect(() => {
    fetchProperties({ page: 1, limit: 100 });
  }, []);

  // Cargar torres cuando cambia la propiedad seleccionada
  useEffect(() => {
    if (filterProperty) {
      fetchTowers({ propertyId: filterProperty, page: 1, limit: 50 });
    }
  }, [filterProperty]);

  // Cargar unidades al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllUnitsParams = {
      page: 1,
      limit,
      propertyId: filterProperty || undefined,
      towerId: filterTower || undefined,
      status: filterStatus || undefined,
    };
    fetchUnits(params);
  }, [filterProperty, filterTower, filterStatus]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nueva unidad
  const handleCreate = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar unidad existente
  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllUnitsParams = {
      page: newPage,
      limit,
      propertyId: filterProperty || undefined,
      towerId: filterTower || undefined,
      status: filterStatus || undefined,
    };
    fetchUnits(params);
  };

  // Confirmar eliminación
  const handleDeleteClick = (unit: Unit) => {
    setDeleteConfirm(unit);
  };

  // Ejecutar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    try {
      await deleteUnit(deleteConfirm.id);
      toast.success(`Unidad "${deleteConfirm.identifier}" eliminada`);
      setDeleteConfirm(null);
      // Recargar lista
      const params: FindAllUnitsParams = { page, limit, propertyId: filterProperty || undefined, towerId: filterTower || undefined, status: filterStatus || undefined };
      fetchUnits(params);
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

  // Toggle publicar/ocultar unidad en sitio web
  const [togglingPublish, setTogglingPublish] = useState<string | null>(null);
  void togglingPublish;

  const handleTogglePublish = async (unit: Unit) => {
    setTogglingPublish(unit.id);
    try {
      await updateUnit(unit.id, { isPublished: !unit.isPublished } as any);
      toast.success(
        unit.isPublished
          ? 'Unidad oculta del sitio web'
          : 'Unidad publicada en el sitio web'
      );
      // Recargar lista
      const params: FindAllUnitsParams = {
        page,
        limit,
        propertyId: filterProperty || undefined,
        towerId: filterTower || undefined,
        status: filterStatus || undefined,
      };
      fetchUnits(params);
    } catch (err) {
      toast.error('Error al cambiar estado de publicación');
    } finally {
      setTogglingPublish(null);
    }
  };

  // Obtener nombre de propiedad por ID
  const getPropertyName = (propertyId: string): string => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || propertyId;
  };

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Unidades</h1>
        <div className={styles.actions}>
          {/* Filtro por propiedad */}
          <select
            className={styles.filterSelect}
            value={filterProperty}
            onChange={(e) => {
              setFilterProperty(e.target.value);
              setFilterTower('');
            }}
          >
            <option value="">Todas las propiedades</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Filtro por torre */}
          <select
            className={styles.filterSelect}
            value={filterTower}
            onChange={(e) => setFilterTower(e.target.value)}
            disabled={!filterProperty}
          >
            <option value="">Todas las torres</option>
            {towers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Filtro por estado */}
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UnitStatus || '')}
          >
            <option value="">Todos los estados</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="OCCUPIED">Ocupada</option>
            <option value="MAINTENANCE">Mantenimiento</option>
          </select>

          {/* Botón crear */}
          <button className={styles.createButton} onClick={handleCreate}>
            + Nueva Unidad
          </button>
        </div>
      </div>

      {/* ── Tabla ──────────────────────────────��────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && units.length === 0 ? (
          <div className={styles.loading}>Cargando unidades...</div>
        ) : units.length === 0 ? (
          <div className={styles.empty}>No hay unidades registradas</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Identificador</th>
                <th>Tipo</th>
                <th>Piso</th>
                <th>Propiedad</th>
                <th>Estado</th>
                <th>Mensualidad</th>
                <th>Web</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.identifier}</td>
                  <td>{unitTypeLabels[unit.unitType]}</td>
                  <td>{formatNumber(unit.floor)}</td>
                  <td>{getPropertyName(unit.propertyId)}</td>
                  <td>
                    <StatusBadge variant={unitStatusVariant(unit.status)}>
                      {unit.status === 'AVAILABLE' ? 'Disponible' : unit.status === 'OCCUPIED' ? 'Ocupada' : 'Mantenimiento'}
                    </StatusBadge>
                  </td>
                  <td>{formatCurrency(unit.monthlyFeeAmount)}</td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(unit)}
                      style={{
                        background: unit.isPublished ? '#D1FAE5' : '#F3F4F6',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: unit.isPublished ? '#065F46' : '#6B7280',
                      }}
                      title={unit.isPublished ? 'Publicado en web' : 'No publicado'}
                    >
                      {unit.isPublished ? '🌐 Visible' : '⬜ Oculto'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(unit)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(unit)}
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
            Página {page} de {totalPages} ({total} unidades)
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
        <UnitDetailPage
          unit={editingUnit}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllUnitsParams = { page, limit, propertyId: filterProperty || undefined, towerId: filterTower || undefined, status: filterStatus || undefined };
            fetchUnits(params);
          }}
        />
      )}

      {/* ── ConfirmDialog para eliminación ───────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Unidad"
        message={`¿Estás seguro de eliminar la unidad "${deleteConfirm?.identifier}"? Esta acción no se puede deshacer.`}
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