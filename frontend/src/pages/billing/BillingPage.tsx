/* =============================================================================
   SaaS Inmobiliario — Billing Page (SuperAdmin)
   Dashboard con métricas y tabla de facturación por tenant
   ============================================================================= */

import { useEffect, useState, useCallback } from 'react';
import { useBillingStore } from '../../stores/billingStore';
import { toast } from '../../stores/toastStore';
import type { TenantBillingStatus } from '../../types';
import styles from './BillingPage.module.css';
import { InvoiceListModal } from './InvoiceListModal';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';

// ── Formateo de moneda ──────────────────────────────────────────────────────

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// ── Status badge helpers ─────────────────────────────────────────────────────

const subscriptionBadgeClass: Record<string, string> = {
  TRIALING: 'badgeTrialing',
  ACTIVE: 'badgeActive',
  PAST_DUE: 'badgePastDue',
  CANCELED: 'badgeCanceled',
  EXPIRED: 'badgeExpired',
};

const invoiceBadgeClass: Record<string, string> = {
  DRAFT: 'badgeDraft',
  PENDING: 'badgePending',
  PAID: 'badgePaid',
  OVERDUE: 'badgeOverdue',
  CANCELED: 'badgeCanceled',
  REFUNDED: 'badgeRefunded',
};

const STATUS_LABELS: Record<string, string> = {
  TRIALING: 'Prueba',
  ACTIVE: 'Activo',
  PAST_DUE: 'Moroso',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  REFUNDED: 'Reembolsado',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  accent: 'green' | 'red' | 'blue' | 'amber' | 'purple';
  subtitle?: string;
}

function KpiCard({ title, value, accent, subtitle }: KpiCardProps) {
  return (
    <div className={`${styles.kpiCard} ${styles[`kpiAccent${accent.charAt(0).toUpperCase() + accent.slice(1)}`]}`}>
      <span className={styles.kpiTitle}>{title}</span>
      <span className={styles.kpiValue}>{value}</span>
      {subtitle && <span className={styles.kpiSubtitle}>{subtitle}</span>}
    </div>
  );
}

// ── Format date helper ───────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Main Component ───────────────────────────────────────────────────────────

export function BillingPage() {
  const {
    metrics,
    tenants,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchMetrics,
    fetchTenants,
    clearError,
  } = useBillingStore();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState<string>('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    fetchMetrics();
    fetchTenants({ page: 1, limit });
  }, []);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    fetchTenants({ page: newPage, limit, status: statusFilter || undefined });
  };

  // Filtro por estado
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchTenants({ page: 1, limit, status: status || undefined });
  };

  // Abrir facturas de un tenant
  const handleViewInvoices = useCallback((tenant: TenantBillingStatus) => {
    setSelectedTenantId(tenant.tenantId);
    setSelectedTenantName(tenant.tenantName);
    setShowInvoiceModal(true);
  }, []);

  // Abrir suscripción de un tenant
  const handleViewSubscription = useCallback((tenant: TenantBillingStatus) => {
    setSelectedTenantId(tenant.tenantId);
    setSelectedTenantName(tenant.tenantName);
    setShowSubModal(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Facturación</h1>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className={styles.kpiRow}>
        {loading && !metrics ? (
          <div className={styles.loading}>Cargando métricas...</div>
        ) : metrics ? (
          <>
            <KpiCard
              title="Suscripciones Activas"
              value={String(metrics.activeSubscriptions)}
              accent="green"
              subtitle={`de ${metrics.totalTenants} tenants`}
            />
            <KpiCard
              title="Morosos"
              value={String(metrics.pastDue)}
              accent="red"
              subtitle={metrics.pastDue > 0 ? 'Requiere atención' : 'Sin morosos'}
            />
            <KpiCard
              title="MRR"
              value={formatCurrency(metrics.mrr)}
              accent="blue"
              subtitle="Ingreso mensual recurrente"
            />
            <KpiCard
              title="Tasa de Cobro"
              value={`${metrics.collectionRate.toFixed(1)}%`}
              accent="amber"
              subtitle={`$${(metrics.totalCollectedYtd / 1000000).toFixed(0)}M recaudado en el año`}
            />
            <KpiCard
              title="Facturas Pendientes"
              value={String(metrics.pendingInvoices)}
              accent="purple"
              subtitle={metrics.pendingInvoices > 0 ? 'Por cobrar' : 'Al día'}
            />
          </>
        ) : null}
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="TRIALING">Prueba</option>
          <option value="ACTIVE">Activo</option>
          <option value="PAST_DUE">Moroso</option>
          <option value="CANCELED">Cancelado</option>
          <option value="EXPIRED">Expirado</option>
        </select>
      </div>

      {/* ── Tabla de Tenants ────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        {loading && tenants.length === 0 ? (
          <div className={styles.loading}>Cargando tenants...</div>
        ) : tenants.length === 0 ? (
          <div className={styles.empty}>No hay tenants registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Estado Suscripción</th>
                <th>Próxima Facturación</th>
                <th>Última Factura</th>
                <th>Monto Pendiente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.tenantId}>
                  <td>
                    <span className={styles.tenantName}>{t.tenantName}</span>
                    <span className={styles.subdomain}>{t.subdomain}</span>
                  </td>
                  <td>
                    <span className={`${styles.planBadge} ${styles[t.planSlug] || styles.basic}`}>
                      {t.planName}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[subscriptionBadgeClass[t.subscriptionStatus] || 'badgeCanceled']}`}
                    >
                      {STATUS_LABELS[t.subscriptionStatus] || t.subscriptionStatus}
                    </span>
                  </td>
                  <td>{formatDate(t.nextBillingDate)}</td>
                  <td>
                    {t.lastInvoiceDate ? (
                      <>
                        <div>{formatDate(t.lastInvoiceDate)}</div>
                        {t.lastInvoiceAmount != null && (
                          <div className={styles.invoiceAmount}>
                            {formatCurrency(t.lastInvoiceAmount)}
                            {t.lastInvoiceStatus && (
                              <span className={`${styles.inlineBadge} ${styles[invoiceBadgeClass[t.lastInvoiceStatus] || 'badgeDraft']}`}>
                                {STATUS_LABELS[t.lastInvoiceStatus]}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={styles.textMuted}>Sin facturas</span>
                    )}
                  </td>
                  <td>
                    {t.outstandingAmount > 0 ? (
                      <span className={styles.outstandingAmount}>
                        {formatCurrency(t.outstandingAmount)}
                      </span>
                    ) : (
                      <span className={styles.textMuted}>$0</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewInvoices(t)}
                        title="Ver facturas"
                      >
                        📄 Facturas
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewSubscription(t)}
                        title="Ver suscripción"
                      >
                        📋 Suscripción
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Paginación ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {page} de {totalPages} ({total} tenants)
          </span>
          <button
            className={styles.pageButton}
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modales ─────────────────────────────────────────────────────── */}
      {showInvoiceModal && selectedTenantId && (
        <InvoiceListModal
          tenantId={selectedTenantId}
          tenantName={selectedTenantName}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedTenantId(null);
          }}
          onRefresh={() => {
            fetchTenants({ page, limit, status: statusFilter || undefined });
            fetchMetrics();
          }}
        />
      )}

      {showSubModal && selectedTenantId && (
        <SubscriptionDetailModal
          tenantId={selectedTenantId}
          tenantName={selectedTenantName}
          onClose={() => {
            setShowSubModal(false);
            setSelectedTenantId(null);
          }}
          onRefresh={() => {
            fetchTenants({ page, limit, status: statusFilter || undefined });
            fetchMetrics();
          }}
        />
      )}
    </div>
  );
}
