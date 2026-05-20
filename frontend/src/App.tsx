/* =============================================================================
   SaaS Inmobiliario — App (Router)
   Configuración de rutas de la aplicación
   ============================================================================= */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantWebsitePage } from './pages/website/TenantWebsitePage';

// ── Rutas lazy ──────────────────────────────────────────────────────

const UsersPage = lazy(() => import('./pages/user') as any);
const RolesPage = lazy(() => import('./pages/role') as any);
const PropertiesPage = lazy(() => import('./pages/property') as any);
const UnitsPage = lazy(() => import('./pages/unit') as any);
const ResidentsPage = lazy(() => import('./pages/resident') as any);
const OccupancyPage = lazy(() => import('./pages/occupancy') as any);
const VisitorsPage = lazy(() => import('./pages/visitor') as any);
const MaintenancePage = lazy(() => import('./pages/maintenance') as any);
const FeesPage = lazy(() => import('./pages/fee') as any);
const AnnouncementsPage = lazy(() => import('./pages/announcement') as any);
const WebsitePage = lazy(() => import('./pages/website') as any);
const TenantPage = lazy(() => import('./pages/tenant') as any);
const AuditPage = lazy(() => import('./pages/audit') as any);
const MetricsPage = lazy(() => import('./pages/metrics') as any);

// ── App ─────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
          <Route path="/public/:subdomain" element={<ErrorBoundary><TenantWebsitePage /></ErrorBoundary>} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />

              {/* SuperAdmin */}
              <Route path="/tenants" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><TenantPage /></Suspense></ErrorBoundary>} />
              <Route path="/platform-metrics" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><MetricsPage /></Suspense></ErrorBoundary>} />

              {/* Dominio inmobiliario */}
              <Route path="/properties" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><PropertiesPage /></Suspense></ErrorBoundary>} />
              <Route path="/properties/:id" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><PropertiesPage /></Suspense></ErrorBoundary>} />
              <Route path="/units" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><UnitsPage /></Suspense></ErrorBoundary>} />
              <Route path="/residents" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><ResidentsPage /></Suspense></ErrorBoundary>} />
              <Route path="/occupancies" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><OccupancyPage /></Suspense></ErrorBoundary>} />

              {/* Operativo */}
              <Route path="/fees" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><FeesPage /></Suspense></ErrorBoundary>} />
              <Route path="/maintenance" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><MaintenancePage /></Suspense></ErrorBoundary>} />
              <Route path="/visitors" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><VisitorsPage /></Suspense></ErrorBoundary>} />
              <Route path="/announcements" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><AnnouncementsPage /></Suspense></ErrorBoundary>} />

              {/* Configuración */}
              <Route path="/website" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><WebsitePage /></Suspense></ErrorBoundary>} />
              <Route path="/audit" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><AuditPage /></Suspense></ErrorBoundary>} />
              <Route path="/users" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><UsersPage /></Suspense></ErrorBoundary>} />
              <Route path="/roles" element={<ErrorBoundary><Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><RolesPage /></Suspense></ErrorBoundary>} />
            </Route>
          </Route>

          {/* Redirect por defecto */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
