import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { OccupancyType } from '../../../shared/types/enums';

export class CreateOccupancyDto {
  @ApiProperty({ description: 'ID de la unidad', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'ID del residente', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ enum: OccupancyType, description: 'Tipo de ocupación' })
  @IsEnum(OccupancyType)
  type: OccupancyType;

  @ApiProperty({ description: 'Fecha de inicio', format: 'date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}