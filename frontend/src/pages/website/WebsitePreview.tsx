/* =============================================================================
   SaaS Inmobiliario — Website Preview
   Vista previa en tiempo real de cómo se ve el website
   ============================================================================= */

import type { WebsiteConfig } from '../../types/website';
import styles from './WebsitePage.module.css';

interface WebsitePreviewProps {
  config: Partial<WebsiteConfig>;
}

export function WebsitePreview({ config }: WebsitePreviewProps) {
  const {
    siteTitle = 'Título del Sitio',
    welcomeMessage = 'Mensaje de bienvenida...',
    contactEmail = '',
    contactPhone = '',
    address = '',
    logoUrl = '',
    primaryColor = '#3B82F6',
    secondaryColor = '#1E293B',
    backgroundColor = '#FFFFFF',
    isMaintenanceMode = false,
  } = config;

  return (
    <div
      className={styles.previewCard}
      style={{ backgroundColor }}
    >
      {/* Maintenance Banner */}
      {isMaintenanceMode && (
        <div className={styles.maintenanceBanner}>
          🚧 MODO MANTENIMIENTO ACTIVO
        </div>
      )}

      {/* Header Preview */}
      <div className={styles.previewHeader} style={{ borderBottomColor: primaryColor }}>
        {logoUrl && (
          <div className={styles.previewLogoContainer}>
            <img
              src={logoUrl}
              alt="Logo preview"
              className={styles.previewLogo}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <h2 className={styles.previewTitle} style={{ color: primaryColor }}>
          {siteTitle}
        </h2>
      </div>

      {/* Welcome Message */}
      <div className={styles.previewBody}>
        <p className={styles.previewMessage} style={{ color: secondaryColor }}>
          {welcomeMessage}
        </p>
      </div>

      {/* Contact Info */}
      {(contactEmail || contactPhone || address) && (
        <div className={styles.previewContact}>
          <h3 className={styles.previewContactTitle} style={{ color: primaryColor }}>
            Contacto
          </h3>
          {contactEmail && (
            <p className={styles.previewContactItem}>
              📧 {contactEmail}
            </p>
          )}
          {contactPhone && (
            <p className={styles.previewContactItem}>
              📞 {contactPhone}
            </p>
          )}
          {address && (
            <p className={styles.previewContactItem}>
              📍 {address}
            </p>
          )}
        </div>
      )}

      {/* Color Preview */}
      <div className={styles.previewColors}>
        <div className={styles.colorPreviewItem}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: primaryColor }}
          />
          <span>Primario: {primaryColor}</span>
        </div>
        <div className={styles.colorPreviewItem}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: secondaryColor }}
          />
          <span>Secundario: {secondaryColor}</span>
        </div>
        <div className={styles.colorPreviewItem}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: backgroundColor }}
          />
          <span>Fondo: {backgroundColor}</span>
        </div>
      </div>
    </div>
  );
}
