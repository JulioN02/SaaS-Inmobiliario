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
import { TenantService } from './tenant.service';
import {
  CreateTenantDto,
  CreateTenantResponseDto,
  UpdateTenantDto,
  FindAllTenantsDto,
  TenantResponseDto,
  PaginatedTenantsResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { TenantPlan } from '@prisma/client';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @UseGuards(RbacGuard('tenant', 'read'))
  @ApiOperation({ summary: 'Listar todos los tenants (SuperAdmin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tenants',
    type: PaginatedTenantsResponseDto,
  })
  async findAll(@Query() filters: FindAllTenantsDto) {
    return this.tenantService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('tenant', 'read'))
  @ApiOperation({ summary: 'Obtener un tenant por ID' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async findById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Post()
  @UseGuards(RbacGuard('tenant', 'create'))
  @ApiOperation({ summary: 'Crear un nuevo tenant (SuperAdmin)' })
  @ApiResponse({
    status: 201,
    description: 'Tenant creado con AdminTenant y WebsiteConfig automáticos',
    type: CreateTenantResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Subdominio ya existe' })
  async create(
    @Body() createDto: CreateTenantDto,
    @User('id') userId: string,
  ) {
    return this.tenantService.create(createDto, { userId });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('tenant', 'update'))
  @ApiOperation({ summary: 'Actualizar un tenant' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant actualizado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 409, description: 'Subdominio ya existe' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTenantDto,
    @User('id') userId: string,
  ) {
    return this.tenantService.update(id, updateDto, { userId });
  }

  @Patch(':id/suspend')
  @UseGuards(RbacGuard('tenant', 'update'))
  @ApiOperation({ summary: 'Suspender un tenant' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant suspendido',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 409, description: 'Tenant ya está suspendido' })
  async suspend(
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.tenantService.suspend(id, { userId });
  }

  @Patch(':id/activate')
  @UseGuards(RbacGuard('tenant', 'update'))
  @ApiOperation({ summary: 'Activar un tenant' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant activado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 409, description: 'Tenant ya está activo' })
  async activate(
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.tenantService.activate(id, { userId });
  }

  @Patch(':id/plan')
  @UseGuards(RbacGuard('tenant', 'update'))
  @ApiOperation({ summary: 'Cambiar el plan de un tenant' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Plan actualizado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 403, description: 'Límites del plan excedidos' })
  async changePlan(
    @Param('id') id: string,
    @Body('plan') plan: TenantPlan,
    @User('id') userId: string,
  ) {
    return this.tenantService.changePlan(id, plan, { userId });
  }

  @Delete(':id')
  @UseGuards(RbacGuard('tenant', 'delete'))
  @ApiOperation({ summary: 'Eliminar un tenant (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant eliminado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async remove(
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.tenantService.remove(id, { userId });
  }
}
