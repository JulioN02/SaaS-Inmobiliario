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
import { InvoiceService } from './invoice.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
} from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User } from '../../common/decorators';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @UseGuards(RbacGuard('invoice', 'read'))
  @ApiOperation({ summary: 'Listar facturas con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas',
    type: [InvoiceResponseDto],
  })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoiceService.findAll({ tenantId, status, page, limit });
  }

  @Get(':id')
  @UseGuards(RbacGuard('invoice', 'read'))
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiParam({ name: 'id', description: 'ID de la factura' })
  @ApiResponse({
    status: 200,
    description: 'Factura encontrada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async findById(@Param('id') id: string) {
    return this.invoiceService.findById(id);
  }

  @Post()
  @UseGuards(RbacGuard('invoice', 'create'))
  @ApiOperation({ summary: 'Crear factura (DRAFT)' })
  @ApiResponse({
    status: 201,
    description: 'Factura creada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(
    @Body() createDto: CreateInvoiceDto,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.invoiceService.create(createDto, {
      userId,
      ipAddress,
    });
  }

  @Patch(':id')
  @UseGuards(RbacGuard('invoice', 'update'))
  @ApiOperation({ summary: 'Actualizar factura (solo DRAFT)' })
  @ApiParam({ name: 'id', description: 'ID de la factura' })
  @ApiResponse({
    status: 200,
    description: 'Factura actualizada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Solo DRAFT editable' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceDto,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.invoiceService.update(id, updateDto, {
      userId,
      ipAddress,
    });
  }

  @Patch(':id/finalize')
  @UseGuards(RbacGuard('invoice', 'update'))
  @ApiOperation({ summary: 'Finalizar factura (DRAFT → PENDING)' })
  @ApiParam({ name: 'id', description: 'ID de la factura' })
  @ApiResponse({
    status: 200,
    description: 'Factura finalizada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No es DRAFT' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async finalize(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.invoiceService.finalize(id, {
      userId,
      ipAddress,
    });
  }

  @Patch(':id/cancel')
  @UseGuards(RbacGuard('invoice', 'update'))
  @ApiOperation({ summary: 'Cancelar factura (PENDING → CANCELED)' })
  @ApiParam({ name: 'id', description: 'ID de la factura' })
  @ApiResponse({
    status: 200,
    description: 'Factura cancelada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No es PENDING' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async cancel(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.invoiceService.cancel(id, {
      userId,
      ipAddress,
    });
  }

  @Get(':id/payments')
  @UseGuards(RbacGuard('invoice', 'read'))
  @ApiOperation({ summary: 'Listar pagos de una factura' })
  @ApiParam({ name: 'id', description: 'ID de la factura' })
  @ApiResponse({
    status: 200,
    description: 'Pagos de la factura',
  })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async findPaymentsByInvoice(@Param('id') id: string) {
    return this.invoiceService.findPaymentsByInvoice(id);
  }
}
