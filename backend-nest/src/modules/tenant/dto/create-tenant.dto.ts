import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Nombre del tenant',
    example: 'Conjunto Residencial Las Palmas',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Subdominio único para el tenant',
    example: 'laspalmas',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  subdomain: string;

  @ApiProperty({
    description: 'ID del plan asignado',
    example: 'uuid-del-plan',
  })
  @IsString()
  planId: string;

  @ApiPropertyOptional({
    description: 'Estado del tenant',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  @IsOptional()
  @IsString()
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'admin@laspalmas.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+57 300 123 4567',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}
