import React, { useState } from 'react';
import { UserAccount } from '../types';
import { KeyRound, Lock, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onPasswordChanged: (updatedUser: UserAccount) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.trim().length < 3) {
      setError('La nuova password deve contenere almeno 3 caratteri.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Le due password inserite non coincidono.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/accounts/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: currentUser.id,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Impossibile aggiornare la password.');
      }

      const updatedUser: UserAccount = {
        ...currentUser,
        password: newPassword.trim(),
      };

      onPasswordChanged(updatedUser);
      setSuccess(`Password aggiornata con successo per ${currentUser.displayName}!`);

      setTimeout(() => {
        onClose();
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(null);
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento della password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl border border-[#1A3166] bg-[#0A1636] text-blue-100 shadow-2xl p-5 sm:p-6 space-y-4 ring-1 ring-[#D4AF37]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1A3166] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F3C64F] text-[#070F26] font-bold shadow-md">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Modifica Password Personale</h2>
              <p className="text-xs text-blue-300/80">Account: <strong className="text-[#F3C64F]">{currentUser.displayName}</strong> ({currentUser.email})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-300 hover:bg-[#1A3166] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 block font-bold">Password Aggiornata!</strong>
              <p>{success}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-blue-200 block">
                  Nuova Password:
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci la nuova password"
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-blue-200 block">
                Conferma Nuova Password:
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la nuova password"
                className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1A3166]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-[#1A3166] text-blue-300 hover:bg-[#0E1F4B] hover:text-white transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 text-[#070F26] font-bold shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Salvataggio...' : 'Salva Nuova Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
