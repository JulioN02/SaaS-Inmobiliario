/* =============================================================================
    SaaS Inmobiliario — Property Page
    Lista de propiedades con DataTable, paginación y acciones CRUD
    ============================================================================= */

import { useEffect, useState } from 'react';
import { usePropertyStore } from '../../stores/propertyStore';
import { toast } from '../../stores/toastStore';
import type { Property, PropertyType, FindAllPropertiesParams } from '../../types/property';
import { StatusBadge } from '../../components/Shared/StatusBadge';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './PropertyPage.module.css';
import { PropertyDetailPage } from './PropertyDetailPage';

// ── Helper para formatear tipo de propiedad ────────────────────────────────

const propertyTypeLabels: Record<PropertyType, string> = {
  CONJUNTO: 'Conjunto',
  EDIFICIO: 'Edificio',
  TORRE: 'Torre',
  CASA_INDEPENDIENTE: 'Casa Independientemente',
};

function getPropertyTypeVariant(type: PropertyType): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  switch (type) {
    case 'CONJUNTO':
      return 'info';
    case 'EDIFICIO':
      return 'success';
    case 'TORRE':
      return 'warning';
    case 'CASA_INDEPENDIENTE':
      return 'neutral';
    default:
      return 'neutral';
  }
}

// ── Componente principal ────────────────────────────────────────────────────

export function PropertyPage() {
  const {
    properties,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchProperties,
    deleteProperty,
    setSelectedProperty,
    clearError,
  } = usePropertyStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [filterType, setFilterType] = useState<PropertyType | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar propiedades al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllPropertiesParams = {
      page: 1,
      limit,
      propertyType: filterType,
    };
    fetchProperties(params);
  }, [filterType]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nuevo propiedad
  const handleCreate = () => {
    setEditingProperty(null);
    setIsViewing(false);
    setIsModalOpen(true);
  };

  // Abrir modal para editar propiedad existente
  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsViewing(false);
    setIsModalOpen(true);
  };

  // Ver detalle de propiedad
  const handleViewDetail = (property: Property) => {
    setEditingProperty(property);
    setIsViewing(true);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
    setIsViewing(false);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllPropertiesParams = {
      page: newPage,
      limit,
      propertyType: filterType,
    };
    fetchProperties(params);
  };

  // Confirmar eliminación
  const handleDeleteClick = (property: Property) => {
    setDeleteConfirm(property);
  };

  // Ejecutar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    try {
      await deleteProperty(deleteConfirm.id);
      toast.success(`Propiedad "${deleteConfirm.name}" eliminada`);
      setDeleteConfirm(null);
      // Recargar lista
      const params: FindAllPropertiesParams = { page, limit, propertyType: filterType };
      fetchProperties(params);
    } catch (err) {
      if (err instanceof Error) {
        // Si el backend devuelve 400, mostrar el mensaje tal cual
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

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Propiedades</h1>
        <div className={styles.actions}>
          {/* Filtro por tipo */}
          <select
            className={styles.filterSelect}
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value as PropertyType || undefined)}
          >
            <option value="">Todos</option>
            <option value="CONJUNTO">Conjunto</option>
            <option value="EDIFICIO">Edificio</option>
            <option value="TORRE">Torre</option>
            <option value="CASA_INDEPENDIENTE">Casa Independiente</option>
          </select>

          {/* Botón crear */}
          <button className={styles.createButton} onClick={handleCreate}>
            + Nueva Propiedad
          </button>
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && properties.length === 0 ? (
          <div className={styles.loading}>Cargando propiedades...</div>
        ) : properties.length === 0 ? (
          <div className={styles.empty}>No hay propiedades registradas</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>{property.name}</td>
                  <td>
                    <StatusBadge variant={getPropertyTypeVariant(property.propertyType)}>
                      {propertyTypeLabels[property.propertyType]}
                    </StatusBadge>
                  </td>
                  <td>{property.address || '-'}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => handleViewDetail(property)}
                        title="Ver detalle"
                      >
                        👁️
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(property)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(property)}
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
            Página {page} de {totalPages} ({total} propiedades)
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

      {/* ── Modal de creación/edición/visualización ──────────────────────── */}
      {isModalOpen && (
        <PropertyDetailPage
          property={editingProperty}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllPropertiesParams = { page, limit, propertyType: filterType };
            fetchProperties(params);
          }}
          viewOnly={isViewing}
        />
      )}

      {/* ── ConfirmDialog para eliminación ───────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Propiedad"
        message={`¿Estás seguro de eliminar "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
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