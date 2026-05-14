/* =============================================================================
   SaaS Inmobiliario — Metrics Page
   Dashboard de métricas de la plataforma (solo SuperAdmin)
   ============================================================================= */

import { useEffect } from 'react';
import { useMetricsStore } from '../../stores/metricsStore';
import { toast } from '../../stores/toastStore';
import { RoleGuard } from '../../components/RoleGuard';
import styles from './MetricsPage.module.css';

// ── Componente de tarjeta de métrica ────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

function MetricCard({ title, value, icon, variant = 'primary' }: MetricCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardContent}>
        <span className={styles.cardValue}>{value}</span>
        <span className={styles.cardTitle}>{title}</span>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

export function MetricsPage() {
  const { metrics, loading, error, fetchPlatformMetrics, clearError } = useMetricsStore();

  // Cargar métricas al montar
  useEffect(() => {
    fetchPlatformMetrics();
  }, []);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Obtener labels de estado de unidades
  const getUnitStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponibles',
      OCCUPIED: 'Ocupadas',
      MAINTENANCE: 'Mantenimiento',
    };
    return labels[status] || status;
  };

  // Obtener labels de plan
  const getPlanLabel = (plan: string): string => {
    const labels: Record<string, string> = {
      BASIC: 'Básico',
      PREMIUM: 'Premium',
      ENTERPRISE: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  // Obtener labels de estado de cuotas
  const getFeeStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: 'Pendientes',
      PAID: 'Pagadas',
      PARCIAL: 'Parciales',
    };
    return labels[status] || status;
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className={styles.container}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Métricas de Plataforma</h1>
          <span className={styles.subtitle}>
            Estadísticas globales del sistema SaaS Inmobiliario
          </span>
        </div>

        {/* ── Contenido ──────────────────────────────────────────────────────── */}
        {loading && !metrics ? (
          <div className={styles.loading}>Cargando métricas...</div>
        ) : metrics ? (
          <>
            {/* ── Métricas de Tenants ──────────────────────────────────────── */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Tenants</h2>
              <div className={styles.grid}>
                <MetricCard
                  title="Tenants Activos"
                  value={metrics.tenantsActive}
                  icon="🏢"
                  variant="success"
                />
                <MetricCard
                  title="Tenants Suspendidos"
                  value={metrics.tenantsSuspended}
                  icon="⏸️"
                  variant="warning"
                />
                {metrics.tenantsByPlan &&
                  Object.entries(metrics.tenantsByPlan).map(([plan, count]) => (
                    <MetricCard
                      key={plan}
                      title={`Tenants ${getPlanLabel(plan)}`}
                      value={count}
                      icon="📊"
                      variant="info"
                    />
                  ))}
              </div>
            </section>

            {/* ── Métricas de Unidades ──────────────────────────────────────── */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Unidades</h2>
              <div className={styles.grid}>
                <MetricCard
                  title="Total de Unidades"
                  value={metrics.totalUnits}
                  icon="🚪"
                  variant="primary"
                />
                {metrics.unitsByStatus &&
                  Object.entries(metrics.unitsByStatus).map(([status, count]) => (
                    <MetricCard
                      key={status}
                      title={getUnitStatusLabel(status)}
                      value={count}
                      icon={status === 'AVAILABLE' ? '✅' : status === 'OCCUPIED' ? '🏠' : '🔧'}
                      variant={
                        status === 'AVAILABLE'
                          ? 'success'
                          : status === 'OCCUPIED'
                          ? 'warning'
                          : 'danger'
                      }
                    />
                  ))}
              </div>
            </section>

            {/* ── Métricas de Operación ─────────────────────────────────────── */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Operación</h2>
              <div className={styles.grid}>
                <MetricCard
                  title="Usuarios Totales"
                  value={metrics.totalUsers}
                  icon="👥"
                  variant="info"
                />
                <MetricCard
                  title="Solicitudes de Mantenimiento Abiertas"
                  value={metrics.maintenanceOpen}
                  icon="🔧"
                  variant="warning"
                />
                <MetricCard
                  title="Visitantes Hoy"
                  value={metrics.visitorsToday || 0}
                  icon="🚶"
                  variant="primary"
                />
                <MetricCard
                  title="Cuotas Pendientes"
                  value={metrics.feesDueSoon || 0}
                  icon="💰"
                  variant="danger"
                />
              </div>
            </section>

            {metrics.feesByStatus && Object.keys(metrics.feesByStatus).length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Estado de Cuotas</h2>
                <div className={styles.grid}>
                  {Object.entries(metrics.feesByStatus).map(([status, count]) => (
                    <MetricCard
                      key={status}
                      title={getFeeStatusLabel(status)}
                      value={count}
                      icon={status === 'PAID' ? '✅' : status === 'PENDING' ? '⏳' : '📝'}
                      variant={status === 'PAID' ? 'success' : status === 'PENDING' ? 'warning' : 'info'}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className={styles.empty}>No hay datos de métricas disponibles</div>
        )}
      </div>
    </RoleGuard>
  );
}