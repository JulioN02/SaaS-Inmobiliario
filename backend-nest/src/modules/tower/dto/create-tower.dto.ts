import { IsString, IsInt, IsUUID, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTowerDto {
  @ApiProperty({
    description: 'Nombre de la torre',
    example: 'Torre A',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Número de pisos de la torre',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  floorsCount: number;

  @ApiProperty({
    description: 'ID de la propiedad a la que pertenece la torre',
    example: 'uuid-property',
  })
  @IsUUID()
  propertyId: string;
}