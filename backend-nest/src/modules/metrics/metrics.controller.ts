import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { MetricsResponseDto } from './dto/metrics-response.dto';
import { JwtAuthGuard, TenantGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('platform')
  @ApiOperation({
    summary: 'Obtener métricas de toda la plataforma',
    description: 'Solo accesible por SUPER_ADMIN',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de la plataforma',
    type: MetricsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Solo SUPER_ADMIN puede acceder',
  })
  async getPlatformMetrics(@User('role') userRole: UserRole) {
    return this.metricsService.getPlatformMetrics(userRole);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({
    summary: 'Obtener métricas de un tenant específico',
    description:
      'SUPER_ADMIN: cualquier tenant. ADMIN_TENANT: solo su propio tenant.',
  })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Métricas del tenant',
    type: MetricsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para ver métricas de este tenant',
  })
  async getTenantMetrics(
    @Param('tenantId') tenantId: string,
    @User('role') userRole: UserRole,
    @TenantId() requestorTenantId?: string,
  ) {
    return this.metricsService.getTenantMetrics(
      tenantId,
      userRole,
      requestorTenantId,
    );
  }

  // ── Extended dashboard data ────────────────────────────────────────────────

  @Get('tenant/:tenantId/maintenance-pending')
  @ApiOperation({ summary: 'Obtener mantenimientos pendientes y en progreso' })
  async getPendingMaintenance(@Param('tenantId') tenantId: string) {
    return this.metricsService.getPendingMaintenance(tenantId);
  }

  @Get('tenant/:tenantId/upcoming-fees')
  @ApiOperation({ summary: 'Obtener cuotas próximas a vencer' })
  async getUpcomingFees(
    @Param('tenantId') tenantId: string,
  ) {
    return this.metricsService.getUpcomingFees(tenantId);
  }

  @Get('tenant/:tenantId/active-announcements')
  @ApiOperation({ summary: 'Obtener anuncios activos' })
  async getActiveAnnouncements(@Param('tenantId') tenantId: string) {
    return this.metricsService.getActiveAnnouncements(tenantId);
  }
}
