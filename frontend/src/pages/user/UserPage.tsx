/* =============================================================================
   SaaS Inmobiliario — User Page
   Lista de usuarios del tenant con DataTable, paginación y acciones CRUD
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { toast } from '../../stores/toastStore';
import type { User, FindAllUsersParams } from '../../types/user';
import styles from './UserPage.module.css';
import { UserDetailPage } from './UserDetailPage';

// ── Componente principal ────────────────────────────────────────────────────

export function UserPage() {
  const {
    users,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchUsers,
    suspendUser,
    activateUser,
    clearError,
  } = useUserStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  // Cargar usuarios al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllUsersParams = {
      page: 1,
      limit,
      isActive: filterActive,
    };
    fetchUsers(params);
  }, [filterActive]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Abrir modal para crear nuevo usuario
  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar usuario existente
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllUsersParams = {
      page: newPage,
      limit,
      isActive: filterActive,
    };
    fetchUsers(params);
  };

  // Manejar suspender/activar
  const handleToggleActive = async (user: User) => {
    try {
      if (user.isActive) {
        await suspendUser(user.id);
        toast.success(`Usuario ${user.email} suspendido`);
      } else {
        await activateUser(user.id);
        toast.success(`Usuario ${user.email} activado`);
      }
      // Recargar lista para reflejar cambios
      const params: FindAllUsersParams = { page, limit, isActive: filterActive };
      fetchUsers(params);
    } catch (err) {
      // error manejado en el store
    }
  };

  // Formatear rol para visualización
  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN_TENANT: 'Admin Tenant',
      ADMINISTRATIVA: 'Administrativa',
      PORTERIA: 'Portería',
    };
    return roles[role] || role;
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
        <h1 className={styles.title}>Usuarios</h1>
        <div className={styles.actions}>
          {/* Filtro por estado */}
          <select
            className={styles.filterSelect}
            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              if (e.target.value === 'all') setFilterActive(undefined);
              else setFilterActive(e.target.value === 'active');
            }}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Botón crear */}
          <button className={styles.createButton} onClick={handleCreate}>
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && users.length === 0 ? (
          <div className={styles.loading}>Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>No hay usuarios registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.lastName || '-'}
                  </td>
                  <td>{formatRole(user.role)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        user.isActive ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(user)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={`${styles.toggleButton} ${
                          user.isActive ? styles.suspendButton : styles.activateButton
                        }`}
                        onClick={() => handleToggleActive(user)}
                        title={user.isActive ? 'Suspender' : 'Activar'}
                      >
                        {user.isActive ? '🚫' : '✅'}
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
            Página {page} de {totalPages} ({total} usuarios)
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
        <UserDetailPage
          user={editingUser}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            const params: FindAllUsersParams = { page, limit, isActive: filterActive };
            fetchUsers(params);
          }}
        />
      )}
    </div>
  );
}