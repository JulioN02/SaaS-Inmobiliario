import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ description: 'ID único del plan' })
  id: string;

  @ApiProperty({ description: 'Nombre del plan', example: 'Básico' })
  name: string;

  @ApiProperty({ description: 'Slug único del plan', example: 'basic' })
  slug: string;

  @ApiProperty({ description: 'Descripción del plan', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Límites del plan (properties, units, users)' })
  limits: Record<string, number>;

  @ApiProperty({ description: 'Precios del plan (monthly, yearly)' })
  prices: Record<string, number>;

  @ApiProperty({ description: 'Características del plan' })
  features: string[];

  @ApiProperty({ description: 'Plan activo' })
  isActive: boolean;

  @ApiProperty({ description: 'Orden de visualización' })
  sortOrder: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiProperty({ description: 'Fecha de eliminación (soft delete)', nullable: true })
  deletedAt: Date | null;
}

export class PaginatedPlansResponseDto {
  @ApiProperty({ type: [PlanResponseDto] })
  data: PlanResponseDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Items por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
