import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceStatus } from '@prisma/client';

export class FindAllMaintenanceDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de unidad' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: MaintenanceStatus,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite de resultados por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}