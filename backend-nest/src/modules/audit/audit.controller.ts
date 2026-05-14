import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { FindAllAuditDto } from './dto/find-all-audit.dto';
import { AuditResponseDto } from './dto/audit-response.dto';
import { JwtAuthGuard, TenantGuard } from '../../common/guards';
import { User, TenantId } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar logs de auditoría (paginado, filtrado)',
    description:
      'SUPER_ADMIN: ve todos los logs. ADMIN_TENANT: ve solo los de su tenant.',
  })
  @ApiQuery({ name: 'entity', required: false, enum: ['user', 'property', 'unit'] })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: ['CREATE', 'UPDATE', 'DELETE'] })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de auditoría',
    type: [AuditResponseDto],
  })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async findAll(
    @Query() filters: FindAllAuditDto,
    @TenantId() tenantId: string,
    @User('role') userRole: UserRole,
  ) {
    // Only SUPER_ADMIN and ADMIN_TENANT can access audit logs
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN_TENANT) {
      throw new ForbiddenException(
        'Solo SUPER_ADMIN y ADMIN_TENANT pueden consultar auditoría',
      );
    }

    return this.auditService.findAll(filters, tenantId, userRole);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un log de auditoría por ID',
    description:
      'SUPER_ADMIN: cualquier log. ADMIN_TENANT: solo logs de su tenant.',
  })
  @ApiParam({ name: 'id', description: 'ID del log de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Log de auditoría encontrado',
    type: AuditResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Log no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @User('role') userRole: UserRole,
  ) {
    // Only SUPER_ADMIN and ADMIN_TENANT can access audit logs
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN_TENANT) {
      throw new ForbiddenException(
        'Solo SUPER_ADMIN y ADMIN_TENANT pueden consultar auditoría',
      );
    }

    return this.auditService.findById(id, tenantId, userRole);
  }
}
