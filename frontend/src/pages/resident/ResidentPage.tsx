/* =============================================================================
    SaaS Inmobiliario — Resident Page
    Lista de residentes con DataTable, filtros, paginación y acciones CRUD
    ============================================================================= */

import { useEffect, useState } from 'react';
import { useResidentStore } from '../../stores/residentStore';
import { toast } from '../../stores/toastStore';
import type { Resident, DocumentType, FindAllResidentsParams } from '../../types/resident';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './ResidentPage.module.css';
import { ResidentFormModal } from './ResidentFormModal';
import { AssignResidentModal } from './AssignResidentModal';

// ── Helper para formatear documento ────────────────────────────────────────

const documentTypeLabels: Record<DocumentType, string> = {
  CC: 'Cédula',
  CE: 'Cédula Extranjería',
  PASSPORT: 'Pasaporte',
  NIT: 'NIT',
};

function formatDocument(docType: DocumentType, docNumber: string): string {
  return `${documentTypeLabels[docType] || docType}: ${docNumber}`;
}

// ── Componente principal ────────────────────────────────────────────────────

export function ResidentPage() {
  const {
    residents,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchResidents,
    deleteResident,
    clearError,
  } = useResidentStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignResident, setAssignResident] = useState<Resident | null>(null);
  const [filterDocumentType, setFilterDocumentType] = useState<DocumentType | ''>('');
  const [searchDocumentNumber, setSearchDocumentNumber] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Resident | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar residentes al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllResidentsParams = {
      page: 1,
      limit,
      documentType: filterDocumentType || undefined,
      documentNumber: searchDocumentNumber || undefined,
    };
    fetchResidents(params);
  }, [filterDocumentType, searchDocumentNumber]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Debounce búsqueda por número de documento
  useEffect(() => {
    const timer = setTimeout(() => {
      const params: FindAllResidentsParams = {
        page: 1,
        limit,
        documentType: filterDocumentType || undefined,
        documentNumber: searchDocumentNumber || undefined,
      };
      fetchResidents(params);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDocumentNumber]);

  // Abrir modal para crear nuevo residente
  const handleCreate = () => {
    setEditingResident(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar residente existente
  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResident(null);
  };

  // Abrir modal de asignación
  const handleAssign = (resident: Resident) => {
    setAssignResident(resident);
    setAssignModalOpen(true);
  };

  // Cerrar modal de asignación
  const handleCloseAssignModal = () => {
    setAssignModalOpen(false);
    setAssignResident(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllResidentsParams = {
      page: newPage,
      limit,
      documentType: filterDocumentType || undefined,
      documentNumber: searchDocumentNumber || undefined,
    };
    fetchResidents(params);
  };

  // Confirmar eliminación
  const handleDeleteClick = (resident: Resident) => {
    setDeleteConfirm(resident);
  };

  // Ejecutar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteResident(deleteConfirm.id);
      toast.success(
        `${deleteConfirm.firstName} ${deleteConfirm.lastName} eliminado`,
      );
      setDeleteConfirm(null);
      // Recargar lista
      const params: FindAllResidentsParams = {
        page,
        limit,
        documentType: filterDocumentType || undefined,
        documentNumber: searchDocumentNumber || undefined,
      };
      fetchResidents(params);
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

  // Render
  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Residentes</h1>
        <div className={styles.actions}>
          {/* Filtro por tipo de documento */}
          <select
            className={styles.filterSelect}
            value={filterDocumentType}
            onChange={(e) =>
              setFilterDocumentType(e.target.value as DocumentType || '')
            }
          >
            <option value="">Todos los tipos</option>
            <option value="CC">Cédula</option>
            <option value="CE">Cédula Extranjería</option>
            <option value="PASSPORT">Pasaporte</option>
            <option value="NIT">NIT</option>
          </select>

          {/* Búsqueda por número de documento */}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por número de documento..."
            value={searchDocumentNumber}
            onChange={(e) => setSearchDocumentNumber(e.target.value)}
          />

          {/* Botón crear */}
          <button
            className={styles.createButton}
            onClick={handleCreate}
          >
            + Nuevo Residente
          </button>
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && residents.length === 0 ? (
          <div className={styles.loading}>Cargando residentes...</div>
        ) : residents.length === 0 ? (
          <div className={styles.empty}>No hay residentes registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((resident) => (
                <tr key={resident.id}>
                  <td>
                    {resident.firstName} {resident.lastName}
                  </td>
                  <td>
                    {formatDocument(
                      resident.documentType,
                      resident.documentNumber,
                    )}
                  </td>
                  <td>
                    <div>
                      {resident.email && <div>{resident.email}</div>}
                      {resident.phone && <div>{resident.phone}</div>}
                      {!resident.email && !resident.phone && (
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          -
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(resident)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.assignButton}
                        onClick={() => handleAssign(resident)}
                        title="Asignar a Unidad"
                      >
                        🏠
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(resident)}
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
            Página {page} de {totalPages} ({total} residentes)
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
        <ResidentFormModal
          resident={editingResident}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllResidentsParams = {
              page,
              limit,
              documentType: filterDocumentType || undefined,
              documentNumber: searchDocumentNumber || undefined,
            };
            fetchResidents(params);
          }}
        />
      )}

      {/* ── Modal de asignación ───────────────────────────────────── */}
      {assignModalOpen && assignResident && (
        <AssignResidentModal
          resident={assignResident}
          onClose={handleCloseAssignModal}
          onSuccess={() => {
            handleCloseAssignModal();
            toast.success(
              `${assignResident.firstName} ${assignResident.lastName} asignado a unidad`,
            );
          }}
        />
      )}

      {/* ── ConfirmDialog para eliminación ───────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Residente"
        message={`¿Estás seguro de eliminar a "${deleteConfirm?.firstName} ${deleteConfirm?.lastName}"? Esta acción no se puede deshacer.`}
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