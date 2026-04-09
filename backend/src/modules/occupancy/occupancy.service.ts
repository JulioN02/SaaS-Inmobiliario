import { occupancyRepository, CreateOccupancyInput, OccupancyListFilters } from './occupancy.repository';
import { unitRepository } from '../unit/unit.repository';
import { residentRepository } from '../resident/resident.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ConflictError, UnprocessableError } from '../../shared/errors';
import { prisma } from '../../config/database';

type CallerCtx = { userId: string; tenantId: string; ipAddress?: string };

export const occupancyService = {
  list: (filters: OccupancyListFilters) => occupancyRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const occupancy = await occupancyRepository.findById(id, tenantId);
    if (!occupancy) throw new NotFoundError(`Occupancy ${id} not found`);
    return occupancy;
  },

  open: async (input: CreateOccupancyInput, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    // Guard 1: unit exists in tenant
    const unit = await unitRepository.findById(input.unitId, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${input.unitId} not found`);

    // Guard 2: 1 active occupancy per unit
    const existing = await occupancyRepository.findActiveByUnit(input.unitId);
    if (existing) {
      throw new ConflictError(
        `Unit ${unit.identifier} already has an active occupancy. Close it before creating a new one.`
      );
    }

    // Guard 3: resident exists in tenant
    const resident = await residentRepository.findById(input.residentId, tenantId);
    if (!resident) throw new NotFoundError(`Resident ${input.residentId} not found`);

    // Atomic: create occupancy + update unit.status in a $transaction
    const [occupancy] = await prisma.$transaction([
      prisma.occupancy.create({
        data: {
          ...input,
          tenantId,
          startDate: new Date(input.startDate)
        }
      }),
      prisma.unit.update({
        where: { id: input.unitId },
        data: { status: 'OCCUPIED' }
      })
    ]);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'occupancy',
      entityId: occupancy.id,
      action: 'CREATE',
      after: {
        unitId: input.unitId,
        residentId: input.residentId,
        type: input.type,
        startDate: input.startDate
      },
      ipAddress: ctx.ipAddress
    });

    return occupancy;
  },

  close: async (id: string, input: { endDate: string | Date; notes?: string }, ctx: CallerCtx) => {
    const { tenantId } = ctx;

    const occupancy = await occupancyRepository.findById(id, tenantId);
    if (!occupancy) throw new NotFoundError(`Occupancy ${id} not found`);

    // Already closed
    if (occupancy.endDate !== null) {
      throw new UnprocessableError('Occupancy is already closed');
    }

    const endDate = new Date(input.endDate);

    // Atomic: close occupancy + set unit back to AVAILABLE
    await prisma.$transaction([
      prisma.occupancy.update({
        where: { id },
        data: { endDate, notes: input.notes }
      }),
      prisma.unit.update({
        where: { id: occupancy.unitId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    await auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: 'occupancy',
      entityId: id,
      action: 'STATUS_CHANGE',
      before: { endDate: null, unitStatus: 'OCCUPIED' },
      after: { endDate: endDate.toISOString(), unitStatus: 'AVAILABLE' },
      ipAddress: ctx.ipAddress
    });

    return { ...occupancy, endDate, notes: input.notes || occupancy.notes };
  }
};
