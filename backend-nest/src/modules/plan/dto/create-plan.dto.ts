import { IsString, IsOptional, IsInt, Min, IsArray, MaxLength, ValidateNested, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlanLimitsDto {
  @ApiProperty({ description: 'Límite de propiedades (-1 = ilimitado)', example: 1 })
  @IsInt()
  @Min(-1)
  properties: number;

  @ApiProperty({ description: 'Límite de unidades (-1 = ilimitado)', example: 100 })
  @IsInt()
  @Min(-1)
  units: number;

  @ApiProperty({ description: 'Límite de usuarios (-1 = ilimitado)', example: 5 })
  @IsInt()
  @Min(-1)
  users: number;
}

export class PlanPricesDto {
  @ApiProperty({ description: 'Precio mensual en centavos (0 = gratuito)', example: 0 })
  @IsInt()
  @Min(0)
  monthly: number;

  @ApiProperty({ description: 'Precio anual en centavos (0 = gratuito)', example: 0 })
  @IsInt()
  @Min(0)
  yearly: number;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'Nombre del plan', example: 'Básico', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Slug único del plan', example: 'basic', maxLength: 30 })
  @IsString()
  @MaxLength(30)
  slug: string;

  @ApiPropertyOptional({ description: 'Descripción del plan', example: 'Para conjuntos pequeños', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ description: 'Límites del plan', type: PlanLimitsDto })
  @ValidateNested()
  @Type(() => PlanLimitsDto)
  limits: PlanLimitsDto;

  @ApiProperty({ description: 'Precios del plan', type: PlanPricesDto })
  @ValidateNested()
  @Type(() => PlanPricesDto)
  prices: PlanPricesDto;

  @ApiPropertyOptional({ description: 'Características del plan', example: ['Sitio web público', 'RBAC completo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Plan activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
