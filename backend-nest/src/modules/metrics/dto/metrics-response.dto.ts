import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FeeMetricsDto {
  @ApiProperty({ description: 'Cuotas pendientes', example: 45 })
  pending: number;

  @ApiProperty({ description: 'Cuotas pagadas', example: 120 })
  paid: number;

  @ApiProperty({ description: 'Cuotas parciales', example: 8 })
  partial: number;

  @ApiProperty({ description: 'Cuotas vencidas (pasan fecha de vencimiento)', example: 12 })
  overdue: number;

  @ApiProperty({ description: 'Total recaudado del periodo', example: 48500000 })
  totalCollected: number;

  @ApiProperty({ description: 'Tasa de recaudo (pagadas / total)', example: 69.4 })
  collectionRate: number;
}

class VisitorMetricsDto {
  @ApiProperty({ description: 'Visitantes hoy', example: 15 })
  today: number;

  @ApiProperty({ description: 'Visitantes activos (sin salida)', example: 3 })
  active: number;

  @ApiProperty({ description: 'Visitantes esta semana', example: 87 })
  thisWeek: number;
}

class MaintenanceMetricsDto {
  @ApiProperty({ description: 'Mantenimientos pendientes', example: 5 })
  pending: number;

  @ApiProperty({ description: 'Mantenimientos en progreso', example: 3 })
  inProgress: number;

  @ApiProperty({ description: 'Mantenimientos resueltos', example: 42 })
  resolved: number;

  @ApiProperty({ description: 'Mantenimientos cancelados', example: 2 })
  cancelled: number;
}

export class MetricsResponseDto {
  @ApiProperty({ description: 'Total de tenants en la plataforma', example: 50 })
  totalTenants: number;

  @ApiProperty({ description: 'Tenants activos', example: 45 })
  activeTenants: number;

  @ApiProperty({ description: 'Tenants suspendidos', example: 5 })
  suspendedTenants: number;

  @ApiProperty({ description: 'Total de usuarios', example: 500 })
  totalUsers: number;

  @ApiProperty({ description: 'Total de propiedades', example: 120 })
  totalProperties: number;

  @ApiProperty({ description: 'Total de unidades', example: 1500 })
  totalUnits: number;

  @ApiProperty({ description: 'Unidades ocupadas', example: 1200 })
  occupiedUnits: number;

  @ApiProperty({ description: 'Unidades disponibles', example: 250 })
  availableUnits: number;

  @ApiProperty({ description: 'Unidades en mantenimiento', example: 50 })
  maintenanceUnits: number;

  @ApiProperty({ description: 'Tasa de ocupación en %', example: 80.0 })
  occupancyRate: number;

  @ApiPropertyOptional({ description: 'Total de residentes', example: 1800 })
  totalResidents?: number;

  @ApiPropertyOptional({ description: 'Métricas de cuotas', type: FeeMetricsDto })
  fees?: FeeMetricsDto;

  @ApiPropertyOptional({ description: 'Métricas de visitantes', type: VisitorMetricsDto })
  visitors?: VisitorMetricsDto;

  @ApiPropertyOptional({ description: 'Métricas de mantenimiento', type: MaintenanceMetricsDto })
  maintenance?: MaintenanceMetricsDto;
}
