import { ApiProperty } from '@nestjs/swagger';

export class MetricsResponseDto {
  @ApiProperty({
    description: 'Total de tenants en la plataforma',
    example: 50,
  })
  totalTenants: number;

  @ApiProperty({
    description: 'Tenants activos',
    example: 45,
  })
  activeTenants: number;

  @ApiProperty({
    description: 'Total de usuarios en la plataforma',
    example: 500,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Total de propiedades',
    example: 120,
  })
  totalProperties: number;

  @ApiProperty({
    description: 'Total de unidades',
    example: 1500,
  })
  totalUnits: number;

  @ApiProperty({
    description: 'Unidades ocupadas',
    example: 1200,
  })
  occupiedUnits: number;

  @ApiProperty({
    description: 'Unidades disponibles',
    example: 250,
  })
  availableUnits: number;

  @ApiProperty({
    description: 'Unidades en mantenimiento',
    example: 50,
  })
  maintenanceUnits: number;
}
