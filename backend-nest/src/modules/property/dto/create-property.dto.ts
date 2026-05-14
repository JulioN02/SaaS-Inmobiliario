import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Nombre de la propiedad',
    example: 'Conjunto Residencial Las Palmas',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Dirección de la propiedad',
    example: 'Calle 123 #45-67, Ciudad',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: 'Tipo de propiedad',
    enum: PropertyType,
    example: PropertyType.CONJUNTO,
  })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiPropertyOptional({
    description: 'Descripción de la propiedad',
    example: 'Conjunto residencial con áreas comunes',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}