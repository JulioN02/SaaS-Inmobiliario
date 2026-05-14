import {
  Controller,
  Get,
  Post,
  Patch,
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
import { FeeService } from './fee.service';
import {
  CreateFeeDto,
  UpdateFeeDto,
  UpdateFeeStatusDto,
  FindAllFeesDto,
  FeeResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Fees')
@ApiBearerAuth()
@Controller('fees')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Post()
  @UseGuards(RbacGuard('fee', 'create'))
  @ApiOperation({ summary: 'Crear una nueva cuota' })
  @ApiResponse({
    status: 201,
    description: 'Cuota creada',
    type: FeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  @ApiResponse({ status: 400, description: 'Cuota ya existe para este periodo' })
  async create(
    @Body() createDto: CreateFeeDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.feeService.create(tenantId, createDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Get()
  @UseGuards(RbacGuard('fee', 'read'))
  @ApiOperation({ summary: 'Listar cuotas del tenant (paginado, filtrado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cuotas',
    type: [FeeResponseDto],
  })
  async findAll(
    @Query() filters: FindAllFeesDto,
    @TenantId() tenantId: string,
  ) {
    return this.feeService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('fee', 'read'))
  @ApiOperation({ summary: 'Obtener una cuota por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cuota' })
  @ApiResponse({
    status: 200,
    description: 'Cuota encontrada',
    type: FeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.feeService.findById(tenantId, id);
  }

  @Patch(':id')
  @UseGuards(RbacGuard('fee', 'update'))
  @ApiOperation({ summary: 'Actualizar una cuota' })
  @ApiParam({ name: 'id', description: 'ID de la cuota' })
  @ApiResponse({
    status: 200,
    description: 'Cuota actualizada',
    type: FeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  @ApiResponse({ status: 400, description: 'Cuota pagada o cancelada no editable' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeeDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.feeService.update(tenantId, id, updateDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id/status')
  @UseGuards(RbacGuard('fee', 'update'))
  @ApiOperation({ summary: 'Cambiar estado de una cuota' })
  @ApiParam({ name: 'id', description: 'ID de la cuota' })
  @ApiResponse({
    status: 200,
    description: 'Estado de cuota actualizado',
    type: FeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  @ApiResponse({ status: 400, description: 'Transición de estado no válida' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeeStatusDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.feeService.updateStatus(tenantId, id, updateDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Get('summary')
  @UseGuards(RbacGuard('fee', 'read'))
  @ApiOperation({ summary: 'Obtener resumen de cuotas (tasa de cobranza)' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de cuotas del tenant',
  })
  async getSummary(
    @TenantId() tenantId: string,
  ) {
    return this.feeService.getSummary(tenantId);
  }

  @Get('pending')
  @UseGuards(RbacGuard('fee', 'read'))
  @ApiOperation({ summary: 'Obtener cuotas pendientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cuotas pendientes',
    type: [FeeResponseDto],
  })
  async getPending(
    @Query('limit') limit: number,
    @TenantId() tenantId: string,
  ) {
    return this.feeService.getPending(tenantId, limit);
  }
}