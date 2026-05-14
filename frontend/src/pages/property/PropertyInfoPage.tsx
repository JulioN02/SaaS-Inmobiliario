/* =============================================================================
    SaaS Inmobiliario — Property Info Page (Full Page)
    Muestra el detalle de una propiedad con sus torres y unidades
    ============================================================================= */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyStore } from '../../stores/propertyStore';
import { useTowerStore } from '../../stores/towerStore';
import { useUnitStore } from '../../stores/unitStore';
import { toast } from '../../stores/toastStore';
import type { Property, Tower, Unit, PropertyType, UnitType, UnitStatus } from '../../types/property';
import { StatusBadge, unitStatusVariant } from '../../components/Shared/StatusBadge';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import styles from './PropertyInfoPage.module.css';
import { PropertyDetailPage } from './PropertyDetailPage';

// ── Helpers ────────────────────────────────────────────────────────────────────

const propertyTypeLabels: Record<PropertyType, string> = {
  CONJUNTO: 'Conjunto',
  EDIFICIO: 'Edificio',
  TORRE: 'Torre',
  CASA_INDEPENDIENTE: 'Casa Independiente',
};

const unitTypeLabels: Record<UnitType, string> = {
  APARTMENT: 'Apartamento',
  HOUSE: 'Casa',
  COMMERCIAL: 'Local',
  PARKING: 'Parqueadero',
};

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ── Componente principal ────────────────────────────────────────────────────

export function PropertyInfoPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  
  const { selectedProperty, fetchPropertyById, deleteProperty } = usePropertyStore();
  const { towers, fetchTowers, createTower, updateTower, deleteTower } = useTowerStore();
  const { units, fetchUnits, createUnit, updateUnit, deleteUnit } = useUnitStore();

  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTowerModal, setShowTowerModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingTower, setEditingTower] = useState<Tower | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'property' | 'tower' | 'unit'; item: Property | Tower | Unit } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar propiedad al montar
  useEffect(() => {
    if (propertyId) {
      setLoading(true);
      fetchPropertyById(propertyId).finally(() => setLoading(false));
    }
  }, [propertyId]);

  // Cargar torres cuando cambia propertyId
  useEffect(() => {
    if (propertyId) {
      fetchTowers({ propertyId, page: 1, limit: 50 });
    }
  }, [propertyId]);

  // Cargar unidades cuando cambia propertyId
  useEffect(() => {
    if (propertyId) {
      fetchUnits({ propertyId, page: 1, limit: 50 });
    }
  }, [propertyId]);

  // ── Manejadores ─────────────────────────────────────────��────────────────

  // Editar propiedad
  const handleEditProperty = () => setShowEditModal(true);

  // Eliminar propiedad
  const handleDeleteProperty = () => {
    if (selectedProperty) {
      setDeleteConfirm({ type: 'property', item: selectedProperty });
    }
  };

  // Crear torre
  const handleCreateTower = () => {
    setEditingTower(null);
    setShowTowerModal(true);
  };

  // Editar torre
  const handleEditTower = (tower: Tower) => {
    setEditingTower(tower);
    setShowTowerModal(true);
  };

  // Eliminar torre
  const handleDeleteTower = (tower: Tower) => {
    setDeleteConfirm({ type: 'tower', item: tower });
  };

  // Crear unidad
  const handleCreateUnit = () => {
    setEditingUnit(null);
    setShowUnitModal(true);
  };

  // Editar unidad
  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowUnitModal(true);
  };

  // Eliminar unidad
  const handleDeleteUnit = (unit: Unit) => {
    setDeleteConfirm({ type: 'unit', item: unit });
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'property') {
        await deleteProperty((deleteConfirm.item as Property).id);
        toast.success('Propiedad eliminada');
        navigate('/properties');
      } else if (deleteConfirm.type === 'tower') {
        await deleteTower((deleteConfirm.item as Tower).id);
        toast.success('Torre eliminada');
        // Recargar torres
        if (propertyId) fetchTowers({ propertyId, page: 1, limit: 50 });
      } else if (deleteConfirm.type === 'unit') {
        await deleteUnit((deleteConfirm.item as Unit).id);
        toast.success('Unidad eliminada');
        // Recargar unidades
        if (propertyId) fetchUnits({ propertyId, page: 1, limit: 50 });
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setDeleteConfirm(null);
      setDeleting(false);
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  // ── Guardar torre ───────────────────────────────────────────────────────

  const handleSaveTower = async (data: { name: string; floorsCount: number }) => {
    try {
      if (editingTower) {
        await updateTower(editingTower.id, { name: data.name, floorsCount: data.floorsCount });
        toast.success('Torre actualizada');
      } else if (propertyId) {
        await createTower({ propertyId, name: data.name, floorsCount: data.floorsCount });
        toast.success('Torre creada');
      }
      setShowTowerModal(false);
      setEditingTower(null);
      // Recargar torres
      if (propertyId) fetchTowers({ propertyId, page: 1, limit: 50 });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  // ── Guardar unidad ───────────────────────────────────────────────────────

  const handleSaveUnit = async (data: {
    identifier: string;
    unitType: UnitType;
    floor: number;
    status?: UnitStatus;
    monthlyFeeAmount?: number;
    towerId?: string;
  }) => {
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, { ...data, towerId: data.towerId || undefined });
        toast.success('Unidad actualizada');
      } else if (propertyId) {
        await createUnit({
          propertyId,
          towerId: data.towerId || undefined,
          identifier: data.identifier,
          unitType: data.unitType,
          floor: data.floor,
          monthlyFeeAmount: data.monthlyFeeAmount || undefined,
        });
        toast.success('Unidad creada');
      }
      setShowUnitModal(false);
      setEditingUnit(null);
      // Recargar unidades
      if (propertyId) fetchUnits({ propertyId, page: 1, limit: 50 });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando propiedad...</div>
      </div>
    );
  }

  // No encontrada
  if (!selectedProperty) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>Propiedad no encontrada</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <button className={styles.backButton} onClick={() => navigate('/properties')}>
            ← Volver
          </button>
          <h1 className={styles.title}>{selectedProperty.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.editButton} onClick={handleEditProperty}>
            ✏️ Editar
          </button>
          <button className={styles.deleteButton} onClick={handleDeleteProperty}>
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {/* ── Info de propiedad ───────────────────────────────────────────────────── */}
      <div className={styles.infoSection}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Tipo:</span>
          <StatusBadge variant={
            selectedProperty.propertyType === 'CONJUNTO' ? 'info' :
            selectedProperty.propertyType === 'EDIFICIO' ? 'success' :
            selectedProperty.propertyType === 'TORRE' ? 'warning' : 'neutral'
          }>
            {propertyTypeLabels[selectedProperty.propertyType]}
          </StatusBadge>
        </div>
        {selectedProperty.address && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Dirección:</span>
            <span>{selectedProperty.address}</span>
          </div>
        )}
        {selectedProperty.description && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Descripción:</span>
            <span>{selectedProperty.description}</span>
          </div>
        )}
      </div>

      {/* ── Torres ──────────────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Torres ({towers.length})</h2>
          <button className={styles.createButton} onClick={handleCreateTower}>
            + Nueva Torre
          </button>
        </div>
        
        {towers.length === 0 ? (
          <div className={styles.emptySection}>No hay torres registradas</div>
        ) : (
          <div className={styles.list}>
            {towers.map((tower) => (
              <div key={tower.id} className={styles.listItem}>
                <div className={styles.listItemInfo}>
                  <span className={styles.listItemName}>{tower.name}</span>
                  <span className={styles.listItemMeta}>{tower.floorsCount} pisos</span>
                </div>
                <div className={styles.listItemActions}>
                  <button className={styles.iconButton} onClick={() => handleEditTower(tower)}>
                    ✏️
                  </button>
                  <button className={styles.dangerButton} onClick={() => handleDeleteTower(tower)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Unidades ──────────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Unidades ({units.length})</h2>
          <button className={styles.createButton} onClick={handleCreateUnit}>
            + Nueva Unidad
          </button>
        </div>
        
        {units.length === 0 ? (
          <div className={styles.emptySection}>No hay unidades registradas</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Identificador</th>
                <th>Tipo</th>
                <th>Piso</th>
                <th>Torre</th>
                <th>Estado</th>
                <th>Mensualidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.identifier}</td>
                  <td>{unitTypeLabels[unit.unitType]}</td>
                  <td>{unit.floor}</td>
                  <td>{unit.towerId ? towers.find(t => t.id === unit.towerId)?.name || '-' : '-'}</td>
                  <td>
                    <StatusBadge variant={unitStatusVariant(unit.status)}>
                      {unit.status === 'AVAILABLE' ? 'Disponible' : unit.status === 'OCCUPIED' ? 'Ocupada' : 'Mantenimiento'}
                    </StatusBadge>
                  </td>
                  <td>{formatCurrency(unit.monthlyFeeAmount)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconButton} onClick={() => handleEditUnit(unit)}>
                        ✏️
                      </button>
                      <button className={styles.dangerButton} onClick={() => handleDeleteUnit(unit)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal editar propiedad ──────────────────────────────────────── */}
      {showEditModal && (
        <PropertyDetailPage
          property={selectedProperty}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            if (propertyId) fetchPropertyById(propertyId);
          }}
        />
      )}

      {/* ── Modal Torre ────────────────────────────────────────────────── */}
      {showTowerModal && (
        <TowerFormModal
          tower={editingTower}
          onClose={() => { setShowTowerModal(false); setEditingTower(null); }}
          onSave={handleSaveTower}
        />
      )}

      {/* ── Modal Unidad ────────────────────────────────────────────────── */}
      {showUnitModal && (
        <UnitFormModal
          unit={editingUnit}
          towers={towers}
          onClose={() => { setShowUnitModal(false); setEditingUnit(null); }}
          onSave={handleSaveUnit}
        />
      )}

      {/* ── ConfirmDialog ───────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={
          deleteConfirm?.type === 'property' ? 'Eliminar Propiedad' :
          deleteConfirm?.type === 'tower' ? 'Eliminar Torre' : 'Eliminar Unidad'
        }
        message={
          deleteConfirm?.type === 'property' 
            ? `¿Estás seguro de eliminar "${(deleteConfirm.item as Property).name}"? Se eliminarán todas las torres y unidades.` :
          deleteConfirm?.type === 'tower'
            ? `¿Estás seguro de eliminar la torre "${(deleteConfirm.item as Tower).name}"?` :
          deleteConfirm
            ? `¿Estás seguro de eliminar la unidad "${(deleteConfirm.item as Unit).identifier}"?`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />
    </div>
  );
}

// ── Modal Formulario de Torre ───────────────────────────────────────────────

interface TowerFormModalProps {
  tower: Tower | null;
  onClose: () => void;
  onSave: (data: { name: string; floorsCount: number }) => Promise<void>;
}

function TowerFormModal({ tower, onClose, onSave }: TowerFormModalProps) {
  const [name, setName] = useState(tower?.name || '');
  const [floorsCount, setFloorsCount] = useState(tower?.floorsCount || 1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), floorsCount });
    setSaving(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{tower ? 'Editar Torre' : 'Nueva Torre'}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.field}>
            <label>Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Torre A"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Número de pisos *</label>
            <input
              type="number"
              value={floorsCount}
              onChange={e => setFloorsCount(parseInt(e.target.value) || 1)}
              min="1"
              max="100"
              required
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={saving}>
              {saving ? 'Guardando...' : tower ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Formulario de Unidad ────────────────────────────────────────────────

interface UnitFormModalProps {
  unit: Unit | null;
  towers: Tower[];
  onClose: () => void;
  onSave: (data: {
    identifier: string;
    unitType: UnitType;
    floor: number;
    status?: UnitStatus;
    monthlyFeeAmount?: number;
    towerId?: string;
  }) => Promise<void>;
}

function UnitFormModal({ unit, towers, onClose, onSave }: UnitFormModalProps) {
  const [identifier, setIdentifier] = useState(unit?.identifier || '');
  const [unitType, setUnitType] = useState<UnitType>(unit?.unitType || 'APARTMENT');
  const [floor, setFloor] = useState(unit?.floor || 1);
  const [status, setStatus] = useState<UnitStatus>(unit?.status || 'AVAILABLE');
  const [monthlyFeeAmount, setMonthlyFeeAmount] = useState(unit?.monthlyFeeAmount || 0);
  const [towerId, setTowerId] = useState(unit?.towerId || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setSaving(true);
    await onSave({
      identifier: identifier.trim(),
      unitType,
      floor,
      status: unit ? status : undefined,
      monthlyFeeAmount: monthlyFeeAmount || undefined,
      towerId: towerId || undefined,
    });
    setSaving(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{unit ? 'Editar Unidad' : 'Nueva Unidad'}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.field}>
            <label>Identificador *</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Ej: 101, Apto 2A"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Tipo *</label>
            <select value={unitType} onChange={e => setUnitType(e.target.value as UnitType)}>
              <option value="APARTMENT">Apartamento</option>
              <option value="HOUSE">Casa</option>
              <option value="COMMERCIAL">Local</option>
              <option value="PARKING">Parqueadero</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Piso *</label>
            <input
              type="number"
              value={floor}
              onChange={e => setFloor(parseInt(e.target.value) || 1)}
              min="0"
              max="100"
              required
            />
          </div>
          {towers.length > 0 && (
            <div className={styles.field}>
              <label>Torre</label>
              <select value={towerId} onChange={e => setTowerId(e.target.value)}>
                <option value="">Sin torre</option>
                {towers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {unit && (
            <div className={styles.field}>
              <label>Estado</label>
              <select value={status} onChange={e => setStatus(e.target.value as UnitStatus)}>
                <option value="AVAILABLE">Disponible</option>
                <option value="OCCUPIED">Ocupada</option>
                <option value="MAINTENANCE">Mantenimiento</option>
              </select>
            </div>
          )}
          <div className={styles.field}>
            <label>Valor Mensual</label>
            <input
              type="number"
              value={monthlyFeeAmount}
              onChange={e => setMonthlyFeeAmount(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitButton} disabled={saving}>
              {saving ? 'Guardando...' : unit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}