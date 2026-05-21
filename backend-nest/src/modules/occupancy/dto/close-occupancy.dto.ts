import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CloseOccupancyDto {
  @ApiProperty({ description: 'Fecha de fin de ocupación', format: 'date' })
  @IsDateString()
  endDate: string;
}