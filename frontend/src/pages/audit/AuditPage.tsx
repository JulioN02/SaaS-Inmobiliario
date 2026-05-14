/* =============================================================================
   SaaS Inmobiliario — Audit Page
   Lista de logs de auditoría con filtros y paginación
   Solo visible para SUPER_ADMIN y ADMIN_TENANT
   ============================================================================= */

import { useEffect, useState } from 'react';
import { useAuditStore } from '../../stores/auditStore';
import { toast } from '../../stores/toastStore';
import type { FindAllAuditParams } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';
import styles from './AuditPage.module.css';

// ── Tipos de acciones ────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creado',
  UPDATE: 'Actualizado',
  DELETE: 'Eliminado',
};

const ENTITY_LABELS: Record<string, string> = {
  user: 'Usuario',
  property: 'Propiedad',
  unit: 'Unidad',
  resident: 'Residente',
  occupancy: 'Ocupación',
  fee: 'Cuota',
  maintenance: 'Mantenimiento',
  visitor: 'Visitante',
  announcement: 'Anuncio',
  website: 'Website',
  tenant: 'Tenant',
  role: 'Rol',
};

// ── Componente principal ────────────────────────────────────────────────────

export function AuditPage() {
  const {
    logs,
    loading,
    error,
    total,
    page,
    totalPages,
    limit,
    fetchAuditLogs,
    clearError,
  } = useAuditStore();

  const [filterEntity, setFilterEntity] = useState<string | undefined>(undefined);
  const [filterAction, setFilterAction] = useState<string | undefined>(undefined);
  const [filterStartDate, setFilterStartDate] = useState<string | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<string | undefined>(undefined);

  // Cargar logs al montar y cuando cambian los filtros
  useEffect(() => {
    const params: FindAllAuditParams = {
      page: 1,
      limit,
      entity: filterEntity,
      action: filterAction as 'CREATE' | 'UPDATE' | 'DELETE' | undefined,
      startDate: filterStartDate,
      endDate: filterEndDate,
    };
    fetchAuditLogs(params);
  }, [filterEntity, filterAction, filterStartDate, filterEndDate]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    const params: FindAllAuditParams = {
      page: newPage,
      limit,
      entity: filterEntity,
      action: filterAction as 'CREATE' | 'UPDATE' | 'DELETE' | undefined,
      startDate: filterStartDate,
      endDate: filterEndDate,
    };
    fetchAuditLogs(params);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilterEntity(undefined);
    setFilterAction(undefined);
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  // Formatear fecha
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener label de entidad
  const getEntityLabel = (entity: string) => {
    return ENTITY_LABELS[entity.toLowerCase()] || entity;
  };

  // Obtener label de acción
  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  // Obtener color según acción
  const getActionVariant = (action: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'warning';
      case 'DELETE':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN_TENANT']}>
      <div className={styles.container}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Auditoría</h1>
          <span className={styles.subtitle}>Registro de acciones del sistema</span>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────────────────── */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filterEntity || ''}
            onChange={(e) => setFilterEntity(e.target.value || undefined)}
          >
            <option value="">Todas las entidades</option>
            <option value="user">Usuario</option>
            <option value="property">Propiedad</option>
            <option value="unit">Unidad</option>
            <option value="resident">Residente</option>
            <option value="occupancy">Ocupación</option>
            <option value="fee">Cuota</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="visitor">Visitante</option>
            <option value="announcement">Anuncio</option>
            <option value="website">Website</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterAction || ''}
            onChange={(e) => setFilterAction(e.target.value || undefined)}
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Creado</option>
            <option value="UPDATE">Actualizado</option>
            <option value="DELETE">Eliminado</option>
          </select>

          <input
            type="date"
            className={styles.filterInput}
            value={filterStartDate || ''}
            onChange={(e) => setFilterStartDate(e.target.value || undefined)}
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            className={styles.filterInput}
            value={filterEndDate || ''}
            onChange={(e) => setFilterEndDate(e.target.value || undefined)}
            placeholder="Fecha fin"
          />

          <button className={styles.clearButton} onClick={handleClearFilters}>
            Limpiar
          </button>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className={styles.tableContainer}>
          {loading && logs.length === 0 ? (
            <div className={styles.loading}>Cargando registros de auditoría...</div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>No hay registros de auditoría</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Entidad</th>
                  <th>Acción</th>
                  <th>ID Registro</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.dateCell}>
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td>{log.userId}</td>
                    <td>{getEntityLabel(log.entity)}</td>
                    <td>
                      <span className={`${styles.actionBadge} ${styles[getActionVariant(log.action)]}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className={styles.idCell}>
                      <code>{log.entityId.slice(0, 8)}...</code>
                    </td>
                    <td className={styles.ipCell}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Paginación ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ← Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages} ({total} registros)
            </span>
            <button
              className={styles.pageButton}
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}