import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VisitorResponseDto {
  @ApiProperty({ description: 'ID del visitante' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID de la unidad' })
  unitId: string;

  @ApiProperty({ description: 'Nombre del visitante' })
  visitorName: string;

  @ApiPropertyOptional({ description: 'Número de documento' })
  documentNumber: string | null;

  @ApiProperty({ description: 'Fecha de entrada' })
  entryDate: Date;

  @ApiPropertyOptional({ description: 'Fecha de salida' })
  exitDate: Date | null;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  notes: string | null;

  @ApiProperty({ description: 'ID del usuario que registró la visita' })
  registeredBy: string;

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