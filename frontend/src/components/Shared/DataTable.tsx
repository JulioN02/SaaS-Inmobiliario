/* =============================================================================
   SaaS Inmobiliario — DataTable
   Tabla genérica con sorting, loading, empty state y columnas configurables
   ============================================================================= */

import type { ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  sortState?: SortState;
  onSort?: (key: string) => void;
  rowActions?: (item: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  onRowClick,
  sortState,
  onSort,
  rowActions,
}: DataTableProps<T>) {

  const handleHeaderClick = (key: string, sortable?: boolean) => {
    if (!sortable || !onSort) return;
    onSort(key);
  };

  const getSortIcon = (key: string) => {
    if (sortState?.key !== key) return '↕';
    return sortState.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width, textAlign: col.align ?? 'left' }}
                className={col.sortable ? styles.sortableHeader : ''}
                onClick={() => handleHeaderClick(String(col.key), col.sortable)}
              >
                <span className={styles.headerContent}>
                  {col.header}
                  {col.sortable && (
                    <span className={styles.sortIcon}>
                      {getSortIcon(String(col.key))}
                    </span>
                  )}
                </span>
              </th>
            ))}
            {rowActions && <th className={styles.actionsHeader}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {loading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (rowActions ? 1 : 0)} className={styles.loading}>
                Cargando…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (rowActions ? 1 : 0)} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className={onRowClick ? styles.clickableRow : ''}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} style={{ textAlign: col.align ?? 'left' }}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[String(col.key)] ?? '')}
                  </td>
                ))}
                {rowActions && (
                  <td className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                    {rowActions(item)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}