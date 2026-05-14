import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TowerResponseDto {
  @ApiProperty({ description: 'ID único de la torre' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID de la propiedad' })
  propertyId: string;

  @ApiProperty({ description: 'Nombre de la torre' })
  name: string;

  @ApiProperty({ description: 'Número de pisos de la torre' })
  floorsCount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación lógica' })
  deletedAt: Date | null;
}