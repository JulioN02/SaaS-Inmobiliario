import { IsEnum, IsOptional, IsUUID, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeeStatus } from '@prisma/client';

export class FindAllFeesDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de unidad',
    example: 'uuid-unit',
  })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de cuota',
    enum: FeeStatus,
    example: FeeStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por periodo (YYYY-MM)',
    example: '2026-05',
    maxLength: 7,
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  period?: string;

  @ApiPropertyOptional({
    description: 'Número de página (default: 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página (default: 20, max: 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}