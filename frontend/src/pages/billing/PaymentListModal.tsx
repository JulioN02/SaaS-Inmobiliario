/* =============================================================================
   SaaS Inmobiliario — Payment List Modal
   Lista de pagos de una factura
   ============================================================================= */

import { useEffect, useState } from 'react';
import { toast } from '../../stores/toastStore';
import { fetchInvoicePayments } from '../../services/billing';
import type { InvoiceDto, PaymentDto } from '../../types';
import { PaymentFormModal } from './PaymentFormModal';
import styles from './PaymentListModal.module.css';

// ── Props ───────────────────────────────────────────────────────────────────

interface PaymentListModalProps {
  invoice: InvoiceDto;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  stripe: 'Stripe',
  other: 'Otro',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ── Component ────────────────────────────────────────────────────────────────

export function PaymentListModal({ invoice, onClose, onRefresh }: PaymentListModalProps) {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoicePayments(invoice.id);
      setPayments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [invoice.id]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, invoice.amount - totalPaid);
  const isFullyPaid = remaining <= 0;

  const handlePaymentSuccess = () => {
    setShowCreateForm(false);
    loadPayments();
    onRefresh();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Pagos</h2>
            <span className={styles.subtitle}>
              Factura: {formatCurrency(invoice.amount)} —{' '}
              <span className={isFullyPaid ? styles.paidText : styles.pendingText}>
                {isFullyPaid ? 'Pagada' : `Saldo: ${formatCurrency(remaining)}`}
              </span>
            </span>
          </div>
          <div className={styles.headerActions}>
            {!isFullyPaid && (
              <button
                className={styles.createButton}
                onClick={() => setShowCreateForm(true)}
              >
                + Registrar Pago
              </button>
            )}
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Resumen ───────────────────────────────────────────────────── */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Total Pagado</span>
            <span className={styles.summaryValue}>{formatCurrency(totalPaid)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Pendiente</span>
            <span className={`${styles.summaryValue} ${isFullyPaid ? styles.paidText : styles.pendingText}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        {/* ── Tabla ─────────────────────────────────────────────────────── */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Cargando pagos...</div>
          ) : payments.length === 0 ? (
            <div className={styles.empty}>No hay pagos registrados</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th>Recibido Por</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.amountCell}>{formatCurrency(p.amount)}</td>
                    <td>
                      <span className={styles.methodBadge}>
                        {PAYMENT_METHOD_LABELS[p.method] || p.method}
                      </span>
                    </td>
                    <td className={styles.textMuted}>{p.reference || '—'}</td>
                    <td>{p.receivedBy}</td>
                    <td>{formatDate(p.receivedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Payment Form Modal ────────────────────────────────────────── */}
        {showCreateForm && (
          <PaymentFormModal
            invoice={invoice}
            remaining={remaining}
            onClose={() => setShowCreateForm(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
