import React, { useState } from 'react';
import { ITSMTicket, TicketStatus, PriorityLevel } from '../types';
import { TicketCard } from './TicketCard';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  ListFilter,
  BarChart3,
  X
} from 'lucide-react';

interface TicketBoardViewProps {
  tickets: ITSMTicket[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onAskAI?: (ticket: ITSMTicket) => void;
}

export const TicketBoardView: React.FC<TicketBoardViewProps> = ({
  tickets,
  onStatusChange,
  onAskAI,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Tutte');
  const [filterPriority, setFilterPriority] = useState<string>('Tutte');
  const [filterTechnician, setFilterTechnician] = useState<string>('Tutti');
  const [filterT3Only, setFilterT3Only] = useState<boolean>(false);

  // KPIs & Counts
  const totalCount = tickets.length;
  const p1Count = tickets.filter((t) => t.priority === 'P1').length;
  const p2Count = tickets.filter((t) => t.priority === 'P2').length;
  const p3Count = tickets.filter((t) => t.priority === 'P3').length;
  const p4Count = tickets.filter((t) => t.priority === 'P4').length;
  const t3Count = tickets.filter((t) => t.escalationT3).length;
  const openCount = tickets.filter((t) => t.status === 'Aperto' || t.status === 'In Lavorazione').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Risolto' || t.status === 'Chiuso').length;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.actionRequired.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userMessage.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'Tutte' || t.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchesPriority = filterPriority === 'Tutte' || t.priority === filterPriority;
    const matchesTechnician = filterTechnician === 'Tutti' || t.assignedTo.toLowerCase().includes(filterTechnician.toLowerCase());
    const matchesT3 = !filterT3Only || t.escalationT3;

    return matchesSearch && matchesCategory && matchesPriority && matchesTechnician && matchesT3;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tickets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `registro-ticket-itsm-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('Tutte');
    setFilterPriority('Tutte');
    setFilterTechnician('Tutti');
    setFilterT3Only(false);
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    filterCategory !== 'Tutte' || 
    filterPriority !== 'Tutte' || 
    filterTechnician !== 'Tutti' || 
    filterT3Only;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFilterPriority('Tutte')}
          className={`text-left rounded-xl border p-4 shadow-sm transition ${
            filterPriority === 'Tutte'
              ? 'border-[#D4AF37] bg-[#0E1F4B] ring-1 ring-[#D4AF37]/50'
              : 'border-[#1A3166] bg-[#0A1636]/90 hover:border-[#1E3975]'
          }`}
        >
          <span className="text-xs text-blue-300/70 font-medium">Totale Ticket</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{totalCount}</div>
          <span className="text-[11px] text-[#F3C64F]">Tutti i reparti</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterPriority(filterPriority === 'P1' ? 'Tutte' : 'P1')}
          title="Clicca per filtrare i ticket prioritari P1"
          className={`text-left rounded-xl border p-4 shadow-sm transition cursor-pointer ${
            filterPriority === 'P1'
              ? 'border-red-500 bg-red-950/60 ring-2 ring-red-500/50 shadow-md shadow-red-950/50'
              : 'border-red-500/30 bg-red-950/20 hover:bg-red-950/40 hover:border-red-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-300 font-medium flex items-center gap-1">
              Critici (P1)
              {filterPriority === 'P1' && <span className="text-[10px] bg-red-500 text-white px-1 rounded font-bold">ATTIVO</span>}
            </span>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono mt-1">{p1Count}</div>
          <span className="text-[11px] text-red-300/80">SLA &lt; 15 min • Filtra</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterT3Only(!filterT3Only)}
          className={`text-left rounded-xl border p-4 shadow-sm transition cursor-pointer ${
            filterT3Only
              ? 'border-purple-500 bg-purple-950/60 ring-2 ring-purple-500/50'
              : 'border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-300 font-medium">Escalati a T3</span>
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1">{t3Count}</div>
          <span className="text-[11px] text-purple-400">Coord. Piccirilli</span>
        </button>

        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#0E1F4B]/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#F3C64F] font-medium">Attivi in Coda</span>
            <Clock className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">{openCount}</div>
          <span className="text-[11px] text-blue-200">Aperti / In corso</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Risolti / Chiusi</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{resolvedCount}</div>
          <span className="text-[11px] text-emerald-300/80">Conformi a SLA</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-xl border border-[#1A3166] bg-[#0A1636]/90 p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per ID ticket, asset, problema o tecnico..."
              className="w-full rounded-lg border border-[#1A3166] bg-[#070F24] pl-9 pr-8 py-2 text-xs text-blue-100 placeholder-blue-400/40 focus:border-[#D4AF37] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-blue-400/60 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/30 hover:border-red-500/50 transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>Azzera Filtri</span>
              </button>
            )}

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-lg border border-[#1A3166] bg-[#0E1F4B] px-3 py-2 text-xs font-semibold text-blue-200 hover:border-[#D4AF37]/40 hover:text-white transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Esporta JSON</span>
            </button>
          </div>
        </div>

        {/* Priority Filter Bar (Pills & Selector) */}
        <div className="pt-2 border-t border-[#1A3166] space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-blue-300/80 mr-1 font-semibold">
              <Filter className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Filtra per Priorità:</span>
            </div>

            {/* Priority Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterPriority('Tutte')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'Tutte'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold border-[#F5D880] shadow-sm'
                    : 'bg-[#070F24] border-[#1A3166] text-blue-200 hover:border-[#D4AF37]/40 hover:text-white'
                }`}
              >
                <span>Tutte</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'Tutte' ? 'bg-[#070F26]/30 text-[#070F26]' : 'bg-[#0E1F4B] text-blue-300'
                }`}>
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P1' ? 'Tutte' : 'P1')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P1'
                    ? 'bg-red-600 text-white font-bold border-red-400 shadow-md ring-2 ring-red-500/40'
                    : p1Count > 0
                    ? 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/40'
                    : 'bg-[#070F24] border-[#1A3166] text-red-400/50 hover:border-red-500/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                <span>P1 - Critico</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P1' ? 'bg-black/40 text-white' : 'bg-red-950 text-red-300 border border-red-500/30'
                }`}>
                  {p1Count}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P2' ? 'Tutte' : 'P2')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P2'
                    ? 'bg-[#D4AF37] text-[#070F26] font-bold border-[#F5D880] shadow-md ring-2 ring-[#D4AF37]/40'
                    : p2Count > 0
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F3C64F] hover:bg-[#D4AF37]/25'
                    : 'bg-[#070F24] border-[#1A3166] text-amber-400/50 hover:border-[#D4AF37]/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[#F3C64F]"></span>
                <span>P2 - Alto</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P2' ? 'bg-[#070F26]/30 text-[#070F26]' : 'bg-[#0E1F4B] text-[#F3C64F] border border-[#D4AF37]/30'
                }`}>
                  {p2Count}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P3' ? 'Tutte' : 'P3')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P3'
                    ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-md ring-2 ring-blue-500/40'
                    : p3Count > 0
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40'
                    : 'bg-[#070F24] border-[#1A3166] text-blue-400/50 hover:border-blue-500/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                <span>P3 - Medio</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P3' ? 'bg-black/40 text-white' : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                }`}>
                  {p3Count}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterPriority(filterPriority === 'P4' ? 'Tutte' : 'P4')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border flex items-center gap-1.5 ${
                  filterPriority === 'P4'
                    ? 'bg-slate-400 text-[#070F26] font-bold border-slate-300 shadow-md ring-2 ring-slate-400/40'
                    : p4Count > 0
                    ? 'bg-slate-900/60 border-slate-600/40 text-slate-300 hover:bg-slate-800/60'
                    : 'bg-[#070F24] border-[#1A3166] text-slate-400/50 hover:border-slate-500/30'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                <span>P4 - Basso</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  filterPriority === 'P4' ? 'bg-black/40 text-white' : 'bg-slate-900 text-slate-300 border border-slate-600/30'
                }`}>
                  {p4Count}
                </span>
              </button>
            </div>
          </div>

          {/* Secondary Select Filters: Category, Technician, T3 */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1A3166]/60 text-xs">
            <span className="text-blue-300/70 font-semibold mr-1">Altri filtri:</span>

            {/* Categoria */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filtra per categoria"
              className="rounded-lg border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-blue-200 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="Tutte">Tutte le Categorie</option>
              <option value="IT">IT & Rete</option>
              <option value="Gaming">Gaming & Cassa</option>
              <option value="Facility">Facility & Sicurezza</option>
              <option value="F&B">Food & Beverage</option>
            </select>

            {/* Tecnico */}
            <select
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
              aria-label="Filtra per tecnico"
              className="rounded-lg border border-[#1A3166] bg-[#070F24] px-2.5 py-1.5 text-blue-200 focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="Tutti">Tutti i Tecnici</option>
              <option value="Piccirilli">Piccirilli (T1 / IT & T3 Coord)</option>
              <option value="Benin">Benin (T2 Gaming)</option>
              <option value="Padovani">Padovani (T2 Facility)</option>
              <option value="Ayoub">Ayoub (T2 F&B)</option>
            </select>

            {/* T3 Checkbox */}
            <label className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-1.5 text-purple-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterT3Only}
                onChange={(e) => setFilterT3Only(e.target.checked)}
                className="rounded border-[#1A3166] bg-[#070F24] text-purple-500 focus:ring-0"
              />
              <span className="font-semibold">Solo Escalation T3</span>
            </label>

            {/* Active Priority Tag */}
            {filterPriority !== 'Tutte' && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${
                filterPriority === 'P1'
                  ? 'bg-red-950/60 text-red-300 border-red-500/40'
                  : filterPriority === 'P2'
                  ? 'bg-[#D4AF37]/15 text-[#F3C64F] border-[#D4AF37]/40'
                  : filterPriority === 'P3'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                  : 'bg-slate-900/60 text-slate-300 border-slate-600/40'
              }`}>
                Priorità: <strong className="font-mono">{filterPriority}</strong>
                <button
                  type="button"
                  onClick={() => setFilterPriority('Tutte')}
                  className="hover:text-white"
                  title="Rimuovi filtro priorità"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-blue-300/70 px-1">
          <span>Risultati: {filteredTickets.length} ticket visualizzati</span>
          <span>Ordinati dal più recente</span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1A3166] p-12 text-center text-blue-400/50 space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-blue-400/40" />
            <p className="text-sm font-semibold text-blue-300/80">Nessun ticket trovato con i filtri selezionati.</p>
            <p className="text-xs max-w-sm mx-auto">
              {filterPriority !== 'Tutte'
                ? `Nessun ticket corrisponde alla priorità "${filterPriority}". Prova a reimpostare o selezionare un'altra priorità.`
                : 'Prova a modificare i criteri di ricerca o crea una nuova segnalazione nella chat.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#0E1F4B] px-4 py-2 text-xs font-semibold text-[#F3C64F] hover:bg-[#D4AF37]/20 transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>Azzera Tutti i Filtri</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id || ticket.ticketId}
                ticket={ticket}
                onStatusChange={onStatusChange}
                onAskAI={onAskAI}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
