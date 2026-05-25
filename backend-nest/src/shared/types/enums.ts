// =============================================================================
// Shared enums — pure TypeScript type definitions
// These mirror the Prisma schema enums for use in DTOs, validators, and types
// without requiring a direct dependency on @prisma/client.
// =============================================================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_TENANT = 'ADMIN_TENANT',
  ADMINISTRATIVA = 'ADMINISTRATIVA',
  PORTERIA = 'PORTERIA',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum PropertyType {
  CONJUNTO = 'CONJUNTO',
  EDIFICIO = 'EDIFICIO',
  TORRE = 'TORRE',
  CASA_INDEPENDIENTE = 'CASA_INDEPENDIENTE',
}

export enum UnitType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  COMMERCIAL = 'COMMERCIAL',
  PARKING = 'PARKING',
}

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum OccupancyType {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
  NIT = 'NIT',
}

export enum FeeType {
  PERIODIC = 'PERIODIC',
  EXTRAORDINARY = 'EXTRAORDINARY',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum FeeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum PermissionAction {
  read = 'read',
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUSPEND = 'SUSPEND',
  ACTIVATE = 'ACTIVATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

export enum AuditEntity {
  tenant = 'tenant',
  user = 'user',
  property = 'property',
  tower = 'tower',
  unit = 'unit',
  resident = 'resident',
  occupancy = 'occupancy',
  fee = 'fee',
  maintenance = 'maintenance',
  visitor = 'visitor',
  announcement = 'announcement',
  website = 'website',
}
