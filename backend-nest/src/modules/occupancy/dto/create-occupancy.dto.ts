import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OccupancyType } from '../../../shared/types/enums';

// ── Document item for occupancy ──────────────────────────────────────────────

class DocumentItem {
  @ApiProperty({ description: 'Nombre del documento' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tipo de documento (CONTRATO, LEGAL, IDENTIDAD, OTRO)' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'URL o referencia del documento' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Notas sobre el documento' })
  @IsOptional()
  @IsString()
  notes?: string;
}

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

  @ApiPropertyOptional({ description: 'Fecha de finalización (opcional)', format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Documentos adjuntos (opcional)', type: [DocumentItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentItem)
  documents?: DocumentItem[];

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}