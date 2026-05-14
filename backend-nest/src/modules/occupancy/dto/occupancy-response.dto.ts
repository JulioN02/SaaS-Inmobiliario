import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OccupancyType } from '../../../shared/types/enums';

export class OccupancyResponseDto {
  @ApiProperty({ description: 'ID de la ocupación' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID de la unidad' })
  unitId: string;

  @ApiProperty({ description: 'ID del residente' })
  residentId: string;

  @ApiProperty({ enum: OccupancyType, description: 'Tipo de ocupación' })
  type: OccupancyType;

  @ApiProperty({ description: 'Fecha de inicio' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin' })
  endDate: Date | null;

  @ApiPropertyOptional({ description: 'Notas' })
  notes: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  // Included relations for response
  @ApiPropertyOptional({ description: 'Información de la unidad' })
  unit?: {
    id: string;
    identifier: string;
    status: string;
  };

  @ApiPropertyOptional({ description: 'Información del residente' })
  resident?: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
}