import { TestingModuleBuilder } from '@nestjs/testing';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from './mock-guards';
import { PrismaService } from '../../config/prisma.service';

/**
 * Mock PrismaService for tests
 */
export const mockPrismaService = {
  rolePermission: {
    findFirst: jest.fn().mockResolvedValue({}),
  },
  // Add other commonly used Prisma methods as needed
};

/**
 * Apply common test guards to a TestingModuleBuilder
 * Call this after defining controllers and providers
 */
export function applyMockGuards(moduleBuilder: TestingModuleBuilder): TestingModuleBuilder {
  return moduleBuilder
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .overrideGuard(TenantGuard)
    .useClass(MockTenantGuard)
    .overrideGuard(RbacGuard)
    .useClass(MockRbacGuard)
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService);
}