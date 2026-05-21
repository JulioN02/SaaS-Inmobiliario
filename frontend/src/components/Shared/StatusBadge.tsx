/* =============================================================================
   SaaS Inmobiliario — StatusBadge
   Indicador de estado con colores semánticos
   ============================================================================= */

import type { ReactNode } from 'react';
import styles from './StatusBadge.module.css';

type StatusVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className ?? ''}`}>
      {children}
    </span>
  );
}

/* ── Helper rápido para UnitStatus ─────────────────────────────────────────── */
export function unitStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'OCCUPIED':
      return 'info';
    case 'MAINTENANCE':
      return 'warning';
    default:
      return 'neutral';
  }
}

/* ── Helper rápido para FeeStatus ───────────────────────────────────────────── */
export function feeStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'PARTIAL':
      return 'info';
    default:
      return 'neutral';
  }
}

/* ── Helper rápido para MaintenanceStatus ───────────────────────────────────── */
export function maintenanceStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'RESOLVED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}