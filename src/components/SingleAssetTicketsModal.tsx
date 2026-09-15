import React, { useState, useMemo, useEffect } from 'react';
import { ITSMTicket, AssetInfo } from '../types';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Search, 
  User, 
  Calendar, 
  Sparkles, 
  Tag, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  Gamepad2, 
  CreditCard, 
  Coffee, 
  Building2, 
  CheckCheck,
  Timer,
  FileText,
  Plus,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { isTicketForAsset, getElapsedTime, formatDuration } from './AssetTicketReportModal';

interface SingleAssetTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetInfo | null;
  allTickets: ITSMTicket[];
  onAskAI?: (ticket: ITSMTicket) => void;
  onReportIssueForAsset?: (asset: AssetInfo) => void;
}

export const SingleAssetTicketsModal: React.FC<SingleAssetTicketsModalProps> = ({
  isOpen,
  onClose,
  asset,
  allTickets,
  onAskAI,
  onReportIssueForAsset,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset filter and search when opening or changing asset
  useEffect(() => {
    if (isOpen) {
      setActiveFilter('all');
      setSearchQuery('');
    }
  }, [isOpen, asset?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter tickets that belong strictly to this asset
  const assetTickets = useMemo(() => {
    if (!asset) return [];
    return allTickets.filter(t => isTicketForAsset(t, asset));
  }, [asset, allTickets]);

  // Metrics
  const resolvedTickets = useMemo(() => {
    return assetTickets.filter(t => t.status === 'Risolto' || t.status === 'Chiuso');
  }, [assetTickets]);

  const unresolvedTickets = useMemo(() => {
    return assetTickets.filter(t => t.status !== 'Risolto' && t.status !== 'Chiuso');
  }, [assetTickets]);

  // Average resolution time (minutes)
  const avgDurationMinutes = useMemo(() => {
    const withDuration = resolvedTickets.filter(t => t.durationMinutes && t.durationMinutes > 0);
    if (withDuration.length === 0) return null;
    const total = withDuration.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    return Math.round(total / withDuration.length);
  }, [resolvedTickets]);

  // Filtered by active filter & search query
  const displayedTickets = useMemo(() => {
    return assetTickets.filter(ticket => {
      // Sub-filter
      if (activeFilter === 'resolved' && ticket.status !== 'Risolto' && ticket.status !== 'Chiuso') {
        return false;
      }
      if (activeFilter === 'unresolved' && (ticket.status === 'Risolto' || ticket.status === 'Chiuso')) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = ticket.ticketId?.toLowerCase().includes(q);
        const matchesMsg = ticket.userMessage?.toLowerCase().includes(q);
        const matchesAssignee = ticket.assignedTo?.toLowerCase().includes(q);
        const matchesResolver = ticket.resolvedBy?.toLowerCase().includes(q);
        const matchesAction = ticket.actionRequired?.toLowerCase().includes(q);
        const matchesNote = ticket.resolutionNotes?.toLowerCase().includes(q);
        const matchesNotesList = ticket.notes?.some(n => n.toLowerCase().includes(q));
        if (!matchesId && !matchesMsg && !matchesAssignee && !matchesResolver && !matchesAction && !matchesNote && !matchesNotesList) {
          return false;
        }
      }

      return true;
    });
  }, [assetTickets, activeFilter, searchQuery]);

  // Export single asset tickets to CSV
  const handleExportAssetCSV = () => {
    if (!asset) return;
    const headers = [
      'ID Ticket',
      'ID Asset',
      'Nome Asset',
      'Area',
      'Priorità',
      'Stato',
      'Data Apertura',
      'Data Risoluzione',
      'Durata Minuti',
      'Tecnico Assegnato',
      'Risolto Da',
      'Descrizione Guasto',
      'Azione / Note Risoluzione'
    ];

    const rows = assetTickets.map(t => {
      return [
        `"${t.ticketId || t.id}"`,
        `"${asset.id}"`,
        `"${asset.name.replace(/"/g, '""')}"`,
        `"${asset.area}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${t.createdAtIso || t.timestamp || ''}"`,
        `"${t.resolvedAtIso || ''}"`,
        `"${t.durationMinutes || ''}"`,
        `"${(t.assignedTo || '').replace(/"/g, '""')}"`,
        `"${(t.resolvedBy || '').replace(/"/g, '""')}"`,
        `"${(t.userMessage || '').replace(/"/g, '""')}"`,
        `"${(t.resolutionNotes || t.actionRequired || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ITSM_Ticket_Asset_${asset.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !asset) return null;

  // Render Area Icon helper
  const renderAreaIcon = (areaName: string) => {
    const low = areaName.toLowerCase();
    if (low.includes('gaming') || low.includes('slot')) return <Gamepad2 className="h-4 w-4 text-[#D4AF37]" />;
    if (low.includes('cassa') || low.includes('pos')) return <CreditCard className="h-4 w-4 text-emerald-400" />;
    if (low.includes('bar') || low.includes('food')) return <Coffee className="h-4 w-4 text-amber-400" />;
    if (low.includes('sicurezza') || low.includes('tvcc')) return <ShieldCheck className="h-4 w-4 text-cyan-400" />;
    if (low.includes('server') || low.includes('rete')) return <Cpu className="h-4 w-4 text-purple-400" />;
    return <Building2 className="h-4 w-4 text-blue-400" />;
  };

  const statusColor = 
    asset.status === 'Guasto / Degradato'
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : asset.status === 'In Manutenzione'
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  const critColor = 
    asset.criticality === 'Critica'
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : asset.criticality === 'Alta'
      ? 'bg-[#D4AF37]/20 text-[#F3C64F] border-[#D4AF37]/40'
      : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-[#1A3166] bg-[#070F26] text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="border-b border-[#1A3166] bg-[#0A1636] p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 pr-6">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="rounded-lg bg-[#0E1F4B] px-3 py-1 font-mono text-sm font-black text-[#F3C64F] border border-[#D4AF37]/50 shadow tracking-wider">
                  {asset.id}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                  {renderAreaIcon(asset.area)}
                  <span>{asset.area}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusColor}`}>
                  {asset.status || 'Operativo'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold border ${critColor}`}>
                  Criticità {asset.criticality}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-1">
                {asset.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-300/80 pt-0.5">
                {asset.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>{asset.location}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span>Tecnico Referente: <strong className="text-[#F3C64F]">{asset.assignedTechnician} ({asset.level})</strong></span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-blue-400/80">
                  <Tag className="h-3 w-3" />
                  <span>Matricola: {asset.serialNumber || `SN-${asset.id}`}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAssetCSV}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-bold text-emerald-300 transition active:scale-95 shadow-sm cursor-pointer"
                title={`Esporta i ticket di ${asset.id} in formato CSV`}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Esporta CSV</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] p-2 text-blue-300 hover:text-white hover:bg-[#152e6c] hover:border-red-500/40 transition active:scale-95 cursor-pointer"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ASSET METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-[#1A3166]/80">
            {/* 1. Totale Ticket */}
            <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/90 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70 block">
                Totale Ticket Registrati
              </span>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-lg font-black text-white font-mono">{assetTickets.length}</span>
              </div>
            </div>

            {/* 2. Risolti */}
            <div 
              onClick={() => setActiveFilter('resolved')}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                activeFilter === 'resolved' 
                  ? 'border-emerald-500 bg-emerald-500/20 ring-1 ring-emerald-500/50' 
                  : 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/60'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
                Ticket Risolti & Chiusi
              </span>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-lg font-black text-emerald-300 font-mono">{resolvedTickets.length}</span>
                {assetTickets.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400/80 ml-auto">
                    {Math.round((resolvedTickets.length / assetTickets.length) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* 3. In Corso / Aperti */}
            <div 
              onClick={() => setActiveFilter('unresolved')}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                activeFilter === 'unresolved' 
                  ? 'border-amber-500 bg-amber-500/20 ring-1 ring-amber-500/50' 
                  : 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 block">
                Guasti Aperti / In Corso
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-lg font-black text-amber-300 font-mono">{unresolvedTickets.length}</span>
                {unresolvedTickets.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded ml-auto">
                    Attivo
                  </span>
                )}
              </div>
            </div>

            {/* 4. Durata Media */}
            <div className="rounded-xl border border-[#1A3166] bg-[#070F24]/90 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70 block">
                Tempo Medio Risoluzione
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Timer className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm font-black text-white font-mono">
                  {avgDurationMinutes ? formatDuration(avgDurationMinutes) : '25-35 min'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUB-FILTER TABS & SEARCH BAR */}
        <div className="border-b border-[#1A3166] bg-[#070F24] p-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Segmented Buttons */}
          <div className="flex items-center gap-1.5 bg-[#0A1636] p-1 rounded-xl border border-[#1A3166]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFilter === 'all'
                  ? 'bg-[#0E1F4B] text-white border border-[#D4AF37]/40 shadow-sm'
                  : 'text-blue-300/70 hover:text-white'
              }`}
            >
              <span>Tutti i Ticket</span>
              <span className="rounded-full bg-[#1A3166] px-1.5 py-0.2 text-[10px] font-mono font-bold">
                {assetTickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('resolved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFilter === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-blue-300/70 hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Risolti</span>
              <span className="rounded-full bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                {resolvedTickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('unresolved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFilter === 'unresolved'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-blue-300/70 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>In Corso</span>
              {unresolvedTickets.length > 0 && (
                <span className="rounded-full bg-amber-500/30 text-amber-200 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {unresolvedTickets.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Box within this asset's tickets */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/60" />
            <input
              type="text"
              placeholder={`Cerca nei ticket di ${asset.id}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#1A3166] bg-[#0A1636] pl-9 pr-3 py-1.5 text-xs text-white placeholder-blue-300/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition"
            />
          </div>
        </div>

        {/* TICKETS LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {displayedTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1A3166] bg-[#0A1636]/60 p-8 sm:p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                {activeFilter === 'resolved' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : activeFilter === 'unresolved' ? (
                  <Clock className="h-6 w-6 text-amber-400" />
                ) : (
                  <FileText className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white">
                {activeFilter === 'resolved' 
                  ? `Nessun ticket risolto trovato per ${asset.id}`
                  : activeFilter === 'unresolved'
                  ? `Nessun ticket aperto o in corso per ${asset.id}`
                  : `Nessun ticket registrato per ${asset.id}`}
              </h4>
              <p className="text-xs text-blue-300/70 mt-1 max-w-md mx-auto leading-relaxed">
                {activeFilter === 'unresolved' 
                  ? "Tutti gli apparati e i moduli di questo asset risultano attualmente collaudati e operativi senza guasti aperti."
                  : searchQuery 
                  ? "Nessun ticket soddisfa i termini di ricerca inseriti. Prova a rimuovere i filtri."
                  : "Non sono presenti anomalie registrate per questo apparato nell'attuale sessione."}
              </p>

              {onReportIssueForAsset && (
                <button
                  onClick={() => {
                    onClose();
                    onReportIssueForAsset(asset);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#0E1F4B] hover:bg-[#D4AF37]/20 px-4 py-2 text-xs font-bold text-[#F3C64F] transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Segnala Anomalia su {asset.id}</span>
                </button>
              )}
            </div>
          ) : (
            displayedTickets.map(ticket => {
              const isResolved = ticket.status === 'Risolto' || ticket.status === 'Chiuso';
              const elapsed = getElapsedTime(ticket.createdAtIso, ticket.timestamp);
              const durationFormatted = formatDuration(ticket.durationMinutes);

              return (
                <div
                  key={ticket.ticketId || ticket.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition shadow-lg ${
                    isResolved
                      ? 'border-emerald-500/35 bg-[#08172c] hover:border-emerald-500/60'
                      : 'border-amber-500/40 bg-[#0c1630] hover:border-amber-500/70'
                  }`}
                >
                  {/* Top Bar: Ticket ID, Status, Priority & Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] pb-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg bg-[#070F24] px-2.5 py-1 font-mono text-xs font-black text-[#F3C64F] border border-[#D4AF37]/40 shadow-sm">
                        #{ticket.ticketId}
                      </span>

                      {/* Status pill */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : ticket.status === 'Escalato T3'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : ticket.status === 'In Lavorazione'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      }`}>
                        {ticket.status}
                      </span>

                      {/* Priority pill */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                        ticket.priority === 'P1'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : ticket.priority === 'P2'
                          ? 'bg-[#D4AF37]/20 text-[#F3C64F] border-[#D4AF37]/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        Priorità {ticket.priority}
                      </span>

                      {/* Category */}
                      {ticket.category && (
                        <span className="text-[11px] text-blue-300/70 bg-[#0E1F4B] px-2 py-0.5 rounded border border-[#1A3166]">
                          {ticket.category}
                        </span>
                      )}
                    </div>

                    {/* Time pill */}
                    <div className="flex items-center gap-2 text-xs">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Risolto con esito positivo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg font-medium">
                          <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                          <span>Aperto da: <strong>{elapsed.text}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Anomalia description */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/60 block">
                        Descrizione Anomalia:
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-white mt-1 bg-[#070F24] p-3 rounded-xl border border-[#1A3166] leading-relaxed">
                        "{ticket.userMessage}"
                      </p>
                    </div>

                    {/* RESOLUTION DETAILS BOX (If Resolved) */}
                    {isResolved && (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 space-y-2.5 mt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                            <CheckCheck className="h-4 w-4 text-emerald-400" />
                            <span>Dettagli Chiusura & Collaudo Tecnico:</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-emerald-200/80">
                            {ticket.durationMinutes && (
                              <span className="inline-flex items-center gap-1 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                                <Timer className="h-3 w-3" />
                                <span>Durata: {durationFormatted}</span>
                              </span>
                            )}
                            <span className="text-[11px] text-emerald-300/70">
                              {ticket.resolvedAtIso 
                                ? new Date(ticket.resolvedAtIso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                                : 'Chiuso'}
                            </span>
                          </div>
                        </div>

                        {/* Who resolved & what was done */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-300/60 block">
                              Risolto da:
                            </span>
                            <span className="font-bold text-white mt-0.5 block">
                              {ticket.resolvedBy || ticket.assignedTo || 'Tecnico di Presidio'}
                            </span>
                          </div>

                          <div className="sm:col-span-2">
                            <span className="text-[10px] uppercase font-bold text-emerald-300/60 block">
                              Esito Intervento & Note Tecniche:
                            </span>
                            <p className="text-xs text-emerald-100/90 mt-0.5 leading-relaxed">
                              {ticket.resolutionNotes || ticket.actionRequired || 'Intervento completato con verifica di funzionamento e collaudo positivo in presenza del personale.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UNRESOLVED PROCEDURES BOX (If In Progress/Open) */}
                    {!isResolved && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2 mt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2 text-xs">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-amber-400" />
                            <span>Procedura di Ripristino in Corso:</span>
                          </span>
                          <span className="text-amber-200/70 font-mono text-[11px]">
                            Target SLA: <strong className="text-white">{ticket.sla}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-300/60 block">
                              Assegnato a:
                            </span>
                            <span className="font-bold text-white mt-0.5 block">
                              {ticket.assignedTo}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] uppercase font-bold text-amber-300/60 block">
                              Azione Richiesta:
                            </span>
                            <p className="text-xs text-amber-100/90 mt-0.5">
                              {ticket.actionRequired || 'Diagnosi in loco e ripristino operatività.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes history log if available */}
                    {ticket.notes && ticket.notes.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/60 block mb-1">
                          Note Registrate:
                        </span>
                        <div className="space-y-1">
                          {ticket.notes.map((note, nIdx) => (
                            <div key={nIdx} className="text-[11px] text-blue-200/80 bg-[#070F24] p-2 rounded-lg border border-[#1A3166]">
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Metadata & AI Assistant Action */}
                  <div className="mt-3 pt-3 border-t border-[#1A3166] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-blue-300/60 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Apertura: {elapsed.formattedDate}</span>
                      </span>
                      {ticket.reporterName && (
                        <span>Segnalato da: <strong className="text-blue-200">{ticket.reporterName}</strong></span>
                      )}
                    </div>

                    {/* Ask AI diagnosis button */}
                    {onAskAI && (
                      <button
                        onClick={() => {
                          onClose();
                          onAskAI(ticket);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#0E1F4B] hover:bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#F3C64F] transition active:scale-95"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Analisi Guasto con AI</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-[#1A3166] bg-[#0A1636] px-5 py-3.5 shrink-0 flex items-center justify-between gap-3 text-xs">
          <div className="text-blue-300/70 text-xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Apparato ID: <strong className="text-white font-mono">{asset.id}</strong> — Mostrati {displayedTickets.length} ticket</span>
          </div>

          <div className="flex items-center gap-2">
            {onReportIssueForAsset && (
              <button
                onClick={() => {
                  onClose();
                  onReportIssueForAsset(asset);
                }}
                className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/40 px-3.5 py-1.5 text-xs font-bold text-blue-200 hover:text-[#F3C64F] transition"
              >
                Segnala Guasto
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl border border-[#1A3166] bg-[#0E1F4B] hover:bg-[#13285c] px-4 py-1.5 text-xs font-bold text-white transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
