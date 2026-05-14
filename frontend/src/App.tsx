/* =============================================================================
   SaaS Inmobiliario — App (Router)
   Configuración de rutas de la aplicación
   ============================================================================= */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/public/:subdomain" element={<TenantWebsitePage />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* SuperAdmin */}
              <Route path="/tenants" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><TenantPage /></Suspense>} />
              <Route path="/platform-metrics" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><MetricsPage /></Suspense>} />

              {/* Dominio inmobiliario */}
              <Route path="/properties" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><PropertiesPage /></Suspense>} />
              <Route path="/properties/:id" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><PropertiesPage /></Suspense>} />
              <Route path="/units" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><UnitsPage /></Suspense>} />
              <Route path="/residents" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><ResidentsPage /></Suspense>} />
              <Route path="/occupancies" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><OccupancyPage /></Suspense>} />

              {/* Operativo */}
              <Route path="/fees" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><FeesPage /></Suspense>} />
              <Route path="/maintenance" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><MaintenancePage /></Suspense>} />
              <Route path="/visitors" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><VisitorsPage /></Suspense>} />
              <Route path="/announcements" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><AnnouncementsPage /></Suspense>} />

              {/* Configuración */}
              <Route path="/website" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><WebsitePage /></Suspense>} />
              <Route path="/audit" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><AuditPage /></Suspense>} />
              <Route path="/users" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><UsersPage /></Suspense>} />
              <Route path="/roles" element={<Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}><RolesPage /></Suspense>} />
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
