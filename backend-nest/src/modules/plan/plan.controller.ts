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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  FindAllPlansDto,
  PlanResponseDto,
  PaginatedPlansResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Planes')
@ApiBearerAuth()
@Controller('plans')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @UseGuards(RbacGuard('plan', 'read'))
  @ApiOperation({ summary: 'Listar todos los planes (SuperAdmin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de planes',
    type: PaginatedPlansResponseDto,
  })
  async findAll(@Query() filters: FindAllPlansDto) {
    return this.planService.findAll(filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar planes activos (público autenticado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes activos',
    type: [PlanResponseDto],
  })
  async findActive() {
    return this.planService.findActive();
  }

  @Get(':id')
  @UseGuards(RbacGuard('plan', 'read'))
  @ApiOperation({ summary: 'Obtener un plan por ID (SuperAdmin)' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, description: 'Plan encontrado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async findById(@Param('id') id: string) {
    return this.planService.findById(id);
  }

  @Post()
  @UseGuards(RbacGuard('plan', 'create'))
  @ApiOperation({ summary: 'Crear un nuevo plan (SuperAdmin)' })
  @ApiResponse({ status: 201, description: 'Plan creado', type: PlanResponseDto })
  @ApiResponse({ status: 409, description: 'Slug ya existe' })
  async create(
    @Body() createDto: CreatePlanDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.planService.create(createDto, { userId, tenantId, ipAddress });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('plan', 'update'))
  @ApiOperation({ summary: 'Actualizar un plan (SuperAdmin)' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, description: 'Plan actualizado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  @ApiResponse({ status: 409, description: 'Slug ya existe' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePlanDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.planService.update(id, updateDto, { userId, tenantId, ipAddress });
  }

  @Delete(':id')
  @UseGuards(RbacGuard('plan', 'delete'))
  @ApiOperation({ summary: 'Eliminar un plan (soft delete, SuperAdmin)' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, description: 'Plan eliminado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  @ApiResponse({ status: 403, description: 'Plan tiene tenants activos' })
  async remove(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.planService.remove(id, { userId, tenantId, ipAddress });
  }

  @Patch(':id/toggle')
  @UseGuards(RbacGuard('plan', 'update'))
  @ApiOperation({ summary: 'Activar/desactivar un plan (SuperAdmin)' })
  @ApiParam({ name: 'id', description: 'ID del plan' })
  @ApiResponse({ status: 200, description: 'Estado del plan cambiado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  @ApiResponse({ status: 403, description: 'No se puede desactivar: tiene tenants activos' })
  async toggleActive(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.planService.toggleActive(id, { userId, tenantId, ipAddress });
  }
}
