import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { TenantGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';
import { PrismaService } from '../../config/prisma.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  @SkipThrottle()
  @ApiOperation({ summary: 'Health check del backend' })
  @ApiResponse({ status: 200, description: 'Backend saludable' })
  async health() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  }

  @Post('login')
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @UseGuards(TenantGuard) // Solo necesita resolver tenant, no auth
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        expiresIn: 86400,
        user: {
          id: 'uuid',
          email: 'admin@laspalmas.com',
          role: 'ADMIN_TENANT',
          clientId: 'tenant-uuid',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Tenant o usuario suspendido' })
  async login(
    @Body() loginDto: LoginDto,
    @TenantId() tenantId: string,
  ) {
    return this.authService.login(loginDto, tenantId);
  }
}
