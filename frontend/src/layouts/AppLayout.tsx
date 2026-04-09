/* =============================================================================
   SaaS Inmobiliario — App Layout
   Layout principal: Sidebar + Header + Contenido
   ============================================================================= */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Header } from '../components/Header/Header';
import { ToastContainer } from '../components/Toast/ToastContainer';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar — escritorio */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>

      {/* Sidebar — móvil (overlay) */}
      {mobileMenuOpen && (
        <div className={styles.overlay} onClick={toggleMobileMenu} />
      )}
      <aside className={`${styles.mobileSidebar} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <Sidebar collapsed={false} onToggle={toggleMobileMenu} />
      </aside>

      {/* Contenido principal */}
      <div className={styles.main}>
        <Header
          onToggleMobileMenu={toggleMobileMenu}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
