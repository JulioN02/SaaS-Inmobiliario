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
import { AnnouncementService } from './announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  FindAllAnnouncementsDto,
  AnnouncementResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @UseGuards(RbacGuard('announcement', 'create'))
  @ApiOperation({ summary: 'Crear un nuevo anuncio' })
  @ApiResponse({
    status: 201,
    description: 'Anuncio creado',
    type: AnnouncementResponseDto,
  })
  async create(
    @Body() createDto: CreateAnnouncementDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.announcementService.create(createDto, userId, tenantId, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Get()
  @UseGuards(RbacGuard('announcement', 'read'))
  @ApiOperation({ summary: 'Listar anuncios del tenant (paginado, filtrado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de anuncios',
    type: [AnnouncementResponseDto],
  })
  async findAll(
    @Query() filters: FindAllAnnouncementsDto,
    @TenantId() tenantId: string,
    @User('role') userRole?: string,
  ) {
    return this.announcementService.findAll(filters, tenantId, userRole);
  }

  @Get(':id')
  @UseGuards(RbacGuard('announcement', 'read'))
  @ApiOperation({ summary: 'Obtener un anuncio por ID' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Anuncio encontrado',
    type: AnnouncementResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.announcementService.findById(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(RbacGuard('announcement', 'update'))
  @ApiOperation({ summary: 'Actualizar un anuncio' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Anuncio actualizado',
    type: AnnouncementResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementDto,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.announcementService.update(id, updateDto, tenantId, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Delete(':id')
  @UseGuards(RbacGuard('announcement', 'delete'))
  @ApiOperation({ summary: 'Eliminar un anuncio (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Anuncio eliminado',
  })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async remove(
    @Param('id') id: string,
    @User('id') userId: string,
    @TenantId() tenantId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.announcementService.softDelete(id, tenantId, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}
