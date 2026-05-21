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
                <MetricCard
                  title="Tasa de Ocupación"
                  value={`${metrics.occupancyRate}%`}
                  icon="📊"
                  variant="info"
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
                  title="Propiedades"
                  value={metrics.totalProperties}
                  icon="🏠"
                  variant="primary"
                />
                <MetricCard
                  title="Residentes"
                  value={metrics.totalResidents}
                  icon="👨‍👩‍👧‍👧"
                  variant="success"
                />
              </div>
            </section>

            {/* ── Métricas de Cuotas ────────────────────────────────────────── */}
            {metrics.fees && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Cuotas</h2>
                <div className={styles.grid}>
                  <MetricCard
                    title="Pagadas"
                    value={metrics.fees.paid}
                    icon="✅"
                    variant="success"
                  />
                  <MetricCard
                    title="Pendientes"
                    value={metrics.fees.pending}
                    icon="⏳"
                    variant="warning"
                  />
                  <MetricCard
                    title="Vencidas"
                    value={metrics.fees.overdue}
                    icon="⚠️"
                    variant="danger"
                  />
                  <MetricCard
                    title="Tasa de Recaudo"
                    value={`${metrics.fees.collectionRate}%`}
                    icon="📈"
                    variant="info"
                  />
                  <MetricCard
                    title="Total Recaudado"
                    value={`$${metrics.fees.totalCollected.toLocaleString('es-CO')}`}
                    icon="💰"
                    variant="primary"
                  />
                </div>
              </section>
            )}

            {/* ── Métricas de Mantenimiento ─────────────────────────────────── */}
            {metrics.maintenance && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Mantenimiento</h2>
                <div className={styles.grid}>
                  <MetricCard
                    title="Pendientes"
                    value={metrics.maintenance.pending}
                    icon="🕐"
                    variant="warning"
                  />
                  <MetricCard
                    title="En Progreso"
                    value={metrics.maintenance.inProgress}
                    icon="🔧"
                    variant="info"
                  />
                  <MetricCard
                    title="Resueltos"
                    value={metrics.maintenance.resolved}
                    icon="✅"
                    variant="success"
                  />
                  <MetricCard
                    title="Cancelados"
                    value={metrics.maintenance.cancelled}
                    icon="❌"
                    variant="danger"
                  />
                </div>
              </section>
            )}

            {/* ── Métricas de Visitantes ────────────────────────────────────── */}
            {metrics.visitors && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Visitantes</h2>
                <div className={styles.grid}>
                  <MetricCard
                    title="Hoy"
                    value={metrics.visitors.today}
                    icon="🚶"
                    variant="primary"
                  />
                  <MetricCard
                    title="Activos"
                    value={metrics.visitors.active}
                    icon="🟡"
                    variant="warning"
                  />
                  <MetricCard
                    title="Esta Semana"
                    value={metrics.visitors.thisWeek}
                    icon="📅"
                    variant="info"
                  />
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
