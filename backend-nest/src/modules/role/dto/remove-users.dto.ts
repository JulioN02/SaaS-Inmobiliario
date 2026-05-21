import { IsArray, IsString, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveUsersDto {
  @ApiProperty({
    description: 'IDs de los usuarios a remover del rol',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({
    description: 'ID del rol destino al que se reasignarán los usuarios',
    example: 'uuid-role-destino',
  })
  @IsString()
  @IsUUID('4')
  targetRoleId: string;
}
