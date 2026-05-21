import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'ID único del usuario' })
  id: string;

  @ApiProperty({ description: 'ID del tenant' })
  tenantId: string;

  @ApiProperty({ description: 'ID del rol asignado' })
  roleId: string;

  @ApiProperty({ description: 'Email del usuario' })
  email: string;

  @ApiProperty({ description: 'Rol del usuario', enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional({ description: 'Nombre del usuario' })
  firstName: string | null;

  @ApiPropertyOptional({ description: 'Apellido del usuario' })
  lastName: string | null;

  @ApiProperty({ description: 'Estado activo del usuario' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación lógica' })
  deletedAt: Date | null;
}