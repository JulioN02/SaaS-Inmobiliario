import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface UserPayload {
  id: string;
  client_id: string;
  role: string;
  plan: string;
  permissions: Array<{ resource: string; action: string }>;
  ipAddress?: string;
}

export const User = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as UserPayload;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  }
);

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['tenantId'] as string;
  }
);
