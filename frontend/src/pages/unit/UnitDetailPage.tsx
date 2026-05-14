/* =============================================================================
    SaaS Inmobiliario — Unit Detail Page (Modal)
    Formulario para crear o editar una unidad
    ============================================================================= */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUnitStore } from '../../stores/unitStore';
import { usePropertyStore } from '../../stores/propertyStore';
import { useTowerStore } from '../../stores/towerStore';
import type { Unit, CreateUnitDto, UpdateUnitDto, UnitType, UnitStatus } from '../../types/property';
import styles from './UnitDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const createUnitSchema = z.object({
  propertyId: z.string().min(1, 'La propiedad es requerida'),
  towerId: z.string().optional(),
  identifier: z.string().min(1, 'El identificador es requerido').max(20, 'Máximo 20 caracteres'),
  unitType: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'PARKING'], {
    message: 'Selecciona un tipo de unidad',
  }),
  floor: z.number().min(0).max(100),
  monthlyFeeAmount: z.number().min(0).optional(),
});

const updateUnitSchema = z.object({
  propertyId: z.string().min(1, 'La propiedad es requerida'),
  towerId: z.string().optional(),
  identifier: z.string().min(1, 'El identificador es requerido').max(20, 'Máximo 20 caracteres'),
  unitType: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'PARKING'], {
    message: 'Selecciona un tipo de unidad',
  }),
  floor: z.number().min(0).max(100),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional(),
  monthlyFeeAmount: z.number().min(0).optional(),
});

type CreateFormData = z.infer<typeof createUnitSchema>;
type UpdateFormData = z.infer<typeof updateUnitSchema>;

// ── Props ───────────────────────────────────────────────────────────────────

interface UnitDetailPageProps {
  unit: Unit | null; // null = crear, objeto = editar
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function UnitDetailPage({ unit, onClose, onSuccess }: UnitDetailPageProps) {
  const isEdit = !!unit;
  const { createUnit, updateUnit, loading } = useUnitStore();
  const { properties, fetchProperties: fetchProperties } = usePropertyStore();
  const { towers, fetchTowers: fetchTowers } = useTowerStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState(unit?.propertyId || '');

  // Cargar propiedades al montar
  useEffect(() => {
    fetchProperties({ page: 1, limit: 100 });
  }, []);

  // Cargar torres cuando cambia la propiedad
  useEffect(() => {
    if (selectedPropertyId) {
      fetchTowers({ propertyId: selectedPropertyId, page: 1, limit: 50 });
    }
  }, [selectedPropertyId]);

  // Configurar formulario según modo
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updateUnitSchema : createUnitSchema),
    defaultValues: isEdit
      ? {
          propertyId: unit.propertyId,
          towerId: unit.towerId || '',
          identifier: unit.identifier,
          unitType: unit.unitType,
          floor: unit.floor,
          status: unit.status,
          monthlyFeeAmount: unit.monthlyFeeAmount ?? 0,
        }
      : {
          propertyId: '',
          towerId: '',
          identifier: '',
          unitType: 'APARTMENT' as UnitType,
          floor: 1,
          status: 'AVAILABLE' as UnitStatus,
          monthlyFeeAmount: 0,
        },
  });

  // Observar cambios en propertyId para cargar torres
  const watchedPropertyId = watch('propertyId');
  useEffect(() => {
    if (watchedPropertyId && watchedPropertyId !== selectedPropertyId) {
      setSelectedPropertyId(watchedPropertyId);
    }
  }, [watchedPropertyId]);

  // Reset cuando cambia la unidad
  useEffect(() => {
    if (unit) {
      setSelectedPropertyId(unit.propertyId);
      reset({
        propertyId: unit.propertyId,
        towerId: unit.towerId || '',
        identifier: unit.identifier,
        unitType: unit.unitType,
        floor: unit.floor,
        status: unit.status,
        monthlyFeeAmount: unit.monthlyFeeAmount ?? 0,
      });
    }
  }, [unit, reset]);

  // Manejar envío
  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEdit && unit) {
        const formData = data as UpdateFormData;
        const dto: UpdateUnitDto = {
          propertyId: formData.propertyId,
          towerId: formData.towerId || undefined,
          identifier: formData.identifier,
          unitType: formData.unitType,
          floor: formData.floor,
          status: formData.status,
          monthlyFeeAmount: formData.monthlyFeeAmount || undefined,
        };
        await updateUnit(unit.id, dto);
        onSuccess();
      } else {
        const formData = data as CreateFormData;
        const dto: CreateUnitDto = {
          propertyId: formData.propertyId,
          towerId: formData.towerId || undefined,
          identifier: formData.identifier,
          unitType: formData.unitType,
          floor: formData.floor,
          monthlyFeeAmount: formData.monthlyFeeAmount || undefined,
        };
        await createUnit(dto);
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
            {isEdit ? 'Editar Unidad' : 'Nueva Unidad'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Propiedad */}
          <div className={styles.field}>
            <label htmlFor="propertyId" className={styles.label}>
              Propiedad *
            </label>
            <select
              id="propertyId"
              className={`${styles.input} ${errors.propertyId ? styles.inputError : ''}`}
              {...register('propertyId')}
            >
              <option value="">Selecciona una propiedad</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.propertyId && (
              <span className={styles.error}>{errors.propertyId.message}</span>
            )}
          </div>

          {/* Torre (opcional) */}
          <div className={styles.field}>
            <label htmlFor="towerId" className={styles.label}>
              Torre
            </label>
            <select
              id="towerId"
              className={styles.input}
              {...register('towerId')}
              disabled={!selectedPropertyId}
            >
              <option value="">Sin torre</option>
              {towers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Identificador */}
          <div className={styles.field}>
            <label htmlFor="identifier" className={styles.label}>
              Identificador *
            </label>
            <input
              id="identifier"
              type="text"
              className={`${styles.input} ${errors.identifier ? styles.inputError : ''}`}
              placeholder="Ej: 101, Apto 2A"
              {...register('identifier')}
            />
            {errors.identifier && (
              <span className={styles.error}>{errors.identifier.message}</span>
            )}
          </div>

          {/* Tipo de unidad */}
          <div className={styles.field}>
            <label htmlFor="unitType" className={styles.label}>
              Tipo *
            </label>
            <select
              id="unitType"
              className={`${styles.input} ${errors.unitType ? styles.inputError : ''}`}
              {...register('unitType')}
            >
              <option value="APARTMENT">Apartamento</option>
              <option value="HOUSE">Casa</option>
              <option value="COMMERCIAL">Local</option>
              <option value="PARKING">Parqueadero</option>
            </select>
            {errors.unitType && (
              <span className={styles.error}>{errors.unitType.message}</span>
            )}
          </div>

          {/* Piso */}
          <div className={styles.field}>
            <label htmlFor="floor" className={styles.label}>
              Piso *
            </label>
            <input
              id="floor"
              type="number"
              className={`${styles.input} ${errors.floor ? styles.inputError : ''}`}
              placeholder="1"
              min="0"
              max="100"
              {...register('floor', { valueAsNumber: true })}
            />
            {errors.floor && (
              <span className={styles.error}>{errors.floor.message}</span>
            )}
          </div>

          {/* Estado (solo editar) */}
          {isEdit && (
            <div className={styles.field}>
              <label htmlFor="status" className={styles.label}>
                Estado
              </label>
              <select
                id="status"
                className={styles.input}
                {...register('status')}
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="OCCUPIED">Ocupada</option>
                <option value="MAINTENANCE">Mantenimiento</option>
              </select>
            </div>
          )}

          {/* Mensualidad */}
          <div className={styles.field}>
            <label htmlFor="monthlyFeeAmount" className={styles.label}>
              Valor Mensual
            </label>
            <input
              id="monthlyFeeAmount"
              type="number"
              className={styles.input}
              placeholder="0"
              min="0"
              {...register('monthlyFeeAmount', { valueAsNumber: true })}
            />
            {errors.monthlyFeeAmount && (
              <span className={styles.error}>{errors.monthlyFeeAmount.message}</span>
            )}
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