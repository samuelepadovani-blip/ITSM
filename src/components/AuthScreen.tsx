import React, { useState } from 'react';
import { UserAccount, AssetCategory, TechnicianPermissions } from '../types';
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
  Gamepad2, 
  Building2, 
  Coffee, 
  Laptop, 
  Users, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Sparkles,
  Layers,
  Wrench,
  Check
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

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'reporter' | 'technician'>('reporter');
  
  // Technician specific settings
  const [permT1, setPermT1] = useState(false);
  const [permT2, setPermT2] = useState(true);
  const [permT3Vendor, setPermT3Vendor] = useState(false);
  const [permCoordination, setPermCoordination] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('Gaming & Cassa');
  
  const [signupError, setSignupError] = useState<string | null>(null);

  // Quick preset login handler
  const handleQuickLogin = (acc: UserAccount) => {
    onLoginSuccess(acc);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setLoginError('Inserisci l’email o il nome utente.');
      return;
    }

    // Match by email, username, or id
    const found = accountsList.find(
      (a) =>
        a.email.toLowerCase() === cleanId ||
        a.username.toLowerCase() === cleanId ||
        a.id.toLowerCase() === cleanId ||
        a.displayName.toLowerCase().includes(cleanId)
    );

    if (!found) {
      setLoginError('Account non trovato. Controlla le credenziali o seleziona un profilo demo.');
      return;
    }

    // Password validation (demo check)
    if (found.password && loginPassword && loginPassword !== found.password && loginPassword !== 'demo') {
      setLoginError('Password non corretta. (Suggerimento: usa "demo" per gli account di prova)');
      return;
    }

    onLoginSuccess(found);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!fullName.trim()) {
      setSignupError('Inserisci il tuo nome e cognome.');
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
      setSignupError('Le password non coincidono.');
      return;
    }

    // If technician, ensure at least one level is chosen
    if (userType === 'technician' && !permT1 && !permT2 && !permT3Vendor && !permCoordination) {
      setSignupError('Seleziona almeno un livello o autorizzazione (T1, T2, T3 Fornitori o Coordinamento).');
      return;
    }

    const uniqueId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const usernameGenerated = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '.');

    // Build role title and level description
    let roleTitle = 'Utente Segnalatore (Staff Centro)';
    let levelLabel = 'Segnalatore Base';
    let competencyDesc = 'Invio segnalazioni disservizi in linguaggio naturale e tracciamento dello stato dei ticket.';
    let avatarColor = 'from-slate-600 to-slate-800';

    const permissions: TechnicianPermissions = {
      t1: userType === 'technician' ? permT1 : false,
      t2: userType === 'technician' ? permT2 : false,
      t3Vendor: userType === 'technician' ? permT3Vendor : false,
      coordination: userType === 'technician' ? permCoordination : false,
    };

    if (userType === 'technician') {
      const parts: string[] = [];
      if (permT1) parts.push('T1');
      if (permT2) parts.push('T2');
      if (permT3Vendor) parts.push('T3 Fornitori');
      if (permCoordination) parts.push('Coordinatore');

      levelLabel = parts.join(' / ') || 'Tecnico Specialista';
      roleTitle = `${levelLabel}; Tecnico ${selectedCategory}`;

      if (selectedCategory === 'Gaming & Cassa') {
        avatarColor = 'from-amber-500 to-orange-600';
        competencyDesc = 'Competenza su Slot Machine, Cambiamonete, Gettoniere, Casse e Piste Bowling.';
      } else if (selectedCategory === 'Facility & Sicurezza') {
        avatarColor = 'from-emerald-500 to-teal-600';
        competencyDesc = 'Competenza su Impianto Audio, Luci di sala, Climatizzazione/UTA, Allarmi e Antincendio.';
      } else if (selectedCategory === 'Food & Beverage') {
        avatarColor = 'from-rose-500 to-pink-600';
        competencyDesc = 'Competenza su Macchine caffè, Frigoriferi bar, Tostapane, Spine e Distributori.';
      } else {
        avatarColor = 'from-blue-600 to-indigo-600';
        competencyDesc = 'Competenza su Infrastruttura IT, Reti, POS, Videocamere e Triage centrale.';
      }

      if (permT3Vendor) {
        competencyDesc += ' Autorizzato alla gestione ed escalation verso Fornitori Esterni (T3).';
      }
      if (permCoordination) {
        competencyDesc += ' Ruolo di coordinatore con accesso al registro completo.';
      }
    }

    const newAccount: UserAccount = {
      id: uniqueId,
      username: usernameGenerated,
      displayName: fullName.trim(),
      role: roleTitle,
      type: userType,
      level: levelLabel,
      technicianId: userType === 'technician' ? uniqueId : undefined,
      category: userType === 'technician' ? selectedCategory : 'Operazioni Generali',
      competencyDescription: competencyDesc,
      canCallVendors: permT3Vendor,
      avatarColor,
      email: email.trim(),
      password: signupPassword,
      permissions,
    };

    onRegisterAccount?.(newAccount);
    onLoginSuccess(newAccount);
  };

  const getAccountIcon = (id: string) => {
    switch (id) {
      case 'benin':
        return <Gamepad2 className="h-4 w-4 text-amber-400" />;
      case 'padovani':
        return <Building2 className="h-4 w-4 text-emerald-400" />;
      case 'ayoub':
        return <Coffee className="h-4 w-4 text-rose-400" />;
      case 'piccirilli':
        return <Laptop className="h-4 w-4 text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-slate-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-950 text-white font-mono font-bold text-xl ring-1 ring-white/20 mb-1">
            ITSM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Centro Operativo Multifunzionale
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Piattaforma di Service Management con segregazione dei ruoli, gestione dei livelli di supporto ed escalation T3.
          </p>
        </div>

        {/* Auth Container Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 ring-1 ring-white/5">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`py-2.5 rounded-lg transition text-center flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Accedi (Login)</span>
            </button>

            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setAuthMode('signup');
                setSignupError(null);
              }}
              className={`py-2.5 rounded-lg transition text-center flex items-center justify-center gap-2 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Registrati (Sign Up)</span>
            </button>
          </div>

          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Email o Nome Utente:</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="login-identifier"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Es. piccirilli@centro.internal oppure benin"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Password:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition"
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
                    placeholder="Inserisci la password (es. demo)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {loginError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-login"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 hover:opacity-95 transition"
                >
                  <span>Accedi al Centro Operativo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* QUICK DEMO ACCESS PRESETS (for evaluation / examination) */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Accesso Rapido Demo (1-Click per la Valutazione):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Password: demo</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {accountsList.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500 hover:bg-slate-800/60 transition text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                          {getAccountIcon(acc.id)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>{acc.displayName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-normal">
                              {acc.level}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {acc.role} • <span className="text-slate-500 font-mono">{acc.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-cyan-400 group-hover:translate-x-0.5 transition">
                        <span>Entra</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SIGNUP FORM */}
          {authMode === 'signup' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
                
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">
                    1. Nome e Cognome / Nome Operatore:
                  </label>
                  <input
                    type="text"
                    required
                    id="signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Es. Luca Bianchi, Silvia Neri..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* 2. Email */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">
                    2. Email Aziendale:
                  </label>
                  <input
                    type="email"
                    required
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Es. luca.bianchi@centro.internal"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* 3. Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block">
                      3. Password:
                    </label>
                    <input
                      type="password"
                      required
                      id="signup-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min. 3 caratteri"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block">
                      Conferma Password:
                    </label>
                    <input
                      type="password"
                      required
                      id="signup-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti password"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. USER TYPE DROPDOWN (Strictly requested by the user!) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label htmlFor="select-user-type" className="font-bold text-slate-200 block text-xs">
                    4. Tipo di Utente (Seleziona Ruolo Base):
                  </label>
                  <select
                    id="select-user-type"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as 'reporter' | 'technician')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="reporter">
                      Utente (Personale di sala / Bar / Cassa - Segnalazione disservizi)
                    </option>
                    <option value="technician">
                      Tecnico (Personale operativo di manutenzione, riparazione e supporto)
                    </option>
                  </select>
                </div>

                {/* 5. TECHNICIAN CHECKBOXES & OPTIONS (Shown only if Tecnico is selected) */}
                {userType === 'technician' && (
                  <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                        <Wrench className="h-4 w-4 text-cyan-400" />
                        <span>Configurazione Livello Tecnico e Permessi Operativi:</span>
                      </span>
                      <p className="text-[11px] text-cyan-200/80 mt-0.5">
                        Spunta i livelli a cui questo tecnico è abilitato ad operare:
                      </p>
                    </div>

                    <div className="space-y-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      {/* T1 Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          id="check-t1"
                          checked={permT1}
                          onChange={(e) => setPermT1(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-900"
                        />
                        <div>
                          <strong className="text-white text-xs block">
                            Livello T1 (Primo Soccorso & Triage Base)
                          </strong>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Assistenza di primo livello, verifica rapida dell'anomalia e triage iniziale dei ticket.
                          </span>
                        </div>
                      </label>

                      {/* T2 Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-800/80">
                        <input
                          type="checkbox"
                          id="check-t2"
                          checked={permT2}
                          onChange={(e) => setPermT2(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-900"
                        />
                        <div>
                          <strong className="text-white text-xs block">
                            Livello T2 (Specialista di Reparto)
                          </strong>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Interventi tecnici specialistici on-site sul proprio ambito di competenza.
                          </span>
                        </div>
                      </label>

                      {/* T2 Category Selection (if T2 is active) */}
                      {permT2 && (
                        <div className="ml-6 mt-2 space-y-1 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                          <label className="text-[11px] font-semibold text-slate-300 block">
                            Reparto di Specializzazione T2:
                          </label>
                          <select
                            id="select-tech-category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as AssetCategory)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                          >
                            <option value="Gaming & Cassa">Gaming & Cassa (Slot Machine, Casse, Cambiamonete, Bowling)</option>
                            <option value="Facility & Sicurezza">Facility & Sicurezza (Clima UTA, Luci, Audio, Allarmi)</option>
                            <option value="Food & Beverage">Food & Beverage (Macchine Caffè, Frigo Bar, Forni, Distributori)</option>
                            <option value="IT & Rete">IT & Rete (Wi-Fi, Switch, POS, Server, Videocamere)</option>
                          </select>
                        </div>
                      )}

                      {/* T3 Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-800/80">
                        <input
                          type="checkbox"
                          id="check-t3"
                          checked={permT3Vendor}
                          onChange={(e) => setPermT3Vendor(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-purple-500 text-purple-600 focus:ring-purple-500 bg-slate-900"
                        />
                        <div>
                          <strong className="text-purple-300 text-xs block">
                            T3 Fornitori (Autorizzazione Chiamata Esterna)
                          </strong>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Autorizzato a coordinare le ditte costruttrici esterne, richiedere ricambi originali e registrare numeri di chiamata fornitore.
                          </span>
                        </div>
                      </label>

                      {/* Coordinamento Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-800/80">
                        <input
                          type="checkbox"
                          id="check-coordination"
                          checked={permCoordination}
                          onChange={(e) => setPermCoordination(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                        />
                        <div>
                          <strong className="text-indigo-300 text-xs block">
                            Coordinamento (Supervisione e Registro Generale)
                          </strong>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Accesso alla scheda globale "Registro T1 Coordinamento", dispatching e panoramica di tutti i reparti.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Summary of what this user will be able to do */}
                    <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-[11px] text-slate-300 space-y-1">
                      <span className="font-bold text-cyan-300 block">Riepilogo Privilegi Attivati:</span>
                      <ul className="space-y-0.5 text-slate-400 list-disc list-inside">
                        {permT1 && <li>Gestione e Triage ticket di primo livello (T1)</li>}
                        {permT2 && <li>Visualizzazione e risoluzione ticket reparto <strong>{selectedCategory}</strong></li>}
                        {permT3Vendor && <li className="text-purple-300 font-medium">Apertura chiamate e gestione Fornitori Esterni (T3)</li>}
                        {permCoordination && <li className="text-indigo-300 font-medium">Accesso al Registro T1 di Coordinamento e Dispatching</li>}
                        <li>Capacità di spostare ticket di livello verso altri tecnici</li>
                      </ul>
                    </div>
                  </div>
                )}

                {signupError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-signup"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 hover:opacity-95 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Crea Account ed Entra nel Sistema</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Sistema ITSM Sicuro • Segregazione delle Competenze conforme allo Standard ITIL v4</p>
          <p className="font-mono text-slate-600">Ambiente Centro Operativo Multifunzionale</p>
        </div>

      </div>
    </div>
  );
};
