/* =============================================================================
   SaaS Inmobiliario — App (Router)
   Configuración de rutas de la aplicación
   ============================================================================= */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

// ── Rutas placeholder (se construyen en fases posteriores) ──────────────────

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: '24px' }}>
      <h1>{title}</h1>
      <p style={{ color: '#64748B' }}>Pendiente de implementación</p>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* SuperAdmin */}
              <Route path="/tenants" element={<PlaceholderPage title="Tenants" />} />
              <Route path="/platform-metrics" element={<PlaceholderPage title="Métricas de Plataforma" />} />

              {/* Dominio inmobiliario */}
              <Route path="/properties" element={<PlaceholderPage title="Propiedades" />} />
              <Route path="/units" element={<PlaceholderPage title="Unidades" />} />
              <Route path="/residents" element={<PlaceholderPage title="Residentes" />} />
              <Route path="/occupancies" element={<PlaceholderPage title="Ocupaciones" />} />

              {/* Operativo */}
              <Route path="/fees" element={<PlaceholderPage title="Cuotas" />} />
              <Route path="/maintenance" element={<PlaceholderPage title="Mantenimiento" />} />
              <Route path="/visitors" element={<PlaceholderPage title="Visitantes" />} />
              <Route path="/announcements" element={<PlaceholderPage title="Anuncios" />} />

              {/* Configuración */}
              <Route path="/website" element={<PlaceholderPage title="Website Config" />} />
              <Route path="/audit" element={<PlaceholderPage title="Auditoría" />} />
              <Route path="/users" element={<PlaceholderPage title="Usuarios" />} />
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
