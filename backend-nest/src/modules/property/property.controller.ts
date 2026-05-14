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
import { PropertyService } from './property.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  FindAllPropertiesDto,
  PropertyResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Properties')
@ApiBearerAuth()
@Controller('properties')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  @UseGuards(RbacGuard('property', 'read'))
  @ApiOperation({ summary: 'Listar propiedades del tenant (paginado, filtrado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de propiedades',
    type: [PropertyResponseDto],
  })
  async findAll(
    @Query() filters: FindAllPropertiesDto,
    @TenantId() tenantId: string,
  ) {
    return this.propertyService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('property', 'read'))
  @ApiOperation({ summary: 'Obtener una propiedad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la propiedad' })
  @ApiResponse({
    status: 200,
    description: 'Propiedad encontrada',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.propertyService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('property', 'create'))
  @ApiOperation({ summary: 'Crear una nueva propiedad' })
  @ApiResponse({
    status: 201,
    description: 'Propiedad creada',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Límite del plan excedido' })
  async create(
    @Body() createDto: CreatePropertyDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.propertyService.create(tenantId, createDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('property', 'update'))
  @ApiOperation({ summary: 'Actualizar una propiedad' })
  @ApiParam({ name: 'id', description: 'ID de la propiedad' })
  @ApiResponse({
    status: 200,
    description: 'Propiedad actualizada',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePropertyDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.propertyService.update(tenantId, id, updateDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Delete(':id')
  @UseGuards(RbacGuard('property', 'delete'))
  @ApiOperation({ summary: 'Eliminar una propiedad (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la propiedad' })
  @ApiResponse({
    status: 200,
    description: 'Propiedad eliminada',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  @ApiResponse({ status: 400, description: 'Propiedad tiene unidades activas' })
  async softDelete(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.propertyService.softDelete(tenantId, id, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}