import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementPriority } from '@prisma/client';

export class FindAllAnnouncementsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por prioridad',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({
    description: 'Filtrar por rol del usuario (para ver anuncios dirigidos a ese rol)',
    example: 'ADMINISTRATIVA',
  })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({
    description: 'Número de página (default: 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página (default: 20, max: 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
