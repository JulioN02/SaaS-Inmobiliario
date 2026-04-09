export type UserRole = 'SUPER_ADMIN' | 'ADMIN_TENANT' | 'ADMINISTRATIVA' | 'PORTERIA';

export interface UserPayload {
  id: string;
  clientId: string; // tenantId
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      tenantId?: string;
    }
  }
}
