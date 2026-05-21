/* =============================================================================
    SaaS Inmobiliario — Property Detail Page (Modal)
    Formulario para crear o editar una propiedad
    ============================================================================= */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePropertyStore } from '../../stores/propertyStore';
import type { Property, CreatePropertyDto, UpdatePropertyDto } from '../../types/property';
import styles from './PropertyDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const propertyTypeEnum = z.enum(['CONJUNTO', 'EDIFICIO', 'TORRE', 'CASA_INDEPENDIENTE']);

const createPropertySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  address: z.string().max(200, 'Máximo 200 caracteres').optional(),
  propertyType: propertyTypeEnum,
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  isPublished: z.boolean().optional(),
  imageUrl: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

const updatePropertySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  address: z.string().max(200, 'Máximo 200 caracteres').optional(),
  propertyType: propertyTypeEnum,
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  isPublished: z.boolean().optional(),
  imageUrl: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type CreateFormData = z.infer<typeof createPropertySchema>;
type UpdateFormData = z.infer<typeof updatePropertySchema>;

// ── Props ───────────────────────────────────────────────────────────────────

interface PropertyDetailPageProps {
  property: Property | null; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: () => void;
  viewOnly?: boolean; // true = modo solo lectura
}

// ── Componente ──────────────────────────────────────────────────────────────

export function PropertyDetailPage({ property, onClose, onSuccess, viewOnly }: PropertyDetailPageProps) {
  const isEdit = !!property && !viewOnly;
  const { createProperty, updateProperty, loading } = usePropertyStore();

  // Configurar formulario según modo
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updatePropertySchema : createPropertySchema),
    defaultValues: isEdit
      ? {
          name: property.name,
          address: property.address ?? '',
          propertyType: property.propertyType,
          description: property.description ?? '',
          isPublished: property.isPublished ?? false,
          imageUrl: property.imageUrl ?? '',
        }
      : {
          name: '',
          address: '',
          propertyType: 'CONJUNTO' as const,
          description: '',
          isPublished: false,
          imageUrl: '',
        },
  });

  // Reset cuando cambia la propiedad
  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        address: property.address ?? '',
        propertyType: property.propertyType,
        description: property.description ?? '',
        isPublished: property.isPublished ?? false,
        imageUrl: property.imageUrl ?? '',
      });
    }
  }, [property, reset]);

  // Manejar envío
  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEdit && property) {
        const dto: UpdatePropertyDto = {
          name: data.name,
          address: data.address || '',
          propertyType: data.propertyType,
          description: data.description || '',
          isPublished: data.isPublished,
          imageUrl: data.imageUrl || undefined,
        };
        await updateProperty(property.id, dto);
        onSuccess();
      } else {
        const dto: CreatePropertyDto = {
          name: data.name,
          address: data.address || '',
          propertyType: data.propertyType,
          description: data.description || '',
          isPublished: data.isPublished,
          imageUrl: data.imageUrl || undefined,
        };
        await createProperty(dto);
        onSuccess();
      }
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
            {viewOnly ? 'Ver Propiedad' : isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}
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
              placeholder="Nombre de la propiedad"
              disabled={viewOnly}
              {...register('name')}
            />
            {errors.name && (
              <span className={styles.error}>{errors.name.message}</span>
            )}
          </div>

          {/* Tipo de propiedad */}
          <div className={styles.field}>
            <label htmlFor="propertyType" className={styles.label}>
              Tipo *
            </label>
            <select
              id="propertyType"
              className={`${styles.input} ${errors.propertyType ? styles.inputError : ''}`}
              disabled={viewOnly}
              {...register('propertyType')}
            >
              <option value="CONJUNTO">Conjunto</option>
              <option value="EDIFICIO">Edificio</option>
              <option value="TORRE">Torre</option>
              <option value="CASA_INDEPENDIENTE">Casa Independiente</option>
            </select>
            {errors.propertyType && (
              <span className={styles.error}>{errors.propertyType.message}</span>
            )}
          </div>

          {/* Dirección */}
          <div className={styles.field}>
            <label htmlFor="address" className={styles.label}>
              Dirección
            </label>
            <input
              id="address"
              type="text"
              className={styles.input}
              placeholder="Dirección de la propiedad"
              disabled={viewOnly}
              {...register('address')}
            />
            {errors.address && (
              <span className={styles.error}>{errors.address.message}</span>
            )}
          </div>

          {/* Descripción */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Descripción
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              placeholder="Descripción opcional"
              rows={3}
              disabled={viewOnly}
              {...register('description')}
            />
            {errors.description && (
              <span className={styles.error}>{errors.description.message}</span>
            )}
          </div>

          {/* Publicar en web */}
          {!viewOnly && (
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  {...register('isPublished')}
                />
                <span>Publicar en el sitio web</span>
              </label>
              <span className={styles.fieldHint}>
                Si activas esta opción, la propiedad aparecerá en el sitio web público.
              </span>
            </div>
          )}

          {/* URL de imagen */}
          {!viewOnly && (
            <div className={styles.field}>
              <label htmlFor="imageUrl" className={styles.label}>
                URL de imagen para el sitio web
              </label>
              <input
                id="imageUrl"
                type="url"
                className={styles.input}
                placeholder="https://ejemplo.com/imagen.jpg"
                disabled={viewOnly}
                {...register('imageUrl')}
              />
              {errors.imageUrl && (
                <span className={styles.error}>{errors.imageUrl.message}</span>
              )}
            </div>
          )}

          {/* ── Acciones ──────────────────────────────────────────────────── */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              {viewOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!viewOnly && (
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
            )}
          </div>
        </form>
      </div>
    </div>
  );
}