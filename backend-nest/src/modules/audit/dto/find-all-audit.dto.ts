import { IsOptional, IsString, IsEnum, IsDate, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEntity, AuditAction } from '@prisma/client';

export class FindAllAuditDto {
  @ApiPropertyOptional({
    description: 'Filtrar por entidad',
    enum: AuditEntity,
    example: AuditEntity.user,
  })
  @IsOptional()
  @IsEnum(AuditEntity)
  entity?: AuditEntity;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de entidad',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por acción',
    enum: AuditAction,
    example: AuditAction.CREATE,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Fecha de inicio (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de fin (ISO 8601)',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Resultados por página',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
