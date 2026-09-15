import React, { useState, useMemo, useEffect } from 'react';
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
  BarChart2,
  PieChart as PieChartIcon,
  ListFilter,
  History,
  Timer,
  Download,
  FileSpreadsheet,
  FileCode,
  Printer,
  Percent,
  Activity,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { triggerPrintableReport } from '../utils/printReport';

interface AssetTicketReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTickets: ITSMTicket[];
  assets: AssetInfo[];
  initialAssetId?: string;
  onAskAI?: (ticket: ITSMTicket) => void;
  onOpenSingleAsset?: (asset: AssetInfo) => void;
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
  onOpenSingleAsset,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId || 'all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'analytics' | 'unresolved' | 'resolved' | 'asset_summary'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '7days' | '24hours'>('all');

  // Sync initialAssetId when prop changes
  useEffect(() => {
    if (initialAssetId) {
      setSelectedAssetId(initialAssetId);
    }
  }, [initialAssetId]);

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

  // Distinct areas from assets
  const distinctAreas = useMemo(() => {
    return Array.from(new Set(assets.map(a => a.area).filter(Boolean)));
  }, [assets]);

  // Selected asset object
  const currentAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  // Tickets filtered by asset, area, time range and search query
  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
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

      // Time range filter
      if (selectedTimeRange !== 'all') {
        const tDate = ticket.createdAtIso ? new Date(ticket.createdAtIso) : new Date(ticket.timestamp);
        if (!isNaN(tDate.getTime())) {
          const hoursAgo = (Date.now() - tDate.getTime()) / (1000 * 60 * 60);
          if (selectedTimeRange === '24hours' && hoursAgo > 24) return false;
          if (selectedTimeRange === '7days' && hoursAgo > 24 * 7) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = ticket.ticketId?.toLowerCase().includes(q);
        const matchAsset = (ticket.asset || '').toLowerCase().includes(q);
        const matchAssetId = (ticket.assetId || '').toLowerCase().includes(q);
        const matchMsg = ticket.userMessage?.toLowerCase().includes(q);
        const matchAssignee = (ticket.assignedTo || '').toLowerCase().includes(q);
        const matchAction = (ticket.actionRequired || '').toLowerCase().includes(q);
        const matchResolvedBy = (ticket.resolvedBy || '').toLowerCase().includes(q);
        return matchId || matchAsset || matchAssetId || matchMsg || matchAssignee || matchAction || matchResolvedBy;
      }

      return true;
    });
  }, [allTickets, selectedAssetId, selectedArea, selectedTimeRange, searchQuery, assets]);

  // Split into Unresolved and Resolved
  const unresolvedTickets = useMemo(() => {
    return filteredTickets.filter(t => t.status !== 'Risolto' && t.status !== 'Chiuso');
  }, [filteredTickets]);

  const resolvedTickets = useMemo(() => {
    return filteredTickets.filter(t => t.status === 'Risolto' || t.status === 'Chiuso');
  }, [filteredTickets]);

  // Metrics
  const totalCount = filteredTickets.length;
  const unresolvedCount = unresolvedTickets.length;
  const resolvedCount = resolvedTickets.length;
  const globalResolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Average resolution time in minutes for resolved tickets
  const avgResolutionMinutes = useMemo(() => {
    if (resolvedCount === 0) return 0;
    const totalResolvedMinutes = resolvedTickets.reduce((acc, t) => acc + (t.durationMinutes || 35), 0);
    return Math.round(totalResolvedMinutes / resolvedCount);
  }, [resolvedTickets, resolvedCount]);

  // Find asset for a ticket
  const getAssetForTicket = (ticket: ITSMTicket): AssetInfo | undefined => {
    return assets.find(a => isTicketForAsset(ticket, a));
  };

  // --- STATS & CHARTS CALCULATIONS (Criticality & Closed vs Open) ---
  const { criticalityBreakdown, criticalityPieData, criticalityBarData } = useMemo(() => {
    const levels: Array<{ key: 'P1' | 'P2' | 'P3' | 'P4'; label: string; sla: string; color: string }> = [
      { key: 'P1', label: 'P1 - Critica', sla: 'Risoluzione < 2h', color: '#EF4444' },
      { key: 'P2', label: 'P2 - Alta', sla: 'Risoluzione < 4h', color: '#F59E0B' },
      { key: 'P3', label: 'P3 - Media', sla: 'Risoluzione < 8h', color: '#3B82F6' },
      { key: 'P4', label: 'P4 - Bassa', sla: 'Risoluzione < 24h', color: '#10B981' },
    ];

    const breakdown = levels.map(lvl => {
      const ticketsOfLevel = filteredTickets.filter(t => t.priority === lvl.key);
      const totalLvl = ticketsOfLevel.length;
      const closedLvl = ticketsOfLevel.filter(t => t.status === 'Risolto' || t.status === 'Chiuso').length;
      const openLvl = totalLvl - closedLvl;
      
      const pctOfTotal = totalCount > 0 ? Math.round((totalLvl / totalCount) * 1000) / 10 : 0;
      const pctClosed = totalLvl > 0 ? Math.round((closedLvl / totalLvl) * 100) : 0;
      const pctOpen = totalLvl > 0 ? Math.round((openLvl / totalLvl) * 100) : 0;

      // Calculate level MTTR
      const resolvedLvlTickets = ticketsOfLevel.filter(t => t.status === 'Risolto' || t.status === 'Chiuso');
      const lvlDurationTotal = resolvedLvlTickets.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
      const lvlMttr = resolvedLvlTickets.length > 0 ? Math.round(lvlDurationTotal / resolvedLvlTickets.length) : null;

      return {
        key: lvl.key,
        label: lvl.label,
        sla: lvl.sla,
        color: lvl.color,
        totale: totalLvl,
        chiusi: closedLvl,
        aperti: openLvl,
        pctOfTotal,
        pctClosed,
        pctOpen,
        lvlMttr,
      };
    });

    // Pie chart: only items with > 0 or all for representation
    const pieData = breakdown.map(b => ({
      name: b.label,
      value: b.totale,
      percentage: b.pctOfTotal,
      color: b.color,
      chiusi: b.chiusi,
      aperti: b.aperti,
    }));

    // Bar chart: Stacked representation for each priority
    const barData = breakdown.map(b => ({
      name: b.key,
      label: b.label,
      'Chiusi / Risolti': b.chiusi,
      'Aperti / In Corso': b.aperti,
      totale: b.totale,
      pctClosed: b.pctClosed,
      pctOpen: b.pctOpen,
    }));

    return {
      criticalityBreakdown: breakdown,
      criticalityPieData: pieData,
      criticalityBarData: barData,
    };
  }, [filteredTickets, totalCount]);

  // --- EXPORT HANDLERS ---
  const handleExportPercentagesCSV = () => {
    const headers = [
      'Livello Priorità',
      'Descrizione',
      'Totale Segnalazioni',
      'Percentuale sul Totale (%)',
      'Ticket Chiusi o Risolti',
      'Percentuale Chiusi (%)',
      'Ticket Aperti o In Corso',
      'Percentuale Aperti (%)',
      'Tasso di Risoluzione (%)',
      'Target SLA',
      'MTTR Medio (Minuti)'
    ];

    const rows = criticalityBreakdown.map(item => [
      `"${item.key}"`,
      `"${item.label}"`,
      item.totale,
      `"${item.pctOfTotal}%"`,
      item.chiusi,
      `"${item.pctClosed}%"`,
      item.aperti,
      `"${item.pctOpen}%"`,
      `"${item.pctClosed}%"`,
      `"${item.sla}"`,
      item.lvlMttr !== null ? item.lvlMttr : 'N/D'
    ]);

    // Summary totals row
    rows.push([
      `"TOTALE GENERALE"`,
      `"Tutti i Livelli Triage"`,
      totalCount,
      `"100%"`,
      resolvedCount,
      `"${globalResolutionRate}%"`,
      unresolvedCount,
      `"${totalCount > 0 ? Math.round(((totalCount - resolvedCount) / totalCount) * 100) : 0}%"`,
      `"${globalResolutionRate}%"`,
      `"—"`,
      avgResolutionMinutes > 0 ? avgResolutionMinutes : 'N/D'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ITSM_Matrice_Percentuali_Criticita_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Ticket',
      'ID Asset',
      'Nome Asset',
      'Area Operativa',
      'Priorita Critica',
      'Stato Ticket',
      'Chiuso/Aperto',
      'Data Apertura',
      'Data Chiusura',
      'Durata Risoluzione Minuti',
      'Tecnico Assegnato',
      'Risolto Da',
      'Descrizione Segnalazione',
      'Note Risoluzione / Azione'
    ];

    const rows = filteredTickets.map(t => {
      const asset = getAssetForTicket(t);
      const isClosed = t.status === 'Risolto' || t.status === 'Chiuso';
      return [
        `"${t.ticketId || t.id}"`,
        `"${asset?.id || t.assetId || ''}"`,
        `"${(asset?.name || t.asset || '').replace(/"/g, '""')}"`,
        `"${asset?.area || ''}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${isClosed ? 'CHIUSO' : 'APERTO'}"`,
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
    link.setAttribute('download', `ITSM_Report_Ticket_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const exportPayload = {
      reportTitle: 'ITSM Gaming & Operations Ticket Report',
      generatedAt: new Date().toISOString(),
      filtersApplied: {
        selectedAssetId,
        selectedArea,
        selectedTimeRange,
        searchQuery,
      },
      summaryKPI: {
        totalTickets: totalCount,
        resolvedTickets: resolvedCount,
        unresolvedTickets: unresolvedCount,
        globalResolutionRate: `${globalResolutionRate}%`,
        avgResolutionMinutes,
      },
      criticalityDistribution: criticalityBreakdown.map(c => ({
        priority: c.key,
        label: c.label,
        total: c.totale,
        percentageOfTotal: `${c.pctOfTotal}%`,
        closedCount: c.chiusi,
        closedPercentage: `${c.pctClosed}%`,
        openCount: c.aperti,
        openPercentage: `${c.pctOpen}%`,
        mttrMinutes: c.lvlMttr,
      })),
      tickets: filteredTickets.map(t => {
        const asset = getAssetForTicket(t);
        const isClosed = t.status === 'Risolto' || t.status === 'Chiuso';
        return {
          ticketId: t.ticketId || t.id,
          assetId: asset?.id || t.assetId,
          assetName: asset?.name || t.asset,
          area: asset?.area,
          priority: t.priority,
          status: t.status,
          isClosed,
          createdAt: t.createdAtIso || t.timestamp,
          resolvedAt: t.resolvedAtIso,
          durationMinutes: t.durationMinutes,
          assignedTo: t.assignedTo,
          resolvedBy: t.resolvedBy,
          userMessage: t.userMessage,
          resolutionNotes: t.resolutionNotes || t.actionRequired,
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ITSM_Report_Ticket_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const assetLabel = currentAsset ? `[${currentAsset.id}] ${currentAsset.name}` : `Tutti gli Apparati (${assets.length} apparati)`;
    const areaLabel = selectedArea === 'all' ? 'Tutte le Aree Operative' : selectedArea;
    const timeLabel = 
      selectedTimeRange === 'today' ? 'Oggi' :
      selectedTimeRange === 'week' ? 'Ultimi 7 Giorni' :
      selectedTimeRange === 'month' ? 'Ultimi 30 Giorni' : 'Tutto lo Storico';

    triggerPrintableReport({
      title: 'Report Statistico KPI & Grafici ITSM Gaming Hall',
      subtitle: 'Prospetto Operativo Ufficiale: Sintesi Ticket, Percentuali per Criticità e Grafici Comparativi',
      filterSummary: {
        assetLabel,
        areaLabel,
        timeRangeLabel: timeLabel,
        generatedAt: new Date().toLocaleString('it-IT'),
      },
      metrics: {
        totalCount,
        resolvedCount,
        unresolvedCount,
        resolutionRate: globalResolutionRate,
        avgResolutionMinutes,
      },
      criticalityBreakdown,
      tickets: filteredTickets,
      assets,
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="itsm-report-printable-container"
        className="relative w-full max-w-6xl rounded-2xl border border-[#1A3166] bg-[#070F26] text-white shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER WITH EXPORT ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1A3166] bg-[#0A1636] px-5 py-4 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F3C64F] text-[#070F26] font-extrabold shadow-md shadow-[#D4AF37]/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Report Analitico & Grafici ITSM
                </h2>
                {currentAsset && (
                  <span className="rounded-md bg-[#0E1F4B] border border-[#D4AF37]/40 px-2 py-0.5 text-xs font-mono font-bold text-[#F3C64F]">
                    {currentAsset.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-300/70">
                Statistiche percentuali per criticità, confronto Chiusi/Aperti ed export dati completi.
              </p>
            </div>
          </div>

          {/* Export Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Metrics & Percentages for Charts */}
            <button
              id="btn-export-percentages-csv"
              onClick={handleExportPercentagesCSV}
              className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 px-3 py-1.5 text-xs font-bold text-[#F3C64F] transition active:scale-95 shadow-sm cursor-pointer"
              title="Esporta la matrice delle percentuali di criticità e divisione chiusi/aperti per creare grafici in Excel"
            >
              <BarChart2 className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Dati Grafici (%)</span>
            </button>

            {/* Export CSV Button */}
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-bold text-emerald-300 transition active:scale-95 shadow-sm cursor-pointer"
              title="Esporta tutti i ticket e le colonne in formato CSV (compatibile con Excel)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Esporta CSV</span>
            </button>

            {/* Export JSON Button */}
            <button
              id="btn-export-json"
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25 px-3 py-1.5 text-xs font-bold text-blue-300 transition active:scale-95 shadow-sm cursor-pointer"
              title="Esporta il payload completo e le metriche in formato JSON"
            >
              <FileCode className="h-3.5 w-3.5 text-blue-400" />
              <span>JSON</span>
            </button>

            {/* Print / PDF Button */}
            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 px-3 py-1.5 text-xs font-bold text-[#F3C64F] transition active:scale-95 shadow-sm cursor-pointer"
              title="Stampa riepilogo o salva in formato PDF"
            >
              <Printer className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Stampa</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1A3166] bg-[#0E1F4B] text-blue-300 hover:text-white hover:bg-rose-950/40 hover:border-rose-500/50 transition cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* FILTER STRIP & GLOBAL METRICS */}
        <div className="border-b border-[#1A3166] bg-[#091433] p-4 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* Asset Selector */}
            <div>
              <label className="block text-[10px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3 text-[#D4AF37]" /> Apparato / Asset:
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="all">Tutti gli Asset ({assets.length} apparati)</option>
                {assets.map(a => {
                  const resolvedOnThis = allTickets.filter(t => isTicketForAsset(t, a) && (t.status === 'Risolto' || t.status === 'Chiuso')).length;
                  return (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.name} ({resolvedOnThis} risolti)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-[10px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Filter className="h-3 w-3 text-[#D4AF37]" /> Area Operativa:
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="all">Tutte le Aree Operative</option>
                {distinctAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-[10px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#D4AF37]" /> Intervallo Temporale:
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="all">Tutto lo Storico</option>
                <option value="7days">Ultimi 7 Giorni</option>
                <option value="24hours">Ultime 24 Ore</option>
              </select>
            </div>

            {/* Free Search */}
            <div>
              <label className="block text-[10px] font-bold text-blue-300/80 mb-1 flex items-center gap-1">
                <Search className="h-3 w-3 text-[#D4AF37]" /> Cerca nei dati:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID ticket, note, tecnico..."
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] pl-8 pr-3 py-1.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-300/50" />
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
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

            <div 
              onClick={() => setActiveTab('resolved')}
              className="rounded-xl border border-emerald-500/30 bg-[#070F24] px-3 py-2 flex items-center gap-2.5 cursor-pointer hover:border-emerald-500/60 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-emerald-300/80 font-semibold">Chiusi / Risolti</p>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">{globalResolutionRate}%</span>
                </div>
                <p className="text-sm font-black text-emerald-400 font-mono">{resolvedCount}</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('unresolved')}
              className="rounded-xl border border-amber-500/30 bg-[#070F24] px-3 py-2 flex items-center gap-2.5 cursor-pointer hover:border-amber-500/60 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-amber-300/80 font-semibold">Aperti / In Corso</p>
                  <span className="text-[10px] font-bold text-amber-400 font-mono">
                    {totalCount > 0 ? 100 - globalResolutionRate : 0}%
                  </span>
                </div>
                <p className="text-sm font-black text-amber-400 font-mono">{unresolvedCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#070F24] px-3 py-2 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#F3C64F] border border-[#D4AF37]/30">
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#F3C64F]/80 font-semibold">MTTR Risoluzione</p>
                <p className="text-sm font-black text-white font-mono">{formatDuration(avgResolutionMinutes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION: ANALYTICS & GRAFICI | NON RISOLTI | RISOLTI | RIEPILOGO ASSET */}
        <div className="flex border-b border-[#1A3166] bg-[#070F24] px-4 sm:px-6 shrink-0 gap-1 sm:gap-2 overflow-x-auto">
          {/* TAB 1: GRAFICI E PERCENTUALI CRITICITA' */}
          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <BarChart2 className="h-4 w-4 text-[#D4AF37]" />
            <span>Grafici & Percentuali Criticità</span>
            <span className="rounded-full bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/40 text-[10px] font-mono px-1.5 py-0.2">
              Charts
            </span>
          </button>

          {/* TAB 2: NON RISOLTI */}
          <button
            id="tab-btn-unresolved"
            onClick={() => setActiveTab('unresolved')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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

          {/* TAB 3: RISOLTI */}
          <button
            id="tab-btn-resolved"
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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

          {/* TAB 4: RIEPILOGO ASSET */}
          <button
            id="tab-btn-asset-summary"
            onClick={() => setActiveTab('asset_summary')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'asset_summary'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4 text-blue-400" />
            <span>Riepilogo per Singolo Asset ({assets.length})</span>
          </button>
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: VISUAL CHARTS & PERCENTAGES BY CRITICALITY (CLOSED VS OPEN)        */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Criticality Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {criticalityBreakdown.map((item) => {
                  return (
                    <div 
                      key={item.key}
                      className="rounded-2xl border bg-[#0A1636] p-4 shadow transition hover:border-[#D4AF37]/50 relative overflow-hidden"
                      style={{ borderColor: `${item.color}40` }}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="px-2.5 py-1 rounded-lg text-xs font-black font-mono tracking-wide border shadow-sm"
                          style={{ 
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                            borderColor: `${item.color}50`
                          }}
                        >
                          {item.label}
                        </span>
                        <span className="text-[11px] font-bold text-blue-300/70 font-mono">
                          {item.pctOfTotal}% del totale
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-black text-white font-mono">{item.totale}</span>
                          <span className="text-xs text-blue-300/60 ml-1.5">ticket</span>
                        </div>
                        <span className="text-[11px] text-blue-300/70">
                          Target: <strong className="text-white">{item.sla}</strong>
                        </span>
                      </div>

                      {/* Division: Closed vs Open Bar */}
                      <div className="mt-3 pt-3 border-t border-[#1A3166] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-emerald-300">
                            <Check className="h-3 w-3 text-emerald-400" />
                            <strong>{item.chiusi} Chiusi</strong> ({item.pctClosed}%)
                          </span>
                          <span className="flex items-center gap-1.5 text-amber-300">
                            <Clock className="h-3 w-3 text-amber-400" />
                            <strong>{item.aperti} Aperti</strong> ({item.pctOpen}%)
                          </span>
                        </div>

                        {/* Dual-colored progress bar */}
                        <div className="h-2 w-full bg-[#070F24] rounded-full overflow-hidden flex border border-[#1A3166]">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-500" 
                            style={{ width: `${item.pctClosed}%` }}
                            title={`${item.chiusi} chiusi (${item.pctClosed}%)`}
                          />
                          <div 
                            className="bg-amber-500 h-full transition-all duration-500" 
                            style={{ width: `${item.pctOpen}%` }}
                            title={`${item.aperti} aperti (${item.pctOpen}%)`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TWO INTERACTIVE CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART 1: DONUT / PIE PERCENTAGES BY CRITICALITY */}
                <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] p-5 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-[#1A3166] pb-3 mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-[#D4AF37]" />
                        <span>Percentuali Report per Livello di Criticità</span>
                      </h3>
                      <p className="text-[11px] text-blue-300/70 mt-0.5">
                        Ripartizione proporzionale delle segnalazioni per gravità d'impatto.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#070F24] border border-[#1A3166] px-2.5 py-0.5 text-[11px] font-mono font-bold text-white">
                      Tot: {totalCount}
                    </span>
                  </div>

                  {totalCount === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-blue-300/50">
                      Nessun ticket registrato con i filtri correnti.
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
                      <div className="w-full sm:w-1/2 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={criticalityPieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={4}
                            >
                              {criticalityPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="rounded-xl border border-[#D4AF37]/50 bg-[#070F26] p-2.5 shadow-2xl text-xs text-white">
                                      <p className="font-bold text-[#F3C64F]">{data.name}</p>
                                      <p className="mt-1 text-white font-mono">
                                        Segnalazioni: <strong>{data.value}</strong> ({data.percentage}%)
                                      </p>
                                      <p className="text-emerald-400 text-[11px] mt-0.5">
                                        Chiusi: {data.chiusi} | Aperti: {data.aperti}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend breakdown list */}
                      <div className="w-full sm:w-1/2 space-y-2 text-xs">
                        {criticalityBreakdown.map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-2 rounded-xl bg-[#070F24] border border-[#1A3166]">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="font-bold text-white text-[11px]">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-white font-bold">{item.totale}</span>
                              <span className="text-blue-300/60 font-medium">({item.pctOfTotal}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CHART 2: STACKED BAR CHART (CLOSED VS OPEN BY CRITICALITY) */}
                <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] p-5 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-[#1A3166] pb-3 mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-400" />
                        <span>Divisione Ticket: Chiusi vs Ancora Aperti</span>
                      </h3>
                      <p className="text-[11px] text-blue-300/70 mt-0.5">
                        Confronto per ciascun livello di priorità tra ticket risolti e ticket in corso.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
                      <span className="flex items-center gap-1 text-emerald-300">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" /> Chiusi
                      </span>
                      <span className="flex items-center gap-1 text-amber-300">
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" /> Aperti
                      </span>
                    </div>
                  </div>

                  {totalCount === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-blue-300/50">
                      Nessun ticket registrato con i filtri correnti.
                    </div>
                  ) : (
                    <div className="h-60 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={criticalityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1A3166" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#60A5FA" 
                            tick={{ fill: '#93C5FD', fontSize: 11, fontWeight: 'bold' }} 
                          />
                          <YAxis 
                            stroke="#60A5FA" 
                            tick={{ fill: '#93C5FD', fontSize: 11 }} 
                            allowDecimals={false} 
                          />
                          <RechartsTooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const fullItem = criticalityBreakdown.find(b => b.key === label);
                                return (
                                  <div className="rounded-xl border border-[#1A3166] bg-[#070F26] p-3 shadow-2xl text-xs text-white space-y-1">
                                    <p className="font-bold text-[#F3C64F]">{fullItem?.label || label}</p>
                                    <p className="text-emerald-400 font-mono">
                                      ✅ Chiusi / Risolti: <strong>{fullItem?.chiusi}</strong> ({fullItem?.pctClosed}%)
                                    </p>
                                    <p className="text-amber-400 font-mono">
                                      ⏳ Aperti / In Corso: <strong>{fullItem?.aperti}</strong> ({fullItem?.pctOpen}%)
                                    </p>
                                    <p className="text-blue-300/70 border-t border-[#1A3166] pt-1 mt-1 text-[11px]">
                                      Totale: {fullItem?.totale} segnalazioni
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="Chiusi / Risolti" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                          <Bar dataKey="Aperti / In Corso" fill="#F59E0B" radius={[4, 4, 0, 0]} stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAILED PERCENTAGES BREAKDOWN MATRIX TABLE */}
              <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636] overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[#1A3166] bg-[#070F24] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Percent className="h-4 w-4 text-[#D4AF37]" />
                      <span>Matrice Percentuale di Efficacia & Risoluzione</span>
                    </h4>
                    <p className="text-[11px] text-blue-300/70 mt-0.5">
                      Prospetto dettagliato con tassi percentuali di chiusura, tempi medi di risoluzione (MTTR) e SLA.
                    </p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 transition"
                  >
                    <Download className="h-3 w-3" />
                    <span>Esporta Dati Matrice</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-blue-200">
                    <thead className="bg-[#070F24] text-blue-300 uppercase font-mono border-b border-[#1A3166]">
                      <tr>
                        <th className="p-3">Livello Criticità</th>
                        <th className="p-3">Obiettivo SLA</th>
                        <th className="p-3 text-center">Totale Segnalazioni</th>
                        <th className="p-3 text-center">% sul Totale</th>
                        <th className="p-3 text-center">Ticket Chiusi</th>
                        <th className="p-3 text-center">Ticket Aperti</th>
                        <th className="p-3 text-center">Tasso Risoluzione (%)</th>
                        <th className="p-3 text-right">MTTR Medio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A3166] font-sans">
                      {criticalityBreakdown.map((item) => (
                        <tr key={item.key} className="hover:bg-[#0E1F4B]/50 transition">
                          <td className="p-3">
                            <span 
                              className="px-2.5 py-1 rounded-lg text-xs font-black font-mono border"
                              style={{ 
                                backgroundColor: `${item.color}20`,
                                color: item.color,
                                borderColor: `${item.color}40`
                              }}
                            >
                              {item.label}
                            </span>
                          </td>
                          <td className="p-3 text-blue-300 font-mono text-[11px]">
                            {item.sla}
                          </td>
                          <td className="p-3 text-center font-bold font-mono text-white text-sm">
                            {item.totale}
                          </td>
                          <td className="p-3 text-center font-mono text-blue-300 font-semibold">
                            {item.pctOfTotal}%
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 font-mono font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{item.chiusi} ({item.pctClosed}%)</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {item.aperti > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 font-mono font-bold">
                                <Clock className="h-3 w-3" />
                                <span>{item.aperti} ({item.pctOpen}%)</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-semibold">Tutti Risolti</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-[#070F24] rounded-full overflow-hidden border border-[#1A3166]">
                                <div 
                                  className="h-full bg-emerald-500" 
                                  style={{ width: `${item.pctClosed}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-white text-xs">{item.pctClosed}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-[#F3C64F] font-bold">
                            {item.lvlMttr ? formatDuration(item.lvlMttr) : 'N/D'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: NON RISOLTI (IN ATTESA / IN LAVORAZIONE)                          */}
          {/* ========================================================================= */}
          {activeTab === 'unresolved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-300/80">
                  Elenco delle anomalie attualmente aperte con tempi di attesa e passaggi programmati.
                </p>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  {unresolvedCount} In Corso
                </span>
              </div>

              {unresolvedTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1A3166] bg-[#0A1636]/60 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
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
                      {/* Top bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] pb-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-amber-400 bg-[#070F24] px-2.5 py-1 rounded-lg border border-amber-500/40">
                            #{ticket.ticketId}
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                            <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                            <span>Generato: <strong>{elapsed.text}</strong></span>
                            <span className="text-amber-400/60 font-mono text-[11px]">({elapsed.formattedDate})</span>
                          </span>

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

                        {/* Right: Asset & Assignee */}
                        <div className="rounded-lg bg-[#070F24] border border-[#1A3166] p-3 space-y-2.5 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-blue-300/60 block">Asset Coinvolto:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs font-bold text-[#F3C64F] bg-[#0E1F4B] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                                {targetAsset?.id || ticket.assetId || 'ID'}
                              </span>
                              <span className="font-bold text-white truncate max-w-[170px]" title={targetAsset?.name || ticket.asset}>
                                {targetAsset?.name || ticket.asset}
                              </span>
                            </div>
                            {targetAsset && (
                              <button
                                onClick={() => onOpenSingleAsset && onOpenSingleAsset(targetAsset)}
                                className="text-[10px] text-[#F3C64F] hover:underline mt-1 block"
                              >
                                Vedi scheda completa asset →
                              </button>
                            )}
                          </div>

                          <div className="border-t border-[#1A3166] pt-2">
                            <span className="text-[10px] uppercase font-bold text-blue-300/60 block">Tecnico / SLA:</span>
                            <div className="flex justify-between items-center mt-1">
                              <span className="font-bold text-white">{ticket.assignedTo}</span>
                              <span className="font-mono text-[11px] text-blue-300">SLA: {ticket.sla}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom */}
                      <div className="mt-3 pt-2.5 border-t border-[#1A3166]/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-blue-300/60">
                          {ticket.reporterName && `Segnalato da: ${ticket.reporterName}`} {ticket.reporterZone && `(${ticket.reporterZone})`}
                        </span>

                        {onAskAI && (
                          <button
                            onClick={() => onAskAI(ticket)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#0E1F4B] hover:bg-[#D4AF37]/20 px-2.5 py-1 text-xs font-bold text-[#F3C64F] transition"
                          >
                            <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                            <span>Diagnosi AI</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RISOLTI (CHIUSI CON DETTAGLIO RISOLUTORE & TEMPO)                  */}
          {/* ========================================================================= */}
          {activeTab === 'resolved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-300/80">
                  Archivio storico degli interventi conclusi con verifica di funzionamento e collaudo operativo.
                </p>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  {resolvedCount} Risolti
                </span>
              </div>

              {resolvedTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1A3166] bg-[#0A1636]/60 p-10 text-center">
                  <h4 className="text-sm font-bold text-white">Nessun ticket risolto trovato</h4>
                  <p className="text-xs text-blue-300/70 mt-1 max-w-sm mx-auto">
                    Nessun ticket in archivio soddisfa i criteri di ricerca attuali.
                  </p>
                </div>
              ) : (
                resolvedTickets.map(ticket => {
                  const targetAsset = getAssetForTicket(ticket);
                  const elapsedOpen = getElapsedTime(ticket.createdAtIso, ticket.timestamp);
                  const durationStr = formatDuration(ticket.durationMinutes);
                  const resolverName = ticket.resolvedBy || ticket.assignedTo || 'Tecnico di Presidio';

                  return (
                    <div
                      key={ticket.ticketId || ticket.id}
                      className="rounded-xl border border-emerald-500/35 bg-[#0A1636] p-4 sm:p-5 shadow-lg relative hover:border-emerald-500/60 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3166] pb-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-emerald-400 bg-[#070F24] px-2.5 py-1 rounded-lg border border-emerald-500/40">
                            #{ticket.ticketId}
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Intervento Concluso con Successo</span>
                          </span>

                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold">
                            {ticket.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                          <Timer className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Risolto in: <strong>{durationStr}</strong></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-wider">
                              Anomalia Iniziale:
                            </span>
                            <p className="text-xs font-medium text-white/90 mt-0.5 bg-[#070F24] p-2.5 rounded-lg border border-[#1A3166]">
                              "{ticket.userMessage}"
                            </p>
                          </div>

                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-300 font-bold flex items-center gap-1">
                                <User className="h-3 w-3 text-emerald-400" />
                                <span>Risolto da: <strong>{resolverName}</strong></span>
                              </span>
                              <span className="text-emerald-400/80 font-mono text-[11px]">
                                {ticket.resolvedAtIso 
                                  ? new Date(ticket.resolvedAtIso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                                  : 'Archiviato'}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-100/90 leading-relaxed">
                              {ticket.resolutionNotes || ticket.actionRequired || 'Intervento completato con verifica di funzionamento e collaudo operativo positivo.'}
                            </p>
                          </div>
                        </div>

                        {/* Right asset & timeline */}
                        <div className="rounded-lg bg-[#070F24] border border-[#1A3166] p-3 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-blue-300/60 block">Apparato:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs font-bold text-[#F3C64F] bg-[#0E1F4B] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                                {targetAsset?.id || ticket.assetId || 'ID'}
                              </span>
                              <span className="font-bold text-white truncate max-w-[170px]" title={targetAsset?.name || ticket.asset}>
                                {targetAsset?.name || ticket.asset}
                              </span>
                            </div>
                            {targetAsset && onOpenSingleAsset && (
                              <button
                                onClick={() => onOpenSingleAsset(targetAsset)}
                                className="text-[10px] text-[#F3C64F] hover:underline mt-1 block"
                              >
                                Apri storico di questo asset →
                              </button>
                            )}
                          </div>

                          <div className="border-t border-[#1A3166] pt-2 space-y-1 text-[11px]">
                            <div className="flex justify-between text-blue-300/70">
                              <span>Data Segnalazione:</span>
                              <span className="font-mono text-white">{elapsedOpen.formattedDate}</span>
                            </div>
                            <div className="flex justify-between text-blue-300/70">
                              <span>Tempo di Risoluzione:</span>
                              <span className="font-mono text-emerald-400 font-bold">{durationStr}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ASSET SUMMARY TABLE                                               */}
          {/* ========================================================================= */}
          {activeTab === 'asset_summary' && (
            <div className="rounded-xl border border-[#1A3166] bg-[#0A1636] overflow-hidden shadow">
              <div className="p-4 border-b border-[#1A3166] bg-[#070F24] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Prospetto Analitico per Singolo Apparato
                  </h4>
                  <p className="text-[11px] text-blue-300/70 mt-0.5">
                    Clicca su "Vedi Ticket Asset" per aprire la finestra focalizzata esclusivamente sui ticket di quell'asset.
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
                      <th className="p-3 text-center">Ticket Aperti</th>
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
                            <button
                              type="button"
                              onClick={() => onOpenSingleAsset && onOpenSingleAsset(asset)}
                              className="rounded bg-[#070F24] hover:bg-[#D4AF37]/20 px-2 py-0.5 font-mono font-bold text-[#F3C64F] border border-[#D4AF37]/30 transition hover:border-[#D4AF37] cursor-pointer"
                              title={`Apri la scheda e i ticket per ${asset.id}`}
                            >
                              {asset.id}
                            </button>
                          </td>
                          <td className="p-3">
                            <div 
                              onClick={() => onOpenSingleAsset && onOpenSingleAsset(asset)}
                              className="font-bold text-white text-xs hover:text-[#F3C64F] cursor-pointer transition"
                              title={`Vedi tutti i ticket per ${asset.name}`}
                            >
                              {asset.name}
                            </div>
                            <div className="text-[11px] text-blue-300/60 truncate max-w-xs">{asset.location || asset.description}</div>
                          </td>
                          <td className="p-3 text-blue-300">
                            {asset.area}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenSingleAsset) {
                                  onOpenSingleAsset(asset);
                                }
                              }}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                                resolvedForThis > 0 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 hover:scale-105 font-mono shadow-sm'
                                  : 'text-blue-300/40 hover:text-blue-200'
                              }`}
                              title={`Apri finestra con i soli ticket di ${asset.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{resolvedForThis} risolti</span>
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            {unresolvedForThis > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenSingleAsset) {
                                    onOpenSingleAsset(asset);
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 hover:scale-105 text-amber-300 border border-amber-500/40 px-2.5 py-1 text-xs font-bold font-mono transition cursor-pointer shadow-sm"
                                title={`Apri finestra con i soli ticket di ${asset.id}`}
                              >
                                <Clock className="h-3 w-3" />
                                <span>{unresolvedForThis} aperto</span>
                              </button>
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
                                if (onOpenSingleAsset) {
                                  onOpenSingleAsset(asset);
                                } else {
                                  setSelectedAssetId(asset.id);
                                  setActiveTab('analytics');
                                }
                              }}
                              className="rounded-lg bg-[#0E1F4B] hover:bg-[#D4AF37]/20 border border-[#1A3166] hover:border-[#D4AF37]/40 px-2.5 py-1 text-[11px] font-bold text-blue-200 hover:text-[#F3C64F] transition cursor-pointer"
                            >
                              Vedi Ticket Asset
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

        {/* MODAL FOOTER */}
        <div className="border-t border-[#1A3166] bg-[#0A1636] px-6 py-3.5 shrink-0 flex items-center justify-between text-xs text-blue-300/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Report e metriche calcolati in tempo reale dall'archivio ITSM di sala</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 transition"
            >
              Scarica CSV
            </button>
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
