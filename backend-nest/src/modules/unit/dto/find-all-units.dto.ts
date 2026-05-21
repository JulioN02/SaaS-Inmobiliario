import { IsOptional, IsUUID, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UnitStatus } from '@prisma/client';

export class FindAllUnitsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de propiedad',
    example: 'uuid-property',
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de torre',
    example: 'uuid-tower',
  })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de unidad',
    enum: UnitStatus,
  })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}