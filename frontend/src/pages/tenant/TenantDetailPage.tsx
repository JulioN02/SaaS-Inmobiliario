/* =============================================================================
   SaaS Inmobiliario — Tenant Detail Page (Modal)
   Formulario para crear o editar un tenant
   ============================================================================= */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenantStore } from '../../stores/tenantStore';
import type { Tenant, TenantPlan, CreateTenantDto, UpdateTenantDto } from '../../types';
import styles from './TenantDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const createTenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  subdomain: z
    .string()
    .min(1, 'El subdominio es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  plan: z.enum(['BASIC', 'PREMIUM', 'ENTERPRISE'], { message: 'El plan es requerido' }),
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
  plan: z.enum(['BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
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
          plan: tenant.plan,
          contactEmail: tenant.contactEmail ?? '',
          contactPhone: tenant.contactPhone ?? '',
        }
      : {
          name: '',
          subdomain: '',
          plan: 'BASIC' as TenantPlan,
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
          plan: data.plan,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone || undefined,
        };
        await updateTenant(tenant.id, dto);
      } else {
        const createData = data as CreateFormData;
        const dto: CreateTenantDto = {
          name: createData.name,
          subdomain: createData.subdomain,
          plan: createData.plan,
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

          {/* Plan (solo crear) */}
          {!isEdit && (
            <div className={styles.field}>
              <label htmlFor="plan" className={styles.label}>
                Plan *
              </label>
              <select
                id="plan"
                className={`${styles.input} ${errors.plan ? styles.inputError : ''}`}
                {...register('plan')}
              >
                <option value="BASIC">Básico (1 propiedad, 5 usuarios)</option>
                <option value="PREMIUM">Premium (10 propiedades, 15 usuarios)</option>
                <option value="ENTERPRISE">Enterprise (Sin límites)</option>
              </select>
              {errors.plan && (
                <span className={styles.error}>{errors.plan.message}</span>
              )}
            </div>
          )}

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