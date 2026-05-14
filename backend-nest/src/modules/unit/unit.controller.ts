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
import { UnitService } from './unit.service';
import {
  CreateUnitDto,
  UpdateUnitDto,
  FindAllUnitsDto,
  UnitResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Units')
@ApiBearerAuth()
@Controller('units')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  @UseGuards(RbacGuard('unit', 'read'))
  @ApiOperation({ summary: 'Listar unidades del tenant (paginado, filtrado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades',
    type: [UnitResponseDto],
  })
  async findAll(
    @Query() filters: FindAllUnitsDto,
    @TenantId() tenantId: string,
  ) {
    return this.unitService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('unit', 'read'))
  @ApiOperation({ summary: 'Obtener una unidad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la unidad' })
  @ApiResponse({
    status: 200,
    description: 'Unidad encontrada',
    type: UnitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.unitService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('unit', 'create'))
  @ApiOperation({ summary: 'Crear una nueva unidad' })
  @ApiResponse({
    status: 201,
    description: 'Unidad creada',
    type: UnitResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Identificador duplicado en la propiedad' })
  async create(
    @Body() createDto: CreateUnitDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.unitService.create(tenantId, createDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('unit', 'update'))
  @ApiOperation({ summary: 'Actualizar una unidad' })
  @ApiParam({ name: 'id', description: 'ID de la unidad' })
  @ApiResponse({
    status: 200,
    description: 'Unidad actualizada',
    type: UnitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  @ApiResponse({ status: 409, description: 'Identificador duplicado en la propiedad' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUnitDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.unitService.update(tenantId, id, updateDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Delete(':id')
  @UseGuards(RbacGuard('unit', 'delete'))
  @ApiOperation({ summary: 'Eliminar una unidad (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la unidad' })
  @ApiResponse({
    status: 200,
    description: 'Unidad eliminada',
    type: UnitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  @ApiResponse({ status: 400, description: 'Unidad con ocupación activa' })
  async softDelete(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.unitService.softDelete(tenantId, id, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}