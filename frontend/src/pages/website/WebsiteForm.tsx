/* =============================================================================
   SaaS Inmobiliario — Website Form
   Formulario de configuración con react-hook-form + zod
   ============================================================================= */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '../../components/Shared/FormField';
import type { WebsiteConfig, UpdateWebsiteDto } from '../../types/website';
import styles from './WebsitePage.module.css';

// ── Schema de validación ─────────────────────────────────────────────────

const websiteSchema = z.object({
  siteTitle: z.string().min(1, 'El título es requerido').max(100, 'Máximo 100 caracteres'),
  welcomeMessage: z.string().max(500, 'Máximo 500 caracteres').optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().max(20, 'Máximo 20 caracteres').optional(),
  address: z.string().max(200, 'Máximo 200 caracteres').optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido').default('#3B82F6'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido').default('#1E293B'),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido').default('#FFFFFF'),
  metaTitle: z.string().max(60, 'Máximo 60 caracteres').optional(),
  metaDescription: z.string().max(160, 'Máximo 160 caracteres').optional(),
  isMaintenanceMode: z.boolean().default(false),
  isPublic: z.boolean().default(true),
});

type WebsiteFormData = z.infer<typeof websiteSchema>;

// ── Props ────────────────────────────────────────────────────────────────

interface WebsiteFormProps {
  config: WebsiteConfig | null;
  onSubmit: (data: UpdateWebsiteDto) => void;
  loading: boolean;
}

// ── Componente ───────────────────────────────────────────────────────────

export function WebsiteForm({ config, onSubmit, loading }: WebsiteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WebsiteFormData>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      siteTitle: config?.siteTitle || '',
      welcomeMessage: config?.welcomeMessage || '',
      contactEmail: config?.contactEmail || '',
      contactPhone: config?.contactPhone || '',
      address: config?.address || '',
      logoUrl: config?.logoUrl || '',
      primaryColor: config?.primaryColor || '#3B82F6',
      secondaryColor: config?.secondaryColor || '#1E293B',
      backgroundColor: config?.backgroundColor || '#FFFFFF',
      metaTitle: config?.metaTitle || '',
      metaDescription: config?.metaDescription || '',
      isMaintenanceMode: config?.isMaintenanceMode || false,
      isPublic: config?.isPublic ?? true,
    },
  });

  // Watch colors for live preview
  const watchedPrimaryColor = watch('primaryColor');
  const watchedSecondaryColor = watch('secondaryColor');
  const watchedBackgroundColor = watch('backgroundColor');
  const watchedLogoUrl = watch('logoUrl');

  const onFormSubmit = (data: WebsiteFormData) => {
    // Convert form data to UpdateWebsiteDto (remove empty strings)
    const dto: UpdateWebsiteDto = {};
    if (data.siteTitle !== config?.siteTitle) dto.siteTitle = data.siteTitle;
    if (data.welcomeMessage !== config?.welcomeMessage) dto.welcomeMessage = data.welcomeMessage || undefined;
    if (data.contactEmail !== config?.contactEmail) dto.contactEmail = data.contactEmail || undefined;
    if (data.contactPhone !== config?.contactPhone) dto.contactPhone = data.contactPhone || undefined;
    if (data.address !== config?.address) dto.address = data.address || undefined;
    if (data.logoUrl !== config?.logoUrl) dto.logoUrl = data.logoUrl || undefined;
    if (data.primaryColor !== config?.primaryColor) dto.primaryColor = data.primaryColor;
    if (data.secondaryColor !== config?.secondaryColor) dto.secondaryColor = data.secondaryColor;
    if (data.backgroundColor !== config?.backgroundColor) dto.backgroundColor = data.backgroundColor;
    if (data.metaTitle !== config?.metaTitle) dto.metaTitle = data.metaTitle || undefined;
    if (data.metaDescription !== config?.metaDescription) dto.metaDescription = data.metaDescription || undefined;
    if (data.isMaintenanceMode !== config?.isMaintenanceMode) dto.isMaintenanceMode = data.isMaintenanceMode;
    if (data.isPublic !== config?.isPublic) dto.isPublic = data.isPublic;

    onSubmit(dto);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onFormSubmit)}>
      {/* Site Title */}
      <FormField
        label="Título del Sitio"
        type="text"
        {...register('siteTitle')}
        error={errors.siteTitle?.message}
        required
      />

      {/* Welcome Message */}
      <FormField
        label="Mensaje de Bienvenida"
        as="textarea"
        {...register('welcomeMessage')}
        error={errors.welcomeMessage?.message}
      />

      {/* Contact Email */}
      <FormField
        label="Email de Contacto"
        type="email"
        {...register('contactEmail')}
        error={errors.contactEmail?.message}
      />

      {/* Contact Phone */}
      <FormField
        label="Teléfono de Contacto"
        type="tel"
        {...register('contactPhone')}
        error={errors.contactPhone?.message}
      />

      {/* Address */}
      <FormField
        label="Dirección"
        as="textarea"
        {...register('address')}
        error={errors.address?.message}
      />

      {/* Logo URL */}
      <div className={styles.formField}>
        <label className={styles.label}>URL del Logo</label>
        <div className={styles.logoInputGroup}>
          <input
            type="url"
            className={styles.input}
            {...register('logoUrl')}
            placeholder="https://ejemplo.com/logo.png"
          />
          {watchedLogoUrl && (
            <div className={styles.logoPreview}>
              <img
                src={watchedLogoUrl}
                alt="Logo preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        {errors.logoUrl && <p className={styles.error}>{errors.logoUrl.message}</p>}
      </div>

      {/* Color Pickers */}
      <div className={styles.colorRow}>
        <div className={styles.colorField}>
          <label className={styles.label}>Color Primario</label>
          <div className={styles.colorInputGroup}>
            <input
              type="color"
              className={styles.colorPicker}
              value={watchedPrimaryColor}
              {...register('primaryColor')}
            />
            <input
              type="text"
              className={styles.colorText}
              {...register('primaryColor')}
            />
          </div>
          {errors.primaryColor && <p className={styles.error}>{errors.primaryColor.message}</p>}
        </div>

        <div className={styles.colorField}>
          <label className={styles.label}>Color Secundario</label>
          <div className={styles.colorInputGroup}>
            <input
              type="color"
              className={styles.colorPicker}
              value={watchedSecondaryColor}
              {...register('secondaryColor')}
            />
            <input
              type="text"
              className={styles.colorText}
              {...register('secondaryColor')}
            />
          </div>
          {errors.secondaryColor && <p className={styles.error}>{errors.secondaryColor.message}</p>}
        </div>

        <div className={styles.colorField}>
          <label className={styles.label}>Color de Fondo</label>
          <div className={styles.colorInputGroup}>
            <input
              type="color"
              className={styles.colorPicker}
              value={watchedBackgroundColor}
              {...register('backgroundColor')}
            />
            <input
              type="text"
              className={styles.colorText}
              {...register('backgroundColor')}
            />
          </div>
          {errors.backgroundColor && <p className={styles.error}>{errors.backgroundColor.message}</p>}
        </div>
      </div>

      {/* SEO Fields */}
      <div className={styles.seoSection}>
        <h3 className={styles.sectionTitle}>SEO (Metadatos)</h3>
        <FormField
          label="Meta Título"
          type="text"
          {...register('metaTitle')}
          error={errors.metaTitle?.message}
          hint="Máximo 60 caracteres"
        />
        <FormField
          label="Meta Descripción"
          as="textarea"
          {...register('metaDescription')}
          error={errors.metaDescription?.message}
          hint="Máximo 160 caracteres"
        />
      </div>

      {/* Toggles */}
      <div className={styles.togglesSection}>
        <label className={styles.toggleLabel}>
          <input type="checkbox" {...register('isMaintenanceMode')} />
          <span>Modo Mantenimiento</span>
        </label>
        <label className={styles.toggleLabel}>
          <input type="checkbox" {...register('isPublic')} />
          <span>Sitio Público</span>
        </label>
      </div>

      {/* Submit */}
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  );
}
