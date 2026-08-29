import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BillingMetricsDto {
  @ApiProperty({ description: 'Suscripciones activas (ACTIVE + TRIALING)' })
  activeSubscriptions: number;

  @ApiProperty({ description: 'Suscripciones PAST_DUE' })
  pastDueSubscriptions: number;

  @ApiProperty({ description: 'MRR (Monthly Recurring Revenue)' })
  mrr: number;

  @ApiProperty({ description: 'Tasa de cobranza (%)' })
  collectionRate: number;

  @ApiProperty({ description: 'Total cobrado en el año' })
  totalCollectedYTD: number;

  @ApiProperty({ description: 'Total pendiente de facturas PENDING' })
  pendingInvoicesAmount: number;
}

export class TenantBillingStatusDto {
  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Nombre del tenant' })
  tenantName: string;

  @ApiProperty({ description: 'Subdominio del tenant' })
  tenantSubdomain: string;

  @ApiProperty({ description: 'Estado del tenant' })
  tenantStatus: string;

  @ApiProperty({ description: 'Nombre del plan' })
  planName: string;

  @ApiProperty({ description: 'Estado de la suscripción' })
  subscriptionStatus: string;

  @ApiPropertyOptional({ description: 'Próxima facturación' })
  nextBillingDate?: Date;

  @ApiPropertyOptional({ description: 'Última factura' })
  lastInvoiceDate?: Date;

  @ApiProperty({ description: 'Monto pendiente' })
  outstandingAmount: number;
}

export class PaginatedTenantBillingStatusDto {
  @ApiProperty({ type: [TenantBillingStatusDto] })
  data: TenantBillingStatusDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Límite por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
