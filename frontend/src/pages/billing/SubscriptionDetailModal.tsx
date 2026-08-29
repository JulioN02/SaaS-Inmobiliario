/* =============================================================================
   SaaS Inmobiliario — Subscription Detail Modal
   Ver y gestionar suscripción de un tenant
   ============================================================================= */

import { useEffect, useState } from 'react';
import { toast } from '../../stores/toastStore';
import { fetchSubscription, updateSubscription } from '../../services/billing';
import type { SubscriptionDto, SubscriptionStatus } from '../../types';
import styles from './SubscriptionDetailModal.module.css';

// ── Labels ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  TRIALING: 'Prueba',
  ACTIVE: 'Activo',
  PAST_DUE: 'Moroso',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
};

const BADGE_CLASS: Record<string, string> = {
  TRIALING: 'badgeTrialing',
  ACTIVE: 'badgeActive',
  PAST_DUE: 'badgePastDue',
  CANCELED: 'badgeCanceled',
  EXPIRED: 'badgeExpired',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  TRIALING: ['ACTIVE', 'CANCELED'],
  ACTIVE: ['PAST_DUE', 'CANCELED'],
  PAST_DUE: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: [],
  EXPIRED: [],
};

// ── Props ───────────────────────────────────────────────────────────────────

interface SubscriptionDetailModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ── Component ────────────────────────────────────────────────────────────────

export function SubscriptionDetailModal({ tenantId, tenantName, onClose, onRefresh }: SubscriptionDetailModalProps) {
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      // First, try to find subscription for this tenant
      const { fetchSubscriptions } = await import('../../services/billing');
      const result = await fetchSubscriptions({ page: 1, limit: 100 });
      const sub = result.data.find((s) => s.tenantId === tenantId);
      if (sub) {
        const fullSub = await fetchSubscription(sub.id);
        setSubscription(fullSub);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar suscripción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [tenantId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!subscription) return;
    setSaving(true);
    try {
      const updated = await updateSubscription(subscription.id, { status: newStatus });
      setSubscription(updated);
      toast.success(`Estado cambiado a ${STATUS_LABELS[newStatus] || newStatus}`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCancelAtPeriodEnd = async () => {
    if (!subscription) return;
    setSaving(true);
    try {
      const updated = await updateSubscription(subscription.id, {
        cancelAtPeriodEnd: !subscription.cancelAtPeriodEnd,
      });
      setSubscription(updated);
      toast.success(
        updated.cancelAtPeriodEnd
          ? 'La suscripción se cancelará al final del período'
          : 'Cancelación al final del período desactivada',
      );
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar suscripción');
    } finally {
      setSaving(false);
    }
  };

  const currentStatus = subscription?.status;
  const allowedTransitions = currentStatus ? STATUS_TRANSITIONS[currentStatus] || [] : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Detalle de Suscripción</h2>
            <span className={styles.subtitle}>{tenantName}</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Cargando suscripción...</div>
        ) : !subscription ? (
          <div className={styles.empty}>
            No se encontró una suscripción activa para este tenant.
            <p className={styles.emptyHint}>Crea una suscripción desde el backend.</p>
          </div>
        ) : (
          <div className={styles.content}>
            {/* ── Info rows ─────────────────────────────────────────────── */}
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={`${styles.statusBadge} ${styles[BADGE_CLASS[subscription.status] || 'badgeCanceled']}`}>
                  {STATUS_LABELS[subscription.status] || subscription.status}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Plan</span>
                <span className={styles.infoValue}>{subscription.plan.name}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Período Actual</span>
                <span className={styles.infoValue}>
                  {formatDate(subscription.periodStart)} — {formatDate(subscription.periodEnd)}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Cancelar al Final del Período</span>
                <span className={styles.infoValue}>
                  {subscription.cancelAtPeriodEnd ? (
                    <span className={styles.yesText}>Sí</span>
                  ) : (
                    <span className={styles.noText}>No</span>
                  )}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Prueba Termina</span>
                <span className={styles.infoValue}>{formatDate(subscription.trialEndsAt)}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Creada</span>
                <span className={styles.infoValue}>{formatDateTime(subscription.createdAt)}</span>
              </div>
            </div>

            {/* ── Separator ─────────────────────────────────────────────── */}
            <div className={styles.separator} />

            {/* ── Actions Section ───────────────────────────────────────── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Acciones</h3>

              {/* Cambiar estado */}
              <div className={styles.actionRow}>
                <span className={styles.actionLabel}>Cambiar Estado</span>
                <div className={styles.actionControls}>
                  <select
                    className={styles.select}
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={saving || allowedTransitions.length === 0}
                  >
                    {allowedTransitions.length > 0 ? (
                      allowedTransitions.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s] || s}
                        </option>
                      ))
                    ) : (
                      <option value="">Sin transiciones disponibles</option>
                    )}
                  </select>
                  {saving && <span className={styles.saving}>Guardando...</span>}
                </div>
              </div>

              {/* Toggle cancelAtPeriodEnd */}
              <div className={styles.actionRow}>
                <span className={styles.actionLabel}>Cancelar al final del período</span>
                <button
                  className={`${styles.toggleButton} ${subscription.cancelAtPeriodEnd ? styles.toggleActive : ''}`}
                  onClick={handleToggleCancelAtPeriodEnd}
                  disabled={saving}
                >
                  {subscription.cancelAtPeriodEnd ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>

            {/* ── Stripe Info (read-only) ────────────────────────────────── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Stripe (Integración Futura)</h3>
              <div className={styles.stripeInfo}>
                <p className={styles.stripeText}>
                  Los campos de Stripe estarán disponibles en una versión futura.
                  Actualmente la facturación se gestiona manualmente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Close button at bottom ────────────────────────────────────── */}
        <div className={styles.footer}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
