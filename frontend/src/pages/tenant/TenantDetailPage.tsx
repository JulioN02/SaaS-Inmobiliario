/* =============================================================================
   SaaS Inmobiliario — Tenant Detail Page (Modal)
   Formulario para crear o editar un tenant
   ============================================================================= */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenantStore } from '../../stores/tenantStore';
import { usePlanStore } from '../../stores/planStore';
import type { Tenant, CreateTenantDto, UpdateTenantDto } from '../../types';
import styles from './TenantDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const createTenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  subdomain: z
    .string()
    .min(1, 'El subdominio es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  planId: z.string().min(1, 'El plan es requerido'),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().max(20, 'Máximo 20 caracteres').optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  subdomain: z
    .string()
    .min(1, 'El subdominio es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  planId: z.string().min(1, 'El plan es requerido'),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().max(20, 'Máximo 20 caracteres').optional(),
});

type CreateFormData = z.infer<typeof createTenantSchema>;
type UpdateFormData = z.infer<typeof updateTenantSchema>;

// ── Props ───────────────────────────────────────────────────────────────────

interface TenantDetailPageProps {
  tenant: Tenant | null; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function TenantDetailPage({ tenant, onClose, onSuccess }: TenantDetailPageProps) {
  const isEdit = !!tenant;
  const { createTenant, updateTenant, loading } = useTenantStore();
  const { activePlans, fetchActivePlans } = usePlanStore();

  // Cargar planes activos al montar
  useEffect(() => {
    if (activePlans.length === 0) {
      fetchActivePlans();
    }
  }, []);

  // Formatear límites para mostrar en el select
  const formatLimits = (limits: { properties: number; units: number; users: number }) => {
    const props = limits.properties === -1 ? '∞' : limits.properties;
    const users = limits.users === -1 ? '∞' : limits.users;
    return `${props} props, ${users} users`;
  };

  // Configurar formulario según modo
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updateTenantSchema : createTenantSchema),
    defaultValues: isEdit
      ? {
          name: tenant.name,
          subdomain: tenant.subdomain,
          planId: tenant.plan?.id || '',
          contactEmail: tenant.contactEmail ?? '',
          contactPhone: tenant.contactPhone ?? '',
        }
      : {
          name: '',
          subdomain: '',
          planId: '',
          contactEmail: '',
          contactPhone: '',
        },
  });

  // Manejar envío
  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEdit && tenant) {
        const dto: UpdateTenantDto = {
          name: data.name,
          subdomain: data.subdomain,
          planId: data.planId,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone || undefined,
        };
        await updateTenant(tenant.id, dto);
      } else {
        const createData = data as CreateFormData;
        const dto: CreateTenantDto = {
          name: createData.name,
          subdomain: createData.subdomain,
          planId: createData.planId,
          contactEmail: createData.contactEmail || undefined,
          contactPhone: createData.contactPhone || undefined,
        };
        await createTenant(dto);
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
            {isEdit ? 'Editar Tenant' : 'Nuevo Tenant'}
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
            <input
              id="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Nombre del tenant"
              {...register('name')}
            />
            {errors.name && (
              <span className={styles.error}>{errors.name.message}</span>
            )}
          </div>

          {/* Subdominio */}
          <div className={styles.field}>
            <label htmlFor="subdomain" className={styles.label}>
              Subdominio *
            </label>
            <div className={styles.inputGroup}>
              <input
                id="subdominio-texto"
                type="text"
                className={`${styles.input} ${errors.subdomain ? styles.inputError : ''}`}
                placeholder="miempresa"
                {...register('subdomain')}
              />
              <span className={styles.inputAddon}>.saasinmobiliario.com</span>
            </div>
            {errors.subdomain && (
              <span className={styles.error}>{errors.subdomain.message}</span>
            )}
          </div>

          {/* Plan (select dinámico desde backend) */}
          <div className={styles.field}>
            <label htmlFor="planId" className={styles.label}>
              Plan *
            </label>
            <select
              id="planId"
              className={`${styles.input} ${errors.planId ? styles.inputError : ''}`}
              {...register('planId')}
            >
              <option value="">Seleccionar plan</option>
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatLimits(p.limits)})
                </option>
              ))}
            </select>
            {errors.planId && (
              <span className={styles.error}>{errors.planId.message}</span>
            )}
          </div>

          {/* Email de contacto */}
          <div className={styles.field}>
            <label htmlFor="contactEmail" className={styles.label}>
              Email de contacto
            </label>
            <input
              id="contactEmail"
              type="email"
              className={styles.input}
              placeholder="contacto@ejemplo.com"
              {...register('contactEmail')}
            />
          </div>

          {/* Teléfono de contacto */}
          <div className={styles.field}>
            <label htmlFor="contactPhone" className={styles.label}>
              Teléfono de contacto
            </label>
            <input
              id="contactPhone"
              type="tel"
              className={styles.input}
              placeholder="+57 300 123 4567"
              {...register('contactPhone')}
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
