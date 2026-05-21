import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsUUID, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { OccupancyType } from '../../../shared/types/enums';

export class FindAllOccupanciesDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de residente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @ApiPropertyOptional({ enum: OccupancyType, description: 'Filtrar por tipo' })
  @IsOptional()
  @IsEnum(OccupancyType)
  type?: OccupancyType;

  @ApiPropertyOptional({ description: 'Filtrar solo ocupaciones activas (sin endDate)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite de resultados', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}