import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { TenantGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
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
