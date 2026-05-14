/* =============================================================================
   SaaS Inmobiliario — Pagination
   Navegación de páginas reutilizable
   ============================================================================= */

import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageButton}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        ← Anterior
      </button>

      <div className={styles.pageNumbers}>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => {
            // Mostrar siempre primera, última, y ±1 de la actual
            return p === 1 || p === totalPages || Math.abs(p - page) <= 2;
          })
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <span key={p}>
                {showEllipsis && <span className={styles.ellipsis}>…</span>}
                <button
                  className={`${styles.numberButton} ${p === page ? styles.active : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              </span>
            );
          })}
      </div>

      <span className={styles.pageInfo}>
        {from}–{to} de {total}
      </span>

      <button
        className={styles.pageButton}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >
        Siguiente →
      </button>
    </div>
  );
}