import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Send, 
  Bell, 
  ShieldCheck, 
  Users 
} from 'lucide-react';

interface OnlineLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPortal: () => void;
}

export const OnlineLiveModal: React.FC<OnlineLiveModalProps> = ({
  isOpen,
  onClose,
  onOpenPortal,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ros2xhpnlmcbjntyuvfop6-556235055910.europe-west2.run.app';
  const portalUrl = `${currentUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-[#1A3166] bg-[#0A1636] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F3C64F]">Applicazione Online & Ricezione Live</h2>
              <p className="text-xs text-blue-300/70">Direttiva del docente: test multi-utente e arrivo ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-blue-300 hover:text-white hover:bg-[#0E1F4B] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl border border-[#1A3166] bg-[#070F24] p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-blue-300/70">
            <span className="font-semibold text-blue-100">Link Pubblico per Segnalare Disservizi:</span>
            <span className="text-[10px] text-[#F3C64F] font-mono flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              Online su Cloud Run
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={portalUrl}
              className="flex-1 rounded-lg border border-[#1A3166] bg-[#0A1636] px-3 py-2 text-xs font-mono text-[#F3C64F] select-all"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-[#070F26] transition shrink-0 shadow-md shadow-[#D4AF37]/20"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#070F26] stroke-[3]" /> : <Copy className="h-3.5 w-3.5 text-[#070F26] stroke-[2.5]" />}
              <span>{copied ? 'Copiato!' : 'Copia'}</span>
            </button>
          </div>
        </div>

        {/* Instructions for professor demonstration */}
        <div className="space-y-2.5 text-xs text-blue-200">
          <span className="font-bold text-white block">Come mostrare la ricezione live al docente:</span>
          
          <div className="flex items-start gap-2.5 rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3">
            <Smartphone className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">1. Apri da un altro dispositivo o scheda incognito</strong>
              <p className="text-blue-300/70 text-[11px] mt-0.5">
                Invia il link al tuo smartphone o aprilo in una finestra separata per simulare l'utente (cliente, barista o operatore di cassa).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3">
            <Send className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">2. Invia una segnalazione dal Portale Utente</strong>
              <p className="text-blue-300/70 text-[11px] mt-0.5">
                Scrivi es. "La macchinetta del caffè perde acqua" o usa uno dei pulsanti di test rapidi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#1A3166] bg-[#070F24]/80 p-3">
            <Bell className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">3. Guarda l'arrivo immediato nel Cruscotto del Tecnico</strong>
              <p className="text-blue-300/70 text-[11px] mt-0.5">
                La schermata del tecnico destinatario (es. Ayoub per F&B) suonerà e mostrerà il ticket in arrivo in tempo reale!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenPortal();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#1A3166] bg-[#0E1F4B] px-4 py-2.5 text-xs font-semibold text-blue-200 hover:bg-[#152B66] hover:text-white transition"
          >
            <span>Apri Portale Segnalazione</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 px-4 py-2.5 text-xs font-bold text-[#070F26] transition shadow-md shadow-[#D4AF37]/20"
          >
            <span>Chiudi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
