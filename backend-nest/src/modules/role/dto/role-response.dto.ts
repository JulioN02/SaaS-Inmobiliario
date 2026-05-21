import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class PermissionResponseDto {
  @ApiProperty({ description: 'ID único del permiso' })
  id: string;

  @ApiProperty({ description: 'Recurso al que aplica el permiso' })
  resource: string;

  @ApiProperty({ description: 'Acción permitida', enum: ['read', 'create', 'update', 'delete'] })
  action: string;
}

export class RoleResponseDto {
  @ApiProperty({ description: 'ID único del rol' })
  id: string;

  @ApiProperty({ description: 'Nombre único del rol', enum: UserRole })
  name: UserRole;

  @ApiProperty({ description: 'Descripción del rol', nullable: true })
  description: string | null;

  @ApiProperty({ type: [PermissionResponseDto], description: 'Permisos asignados al rol' })
  permissions: PermissionResponseDto[];

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;
}