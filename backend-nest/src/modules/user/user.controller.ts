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
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FindAllUsersDto,
  UserResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RbacGuard('user', 'read'))
  @ApiOperation({ summary: 'Listar usuarios del tenant (paginado, filtrado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios',
    type: [UserResponseDto],
  })
  async findAll(
    @Query() filters: FindAllUsersDto,
    @TenantId() tenantId: string,
  ) {
    return this.userService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('user', 'read'))
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.userService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('user', 'create'))
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  @ApiResponse({ status: 403, description: 'Límite del plan excedido' })
  async create(
    @Body() createDto: CreateUserDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.userService.create(tenantId, createDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('user', 'update'))
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.userService.update(tenantId, id, updateDto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id/suspend')
  @UseGuards(RbacGuard('users', 'update'))
  @ApiOperation({ summary: 'Suspender un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario suspendido',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario ya está suspendido' })
  async suspend(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.userService.suspend(tenantId, id, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id/activate')
  @UseGuards(RbacGuard('users', 'update'))
  @ApiOperation({ summary: 'Activar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario activado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario ya está activo' })
  async activate(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.userService.activate(tenantId, id, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id/role')
  @UseGuards(RbacGuard('users', 'update'))
  @ApiOperation({ summary: 'Asignar rol a un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Rol asignado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario o rol no encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario ya tiene ese rol' })
  async assignRole(
    @Param('id') id: string,
    @Body('roleId') roleId: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.userService.assignRole(tenantId, id, roleId, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}