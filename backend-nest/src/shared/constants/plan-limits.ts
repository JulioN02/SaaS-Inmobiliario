import { TenantPlan } from '@prisma/client';

export interface PlanLimits {
  properties: number;
  units: number;
  users: number;
}

export const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  [TenantPlan.BASIC]: {
    properties: 1,
    units: 100,
    users: 5,
  },
  [TenantPlan.PREMIUM]: {
    properties: 10,
    units: 500,
    users: 15,
  },
  [TenantPlan.ENTERPRISE]: {
    properties: Infinity,
    units: Infinity,
    users: Infinity,
  },
};
