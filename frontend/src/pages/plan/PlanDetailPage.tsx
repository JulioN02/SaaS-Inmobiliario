/* =============================================================================
   SaaS Inmobiliario — Plan Detail Page (Modal)
   Formulario para crear o editar un plan
   ============================================================================= */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlanStore } from '../../stores/planStore';
import type { Plan } from '../../types';
import styles from './PlanDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  limits: z.object({
    properties: z.coerce.number().int('Debe ser un número entero').min(-1, 'Mínimo -1'),
    units: z.coerce.number().int('Debe ser un número entero').min(-1, 'Mínimo -1'),
    users: z.coerce.number().int('Debe ser un número entero').min(-1, 'Mínimo -1'),
  }),
  prices: z.object({
    monthly: z.coerce.number().min(0, 'Debe ser un valor positivo'),
    yearly: z.coerce.number().min(0, 'Debe ser un valor positivo'),
  }),
  features: z.array(z.string()).optional(),
  sortOrder: z.coerce.number().int('Debe ser un número entero').default(0),
  isActive: z.boolean().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

// ── Props ───────────────────────────────────────────────────────────────────

interface PlanDetailPageProps {
  plan: Plan | null; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function PlanDetailPage({ plan, onClose, onSuccess }: PlanDetailPageProps) {
  const isEdit = !!plan;
  const { createPlan, updatePlan, loading } = usePlanStore();
  const [featureInput, setFeatureInput] = useState('');

  // Configurar formulario según modo
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: isEdit
      ? {
          name: plan.name,
          slug: plan.slug,
          description: plan.description ?? '',
          limits: {
            properties: plan.limits.properties,
            units: plan.limits.units,
            users: plan.limits.users,
          },
          prices: {
            monthly: plan.prices.monthly,
            yearly: plan.prices.yearly,
          },
          features: plan.features ?? [],
          sortOrder: plan.sortOrder,
          isActive: plan.isActive,
        }
      : {
          name: '',
          slug: '',
          description: '',
          limits: { properties: 1, units: 100, users: 5 },
          prices: { monthly: 0, yearly: 0 },
          features: [],
          sortOrder: 0,
          isActive: true,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features',
  });

  // Auto-generar slug desde nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', slug);
    }
  };

  // Agregar característica
  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !fields.some((f) => f.value === trimmed)) {
      append(trimmed);
      setFeatureInput('');
    }
  };

  // Manejar envío
  const onSubmit = async (data: PlanFormData) => {
    try {
      const features = data.features?.filter((f) => f.trim() !== '') ?? [];
      if (isEdit && plan) {
        await updatePlan(plan.id, {
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          limits: data.limits,
          prices: data.prices,
          features,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        });
      } else {
        await createPlan({
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          limits: data.limits,
          prices: data.prices,
          features,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder,
        });
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
            {isEdit ? 'Editar Plan' : 'Nuevo Plan'}
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
              placeholder="Nombre del plan"
              {...register('name', { onChange: handleNameChange })}
            />
            {errors.name && (
              <span className={styles.error}>{errors.name.message}</span>
            )}
          </div>

          {/* Slug */}
          <div className={styles.field}>
            <label htmlFor="slug" className={styles.label}>
              Slug *
            </label>
            <input
              id="slug"
              type="text"
              className={`${styles.input} ${errors.slug ? styles.inputError : ''}`}
              placeholder="nombre-del-plan"
              {...register('slug')}
            />
            {errors.slug && (
              <span className={styles.error}>{errors.slug.message}</span>
            )}
          </div>

          {/* Descripción */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Descripción
            </label>
            <textarea
              id="description"
              className={`${styles.input} ${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Descripción del plan"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <span className={styles.error}>{errors.description.message}</span>
            )}
          </div>

          {/* ── Límites ────────────────────────────────────────────────── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Límites</h3>
            <div className={styles.limitsRow}>
              <div className={styles.field}>
                <label htmlFor="limits.properties" className={styles.label}>
                  Propiedades (-1 = Ilimitado)
                </label>
                <input
                  id="limits.properties"
                  type="number"
                  className={`${styles.input} ${errors.limits?.properties ? styles.inputError : ''}`}
                  {...register('limits.properties')}
                />
                {errors.limits?.properties && (
                  <span className={styles.error}>{errors.limits.properties.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="limits.units" className={styles.label}>
                  Unidades (-1 = Ilimitado)
                </label>
                <input
                  id="limits.units"
                  type="number"
                  className={`${styles.input} ${errors.limits?.units ? styles.inputError : ''}`}
                  {...register('limits.units')}
                />
                {errors.limits?.units && (
                  <span className={styles.error}>{errors.limits.units.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="limits.users" className={styles.label}>
                  Usuarios (-1 = Ilimitado)
                </label>
                <input
                  id="limits.users"
                  type="number"
                  className={`${styles.input} ${errors.limits?.users ? styles.inputError : ''}`}
                  {...register('limits.users')}
                />
                {errors.limits?.users && (
                  <span className={styles.error}>{errors.limits.users.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Precios ────────────────────────────────────────────────── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Precios</h3>
            <div className={styles.pricesRow}>
              <div className={styles.field}>
                <label htmlFor="prices.monthly" className={styles.label}>
                  Mensual (COP)
                </label>
                <input
                  id="prices.monthly"
                  type="number"
                  className={`${styles.input} ${errors.prices?.monthly ? styles.inputError : ''}`}
                  placeholder="0"
                  {...register('prices.monthly')}
                />
                {errors.prices?.monthly && (
                  <span className={styles.error}>{errors.prices.monthly.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="prices.yearly" className={styles.label}>
                  Anual (COP)
                </label>
                <input
                  id="prices.yearly"
                  type="number"
                  className={`${styles.input} ${errors.prices?.yearly ? styles.inputError : ''}`}
                  placeholder="0"
                  {...register('prices.yearly')}
                />
                {errors.prices?.yearly && (
                  <span className={styles.error}>{errors.prices.yearly.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Características ────────────────────────────────────────── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Características</h3>
            <div className={styles.featureInputRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="Agregar característica"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                className={styles.addFeatureButton}
                onClick={handleAddFeature}
              >
                +
              </button>
            </div>
            {fields.length > 0 && (
              <div className={styles.featureList}>
                {fields.map((field, index) => (
                  <div key={field.id} className={styles.featureRow}>
                    <input
                      type="text"
                      className={`${styles.input} ${styles.featureInput}`}
                      {...register(`features.${index}`)}
                    />
                    <button
                      type="button"
                      className={styles.removeFeatureButton}
                      onClick={() => remove(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sort Order */}
          <div className={styles.field}>
            <label htmlFor="sortOrder" className={styles.label}>
              Orden
            </label>
            <input
              id="sortOrder"
              type="number"
              className={`${styles.input} ${styles.sortOrderInput} ${errors.sortOrder ? styles.inputError : ''}`}
              {...register('sortOrder')}
            />
            {errors.sortOrder && (
              <span className={styles.error}>{errors.sortOrder.message}</span>
            )}
          </div>

          {/* ── Acciones ────────────────────────────────────────────────── */}
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
