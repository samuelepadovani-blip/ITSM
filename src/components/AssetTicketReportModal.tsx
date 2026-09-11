import React, { useState, useMemo } from 'react';
import { ITSMTicket, AssetInfo } from '../types';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Filter, 
  Search, 
  Layers, 
  Calendar, 
  User, 
  Flame, 
  ArrowRight, 
  TrendingUp, 
  CheckCheck, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Building2, 
  Gamepad2, 
  CreditCard, 
  Coffee, 
  ChevronRight,
  BarChart3,
  ListFilter,
  History,
  Timer
} from 'lucide-react';

interface AssetTicketReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTickets: ITSMTicket[];
  assets: AssetInfo[];
  initialAssetId?: string;
  onAskAI?: (ticket: ITSMTicket) => void;
}

// Calculate elapsed time from createdAt / timestamp
export function getElapsedTime(dateStr?: string, timestampStr?: string): {
  text: string;
  minutesAgo: number;
  formattedDate: string;
} {
  const targetDate = dateStr ? new Date(dateStr) : timestampStr ? new Date(timestampStr) : new Date();
  const now = new Date();
  
  // Safe validation
  const timeMs = isNaN(targetDate.getTime()) ? now.getTime() - 1000 * 60 * 45 : targetDate.getTime();
  const diffMs = Math.max(0, now.getTime() - timeMs);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let text = '';
  if (diffDays > 0) {
    text = `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} e ${diffHours % 24}h fa`;
  } else if (diffHours > 0) {
    text = `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} e ${diffMinutes % 60}m fa`;
  } else {
    text = `${Math.max(1, diffMinutes)} minuti fa`;
  }

  const formattedDate = !isNaN(targetDate.getTime()) 
    ? targetDate.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Data recente';

  return {
    text,
    minutesAgo: diffMinutes,
    formattedDate
  };
}

// Format duration in minutes into a human string
export function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'Meno di 15 min';
  if (minutes < 60) return `${minutes} minuti`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// Match ticket to asset
export function isTicketForAsset(ticket: ITSMTicket, asset: AssetInfo): boolean {
  const assetIdLower = asset.id.toLowerCase();
  const assetNameLower = asset.name.toLowerCase();

  if (ticket.assetId && ticket.assetId.toLowerCase() === assetIdLower) return true;
  if (ticket.asset && ticket.asset.toLowerCase() === assetIdLower) return true;
  if (ticket.asset && (ticket.asset.toLowerCase() === assetNameLower || assetNameLower.includes(ticket.asset.toLowerCase()))) return true;
  if (ticket.userMessage && ticket.userMessage.toLowerCase().includes(assetIdLower)) return true;
  return false;
}

export const AssetTicketReportModal: React.FC<AssetTicketReportModalProps> = ({
  isOpen,
  onClose,
  allTickets,
  assets,
  initialAssetId,
  onAskAI,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId || 'all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'unresolved' | 'resolved' | 'asset_summary'>('unresolved');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initialAssetId when prop changes
  React.useEffect(() => {
    if (initialAssetId) {
      setSelectedAssetId(initialAssetId);
    }
  }, [initialAssetId]);

  if (!isOpen) return null;

  // Distinct areas from assets
  const distinctAreas = Array.from(new Set(assets.map(a => a.area).filter(Boolean)));

  // Selected asset object
  const currentAsset = assets.find(a => a.id === selectedAssetId);

  // Tickets filtered by asset, area, and search query
  const filteredTickets = allTickets.filter(ticket => {
    // Asset filter
    if (selectedAssetId !== 'all') {
      const asset = assets.find(a => a.id === selectedAssetId);
      if (asset && !isTicketForAsset(ticket, asset)) {
        return false;
      }
    }

    // Area filter
    if (selectedArea !== 'all') {
      const asset = assets.find(a => isTicketForAsset(ticket, a));
      if (asset && asset.area !== selectedArea) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = ticket.ticketId.toLowerCase().includes(q);
      const matchAsset = (ticket.asset || '').toLowerCase().includes(q);
      const matchAssetId = (ticket.assetId || '').toLowerCase().includes(q);
      const matchMsg = ticket.userMessage.toLowerCase().includes(q);
      const matchAssignee = (ticket.assignedTo || '').toLowerCase().includes(q);
      const matchAction = (ticket.actionRequired || '').toLowerCase().includes(q);
      const matchResolvedBy = (ticket.resolvedBy || '').toLowerCase().includes(q);
      return matchId || matchAsset || matchAssetId || matchMsg || matchAssignee || matchAction || matchResolvedBy;
    }

    return true;
  });

  // Split into Unresolved and Resolved
  const unresolvedTickets = filteredTickets.filter(t => t.status !== 'Risolto' && t.status !== 'Chiuso');
  const resolvedTickets = filteredTickets.filter(t => t.status === 'Risolto' || t.status === 'Chiuso');

  // Metrics
  const totalCount = filteredTickets.length;
  const unresolvedCount = unresolvedTickets.length;
  const resolvedCount = resolvedTickets.length;

  // Average resolution time in minutes for resolved tickets
  const totalResolvedMinutes = resolvedTickets.reduce((acc, t) => acc + (t.durationMinutes || 35), 0);
  const avgResolutionMinutes = resolvedCount > 0 ? Math.round(totalResolvedMinutes / resolvedCount) : 0;

  // Find asset for a ticket
  const getAssetForTicket = (ticket: ITSMTicket): AssetInfo | undefined => {
    return assets.find(a => isTicketForAsset(ticket, a));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl rounded-2xl border border-[#1A3166] bg-[#070F26] text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#1A3166] bg-[#0A1636] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F3C64F] text-[#070F26] font-extrabold shadow-md shadow-[#D4AF37]/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Report Ticket & Risoluzioni per Asset
                </h2>
                {currentAsset && (
                  <span className="rounded-md bg-[#0E1F4B] border border-[#D4AF37]/40 px-2 py-0.5 text-xs font-mono font-bold text-[#F3C64F]">
                    {currentAsset.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-300/70">
                Monitoraggio dettagliato dei guasti in corso, tempi di attesa, risolutori e storico interventi per apparato.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1A3166] bg-[#0E1F4B] text-blue-300 hover:text-white hover:bg-rose-950/40 hover:border-rose-500/50 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter and Selection Strip */}
        <div className="border-b border-[#1A3166] bg-[#091433] p-4 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Asset Selector */}
            <div>
              <label className="block text-[11px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3 text-[#D4AF37]" /> Seleziona Asset:
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="all">Tutti gli Asset ({assets.length} apparati)</option>
                {assets.map(a => {
                  const resolvedOnThis = allTickets.filter(t => isTicketForAsset(t, a) && (t.status === 'Risolto' || t.status === 'Chiuso')).length;
                  return (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.name} — {resolvedOnThis} risolti
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-[11px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Filter className="h-3 w-3 text-[#D4AF37]" /> Filtra per Area:
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="all">Tutte le Aree Operative</option>
                {distinctAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Free Search */}
            <div>
              <label className="block text-[11px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Search className="h-3 w-3 text-[#D4AF37]" /> Cerca nel Report:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID ticket, tecnico, testo guasto..."
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] pl-8 pr-3 py-2 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-300/50" />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="rounded-xl border border-[#1A3166] bg-[#070F24] px-3 py-2 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <ListFilter className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-blue-300/60 font-semibold">Ticket Totali</p>
                <p className="text-sm font-black text-white font-mono">{totalCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-[#070F24] px-3 py-2 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-amber-300/80 font-semibold">Non Risolti / In Corso</p>
                <p className="text-sm font-black text-amber-400 font-mono">{unresolvedCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-[#070F24] px-3 py-2 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-300/80 font-semibold">Risolti con Successo</p>
                <p className="text-sm font-black text-emerald-400 font-mono">{resolvedCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#070F24] px-3 py-2 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#F3C64F] border border-[#D4AF37]/30">
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#F3C64F]/80 font-semibold">Tempo Medio Risoluzione</p>
                <p className="text-sm font-black text-white font-mono">{formatDuration(avgResolutionMinutes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Non Risolti | Risolti | Riepilogo per Singolo Asset */}
        <div className="flex border-b border-[#1A3166] bg-[#070F24] px-6 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('unresolved')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'unresolved'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Ticket Non Risolti ({unresolvedCount})</span>
            {unresolvedCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-1.5 py-0.2">
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'resolved'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <CheckCheck className="h-4 w-4 text-emerald-400" />
            <span>Ticket Risolti ({resolvedCount})</span>
            {resolvedCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-1.5 py-0.2">
                {resolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('asset_summary')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'asset_summary'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span>Conteggio Risolti per Singolo Asset ({assets.length})</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: UNRESOLVED TICKETS */}
          {activeTab === 'unresolved' && (
            <div className="space-y-4">
              {unresolvedTickets.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#1A3166] rounded-2xl bg-[#0A1636]/40">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-2" />
                  <h4 className="text-sm font-bold text-white">Nessun ticket in attesa di risoluzione</h4>
                  <p className="text-xs text-blue-300/70 mt-1 max-w-sm mx-auto">
                    Tutti gli apparati selezionati sono operativi al 100% o non presentano disservizi aperti con i filtri correnti.
                  </p>
                </div>
              ) : (
                unresolvedTickets.map(ticket => {
                  const targetAsset = getAssetForTicket(ticket);
                  const elapsed = getElapsedTime(ticket.createdAtIso, ticket.timestamp);
                  
                  return (
                    <div
                      key={ticket.ticketId || ticket.id}
                      className="rounded-xl border border-amber-500/30 bg-[#0A1636] p-4 sm:p-5 shadow-lg relative hover:border-amber-500/60 transition"
                    >
                      {/* Top bar: Elapsed time & Assignee */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] pb-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Ticket ID */}
                          <span className="font-mono text-xs font-black text-amber-400 bg-[#070F24] px-2.5 py-1 rounded-lg border border-amber-500/40">
                            #{ticket.ticketId}
                          </span>

                          {/* Elapsed Time Banner */}
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                            <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                            <span>Generato: <strong>{elapsed.text}</strong></span>
                            <span className="text-amber-400/60 font-mono text-[11px]">({elapsed.formattedDate})</span>
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            ticket.status === 'Escalato T3'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : ticket.status === 'In Lavorazione'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>

                        {/* Priority & SLA */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            ticket.priority === 'P1'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : ticket.priority === 'P2'
                              ? 'bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>

                      {/* Main Ticket Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left: Problem & Asset */}
                        <div className="lg:col-span-2 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-wider">
                              Anomalia Segnalata:
                            </span>
                            <p className="text-xs font-semibold text-white mt-0.5 leading-relaxed bg-[#070F24] p-2.5 rounded-lg border border-[#1A3166]">
                              "{ticket.userMessage}"
                            </p>
                          </div>

                          {ticket.actionRequired && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center gap-1">
                                <Wrench className="h-3 w-3" /> Azione Richiesta / Procedura Programmata:
                              </span>
                              <p className="text-xs text-blue-200/90 mt-0.5">
                                {ticket.actionRequired}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right: Asset info & Assignee Card */}
                        <div className="rounded-xl border border-[#1A3166] bg-[#070F24] p-3 space-y-2.5 text-xs">
                          {/* Asset Tag */}
                          <div>
                            <span className="text-[10px] text-blue-300/60 font-semibold block">Asset Coinvolto:</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="rounded bg-[#0E1F4B] text-[#F3C64F] font-mono font-bold px-1.5 py-0.5 text-[11px] border border-[#D4AF37]/30">
                                {targetAsset?.id || ticket.assetId || 'ID In Analisi'}
                              </span>
                              <span className="font-bold text-white truncate max-w-[170px]" title={targetAsset?.name || ticket.asset}>
                                {targetAsset?.name || ticket.asset}
                              </span>
                            </div>
                            {targetAsset?.area && (
                              <p className="text-[10px] text-blue-300/60 mt-0.5">{targetAsset.area}</p>
                            )}
                          </div>

                          {/* Assignee */}
                          <div className="border-t border-[#1A3166] pt-2">
                            <span className="text-[10px] text-blue-300/60 font-semibold block">Assegnato Attualmente a:</span>
                            <p className="font-bold text-[#F3C64F] mt-0.5 flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                              <span>{ticket.assignedTo}</span>
                            </p>
                          </div>

                          {/* SLA string */}
                          <div className="border-t border-[#1A3166] pt-2">
                            <span className="text-[10px] text-blue-300/60 font-semibold block">Obiettivo Risoluzione (SLA):</span>
                            <p className="text-[11px] text-blue-200 mt-0.5 font-mono">
                              {ticket.sla}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick AI Action */}
                      {onAskAI && (
                        <div className="mt-3 pt-3 border-t border-[#1A3166] flex justify-end">
                          <button
                            onClick={() => onAskAI(ticket)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#0E1F4B] px-3 py-1.5 text-xs font-bold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Presa in carico & Diagnosi Rapida AI</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: RESOLVED TICKETS */}
          {activeTab === 'resolved' && (
            <div className="space-y-4">
              {resolvedTickets.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#1A3166] rounded-2xl bg-[#0A1636]/40">
                  <History className="mx-auto h-12 w-12 text-blue-400/50 mb-2" />
                  <h4 className="text-sm font-bold text-white">Nessun ticket risolto con i filtri attuali</h4>
                  <p className="text-xs text-blue-300/70 mt-1 max-w-sm mx-auto">
                    Non risultano interventi registrati come completati per i criteri di ricerca impostati.
                  </p>
                </div>
              ) : (
                resolvedTickets.map(ticket => {
                  const targetAsset = getAssetForTicket(ticket);
                  const duration = ticket.durationMinutes || 35;
                  const resolver = ticket.resolvedBy || ticket.assignedTo || 'Tecnico di Reparto';
                  const elapsedOpen = getElapsedTime(ticket.createdAtIso, ticket.timestamp);

                  return (
                    <div
                      key={ticket.ticketId || ticket.id}
                      className="rounded-xl border border-emerald-500/30 bg-[#0A1636] p-4 sm:p-5 shadow-lg relative hover:border-emerald-500/60 transition"
                    >
                      {/* Top banner: Resolver & Duration Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] pb-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-emerald-400 bg-[#070F24] px-2.5 py-1 rounded-lg border border-emerald-500/40">
                            #{ticket.ticketId}
                          </span>

                          {/* Resolved Badge */}
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Risolto con successo da: <strong>{resolver}</strong></span>
                          </span>

                          {/* Duration Tag */}
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                            <Timer className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span>Tempo impiegato: <strong>{formatDuration(duration)}</strong></span>
                          </span>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-1.5 text-xs text-blue-300/70">
                          <span className="font-mono font-bold text-[#F3C64F]">{ticket.priority}</span>
                          <span>•</span>
                          <span className="text-[11px] text-emerald-400 font-bold">🟢 Entro lo SLA contrattuale</span>
                        </div>
                      </div>

                      {/* Main Details Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left: What was resolved & details */}
                        <div className="lg:col-span-2 space-y-2.5">
                          {/* Resolution Notes */}
                          <div className="rounded-lg bg-[#070F24] border border-emerald-500/30 p-3">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCheck className="h-3.5 w-3.5" /> Azione Risolutiva & Intervento Eseguito:
                            </span>
                            <p className="text-xs font-medium text-white mt-1 leading-relaxed">
                              {ticket.resolutionNotes || ticket.actionRequired || 'Intervento di ripristino completato con verifica funzionale positiva.'}
                            </p>
                          </div>

                          {/* Original Problem */}
                          <div>
                            <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-wider">
                              Segnalazione Iniziale di Guasto:
                            </span>
                            <p className="text-xs text-blue-200/80 mt-0.5 italic">
                              "{ticket.userMessage}"
                            </p>
                          </div>
                        </div>

                        {/* Right: Asset Card & Timestamps */}
                        <div className="rounded-xl border border-[#1A3166] bg-[#070F24] p-3 space-y-2 text-xs">
                          {/* Asset Tag */}
                          <div>
                            <span className="text-[10px] text-blue-300/60 font-semibold block">Asset Ripristinato:</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="rounded bg-[#0E1F4B] text-[#F3C64F] font-mono font-bold px-1.5 py-0.5 text-[11px] border border-[#D4AF37]/30">
                                {targetAsset?.id || ticket.assetId || 'ID'}
                              </span>
                              <span className="font-bold text-white truncate max-w-[170px]" title={targetAsset?.name || ticket.asset}>
                                {targetAsset?.name || ticket.asset}
                              </span>
                            </div>
                            {targetAsset?.area && (
                              <p className="text-[10px] text-blue-300/60 mt-0.5">{targetAsset.area}</p>
                            )}
                          </div>

                          {/* Timeline details */}
                          <div className="border-t border-[#1A3166] pt-2 space-y-1 text-[11px]">
                            <div className="flex justify-between text-blue-300/70">
                              <span>Data Segnalazione:</span>
                              <span className="font-mono text-white">{elapsedOpen.formattedDate}</span>
                            </div>
                            <div className="flex justify-between text-blue-300/70">
                              <span>Chiusura Ticket:</span>
                              <span className="font-mono text-emerald-400 font-bold">Risolto e Collaudato</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Intervention History if available */}
                      {ticket.history && ticket.history.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#1A3166]/80 flex flex-wrap items-center gap-2 text-[10px] text-blue-300/60">
                          <span className="font-bold text-blue-200">Cronologia:</span>
                          {ticket.history.map((step, idx) => (
                            <span key={idx} className="rounded bg-[#070F24] border border-[#1A3166] px-2 py-0.5">
                              {step.timestamp} • {step.action} ({step.by})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: PER-ASSET RESOLUTION SUMMARY TABLE */}
          {activeTab === 'asset_summary' && (
            <div className="rounded-xl border border-[#1A3166] bg-[#0A1636] overflow-hidden shadow">
              <div className="p-4 border-b border-[#1A3166] bg-[#070F24] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Prospetto Analitico Risoluzioni per Apparato
                  </h4>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    Riepilogo del numero esatto di ticket risolti su ciascun apparato censito e dei guasti attualmente aperti.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-blue-200">
                  <thead className="bg-[#070F24] text-blue-300 uppercase font-mono border-b border-[#1A3166]">
                    <tr>
                      <th className="p-3">ID Asset</th>
                      <th className="p-3">Nome Asset & Modello</th>
                      <th className="p-3">Area Operativa</th>
                      <th className="p-3 text-center">Ticket Risolti</th>
                      <th className="p-3 text-center">Ticket Non Risolti</th>
                      <th className="p-3">Tecnico Referente</th>
                      <th className="p-3 text-right">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A3166] font-sans">
                    {assets.map(asset => {
                      const resolvedForThis = allTickets.filter(t => isTicketForAsset(t, asset) && (t.status === 'Risolto' || t.status === 'Chiuso')).length;
                      const unresolvedForThis = allTickets.filter(t => isTicketForAsset(t, asset) && t.status !== 'Risolto' && t.status !== 'Chiuso').length;

                      return (
                        <tr 
                          key={asset.id} 
                          className={`hover:bg-[#0E1F4B]/50 transition ${selectedAssetId === asset.id ? 'bg-[#0E1F4B]/70' : ''}`}
                        >
                          <td className="p-3">
                            <span className="rounded bg-[#070F24] px-2 py-0.5 font-mono font-bold text-[#F3C64F] border border-[#D4AF37]/30">
                              {asset.id}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white text-xs">{asset.name}</div>
                            <div className="text-[11px] text-blue-300/60 truncate max-w-xs">{asset.location || asset.description}</div>
                          </td>
                          <td className="p-3 text-blue-300">
                            {asset.area}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              resolvedForThis > 0 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono'
                                : 'text-blue-300/40'
                            }`}>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{resolvedForThis} risolti</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {unresolvedForThis > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold font-mono">
                                <Clock className="h-3 w-3" />
                                <span>{unresolvedForThis} aperto</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-semibold">Nessun guasto</span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-[#F3C64F]">
                            {asset.assignedTechnician} ({asset.level})
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedAssetId(asset.id);
                                setActiveTab(unresolvedForThis > 0 ? 'unresolved' : 'resolved');
                              }}
                              className="rounded-lg bg-[#0E1F4B] hover:bg-[#D4AF37]/20 border border-[#1A3166] hover:border-[#D4AF37]/40 px-2.5 py-1 text-[11px] font-bold text-blue-200 hover:text-[#F3C64F] transition"
                            >
                              Vedi Ticket
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-[#1A3166] bg-[#0A1636] px-6 py-3.5 shrink-0 flex items-center justify-between text-xs text-blue-300/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Report generato in tempo reale dall'archivio ITSM di sala</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] hover:bg-[#13285c] px-4 py-1.5 text-xs font-bold text-white transition"
          >
            Chiudi Finestra Report
          </button>
        </div>
      </div>
    </div>
  );
};
