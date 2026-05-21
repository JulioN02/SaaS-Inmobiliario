import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({
    description: 'Estado de la solicitud',
    enum: MaintenanceStatus,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: 'ID del usuario asignado' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}