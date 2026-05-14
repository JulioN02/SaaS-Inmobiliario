import { CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Mock JwtAuthGuard - no dependencies, always returns true
 * Use this in tests to bypass JWT validation
 */
export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

/**
 * Mock TenantGuard - no dependencies, always returns true
 * Use this in tests to bypass tenant validation
 */
export class MockTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

/**
 * Mock RbacGuard - no dependencies, always returns true
 * Use this in tests to bypass RBAC validation
 */
export class MockRbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}