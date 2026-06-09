import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BillingConfigService } from './billing-config.service';
import { BillingConfigDto, UpdateBillingConfigDto } from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User } from '../../common/decorators';

@ApiTags('Billing Config')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard)
export class BillingConfigController {
  constructor(private readonly billingConfigService: BillingConfigService) {}

  @Get('tenants/:tenantId/billing-config')
  @UseGuards(RbacGuard('tenant', 'read'))
  @ApiOperation({ summary: 'Obtener configuración de facturación de un tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de facturación',
    type: BillingConfigDto,
  })
  async getConfig(@Param('tenantId') tenantId: string) {
    return this.billingConfigService.findOrCreateByTenantId(tenantId);
  }

  @Put('tenants/:tenantId/billing-config')
  @UseGuards(RbacGuard('subscription', 'update'))
  @ApiOperation({ summary: 'Actualizar configuración de facturación' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada',
    type: BillingConfigDto,
  })
  async updateConfig(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateBillingConfigDto,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.billingConfigService.update(tenantId, dto, {
      userId,
      ipAddress,
    });
  }
}
