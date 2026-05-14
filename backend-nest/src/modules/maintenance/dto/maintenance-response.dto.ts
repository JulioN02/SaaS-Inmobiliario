import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceStatus } from '@prisma/client';

export class MaintenanceResponseDto {
  @ApiProperty({ description: 'ID de la solicitud de mantenimiento' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID de la unidad' })
  unitId: string;

  @ApiProperty({ description: 'Título de la solicitud' })
  title: string;

  @ApiPropertyOptional({ description: 'Descripción detallada' })
  description: string | null;

  @ApiProperty({
    description: 'Estado de la solicitud',
    enum: MaintenanceStatus,
  })
  status: MaintenanceStatus;

  @ApiPropertyOptional({ description: 'Usuario asignado' })
  assignedTo: string | null;

  @ApiPropertyOptional({ description: 'Fecha de resolución' })
  resolvedAt: Date | null;

  @ApiProperty({ description: 'ID del usuario que creó la solicitud' })
  createdBy: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  // Unit info (included via include)
  @ApiPropertyOptional({ description: 'Número de unidad' })
  unitNumber?: string;

  @ApiPropertyOptional({ description: 'Nombre de la torre' })
  towerName?: string;
}