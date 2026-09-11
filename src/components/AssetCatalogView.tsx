import React, { useState, useEffect, useMemo } from 'react';
import { AssetInfo, AssetCategory } from '../types';
import { ASSET_CATALOG, ASSET_AREAS, AssetAreaInfo } from '../data/itsmData';
import { AddAssetModal } from './AddAssetModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Gamepad2, 
  CreditCard, 
  Coffee, 
  ShieldCheck, 
  Server, 
  Building2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Tag, 
  MapPin, 
  Hash, 
  Cpu, 
  LayoutGrid, 
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';

interface AssetCatalogViewProps {
  onReportIssueForAsset?: (asset: AssetInfo) => void;
  currentUser?: any;
}

export const AssetCatalogView: React.FC<AssetCatalogViewProps> = ({
  onReportIssueForAsset,
  currentUser,
}) => {
  // Master asset list, initialized from ASSET_CATALOG and synced with server
  const [assets, setAssets] = useState<AssetInfo[]>(() => {
    const saved = localStorage.getItem('itsm_custom_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge unique by ID
          const map = new Map<string, AssetInfo>();
          ASSET_CATALOG.forEach(a => map.set(a.id, a));
          parsed.forEach(a => map.set(a.id, a));
          return Array.from(map.values());
        }
      } catch (e) {
        console.error('Failed to parse cached assets:', e);
      }
    }
    return ASSET_CATALOG;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialArea, setModalInitialArea] = useState<string | undefined>(undefined);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch from server on mount
  useEffect(() => {
    const fetchServerAssets = async () => {
      try {
        const res = await fetch('/api/assets');
        if (res.ok) {
          const data = await res.json();
          if (data.assets && Array.isArray(data.assets)) {
            setAssets(prev => {
              const map = new Map<string, AssetInfo>();
              prev.forEach(a => map.set(a.id, a));
              data.assets.forEach((a: AssetInfo) => map.set(a.id, a));
              const merged = Array.from(map.values());
              localStorage.setItem('itsm_custom_assets', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (e) {
        // Fallback to local
      }
    };
    fetchServerAssets();
  }, []);

  // Save changes locally
  const persistAssets = (updated: AssetInfo[]) => {
    setAssets(updated);
    try {
      localStorage.setItem('itsm_custom_assets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not cache assets:', e);
    }
  };

  // Distinct areas from known areas + current assets
  const distinctAreas = useMemo(() => {
    const areaSet = new Set<string>();
    ASSET_AREAS.forEach(a => areaSet.add(a.name));
    assets.forEach(a => {
      if (a.area) areaSet.add(a.area);
    });
    return Array.from(areaSet);
  }, [assets]);

  // Existing IDs for uniqueness validation
  const existingAssetIds = useMemo(() => {
    return assets.map(a => a.id);
  }, [assets]);

  // Helper to get area icon & colors
  const getAreaMeta = (areaName: string) => {
    const found = ASSET_AREAS.find(a => a.name.toLowerCase() === areaName.toLowerCase());
    if (found) return found;

    if (areaName.toLowerCase().includes('gaming') || areaName.toLowerCase().includes('slot')) {
      return ASSET_AREAS[0];
    } else if (areaName.toLowerCase().includes('cassa') || areaName.toLowerCase().includes('reception') || areaName.toLowerCase().includes('pos')) {
      return ASSET_AREAS[1];
    } else if (areaName.toLowerCase().includes('bar') || areaName.toLowerCase().includes('food') || areaName.toLowerCase().includes('ristorante')) {
      return ASSET_AREAS[2];
    } else if (areaName.toLowerCase().includes('sicurezza') || areaName.toLowerCase().includes('tvcc') || areaName.toLowerCase().includes('telecamera')) {
      return ASSET_AREAS[3];
    } else if (areaName.toLowerCase().includes('server') || areaName.toLowerCase().includes('it') || areaName.toLowerCase().includes('rete')) {
      return ASSET_AREAS[4];
    }
    return ASSET_AREAS[5]; // Facility default
  };

  const renderAreaIcon = (iconName: string, className = 'h-4 w-4') => {
    switch (iconName) {
      case 'Gamepad2': return <Gamepad2 className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Server': return <Server className={className} />;
      default: return <Building2 className={className} />;
    }
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Area filter
      if (selectedAreaFilter !== 'all' && asset.area !== selectedAreaFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'all' && asset.category !== selectedCategoryFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all') {
        const currentStatus = asset.status || 'Operativo';
        if (currentStatus !== selectedStatusFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = asset.id.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        const matchArea = (asset.area || '').toLowerCase().includes(q);
        const matchTech = (asset.assignedTechnician || '').toLowerCase().includes(q);
        const matchSerial = (asset.serialNumber || '').toLowerCase().includes(q);
        const matchLocation = (asset.location || '').toLowerCase().includes(q);
        const matchDesc = (asset.description || '').toLowerCase().includes(q);
        return matchId || matchName || matchArea || matchTech || matchSerial || matchLocation || matchDesc;
      }
      return true;
    });
  }, [assets, selectedAreaFilter, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  // Group assets by area
  const groupedByArea = useMemo(() => {
    const groups: { [areaName: string]: AssetInfo[] } = {};
    
    // Maintain standard area ordering first
    ASSET_AREAS.forEach(area => {
      groups[area.name] = [];
    });

    filteredAssets.forEach(asset => {
      const area = asset.area || 'Area Facility & Impianti';
      if (!groups[area]) {
        groups[area] = [];
      }
      groups[area].push(asset);
    });

    // Remove empty groups if area filter is applied or if user is searching
    return Object.entries(groups).filter(([_, list]) => list.length > 0 || selectedAreaFilter === 'all');
  }, [filteredAssets, selectedAreaFilter]);

  // Handle Add Asset
  const handleAssetCreated = (newAsset: AssetInfo) => {
    const updated = [newAsset, ...assets];
    persistAssets(updated);
    setSuccessToast(`Asset #${newAsset.id} ("${newAsset.name}") aggiunto con successo nell'${newAsset.area}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Open modal with specific area preselected
  const handleOpenAddModalForArea = (areaName?: string) => {
    setModalInitialArea(areaName);
    setIsAddModalOpen(true);
  };

  // Quick count calculations
  const totalAssets = assets.length;
  const operativeCount = assets.filter(a => (a.status || 'Operativo') === 'Operativo').length;
  const maintenanceCount = assets.filter(a => a.status === 'In Manutenzione').length;
  const errorCount = assets.filter(a => a.status === 'Guasto / Degradato').length;

  return (
    <div id="asset-catalog-view-root" className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#D4AF37] bg-[#070F26] p-4 text-white shadow-2xl ring-1 ring-[#D4AF37]/50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F3C64F] text-[#070F26] font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#F3C64F]">Nuovo Asset Censito</p>
            <p className="text-xs text-blue-200">{successToast}</p>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-bold text-[#F3C64F] mb-2.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Inventario ITSM & Mappatura Aree Operative</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Gestione Asset per Aree & ID Univoci</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-blue-300/80 max-w-3xl leading-relaxed">
              Censimento completo di tutti gli apparati del centro operativo suddivisi per area: slot machine con ID individuale,
              telecamere TVCC, postazioni cassa Glory, terminali POS, server di sala e impianti tecnologici.
            </p>
          </div>

          {/* Primary Action Button: Add Asset */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-open-add-asset-modal"
              onClick={() => handleOpenAddModalForArea()}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 px-5 py-3 text-xs font-black text-[#070F26] shadow-lg shadow-[#D4AF37]/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Aggiungi Nuovo Asset</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1A3166]/80">
          <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#F3C64F] border border-[#D4AF37]/30">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-300/70">Totale Asset Censiti</p>
              <p className="text-lg font-black text-white font-mono">{totalAssets}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-300/70">Operativi al 100%</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{operativeCount}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-300/70">In Manutenzione</p>
              <p className="text-lg font-black text-yellow-400 font-mono">{maintenanceCount}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-300/70">Segnalati / Guasti</p>
              <p className="text-lg font-black text-red-400 font-mono">{errorCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Area Filter Chips, View Toggle */}
      <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636]/90 p-4 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/60" />
            <input
              id="input-asset-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per ID (es. SLOT-VLT-01, CAM-01, POS-01), nome, matricola o tecnico..."
              className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] pl-10 pr-4 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white text-xs px-1.5 py-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#1A3166] bg-[#070F24] p-1 shrink-0">
            <button
              id="view-mode-grouped"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'grouped'
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Vista per Aree</span>
            </button>
            <button
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabella Completa</span>
            </button>
          </div>
        </div>

        {/* Filter Chips by Area */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-blue-300/60 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Aree:
          </span>
          <button
            onClick={() => setSelectedAreaFilter('all')}
            className={`rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
              selectedAreaFilter === 'all'
                ? 'bg-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-[#D4AF37]/20'
                : 'bg-[#0E1F4B] text-blue-200 border border-[#1A3166] hover:bg-[#152c66] hover:text-white'
            }`}
          >
            Tutte le Aree ({assets.length})
          </button>
          {distinctAreas.map(area => {
            const count = assets.filter(a => a.area === area).length;
            const meta = getAreaMeta(area);
            const isSelected = selectedAreaFilter === area;
            return (
              <button
                key={area}
                onClick={() => setSelectedAreaFilter(isSelected ? 'all' : area)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3C64F] text-[#070F26] font-bold shadow'
                    : 'bg-[#0E1F4B] text-blue-200 border border-[#1A3166] hover:border-[#D4AF37]/40 hover:text-white'
                }`}
              >
                {renderAreaIcon(meta.iconName, 'h-3.5 w-3.5')}
                <span>{area}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#070F26] text-[#F3C64F]' : 'bg-[#070F24] text-blue-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: GROUPED BY AREA */}
      {viewMode === 'grouped' && (
        <div className="space-y-8">
          {groupedByArea.map(([areaName, areaAssets]) => {
            const areaMeta = getAreaMeta(areaName);
            if (areaAssets.length === 0 && selectedAreaFilter !== 'all') return null;

            return (
              <section 
                key={areaName}
                id={`area-section-${areaName.replace(/\s+/g, '-').toLowerCase()}`}
                className="rounded-2xl border border-[#1A3166] bg-[#0A1636]/95 overflow-hidden shadow-xl"
              >
                {/* Area Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A3166] bg-[#070F26] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${areaMeta.badgeBorder} ${areaMeta.badgeBg} ${areaMeta.badgeText} shadow-md`}>
                      {renderAreaIcon(areaMeta.iconName, 'h-5 w-5')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white tracking-wide">
                          {areaName}
                        </h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${areaMeta.badgeBorder} ${areaMeta.badgeBg} ${areaMeta.badgeText}`}>
                          {areaAssets.length} asset
                        </span>
                      </div>
                      <p className="text-xs text-blue-300/70 mt-0.5">
                        {areaMeta.description}
                      </p>
                    </div>
                  </div>

                  {/* Add Asset directly to this Area */}
                  <button
                    onClick={() => handleOpenAddModalForArea(areaName)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#1A3166] bg-[#0E1F4B] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 px-3 py-1.5 text-xs font-bold text-blue-200 hover:text-[#F3C64F] transition active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Aggiungi asset in quest'area</span>
                  </button>
                </div>

                {/* Asset Cards Grid */}
                <div className="p-6">
                  {areaAssets.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-[#1A3166] rounded-xl bg-[#070F24]/50">
                      <p className="text-xs text-blue-300/60">Nessun asset trovato con i filtri correnti in questa sezione.</p>
                      <button
                        onClick={() => handleOpenAddModalForArea(areaName)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#F3C64F] hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" /> Aggiungi il primo asset a {areaName}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {areaAssets.map(asset => {
                        const statusColor = 
                          asset.status === 'Guasto / Degradato'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : asset.status === 'In Manutenzione'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                        const critColor = 
                          asset.criticality === 'Critica'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : asset.criticality === 'Alta'
                            ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

                        return (
                          <div
                            key={asset.id}
                            id={`asset-card-${asset.id}`}
                            className="group flex flex-col justify-between rounded-xl border border-[#1A3166] bg-[#070F24] p-4 shadow hover:border-[#D4AF37]/50 hover:shadow-lg hover:shadow-[#D4AF37]/5 transition relative"
                          >
                            <div>
                              {/* Top row: ID badge & status */}
                              <div className="flex items-start justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-lg bg-[#0E1F4B] px-2.5 py-1 text-xs font-mono font-black text-[#F3C64F] border border-[#D4AF37]/40 shadow-sm tracking-wider">
                                    {asset.id}
                                  </span>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${critColor}`}>
                                    {asset.criticality}
                                  </span>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusColor}`}>
                                  {asset.status || 'Operativo'}
                                </span>
                              </div>

                              {/* Asset Name */}
                              <h4 className="text-sm font-extrabold text-white group-hover:text-[#F3C64F] transition leading-snug">
                                {asset.name}
                              </h4>

                              {/* Location in room */}
                              {asset.location && (
                                <p className="text-[11px] text-blue-300/80 flex items-center gap-1.5 mt-1.5">
                                  <MapPin className="h-3 w-3 text-[#D4AF37] shrink-0" />
                                  <span className="truncate">{asset.location}</span>
                                </p>
                              )}

                              {/* Technical Description */}
                              <p className="text-xs text-blue-200/70 mt-2 line-clamp-2 leading-relaxed">
                                {asset.description}
                              </p>
                            </div>

                            {/* Bottom Specs & Technician Info */}
                            <div className="mt-4 pt-3 border-t border-[#1A3166]/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-1 text-blue-300/70 font-mono">
                                <Tag className="h-3 w-3 text-blue-400" />
                                <span className="truncate max-w-[110px]" title={asset.serialNumber || asset.id}>
                                  {asset.serialNumber || `SN-${asset.id}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-blue-300/60">Tecnico:</span>
                                <span className="font-bold text-[#F3C64F] bg-[#0E1F4B] px-1.5 py-0.5 rounded border border-[#1A3166]">
                                  {asset.assignedTechnician} ({asset.level})
                                </span>
                              </div>
                            </div>

                            {/* Quick Action: Report Ticket on this Asset */}
                            {onReportIssueForAsset && (
                              <button
                                onClick={() => onReportIssueForAsset(asset)}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#1A3166] bg-[#0A1636] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/40 py-1.5 text-[11px] font-bold text-blue-200 hover:text-[#F3C64F] transition active:scale-95"
                              >
                                <Wrench className="h-3 w-3 text-[#D4AF37]" />
                                <span>Segnala Guasto su {asset.id}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: COMPLETE DATA TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-blue-200">
              <thead className="bg-[#070F24] text-blue-300 uppercase font-mono border-b border-[#1A3166]">
                <tr>
                  <th className="p-3.5">ID Asset</th>
                  <th className="p-3.5">Nome & Modello</th>
                  <th className="p-3.5">Area Operativa</th>
                  <th className="p-3.5">Ubicazione Specifica</th>
                  <th className="p-3.5">Stato</th>
                  <th className="p-3.5">Tecnico (Livello)</th>
                  <th className="p-3.5">Criticità</th>
                  <th className="p-3.5">Matricola / Serial</th>
                  {onReportIssueForAsset && <th className="p-3.5 text-right">Azione</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A3166] font-sans">
                {filteredAssets.map(asset => {
                  const areaMeta = getAreaMeta(asset.area);
                  const statusColor = 
                    asset.status === 'Guasto / Degradato'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : asset.status === 'In Manutenzione'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                  return (
                    <tr key={asset.id} className="hover:bg-[#0E1F4B]/50 transition">
                      {/* ID Column */}
                      <td className="p-3.5">
                        <span className="rounded-lg bg-[#070F24] px-2.5 py-1 font-mono font-extrabold text-[#F3C64F] border border-[#D4AF37]/40 shadow-sm">
                          {asset.id}
                        </span>
                      </td>

                      {/* Name Column */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs">{asset.name}</div>
                        <div className="text-[11px] text-blue-300/60 truncate max-w-xs">{asset.description}</div>
                      </td>

                      {/* Area Column */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${areaMeta.badgeBorder} ${areaMeta.badgeBg} ${areaMeta.badgeText}`}>
                          {renderAreaIcon(areaMeta.iconName, 'h-3 w-3')}
                          <span>{asset.area}</span>
                        </span>
                      </td>

                      {/* Location Column */}
                      <td className="p-3.5 text-blue-300/80">
                        {asset.location || '—'}
                      </td>

                      {/* Status Column */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                          {asset.status || 'Operativo'}
                        </span>
                      </td>

                      {/* Technician Column */}
                      <td className="p-3.5 font-bold text-[#F3C64F]">
                        {asset.assignedTechnician} ({asset.level})
                      </td>

                      {/* Criticality Column */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asset.criticality === 'Critica'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : asset.criticality === 'Alta'
                            ? 'bg-[#D4AF37]/15 text-[#F3C64F] border border-[#D4AF37]/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {asset.criticality}
                        </span>
                      </td>

                      {/* Serial Column */}
                      <td className="p-3.5 font-mono text-[11px] text-blue-300/70">
                        {asset.serialNumber || `SN-${asset.id}`}
                      </td>

                      {/* Action Column */}
                      {onReportIssueForAsset && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onReportIssueForAsset(asset)}
                            className="rounded-lg bg-[#0E1F4B] hover:bg-[#D4AF37]/20 border border-[#1A3166] hover:border-[#D4AF37]/40 px-2.5 py-1 text-[11px] font-bold text-blue-200 hover:text-[#F3C64F] transition"
                          >
                            Segnala
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAssetCreated={handleAssetCreated}
        existingAreas={distinctAreas}
        initialArea={modalInitialArea}
        existingAssetIds={existingAssetIds}
      />
    </div>
  );
};
