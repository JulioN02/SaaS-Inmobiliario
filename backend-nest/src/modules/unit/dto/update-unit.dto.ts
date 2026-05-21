import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UnitStatus } from '@prisma/client';
import { CreateUnitDto } from './create-unit.dto';

export class UpdateUnitDto extends PartialType(CreateUnitDto) {
  @ApiPropertyOptional({
    description: 'Estado de la unidad',
    enum: UnitStatus,
  })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}