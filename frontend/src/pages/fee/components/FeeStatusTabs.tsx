/* =============================================================================
   SaaS Inmobiliario — Fee Status Tabs
   Filtros de estado: Todas, Pendientes, Pagadas, Parciales
   ============================================================================= */

import type { FeeStatus } from '../../../types/fee';
import styles from './FeeStatusTabs.module.css';

interface FeeStatusTabsProps {
  filterStatus: FeeStatus | undefined;
  onFilterChange: (status: FeeStatus | undefined) => void;
}

export function FeeStatusTabs({ filterStatus, onFilterChange }: FeeStatusTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${!filterStatus ? styles.tabActive : ''}`}
        onClick={() => onFilterChange(undefined)}
      >
        Todas
      </button>
      <button
        className={`${styles.tab} ${filterStatus === 'PENDING' ? styles.tabActive : ''}`}
        onClick={() => onFilterChange('PENDING')}
      >
        Pendientes
      </button>
      <button
        className={`${styles.tab} ${filterStatus === 'PAID' ? styles.tabActive : ''}`}
        onClick={() => onFilterChange('PAID')}
      >
        Pagadas
      </button>
      <button
        className={`${styles.tab} ${filterStatus === 'PARTIAL' ? styles.tabActive : ''}`}
        onClick={() => onFilterChange('PARTIAL')}
      >
        Parciales
      </button>
    </div>
  );
}
