import { IsOptional, IsString, IsUrl, MaxLength, IsEmail, IsBoolean, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebsiteDto {
  @ApiPropertyOptional({
    description: 'URL del logo del sitio web',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'logoUrl debe ser una URL válida' })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Color primario (formato hex)',
    example: '#2563EB',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor debe ser un color hex válido (ej: #2563EB)' })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Color secundario (formato hex)',
    example: '#10B981',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'secondaryColor debe ser un color hex válido (ej: #10B981)' })
  secondaryColor?: string;

  @ApiPropertyOptional({
    description: 'Color de fondo (formato hex)',
    example: '#FFFFFF',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'backgroundColor debe ser un color hex válido (ej: #FFFFFF)' })
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Título del sitio',
    example: 'Portal Inmobiliario',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  siteTitle?: string;

  @ApiPropertyOptional({
    description: 'Mensaje de bienvenida (máx 500 caracteres)',
    example: 'Bienvenido a nuestro conjunto residencial',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  welcomeMessage?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'contacto@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'contactEmail debe ser un email válido' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+57 300 123 4567',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Dirección física',
    example: 'Calle 123 #45-67',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Meta título para SEO',
    example: 'Portal Inmobiliario - Conjunto Residencial',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta descripción para SEO',
    example: 'Sitio web oficial del conjunto residencial',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Activar modo mantenimiento',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMaintenanceMode?: boolean;

  @ApiPropertyOptional({
    description: 'Sitio público',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
