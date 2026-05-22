/* =============================================================================
   SaaS Inmobiliario — Fee Detail Modal
   Visualización detallada de una cuota con opción de edición.
   ============================================================================= */

import type { Fee, FeeStatus } from '../../../types/fee';
import { StatusBadge, feeStatusVariant } from '../../../components/Shared/StatusBadge';
import { Modal } from '../../../components/Shared/Modal';
import styles from './FeeDetailModal.module.css';

// ── Constants ───────────────────────────────────────────────────────────────

const statusLabels: Record<FeeStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
};

const feeTypeLabels: Record<string, string> = {
  PERIODIC: 'Periódica',
  EXTRAORDINARY: 'Extraordinaria',
  ADJUSTMENT: 'Ajuste',
};

// ── Props ────────────────────────────────────────────────────────────────────

interface FeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: Fee | null;
  onEdit: (fee: Fee) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FeeDetailModal({ isOpen, onClose, fee, onEdit }: FeeDetailModalProps) {
  return (
    <Modal isOpen={isOpen} title="Detalle de Cuota" onClose={onClose} size="lg">
      {fee && (
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Unidad
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {fee.unitIdentifier || fee.unitId.slice(0, 8)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Propiedad
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {fee.propertyName || '—'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Monto
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                ${fee.amount.toLocaleString('es-CO')}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Estado
              </p>
              <p style={{ margin: 0 }}>
                <StatusBadge variant={feeStatusVariant(fee.status)}>
                  {statusLabels[fee.status]}
                </StatusBadge>
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Periodo
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {fee.period}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Vencimiento
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {new Date(fee.dueDate).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Tipo
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {feeTypeLabels[fee.feeType] || fee.feeType}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Pagado
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {fee.paidAmount
                  ? `$${fee.paidAmount.toLocaleString('es-CO')}`
                  : '—'}
              </p>
            </div>
          </div>
          {fee.description && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                Descripción
              </p>
              <p style={{ fontSize: '14px', margin: 0 }}>{fee.description}</p>
            </div>
          )}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              className={styles.actionButton}
              onClick={() => {
                onClose();
                onEdit(fee);
              }}
            >
              ✏️ Editar Cuota
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
