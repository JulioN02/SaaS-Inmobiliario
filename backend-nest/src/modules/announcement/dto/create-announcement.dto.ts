import { IsString, IsEnum, IsOptional, IsArray, IsDateString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementPriority } from '@prisma/client';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Título del anuncio',
    example: 'Mantenimiento programado',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Contenido del anuncio',
    example: 'Se realizará mantenimiento el día sábado...',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Prioridad del anuncio',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.NORMAL,
    default: AnnouncementPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({
    description: 'Roles que pueden ver el anuncio. Si está vacío, lo ven todos.',
    example: ['ADMINISTRATIVA', 'PORTERIA'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['SUPER_ADMIN', 'ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'], { each: true })
  targetRoles?: string[];

  @ApiPropertyOptional({
    description: 'UUIDs de unidades específicas. Si está vacío, aplica a todas.',
    example: ['uuid-unit-1', 'uuid-unit-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUnits?: string[];

  @ApiPropertyOptional({
    description: 'Fecha de inicio de visualización. Si no se especifica, se muestra inmediatamente.',
    example: '2026-05-10T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startsAt?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de fin de visualización. Si no se especifica, no expira.',
    example: '2026-05-15T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: Date;
}
