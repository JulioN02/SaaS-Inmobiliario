import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID del pago' })
  id: string;

  @ApiProperty({ description: 'ID de la factura' })
  invoiceId: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Monto', example: 150000.00 })
  amount: number;

  @ApiProperty({ description: 'Moneda', example: 'COP' })
  currency: string;

  @ApiProperty({ description: 'Método de pago', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Referencia' })
  reference?: string;

  @ApiProperty({ description: 'Recibido por' })
  receivedBy: string;

  @ApiProperty({ description: 'Fecha de recepción' })
  receivedAt: Date;

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  // Relations
  @ApiPropertyOptional({ description: 'Estado de la factura después del pago' })
  invoiceStatus?: string;

  @ApiPropertyOptional({ description: 'Número de factura' })
  invoiceNumber?: string;
}
