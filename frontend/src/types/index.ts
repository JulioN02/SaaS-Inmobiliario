/* =============================================================================
   SaaS Inmobiliario — Tipos Globales
   Interfaces compartidas entre frontend y backend
   ============================================================================= */

// ── Roles del Sistema ───────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_TENANT' | 'ADMINISTRATIVA' | 'PORTERIA';

// ── Plan ────────────────────────────────────────────────────────────────────

export type { Plan, PlanLimits, PlanPrices, CreatePlanDto, UpdatePlanDto, FindAllPlansParams, PaginatedPlans } from './plan';

// ── Usuario ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  clientId: string;
  firstName?: string;
  lastName?: string;
}

// ── Respuesta de Login ──────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

// ── Permisos (RBAC) ─────────────────────────────────────────────────────────

export interface Permission {
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete';
}

// ── Respuesta de la API ─────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode: number;
}

// ── Paginación ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Entidad Base ────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// ── Enumeraciones del Backend ───────────────────────────────────────────────

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type PropertyType = 'CONJUNTO' | 'EDIFICIO' | 'TORRE' | 'CASA_INDEPENDIENTE';
export type UnitType = 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'PARKING';
export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type OccupancyType = 'OWNER' | 'TENANT';
export type DocumentType = 'CC' | 'CE' | 'PASSPORT' | 'NIT';
export type FeeType = 'PERIODIC' | 'EXTRAORDINARY' | 'ADJUSTMENT';
export type FeeStatus = 'PENDING' | 'PAID' | 'PARTIAL';
export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

// ── Dominio: Tenant ─────────────────────────────────────────────────────────

export interface Tenant extends BaseEntity {
  name: string;
  subdomain: string;
  planId: string;
  plan?: { id: string; name: string; slug: string; limits: PlanLimits };
  status: TenantStatus;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  planId: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateTenantDto {
  name?: string;
  subdomain?: string;
  planId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface FindAllTenantsParams {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  planId?: string;
}

// ── Dominio: Property ───────────────────────────────────────────────────────

export interface Property extends BaseEntity {
  tenantId: string;
  name: string;
  propertyType: PropertyType;
  address?: string;
  description?: string;
}

// ── Dominio: Unit ───────────────────────────────────────────────────────────

export interface Unit extends BaseEntity {
  tenantId: string;
  propertyId: string;
  towerId?: string;
  identifier: string;
  unitType: UnitType;
  floor?: number;
  status: UnitStatus;
  monthlyFeeAmount?: number;
  isPublished?: boolean;
}

// ── Dominio: Resident ───────────────────────────────────────────────────────

export interface Resident extends BaseEntity {
  tenantId: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
}

// ── Dominio: Occupancy ──────────────────────────────────────────────────────

export interface Occupancy extends BaseEntity {
  tenantId: string;
  unitId: string;
  residentId: string;
  type: OccupancyType;
  startDate: string;
  endDate?: string;
  notes?: string;
}

// ── Dominio: Fee ────────────────────────────────────────────────────────────

export interface Fee extends BaseEntity {
  tenantId: string;
  unitId: string;
  type: FeeType;
  amount: number;
  period: string;
  status: FeeStatus;
  paidAmount?: number;
  dueDate?: string;
  description?: string;
}

// ── Dominio: MaintenanceRequest ─────────────────────────────────────────────

export interface MaintenanceRequest extends BaseEntity {
  tenantId: string;
  unitId: string;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  assignedTo?: string;
  resolvedAt?: string;
}

// ── Dominio: Visitor ────────────────────────────────────────────────────────

export interface Visitor extends BaseEntity {
  tenantId: string;
  unitId: string;
  visitorName: string;
  documentNumber?: string;
  entryDate: string;
  exitDate?: string;
  notes?: string;
  registeredBy: string;
}

// ── Dominio: Announcement ───────────────────────────────────────────────────

export interface Announcement extends BaseEntity {
  tenantId: string;
  title: string;
  body: string;
  targetRoles: UserRole[];
  createdBy: string;
}

// ── Dominio: AuditLog ───────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  entity: string;
  entityId: string;
  action: string;
  snapshot?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface FindAllAuditParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Métricas ────────────────────────────────────────────────────────────────

export interface FeeMetrics {
  pending: number;
  paid: number;
  partial: number;
  overdue: number;
  totalCollected: number;
  collectionRate: number;
}

export interface VisitorMetrics {
  today: number;
  active: number;
  thisWeek: number;
}

export interface MaintenanceMetrics {
  pending: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
}

export interface Metrics {
  tenantsActive: number;
  tenantsSuspended: number;
  totalProperties: number;
  totalUnits: number;
  totalUsers: number;
  totalResidents: number;
  occupancyRate: number;
  unitsByStatus: Record<UnitStatus, number>;
  tenantsByPlan: Record<string, number>;
  fees: FeeMetrics;
  visitors: VisitorMetrics;
  maintenance: MaintenanceMetrics;
}
