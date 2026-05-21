/* =============================================================================
   SaaS Inmobiliario — Fee Create Modal
   Modal de creación de cuota con selector de unidad, recurrencia,
   auto-cálculo de montos y campos del formulario.
   ============================================================================= */

import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Modal } from '../../../components/Shared/Modal';
import { FormField } from '../../../components/Shared/FormField';
import { toast } from '../../../stores/toastStore';
import type { CreateFeeDto, FeeType } from '../../../types/fee';
import styles from './FeeCreateModal.module.css';

// ── Constants ───────────────────────────────────────────────────────────────

const RECURRENCE_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMESTERLY: 6,
  YEARLY: 12,
  EXTRAORDINARY: 0,
};

const RECURRENCE_LABELS = {
  MONTHLY: 'Mensual (1 mes)',
  QUARTERLY: 'Trimestral (3 meses)',
  SEMESTERLY: 'Semestral (6 meses)',
  YEARLY: 'Anual (12 meses)',
  EXTRAORDINARY: 'Extraordinaria (monto manual)',
} as const;

// ── Props ────────────────────────────────────────────────────────────────────

interface FeeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Array<{ id: string; identifier: string }>;
  loadingUnits: boolean;
  onSubmit: (dto: CreateFeeDto) => Promise<void>;
  loading: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FeeCreateModal({
  isOpen,
  onClose,
  units,
  loadingUnits,
  onSubmit,
  loading,
}: FeeCreateModalProps) {
  const [formData, setFormData] = useState({
    unitId: '',
    amount: '',
    description: '',
    period: '',
    dueDate: '',
    feeType: 'PERIODIC' as FeeType,
  });

  const [selectedUnitDetails, setSelectedUnitDetails] = useState<{
    monthlyFeeAmount: number;
    propertyName: string;
    identifier: string;
  } | null>(null);

  const [currentResident, setCurrentResident] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  const [internalLoadingUnitDetails, setInternalLoadingUnitDetails] = useState(false);

  const [recurrence, setRecurrence] = useState<
    'MONTHLY' | 'QUARTERLY' | 'SEMESTERLY' | 'YEARLY' | 'EXTRAORDINARY'
  >('MONTHLY');

  // ── Reset form when modal opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setFormData({
        unitId: '',
        amount: '',
        description: '',
        period: '',
        dueDate: '',
        feeType: 'PERIODIC',
      });
      setSelectedUnitDetails(null);
      setCurrentResident(null);
      setRecurrence('MONTHLY');
    }
  }, [isOpen]);

  // ── Auto-calculate amount, period, and dueDate when unit or recurrence changes ──
  useEffect(() => {
    if (!selectedUnitDetails || recurrence === 'EXTRAORDINARY') {
      return;
    }

    const months = RECURRENCE_MONTHS[recurrence] || 1;
    const calculatedAmount =
      selectedUnitDetails.monthlyFeeAmount * months * 100;
    const roundedAmount = Math.round(calculatedAmount) / 100;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${currentYear}-${currentMonth}`;

    // Due date: first day of next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dueDate = nextMonth.toISOString().split('T')[0];

    setFormData((prev) => ({
      ...prev,
      amount: roundedAmount.toString(),
      period: period!,
      dueDate: dueDate!,
    }));
  }, [selectedUnitDetails, recurrence]);

  // ── Fetch unit details when a unit is selected ───────────────────────────
  const fetchUnitDetails = async (unitId: string) => {
    setInternalLoadingUnitDetails(true);
    try {
      const unitRes = await api.get(`/units/${unitId}`);
      const unitData = unitRes.data;
      setSelectedUnitDetails({
        monthlyFeeAmount: unitData.monthlyFeeAmount || 0,
        propertyName: unitData.property?.name || '',
        identifier: unitData.identifier || '',
      });

      // Fetch current active occupancy
      try {
        const occRes = await api.get('/occupancies', {
          params: { unitId, active: true },
        });
        const occData = occRes.data?.data || [];
        if (occData.length > 0) {
          const activeOcc = occData[0];
          setCurrentResident({
            id: activeOcc.resident?.id || '',
            fullName: activeOcc.resident?.fullName || 'Residente activo',
          });
        } else {
          setCurrentResident(null);
        }
      } catch {
        setCurrentResident(null);
      }
    } catch {
      setSelectedUnitDetails(null);
      setCurrentResident(null);
    } finally {
      setInternalLoadingUnitDetails(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'unitId' && value) {
      fetchUnitDetails(value);
    }
  };

  const handleRecurrenceChange = (value: string) => {
    setRecurrence(value as typeof recurrence);
    if (value === 'EXTRAORDINARY') {
      setFormData((prev) => ({
        ...prev,
        amount: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.unitId ||
      !formData.amount ||
      !formData.period ||
      !formData.dueDate
    ) {
      toast.error('Todos los campos obligatorios deben estar llenos');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error('El monto debe ser un número mayor a 0');
      return;
    }

    await onSubmit({
      unitId: formData.unitId,
      amount,
      description: formData.description || undefined,
      period: formData.period,
      dueDate: formData.dueDate,
      feeType: formData.feeType,
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      title="Nueva Cuota"
      onClose={onClose}
      size="lg"
      loading={loading}
      footer={
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Crear Cuota'}
          </button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Unit selector */}
        <div className={styles.formRow}>
          <FormField
            label="Unidad"
            name="unitId"
            as="select"
            value={formData.unitId}
            onChange={(e) => handleFormChange('unitId', e.target.value)}
            required
            options={units.map((u) => ({ value: u.id, label: u.identifier }))}
            placeholder={
              loadingUnits ? 'Cargando...' : 'Selecciona una unidad'
            }
          />
        </div>

        {/* Unit info display */}
        {internalLoadingUnitDetails && (
          <div
            style={{
              padding: '12px',
              background: '#F0F9FF',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#0284C7',
              marginBottom: '12px',
            }}
          >
            Cargando información de la unidad...
          </div>
        )}

        {selectedUnitDetails && !internalLoadingUnitDetails && (
          <div
            style={{
              padding: '12px',
              background: '#F8FAFC',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>
                <strong>Unidad:</strong> {selectedUnitDetails.identifier}
              </span>
              <span>
                <strong>Propiedad:</strong>{' '}
                {selectedUnitDetails.propertyName}
              </span>
              <span>
                <strong>Cuota mensual:</strong> $
                {selectedUnitDetails.monthlyFeeAmount.toLocaleString('es-CO')}
              </span>
              {currentResident && (
                <span>
                  <strong>Residente actual:</strong>{' '}
                  {currentResident.fullName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Recurrence selector and amount */}
        {selectedUnitDetails && !internalLoadingUnitDetails && (
          <>
            <div className={styles.formRow}>
              <FormField
                label="Recurrencia"
                as="select"
                name="recurrence"
                value={recurrence}
                onChange={(e) => handleRecurrenceChange(e.target.value)}
                options={[
                  {
                    value: 'MONTHLY',
                    label: RECURRENCE_LABELS.MONTHLY,
                  },
                  {
                    value: 'QUARTERLY',
                    label: RECURRENCE_LABELS.QUARTERLY,
                  },
                  {
                    value: 'SEMESTERLY',
                    label: RECURRENCE_LABELS.SEMESTERLY,
                  },
                  {
                    value: 'YEARLY',
                    label: RECURRENCE_LABELS.YEARLY,
                  },
                  {
                    value: 'EXTRAORDINARY',
                    label: RECURRENCE_LABELS.EXTRAORDINARY,
                  },
                ]}
              />
              {recurrence !== 'EXTRAORDINARY' && (
                <FormField
                  label="Monto Total"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  required
                />
              )}
            </div>

            {recurrence !== 'EXTRAORDINARY' && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#F0FDF4',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#166534',
                  marginBottom: '12px',
                  border: '1px solid #BBF7D0',
                }}
              >
                <strong>Cálculo:</strong> $
                {selectedUnitDetails.monthlyFeeAmount.toLocaleString(
                  'es-CO'
                )}{' '}
                × {RECURRENCE_MONTHS[recurrence]} mes(es) ={' '}
                <strong>
                  $
                  {formData.amount
                    ? parseFloat(formData.amount).toLocaleString('es-CO')
                    : '0'}
                </strong>
              </div>
            )}
          </>
        )}

        {recurrence === 'EXTRAORDINARY' && (
          <div className={styles.formRow}>
            <FormField
              label="Monto"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              required
            />
          </div>
        )}

        {/* Period and due date */}
        <div className={styles.formRow}>
          <FormField
            label="Periodo (YYYY-MM)"
            name="period"
            value={formData.period}
            onChange={(e) => handleFormChange('period', e.target.value)}
            placeholder="2026-05"
            required
          />
          <FormField
            label="Fecha de Vencimiento"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleFormChange('dueDate', e.target.value)}
            required
          />
        </div>

        {/* Fee type and description */}
        <FormField
          label="Tipo de Cuota"
          as="select"
          name="feeType"
          value={formData.feeType}
          onChange={(e) => handleFormChange('feeType', e.target.value)}
          options={[
            { value: 'PERIODIC', label: 'Periódica' },
            { value: 'EXTRAORDINARY', label: 'Extraordinaria' },
            { value: 'ADJUSTMENT', label: 'Ajuste' },
          ]}
        />
        <FormField
          label="Descripción"
          as="textarea"
          name="description"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Descripción de la cuota (opcional)"
        />
      </form>
    </Modal>
  );
}
