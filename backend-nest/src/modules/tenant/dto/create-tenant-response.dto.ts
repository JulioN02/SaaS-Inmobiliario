import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan, TenantStatus } from '@prisma/client';

export class CreateTenantResponseDto {
  @ApiProperty({ description: 'ID único del tenant' })
  id: string;

  @ApiProperty({ description: 'Nombre del tenant' })
  name: string;

  @ApiProperty({ description: 'Subdominio único' })
  subdomain: string;

  @ApiProperty({ enum: TenantPlan, description: 'Plan contratado' })
  plan: TenantPlan;

  @ApiProperty({ enum: TenantStatus, description: 'Estado actual' })
  status: TenantStatus;

  @ApiProperty({ description: 'Email de contacto', nullable: true })
  contactEmail: string | null;

  @ApiProperty({ description: 'Teléfono de contacto', nullable: true })
  contactPhone: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiProperty({ description: 'Email del administrador creado automáticamente' })
  adminEmail: string;

  @ApiProperty({ description: 'Contraseña temporal del administrador' })
  adminPassword: string;
}
