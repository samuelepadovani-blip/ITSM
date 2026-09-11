import React, { useState } from 'react';
import { AssetInfo, AssetCategory } from '../types';
import { 
  X, 
  Plus, 
  Server, 
  Layers, 
  MapPin, 
  ShieldAlert, 
  Tag, 
  Cpu, 
  CheckCircle2, 
  Hash, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: (newAsset: AssetInfo) => void;
  existingAreas: string[];
  initialArea?: string;
  existingAssetIds: string[];
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
  existingAreas,
  initialArea,
  existingAssetIds,
}) => {
  const [assetId, setAssetId] = useState('');
  const [name, setName] = useState('');
  const [selectedArea, setSelectedArea] = useState(initialArea || existingAreas[0] || 'Area Gaming & Sala Slot');
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [customAreaName, setCustomAreaName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Gaming & Cassa');
  const [assignedTechnician, setAssignedTechnician] = useState('Benin');
  const [level, setLevel] = useState<'T1' | 'T2'>('T2');
  const [criticality, setCriticality] = useState<'Critica' | 'Alta' | 'Media'>('Alta');
  const [status, setStatus] = useState<'Operativo' | 'In Manutenzione' | 'Guasto / Degradato'>('Operativo');
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-adapt technician when category changes
  const handleCategoryChange = (newCat: AssetCategory) => {
    setCategory(newCat);
    if (newCat === 'Gaming & Cassa') {
      setAssignedTechnician('Benin');
      setLevel('T2');
    } else if (newCat === 'IT & Rete') {
      setAssignedTechnician('Piccirilli');
      setLevel('T1');
    } else if (newCat === 'Facility & Sicurezza') {
      setAssignedTechnician('Padovani');
      setLevel('T2');
    } else if (newCat === 'Food & Beverage') {
      setAssignedTechnician('Ayoub');
      setLevel('T2');
    }
  };

  // Quick prefix helpers for ID
  const applyPrefix = (prefix: string) => {
    const randomNum = Math.floor(Math.random() * 90 + 10);
    setAssetId(`${prefix}${randomNum}`);
    if (prefix.startsWith('SLOT')) {
      handleCategoryChange('Gaming & Cassa');
      setSelectedArea('Area Gaming & Sala Slot');
      setIsCustomArea(false);
    } else if (prefix.startsWith('CAM')) {
      handleCategoryChange('IT & Rete');
      setSelectedArea('Area Sicurezza & TVCC');
      setIsCustomArea(false);
    } else if (prefix.startsWith('CASSA')) {
      handleCategoryChange('Gaming & Cassa');
      setSelectedArea('Area Casse & Reception');
      setIsCustomArea(false);
    } else if (prefix.startsWith('POS')) {
      handleCategoryChange('IT & Rete');
      setSelectedArea('Area Casse & Reception');
      setIsCustomArea(false);
    } else if (prefix.startsWith('BAR')) {
      handleCategoryChange('Food & Beverage');
      setSelectedArea('Area Bar & Ristorazione');
      setIsCustomArea(false);
    } else if (prefix.startsWith('CLIMA')) {
      handleCategoryChange('Facility & Sicurezza');
      setSelectedArea('Area Facility & Impianti');
      setIsCustomArea(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = assetId.trim().toUpperCase();
    if (!cleanId) {
      setError('Inserisci un ID identificativo valido per l\'asset (es. SLOT-VLT-04, CAM-09, POS-06).');
      return;
    }

    // Uniqueness check
    if (existingAssetIds.some(id => id.toUpperCase() === cleanId)) {
      setError(`L'ID identificativo "${cleanId}" è già in uso da un altro asset censito. Scegli un ID univoco.`);
      return;
    }

    if (!name.trim()) {
      setError('Inserisci il nome descrittivo dell\'asset.');
      return;
    }

    const finalArea = isCustomArea ? customAreaName.trim() : selectedArea;
    if (!finalArea) {
      setError('Specificare o selezionare l\'area del centro a cui appartiene l\'asset.');
      return;
    }

    setIsSubmitting(true);

    const newAsset: AssetInfo = {
      id: cleanId,
      name: name.trim(),
      area: finalArea,
      category,
      assignedTechnician,
      level,
      criticality,
      status,
      location: location.trim() || `Presso ${finalArea}`,
      serialNumber: serialNumber.trim() || `SN-${cleanId}`,
      description: description.trim() || `Asset registrato in data ${new Date().toLocaleDateString('it-IT')} per l'area ${finalArea}.`,
    };

    try {
      // Post to backend API
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('Server asset creation warning:', data.error);
      }
    } catch (err) {
      console.warn('Could not persist asset to server, saving locally:', err);
    }

    setIsSubmitting(false);
    onAssetCreated(newAsset);
    onClose();
  };

  return (
    <div 
      id="add-asset-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div 
        id="add-asset-modal-container"
        className="w-full max-w-2xl rounded-2xl border border-[#D4AF37]/50 bg-[#0A1636] shadow-2xl overflow-hidden my-6 ring-1 ring-[#D4AF37]/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A3166] bg-[#070F26] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-black/40">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Aggiungi Nuovo Asset Censito
                <span className="text-[11px] font-semibold text-[#F3C64F] px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                  ID Univoco & Area
                </span>
              </h2>
              <p className="text-xs text-blue-300/70">
                Registra un nuovo dispositivo o postazione con il rispettivo codice identificativo e collocazione d'area.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-blue-300 hover:bg-[#0E1F4B] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick ID Prefixes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/80 block">
              Generazione Rapida Prefisso ID Identificativo:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'SLOT- (Gaming)', prefix: 'SLOT-VLT-' },
                { label: 'SLOT-AWP-', prefix: 'SLOT-AWP-' },
                { label: 'CAM- (Telecamere)', prefix: 'CAM-' },
                { label: 'POS- (Pagamenti)', prefix: 'POS-' },
                { label: 'CASSA- (Casse)', prefix: 'CASSA-' },
                { label: 'BAR- (Ristorazione)', prefix: 'BAR-' },
                { label: 'CLIMA- (Facility)', prefix: 'CLIMA-UTA-' },
                { label: 'SRV- (Server)', prefix: 'SRV-' },
              ].map(p => (
                <button
                  key={p.prefix}
                  type="button"
                  onClick={() => applyPrefix(p.prefix)}
                  className="rounded-lg bg-[#0E1F4B] hover:bg-[#D4AF37]/20 border border-[#1A3166] hover:border-[#D4AF37]/50 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-200 hover:text-[#F3C64F] transition active:scale-95"
                >
                  +{p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: ID and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-[#F3C64F]" />
                <span>ID Asset Identificativo *</span>
              </label>
              <input
                id="input-asset-id"
                type="text"
                required
                value={assetId}
                onChange={(e) => setAssetId(e.target.value.toUpperCase())}
                placeholder="Es. SLOT-VLT-04, CAM-09, POS-06"
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3C64F] uppercase tracking-wider placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              />
              <span className="text-[10px] text-blue-300/60 block">
                Codice univoco visibile sull'etichetta dell'asset.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#F3C64F]" />
                <span>Nome Descrittivo Asset *</span>
              </label>
              <input
                id="input-asset-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Slot VLT Novomatic Postazione 4"
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              />
            </div>
          </div>

          {/* Row 2: Area and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#F3C64F]" />
                <span>Area del Centro Operativo *</span>
              </label>
              <select
                id="select-asset-area"
                value={isCustomArea ? '__custom__' : selectedArea}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomArea(true);
                  } else {
                    setIsCustomArea(false);
                    setSelectedArea(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                {existingAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
                <option value="__custom__">➕ Crea Nuova Area personalizzata...</option>
              </select>

              {isCustomArea && (
                <input
                  type="text"
                  required
                  value={customAreaName}
                  onChange={(e) => setCustomAreaName(e.target.value)}
                  placeholder="Digita il nome della nuova area (es. Area Prive VIP)"
                  className="w-full mt-2 rounded-xl border border-[#D4AF37]/50 bg-[#070F24] px-3.5 py-2 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#F3C64F]" />
                <span>Categoria ITSM *</span>
              </label>
              <select
                id="select-asset-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="Gaming & Cassa">Gaming & Cassa (Benin - T2)</option>
                <option value="IT & Rete">IT & Rete (Piccirilli - T1/Coord.)</option>
                <option value="Facility & Sicurezza">Facility & Sicurezza (Padovani - T2)</option>
                <option value="Food & Beverage">Food & Beverage (Ayoub - T2)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Technician Assignment, Level, Criticality, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Tecnico Assegnato:</label>
              <select
                value={assignedTechnician}
                onChange={(e) => setAssignedTechnician(e.target.value)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="Benin">Benin</option>
                <option value="Piccirilli">Piccirilli</option>
                <option value="Padovani">Padovani</option>
                <option value="Ayoub">Ayoub</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Livello Supporto:</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as 'T1' | 'T2')}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="T1">T1 (Triage/IT)</option>
                <option value="T2">T2 (Specialista)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Criticità:</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as 'Critica' | 'Alta' | 'Media')}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="Critica">Critica (P1)</option>
                <option value="Alta">Alta (P2)</option>
                <option value="Media">Media (P3)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Stato Operativo:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="Operativo">🟢 Operativo</option>
                <option value="In Manutenzione">🟡 In Manutenzione</option>
                <option value="Guasto / Degradato">🔴 Guasto / Bloccato</option>
              </select>
            </div>
          </div>

          {/* Row 4: Specific Location and Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Posizione Specifica nel Locale:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Es. Fila Slot A, Posto 4 / Sottobanco cassa"
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Matricola / Serial Number:</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Es. SN-2024-9981 o MAC 00:1A:2B..."
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2 text-xs text-white font-mono placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Technical Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white block">Descrizione Tecnica e Specifiche:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifiche tecniche (modello scheda, display, gettoniera, alimentazione, porte di rete...)"
              className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] p-3 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A3166]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] px-4 py-2.5 text-xs font-semibold text-blue-200 hover:text-white hover:bg-[#162a63] transition"
            >
              Annulla
            </button>
            <button
              id="btn-submit-add-asset"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 px-5 py-2.5 text-xs font-bold text-[#070F26] shadow-lg shadow-[#D4AF37]/20 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Salvataggio...' : 'Censisci & Inserisci Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
