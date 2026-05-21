import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  client_id: string;
  role: string;
  plan: string;
  permissions: Array<{ resource: string; action: string }>;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, tenantId: string) {
    const { email, password } = loginDto;

    // Buscar usuario por email y tenant
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
        deletedAt: null,
      },
      include: {
        tenant: true,
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('La cuenta de usuario está suspendida');
    }

    if (user.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`El tenant está ${user.tenant.status}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const permissions = user.roleRef.permissions.map(rp => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
    }));

    const expiresIn = 86400; // 24h
    const jwtSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret-change-in-production');
    
    const token = jwt.sign(
      {
        sub: user.id,
        client_id: user.tenantId,
        role: user.role,
        plan: user.tenant.plan,
        permissions,
      } as JwtPayload,
      jwtSecret,
      { expiresIn },
    );

    return {
      accessToken: token,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.tenantId,
      },
    };
  }
}
