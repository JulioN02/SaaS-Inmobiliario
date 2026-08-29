import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceResponseDto {
  @ApiProperty({ description: 'ID de la factura' })
  id: string;

  @ApiProperty({ description: 'ID de la suscripción' })
  subscriptionId: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID del plan' })
  planId: string;

  @ApiProperty({ description: 'Monto', example: 150000.00 })
  amount: number;

  @ApiProperty({ description: 'Moneda', example: 'COP' })
  currency: string;

  @ApiProperty({ description: 'Estado', enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Inicio del periodo' })
  periodStart: Date;

  @ApiProperty({ description: 'Fin del periodo' })
  periodEnd: Date;

  @ApiProperty({ description: 'Fecha de vencimiento' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Fecha de pago' })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Monto pagado' })
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Método de pago' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Notas' })
  notes?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional({ description: 'Nombre del plan' })
  planName?: string;

  @ApiPropertyOptional({ description: 'Nombre del tenant' })
  tenantName?: string;

  @ApiPropertyOptional({ description: 'Pagos asociados' })
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    reference: string | null;
    receivedAt: Date;
  }>;
}
