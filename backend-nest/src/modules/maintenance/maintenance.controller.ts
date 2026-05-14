import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  FindAllMaintenanceDto,
  MaintenanceResponseDto,
} from './dto';

@ApiTags('Mantenimiento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('api/v1/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @UseGuards(RbacGuard('maintenance', 'read'))
  @ApiOperation({ summary: 'Obtener lista de solicitudes de mantenimiento' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes de mantenimiento paginada' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: FindAllMaintenanceDto,
  ) {
    return this.maintenanceService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('maintenance', 'read'))
  @ApiOperation({ summary: 'Obtener una solicitud de mantenimiento por ID' })
  @ApiResponse({ status: 200, description: 'Solicitud encontrada', type: MaintenanceResponseDto })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.maintenanceService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('maintenance', 'create'))
  @ApiOperation({ summary: 'Crear una nueva solicitud de mantenimiento' })
  @ApiResponse({ status: 201, description: 'Solicitud creada', type: MaintenanceResponseDto })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  async create(
    @TenantId() tenantId: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress: string | undefined,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.maintenanceService.create(tenantId, dto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('maintenance', 'update'))
  @ApiOperation({ summary: 'Actualizar una solicitud de mantenimiento' })
  @ApiResponse({ status: 200, description: 'Solicitud actualizada', type: MaintenanceResponseDto })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  async update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress: string | undefined,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(tenantId, id, dto, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}