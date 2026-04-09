import { towerRepository, CreateTowerInput, UpdateTowerInput, TowerListFilters } from './tower.repository';
import { propertyRepository } from '../property/property.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ConflictError } from '../../shared/errors';

type CallerCtx = { userId: string; tenantId: string; ipAddress?: string };

export const towerService = {
  list: (filters: TowerListFilters) => towerRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const tower = await towerRepository.findById(id, tenantId);
    if (!tower) throw new NotFoundError(`Tower ${id} not found`);
    return tower;
  },

  create: async (propertyId: string, input: CreateTowerInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    // Hierarchy guard: property must exist in this tenant
    const property = await propertyRepository.findById(propertyId, tenantId);
    if (!property) throw new NotFoundError(`Property ${propertyId} not found`);

    const tower = await towerRepository.create(tenantId, propertyId, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'tower',
      entityId: tower.id,
      action: 'CREATE',
      after: { id: tower.id, name: tower.name, propertyId },
      ipAddress: ctx.ipAddress
    });

    return tower;
  },

  update: async (id: string, input: UpdateTowerInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const tower = await towerRepository.findById(id, tenantId);
    if (!tower) throw new NotFoundError(`Tower ${id} not found`);

    const updated = await towerRepository.update(id, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'tower',
      entityId: id,
      action: 'UPDATE',
      before: { name: tower.name },
      after: input,
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  remove: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const tower = await towerRepository.findById(id, tenantId);
    if (!tower) throw new NotFoundError(`Tower ${id} not found`);

    const hasUnits = await towerRepository.hasActiveUnits(id);
    if (hasUnits) throw new ConflictError('Cannot delete tower with active units. Reassign or remove units first.');

    await towerRepository.softDelete(id);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'tower',
      entityId: id,
      action: 'DELETE',
      before: { name: tower.name },
      ipAddress: ctx.ipAddress
    });
  }
};
