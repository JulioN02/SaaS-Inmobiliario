import { IsNumber, IsOptional, IsString, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeeDto {
  @ApiPropertyOptional({
    description: 'Monto de la cuota',
    example: 150000.00,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Descripción de la cuota',
    example: 'Cuota de administración mayo 2026',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento de la cuota',
    example: '2026-05-31',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}