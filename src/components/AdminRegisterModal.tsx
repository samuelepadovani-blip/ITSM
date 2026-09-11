import React, { useState } from 'react';
import { UserAccount, AssetCategory } from '../types';
import { 
  ShieldCheck, 
  X, 
  UserPlus, 
  Mail, 
  Lock, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  User,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount;
  coordinatorUser?: UserAccount;
  onAdminCreated: (newAdmin: UserAccount) => void;
}

export const AdminRegisterModal: React.FC<AdminRegisterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  coordinatorUser,
  onAdminCreated,
}) => {
  const activeCoordinator = coordinatorUser || currentUser;
  const coordinatorDisplayName = activeCoordinator?.displayName || 'Piccirilli (Coordinatore)';
  const coordinatorId = activeCoordinator?.id || 'piccirilli';

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password1!');
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState<AssetCategory | 'Operazioni Generali'>('IT & Rete');
  
  // Levels and Coordination checkboxes as explicitly required:
  // "con delle check box per poter selezionare il livello (T1, T2 o T3 fornitore) e una per selezionare il coordinamento"
  const [isT1, setIsT1] = useState(false);
  const [isT2, setIsT2] = useState(true);
  const [isT3Vendor, setIsT3Vendor] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-generate username and email suggestion from name
  const handleNameChange = (val: string) => {
    setDisplayName(val);
    const cleaned = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '.');
    if (cleaned) {
      if (!username || username === cleaned.slice(0, username.length)) {
        setUsername(cleaned);
      }
      if (!email || email.endsWith('@centro.internal')) {
        setEmail(`${cleaned}@centro.internal`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!displayName.trim()) {
      setError('Inserisci il nome e cognome dell\'amministratore.');
      return;
    }
    if (!username.trim()) {
      setError('Inserisci il nome utente.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }
    if (!password || password.length < 3) {
      setError('La password deve contenere almeno 3 caratteri.');
      return;
    }

    if (!isT1 && !isT2 && !isT3Vendor && !isCoordinator) {
      setError('Seleziona almeno un livello di competenza (T1, T2, T3) o il coordinamento.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/accounts/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorId: coordinatorId,
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          category,
          permissions: {
            t1: isT1,
            t2: isT2,
            t3Vendor: isT3Vendor,
            coordination: isCoordinator,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Impossibile registrare il nuovo amministratore.');
      }

      const createdAccount: UserAccount = data.account;
      onAdminCreated(createdAccount);

      setSuccessMsg(
        `Nuovo Amministratore "${createdAccount.displayName}" registrato con successo! Potrà accedere con email "${createdAccount.email}" e password iniziale "${createdAccount.password}".`
      );

      // Clear form after 2 seconds or let user see
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione dell\'amministratore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl rounded-2xl border border-[#D4AF37]/50 bg-[#0A1636] text-blue-100 shadow-2xl p-5 sm:p-7 space-y-5 ring-1 ring-[#D4AF37]/30 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1A3166] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] font-bold shadow-md shadow-black/60">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Registra Nuovo Utente Admin</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/40">
                  Riservato Coordinatori
                </span>
              </h2>
              <p className="text-xs text-blue-300/80">
                Funzione abilitata dal ruolo di Coordinamento di <strong className="text-white">{coordinatorDisplayName}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-300 hover:bg-[#1A3166] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-300 text-sm block font-bold">Registrazione Completata!</strong>
              <p>{successMsg}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Identity Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-bold text-blue-200 block">
                  Nome e Cognome Admin:
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-blue-200 block">
                  Username di Accesso:
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Es. mrossi"
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-bold text-blue-200 block">
                  Email Aziendale:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Es. mrossi@centro.internal"
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-200 block">
                    Password Iniziale:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-blue-300/70 hover:text-[#F3C64F] flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPassword ? 'Nascondi' : 'Mostra'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Predefinita: Password1!"
                  className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-[#F3C64F] font-mono focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>
            </div>

            {/* Department Assignment */}
            <div className="space-y-1.5">
              <label className="font-bold text-blue-200 block">
                Reparto / Categoria di Competenza:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              >
                <option value="IT & Rete">IT & Rete (Server, Reti, POS, TVCC, Casse centralizzate)</option>
                <option value="Gaming & Cassa">Gaming & Cassa (Slot VLT/AWP, Cambiamonete, Bowling)</option>
                <option value="Facility & Sicurezza">Facility & Sicurezza (Climatizzazione UTA, Audio, Luci, Antincendio)</option>
                <option value="Food & Beverage">Food & Beverage (Caffè, Frigo bar, Spine birra, Distributori)</option>
                <option value="Operazioni Generali">Operazioni Generali / Coordinamento Sala</option>
              </select>
            </div>

            {/* CHECKBOXES FOR LEVEL & COORDINATION */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold text-[#F3C64F] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Seleziona Livello e Permessi Amministratore</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* T1 Checkbox */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#1A3166] bg-[#070F24] cursor-pointer hover:bg-[#0E1F4B] transition">
                  <input
                    type="checkbox"
                    checked={isT1}
                    onChange={(e) => setIsT1(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#1A3166] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div>
                    <span className="font-bold text-white block">Livello T1 (Triage)</span>
                    <span className="text-[11px] text-blue-300/70">
                      Presa in carico rapida e supporto di primo livello.
                    </span>
                  </div>
                </label>

                {/* T2 Checkbox */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#1A3166] bg-[#070F24] cursor-pointer hover:bg-[#0E1F4B] transition">
                  <input
                    type="checkbox"
                    checked={isT2}
                    onChange={(e) => setIsT2(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#1A3166] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div>
                    <span className="font-bold text-white block">Livello T2 (Specialista)</span>
                    <span className="text-[11px] text-blue-300/70">
                      Risoluzione tecnica specialistica di reparto.
                    </span>
                  </div>
                </label>

                {/* T3 Vendor Checkbox */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#1A3166] bg-[#070F24] cursor-pointer hover:bg-[#0E1F4B] transition">
                  <input
                    type="checkbox"
                    checked={isT3Vendor}
                    onChange={(e) => setIsT3Vendor(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#1A3166] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div>
                    <span className="font-bold text-white block">Livello T3 (Fornitore)</span>
                    <span className="text-[11px] text-blue-300/70">
                      Autorizzazione alla chiamata e gestione fornitori esterni.
                    </span>
                  </div>
                </label>

                {/* Coordination Checkbox */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  isCoordinator 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 ring-1 ring-[#D4AF37]' 
                    : 'border-[#1A3166] bg-[#070F24] hover:bg-[#0E1F4B]'
                }`}>
                  <input
                    type="checkbox"
                    checked={isCoordinator}
                    onChange={(e) => setIsCoordinator(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#1A3166] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div>
                    <span className="font-bold text-[#F3C64F] block flex items-center gap-1">
                      <span>Coordinamento</span>
                      <Crown className="h-3 w-3 text-[#D4AF37]" />
                    </span>
                    <span className="text-[11px] text-blue-200/90">
                      Supervisione registro e potere di creare altri admin.
                    </span>
                  </div>
                </label>

              </div>
            </div>

            {/* Explanatory note */}
            {isCoordinator && (
              <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-xs text-[#F3C64F] flex items-center gap-2">
                <Crown className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                <span>
                  <strong>Nota Coordinatore:</strong> Questo account riceverà in automatico la possibilità di accedere al Registro Generale e registrare a sua volta altri utenti admin!
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A3166]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#1A3166] text-blue-300 hover:bg-[#0E1F4B] hover:text-white transition"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 text-[#070F26] font-bold shadow-lg shadow-[#D4AF37]/20 transition disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isSubmitting ? 'Registrazione...' : 'Crea Amministratore'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
