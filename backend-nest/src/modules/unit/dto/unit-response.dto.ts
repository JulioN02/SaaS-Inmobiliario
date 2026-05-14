import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType, UnitStatus } from '@prisma/client';

export class UnitResponseDto {
  @ApiProperty({ description: 'ID único de la unidad' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID de la propiedad' })
  propertyId: string;

  @ApiPropertyOptional({ description: 'ID de la torre' })
  towerId: string | null;

  @ApiProperty({ description: 'Identificador de la unidad' })
  identifier: string;

  @ApiProperty({ description: 'Tipo de unidad', enum: UnitType })
  unitType: UnitType;

  @ApiPropertyOptional({ description: 'Piso de la unidad' })
  floor: number | null;

  @ApiProperty({ description: 'Estado de la unidad', enum: UnitStatus })
  status: UnitStatus;

  @ApiPropertyOptional({ description: 'Monto de cuota mensual' })
  monthlyFeeAmount: number | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación lógica' })
  deletedAt: Date | null;
}