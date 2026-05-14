import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { RoleResponseDto } from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(RbacGuard('roles', 'read'))
  @ApiOperation({ summary: 'Listar todos los roles con permisos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles',
    type: [RoleResponseDto],
  })
  async findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @UseGuards(RbacGuard('roles', 'read'))
  @ApiOperation({ summary: 'Obtener un rol por ID con permisos' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findById(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Put(':id/permissions')
  @UseGuards(RbacGuard('roles', 'update'))
  @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: 200,
    description: 'Permisos actualizados',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async updatePermissions(
    @Param('id') id: string,
    @Body('permissionIds') permissionIds: string[],
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.roleService.updatePermissions(id, permissionIds, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}