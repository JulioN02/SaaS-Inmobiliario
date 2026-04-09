import { propertyRepository, CreatePropertyInput, UpdatePropertyInput, PropertyListFilters } from './property.repository';
import { tenantRepository } from '../tenant/tenant.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors';
import { TenantPlan } from '@prisma/client';

const PROPERTY_PLAN_LIMIT: Record<TenantPlan, number> = {
  BASIC: 1,
  PREMIUM: 10,
  ENTERPRISE: Infinity
};

type CallerCtx = { userId: string; tenantId: string; ipAddress?: string };

export const propertyService = {
  list: (filters: PropertyListFilters) => propertyRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const property = await propertyRepository.findById(id, tenantId);
    if (!property) throw new NotFoundError(`Property ${id} not found`);
    return property;
  },

  create: async (input: CreatePropertyInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant not found');

    const count = await propertyRepository.countActive(tenantId);
    const limit = PROPERTY_PLAN_LIMIT[tenant.plan];
    if (count >= limit) {
      throw new ForbiddenError(
        `Property limit reached for plan '${tenant.plan}' (max ${limit}). Upgrade to add more properties.`
      );
    }

    const property = await propertyRepository.create(tenantId, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'property',
      entityId: property.id,
      action: 'CREATE',
      after: { id: property.id, name: property.name },
      ipAddress: ctx.ipAddress
    });

    return property;
  },

  update: async (id: string, input: UpdatePropertyInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const property = await propertyRepository.findById(id, tenantId);
    if (!property) throw new NotFoundError(`Property ${id} not found`);

    const updated = await propertyRepository.update(id, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'property',
      entityId: id,
      action: 'UPDATE',
      before: { name: property.name, address: property.address },
      after: input,
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  remove: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const property = await propertyRepository.findById(id, tenantId);
    if (!property) throw new NotFoundError(`Property ${id} not found`);

    const hasUnits = await propertyRepository.hasUnits(id);
    if (hasUnits) {
      throw new ConflictError('Cannot delete property with active units. Remove units first.');
    }

    await propertyRepository.softDelete(id);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'property',
      entityId: id,
      action: 'DELETE',
      before: { name: property.name },
      ipAddress: ctx.ipAddress
    });
  }
};
