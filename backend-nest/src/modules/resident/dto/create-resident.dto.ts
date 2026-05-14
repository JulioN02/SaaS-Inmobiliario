import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail, MaxLength } from 'class-validator';
import { DocumentType } from '../../../shared/types/enums';

export class CreateResidentDto {
  @ApiProperty({ description: 'Nombre del residente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Apellido del residente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ enum: DocumentType, description: 'Tipo de documento' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Número de documento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber: string;

  @ApiPropertyOptional({ description: 'Email del residente' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Contacto de emergencia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContact?: string;
}