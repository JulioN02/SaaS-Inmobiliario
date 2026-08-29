import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID de la factura',
    example: 'uuid-invoice',
  })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 'uuid-tenant',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'Monto del pago',
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
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.transfer,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Referencia del pago',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
