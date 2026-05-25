import { IsEnum, IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '@prisma/client';

export class BillingConfigDto {
  @ApiProperty({ description: 'ID de la configuración' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Ciclo de facturación', enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Moneda por defecto', example: 'COP' })
  currency: string;

  @ApiProperty({ description: 'Días de gracia', example: 5 })
  gracePeriodDays: number;

  @ApiPropertyOptional({ description: 'Método de pago preferido' })
  preferredPaymentMethod?: string;

  @ApiPropertyOptional({ description: 'Última facturación' })
  lastInvoiceAt?: Date;

  @ApiPropertyOptional({ description: 'Notas' })
  notes?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class UpdateBillingConfigDto {
  @ApiPropertyOptional({
    description: 'Ciclo de facturación',
    enum: BillingCycle,
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({
    description: 'Moneda por defecto',
    example: 'COP',
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Días de gracia',
    example: 5,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  gracePeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Método de pago preferido',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  preferredPaymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Notas',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
