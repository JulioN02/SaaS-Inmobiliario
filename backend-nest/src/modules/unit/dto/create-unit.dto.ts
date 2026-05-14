import { IsString, IsEnum, IsInt, IsUUID, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType } from '@prisma/client';

export class CreateUnitDto {
  @ApiProperty({
    description: 'Identificador único de la unidad dentro de la propiedad',
    example: 'Apt-101',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  identifier: string;

  @ApiProperty({
    description: 'Tipo de unidad',
    enum: UnitType,
    example: UnitType.APARTMENT,
  })
  @IsEnum(UnitType)
  unitType: UnitType;

  @ApiPropertyOptional({
    description: 'Piso de la unidad',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  floor?: number;

  @ApiProperty({
    description: 'ID de la propiedad a la que pertenece la unidad',
    example: 'uuid-property',
  })
  @IsUUID()
  propertyId: string;

  @ApiPropertyOptional({
    description: 'ID de la torre (opcional)',
    example: 'uuid-tower',
  })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({
    description: 'Monto de cuota mensual',
    example: 150000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyFeeAmount?: number;
}