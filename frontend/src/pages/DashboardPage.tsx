/* =============================================================================
   SaaS Inmobiliario — Dashboard Page
   Página principal con tarjetas de resumen y gráficos
   Adaptado a la estructura real del endpoint /metrics
   ============================================================================= */

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Metrics } from '../types';
import styles from './DashboardPage.module.css';

// ── Estado local ────────────────────────────────────────────────────────────

interface RawMetrics {
  totalTenants?: number;
  activeTenants: number;
  suspendedTenants?: number;
  totalUsers: number;
  totalProperties?: number;
  totalUnits: number;
  occupiedUnits?: number;
  availableUnits?: number;
  maintenanceUnits?: number;
}

interface DashboardState {
  metrics: Metrics | null;
  isLoading: boolean;
}

// Normalizar respuesta del backend a la estructura Metrics del frontend
function normalizeMetrics(raw: RawMetrics): Metrics {
  return {
    tenantsActive: raw.activeTenants ?? 0,
    tenantsSuspended: raw.suspendedTenants ?? 0,
    totalUnits: raw.totalUnits ?? 0,
    totalUsers: raw.totalUsers ?? 0,
    unitsByStatus: {
      AVAILABLE: raw.availableUnits ?? 0,
      OCCUPIED: raw.occupiedUnits ?? 0,
      MAINTENANCE: raw.maintenanceUnits ?? 0,
    },
    tenantsByPlan: {} as Record<string, number>,
    feesByStatus: {} as Record<string, number>,
    feesDueSoon: 0,
    maintenanceOpen: raw.maintenanceUnits ?? 0,
    visitorsToday: 0,
  };
}

// ── Componente ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { role, user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    isLoading: true,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setState({ metrics: null, isLoading: true });

    try {
      const endpoint = role === 'SUPER_ADMIN'
        ? '/metrics/platform'
        : `/metrics/tenant/${user?.clientId}`;
      const raw = await api.get<RawMetrics>(endpoint);
      const metrics = normalizeMetrics(raw.data);
      setState({ metrics, isLoading: false });
    } catch {
      setState({ metrics: null, isLoading: false });
    }
  }

  const { metrics, isLoading } = state;

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={styles.error}>
        <p>No se pudieron cargar las métricas.</p>
        <button onClick={loadMetrics} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  if (role === 'PORTERIA') {
    return <PorteriaDashboard />;
  }

  if (role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard metrics={metrics} />;
  }

  return <TenantDashboard metrics={metrics} />;
}

// ── Dashboard SuperAdmin ────────────────────────────────────────────────────

function SuperAdminDashboard({ metrics }: { metrics: Metrics }) {
  const hasPlans = Object.keys(metrics.tenantsByPlan).length > 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard — Plataforma</h1>

      <div className={styles.cardsGrid}>
        <StatCard title="Tenants Activos" value={metrics.tenantsActive} />
        <StatCard title="Tenants Suspendidos" value={metrics.tenantsSuspended} />
        <StatCard title="Unidades en Plataforma" value={metrics.totalUnits} />
        <StatCard title="Usuarios Totales" value={metrics.totalUsers} />
      </div>

      {hasPlans && (
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Tenants por Plan</h3>
            <div className={styles.barList}>
              {Object.entries(metrics.tenantsByPlan).map(([plan, count]) => (
                <div key={plan} className={styles.barRow}>
                  <span className={styles.barLabel}>{plan}</span>
                  <div className={styles.bar}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${(count / Math.max(...Object.values(metrics.tenantsByPlan), 1)) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard AdminTenant / Administrativa ──────────────────────────────────

function TenantDashboard({ metrics }: { metrics: Metrics }) {
  const feesCount = Object.keys(metrics.feesByStatus).length;
  const unitsCount = Object.keys(metrics.unitsByStatus).length;
  const totalProps = metrics.totalUnits; // fallback mientras no venga de la API

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.cardsGrid}>
        <StatCard title="Total Unidades" value={metrics.totalUnits} />
        <StatCard title="Total Usuarios" value={metrics.totalUsers} />
        <StatCard
          title="Unidades Disponibles"
          value={metrics.unitsByStatus['AVAILABLE'] ?? 0}
        />
        <StatCard
          title="Unidades Ocupadas"
          value={metrics.unitsByStatus['OCCUPIED'] ?? 0}
        />
      </div>

      <div className={styles.chartsGrid}>
        {feesCount > 0 && (
          <div className={styles.chartCard}>
            <h3>Cuotas este mes</h3>
            <div className={styles.barList}>
              {Object.entries(metrics.feesByStatus).map(([status, count]) => {
                const labels: Record<string, string> = {
                  PENDING: 'Pendientes',
                  PAID: 'Pagadas',
                  PARTIAL: 'Parciales',
                };
                const colors: Record<string, string> = {
                  PENDING: 'var(--color-warning-500)',
                  PAID: 'var(--color-success-500)',
                  PARTIAL: 'var(--color-primary-500)',
                };
                return (
                  <div key={status} className={styles.barRow}>
                    <span className={styles.barLabel}>{labels[status] ?? status}</span>
                    <div className={styles.bar}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(count / Math.max(...Object.values(metrics.feesByStatus), 1)) * 100}%`,
                          backgroundColor: colors[status] ?? 'var(--color-gray-400)',
                        }}
                      />
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {unitsCount > 0 && (
          <div className={styles.chartCard}>
            <h3>Unidades por estado</h3>
            <div className={styles.barList}>
              {Object.entries(metrics.unitsByStatus).map(([status, count]) => {
                const labels: Record<string, string> = {
                  AVAILABLE: 'Disponibles',
                  OCCUPIED: 'Ocupadas',
                  MAINTENANCE: 'En Mantenimiento',
                };
                const colors: Record<string, string> = {
                  AVAILABLE: 'var(--color-secondary-500)',
                  OCCUPIED: 'var(--color-primary-500)',
                  MAINTENANCE: 'var(--color-warning-500)',
                };
                return (
                  <div key={status} className={styles.barRow}>
                    <span className={styles.barLabel}>{labels[status] ?? status}</span>
                    <div className={styles.bar}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(count / Math.max(...Object.values(metrics.unitsByStatus), 1)) * 100}%`,
                          backgroundColor: colors[status] ?? 'var(--color-gray-400)',
                        }}
                      />
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.recentSection}>
        <div className={styles.recentCard}>
          <h3>En Mantenimiento</h3>
          <p className={styles.recentValue}>
            {metrics.unitsByStatus['MAINTENANCE'] ?? 0} unidades
          </p>
        </div>
        <div className={styles.recentCard}>
          <h3>Visitantes</h3>
          <p className={styles.recentValue}>
            {metrics.visitorsToday} registrados hoy
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Portería ──────────────────────────────────────────────────────

function PorteriaDashboard() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel de Portería</h1>

      <div className={styles.cardsGrid}>
        <StatCard title="Visitantes hoy" value={0} />
        <StatCard title="Pendientes de salida" value={0} />
      </div>

      <div className={styles.chartCard}>
        <h3>Visitantes activos</h3>
        <p className={styles.recentValue}>Aquí se mostrará la lista de visitantes activos.</p>
      </div>
    </div>
  );
}

// ── Tarjeta de estadística ──────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number;
  description?: string;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statTitle}>{title}</span>
      <span className={styles.statValue}>{value.toLocaleString()}</span>
    </div>
  );
}
