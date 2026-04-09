/* =============================================================================
   SaaS Inmobiliario — Componente Toast
   Notificación individual con animación de entrada/salida
   ============================================================================= */

import { useEffect, useState } from 'react';
import type { Toast as ToastData, ToastType } from '../../stores/toastStore';
import styles from './Toast.module.css';

// ── Iconos por tipo ─────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export function Toast({ toast: toastData, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animación de entrada
  useEffect(() => {
    // Pequeño delay para que la animación CSS funcione
    const enterTimer = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(enterTimer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Esperar a que termine la animación antes de remover
    setTimeout(() => {
      onClose(toastData.id);
    }, 200);
  };

  const classNames = [
    styles.toast,
    styles[toastData.type],
    isVisible ? styles.visible : '',
    isExiting ? styles.exiting : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="alert">
      <span className={styles.icon}>{ICONS[toastData.type]}</span>
      <span className={styles.message}>{toastData.message}</span>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}
