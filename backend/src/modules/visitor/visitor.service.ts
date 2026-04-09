import { visitorRepository, CreateVisitorInput, VisitorFilters } from './visitor.repository';
import { unitRepository } from '../unit/unit.repository';
import { NotFoundError } from '../../shared/errors';

export const visitorService = {
  list: (filters: VisitorFilters) => visitorRepository.findAll(filters),

  create: async (data: CreateVisitorInput, ctx: { tenantId: string; userId: string; ipAddress?: string }) => {
    const { tenantId, userId } = ctx;

    const unit = await unitRepository.findById(data.unitId, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${data.unitId} not found`);

    return visitorRepository.create({ ...data, tenantId, registeredBy: userId });
  },

  checkout: async (id: string, exitDate: Date, notes?: string, ctx?: { tenantId: string }) => {
    if (ctx) {
      const visitor = await visitorRepository.findById(id, ctx.tenantId);
      if (!visitor) throw new NotFoundError(`Visitor record ${id} not found`);
    }

    return visitorRepository.checkout(id, exitDate, notes);
  }
};
