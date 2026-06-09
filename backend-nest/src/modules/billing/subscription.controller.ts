import {
  Controller,
  Get,
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
import { SubscriptionService } from './subscription.service';
import {
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User } from '../../common/decorators';
import { SubscriptionStatus } from '@prisma/client';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @UseGuards(RbacGuard('subscription', 'read'))
  @ApiOperation({ summary: 'Listar suscripciones (SuperAdmin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de suscripciones',
    type: [SubscriptionResponseDto],
  })
  async findAll(
    @Query('status') status?: SubscriptionStatus,
    @Query('planId') planId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.subscriptionService.findAll({ status, planId, page, limit });
  }

  @Get(':id')
  @UseGuards(RbacGuard('subscription', 'read'))
  @ApiOperation({ summary: 'Obtener suscripción por ID' })
  @ApiParam({ name: 'id', description: 'ID de la suscripción' })
  @ApiResponse({
    status: 200,
    description: 'Suscripción encontrada',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  async findById(@Param('id') id: string) {
    return this.subscriptionService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RbacGuard('subscription', 'update'))
  @ApiOperation({ summary: 'Actualizar suscripción (estado, plan)' })
  @ApiParam({ name: 'id', description: 'ID de la suscripción' })
  @ApiResponse({
    status: 200,
    description: 'Suscripción actualizada',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  @ApiResponse({ status: 400, description: 'Transición de estado no válida' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.subscriptionService.update(id, updateDto, {
      userId,
      ipAddress,
    });
  }
}
