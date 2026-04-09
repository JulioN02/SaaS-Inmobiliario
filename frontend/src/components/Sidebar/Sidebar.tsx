/* =============================================================================
   SaaS Inmobiliario — Sidebar
   Navegación principal por módulos, filtrada por rol
   ============================================================================= */

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';
import styles from './Sidebar.module.css';

// ── Definición de módulos ───────────────────────────────────────────────────

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'] },

  // SuperAdmin
  { path: '/tenants', label: 'Tenants', icon: '🏢', roles: ['SUPER_ADMIN'] },
  { path: '/platform-metrics', label: 'Métricas', icon: '📈', roles: ['SUPER_ADMIN'] },

  // Dominio inmobiliario
  { path: '/properties', label: 'Propiedades', icon: '🏠', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] },
  { path: '/units', label: 'Unidades', icon: '🚪', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'] },
  { path: '/residents', label: 'Residentes', icon: '👥', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] },
  { path: '/occupancies', label: 'Ocupaciones', icon: '📋', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] },

  // Operativo
  { path: '/fees', label: 'Cuotas', icon: '💰', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] },
  { path: '/maintenance', label: 'Mantenimiento', icon: '🔧', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] },
  { path: '/visitors', label: 'Visitantes', icon: '🚪', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'] },
  { path: '/announcements', label: 'Anuncios', icon: '📢', roles: ['ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'] },

  // Configuración
  { path: '/website', label: 'Website', icon: '🌐', roles: ['ADMIN_TENANT'] },
  { path: '/audit', label: 'Auditoría', icon: '🔍', roles: ['ADMIN_TENANT'] },
  { path: '/users', label: 'Usuarios', icon: '👤', roles: ['ADMIN_TENANT'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { role } = useAuth();
  const location = useLocation();

  // Filtrar módulos según el rol del usuario
  const visibleItems = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  return (
    <nav className={styles.nav}>
      {/* ── Toggle ──────────────────────────────────────────────────────── */}
      <button className={styles.toggle} onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? '☰' : '✕'}
      </button>

      {/* ── Navegación ──────────────────────────────────────────────────── */}
      <div className={styles.items}>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && <span className={styles.label}>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* ── Marca de agua ──────────────────────────────────────────────── */}
      <div className={styles.watermark}>
        {!collapsed && (
          <span className={styles.watermarkText}>SaaS Inmobiliario</span>
        )}
      </div>
    </nav>
  );
}
