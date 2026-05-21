import { ApiProperty } from '@nestjs/swagger';
import { TenantPlan, TenantStatus } from '@prisma/client';

export class TenantResponseDto {
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
}

export class PaginatedTenantsResponseDto {
  @ApiProperty({ type: [TenantResponseDto] })
  data: TenantResponseDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Items por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
