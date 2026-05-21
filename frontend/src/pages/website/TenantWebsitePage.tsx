/* =============================================================================
   SaaS Inmobiliario — Tenant Public Website Page
   Página pública del website institucional del tenant
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getWebsiteConfig, getPublicProperties } from '../../services/publicApi';
import type { PublicWebsiteConfig, PublicProperty } from '../../services/publicApi';
import styles from './TenantWebsitePage.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

type PageStatus = 'loading' | 'ready' | 'maintenance' | 'error';

// ── Component ────────────────────────────────────────────────────────────────

export function TenantWebsitePage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [config, setConfig] = useState<PublicWebsiteConfig | null>(null);
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    if (!subdomain) return;
    setStatus('loading');
    try {
      const [siteConfig, siteProperties] = await Promise.all([
        getWebsiteConfig(subdomain),
        getPublicProperties(subdomain),
      ]);
      setConfig(siteConfig);
      setProperties(siteProperties);
      setStatus(siteConfig.isMaintenanceMode ? 'maintenance' : 'ready');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar el sitio');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadData();
  }, [subdomain]);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando sitio web...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (status === 'error') {
    return (
      <div className={styles.errorContainer}>
        <h2>Error al cargar el sitio</h2>
        <p>{errorMsg}</p>
        <button className={styles.retryButton} onClick={loadData}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // ── Maintenance mode ───────────────────────────────────────────────────────

  if (status === 'maintenance' || !config) {
    return (
      <div className={styles.maintenanceContainer}>
        <div className={styles.maintenanceIcon}>🚧</div>
        <h1>Sitio en Mantenimiento</h1>
        <p>Pronto estaremos de vuelta. Gracias por tu paciencia.</p>
      </div>
    );
  }

  // ── Ready state ────────────────────────────────────────────────────────────

  const {
    logoUrl,
    siteTitle,
    welcomeMessage,
    contactEmail,
    contactPhone,
    address,
    primaryColor = '#3B82F6',
    secondaryColor = '#1E293B',
    backgroundColor = '#FFFFFF',
  } = config;

  return (
    <div className={styles.pageWrapper} style={{ backgroundColor }}>
      {/* Maintenance Banner */}
      {config.isMaintenanceMode && (
        <div className={styles.maintenanceBanner}>
          🚧 Sitio en mantenimiento — algunas funciones pueden no estar disponibles
        </div>
      )}

      {/* Header / Navigation */}
      <header className={styles.header} style={{ borderBottomColor: primaryColor }}>
        <nav className={styles.nav}>
          <div className={styles.logoSection}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt={siteTitle}
                className={styles.logo}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className={styles.siteTitle} style={{ color: primaryColor }}>
              {siteTitle}
            </span>
          </div>
          <div className={styles.navLinks}>
            <a href="#inicio" className={styles.navLink}>Inicio</a>
            <a href="#propiedades" className={styles.navLink}>Propiedades</a>
            <a href="#contacto" className={styles.navLink}>Contacto</a>
          </div>
          <div className={styles.contactInfo}>
            {contactEmail && <span>{contactEmail}</span>}
            {contactPhone && <span>{contactPhone}</span>}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="inicio" className={styles.hero} style={{ backgroundColor: primaryColor }}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{siteTitle}</h1>
          {welcomeMessage && (
            <p className={styles.heroMessage}>{welcomeMessage}</p>
          )}
          <a href="#propiedades" className={styles.heroCta}>
            Ver Propiedades
          </a>
        </div>
      </section>

      {/* Properties Section */}
      <section id="propiedades" className={styles.properties}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle} style={{ color: secondaryColor }}>
            Nuestras Propiedades
          </h2>
          {properties.length === 0 ? (
            <p className={styles.emptyMessage}>
              No hay propiedades disponibles en este momento.
            </p>
          ) : (
            <div className={styles.propertiesGrid}>
              {properties.map((property) => (
                <div key={property.id} className={styles.propertyCard}>
                  {property.imageUrl && (
                    <div className={styles.propertyImageContainer}>
                      <img
                        src={property.imageUrl}
                        alt={property.name}
                        className={styles.propertyImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.propertyCardBody}>
                    <div className={styles.propertyCardHeader}>
                      <span
                        className={styles.propertyTypeBadge}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {property.propertyType.replace(/_/g, ' ')}
                      </span>
                      <span className={styles.unitCount}>
                        {property.unitCount}{' '}
                        {property.unitCount === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </div>
                    <h3 className={styles.propertyName}>{property.name}</h3>
                    {property.address && (
                      <p className={styles.propertyAddress}>{property.address}</p>
                    )}
                    {property.description && (
                      <p className={styles.propertyDescription}>{property.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className={styles.contact} style={{ backgroundColor: secondaryColor }}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.contactTitle}>Contacto</h2>
          <div className={styles.contactGrid}>
            {address && (
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <div>
                  <strong>Dirección</strong>
                  <p>{address}</p>
                </div>
              </div>
            )}
            {contactEmail && (
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📧</span>
                <div>
                  <strong>Email</strong>
                  <p>{contactEmail}</p>
                </div>
              </div>
            )}
            {contactPhone && (
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <div>
                  <strong>Teléfono</strong>
                  <p>{contactPhone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} {siteTitle}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default TenantWebsitePage;
