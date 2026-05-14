import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDate, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVisitorDto {
  @ApiProperty({ description: 'ID de la unidad' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Nombre del visitante' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  visitorName: string;

  @ApiPropertyOptional({ description: 'Número de documento' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Fecha de entrada', default: new Date() })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  entryDate?: Date;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}