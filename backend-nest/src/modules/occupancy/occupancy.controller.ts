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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  MethodNotAllowedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { OccupancyService } from './occupancy.service';
import {
  CreateOccupancyDto,
  CloseOccupancyDto,
  FindAllOccupanciesDto,
  OccupancyResponseDto,
} from './dto';

@ApiTags('Ocupaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('occupancies')
export class OccupancyController {
  constructor(private readonly occupancyService: OccupancyService) {}

  @Get()
  @UseGuards(RbacGuard('occupancy', 'read'))
  @ApiOperation({ summary: 'Obtener lista de ocupaciones' })
  @ApiResponse({ status: 200, description: 'Lista de ocupaciones paginada' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: FindAllOccupanciesDto,
  ) {
    return this.occupancyService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('occupancy', 'read'))
  @ApiOperation({ summary: 'Obtener una ocupación por ID' })
  @ApiResponse({ status: 200, description: 'Ocupación encontrada', type: OccupancyResponseDto })
  @ApiResponse({ status: 404, description: 'Ocupación no encontrada' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.occupancyService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('occupancy', 'create'))
  @ApiOperation({ summary: 'Crear una nueva ocupación (asignar residente a unidad)' })
  @ApiResponse({ status: 201, description: 'Ocupación creada', type: OccupancyResponseDto })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 404, description: 'Unidad o residente no encontrado' })
  @ApiResponse({ status: 409, description: 'El residente ya tiene ocupación activa en esta unidad' })
  async create(
    @TenantId() tenantId: string,
    @User() user: { id: string; ipAddress?: string },
    @Body() dto: CreateOccupancyDto,
  ) {
    return this.occupancyService.create(tenantId, dto, {
      userId: user.id,
      tenantId,
      ipAddress: user.ipAddress,
    });
  }

  @Patch(':id/close')
  @UseGuards(RbacGuard('occupancy', 'update'))
  @ApiOperation({ summary: 'Cerrar una ocupación (fecha fin)' })
  @ApiResponse({ status: 200, description: 'Ocupación cerrada', type: OccupancyResponseDto })
  @ApiResponse({ status: 400, description: 'La ocupación ya está cerrada' })
  @ApiResponse({ status: 404, description: 'Ocupación no encontrada' })
  async close(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: { id: string; ipAddress?: string },
    @Body() dto: CloseOccupancyDto,
  ) {
    return this.occupancyService.close(tenantId, id, dto, {
      userId: user.id,
      tenantId,
      ipAddress: user.ipAddress,
    });
  }

  // NO DELETE - occupancy is immutable history
  @Delete(':id')
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  @ApiOperation({ summary: 'No disponible - Las ocupaciones son historial inmutable' })
  @ApiResponse({ status: 405, description: 'Las ocupaciones no se pueden eliminar' })
  async remove() {
    throw new MethodNotAllowedException('Las ocupaciones son historial inmutable y no se pueden eliminar');
  }
}