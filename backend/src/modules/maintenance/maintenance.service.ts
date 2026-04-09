import { maintenanceRepository, CreateMaintenanceInput, UpdateMaintenanceInput, MaintenanceFilters } from './maintenance.repository';
import { unitRepository } from '../unit/unit.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError } from '../../shared/errors';

export const maintenanceService = {
  list: (filters: MaintenanceFilters) => maintenanceRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const request = await maintenanceRepository.findById(id, tenantId);
    if (!request) throw new NotFoundError(`Maintenance Request ${id} not found`);
    return request;
  },

  create: async (data: CreateMaintenanceInput, ctx: { tenantId: string; userId: string; ipAddress?: string }) => {
    const { tenantId, userId, ipAddress } = ctx;

    const unit = await unitRepository.findById(data.unitId, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${data.unitId} not found`);

    const request = await maintenanceRepository.create({ ...data, tenantId });

    await auditService.log({
      tenantId,
      userId,
      entity: 'maintenance',
      entityId: request.id,
      action: 'CREATE',
      after: {
        unitId: data.unitId,
        title: data.title
      },
      ipAddress
    });

    return request;
  },

  update: async (id: string, data: UpdateMaintenanceInput, ctx: { tenantId: string; userId: string; ipAddress?: string }) => {
    const { tenantId, userId, ipAddress } = ctx;

    const request = await maintenanceRepository.findById(id, tenantId);
    if (!request) throw new NotFoundError(`Maintenance Request ${id} not found`);

    const updatedRequest = await maintenanceRepository.update(id, data);

    if (data.status && data.status !== request.status) {
      await auditService.log({
        tenantId,
        userId,
        entity: 'maintenance',
        entityId: id,
        action: 'STATUS_CHANGE',
        before: { status: request.status },
        after: { status: data.status },
        ipAddress
      });
    }

    return updatedRequest;
  }
};
