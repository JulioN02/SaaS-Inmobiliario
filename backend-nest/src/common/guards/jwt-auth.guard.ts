import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  client_id: string;
  role: string;
  plan: string | { id: string; slug: string };
  permissions: Array<{ resource: string; action: string }>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, secret) as JwtPayload;

      // Adjuntar datos del usuario al request
      const planData = decoded.plan;

      // Backward compatibility: old tokens have plan as string, new ones as object
      let planId: string | null = null;
      let planSlug: string;
      let plan: { id: string; slug: string };

      if (typeof planData === 'string') {
        // Old format — keep as-is (will be replaced on next login)
        planId = null;
        planSlug = planData.toLowerCase();
        plan = { id: '', slug: planSlug };
      } else {
        // New format
        planId = planData.id;
        planSlug = planData.slug;
        plan = planData;
      }

      request['user'] = {
        id: decoded.sub,
        client_id: decoded.client_id,
        clientId: decoded.client_id,
        role: decoded.role,
        plan,
        planId,
        planSlug,
        permissions: decoded.permissions,
        ipAddress: request.ip || request.headers['x-forwarded-for'] || 'unknown',
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
