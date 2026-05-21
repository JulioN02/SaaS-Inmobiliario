import { IsString, IsOptional, IsEmail, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan, TenantStatus } from '@prisma/client';

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

  @ApiPropertyOptional({
    description: 'Plan del tenant',
    enum: TenantPlan,
    default: TenantPlan.BASIC,
  })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional({
    description: 'Estado del tenant',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
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
