import { Router } from 'express';
import { authRoutes }      from '../modules/auth/auth.routes';
import { roleRoutes }      from '../modules/role/role.routes';
import { tenantRoutes }    from '../modules/tenant/tenant.routes';
import { userRoutes }      from '../modules/user/user.routes';
import { auditRoutes }     from '../modules/audit/audit.routes';
import { propertyRoutes }  from '../modules/property/property.routes';
import { towerRoutes }     from '../modules/tower/tower.routes';
import { unitRoutes }      from '../modules/unit/unit.routes';
import { residentRoutes }  from '../modules/resident/resident.routes';
import { occupancyRoutes } from '../modules/occupancy/occupancy.routes';
import { feeRoutes }       from '../modules/fee/fee.routes';
import { maintenanceRoutes } from '../modules/maintenance/maintenance.routes';
import { visitorRoutes }   from '../modules/visitor/visitor.routes';
import { announcementRoutes } from '../modules/announcement/announcement.routes';
import { websiteRoutes }    from '../modules/website/website.routes';
import { metricsRoutes }    from '../modules/metrics/metrics.routes';

export const v1Routes = Router();

// ── Platform Auth (no auth required) ──────────────────────────────────────
v1Routes.use('/auth', authRoutes);

// ── Core SaaS (SUPER_ADMIN) ───────────────────────────────────────────────
v1Routes.use('/roles',   roleRoutes);
v1Routes.use('/tenants', tenantRoutes);
v1Routes.use('/users',   userRoutes);
v1Routes.use('/audit',   auditRoutes);

// ── Dominio Inmobiliario ──────────────────────────────────────────────────
v1Routes.use('/properties', propertyRoutes);

// Towers nested under property — mergeParams active in towerRoutes
v1Routes.use('/properties/:propertyId/towers', towerRoutes);

// Units: top-level listing + CRUD; creation is under property
v1Routes.use('/units', unitRoutes);

v1Routes.use('/residents',   residentRoutes);
v1Routes.use('/occupancies', occupancyRoutes);
v1Routes.use('/fees',        feeRoutes);
v1Routes.use('/maintenance', maintenanceRoutes);
v1Routes.use('/visitors',    visitorRoutes);
v1Routes.use('/announcements', announcementRoutes);
v1Routes.use('/website',      websiteRoutes);
v1Routes.use('/metrics',      metricsRoutes);

// ── Health (public) ───────────────────────────────────────────────────────
v1Routes.get('/health', (_req, res) => res.json({ status: 'ok' }));