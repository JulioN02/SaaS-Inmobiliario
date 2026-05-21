import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutVisitorDto {
  @ApiProperty({ description: 'Fecha y hora de salida' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  exitDate: Date;
}