/* =============================================================================
   SaaS Inmobiliario — Role Page
   Lista de roles del tenant con DataTable, paginación y acciones CRUD
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useRoleStore } from '../../stores/roleStore';
import { toast } from '../../stores/toastStore';
import type { Role, FindAllRolesParams } from '../../types/role';
import styles from './RolePage.module.css';
import { RoleFormModal } from './RoleFormModal';

// ── Componente principal ────────────────────────────────────────────────────

export function RolePage() {
  const {
    roles,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchRoles,
    deleteRole,
    clearError,
  } = useRoleStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Cargar roles al montar
  useEffect(() => {
    const params: FindAllRolesParams = {
      page: 1,
      limit,
    };
    fetchRoles(params);
  }, []);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nuevo rol
  const handleCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar rol existente
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllRolesParams = {
      page: newPage,
      limit,
    };
    fetchRoles(params);
  };

  // Manejar eliminar rol
  const handleDelete = async (role: Role) => {
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRole(role.id);
      toast.success(`Rol "${role.name}" eliminado`);
      // Recargar lista
      const params: FindAllRolesParams = { page, limit };
      fetchRoles(params);
    } catch (err) {
      // Error manejado en el store
    }
  };

  // Formatear nombre de rol para visualización
  const formatRoleName = (name: string) => {
    const names: Record<string, string> = {
      SuperAdmin: 'Super Admin',
      AdminTenant: 'Admin Tenant',
      Administrativo: 'Administrativo',
      Portero: 'Portero',
    };
    return names[name] || name;
  };

  // Contar permisos totales de un rol
  const countPermissions = (permissions: Role['permissions']) => {
    return permissions.reduce((acc, p) => acc + p.actions.length, 0);
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
        <h1 className={styles.title}>Roles</h1>
        <div className={styles.actions}>
          {/* Botón crear */}
          <button className={styles.createButton} onClick={handleCreate}>
            + Nuevo Rol
          </button>
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && roles.length === 0 ? (
          <div className={styles.loading}>Cargando roles...</div>
        ) : roles.length === 0 ? (
          <div className={styles.empty}>No hay roles registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Permisos</th>
                <th>Predeterminado</th>
                <th>Fecha creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>{formatRoleName(role.name)}</td>
                  <td>{role.description || '-'}</td>
                  <td>{countPermissions(role.permissions)} permisos</td>
                  <td>
                    <span
                      className={`${styles.defaultBadge} ${
                        role.isDefault ? styles.defaultYes : styles.defaultNo
                      }`}
                    >
                      {role.isDefault ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>{formatDate(role.createdAt)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(role)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {!role.isDefault && (
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(role)}
                          title="Eliminar"
                        >
                          🗑️
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
            Página {page} de {totalPages} ({total} roles)
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
        <RoleFormModal
          role={editingRole}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllRolesParams = { page, limit };
            fetchRoles(params);
          }}
        />
      )}
    </div>
  );
}