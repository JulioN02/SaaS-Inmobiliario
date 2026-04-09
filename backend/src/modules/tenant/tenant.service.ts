import { tenantRepository, CreateTenantInput, UpdateTenantInput, TenantListFilters } from './tenant.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { TenantStatus, TenantPlan } from '@prisma/client';
import { userService } from '../user/user.service';
import { prisma } from '../../config/database';

// Plan limits — enforced in Service, not in DB (see DATABASE.md §15)
const PLAN_LIMITS: Record<TenantPlan, { properties: number; users: number }> = {
  BASIC:      { properties: 1,   users: 5 },
  PREMIUM:    { properties: 10,  users: 15 },
  ENTERPRISE: { properties: Infinity, users: Infinity }
};

type CallerCtx = { userId: string; ipAddress?: string };

export const tenantService = {
  list: (filters: TenantListFilters) => tenantRepository.findAll(filters),

  findById: async (id: string) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);
    return tenant;
  },

  create: async (input: CreateTenantInput, ctx: CallerCtx) => {
    // Subdominio único — todo el sistema
    const existing = await tenantRepository.findBySubdomain(input.subdomain);
    if (existing) throw new ConflictError(`Subdomain '${input.subdomain}' is already taken`);

    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN_TENANT' } });
    if (!adminRole) throw new Error('System error: ADMIN_TENANT role missing');

    const tenant = await tenantRepository.create(input);

    await userService.create({
      roleId: adminRole.id,
      email: input.adminEmail,
      password: input.adminPassword,
      role: 'ADMIN_TENANT'
    }, {
      userId: ctx.userId,
      tenantId: tenant.id,
      ipAddress: ctx.ipAddress
    });

    await auditService.log({
      tenantId: tenant.id,
      userId: ctx.userId,
      entity: 'tenant',
      entityId: tenant.id,
      action: 'CREATE',
      after: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
      ipAddress: ctx.ipAddress
    });

    return tenant;
  },

  update: async (id: string, input: UpdateTenantInput, ctx: CallerCtx) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);

    const updated = await tenantRepository.update(id, input);

    await auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: 'tenant',
      entityId: id,
      action: 'UPDATE',
      before: { name: tenant.name, contactEmail: tenant.contactEmail },
      after: input,
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  suspend: async (id: string, ctx: CallerCtx) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);
    if (tenant.status === 'SUSPENDED') throw new ConflictError('Tenant is already suspended');

    const updated = await tenantRepository.update(id, { status: 'SUSPENDED' as TenantStatus });

    await auditService.log({
      tenantId: id, userId: ctx.userId, entity: 'tenant', entityId: id,
      action: 'SUSPEND', before: { status: 'ACTIVE' }, after: { status: 'SUSPENDED' },
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  activate: async (id: string, ctx: CallerCtx) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);
    if (tenant.status === 'ACTIVE') throw new ConflictError('Tenant is already active');

    const updated = await tenantRepository.update(id, { status: 'ACTIVE' as TenantStatus });

    await auditService.log({
      tenantId: id, userId: ctx.userId, entity: 'tenant', entityId: id,
      action: 'ACTIVATE', before: { status: tenant.status }, after: { status: 'ACTIVE' },
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  changePlan: async (id: string, plan: TenantPlan, ctx: CallerCtx) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);
    if (tenant.plan === plan) throw new ConflictError(`Tenant is already on plan ${plan}`);

    const newLimits = PLAN_LIMITS[plan];
    const [currentUsers, currentProperties] = await Promise.all([
      tenantRepository.countUsers(id),
      tenantRepository.countProperties(id)
    ]);

    if (currentUsers > newLimits.users) {
      throw new ForbiddenError(
        `Cannot downgrade: tenant has ${currentUsers} users but plan '${plan}' allows ${newLimits.users}`
      );
    }
    if (currentProperties > newLimits.properties) {
      throw new ForbiddenError(
        `Cannot downgrade: tenant has ${currentProperties} properties but plan '${plan}' allows ${newLimits.properties}`
      );
    }

    const updated = await tenantRepository.update(id, { plan });

    await auditService.log({
      tenantId: id, userId: ctx.userId, entity: 'tenant', entityId: id,
      action: 'STATUS_CHANGE', before: { plan: tenant.plan }, after: { plan },
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  remove: async (id: string, ctx: CallerCtx) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError(`Tenant ${id} not found`);

    const updated = await tenantRepository.softDelete(id);

    await auditService.log({
      tenantId: id, userId: ctx.userId, entity: 'tenant', entityId: id,
      action: 'DELETE', before: { id, name: tenant.name },
      ipAddress: ctx.ipAddress
    });

    return updated;
  }
};
