import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TowerService } from './tower.service';
import {
  CreateTowerDto,
  UpdateTowerDto,
  FindAllTowersDto,
  TowerResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Towers')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard)
export class TowerController {
  constructor(private readonly towerService: TowerService) {}

  @Get('properties/:propertyId/towers')
  @UseGuards(RbacGuard('tower', 'read'))
  @ApiOperation({ summary: 'Listar torres de una propiedad (paginado)' })
  @ApiParam({ name: 'propertyId', description: 'ID de la propiedad' })
  @ApiResponse({
    status: 200,
    description: 'Lista de torres',
    type: [TowerResponseDto],
  })
  async findAll(
    @Param('propertyId') propertyId: string,
    @Query() filters: FindAllTowersDto,
    @TenantId() tenantId: string,
  ) {
    // propertyId from path overrides query param
    filters.propertyId = propertyId;
    return this.towerService.findAll(tenantId, filters);
  }

  @Post('properties/:propertyId/towers')
  @UseGuards(RbacGuard('tower', 'create'))
  @ApiOperation({ summary: 'Crear una nueva torre en una propiedad' })
  @ApiParam({ name: 'propertyId', description: 'ID de la propiedad' })
  @ApiResponse({
    status: 201,
    description: 'Torre creada',
    type: TowerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  async create(
    @Param('propertyId') propertyId: string,
    @Body() createDto: CreateTowerDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    // propertyId from path overrides DTO propertyId
    createDto.propertyId = propertyId;
    return this.towerService.create(tenantId, createDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch('towers/:id')
  @UseGuards(RbacGuard('tower', 'update'))
  @ApiOperation({ summary: 'Actualizar una torre' })
  @ApiParam({ name: 'id', description: 'ID de la torre' })
  @ApiResponse({
    status: 200,
    description: 'Torre actualizada',
    type: TowerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Torre no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTowerDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.towerService.update(tenantId, id, updateDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Delete('towers/:id')
  @UseGuards(RbacGuard('tower', 'delete'))
  @ApiOperation({ summary: 'Eliminar una torre (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la torre' })
  @ApiResponse({
    status: 200,
    description: 'Torre eliminada',
    type: TowerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Torre no encontrada' })
  async softDelete(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.towerService.softDelete(tenantId, id, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}