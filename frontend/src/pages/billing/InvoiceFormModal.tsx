/* =============================================================================
   SaaS Inmobiliario — Invoice Form Modal
   Crear o editar una factura
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '../../stores/toastStore';
import {
  createInvoice,
  updateInvoice,
  fetchSubscriptions,
  type SubscriptionListParams,
  type PaginatedSubscriptions,
} from '../../services/billing';
import type { InvoiceDto, CreateInvoiceDto } from '../../types';
import styles from './InvoiceFormModal.module.css';

// ── Props ───────────────────────────────────────────────────────────────────

interface InvoiceFormModalProps {
  tenantId: string;
  invoice?: InvoiceDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  notes: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function InvoiceFormModal({ tenantId, invoice, onClose, onSuccess }: InvoiceFormModalProps) {
  const isEdit = !!invoice;
  const [submitting, setSubmitting] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    defaultValues: isEdit && invoice
      ? {
          amount: invoice.amount,
          periodStart: invoice.periodStart.split('T')[0] || invoice.periodStart,
          periodEnd: invoice.periodEnd.split('T')[0] || invoice.periodEnd,
          dueDate: invoice.dueDate.split('T')[0] || invoice.dueDate,
          notes: invoice.notes ?? '',
        }
      : {
          amount: 0,
          periodStart: new Date().toISOString().split('T')[0],
          periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
          notes: '',
        },
  });

  // Cargar subscripción del tenant para obtener IDs
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const params: SubscriptionListParams = { page: 1, limit: 100 };
        const result: PaginatedSubscriptions = await fetchSubscriptions(params);
        const sub = result.data.find((s) => s.tenantId === tenantId);
        if (sub) {
          setSubscriptionId(sub.id);
          setPlanId(sub.planId);
        }
      } catch (err) {
        // Silently fail — we'll let the API validate
      }
    };
    loadSubscription();
  }, [tenantId]);

  const onSubmit = async (data: FormData) => {
    if (!subscriptionId || !planId) {
      toast.error('No se encontró una suscripción activa para este tenant');
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateInvoiceDto = {
        subscriptionId,
        tenantId,
        planId,
        amount: data.amount,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
      };

      if (isEdit && invoice) {
        await updateInvoice(invoice.id, dto);
        toast.success('Factura actualizada');
      } else {
        await createInvoice(dto);
        toast.success('Factura creada');
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar factura');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEdit ? 'Editar Factura' : 'Nueva Factura'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="amount" className={styles.label}>
              Monto (COP) *
            </label>
            <input
              id="amount"
              type="number"
              step="1"
              min="0"
              className={`${styles.input} ${errors.amount ? styles.inputError : ''}`}
              placeholder="0"
              {...register('amount', { required: 'El monto es requerido', min: { value: 1, message: 'El monto debe ser mayor a 0' } })}
            />
            {errors.amount && <span className={styles.error}>{errors.amount.message}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="periodStart" className={styles.label}>
                Inicio del Periodo *
              </label>
              <input
                id="periodStart"
                type="date"
                className={`${styles.input} ${errors.periodStart ? styles.inputError : ''}`}
                {...register('periodStart', { required: 'La fecha de inicio es requerida' })}
              />
              {errors.periodStart && <span className={styles.error}>{errors.periodStart.message}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="periodEnd" className={styles.label}>
                Fin del Periodo *
              </label>
              <input
                id="periodEnd"
                type="date"
                className={`${styles.input} ${errors.periodEnd ? styles.inputError : ''}`}
                {...register('periodEnd', { required: 'La fecha de fin es requerida' })}
              />
              {errors.periodEnd && <span className={styles.error}>{errors.periodEnd.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="dueDate" className={styles.label}>
              Fecha de Vencimiento *
            </label>
            <input
              id="dueDate"
              type="date"
              className={`${styles.input} ${errors.dueDate ? styles.inputError : ''}`}
              {...register('dueDate', { required: 'La fecha de vencimiento es requerida' })}
            />
            {errors.dueDate && <span className={styles.error}>{errors.dueDate.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="notes" className={styles.label}>
              Notas
            </label>
            <textarea
              id="notes"
              className={`${styles.input} ${styles.textarea} ${errors.notes ? styles.inputError : ''}`}
              placeholder="Notas opcionales"
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* ── Actions ────────────────────────────────────────────────── */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting
                ? 'Guardando...'
                : isEdit
                ? 'Actualizar'
                : 'Crear Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
