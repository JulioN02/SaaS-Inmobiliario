import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeStatus, FeeType } from '@prisma/client';

export class FeeResponseDto {
  @ApiProperty({
    description: 'ID único de la cuota',
    example: 'uuid-fee',
  })
  id: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 'uuid-tenant',
  })
  tenantId: string;

  @ApiProperty({
    description: 'ID de la unidad',
    example: 'uuid-unit',
  })
  unitId: string;

  @ApiProperty({
    description: 'Monto de la cuota',
    example: 150000.00,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Descripción de la cuota',
    example: 'Cuota de administración mayo 2026',
  })
  description?: string;

  @ApiProperty({
    description: 'Periodo de la cuota (YYYY-MM)',
    example: '2026-05',
  })
  period: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento',
    example: '2026-05-31',
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Estado de la cuota',
    enum: FeeStatus,
    example: FeeStatus.PENDING,
  })
  status: FeeStatus;

  @ApiPropertyOptional({
    description: 'Monto pagado',
    example: 75000.00,
  })
  paidAmount?: number;

  @ApiPropertyOptional({
    description: 'Fecha de pago',
    example: '2026-05-15T00:00:00Z',
  })
  paidAt?: Date;

  @ApiProperty({
    description: 'Tipo de cuota',
    enum: FeeType,
    example: FeeType.PERIODIC,
  })
  type: FeeType;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-05-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-05-01T10:00:00Z',
  })
  updatedAt: Date;

  // Unit info
  @ApiProperty({
    description: 'Número de unidad',
    example: 'Apt-101',
  })
  unitIdentifier: string;

  @ApiPropertyOptional({
    description: 'Nombre de la torre',
    example: 'Torre A',
  })
  unitTowerName?: string;

  @ApiProperty({
    description: 'Nombre de la propiedad',
    example: 'Conjunto Residencial Example',
  })
  propertyName: string;

  @ApiPropertyOptional({
    description: 'Monto de cuota mensual de la unidad',
    example: 150000.00,
  })
  monthlyFeeAmount?: number;
}