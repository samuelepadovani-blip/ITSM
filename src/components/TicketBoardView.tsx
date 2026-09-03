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
  BarChart3
} from 'lucide-react';

interface TicketBoardViewProps {
  tickets: ITSMTicket[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export const TicketBoardView: React.FC<TicketBoardViewProps> = ({
  tickets,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Tutte');
  const [filterPriority, setFilterPriority] = useState<string>('Tutte');
  const [filterTechnician, setFilterTechnician] = useState<string>('Tutti');
  const [filterT3Only, setFilterT3Only] = useState<boolean>(false);

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

  // KPIs
  const totalCount = tickets.length;
  const p1Count = tickets.filter((t) => t.priority === 'P1').length;
  const t3Count = tickets.filter((t) => t.escalationT3).length;
  const openCount = tickets.filter((t) => t.status === 'Aperto' || t.status === 'In Lavorazione').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Risolto' || t.status === 'Chiuso').length;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tickets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `registro-ticket-itsm-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Totale Ticket</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{totalCount}</div>
          <span className="text-[11px] text-cyan-400">Tutti i reparti</span>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-300 font-medium">Critici (P1)</span>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono mt-1">{p1Count}</div>
          <span className="text-[11px] text-red-300/80">SLA &lt; 15 min</span>
        </div>

        <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-300 font-medium">Escalati a T3</span>
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1">{t3Count}</div>
          <span className="text-[11px] text-purple-400">Coord. Piccirilli</span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Attivi in Coda</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{openCount}</div>
          <span className="text-[11px] text-amber-300/80">Aperti / In corso</span>
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
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per ID ticket, asset, problema o tecnico..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Esporta Registro JSON</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 mr-2">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold">Filtri:</span>
          </div>

          {/* Categoria */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filtra per categoria"
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="Tutte">Tutte le Categorie</option>
            <option value="IT">IT & Rete</option>
            <option value="Gaming">Gaming & Cassa</option>
            <option value="Facility">Facility & Sicurezza</option>
            <option value="F&B">Food & Beverage</option>
          </select>

          {/* Priorità */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            aria-label="Filtra per priorità"
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="Tutte">Tutte le Priorità</option>
            <option value="P1">P1 - Critico</option>
            <option value="P2">P2 - Alto</option>
            <option value="P3">P3 - Medio</option>
            <option value="P4">P4 - Basso</option>
          </select>

          {/* Tecnico */}
          <select
            value={filterTechnician}
            onChange={(e) => setFilterTechnician(e.target.value)}
            aria-label="Filtra per tecnico"
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-300 focus:outline-none"
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
              className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
            />
            <span className="font-semibold">Solo Escalation T3 (Fornitori Esterni)</span>
          </label>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Risultati: {filteredTickets.length} ticket visualizzati</span>
          <span>Ordinati dal più recente</span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">Nessun ticket trovato con i filtri selezionati.</p>
            <p className="text-xs">Prova a modificare i criteri di ricerca o crea una nuova segnalazione nella chat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id || ticket.ticketId}
                ticket={ticket}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
