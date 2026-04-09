import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';
import { ForbiddenError, UnprocessableError } from '../../shared/errors';

export const authService = {
  login: async (email: string, password: string, tenantId?: string) => {
    const user = await authRepository.findByEmail(email, tenantId);

    if (!user) {
      throw new ForbiddenError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenError('User account is suspended');
    }

    if (user.tenant.status !== 'ACTIVE') {
      throw new ForbiddenError(`Tenant is ${user.tenant.status}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenError('Invalid credentials');
    }

    const permissions = user.roleRef.permissions.map(rp => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
    }));

    const expiresIn = 86400; // 24h
    const token = jwt.sign(
      {
        sub: user.id,
        client_id: user.tenantId,
        role: user.role,
        plan: user.tenant.plan,
        permissions,
      },
      env.jwtSecret,
      { expiresIn }
    );

    return {
      accessToken: token,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.tenantId,
      }
    };
  }
};
