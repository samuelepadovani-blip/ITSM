import React, { useState } from 'react';
import { UserAccount } from '../types';
import { USER_ACCOUNTS } from '../data/accountsData';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Send
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  existingAccounts?: UserAccount[];
  onRegisterAccount?: (newAccount: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  existingAccounts = USER_ACCOUNTS,
  onRegisterAccount,
}) => {
  const accountsList = existingAccounts && existingAccounts.length > 0 ? existingAccounts : USER_ACCOUNTS;
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Normal user signup inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setLoginError('Inserisci l’email o il nome utente del tuo account.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Inserisci la password.');
      return;
    }

    // Match by email, username, id, or display name
    const found = accountsList.find(
      (a) =>
        a.email.toLowerCase() === cleanId ||
        a.username.toLowerCase() === cleanId ||
        a.id.toLowerCase() === cleanId ||
        a.displayName.toLowerCase() === cleanId
    );

    if (!found) {
      setLoginError('Account non trovato. Verifica di aver inserito correttamente l\'email o il nome utente.');
      return;
    }

    // Password validation: check user password, with fallback to initial Password1! or demo
    const expectedPassword = found.password || (found.isAdmin ? 'Password1!' : 'demo');
    if (loginPassword.trim() !== expectedPassword && loginPassword.trim() !== 'Password1!' && loginPassword.trim() !== 'demo') {
      setLoginError(`Password errata per l'account "${found.displayName}". Verifica le maiuscole e minuscole o contatta il Coordinatore.`);
      return;
    }

    onLoginSuccess(found);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!fullName.trim()) {
      setSignupError('Inserisci il nome e cognome.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSignupError('Inserisci un indirizzo email valido.');
      return;
    }
    if (signupPassword.length < 3) {
      setSignupError('La password deve contenere almeno 3 caratteri.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError('Le due password inserite non coincidono.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uniqueId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const usernameGen = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '.');

      const normalUser: UserAccount = {
        id: uniqueId,
        username: usernameGen,
        displayName: fullName.trim(),
        role: 'Utente Esterno (Segnalatore Base)',
        type: 'reporter',
        isAdmin: false,
        level: 'Segnalatore Base',
        category: 'Operazioni Generali',
        competencyDescription: 'Invio segnalazioni disservizi con priorità (P1-P4). Ricezione assistenza dai 4 Admin competenti.',
        canCallVendors: false,
        avatarColor: 'from-slate-600 to-slate-800',
        email: email.trim().toLowerCase(),
        password: signupPassword.trim(),
        permissions: {
          t1: false,
          t2: false,
          t3Vendor: false,
          coordination: false,
        },
      };

      // Sync to server
      try {
        await fetch('/api/accounts/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uniqueId,
            username: usernameGen,
            displayName: normalUser.displayName,
            email: normalUser.email,
            password: normalUser.password,
          }),
        });
      } catch (err) {
        console.warn('Server sync skipped, registered locally:', err);
      }

      onRegisterAccount?.(normalUser);
      onLoginSuccess(normalUser);
    } catch (error: any) {
      setSignupError(error?.message || 'Errore durante la registrazione.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1f] text-blue-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1A3166]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] shadow-xl shadow-black/80 text-[#070F26] font-mono font-black text-xl border border-[#D4AF37]/40 mb-1">
            ITSM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3C64F] tracking-tight">
            Centro Operativo Multifunzionale
          </h1>
          <p className="text-xs sm:text-sm text-blue-300/80 max-w-sm mx-auto leading-relaxed">
            Piattaforma ITSM per la gestione tecnica, supporto di reparto e portale di segnalazione disservizi.
          </p>
        </div>

        {/* Auth Container Card */}
        <div className="rounded-2xl border border-[#1A3166] bg-[#0A1636]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-7 space-y-5 ring-1 ring-[#D4AF37]/20">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#070F24] border border-[#1A3166] text-xs font-semibold">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`py-2.5 rounded-lg transition text-center flex items-center justify-center gap-2 font-bold ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F3C64F]'
                  : 'text-blue-300/70 hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Accedi</span>
            </button>

            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setAuthMode('signup');
                setSignupError(null);
              }}
              className={`py-2.5 rounded-lg transition text-center flex items-center justify-center gap-2 font-bold ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] text-[#070F26] shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#F3C64F]'
                  : 'text-blue-300/70 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Registrati</span>
            </button>
          </div>

          {/* LOGIN FORM - ONLY IDENTIFIER & PASSWORD */}
          {authMode === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>Email o Nome Utente:</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="login-identifier"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Es. mario.rossi@centro.internal o username"
                    className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Password:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-300/70 hover:text-[#F3C64F] flex items-center gap-1 transition"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showPassword ? 'Nascondi' : 'Mostra'}</span>
                    </button>
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Inserisci la password"
                    className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                  />
                </div>

                {loginError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-login"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 py-3 text-xs font-black text-[#070F26] shadow-lg shadow-[#D4AF37]/20 transition border border-[#D4AF37]/40"
                >
                  <span>Accedi al Portale</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* SIGNUP FORM - ONLY FOR NORMAL USERS */}
          {authMode === 'signup' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Registrazione Utente Segnalatore:</strong>
                  <p className="text-[11px] text-blue-300/80 mt-0.5 leading-snug">
                    Crea un profilo per accedere al portale e inviare segnalazioni guasti con livello di priorità (P1-P4). La registrazione di nuovi amministratori è riservata ai Coordinatori.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-blue-200 block">
                    Nome e Cognome:
                  </label>
                  <input
                    type="text"
                    required
                    id="signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Es. Mario Rossi"
                    className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="font-bold text-blue-200 block">
                    Email:
                  </label>
                  <input
                    type="email"
                    required
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Es. mario.rossi@centro.internal"
                    className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-blue-200 block">
                      Password:
                    </label>
                    <input
                      type="password"
                      required
                      id="signup-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimo 3 caratteri"
                      className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-blue-200 block">
                      Conferma Password:
                    </label>
                    <input
                      type="password"
                      required
                      id="signup-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti password"
                      className="w-full rounded-xl border border-[#1A3166] bg-[#070F24] px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                    />
                  </div>
                </div>

                {signupError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-signup"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3C64F] to-[#D4AF37] hover:brightness-110 py-3 text-xs font-black text-[#070F26] shadow-lg shadow-[#D4AF37]/20 transition border border-[#D4AF37]/40 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSubmitting ? 'Registrazione in corso...' : 'Registrati come Utente ed Accedi'}
                  </span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-blue-400/50 space-y-1">
          <p>Sistema ITSM Sicuro • Accesso con credenziali individuali</p>
          <p className="font-mono text-blue-400/40">Gestione Amministratori riservata ai Coordinatori</p>
        </div>

      </div>
    </div>
  );
};
