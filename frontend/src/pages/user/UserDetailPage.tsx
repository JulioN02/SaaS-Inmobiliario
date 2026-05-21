/* =============================================================================
   SaaS Inmobiliario — User Detail Page (Modal)
   Formulario para crear o editar un usuario
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserStore } from '../../stores/userStore';
import { toast } from '../../stores/toastStore';
import { api } from '../../services/api';
import type { User, CreateUserDto, UpdateUserDto } from '../../types/user';
import styles from './UserDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const createUserSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  roleId: z.string().min(1, 'El rol es requerido'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

// ── Tipos de roles (temporal, debería venir del backend) ────────────────────

interface RoleOption {
  id: string;
  name: string;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface UserDetailPageProps {
  user: User | null; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function UserDetailPage({ user, onClose, onSuccess }: UserDetailPageProps) {
  const isEdit = !!user;
  const { createUser, updateUser, loading } = useUserStore();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Cargar roles al montar
  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await api.get<RoleOption[]>('/roles');
        setRoles(response.data);
      } catch (err) {
        toast.error('Error al cargar roles');
        // Fallback a roles estáticos
        setRoles([
          { id: 'SUPER_ADMIN', name: 'Super Admin' },
          { id: 'ADMIN_TENANT', name: 'Admin Tenant' },
          { id: 'ADMINISTRATIVA', name: 'Administrativa' },
          { id: 'PORTERIA', name: 'Portería' },
        ]);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Configurar formulario según modo
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: isEdit
      ? {
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
        }
      : {
          email: '',
          password: '',
          roleId: '',
          firstName: '',
          lastName: '',
        },
  });
  const err = errors as any;

  // Reset cuando cambia el usuario (para edición)
  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
      });
    }
  }, [user, reset]);

  // Manejar envío
  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEdit && user) {
        const dto: UpdateUserDto = {
          email: data.email,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
        };
        await updateUser(user.id, dto);
        toast.success('Usuario actualizado');
      } else {
        const createData = data as CreateFormData;
        const dto: CreateUserDto = {
          email: createData.email,
          password: createData.password,
          roleId: createData.roleId,
          firstName: createData.firstName || undefined,
          lastName: createData.lastName || undefined,
        };
        await createUser(dto);
        toast.success('Usuario creado');
      }
      onSuccess();
    } catch (err) {
      // error manejado en el store
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email *
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="usuario@ejemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <span className={styles.error}>{errors.email.message}</span>
            )}
          </div>

          {/* Contraseña (solo crear) */}
          {!isEdit && (
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                className={`${styles.input} ${err.password?.message ? styles.inputError : ''}`}
                placeholder="••••••••"
                {...register('password')}
              />
              {err.password?.message && (
                <span className={styles.error}>{err.password.message}</span>
              )}
            </div>
          )}

          {/* Rol (solo crear) */}
          {!isEdit && (
            <div className={styles.field}>
              <label htmlFor="roleId" className={styles.label}>
                Rol *
              </label>
              <select
                id="roleId"
                className={`${styles.input} ${err.roleId?.message ? styles.inputError : ''}`}
                {...register('roleId')}
                disabled={rolesLoading}
              >
                <option value="">Selecciona un rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {err.roleId?.message && (
                <span className={styles.error}>{err.roleId.message}</span>
              )}
            </div>
          )}

          {/* Nombre */}
          <div className={styles.field}>
            <label htmlFor="firstName" className={styles.label}>
              Nombre
            </label>
            <input
              id="firstName"
              type="text"
              className={styles.input}
              placeholder="Nombre"
              {...register('firstName')}
            />
          </div>

          {/* Apellido */}
          <div className={styles.field}>
            <label htmlFor="lastName" className={styles.label}>
              Apellido
            </label>
            <input
              id="lastName"
              type="text"
              className={styles.input}
              placeholder="Apellido"
              {...register('lastName')}
            />
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