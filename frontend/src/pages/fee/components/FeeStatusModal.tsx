/* =============================================================================
   SaaS Inmobiliario — Fee Status Modal
   Modal para cambiar el estado de una cuota (Pendiente / Pagado / Parcial).
   ============================================================================= */

import { useEffect, useState } from 'react';
import { Modal } from '../../components/Shared/Modal';
import { FormField } from '../../components/Shared/FormField';
import type { Fee, FeeStatus } from '../../types/fee';
import styles from './FeeStatusModal.module.css';

// ── Props ────────────────────────────────────────────────────────────────────

interface FeeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: Fee | null;
  onSubmit: (id: string, data: { status: FeeStatus; paidAmount?: number }) => Promise<void>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FeeStatusModal({ isOpen, onClose, fee, onSubmit }: FeeStatusModalProps) {
  const [statusForm, setStatusForm] = useState<{
    status: FeeStatus;
    paidAmount: string;
  }>({
    status: 'PAID',
    paidAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Initialize form when fee changes or modal opens
  useEffect(() => {
    if (fee) {
      setStatusForm({
        status: fee.status,
        paidAmount: fee.paidAmount?.toString() || '',
      });
    }
  }, [fee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fee) return;

    setSubmitting(true);
    try {
      await onSubmit(fee.id, {
        status: statusForm.status,
        paidAmount: statusForm.paidAmount
          ? parseFloat(statusForm.paidAmount)
          : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Actualizar Estado de Cuota"
      onClose={onClose}
      size="md"
      loading={submitting}
      footer={
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Guardando...' : 'Actualizar Estado'}
          </button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          label="Nuevo Estado"
          as="select"
          name="status"
          value={statusForm.status}
          onChange={(e) =>
            setStatusForm((prev) => ({
              ...prev,
              status: e.target.value as FeeStatus,
            }))
          }
          options={[
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'PAID', label: 'Pagado' },
            { value: 'PARTIAL', label: 'Parcial' },
          ]}
        />
        {(statusForm.status === 'PAID' ||
          statusForm.status === 'PARTIAL') && (
          <FormField
            label="Monto Pagado"
            name="paidAmount"
            type="number"
            value={statusForm.paidAmount}
            onChange={(e) =>
              setStatusForm((prev) => ({
                ...prev,
                paidAmount: e.target.value,
              }))
            }
            placeholder="0"
          />
        )}
        {fee && (
          <div
            style={{
              padding: '12px',
              background: '#F8FAFC',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <p>
              <strong>Cuota:</strong>{' '}
              {fee.description || `${fee.period}`}
            </p>
            <p>
              <strong>Monto:</strong> $
              {fee.amount.toLocaleString('es-CO')}
            </p>
            <p>
              <strong>Unidad:</strong>{' '}
              {fee.unitIdentifier || fee.unitId.slice(0, 8)}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
