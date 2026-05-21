/* =============================================================================
   SaaS Inmobiliario — Dashboard Page
   Página principal con tarjetas de resumen, gráficos y datos extendidos
   Versión mejorada con métricas completas: fees, visitantes, mantenimiento
   ============================================================================= */

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Metrics, MaintenanceStatus } from '../types';
import styles from './DashboardPage.module.css';

// ── Tipos locales ──────────────────────────────────────────────────────────

interface FeeMetrics {
  pending: number;
  paid: number;
  partial: number;
  overdue: number;
  totalCollected: number;
  collectionRate: number;
}

interface VisitorMetrics {
  today: number;
  active: number;
  thisWeek: number;
}

interface MaintenanceMetrics {
  pending: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
}

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
  totalResidents?: number;
  occupancyRate?: number;
  fees?: FeeMetrics;
  visitors?: VisitorMetrics;
  maintenance?: MaintenanceMetrics;
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
    totalProperties: raw.totalProperties ?? 0,
    totalUnits: raw.totalUnits ?? 0,
    totalUsers: raw.totalUsers ?? 0,
    totalResidents: raw.totalResidents ?? 0,
    occupancyRate: raw.occupancyRate ?? 0,
    unitsByStatus: {
      AVAILABLE: raw.availableUnits ?? 0,
      OCCUPIED: raw.occupiedUnits ?? 0,
      MAINTENANCE: raw.maintenanceUnits ?? 0,
    },
    tenantsByPlan: {} as Record<string, number>,
    fees: raw.fees ?? { pending: 0, paid: 0, partial: 0, overdue: 0, totalCollected: 0, collectionRate: 0 },
    visitors: raw.visitors ?? { today: 0, active: 0, thisWeek: 0 },
    maintenance: raw.maintenance ?? { pending: 0, inProgress: 0, resolved: 0, cancelled: 0 },
  };
}

// ── Extended dashboard data types ────────────────────────────────────────────

interface PendingMaintenanceItem {
  id: string;
  title: string;
  status: MaintenanceStatus;
  unitNumber: string;
  createdAt: string;
  assignedTo?: string | null;
}

interface UpcomingFeeItem {
  id: string;
  amount: number;
  dueDate: string;
  period: string;
  unitNumber: string;
  daysLeft: number;
}

interface ActiveAnnouncementItem {
  id: string;
  title: string;
  priority: string;
  createdAt: string;
  content?: string;
}

interface ExtendedDashboardData {
  pendingMaintenance: PendingMaintenanceItem[];
  upcomingFees: UpcomingFeeItem[];
  activeAnnouncements: ActiveAnnouncementItem[];
}

// ── Componente principal ────────────────────────────────────────────────────

export function DashboardPage() {
  const { role, user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    isLoading: true,
  });
  const [extended, setExtended] = useState<ExtendedDashboardData>({
    pendingMaintenance: [],
    upcomingFees: [],
    activeAnnouncements: [],
  });
  const [loadingExtended, setLoadingExtended] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  // Cargar datos extendidos cuando se cargan las métricas (solo para tenant dashboard)
  useEffect(() => {
    if (state.metrics && role !== 'SUPER_ADMIN' && role !== 'PORTERIA' && user?.clientId) {
      loadExtendedData(user.clientId);
    }
  }, [state.metrics]);

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

  async function loadExtendedData(tenantId: string) {
    setLoadingExtended(true);
    try {
      const [maintenanceRes, feesRes, announcementsRes] = await Promise.all([
        api.get(`/metrics/tenant/${tenantId}/maintenance-pending`),
        api.get(`/metrics/tenant/${tenantId}/upcoming-fees`),
        api.get(`/metrics/tenant/${tenantId}/active-announcements`),
      ]);
      setExtended({
        pendingMaintenance: maintenanceRes.data || [],
        upcomingFees: feesRes.data || [],
        activeAnnouncements: announcementsRes.data || [],
      });
    } catch {
      // Silently fail for extended data
    } finally {
      setLoadingExtended(false);
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

  return <TenantDashboard metrics={metrics} extended={extended} loadingExtended={loadingExtended} />;
}

// ── Dashboard SuperAdmin ────────────────────────────────────────────────────

function SuperAdminDashboard({ metrics }: { metrics: Metrics }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard — Plataforma</h1>

      <div className={styles.cardsGrid}>
        <StatCard title="Tenants Activos" value={metrics.tenantsActive} icon="🏢" />
        <StatCard title="Tenants Suspendidos" value={metrics.tenantsSuspended} icon="⚠️" />
        <StatCard title="Propiedades" value={metrics.totalProperties} icon="🏠" />
        <StatCard title="Unidades" value={metrics.totalUnits} icon="🔢" />
        <StatCard title="Usuarios Totales" value={metrics.totalUsers} icon="👤" />
        <StatCard title="Residentes" value={metrics.totalResidents} icon="👨‍👩‍👧‍👧" />
        <StatCard title="Ocupación" value={`${metrics.occupancyRate}%`} icon="📊" />
        <StatCard 
          title="Recaudado Total" 
          value={`$${(metrics.fees?.totalCollected ?? 0).toLocaleString('es-CO')}`} 
          icon="💰" 
        />
      </div>

      <div className={styles.chartsGrid}>
        {/* Cuotas por estado */}
        {metrics.fees && (
          <div className={styles.chartCard}>
            <h3>💰 Cuotas — Resumen</h3>
            <div className={styles.metricsRow}>
              <MiniStat label="Pagadas" value={metrics.fees.paid} color="#10B981" />
              <MiniStat label="Pendientes" value={metrics.fees.pending} color="#F59E0B" />
              <MiniStat label="Vencidas" value={metrics.fees.overdue} color="#EF4444" />
              <MiniStat label="Tasa Recaudo" value={`${metrics.fees.collectionRate}%`} color="#3B82F6" />
            </div>
          </div>
        )}

        {/* Visitantes */}
        {metrics.visitors && (
          <div className={styles.chartCard}>
            <h3>🚪 Visitantes</h3>
            <div className={styles.metricsRow}>
              <MiniStat label="Hoy" value={metrics.visitors.today} color="#3B82F6" />
              <MiniStat label="Activos" value={metrics.visitors.active} color="#F59E0B" />
              <MiniStat label="Esta Semana" value={metrics.visitors.thisWeek} color="#10B981" />
            </div>
          </div>
        )}

        {/* Mantenimiento */}
        {metrics.maintenance && (
          <div className={styles.chartCard}>
            <h3>🔧 Mantenimientos</h3>
            <div className={styles.metricsRow}>
              <MiniStat label="Pendientes" value={metrics.maintenance.pending} color="#EF4444" />
              <MiniStat label="En Progreso" value={metrics.maintenance.inProgress} color="#3B82F6" />
              <MiniStat label="Resueltos" value={metrics.maintenance.resolved} color="#10B981" />
              <MiniStat label="Cancelados" value={metrics.maintenance.cancelled} color="#6B7280" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard AdminTenant / Administrativa ─────────────────────────────────

function TenantDashboard({ 
  metrics, 
  extended, 
  loadingExtended 
}: { 
  metrics: Metrics; 
  extended: ExtendedDashboardData; 
  loadingExtended: boolean;
}) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>

      {/* ── Fila principal de indicadores ─────────────────────────────── */}
      <div className={styles.cardsGrid}>
        <StatCard title="Propiedades" value={metrics.totalProperties} icon="🏠" />
        <StatCard title="Unidades" value={metrics.totalUnits} icon="🔢" />
        <StatCard title="Usuarios" value={metrics.totalUsers} icon="👤" />
        <StatCard title="Residentes" value={metrics.totalResidents} icon="👨‍👩‍👧‍👧" />
      </div>

      {/* ── Segunda fila ──────────────────────────────────────────────── */}
      <div className={styles.cardsGrid}>
        <StatCard 
          title="Ocupación" 
          value={`${metrics.occupancyRate}%`} 
          subtitle={`${metrics.unitsByStatus.OCCUPIED} de ${metrics.totalUnits} unidades`}
          icon="📊" 
        />
        <StatCard 
          title="Disponibles" 
          value={metrics.unitsByStatus.AVAILABLE} 
          icon="🟢" 
        />
        <StatCard 
          title="En Mantenimiento" 
          value={metrics.unitsByStatus.MAINTENANCE} 
          icon="🛠️" 
        />
        <StatCard 
          title="Recaudado" 
          value={`$${(metrics.fees?.totalCollected ?? 0).toLocaleString('es-CO')}`}
          subtitle={`Tasa: ${metrics.fees?.collectionRate ?? 0}%`}
          icon="💰" 
        />
      </div>

      {/* ── Gráficos y tablas ──────────────────────────────────────────── */}
      <div className={styles.chartsGrid}>
        {/* Unidades por estado */}
        <div className={styles.chartCard}>
          <h3>📊 Unidades por Estado</h3>
          {renderUnitBars(metrics.unitsByStatus)}
        </div>

        {/* Cuotas por estado */}
        {metrics.fees && (
          <div className={styles.chartCard}>
            <h3>💰 Cuotas por Estado</h3>
            {renderFeeBars(metrics.fees)}
          </div>
        )}

        {/* Visitantes */}
        {metrics.visitors && (
          <div className={styles.chartCard}>
            <h3>🚪 Visitantes — Actividad</h3>
            <div className={styles.metricsRow}>
              <MiniStat label="Hoy" value={metrics.visitors.today} color="#3B82F6" />
              <MiniStat label="Activos ahora" value={metrics.visitors.active} color="#F59E0B" />
              <MiniStat label="Esta semana" value={metrics.visitors.thisWeek} color="#10B981" />
            </div>
          </div>
        )}

        {/* Mantenimiento */}
        {metrics.maintenance && (
          <div className={styles.chartCard}>
            <h3>🔧 Mantenimientos por Estado</h3>
            {renderMaintenanceBars(metrics.maintenance)}
          </div>
        )}

        {/* Cuotas próximas a vencer */}
        <div className={styles.chartCard}>
          <h3>💰 Cuotas Próximas a Vencer</h3>
          {loadingExtended ? (
            <p className={styles.sectionLoading}>Cargando...</p>
          ) : extended.upcomingFees.length === 0 ? (
            <p className={styles.sectionEmpty}>No hay cuotas próximas a vencer</p>
          ) : (
            <ul className={styles.itemList}>
              {extended.upcomingFees.slice(0, 5).map(item => (
                <li key={item.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>
                      ${Number(item.amount).toLocaleString('es-CO')} · {item.unitNumber}
                    </span>
                    <span className={styles.itemMeta}>
                      {item.period}
                    </span>
                  </div>
                  <span
                    className={styles.daysBadge}
                    style={{
                      backgroundColor: item.daysLeft <= 3 ? '#FEF2F2' : '#FEFCE8',
                      color: item.daysLeft <= 3 ? '#DC2626' : '#CA8A04',
                    }}
                  >
                    {item.daysLeft <= 0 ? 'Vencida' : `${item.daysLeft} días`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mantenimientos activos */}
        <div className={styles.chartCard}>
          <h3>🔧 Mantenimientos Activos</h3>
          {loadingExtended ? (
            <p className={styles.sectionLoading}>Cargando...</p>
          ) : extended.pendingMaintenance.length === 0 ? (
            <p className={styles.sectionEmpty}>No hay mantenimientos pendientes</p>
          ) : (
            <ul className={styles.itemList}>
              {extended.pendingMaintenance.slice(0, 5).map(item => {
                const label = item.status === 'PENDING' ? 'Pendiente' : 'En Progreso';
                const color = item.status === 'PENDING' ? '#F59E0B' : '#3B82F6';
                return (
                  <li key={item.id} className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemMeta}>
                        {item.unitNumber} · Creado {new Date(item.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    <span
                      className={styles.statusDot}
                      style={{ backgroundColor: color }}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Anuncios activos */}
        <div className={styles.chartCard}>
          <h3>📢 Anuncios Publicados</h3>
          {loadingExtended ? (
            <p className={styles.sectionLoading}>Cargando...</p>
          ) : extended.activeAnnouncements.length === 0 ? (
            <p className={styles.sectionEmpty}>No hay anuncios activos</p>
          ) : (
            <ul className={styles.itemList}>
              {extended.activeAnnouncements.slice(0, 5).map(item => {
                const priorityLabels: Record<string, { label: string; color: string }> = {
                  URGENT: { label: 'Urgente', color: '#EF4444' },
                  HIGH: { label: 'Alta', color: '#F59E0B' },
                  NORMAL: { label: 'Normal', color: '#3B82F6' },
                  LOW: { label: 'Baja', color: '#6B7280' },
                };
                const p = priorityLabels[item.priority] || { label: item.priority, color: '#6B7280' };
                return (
                  <li key={item.id} className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemMeta}>
                        {new Date(item.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    <span
                      className={styles.priorityBadge}
                      style={{ backgroundColor: p.color }}
                    >
                      {p.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers de render ──────────────────────────────────────────────────────

function renderUnitBars(unitsByStatus: Record<string, number>) {
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
  const max = Math.max(...Object.values(unitsByStatus), 1);

  return (
    <div className={styles.barList}>
      {Object.entries(unitsByStatus).map(([status, count]) => (
        <div key={status} className={styles.barRow}>
          <span className={styles.barLabel}>{labels[status] ?? status}</span>
          <div className={styles.bar}>
            <div
              className={styles.barFill}
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: colors[status] ?? 'var(--color-gray-400)',
              }}
            />
          </div>
          <span className={styles.barValue}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function renderFeeBars(fees: { pending: number; paid: number; partial: number }) {
  const items = [
    { key: 'paid', label: 'Pagadas', count: fees.paid, color: '#10B981' },
    { key: 'pending', label: 'Pendientes', count: fees.pending, color: '#F59E0B' },
    { key: 'partial', label: 'Parciales', count: fees.partial, color: '#3B82F6' },
  ];
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <div className={styles.barList}>
      {items.map(item => (
        <div key={item.key} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.bar}>
            <div
              className={styles.barFill}
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className={styles.barValue}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function renderMaintenanceBars(maintenance: { pending: number; inProgress: number; resolved: number; cancelled: number }) {
  const items = [
    { key: 'pending', label: 'Pendientes', count: maintenance.pending, color: '#EF4444' },
    { key: 'inProgress', label: 'En Progreso', count: maintenance.inProgress, color: '#3B82F6' },
    { key: 'resolved', label: 'Resueltos', count: maintenance.resolved, color: '#10B981' },
    { key: 'cancelled', label: 'Cancelados', count: maintenance.cancelled, color: '#6B7280' },
  ];
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <div className={styles.barList}>
      {items.map(item => (
        <div key={item.key} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.bar}>
            <div
              className={styles.barFill}
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className={styles.barValue}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard Portería ──────────────────────────────────────────────────────

function PorteriaDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ today: 0, active: 0, thisWeek: 0 });

  useEffect(() => {
    if (!user?.clientId) return;
    Promise.all([
      api.get(`/metrics/tenant/${user.clientId}`),
    ]).then(([metricsRes]) => {
      const data = metricsRes.data as RawMetrics;
      if (data.visitors) {
        setCounts({
          today: data.visitors.today,
          active: data.visitors.active,
          thisWeek: data.visitors.thisWeek,
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel de Portería</h1>

      <div className={styles.cardsGrid}>
        <StatCard title="Visitantes Hoy" value={counts.today} icon="🚪" />
        <StatCard title="Activos (sin salida)" value={counts.active} icon="🟡" />
        <StatCard title="Esta Semana" value={counts.thisWeek} icon="📅" />
      </div>

      <div className={styles.chartCard}>
        <h3>Visitantes activos</h3>
        {counts.active > 0 ? (
          <p className={styles.recentValue}>
            {counts.active} visitante{counts.active !== 1 ? 's' : ''} pendiente{counts.active !== 1 ? 's' : ''} de registrar salida
          </p>
        ) : (
          <p className={styles.sectionEmpty}>No hay visitantes activos en este momento</p>
        )}
      </div>
    </div>
  );
}

// ── Tarjetas reutilizables ──────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      {icon && <span className={styles.statIcon}>{icon}</span>}
      <span className={styles.statTitle}>{title}</span>
      <span className={styles.statValue}>{value}</span>
      {subtitle && <span className={styles.statSubtitle}>{subtitle}</span>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={styles.miniStat}>
      <span className={styles.miniStatValue} style={{ color }}>{value}</span>
      <span className={styles.miniStatLabel}>{label}</span>
    </div>
  );
}
