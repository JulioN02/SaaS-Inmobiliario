import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebsiteService } from './website.service';
import { UpdateWebsiteDto, WebsiteResponseDto } from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';

@ApiTags('Website')
@Controller('website')
export class WebsiteController {
  constructor(private websiteService: WebsiteService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get website config' })
  @ApiResponse({
    status: 200,
    description: 'Configuración del sitio web',
    type: WebsiteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getConfig(@TenantId() tenantId: string): Promise<WebsiteResponseDto> {
    return this.websiteService.findOrCreateByTenantId(tenantId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, TenantGuard, RbacGuard('website', 'update'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update website config (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada',
    type: WebsiteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async updateConfig(
    @TenantId() tenantId: string,
    @User('id') userId: string,
    @Body() dto: UpdateWebsiteDto,
    @User('ipAddress') ipAddress?: string,
  ): Promise<WebsiteResponseDto> {
    return this.websiteService.update(tenantId, dto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch('maintenance')
  @UseGuards(JwtAuthGuard, TenantGuard, RbacGuard('website', 'update'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  @ApiResponse({
    status: 200,
    description: 'Modo mantenimiento actualizado',
    type: WebsiteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async toggleMaintenance(
    @TenantId() tenantId: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ): Promise<WebsiteResponseDto> {
    return this.websiteService.toggleMaintenance(tenantId, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}
