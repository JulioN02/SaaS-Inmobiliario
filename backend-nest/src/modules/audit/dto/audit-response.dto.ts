import { ApiProperty } from '@nestjs/swagger';
import { AuditEntity, AuditAction } from '@prisma/client';

export class AuditResponseDto {
  @ApiProperty({
    description: 'ID del log de auditoría',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 'clx0987654321',
  })
  tenantId: string;

  @ApiProperty({
    description: 'ID del usuario que realizó la acción',
    example: 'clx1122334455',
  })
  userId: string;

  @ApiProperty({
    description: 'Información del usuario',
    example: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@ejemplo.com',
    },
  })
  userInfo: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };

  @ApiProperty({
    description: 'Entidad afectada',
    enum: AuditEntity,
    example: AuditEntity.user,
  })
  entity: AuditEntity;

  @ApiProperty({
    description: 'ID de la entidad afectada',
    example: 'clx5566778899',
  })
  entityId: string;

  @ApiProperty({
    description: 'Acción realizada',
    enum: AuditAction,
    example: AuditAction.CREATE,
  })
  action: AuditAction;

  @ApiProperty({
    description: 'Snapshot del cambio (datos antes/después)',
    example: {
      email: 'juan.perez@ejemplo.com',
      role: 'ADMIN_TENANT',
      firstName: 'Juan',
      lastName: 'Pérez',
    },
  })
  snapshot: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Dirección IP desde donde se realizó la acción',
    example: '192.168.1.100',
    required: false,
  })
  ipAddress?: string | null;

  @ApiProperty({
    description: 'Fecha y hora del log',
    example: '2026-05-05T22:30:00.000Z',
  })
  createdAt: Date;
}
