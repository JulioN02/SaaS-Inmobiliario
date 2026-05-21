import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre único del rol',
    enum: UserRole,
    example: UserRole.ADMIN_TENANT,
  })
  @IsEnum(UserRole)
  name: UserRole;

  @ApiPropertyOptional({
    description: 'Descripción del rol',
    example: 'Administrador del tenant con acceso completo',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}