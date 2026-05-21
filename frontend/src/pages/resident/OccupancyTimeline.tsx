/* =============================================================================
    SaaS Inmobiliario — Occupancy Timeline
    Lista de ocupaciones para una unidad con badges de estado
    ============================================================================= */

import { useEffect } from 'react';
import { useOccupancyStore } from '../../stores/occupancyStore';
import { StatusBadge } from '../../components/Shared/StatusBadge';
import type { Occupancy } from '../../types/resident';
import styles from './OccupancyTimeline.module.css';

// ── Helper para formatear fecha ───────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Helper para badge de tipo de ocupación ───────────────────────────────────────

function occupancyTypeVariant(type: string): 'success' | 'info' | 'warning' | 'neutral' {
  return type === 'OWNER' ? 'success' : 'info';
}

// ── Props ───────────────────────────────────────────────────────────────────

interface OccupancyTimelineProps {
  unitId: string;
}

// ── Componente ──────────────────────────────────────────────────────────────

export function OccupancyTimeline({ unitId }: OccupancyTimelineProps) {
  const { occupancies, fetchOccupancies, loading } = useOccupancyStore();

  // Cargar ocupaciones al montar
  useEffect(() => {
    fetchOccupancies({ unitId, page: 1, limit: 50 });
  }, [unitId]);

  // Render
  if (loading && occupancies.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Historial de Ocupación</h3>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Historial de Ocupación</h3>

      {occupancies.length === 0 ? (
        <div className={styles.empty}>No hay ocupaciones registradas</div>
      ) : (
        <div className={styles.timeline}>
          {occupancies.map((occupancy) => (
            <OccupancyItem key={occupancy.id} occupancy={occupancy} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Item individual ────────────────────────────────────────────────────────────────

interface OccupancyItemProps {
  occupancy: Occupancy;
}

function OccupancyItem({ occupancy }: OccupancyItemProps) {
  const isActive = !occupancy.endDate;
  const typeLabel = occupancy.type === 'OWNER' ? 'Propietario' : 'Arrendatario';

  return (
    <div className={styles.item}>
      <div className={`${styles.icon} ${isActive ? styles.iconActive : styles.iconClosed}`}>
        {isActive ? '🏠' : '✓'}
      </div>
      <div className={styles.content}>
        <div className={styles.residentName}>
          {occupancy.resident?.firstName} {occupancy.resident?.lastName}
        </div>
        <div className={styles.details}>
          <StatusBadge variant={occupancyTypeVariant(occupancy.type)}>
            {typeLabel}
          </StatusBadge>
          {occupancy.unit && (
            <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              {occupancy.unit.identifier}
            </span>
          )}
        </div>
        <div className={styles.dates}>
          <span className={styles.date}>
            Inicio: {formatDate(occupancy.startDate)}
          </span>
          {occupancy.endDate && (
            <>
              <span className={styles.separator}>→</span>
              <span className={styles.date}>
                Fin: {formatDate(occupancy.endDate)}
              </span>
            </>
          )}
        </div>
        {occupancy.notes && (
          <div className={styles.notes}>{occupancy.notes}</div>
        )}
      </div>
    </div>
  );
}