import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';

export class PropertyResponseDto {
  @ApiProperty({ description: 'ID único de la propiedad' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Nombre de la propiedad' })
  name: string;

  @ApiProperty({ description: 'Dirección de la propiedad' })
  address: string;

  @ApiProperty({ description: 'Tipo de propiedad', enum: PropertyType })
  propertyType: PropertyType;

  @ApiPropertyOptional({ description: 'Descripción de la propiedad' })
  description: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación lógica' })
  deletedAt: Date | null;
}