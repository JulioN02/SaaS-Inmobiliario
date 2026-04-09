import { residentRepository, CreateResidentInput, UpdateResidentInput, ResidentListFilters } from './resident.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ConflictError } from '../../shared/errors';

type CallerCtx = { userId: string; tenantId: string; ipAddress?: string };

export const residentService = {
  list: (filters: ResidentListFilters) => residentRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const resident = await residentRepository.findById(id, tenantId);
    if (!resident) throw new NotFoundError(`Resident ${id} not found`);
    return resident;
  },

  create: async (input: CreateResidentInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    // documentNumber unique per tenant
    const existing = await residentRepository.findByDocument(input.documentNumber, tenantId);
    if (existing) {
      throw new ConflictError(
        `Document number '${input.documentNumber}' already registered in this tenant`
      );
    }

    const resident = await residentRepository.create(tenantId, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'resident',
      entityId: resident.id,
      action: 'CREATE',
      after: {
        id: resident.id,
        documentType: resident.documentType,
        documentNumber: resident.documentNumber
      },
      ipAddress: ctx.ipAddress
    });

    return resident;
  },

  update: async (id: string, input: UpdateResidentInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const resident = await residentRepository.findById(id, tenantId);
    if (!resident) throw new NotFoundError(`Resident ${id} not found`);

    // If changing documentNumber, verify uniqueness
    if (input.documentNumber && input.documentNumber !== resident.documentNumber) {
      const clash = await residentRepository.findByDocument(input.documentNumber, tenantId);
      if (clash) {
        throw new ConflictError(
          `Document number '${input.documentNumber}' already registered in this tenant`
        );
      }
    }

    const updated = await residentRepository.update(id, input);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'resident',
      entityId: id,
      action: 'UPDATE',
      before: { firstName: resident.firstName, lastName: resident.lastName },
      after: input,
      ipAddress: ctx.ipAddress
    });

    return updated;
  },

  remove: async (id: string, ctx: CallerCtx) => {
    const { tenantId } = ctx;
    const resident = await residentRepository.findById(id, tenantId);
    if (!resident) throw new NotFoundError(`Resident ${id} not found`);

    const hasOccupancy = await residentRepository.hasActiveOccupancy(id);
    if (hasOccupancy) {
      throw new ConflictError('Cannot delete resident with an active occupancy. Close occupancy first.');
    }

    await residentRepository.softDelete(id);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'resident',
      entityId: id,
      action: 'DELETE',
      before: {
        firstName: resident.firstName,
        lastName: resident.lastName,
        documentNumber: resident.documentNumber
      },
      ipAddress: ctx.ipAddress
    });
  }
};
