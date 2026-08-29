import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'ID de la suscripción' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID del plan' })
  planId: string;

  @ApiProperty({ description: 'Estado', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Inicio del periodo' })
  periodStart: Date;

  @ApiProperty({ description: 'Fin del periodo' })
  periodEnd: Date;

  @ApiProperty({ description: 'Cancelar al final del periodo' })
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional({ description: 'Fin del periodo de prueba' })
  trialEndsAt?: Date;

  @ApiPropertyOptional({ description: 'ID del cliente Stripe' })
  stripeCustomerId?: string;

  @ApiPropertyOptional({ description: 'ID de suscripción Stripe' })
  stripeSubscriptionId?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional({ description: 'Nombre del plan' })
  planName?: string;

  @ApiPropertyOptional({ description: 'Nombre del tenant' })
  tenantName?: string;

  @ApiPropertyOptional({ description: 'Estado del tenant' })
  tenantStatus?: string;

  @ApiPropertyOptional({ description: 'Facturas de la suscripción' })
  invoices?: Array<{ id: string; amount: number; status: string; dueDate: Date }>;
}
