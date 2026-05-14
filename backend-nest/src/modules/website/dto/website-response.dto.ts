import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebsiteResponseDto {
  @ApiProperty({
    description: 'ID único de la configuración',
    example: 'uuid-website-config',
  })
  id: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 'uuid-tenant',
  })
  tenantId: string;

  @ApiPropertyOptional({
    description: 'URL del logo del sitio web',
    example: 'https://example.com/logo.png',
  })
  logoUrl?: string;

  @ApiProperty({
    description: 'Color primario',
    example: '#2563EB',
  })
  primaryColor: string;

  @ApiProperty({
    description: 'Color secundario',
    example: '#10B981',
  })
  secondaryColor: string;

  @ApiProperty({
    description: 'Color de fondo',
    example: '#FFFFFF',
  })
  backgroundColor: string;

  @ApiProperty({
    description: 'Título del sitio',
    example: 'Portal Inmobiliario',
  })
  siteTitle: string;

  @ApiPropertyOptional({
    description: 'Mensaje de bienvenida',
    example: 'Bienvenido a nuestro conjunto residencial',
  })
  welcomeMessage?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'contacto@example.com',
  })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+57 300 123 4567',
  })
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Dirección física',
    example: 'Calle 123 #45-67',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'Meta título para SEO',
    example: 'Portal Inmobiliario - Conjunto Residencial',
  })
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta descripción para SEO',
    example: 'Sitio web oficial del conjunto residencial',
  })
  metaDescription?: string;

  @ApiProperty({
    description: 'Modo mantenimiento activo',
    example: false,
  })
  isMaintenanceMode: boolean;

  @ApiProperty({
    description: 'Sitio público',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-05-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-05-01T10:00:00Z',
  })
  updatedAt: Date;
}
