import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../shared/types/enums';

export class ResidentResponseDto {
  @ApiProperty({ description: 'ID del residente' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Nombre del residente' })
  firstName: string;

  @ApiProperty({ description: 'Apellido del residente' })
  lastName: string;

  @ApiProperty({ enum: DocumentType, description: 'Tipo de documento' })
  documentType: DocumentType;

  @ApiProperty({ description: 'Número de documento' })
  documentNumber: string;

  @ApiPropertyOptional({ description: 'Email del residente' })
  email: string | null;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Contacto de emergencia' })
  emergencyContact: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación' })
  deletedAt: Date | null;
}