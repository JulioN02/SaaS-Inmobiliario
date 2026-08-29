/* =============================================================================
   SaaS Inmobiliario — Payment Form Modal
   Registrar un pago para una factura
   ============================================================================= */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '../../stores/toastStore';
import { createPayment } from '../../services/billing';
import type { InvoiceDto, PaymentMethod } from '../../types';
import styles from './PaymentFormModal.module.css';

// ── Props ───────────────────────────────────────────────────────────────────

interface PaymentFormModalProps {
  invoice: InvoiceDto;
  remaining: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  amount: number;
  method: PaymentMethod;
  reference: string;
  receivedBy: string;
}

// ── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Otro' },
];

// ── Component ────────────────────────────────────────────────────────────────

export function PaymentFormModal({ invoice, remaining, onClose, onSuccess }: PaymentFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      amount: remaining,
      method: 'cash',
      reference: '',
      receivedBy: '',
    },
  });

  const enteredAmount = watch('amount');

  const onSubmit = async (data: FormData) => {
    // Validate no partial payments
    if (data.amount < remaining) {
      toast.error('No se aceptan pagos parciales. El monto debe cubrir el saldo pendiente.');
      return;
    }

    setSubmitting(true);
    try {
      await createPayment({
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        amount: data.amount,
        method: data.method,
        reference: data.reference || undefined,
        receivedBy: data.receivedBy,
      });
      toast.success('Pago registrado exitosamente');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h2 className={styles.title}>Registrar Pago</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Info ──────────────────────────────────────────────────────── */}
        <div className={styles.infoBar}>
          <span>Factura: {formatCurrency(invoice.amount)}</span>
          <span className={styles.infoSep}>·</span>
          <span>Saldo pendiente: {formatCurrency(remaining)}</span>
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
              {...register('amount', {
                required: 'El monto es requerido',
                min: { value: 1, message: 'El monto debe ser mayor a 0' },
              })}
            />
            {errors.amount && <span className={styles.error}>{errors.amount.message}</span>}
            {enteredAmount > 0 && enteredAmount < remaining && (
              <span className={styles.warning}>
                ⚠️ No se aceptan pagos parciales. Debe ser igual al saldo pendiente ({formatCurrency(remaining)}).
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="method" className={styles.label}>
              Método de Pago *
            </label>
            <select
              id="method"
              className={`${styles.input} ${errors.method ? styles.inputError : ''}`}
              {...register('method', { required: 'El método es requerido' })}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {errors.method && <span className={styles.error}>{errors.method.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="reference" className={styles.label}>
              Referencia
            </label>
            <input
              id="reference"
              type="text"
              className={styles.input}
              placeholder="Número de comprobante o referencia"
              {...register('reference')}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="receivedBy" className={styles.label}>
              Recibido Por *
            </label>
            <input
              id="receivedBy"
              type="text"
              className={`${styles.input} ${errors.receivedBy ? styles.inputError : ''}`}
              placeholder="Nombre de quien recibe"
              {...register('receivedBy', { required: 'Este campo es requerido' })}
            />
            {errors.receivedBy && <span className={styles.error}>{errors.receivedBy.message}</span>}
          </div>

          <div className={styles.note}>
            <strong>Nota:</strong> No se aceptan pagos parciales. El monto debe ser igual al saldo pendiente de la factura.
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
              {submitting ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
