/* =============================================================================
   SaaS Inmobiliario — Role Form Modal
   Formulario para crear o editar un rol con selección de permisos
   ============================================================================= */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRoleStore } from '../../stores/roleStore';
import { toast } from '../../stores/toastStore';
import type { Role, CreateRoleDto, Permission, RoleName } from '../../types/role';
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from '../../types/role';
import styles from './RoleFormModal.module.css';

// ── Schema de validación ───────────────────────────────────────────────────

const createRoleSchema = z.object({
  name: z.enum(['SuperAdmin', 'AdminTenant', 'Administrativo', 'Portero'], {
    message: 'El nombre del rol es requerido',
  }),
  description: z.string().optional(),
});

type CreateFormData = z.infer<typeof createRoleSchema>;

// ── Recursos disponibles (para labels) ─────────────────────────────────────

const RESOURCE_LABELS: Record<string, string> = {
  user: 'Usuarios',
  property: 'Propiedades',
  unit: 'Unidades',
  resident: 'Residentes',
  occupancy: 'Ocupaciones',
  visitor: 'Visitantes',
  maintenance: 'Mantenimiento',
  fee: 'Cuotas',
  announcement: 'Anuncios',
};

// ── Props ───────────────────────────────────────────────────────────────────

interface RoleFormModalProps {
  role: Role | null; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function RoleFormModal({ role, onClose, onSuccess }: RoleFormModalProps) {
  const isEdit = !!role;
  const { createRole, updateRole, loading } = useRoleStore();

  // Inicializar permisos desde el rol existente
  const initialPermissions: Permission[] = role?.permissions || [];

  // Configurar formulario
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: role?.name || ('SuperAdmin' as RoleName),
      description: role?.description || '',
    },
  });

  // Verificar si una acción está seleccionada
  const isPermissionChecked = (
    permissions: Permission[],
    resource: string,
    action: string
  ): boolean => {
    const permission = permissions.find((p) => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  };

  // Manejar envío del formulario
  const onSubmit = async (data: CreateFormData) => {
    // Recolectar permisos desde el DOM
    const permissions: Permission[] = [];
    
    // Obtener todos los checkboxes de permisos
    PERMISSION_RESOURCES.forEach((resource) => {
      const selectedActions: string[] = [];
      PERMISSION_ACTIONS.forEach((action) => {
        const checkbox = document.querySelector(
          `[data-resource="${resource}"][data-action="${action}"]`
        ) as HTMLInputElement;
        if (checkbox?.checked) {
          selectedActions.push(action);
        }
      });
      if (selectedActions.length > 0) {
        permissions.push({ resource, actions: selectedActions });
      }
    });

    try {
      if (isEdit && role) {
        const dto: CreateRoleDto = {
          name: data.name,
          description: data.description || undefined,
          permissions,
        };
        await updateRole(role.id, dto);
        toast.success('Rol actualizado');
      } else {
        const dto: CreateRoleDto = {
          name: data.name,
          description: data.description || undefined,
          permissions,
        };
        await createRole(dto);
        toast.success('Rol creado');
      }
      onSuccess();
    } catch (err) {
      // Error manejado en el store
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEdit ? 'Editar Rol' : 'Nuevo Rol'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Nombre */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Nombre *
            </label>
            <select
              id="name"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              {...register('name')}
              disabled={isEdit}
            >
              <option value="SuperAdmin">Super Admin</option>
              <option value="AdminTenant">Admin Tenant</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Portero">Portero</option>
            </select>
            {errors.name && (
              <span className={styles.error}>{errors.name.message}</span>
            )}
          </div>

          {/* Descripción */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Descripción
            </label>
            <input
              id="description"
              type="text"
              className={styles.input}
              placeholder="Descripción del rol"
              {...register('description')}
            />
          </div>

          {/* Permisos */}
          <div className={styles.field}>
            <label className={styles.label}>Permisos</label>
            <div className={styles.permissionsContainer}>
              {PERMISSION_RESOURCES.map((resource) => (
                <div key={resource} className={styles.permissionGroup}>
                  <h4 className={styles.permissionGroupTitle}>
                    {RESOURCE_LABELS[resource] || resource}
                  </h4>
                  <div className={styles.permissionActions}>
                    {PERMISSION_ACTIONS.map((action) => (
                      <label key={action} className={styles.permissionCheckbox}>
                        <input
                          type="checkbox"
                          data-resource={resource}
                          data-action={action}
                          defaultChecked={isPermissionChecked(
                            initialPermissions,
                            resource,
                            action
                          )}
                        />
                        <span className={styles.permissionLabel}>
                          {action === 'create'
                            ? 'Crear'
                            : action === 'read'
                            ? 'Leer'
                            : action === 'update'
                            ? 'Actualizar'
                            : 'Eliminar'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Acciones ──────────────────────────────────────────────────── */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : isEdit
                ? 'Actualizar'
                : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}