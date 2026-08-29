import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindAllTenantsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: TenantStatus,
  })
  @IsOptional()
  @IsString()
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID del plan',
    example: 'uuid-del-plan',
  })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
