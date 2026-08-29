import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({ description: 'ID único del tenant' })
  id: string;

  @ApiProperty({ description: 'Nombre del tenant' })
  name: string;

  @ApiProperty({ description: 'Subdominio único' })
  subdomain: string;

  @ApiProperty({ description: 'ID del plan asignado' })
  planId: string;

  @ApiProperty({
    description: 'Información del plan',
    example: { id: 'uuid', name: 'Básico', slug: 'basic', limits: { properties: 1, units: 100, users: 5 } },
  })
  plan: {
    id: string;
    name: string;
    slug: string;
    limits: Record<string, number>;
  };

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
