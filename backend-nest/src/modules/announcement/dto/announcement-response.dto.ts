import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementPriority } from '@prisma/client';

export class AnnouncementResponseDto {
  @ApiProperty({
    description: 'ID único del anuncio',
    example: 'uuid-announcement',
  })
  id: string;

  @ApiProperty({
    description: 'ID del tenant',
    example: 'uuid-tenant',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Título del anuncio',
    example: 'Mantenimiento programado',
  })
  title: string;

  @ApiProperty({
    description: 'Contenido del anuncio',
    example: 'Se realizará mantenimiento el día sábado...',
  })
  content: string;

  @ApiProperty({
    description: 'Prioridad del anuncio',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.NORMAL,
  })
  priority: AnnouncementPriority;

  @ApiPropertyOptional({
    description: 'Roles que pueden ver el anuncio',
    example: ['ADMINISTRATIVA'],
    type: [String],
  })
  targetRoles?: string[];

  @ApiPropertyOptional({
    description: 'UUIDs de unidades específicas',
    example: ['uuid-unit-1'],
    type: [String],
  })
  targetUnits?: string[];

  @ApiPropertyOptional({
    description: 'Fecha de inicio de visualización',
    example: '2026-05-10T00:00:00Z',
  })
  startsAt?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de fin de visualización',
    example: '2026-05-15T23:59:59Z',
  })
  endsAt?: Date;

  @ApiProperty({
    description: 'Estado activo del anuncio',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'ID del usuario que creó el anuncio',
    example: 'uuid-user',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Usuario que creó el anuncio',
    example: { firstName: 'Juan', lastName: 'Pérez' },
  })
  createdByUser: {
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-05-05T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-05-05T10:00:00Z',
  })
  updatedAt: Date;
}
