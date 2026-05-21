import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsUUID, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllVisitorsDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de unidad' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Filtrar desde fecha de entrada' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  entryDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filtrar hasta fecha de entrada' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  entryDateTo?: Date;

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