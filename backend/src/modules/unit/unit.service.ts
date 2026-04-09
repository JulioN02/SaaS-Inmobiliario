import { unitRepository, CreateUnitInput, UpdateUnitInput, UnitListFilters } from './unit.repository';
import { propertyRepository } from '../property/property.repository';
import { towerRepository } from '../tower/tower.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ForbiddenError, ConflictError, UnprocessableError } from '../../shared/errors';

type CallerCtx = { userId: string; tenantId: string; ipAddress?: string };

export const unitService = {
  list: (filters: UnitListFilters) => unitRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const unit = await unitRepository.findById(id, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${id} not found`);
    return unit;
  },

  create: async (propertyId: string, input: CreateUnitInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    // Guard 1: property exists in this tenant
    const property = await propertyRepository.findById(propertyId, tenantId);
    if (!property) throw new NotFoundError(`Property ${propertyId} not found`);

    // Guard 2: if towerId provided, tower must belong to same property
    if (input.towerId) {
      const tower = await towerRepository.findById(input.towerId, tenantId);
      if (!tower) throw new NotFoundError(`Tower ${input.towerId} not found`);
      if (tower.propertyId !== propertyId) {
        throw new UnprocessableError(
          `Tower ${input.towerId} does not belong to property ${propertyId}`
        );
      }
    }

    const unit = await unitRepository.create(tenantId, propertyId, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'unit',
      entityId: unit.id,
      action: 'CREATE',
      after: { id: unit.id, identifier: unit.identifier, propertyId },
      ipAddress: ctx.ipAddress
    });

    return unit;
  },

  update: async (id: string, input: UpdateUnitInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const unit = await unitRepository.findById(id, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${id} not found`);

    // Guard: if changing tower, validate it belongs to same property
    if (input.towerId) {
      const tower = await towerRepository.findById(input.towerId, tenantId);
      if (!tower) throw new NotFoundError(`Tower ${input.towerId} not found`);
      if (tower.propertyId !== unit.propertyId) {
        throw new UnprocessableError(
          `Tower ${input.towerId} does not belong to property ${unit.propertyId}`
        );
      }
    }

    const updated = await unitRepository.update(id, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'unit',
      entityId: id,
      action: 'UPDATE',
      before: { status: unit.status, floor: unit.floor },
      after: input,
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  remove: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const unit = await unitRepository.findById(id, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${id} not found`);

    const hasOccupancy = await unitRepository.hasActiveOccupancy(id);
    if (hasOccupancy) {
      throw new ConflictError('Cannot delete unit with an active occupancy. Close occupancy first.');
    }

    await unitRepository.softDelete(id);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'unit',
      entityId: id,
      action: 'DELETE',
      before: { identifier: unit.identifier, status: unit.status },
      ipAddress: ctx.ipAddress
    });
  }
};
