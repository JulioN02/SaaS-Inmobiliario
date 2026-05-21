/* =============================================================================
   SaaS Inmobiliario — Header
   Barra superior: nombre del tenant, notificaciones, menú de usuario
   ============================================================================= */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`
    : user?.email ?? '';

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_TENANT: 'Administrador',
    ADMINISTRATIVA: 'Administrativa',
    PORTERIA: 'Portería',
  };

  return (
    <header className={styles.header}>
      {/* ── Izquierda: hamburger + tenant ────────────────────────────────── */}
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={onToggleMobileMenu}
          aria-label="Menú"
        >
          ☰
        </button>
        <span className={styles.tenantName}>Conjunto Residencial Las Palmas</span>
      </div>

      {/* ── Derecha: usuario ─────────────────────────────────────────────── */}
      <div className={styles.right}>
        {/* Campana de notificaciones (pendiente de implementar) */}

        {/* Menú de usuario */}
        <div className={styles.userMenu} ref={menuRef}>
          <button
            className={styles.userTrigger}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <div className={styles.avatar}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>{roleLabels[role ?? ''] ?? role}</span>
            </div>
            <span className={styles.chevron}>▾</span>
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownName}>{displayName}</span>
                <span className={styles.dropdownRole}>{roleLabels[role ?? ''] ?? role}</span>
              </div>
              <hr className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
