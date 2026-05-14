import { IsString, IsEnum, IsNumber, IsUUID, IsOptional, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeType } from '@prisma/client';

export class CreateFeeDto {
  @ApiProperty({
    description: 'ID de la unidad a la que pertenece la cuota',
    example: 'uuid-unit',
  })
  @IsUUID()
  unitId: string;

  @ApiProperty({
    description: 'Monto de la cuota',
    example: 150000.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Descripción de la cuota (opcional)',
    example: 'Cuota de administración mayo 2026',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Periodo de la cuota en formato YYYY-MM',
    example: '2026-05',
    pattern: 'YYYY-MM',
  })
  @IsString()
  @MaxLength(7)
  period: string;

  @ApiProperty({
    description: 'Fecha de vencimiento de la cuota',
    example: '2026-05-31',
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    description: 'Tipo de cuota',
    enum: FeeType,
    example: FeeType.PERIODIC,
  })
  @IsEnum(FeeType)
  feeType: FeeType;
}