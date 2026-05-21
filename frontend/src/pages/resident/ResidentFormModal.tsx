/* =============================================================================
    SaaS Inmobiliario — Resident Form Modal
    Formulario para crear o editar un residente
    ============================================================================= */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResidentStore } from '../../stores/residentStore';
import type { Resident, CreateResidentDto, UpdateResidentDto, DocumentType } from '../../types/resident';
import styles from './ResidentFormModal.module.css';

const createResidentSchema = z.object({
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(50, 'Máximo 50 caracteres'),
  documentType: z.enum(['CC', 'CE', 'PASSPORT', 'NIT'], {
    message: 'Selecciona un tipo de documento',
  }),
  documentNumber: z
    .string()
    .min(1, 'El número de documento es requerido')
    .max(20, 'Máximo 20 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  emergencyContact: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
});

const updateResidentSchema = createResidentSchema;

type CreateFormData = z.infer<typeof createResidentSchema>;
type UpdateFormData = z.infer<typeof updateResidentSchema>;

// ── Props ───────────────────────────────────────────────────────────────────

interface ResidentFormModalProps {
  resident: Resident | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function ResidentFormModal({
  resident,
  onClose,
  onSuccess,
}: ResidentFormModalProps) {
  const isEdit = !!resident;
  const { createResident, updateResident, loading } = useResidentStore();

  // Configurar formulario según modo
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? updateResidentSchema : createResidentSchema),
    defaultValues: isEdit
      ? {
          firstName: resident.firstName,
          lastName: resident.lastName,
          documentType: resident.documentType,
          documentNumber: resident.documentNumber,
          email: resident.email || '',
          phone: resident.phone || '',
          emergencyContact: resident.emergencyContact || '',
        }
      : {
          firstName: '',
          lastName: '',
          documentType: 'CC' as DocumentType,
          documentNumber: '',
          email: '',
          phone: '',
          emergencyContact: '',
        },
  });

  // Manejar envío
  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEdit && resident) {
        const dto: UpdateResidentDto = {
          firstName: data.firstName,
          lastName: data.lastName,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          email: data.email,
          phone: data.phone,
          emergencyContact: data.emergencyContact,
        };
        await updateResident(resident.id, dto);
        onSuccess();
      } else {
        const dto: CreateResidentDto = {
          firstName: data.firstName,
          lastName: data.lastName,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          email: data.email,
          phone: data.phone,
          emergencyContact: data.emergencyContact,
        };
        await createResident(dto);
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
            {isEdit ? 'Editar Residente' : 'Nuevo Residente'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Nombres ─────────────────────────────────────────────────────────────── */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>
                Nombre *
              </label>
              <input
                id="firstName"
                type="text"
                className={`${styles.input} ${
                  errors.firstName ? styles.inputError : ''
                }`}
                placeholder="Juan"
                {...register('firstName')}
              />
              {errors.firstName && (
                <span className={styles.error}>{errors.firstName.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>
                Apellido *
              </label>
              <input
                id="lastName"
                type="text"
                className={`${styles.input} ${
                  errors.lastName ? styles.inputError : ''
                }`}
                placeholder="Pérez"
                {...register('lastName')}
              />
              {errors.lastName && (
                <span className={styles.error}>{errors.lastName.message}</span>
              )}
            </div>
          </div>

          {/* Documento ──────────────────────────────────────────────────────── */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="documentType" className={styles.label}>
                Tipo de Documento *
              </label>
              <select
                id="documentType"
                className={`${styles.input} ${
                  errors.documentType ? styles.inputError : ''
                }`}
                {...register('documentType')}
              >
                <option value="CC">Cédula</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
              {errors.documentType && (
                <span className={styles.error}>{errors.documentType.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="documentNumber" className={styles.label}>
                Número de Documento *
              </label>
              <input
                id="documentNumber"
                type="text"
                className={`${styles.input} ${
                  errors.documentNumber ? styles.inputError : ''
                }`}
                placeholder="12345678"
                {...register('documentNumber')}
              />
              {errors.documentNumber && (
                <span className={styles.error}>{errors.documentNumber.message}</span>
              )}
            </div>
          </div>

          {/* Contacto ──────────────────────────────────────────────────────── */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="juan@ejemplo.com"
                {...register('email')}
              />
              {errors.email && (
                <span className={styles.error}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="phone" className={styles.label}>
                Teléfono
              </label>
              <input
                id="phone"
                type="text"
                className={styles.input}
                placeholder="3001234567"
                {...register('phone')}
              />
              {errors.phone && (
                <span className={styles.error}>{errors.phone.message}</span>
              )}
            </div>
          </div>

          {/* Contacto de emergencia ───────────────────────────────────── */}
          <div className={styles.field}>
            <label htmlFor="emergencyContact" className={styles.label}>
              Contacto de Emergencia
            </label>
            <input
              id="emergencyContact"
              type="text"
              className={styles.input}
              placeholder="Nombre y teléfono de contacto"
              {...register('emergencyContact')}
            />
            {errors.emergencyContact && (
              <span className={styles.error}>
                {errors.emergencyContact.message}
              </span>
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