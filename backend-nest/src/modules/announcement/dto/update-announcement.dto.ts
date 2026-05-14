import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsBoolean, MaxLength, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementPriority } from '@prisma/client';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({
    description: 'Título del anuncio',
    example: 'Mantenimiento reprogramado',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Contenido del anuncio',
    example: 'Se reprograma el mantenimiento para el domingo...',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Prioridad del anuncio',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({
    description: 'Roles que pueden ver el anuncio',
    example: ['ADMINISTRATIVA'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['SUPER_ADMIN', 'ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'], { each: true })
  targetRoles?: string[];

  @ApiPropertyOptional({
    description: 'UUIDs de unidades específicas',
    example: ['uuid-unit-1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUnits?: string[];

  @ApiPropertyOptional({
    description: 'Fecha de inicio de visualización',
    example: '2026-05-12T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startsAt?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de fin de visualización',
    example: '2026-05-20T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: Date;

  @ApiPropertyOptional({
    description: 'Estado activo del anuncio',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
