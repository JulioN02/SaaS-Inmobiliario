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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { ResidentService } from './resident.service';
import {
  CreateResidentDto,
  UpdateResidentDto,
  FindAllResidentsDto,
  ResidentResponseDto,
} from './dto';

@ApiTags('Residentes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('residents')
export class ResidentController {
  constructor(private readonly residentService: ResidentService) {}

  @Get()
  @UseGuards(RbacGuard('resident', 'read'))
  @ApiOperation({ summary: 'Obtener lista de residentes' })
  @ApiResponse({ status: 200, description: 'Lista de residentes paginada' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: FindAllResidentsDto,
  ) {
    return this.residentService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('resident', 'read'))
  @ApiOperation({ summary: 'Obtener un residente por ID' })
  @ApiResponse({ status: 200, description: 'Residente encontrado', type: ResidentResponseDto })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.residentService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('resident', 'create'))
  @ApiOperation({ summary: 'Crear un nuevo residente' })
  @ApiResponse({ status: 201, description: 'Residente creado', type: ResidentResponseDto })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 409, description: 'Documento duplicado' })
  async create(
    @TenantId() tenantId: string,
    @User() user: { userId: string; ipAddress?: string },
    @Body() dto: CreateResidentDto,
  ) {
    return this.residentService.create(tenantId, dto, {
      userId: user.userId,
      tenantId,
      ipAddress: user.ipAddress,
    });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('resident', 'update'))
  @ApiOperation({ summary: 'Actualizar un residente' })
  @ApiResponse({ status: 200, description: 'Residente actualizado', type: ResidentResponseDto })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  @ApiResponse({ status: 409, description: 'Documento duplicado' })
  async update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: { userId: string; ipAddress?: string },
    @Body() dto: UpdateResidentDto,
  ) {
    return this.residentService.update(tenantId, id, dto, {
      userId: user.userId,
      tenantId,
      ipAddress: user.ipAddress,
    });
  }

  @Delete(':id')
  @UseGuards(RbacGuard('resident', 'delete'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un residente (soft delete)' })
  @ApiResponse({ status: 204, description: 'Residente eliminado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar: tiene ocupaciones activas' })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: { userId: string; ipAddress?: string },
  ) {
    await this.residentService.softDelete(tenantId, id, {
      userId: user.userId,
      tenantId,
      ipAddress: user.ipAddress,
    });
  }
}