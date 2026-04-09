import { auditRepository, AuditListFilters } from './audit.repository';

export const auditQueryService = {
  list: (filters: AuditListFilters) => auditRepository.findAll(filters)
};
