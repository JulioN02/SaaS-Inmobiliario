import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { RoleResponseDto, RemoveUsersDto } from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(RbacGuard('role', 'read'))
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
  @UseGuards(RbacGuard('role', 'read'))
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
  @UseGuards(RbacGuard('role', 'update'))
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

  @Patch(':id/users/remove')
  @UseGuards(RbacGuard('role', 'update'))
  @ApiOperation({ summary: 'Remover usuarios de un rol (reasignación masiva)' })
  @ApiParam({ name: 'id', description: 'ID del rol origen' })
  @ApiResponse({
    status: 200,
    description: 'Usuarios removidos del rol',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async removeUsers(
    @Param('id') id: string,
    @Body() dto: RemoveUsersDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.roleService.removeUsers(id, dto.userIds, dto.targetRoleId, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}