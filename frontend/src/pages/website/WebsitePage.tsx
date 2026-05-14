/* =============================================================================
   SaaS Inmobiliario — Website Page
   Settings page with two-column layout: form + preview
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useWebsiteStore } from '../../stores/websiteStore';
import { useAuth } from '../../hooks/useAuth';
import { findTenantById } from '../../services/tenant';
import { WebsiteForm } from './WebsiteForm';
import { WebsitePreview } from './WebsitePreview';
import { toast } from '../../stores/toastStore';
import styles from './WebsitePage.module.css';

export function WebsitePage() {
  const { user } = useAuth();
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
    clearError,
  } = useWebsiteStore();

  // Cargar configuración al montar
  useEffect(() => {
    fetchConfig();
  }, []);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Obtener subdominio para el enlace de vista previa
  useEffect(() => {
    if (user?.clientId && !subdomain) {
      findTenantById(user.clientId)
        .then((tenant) => setSubdomain(tenant.subdomain))
        .catch(() => {
          // Silently fail — preview link won't show
        });
    }
  }, [user?.clientId]);

  const handleSubmit = async (dto: any) => {
    try {
      await updateConfig(dto);
      toast.success('Configuración guardada exitosamente');
    } catch (err) {
      // Error ya manejado en el store
    }
  };

  if (loading && !config) {
    return (
      <div className={styles.loading}>
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración del Website</h1>
          <p className={styles.subtitle}>
            Personaliza cómo se ve tu sitio web institucional
          </p>
          {subdomain && (
            <a
              href={`/public/${subdomain}`}
              className={styles.previewButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Vista Previa
            </a>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className={styles.layout}>
        {/* Left: Form */}
        <div className={styles.formColumn}>
          <WebsiteForm
            config={config}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        {/* Right: Preview */}
        <div className={styles.previewColumn}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '16px', color: '#1E293B' }}>
            Vista Previa
          </h3>
          <WebsitePreview config={config || {}} />
        </div>
      </div>
    </div>
  );
}

export default WebsitePage;
