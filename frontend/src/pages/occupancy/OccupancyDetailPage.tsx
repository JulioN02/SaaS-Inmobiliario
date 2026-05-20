/* =============================================================================
   SaaS Inmobiliario — Occupancy Detail Page (Modal)
   Formulario para crear una nueva ocupación
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOccupancyStore } from '../../stores/occupancyStore';
import { toast } from '../../stores/toastStore';
import { api } from '../../services/api';
import type { Occupancy, CreateOccupancyDto, OccupancyType } from '../../types/resident';
import styles from './OccupancyDetailPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const occupancyTypes = ['OWNER', 'TENANT'] as const;

const createOccupancySchema = z.object({
  unitId: z.string().min(1, 'La unidad es requerida'),
  residentId: z.string().min(1, 'El residente es requerido'),
  type: z.enum(occupancyTypes, { message: 'El tipo es requerido' }),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type CreateFormData = z.infer<typeof createOccupancySchema>;

// ── Tipos de opciones ────────────────────────────────────────────────────────

interface UnitOption {
  id: string;
  identifier: string;
  status: string;
}

interface ResidentOption {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface OccupancyDetailPageProps {
  occupancy: Occupancy | null; // null = crear
  onClose: () => void;
  onSuccess: () => void;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function OccupancyDetailPage({ onClose, onSuccess }: OccupancyDetailPageProps) {
  const { createOccupancy, loading } = useOccupancyStore();
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // ── Documentos ─────────────────────────────────────────────────────────────
  const DOCUMENT_TYPES = [
    { value: 'CONTRATO', label: 'Contrato' },
    { value: 'LEGAL', label: 'Documento Legal' },
    { value: 'IDENTIDAD', label: 'Identidad' },
    { value: 'OTRO', label: 'Otro' },
  ] as const;

  const [documents, setDocuments] = useState<Array<{
    name: string;
    type: string;
    url: string;
    notes: string;
  }>>([]);

  const handleAddDocument = () => {
    setDocuments(prev => [...prev, { name: '', type: 'CONTRATO', url: '', notes: '' }]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDocumentChange = (index: number, field: string, value: string) => {
    setDocuments(prev => prev.map((doc, i) =>
      i === index ? { ...doc, [field]: value } : doc
    ));
  };

  // Cargar unidades y residentes al montar
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        // Cargar unidades (solo las disponibles)
        const unitsResponse = await api.get<{ data: UnitOption[] }>('/units', {
          params: { status: 'AVAILABLE', limit: 100 },
        });
        setUnits(unitsResponse.data.data || []);

        // Cargar residentes activos
        const residentsResponse = await api.get<{ data: ResidentOption[] }>('/residents', {
          params: { limit: 100 },
        });
        setResidents(residentsResponse.data.data || []);
      } catch (err) {
        toast.error('Error al cargar opciones');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Configurar formulario
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createOccupancySchema),
    defaultValues: {
      unitId: '',
      residentId: '',
      type: 'TENANT' as OccupancyType,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
    },
  });

  // Manejar envío
  const onSubmit = async (data: CreateFormData) => {
    try {
      const docs = documents.filter(d => d.name.trim().length > 0);
      const dto: CreateOccupancyDto = {
        unitId: data.unitId,
        residentId: data.residentId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        documents: docs.length > 0 ? docs.map(d => ({
          name: d.name,
          type: d.type,
          url: d.url || undefined,
          notes: d.notes || undefined,
        })) : undefined,
        notes: data.notes || undefined,
      };
      await createOccupancy(dto);
      toast.success('Ocupación creada exitosamente');
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
          <h2 className={styles.title}>Nueva Ocupación</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Unidad */}
          <div className={styles.field}>
            <label htmlFor="unitId" className={styles.label}>
              Unidad *
            </label>
            <select
              id="unitId"
              className={`${styles.input} ${errors.unitId ? styles.inputError : ''}`}
              {...register('unitId')}
              disabled={loadingOptions}
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

          {/* Residente */}
          <div className={styles.field}>
            <label htmlFor="residentId" className={styles.label}>
              Residente *
            </label>
            <select
              id="residentId"
              className={`${styles.input} ${errors.residentId ? styles.inputError : ''}`}
              {...register('residentId')}
              disabled={loadingOptions}
            >
              <option value="">Selecciona un residente</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.firstName} {resident.lastName} ({resident.documentNumber})
                </option>
              ))}
            </select>
            {errors.residentId && (
              <span className={styles.error}>{errors.residentId.message}</span>
            )}
          </div>

          {/* Tipo */}
          <div className={styles.field}>
            <label htmlFor="type" className={styles.label}>
              Tipo *
            </label>
            <select
              id="type"
              className={`${styles.input} ${errors.type ? styles.inputError : ''}`}
              {...register('type')}
            >
              <option value="OWNER">Propietario</option>
              <option value="TENANT">Arrendatario</option>
            </select>
            {errors.type && (
              <span className={styles.error}>{errors.type.message}</span>
            )}
          </div>

          {/* Fecha inicio */}
          <div className={styles.field}>
            <label htmlFor="startDate" className={styles.label}>
              Fecha de Inicio *
            </label>
            <input
              id="startDate"
              type="date"
              className={`${styles.input} ${errors.startDate ? styles.inputError : ''}`}
              {...register('startDate')}
            />
            {errors.startDate && (
              <span className={styles.error}>{errors.startDate.message}</span>
            )}
          </div>

          {/* Fecha fin */}
          <div className={styles.field}>
            <label htmlFor="endDate" className={styles.label}>
              Fecha de Finalización <small style={{ fontWeight: 400, color: '#94A3B8' }}>(opcional)</small>
            </label>
            <input
              id="endDate"
              type="date"
              className={styles.input}
              {...register('endDate')}
            />
          </div>

          {/* Notas */}
          <div className={styles.field}>
            <label htmlFor="notes" className={styles.label}>
              Notas
            </label>
            <textarea
              id="notes"
              className={styles.textarea}
              placeholder="Notas opcionales sobre la ocupación"
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* ── Documentos ───────────────────────────────────────────────── */}
          <div className={styles.field}>
            <label className={styles.label}>
              Documentos <small style={{ fontWeight: 400, color: '#94A3B8' }}>(opcional)</small>
            </label>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>
              Agrega documentos como contratos, documentación legal, identidad, etc.
            </p>

            {documents.map((doc, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: '#FAFAFA',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: '#374151' }}>Documento #{index + 1}</strong>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    style={{
                      background: '#FEE2E2',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#DC2626',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕ Eliminar
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                      placeholder="Ej: Contrato de arrendamiento"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Tipo</label>
                    <select
                      value={doc.type}
                      onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      {DOCUMENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>URL / Referencia</label>
                  <input
                    type="text"
                    value={doc.url}
                    onChange={(e) => handleDocumentChange(index, 'url', e.target.value)}
                    placeholder="URL del documento (opcional)"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Notas</label>
                  <input
                    type="text"
                    value={doc.notes}
                    onChange={(e) => handleDocumentChange(index, 'notes', e.target.value)}
                    placeholder="Notas sobre el documento (opcional)"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddDocument}
              style={{
                padding: '8px 16px',
                background: '#F0F9FF',
                border: '1px dashed #38BDF8',
                borderRadius: '6px',
                color: '#0284C7',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%',
              }}
            >
              + Agregar Documento
            </button>
          </div>

          {/* ── Acciones ──────────────────────────────────────────────────── */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading || loadingOptions}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || loadingOptions}
            >
              {loading ? 'Guardando...' : 'Crear Ocupación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}