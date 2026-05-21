/* =============================================================================
   SaaS Inmobiliario — Fee Edit Modal
   Modal de edición de cuota con campos: monto, vencimiento, descripción.
   ============================================================================= */

import { useEffect, useState } from 'react';
import { Modal } from '../../components/Shared/Modal';
import { FormField } from '../../components/Shared/FormField';
import type { Fee, UpdateFeeDto } from '../../types/fee';
import styles from './FeeEditModal.module.css';

// ── Props ────────────────────────────────────────────────────────────────────

interface FeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: Fee | null;
  onSubmit: (id: string, dto: UpdateFeeDto) => Promise<void>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FeeEditModal({ isOpen, onClose, fee, onSubmit }: FeeEditModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Initialize form when fee changes or modal opens
  useEffect(() => {
    if (fee) {
      setFormData({
        amount: fee.amount.toString(),
        description: fee.description || '',
        dueDate: fee.dueDate.split('T')[0] ?? '',
      });
    }
  }, [fee]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fee) return;

    setSubmitting(true);
    try {
      const dto: UpdateFeeDto = {};
      const amountNum = parseFloat(formData.amount);
      if (!isNaN(amountNum) && amountNum > 0) dto.amount = amountNum;
      if (formData.description) dto.description = formData.description;
      if (formData.dueDate) dto.dueDate = formData.dueDate;

      await onSubmit(fee.id, dto);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Editar Cuota"
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
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          label="Monto"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
        />
        <FormField
          label="Fecha de Vencimiento"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => handleChange('dueDate', e.target.value)}
        />
        <FormField
          label="Descripción"
          as="textarea"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descripción de la cuota"
        />
      </form>
    </Modal>
  );
}
