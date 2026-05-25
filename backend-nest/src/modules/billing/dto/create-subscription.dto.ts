import { IsEnum, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
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

  @ApiPropertyOptional({
    description: 'Estado de la suscripción',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

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
    description: 'Fecha de fin del periodo de prueba',
    example: '2026-05-15T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @ApiPropertyOptional({
    description: 'Cancelar al final del periodo',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({
    description: 'ID del cliente en Stripe',
  })
  @IsOptional()
  @IsUUID()
  stripeCustomerId?: string;

  @ApiPropertyOptional({
    description: 'ID de la suscripción en Stripe',
  })
  @IsOptional()
  stripeSubscriptionId?: string;
}
