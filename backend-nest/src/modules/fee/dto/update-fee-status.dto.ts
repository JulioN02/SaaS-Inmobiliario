import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeeStatus } from '@prisma/client';

export class UpdateFeeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la cuota',
    enum: FeeStatus,
    example: FeeStatus.PAID,
  })
  @IsEnum(FeeStatus)
  status: FeeStatus;
}