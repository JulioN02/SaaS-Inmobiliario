/* =============================================================================
   SaaS Inmobiliario — Invoice List Modal
   Lista de facturas de un tenant con acciones
   ============================================================================= */

import { useEffect, useState } from 'react';
import { toast } from '../../stores/toastStore';
import {
  fetchInvoices,
  finalizeInvoice,
  cancelInvoice,
  type InvoiceListParams,
  type PaginatedInvoices,
} from '../../services/billing';
import type {
  InvoiceDto,
  CreateInvoiceDto,
} from '../../types';
import { InvoiceFormModal } from './InvoiceFormModal';
import { PaymentListModal } from './PaymentListModal';
import styles from './InvoiceListModal.module.css';

// ── Labels ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  CANCELED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const BADGE_CLASS: Record<string, string> = {
  DRAFT: 'badgeDraft',
  PENDING: 'badgePending',
  PAID: 'badgePaid',
  OVERDUE: 'badgeOverdue',
  CANCELED: 'badgeCanceled',
  REFUNDED: 'badgeRefunded',
};

// ── Props ───────────────────────────────────────────────────────────────────

interface InvoiceListModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Formateo ────────────────────────────────────────────────────────────────

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
  });
};

// ── Component ────────────────────────────────────────────────────────────────

export function InvoiceListModal({ tenantId, tenantName, onClose, onRefresh }: InvoiceListModalProps) {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceDto | null>(null);
  const [showPayments, setShowPayments] = useState<InvoiceDto | null>(null);
  const limit = 10;

  const loadInvoices = async (p: number) => {
    setLoading(true);
    try {
      const params: InvoiceListParams = { page: p, limit, tenantId };
      const result: PaginatedInvoices = await fetchInvoices(params);
      setInvoices(result.data);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(1);
  }, [tenantId]);

  const handleFinalize = async (id: string) => {
    setActionLoading(id);
    try {
      await finalizeInvoice(id);
      toast.success('Factura finalizada');
      loadInvoices(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al finalizar factura');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await cancelInvoice(id);
      toast.success('Factura cancelada');
      loadInvoices(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar factura');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadInvoices(1);
    onRefresh();
  };

  const handleEditSuccess = () => {
    setEditingInvoice(null);
    loadInvoices(page);
    onRefresh();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Facturas</h2>
            <span className={styles.subtitle}>{tenantName}</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateForm(true)}
            >
              + Nueva Factura
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Tabla ─────────────────────────────────────────────────────── */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Cargando facturas...</div>
          ) : invoices.length === 0 ? (
            <div className={styles.empty}>No hay facturas para este tenant</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Vencimiento</th>
                  <th>Pagado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className={styles.periodRange}>
                        {formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}
                      </span>
                    </td>
                    <td className={styles.amountCell}>{formatCurrency(inv.amount)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[BADGE_CLASS[inv.status] || 'badgeDraft']}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td>
                      {inv.paidAt ? formatDate(inv.paidAt) : (
                        <span className={styles.textMuted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {inv.status === 'DRAFT' && (
                          <>
                            <button
                              className={styles.actionButton}
                              onClick={() => setEditingInvoice(inv)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.finalizeButton}
                              onClick={() => handleFinalize(inv.id)}
                              disabled={actionLoading === inv.id}
                            >
                              {actionLoading === inv.id ? '...' : 'Finalizar'}
                            </button>
                          </>
                        )}
                        {inv.status === 'PENDING' && (
                          <button
                            className={styles.cancelButton}
                            onClick={() => handleCancel(inv.id)}
                            disabled={actionLoading === inv.id}
                          >
                            {actionLoading === inv.id ? '...' : 'Cancelar'}
                          </button>
                        )}
                        {inv.status === 'PAID' && (
                          <button
                            className={styles.actionButton}
                            onClick={() => setShowPayments(inv)}
                          >
                            💳 Pagos
                          </button>
                        )}
                        {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                          <button
                            className={styles.actionButton}
                            onClick={() => setShowPayments(inv)}
                          >
                            💳 Pagos
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Paginación ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              disabled={page === 1}
              onClick={() => loadInvoices(page - 1)}
            >
              ← Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages} ({total} facturas)
            </span>
            <button
              className={styles.pageButton}
              disabled={page === totalPages}
              onClick={() => loadInvoices(page + 1)}
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* ── Create Invoice Modal ──────────────────────────────────────── */}
        {showCreateForm && (
          <InvoiceFormModal
            tenantId={tenantId}
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {/* ── Edit Invoice Modal ────────────────────────────────────────── */}
        {editingInvoice && (
          <InvoiceFormModal
            tenantId={tenantId}
            invoice={editingInvoice}
            onClose={() => setEditingInvoice(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {/* ── Payment List Modal ────────────────────────────────────────── */}
        {showPayments && (
          <PaymentListModal
            invoice={showPayments}
            onClose={() => setShowPayments(null)}
            onRefresh={() => {
              loadInvoices(page);
              onRefresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
