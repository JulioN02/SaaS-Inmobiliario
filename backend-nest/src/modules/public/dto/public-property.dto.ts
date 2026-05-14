import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicPropertyDto {
  @ApiProperty({ description: 'ID de la propiedad' })
  id: string;

  @ApiProperty({ description: 'Nombre de la propiedad' })
  name: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  address?: string;

  @ApiProperty({ description: 'Tipo de propiedad' })
  propertyType: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  description?: string;

  @ApiPropertyOptional({ description: 'URL de imagen' })
  imageUrl?: string;

  @ApiProperty({ description: 'Cantidad de unidades' })
  unitCount: number;
}
