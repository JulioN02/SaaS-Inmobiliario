/* =============================================================================
   SaaS Inmobiliario — Toast Container
   Contenedor que renderiza todos los toasts activos
   ============================================================================= */

import { useToastStore } from '../../stores/toastStore';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((toastData) => (
        <Toast key={toastData.id} toast={toastData} onClose={removeToast} />
      ))}
    </div>
  );
}
