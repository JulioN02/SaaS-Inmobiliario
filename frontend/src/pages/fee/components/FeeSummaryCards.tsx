/* =============================================================================
   SaaS Inmobiliario — Fee Summary Cards
   Resumen de montos: total, pendiente, pagado, parcial
   ============================================================================= */

import styles from './FeeSummaryCards.module.css';

interface FeeSummaryCardsProps {
  summary: {
    pending: number;
    paid: number;
    partial: number;
    total: number;
  };
}

export function FeeSummaryCards({ summary }: FeeSummaryCardsProps) {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryCard}>
        <p className={styles.summaryCardTitle}>Total Cuotas</p>
        <p className={styles.summaryCardValue}>
          ${summary.total.toLocaleString('es-CO')}
        </p>
      </div>
      <div
        className={styles.summaryCard}
        style={{ borderTop: '3px solid var(--color-warning-500, #F59E0B)' }}
      >
        <p className={styles.summaryCardTitle}>Pendiente</p>
        <p className={styles.summaryCardValue}>
          ${summary.pending.toLocaleString('es-CO')}
        </p>
      </div>
      <div
        className={styles.summaryCard}
        style={{ borderTop: '3px solid var(--color-success-500, #10B981)' }}
      >
        <p className={styles.summaryCardTitle}>Pagado</p>
        <p className={styles.summaryCardValue}>
          ${summary.paid.toLocaleString('es-CO')}
        </p>
      </div>
      <div
        className={styles.summaryCard}
        style={{ borderTop: '3px solid var(--color-primary-500, #3B82F6)' }}
      >
        <p className={styles.summaryCardTitle}>Parcial</p>
        <p className={styles.summaryCardValue}>
          ${summary.partial.toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  );
}
