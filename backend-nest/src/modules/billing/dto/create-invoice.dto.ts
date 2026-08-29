import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID de la suscripción',
    example: 'uuid-subscription',
  })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 'uuid-tenant',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'ID del plan',
    example: 'uuid-plan',
  })
  @IsUUID()
  planId: string;

  @ApiProperty({
    description: 'Monto de la factura',
    example: 150000.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Moneda (default: COP)',
    example: 'COP',
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: 'Inicio del periodo de facturación',
    example: '2026-05-01T00:00:00Z',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'Fin del periodo de facturación',
    example: '2026-06-01T00:00:00Z',
  })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({
    description: 'Notas de la factura',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
