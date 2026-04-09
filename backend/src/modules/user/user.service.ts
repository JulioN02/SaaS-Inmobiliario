import bcrypt from 'bcrypt';
import { userRepository, CreateUserInput, UpdateUserInput, UserListFilters } from './user.repository';
import { tenantRepository } from '../tenant/tenant.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { TenantPlan } from '@prisma/client';

// Plan limits (users) — same source of truth as tenant.service
const USER_PLAN_LIMIT: Record<TenantPlan, number> = {
  BASIC: 5,
  PREMIUM: 15,
  ENTERPRISE: Infinity
};

type CallerCtx = { userId: string; tenantId: string; ipAddress?: string };

export const userService = {
  list: (filters: UserListFilters) => userRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  },

  create: async (input: Omit<CreateUserInput, 'tenantId'>, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    // 1. Tenant must exist and be ACTIVE
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant not found');

    // 2. Plan limit
    const activeCount = await userRepository.countActive(tenantId);
    const limit = USER_PLAN_LIMIT[tenant.plan];
    if (activeCount >= limit) {
      throw new ForbiddenError(
        `User limit reached for plan '${tenant.plan}' (max ${limit}). Upgrade to add more users.`
      );
    }

    // 3. Email unique per tenant
    const existing = await userRepository.findByEmail(input.email, tenantId);
    if (existing) throw new ConflictError(`Email '${input.email}' already exists in this tenant`);

    // 4. Hash password
    const password = await bcrypt.hash(input.password, 12);

    const user = await userRepository.create({ ...input, tenantId, password });

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'user',
      entityId: user.id,
      action: 'CREATE',
      after: { id: user.id, email: user.email, role: user.role },
      ipAddress: ctx.ipAddress
    });

    return user;
  },

  update: async (id: string, input: UpdateUserInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw new NotFoundError(`User ${id} not found`);

    const updated = await userRepository.update(id, tenantId, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'user',
      entityId: id,
      action: 'UPDATE',
      before: { role: user.role },
      after: input,
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  suspend: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    if (!user.isActive) throw new ConflictError('User is already suspended');

    await userRepository.setActive(id, false);

    await auditService.log({
      tenantId, userId: ctx.userId, entity: 'user', entityId: id,
      action: 'SUSPEND', before: { isActive: true }, after: { isActive: false },
      ipAddress: ctx.ipAddress
    });

    return { ...user, isActive: false };
  },

  activate: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    if (user.isActive) throw new ConflictError('User is already active');

    await userRepository.setActive(id, true);

    await auditService.log({
      tenantId, userId: ctx.userId, entity: 'user', entityId: id,
      action: 'ACTIVATE', before: { isActive: false }, after: { isActive: true },
      ipAddress: ctx.ipAddress
    });

    return { ...user, isActive: true };
  },

  remove: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw new NotFoundError(`User ${id} not found`);

    await userRepository.softDelete(id);

    await auditService.log({
      tenantId, userId: ctx.userId, entity: 'user', entityId: id,
      action: 'DELETE', before: { email: user.email },
      ipAddress: ctx.ipAddress
    });
  }
};
