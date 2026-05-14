/* =============================================================================
    SaaS Inmobiliario — Assign Resident Modal
    Formulario para crear una ocupación (asignar residente a unidad)
    ============================================================================= */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOccupancyStore } from '../../stores/occupancyStore';
import { useUnitStore } from '../../stores/unitStore';
import type { Resident, CreateOccupancyDto, OccupancyType } from '../../types/resident';
import styles from './AssignResidentModal.module.css';

const createOccupancySchema = z.object({
  unitId: z.string().min(1, 'La unidad es requerida'),
  type: z.enum(['OWNER', 'TENANT'], {
    message: 'Selecciona el tipo de ocupación',
  }),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type FormData = z.infer<typeof createOccupancySchema>;

// ── Props ───────────────────────────────────────────────────────────────────

interface AssignResidentModalProps {
  resident: Resident;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function AssignResidentModal({
  resident,
  onClose,
  onSuccess,
}: AssignResidentModalProps) {
  const { createOccupancy, loading } = useOccupancyStore();
  const { units, fetchUnits, loading: unitsLoading } = useUnitStore();

  // Cargar unidades disponibles al montar
  useEffect(() => {
    fetchUnits({ page: 1, limit: 100, status: 'AVAILABLE' });
  }, []);

  // Configurar formulario
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createOccupancySchema),
    defaultValues: {
      unitId: '',
      type: 'TENANT' as OccupancyType,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Manejar envío
  const onSubmit = async (data: FormData) => {
    try {
      const dto: CreateOccupancyDto = {
        unitId: data.unitId,
        residentId: resident.id,
        type: data.type,
        startDate: data.startDate,
        notes: data.notes,
      };
      await createOccupancy(dto);
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
          <h2 className={styles.title}>Asignar a Unidad</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Info del residente ──────────────────────────────────────── */}
        <div className={styles.residentInfo}>
          <div className={styles.residentName}>
            {resident.firstName} {resident.lastName}
          </div>
          <div className={styles.residentDoc}>
            {resident.documentType}: {resident.documentNumber}
          </div>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Unidad ──────────────────────────────────────────────────────── */}
          <div className={styles.field}>
            <label htmlFor="unitId" className={styles.label}>
              Unidad *
            </label>
            <select
              id="unitId"
              className={`${styles.input} ${
                errors.unitId ? styles.inputError : ''
              }`}
              {...register('unitId')}
              disabled={unitsLoading}
            >
              <option value="">Selecciona una unidad</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.identifier}
                </option>
              ))}
            </select>
            {errors.unitId && (
              <span className={styles.error}>{errors.unitId.message}</span>
            )}
          </div>

          {/* Tipo de ocupación ─────────────────────────────────────────────── */}
          <div className={styles.field}>
            <label htmlFor="type" className={styles.label}>
              Tipo de Ocupación *
            </label>
            <select
              id="type"
              className={`${styles.input} ${
                errors.type ? styles.inputError : ''
              }`}
              {...register('type')}
            >
              <option value="OWNER">Propietario</option>
              <option value="TENANT">Arrendatario</option>
            </select>
            {errors.type && (
              <span className={styles.error}>{errors.type.message}</span>
            )}
          </div>

          {/* Fecha de inicio ──────────────────────────────────────────────────── */}
          <div className={styles.field}>
            <label htmlFor="startDate" className={styles.label}>
              Fecha de Inicio *
            </label>
            <input
              id="startDate"
              type="date"
              className={`${styles.input} ${
                errors.startDate ? styles.inputError : ''
              }`}
              {...register('startDate')}
            />
            {errors.startDate && (
              <span className={styles.error}>{errors.startDate.message}</span>
            )}
          </div>

          {/* Notas ──────────────────────────────────────────────────────── */}
          <div className={styles.field}>
            <label htmlFor="notes" className={styles.label}>
              Notas
            </label>
            <textarea
              id="notes"
              className={styles.input}
              placeholder="Notas adicionales sobre la ocupación..."
              rows={3}
              {...register('notes')}
            />
            {errors.notes && (
              <span className={styles.error}>{errors.notes.message}</span>
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
              {loading ? 'Guardando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}