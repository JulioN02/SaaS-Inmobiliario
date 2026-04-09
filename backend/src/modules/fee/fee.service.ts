import { feeRepository, CreateFeeInput, UpdateFeeStatusInput, FeeListFilters } from './fee.repository';
import { unitRepository } from '../unit/unit.repository';
import { auditService } from '../../shared/services/audit.service';
import { NotFoundError, ConflictError, UnprocessableError } from '../../shared/errors';
import { prisma } from '../../config/database';

export const feeService = {
  list: (filters: FeeListFilters) => feeRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const fee = await feeRepository.findById(id, tenantId);
    if (!fee) throw new NotFoundError(`Fee ${id} not found`);
    return fee;
  },

  create: async (data: CreateFeeInput, ctx: { tenantId: string; userId: string; ipAddress?: string }) => {
    const { tenantId, userId, ipAddress } = ctx;

    // Unit must exist in this tenant
    const unit = await unitRepository.findById(data.unitId, tenantId);
    if (!unit) throw new NotFoundError(`Unit ${data.unitId} not found`);

    const fee = await feeRepository.create({ ...data, tenantId });

    await auditService.log({
      tenantId,
      userId,
      entity: 'fee',
      entityId: fee.id,
      action: 'CREATE',
      after: {
        unitId: data.unitId,
        type: data.type,
        amount: data.amount,
        period: data.period
      },
      ipAddress
    });

    return fee;
  },

  updateStatus: async (id: string, data: UpdateFeeStatusInput, ctx: { tenantId: string; userId: string; ipAddress?: string }) => {
    const { tenantId, userId, ipAddress } = ctx;

    const fee = await feeRepository.findById(id, tenantId);
    if (!fee) throw new NotFoundError(`Fee ${id} not found`);

    if (fee.status === 'PAID') {
      throw new ConflictError(`Fee is already fully PAID and cannot be modified.`);
    }

    if (data.status === 'PARTIAL' && !data.paidAmount) {
      throw new UnprocessableError('paidAmount is required when status is PARTIAL');
    }

    let finalPaidAmount = fee.paidAmount ? Number(fee.paidAmount) : 0;
    let finalStatus = data.status;

    // Amount validations
    if (data.status === 'PARTIAL' || data.status === 'PAID') {
      const currentPaid = fee.paidAmount ? Number(fee.paidAmount) : 0;
      const additionalPaid = data.paidAmount ? Number(data.paidAmount) : 0;
      const totalAmount = Number(fee.amount);

      if (data.status === 'PAID') {
        finalPaidAmount = totalAmount; // force to full
      } else if (data.status === 'PARTIAL') {
        if (currentPaid + additionalPaid >= totalAmount) {
           finalStatus = 'PAID';
           finalPaidAmount = totalAmount;
        } else {
           finalPaidAmount = currentPaid + additionalPaid;
        }
      }
    }

    const notes = data.notes;

    // Execute ATOMIC state change = update fee status + add history entry
    const [updatedFee] = await prisma.$transaction([
      prisma.fee.update({
        where: { id },
        data: {
          status: finalStatus,
          paidAmount: finalPaidAmount > 0 ? finalPaidAmount : null
        }
      }),
      prisma.feeStatusHistory.create({
        data: {
          tenantId,
          feeId: id,
          fromStatus: fee.status,
          toStatus: finalStatus,
          paidAmount: finalPaidAmount > 0 ? finalPaidAmount : null,
          notes,
          changedBy: userId
        }
      })
    ]);

    await auditService.log({
      tenantId,
      userId,
      entity: 'fee',
      entityId: id,
      action: 'STATUS_CHANGE',
      before: { status: fee.status, paidAmount: fee.paidAmount },
      after: { status: finalStatus, paidAmount: updatedFee.paidAmount },
      ipAddress
    });

    return updatedFee;
  }
};
