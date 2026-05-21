import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'ID de la unidad' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Título de la solicitud de mantenimiento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Descripción detallada' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}