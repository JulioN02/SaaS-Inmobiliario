import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { VisitorService } from './visitor.service';
import {
  CreateVisitorDto,
  CheckoutVisitorDto,
  FindAllVisitorsDto,
  VisitorResponseDto,
} from './dto';

@ApiTags('Visitantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('api/v1/visitors')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Get()
  @UseGuards(RbacGuard('visitor', 'read'))
  @ApiOperation({ summary: 'Obtener lista de visitantes' })
  @ApiResponse({ status: 200, description: 'Lista de visitantes paginada' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: FindAllVisitorsDto,
  ) {
    return this.visitorService.findAll(tenantId, filters);
  }

  @Get(':id')
  @UseGuards(RbacGuard('visitor', 'read'))
  @ApiOperation({ summary: 'Obtener un visitante por ID' })
  @ApiResponse({ status: 200, description: 'Visitante encontrado', type: VisitorResponseDto })
  @ApiResponse({ status: 404, description: 'Visitante no encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visitorService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard('visitor', 'create'))
  @ApiOperation({ summary: 'Registrar un nuevo visitante' })
  @ApiResponse({ status: 201, description: 'Visitante registrado', type: VisitorResponseDto })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  async create(
    @TenantId() tenantId: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress: string | undefined,
    @Body() dto: CreateVisitorDto,
  ) {
    return this.visitorService.create(tenantId, dto, {
      userId,
      tenantId,
      ipAddress,
    });
  }

  @Patch(':id/checkout')
  @UseGuards(RbacGuard('visitor', 'update'))
  @ApiOperation({ summary: 'Registrar salida de visitante' })
  @ApiResponse({ status: 200, description: 'Checkout exitoso', type: VisitorResponseDto })
  @ApiResponse({ status: 400, description: 'El visitante ya ha salido' })
  @ApiResponse({ status: 404, description: 'Visitante no encontrado' })
  async checkout(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress: string | undefined,
    @Body() dto: CheckoutVisitorDto,
  ) {
    return this.visitorService.checkout(tenantId, id, dto, {
      userId,
      tenantId,
      ipAddress,
    });
  }
}