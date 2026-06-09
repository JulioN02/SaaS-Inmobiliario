import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto';
import { JwtAuthGuard, TenantGuard, RbacGuard } from '../../common/guards';
import { User } from '../../common/decorators';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(RbacGuard('payment', 'create'))
  @ApiOperation({ summary: 'Registrar pago manual' })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async create(
    @Body() createDto: CreatePaymentDto,
    @User('id') userId: string,
    @User('ipAddress') ipAddress?: string,
  ) {
    return this.paymentService.create(createDto, {
      userId,
      ipAddress,
    });
  }

  @Get(':id')
  @UseGuards(RbacGuard('payment', 'read'))
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({
    status: 200,
    description: 'Pago encontrado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findById(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }
}
