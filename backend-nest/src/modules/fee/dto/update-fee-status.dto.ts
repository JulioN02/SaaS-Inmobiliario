import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeStatus } from '@prisma/client';

export class UpdateFeeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la cuota',
    enum: FeeStatus,
    example: FeeStatus.PAID,
  })
  @IsEnum(FeeStatus)
  status: FeeStatus;

  @ApiPropertyOptional({
    description: 'Monto pagado (para pagos parciales)',
    example: 75000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidAmount?: number;
}