import React, { useState, useEffect, createContext, useContext, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { supabase } from './lib/supabase';

// Bezpečný getter ikon z balíčku lucide-react (při chybě vrátí Book nebo HelpCircle)
const getIcon = (name) => Icons[name] || Icons.Book || Icons.HelpCircle;

// ====================================================
// 📚 KOMPLETNÍ ICON MAP (ZÁKLADNÍ & NAVIGAČNÍ IKONY)
// ====================================================
const Book = getIcon('Book');
const BookOpen = getIcon('BookOpen');
const BookOpenIcon = BookOpen;
const BookMarked = getIcon('BookMarked');
const Library = getIcon('Library');
const Compass = getIcon('Compass');
const Search = getIcon('Search');
const Filter = getIcon('Filter');
const ArrowLeft = getIcon('ArrowLeft');
const ChevronRight = getIcon('ChevronRight');
const ChevronDown = getIcon('ChevronDown');
const X = getIcon('X');
const XCircle = getIcon('XCircle');
const Plus = getIcon('Plus');
const PlusCircle = getIcon('PlusCircle');
const Check = getIcon('Check');
const CheckCircle = getCircle => getIcon('CheckCircle');
const RefreshCw = getIcon('RefreshCw');
const Trash = getIcon('Trash');
const Trash2 = getIcon('Trash2');

// ====================================================
// 🔐 ADMIN PANEL & UŽIVATELÉ
// ====================================================
const Shield = getIcon('Shield');
const ShieldOff = getIcon('ShieldOff');
const ShieldCheck = getIcon('ShieldCheck');
const Users = getIcon('Users');
const UserCheck = getIcon('UserCheck');
const UserPlus = getIcon('UserPlus');
const Crown = getIcon('Crown');
const Settings = getIcon('Settings');
const Terminal = getIcon('Terminal');
const Database = getIcon('Database');
const FileText = getIcon('FileText');
const LogOut = getIcon('LogOut');

// ====================================================
// 🔥 GAMEFIKACE, STATISTIKY & DOSAŽENÉ ÚSPĚCHY
// ====================================================
const Award = getIcon('Award');
const Flame = getIcon('Flame');
const Trophy = getIcon('Trophy');
const Target = getIcon('Target');
const Star = getIcon('Star');
const Gem = getIcon('Gem');
const Sparkles = getIcon('Sparkles');
const ScrollIcon = getIcon('Scroll'); 
const Feather = getIcon('Feather');
const Footprints = getIcon('Footprints') || getIcon('Map');
const InfinityIcon = getIcon('Infinity');
const BarChart2 = getIcon('BarChart2');
const BarChart3 = getIcon('BarChart3');
const ChartBar = getIcon('ChartBar');
const TrendingUp = getIcon('TrendingUp');
const Gauge = getIcon('Gauge');
const Calendar = getIcon('Calendar');

// ====================================================
// ⚙️ UKAZATELE, SYSTÉM & INTERAKCE
// ====================================================
const Zap = getIcon('Zap');
const ZapOff = getIcon('ZapOff');
const Heart = getIcon('Heart');
const HeartIcon = Heart;
const Clock = getIcon('Clock');
const Loader2 = getIcon('Loader2');
const AlertTriangle = getIcon('AlertTriangle');
const HelpCircle = getIcon('HelpCircle');
const PhoneIcon = getIcon('Phone'); 
const Mail = getIcon('Mail');

// ====================================================
// 👀 PRÉMIOVÁ ČTEČKA (AUTO-SCROLL, CONFIG & MÓDY)
// ====================================================
const TypeIcon = getIcon('Type'); 
const EyeIcon = getIcon('Eye');   
const PlayIcon = getIcon('Play'); 
const PauseIcon = getIcon('Pause'); 
const Sun = getIcon('Sun');
const Moon = getIcon('Moon');
const Coffee = getIcon('Coffee');

// ====================================================
// 🔄 BEZPEČNÉ ALIASY PRO ZPĚTNOU KOMPATIBILITU
// ====================================================
const Scroll = ScrollIcon;
const Phone = PhoneIcon;
const Type = TypeIcon;
const Eye = EyeIcon;
const Play = PlayIcon;
const Pause = PauseIcon;

const THEMES = {
  saas: {
    '--bg-body': '#f8fafc',       
    '--text-body': '#0f172a',     
    '--bg-card': '#ffffff',       
    '--border-color': '#e2e8f0',  
    '--bg-navbar': 'rgba(255, 255, 255, 0.8)',
    '--text-muted': '#64748b',    
    '--bg-primary': '#4f46e5',    
    '--text-primary': '#ffffff',
    '--bg-secondary': '#ffffff',
    '--text-secondary': '#334155',
    '--bg-badge': '#f5f3ff',
    '--text-badge': '#4f46e5',
  },
  dark: {
    '--bg-body': '#020617',       
    '--text-body': '#f1f5f9',     
    '--bg-card': '#0f172a',       
    '--border-color': '#1e293b',  
    '--bg-navbar': 'rgba(15, 23, 42, 0.8)',
    '--text-muted': '#94a3b8',    
    '--bg-primary': '#7c3aed',    
    '--text-primary': '#ffffff',
    '--bg-secondary': '#1e293b',
    '--text-secondary': '#e2e8f0',
    '--bg-badge': '#2e1065',
    '--text-badge': '#a78bfa',
  },
emerald: {
  '--bg-body': '#2d1a10',        // Hluboká barva tmavého dřeva (mahagon/ořech)
  '--text-body': '#f4ebd9',      // Krémový text, aby na tmavém dřevě skvěle svítil
  '--bg-card': '#3d2518',        // Karty (trochu světlejší tmavé dřevo)
  '--border-color': '#543523',    // Okraje karet
  '--bg-navbar': 'rgba(45, 26, 16, 0.85)',
  '--text-muted': '#bda691',     
  '--bg-primary': '#246b54',     // Trochu jasnější lesní zelená pro kontrast na tmavém
  '--text-primary': '#ffffff',
  '--bg-secondary': '#4d3223',
  '--text-secondary': '#246b54',
  '--bg-badge': '#1f4237',
  '--text-badge': '#a3cfc0',
}
};

const ThemeContext = createContext(null);
const AuthContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function syncProfile(sessionUser) {
    if (!sessionUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    let { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionUser.id)
      .single();
console.log("=== SUPABASE DEBUG ===", { data, error, email: sessionUser.email });

    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: sessionUser.id, email: sessionUser.email, role: 'uživatel' }])
        .select()
        .single();
      
      if (!insertError) data = newProfile;
    }

    setUser(sessionUser);
    setRole(data?.role || 'uživatel');
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncProfile(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, refreshProfile: () => syncProfile(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

const ProtectedAdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!user || role !== 'správce') return <Navigate to="/app" replace />;
  return children;
};

const ProtectedUserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const styles = variant === 'secondary' 
    ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
    : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' };

  if (variant === 'danger') {
    return <button className={`px-4 py-2 rounded-lg font-bold bg-red-600 text-white flex items-center justify-center gap-2 text-sm cursor-pointer hover:bg-red-700 transition-all ${className}`} {...props}>{children}</button>;
  }

  return (
    <button style={styles} className={`px-4 py-2 rounded-lg font-bold border transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }} className={`border rounded-xl shadow-xl p-6 transition-all ${className}`}>{children}</div>
);

const UserStatsDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    streak: 0,
    monthlyRead: 0,
    monthlyGoal: 5,
    totalRead: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Načtení všech přečtených knih
      const { data: userBooks } = await supabase
        .from('user_books')
        .select('updated_at, is_read')
        .eq('user_id', user.id)
        .eq('is_read', true);

      // 2. Načtení historie aktivity pro Streak
      const { data: activityData } = await supabase
        .from('user_daily_activity')
        .select('activity_date')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false });

      const totalRead = userBooks?.length || 0;

      // Spočítáme knihy přečtené tento kalendářní měsíc
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      const monthlyRead = userBooks?.filter(ub => {
        const date = new Date(ub.updated_at);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      }).length || 0;

      // Výpočet aktuálního Streaku
      let streak = 0;
      if (activityData && activityData.length > 0) {
        const activeDates = activityData.map(a => a.activity_date);
        
        const todayStr = new Date().toLocaleDateString('sv');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('sv');

        if (activeDates.includes(todayStr) || activeDates.includes(yesterdayStr)) {
          let checkDate = activeDates.includes(todayStr) ? new Date() : yesterday;
          
          while (true) {
            const checkDateStr = checkDate.toLocaleDateString('sv');
            if (activeDates.includes(checkDateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }

      setStats(prev => ({ ...prev, totalRead, monthlyRead, streak }));
    } catch (err) {
      console.error("Chyba při výpočtu statistik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchStats();
  }, [isOpen, user]);

  const progressPercent = Math.min(100, Math.round((stats.monthlyRead / stats.monthlyGoal) * 100));

  return (
    <div className="relative flex items-center">
      {/* Tlačítko v Navbaru */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 opacity-60 hover:opacity-100 rounded-lg cursor-pointer text-current bg-transparent border-none outline-none flex items-center gap-1.5"
      >
        <BarChart2 size={20} />
        {stats.streak > 0 && (
          <span className="flex items-center text-amber-500 font-black text-xs gap-0.5">
            <Flame size={14} className="fill-amber-500 text-amber-500" /> {stats.streak}
          </span>
        )}
      </button>

      {/* Dropdown Okno */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div 
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              textColor: 'var(--text-body)', 
              borderColor: 'var(--border-color)' 
            }}
            className="absolute right-0 top-12 w-72 border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <h3 
              style={{ color: 'var(--text-muted)' }}
              className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-1.5"
            >
              <Award size={14} style={{ color: 'var(--bg-primary)' }} /> Tvůj čtenářský profil
            </h3>

            {loading ? (
              <p style={{ color: 'var(--text-muted)' }} className="text-center py-4 text-xs font-bold opacity-50">Počítám data...</p>
            ) : (
              <div style={{ color: 'var(--text-body)' }} className="space-y-4">
                
                {/* STREAK - Plamínek necháváme oranžový/jantarový záměrně */}
                <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                      <Flame size={18} className={stats.streak > 0 ? "fill-amber-500 text-amber-500" : ""} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-tight">Denní aktivita</h4>
                      <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-semibold m-0">Čti denně, drž sérii!</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-600">{stats.streak}</span>
                    <span className="text-[10px] block font-black uppercase opacity-40 leading-none text-amber-600">dní</span>
                  </div>
                </div>

                {/* MĚSÍČNÍ VÝZVA - Adaptivní barvy podle motivu */}
                <div 
                  style={{ backgroundColor: 'var(--bg-badge)', borderColor: 'var(--border-color)' }}
                  className="p-3 border rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div 
                        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-badge)' }}
                        className="p-2 rounded-lg"
                      >
                        <Calendar size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-tight">Měsíční výzva</h4>
                        <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-semibold m-0">Tento měsíc</p>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-badge)' }} className="text-right font-black text-xs">
                      {stats.monthlyRead} / {stats.monthlyGoal}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                        className="h-full rounded-full transition-all duration-500" 
                        dynamic-width={`${progressPercent}%`}
                        // Oprava pro inline-style width v Reactu:
                        css-style={{ width: `${progressPercent}%` }}
                        // Správný React zápis:
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%`, backgroundColor: 'var(--bg-primary)' }}
                      ></div>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="text-[9px] font-black uppercase opacity-70 text-right">{progressPercent}% splněno</div>
                  </div>
                </div>

                {/* CELKEM */}
                <div 
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                  className="flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold"
                >
                  <span style={{ color: 'var(--text-muted)' }} className="flex items-center gap-1">
                    <CheckCircle size={12} style={{ color: 'var(--bg-primary)' }} /> Přečteno celkem:
                  </span>
                  <span style={{ color: 'var(--text-body)' }} className="font-black">{stats.totalRead} knih</span>
                </div>

              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Navbar = ({ onOpenSearch, onOpenSettings }) => {
  const { user, role } = useAuth();

  return (
    <nav style={{ backgroundColor: 'var(--bg-navbar)', borderColor: 'var(--border-color)' }} className="h-16 border-b sticky top-0 z-50 backdrop-blur-md text-current flex items-center px-6 justify-between">
      <Link to="/" className="flex items-center gap-2 no-underline text-current">
        <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="w-8 h-8 rounded-lg flex items-center justify-center"><Library size={18} /></div>
        <span className="font-extrabold text-xl tracking-tight uppercase">Jomarid Books</span>
      </Link>
      
      <div className="flex items-center gap-4">
        <button onClick={onOpenSearch} className="p-2 opacity-60 hover:opacity-100 rounded-lg cursor-pointer text-current bg-transparent border-none outline-none"><Search size={20} /></button>
        <button onClick={onOpenSettings} className="p-2 opacity-60 hover:opacity-100 rounded-lg cursor-pointer text-current bg-transparent border-none outline-none"><Settings size={20} /></button>
        
        {/* 🔥 Tlačítko statistik, které hodí uživatele na samostatnou stránku /stats */}
        {user && (
          <Link 
            to="/stats" 
            className="p-2 opacity-60 hover:opacity-100 rounded-lg text-current bg-transparent border-none outline-none flex items-center"
            title="Moje statistiky"
          >
            <BarChart2 size={20} />
          </Link>
        )}

        {user ? (
          <>
            <Link to="/app" className="no-underline"><Button variant="secondary" className="text-xs">Moje Knihovna</Button></Link>
            
            {role === 'správce' && (
              <Link to="/admin" className="no-underline"><Button className="text-xs bg-red-600 border-none text-white hover:bg-red-700">Admin Panel</Button></Link>
            )}
            
            {role === 'správce' && (
              <Link to="/publisher" className="no-underline"><Button className="text-xs bg-purple-600 border-none text-white">Nakladatel</Button></Link>
            )}
          </>
        ) : (
          <Link to="/login" className="no-underline"><Button variant="secondary" className="text-xs">Prihlášení</Button></Link>
        )}
      </div>
    </nav>
  );
};


const SettingsModal = ({ isOpen, onClose }) => {
  const { currentTheme, changeTheme } = useTheme();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex justify-center items-center p-4" onClick={onClose}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 opacity-50 hover:opacity-100 cursor-pointer text-current bg-transparent border-none"><X size={20} /></button>
        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Settings size={18} /> Změna motivu čítárny</h3>
        <div className="space-y-3">
          <button onClick={() => { changeTheme('saas'); onClose(); }} className={`w-full p-4 rounded-xl border text-left cursor-pointer bg-white text-slate-900 border-slate-200 ${currentTheme === 'saas' ? 'ring-2 ring-indigo-600 font-bold' : ''}`}>⚪ SaaS Minimal (Světlý)</button>
          <button onClick={() => { changeTheme('dark'); onClose(); }} className={`w-full p-4 rounded-xl border text-left cursor-pointer bg-slate-900 text-white border-slate-800 ${currentTheme === 'dark' ? 'ring-2 ring-violet-500 font-bold' : ''}`}>⚫ Dark Slate (Tmavý)</button>
          <button onClick={() => { changeTheme('emerald'); onClose(); }} className={`w-full p-4 rounded-xl border text-left cursor-pointer bg-[#fdfaf5] text-[#112211] border-[#D2C1B0] ${currentTheme === 'emerald' ? 'ring-2 ring-emerald-600 font-bold' : ''}`}>🪵 Zelená & Dřevo (Knižní)</button>
        </div>
      </div>
    </div>
  );
};

const BOOK_BADGES = [
  // ==========================================
  // KATEGORIE 1: POČET PŘEČTENÝCH KNIH (25 odznáčků)
  // ==========================================
  {
    id: 'books_1',
    title: 'První zářez',
    description: 'Přečetl jsi svou první 5minutovku.',
    icon: Footprints,
    condition: (stats) => (stats?.totalRead || 0) >= 1,
  },
  {
    id: 'books_5',
    title: 'Rychlé menu',
    description: 'Zvládl jsi přečíst 5 krátkých děl.',
    icon: Feather,
    condition: (stats) => (stats?.totalRead || 0) >= 5,
  },
  {
    id: 'books_10',
    title: 'Zasvěcený nováček',
    description: 'Máš na kontě 10 přečtených příběhů.',
    icon: Compass,
    condition: (stats) => (stats?.totalRead || 0) >= 10,
  },
  {
    id: 'books_15',
    title: 'Knižní chuťovka',
    description: 'Dokončil jsi úspěšně 15 krátkých knih.',
    icon: BookMarked,
    condition: (stats) => (stats?.totalRead || 0) >= 15,
  },
  {
    id: 'books_20',
    title: 'Hltoun kapitol',
    description: 'Pokořil jsi hranici 20 přečtených knih.',
    icon: BookMarked,
    condition: (stats) => (stats?.totalRead || 0) >= 20,
  },
  {
    id: 'books_25',
    title: 'Čtverec příběhů',
    description: 'Máš za sebou rovných 25 textů.',
    icon: Scroll,
    condition: (stats) => (stats?.totalRead || 0) >= 25,
  },
  {
    id: 'books_30',
    title: 'Měsíční ekvivalent',
    description: 'Přečetl jsi 30 knih (jako každý den jednu).',
    icon: Library,
    condition: (stats) => (stats?.totalRead || 0) >= 30,
  },
  {
    id: 'books_35',
    title: 'Literární lovec',
    description: 'Úspěšně jsi dokončil 35 knih.',
    icon: Scroll,
    condition: (stats) => (stats?.totalRead || 0) >= 35,
  },
  {
    id: 'books_40',
    title: 'Sběratel stránek',
    description: 'Už jsi pokořil hranici 40 příběhů.',
    icon: Feather,
    condition: (stats) => (stats?.totalRead || 0) >= 40,
  },
  {
    id: 'books_50',
    title: 'Skutečný Knihomol',
    description: 'Přečetl jsi parádních 50 knih!',
    icon: BookOpen,
    condition: (stats) => (stats?.totalRead || 0) >= 50,
  },
  {
    id: 'books_60',
    title: 'Příběhový klub',
    description: '60 zářezů ve tvé knihovně.',
    icon: Users,
    condition: (stats) => (stats?.totalRead || 0) >= 60,
  },
  {
    id: 'books_70',
    title: 'Zkušený předčítač',
    description: 'Dosáhl jsi milníku 70 přečtených děl.',
    icon: ShieldCheck,
    condition: (stats) => (stats?.totalRead || 0) >= 70,
  },
  {
    id: 'books_75',
    title: 'Strážce vědění',
    description: 'Tvoje knihovna čítá už 75 děl.',
    icon: ShieldCheck,
    condition: (stats) => (stats?.totalRead || 0) >= 75,
  },
  {
    id: 'books_80',
    title: 'Vznešená knihovna',
    description: 'Dokončil jsi už 80 textů.',
    icon: Library,
    condition: (stats) => (stats?.totalRead || 0) >= 80,
  },
  {
    id: 'books_90',
    title: 'Před branami stovky',
    description: 'Už jen krůček! Máš za sebou 90 knih.',
    icon: TrendingUp,
    condition: (stats) => (stats?.totalRead || 0) >= 90,
  },
  {
    id: 'books_100',
    title: 'Chodící encyklopedie',
    description: 'Dosáhl jsi magické stovky (100 knih).',
    icon: Gem,
    condition: (stats) => (stats?.totalRead || 0) >= 100,
  },
  {
    id: 'books_120',
    title: 'Nezastavitelný čtenář',
    description: 'Pokořil jsi neuvěřitelných 120 děl.',
    icon: Zap,
    condition: (stats) => (stats?.totalRead || 0) >= 120,
  },
  {
    id: 'books_150',
    title: 'Absolutní Legenda',
    description: 'Přelouskal jsi celkem 150 knižních titulů.',
    icon: Crown,
    condition: (stats) => (stats?.totalRead || 0) >= 150,
  },
  {
    id: 'books_180',
    title: 'Knižní maratonec',
    description: 'Zvládl jsi přečíst 180 titulů.',
    icon: Trophy,
    condition: (stats) => (stats?.totalRead || 0) >= 180,
  },
  {
    id: 'books_200',
    title: 'Knižní magnát',
    description: 'Dosáhl jsi monstrózního milníku 200 knih.',
    icon: Trophy,
    condition: (stats) => (stats?.totalRead || 0) >= 200,
  },
  {
    id: 'books_250',
    title: 'Půlmaraton příběhů',
    description: 'Na tvém kontě svítí 250 knih.',
    icon: BarChart2,
    condition: (stats) => (stats?.totalRead || 0) >= 250,
  },
  {
    id: 'books_300',
    title: 'Knižní Imperátor',
    description: 'Úctyhodných 300 přečtených 5minutovek.',
    icon: Crown,
    condition: (stats) => (stats?.totalRead || 0) >= 300,
  },
  {
    id: 'books_400',
    title: 'Osvícená mysl',
    description: 'Pokořil jsi bájnou hranici 400 knih.',
    icon: Sparkles,
    condition: (stats) => (stats?.totalRead || 0) >= 400,
  },
  {
    id: 'books_500',
    title: 'Půl tisícovky',
    description: 'Přečetl jsi 500 knih! Jsi vůbec člověk?',
    icon: Gem,
    condition: (stats) => (stats?.totalRead || 0) >= 500,
  },
  {
    id: 'books_1000',
    title: 'Bůh literárního světa',
    description: '1000 přečtených děl. Absolutní vrchol, dál už nic není.',
    icon: InfinityIcon,
    condition: (stats) => (stats?.totalRead || 0) >= 1000,
  },

  // ==========================================
  // KATEGORIE 2: DENNÍ SÉRIE / STREAK (22 odznáčků)
  // ==========================================
  {
    id: 'streak_2',
    title: 'Zápal do čtení',
    description: 'Udržel jsi denní sérii po dobu 2 dnů.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 2,
  },
  {
    id: 'streak_3',
    title: 'Plamenná síla',
    description: 'Čteš poctivě 3 dny za sebou.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 3,
  },
  {
    id: 'streak_4',
    title: 'Čtyřlístek',
    description: 'Série čtení trvá 4 dny.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 4,
  },
  {
    id: 'streak_5',
    title: 'Pravidelný režim',
    description: 'Pětidenní série čtení je doma.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 5,
  },
  {
    id: 'streak_6',
    title: 'Skoro týden',
    description: 'Udržel jsi plamínek po dobu 6 dní.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 6,
  },
  {
    id: 'streak_7',
    title: 'Týdenní maraton',
    description: 'Udržel jsi plamínek po celých 7 dní.',
    icon: Zap,
    condition: (stats) => (stats?.streak || 0) >= 7,
  },
  {
    id: 'streak_8',
    title: 'Osmá vlna',
    description: 'Čteš už 8 dní v řadě bez přestávky.',
    icon: Zap,
    condition: (stats) => (stats?.streak || 0) >= 8,
  },
  {
    id: 'streak_9',
    title: 'Devítkový mág',
    description: 'Udržel jsi sérii po dobu 9 dní.',
    icon: Sparkles,
    condition: (stats) => (stats?.streak || 0) >= 9,
  },
  {
    id: 'streak_10',
    title: 'Nezastavitelný stroj',
    description: 'Držíš streak úctyhodných 10 dní.',
    icon: Gauge,
    condition: (stats) => (stats?.streak || 0) >= 10,
  },
  {
    id: 'streak_11',
    title: 'Dvojitá jednička',
    description: 'Tvoje série dosáhla 11 dní.',
    icon: Gauge,
    condition: (stats) => (stats?.streak || 0) >= 11,
  },
  {
    id: 'streak_12',
    title: 'Dvanáct měsíčků',
    description: 'Čteš nepřetržitě už 12 dní.',
    icon: Calendar,
    condition: (stats) => (stats?.streak || 0) >= 12,
  },
  {
    id: 'streak_13',
    title: 'Páteční štěstí',
    description: 'Zvládl jsi 13 dní v řadě.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 13,
  },
  {
    id: 'streak_14',
    title: 'Čtrnáctidenní rituál',
    description: 'Dva týdny bez jediného vynechaného dne.',
    icon: Sparkles,
    condition: (stats) => (stats?.streak || 0) >= 14,
  },
  {
    id: 'streak_15',
    title: 'Půl měsíce v ohni',
    description: 'Udržel jsi sérii po dobu 15 dní.',
    icon: Flame,
    condition: (stats) => (stats?.streak || 0) >= 15,
  },
  {
    id: 'streak_20',
    title: 'Závislost na příbězích',
    description: '20 dní v kuse s knihou v ruce.',
    icon: HeartIcon,
    condition: (stats) => (stats?.streak || 0) >= 20,
  },
  {
    id: 'streak_25',
    title: 'Čtvrt století',
    description: 'Tvoje série čtení má délku 25 dní.',
    icon: HeartIcon,
    condition: (stats) => (stats?.streak || 0) >= 25,
  },
  {
    id: 'streak_30',
    title: 'Měsíční fanatik',
    description: 'Dokázal jsi číst každý den po dobu 30 dní!',
    icon: InfinityIcon,
    condition: (stats) => (stats?.streak || 0) >= 30,
  },
  {
    id: 'streak_45',
    title: 'Rozpálená pec',
    description: 'Tvoje série hoří už dlouhých 45 dní.',
    icon: Zap,
    condition: (stats) => (stats?.streak || 0) >= 45,
  },
  {
    id: 'streak_60',
    title: 'Dva měsíce v kuse',
    description: 'Neskutečných 60 dní každodenního čtení.',
    icon: InfinityIcon,
    condition: (stats) => (stats?.streak || 0) >= 60,
  },
  {
    id: 'streak_75',
    title: 'Plamenný veterán',
    description: 'Udržel jsi streak po dobu 75 dní.',
    icon: Trophy,
    condition: (stats) => (stats?.streak || 0) >= 75,
  },
  {
    id: 'streak_90',
    title: 'Čtvrt roku v kuse',
    description: 'Úctyhodných 90 dní bez jediného zaváhání.',
    icon: Crown,
    condition: (stats) => (stats?.streak || 0) >= 90,
  },
  {
    id: 'streak_100',
    title: 'Stovka v plamenech',
    description: 'Dosáhl jsi bájné stovky dní nepřerušeného čtení!',
    icon: Crown,
    condition: (stats) => (stats?.streak || 0) >= 100,
  },

  // ==========================================
  // KATEGORIE 3: ČTENÁŘSKÉ ÚROVNĚ / LEVEL (15 odznáčků)
  // ==========================================
  {
    id: 'lvl_2',
    title: 'Zapálený začátečník',
    description: 'Dosáhl jsi čtenářské úrovně 2.',
    icon: Sparkles,
    condition: (stats) => (stats?.level || 1) >= 2,
  },
  {
    id: 'lvl_3',
    title: 'Učeň slov',
    description: 'Dosáhl jsi čtenářské úrovně 3.',
    icon: Sparkles,
    condition: (stats) => (stats?.level || 1) >= 3,
  },
  {
    id: 'lvl_4',
    title: 'Zvědavý čtenář',
    description: 'Dosáhl jsi čtenářské úrovně 4.',
    icon: Compass,
    condition: (stats) => (stats?.level || 1) >= 4,
  },
  {
    id: 'lvl_5',
    title: 'Průzkumník světů',
    description: 'Dosáhl jsi čtenářské úrovně 5.',
    icon: Compass,
    condition: (stats) => (stats?.level || 1) >= 5,
  },
  {
    id: 'lvl_7',
    title: 'Sběratel vědění',
    description: 'Dosáhl jsi čtenářské úrovně 7.',
    icon: Scroll,
    condition: (stats) => (stats?.level || 1) >= 7,
  },
  {
    id: 'lvl_10',
    title: 'Vášnivá duše',
    description: 'Dosáhl jsi čtenářské úrovně 10.',
    icon: Star,
    condition: (stats) => (stats?.level || 1) >= 10,
  },
  {
    id: 'lvl_12',
    title: 'Knižní šlechtic',
    description: 'Dosáhl jsi čtenářské úrovně 12.',
    icon: Star,
    condition: (stats) => (stats?.level || 1) >= 12,
  },
  {
    id: 'lvl_15',
    title: 'Mistr literatury',
    description: 'Dosáhl jsi čtenářské úrovně 15.',
    icon: Award,
    condition: (stats) => (stats?.level || 1) >= 15,
  },
  {
    id: 'lvl_18',
    title: 'Elitní akademik',
    description: 'Dosáhl jsi čtenářské úrovně 18.',
    icon: Award,
    condition: (stats) => (stats?.level || 1) >= 18,
  },
  {
    id: 'lvl_20',
    title: 'Nejvyšší Mág',
    description: 'Dosáhl jsi čtenářské úrovně 20.',
    icon: Zap,
    condition: (stats) => (stats?.level || 1) >= 20,
  },
  {
    id: 'lvl_25',
    title: 'Bůh příběhů',
    description: 'Dosáhl jsi úrovně 25.',
    icon: Crown,
    condition: (stats) => (stats?.level || 1) >= 25,
  },
  {
    id: 'lvl_30',
    title: 'Legendární archivář',
    description: 'Dosáhl jsi čtenářské úrovně 30.',
    icon: Crown,
    condition: (stats) => (stats?.level || 1) >= 30,
  },
  {
    id: 'lvl_40',
    title: 'Osvícený mudrc',
    description: 'Dosáhl jsi čtenářské úrovně 40.',
    icon: Gem,
    condition: (stats) => (stats?.level || 1) >= 40,
  },
  {
    id: 'lvl_50',
    title: 'Nesmrtelný čtenář',
    description: 'Dosáhl jsi obří čtenářské úrovně 50.',
    icon: Gem,
    condition: (stats) => (stats?.level || 1) >= 50,
  },
  {
    id: 'lvl_100',
    title: 'Avatar vědění',
    description: 'Dosáhl jsi bájné úrovně 100.',
    icon: InfinityIcon,
    condition: (stats) => (stats?.level || 1) >= 100,
  },

  // ==========================================
  // KATEGORIE 4: MĚSÍČNÍ VÝZVY A CÍLE (6 odznáčků)
  // ==========================================
  {
    id: 'goal_first_step',
    title: 'První úspěch',
    description: 'Tento měsíc jsi přečetl alespoň 1 knihu.',
    icon: Award,
    condition: (stats) => (stats?.monthlyRead || 0) >= 1,
  },
  {
    id: 'goal_halfway',
    title: 'V polovině cesty',
    description: 'Splnil jsi polovinu svého měsíčního cíle.',
    icon: TrendingUp,
    condition: (stats) => (stats?.monthlyRead || 0) >= ((stats?.monthlyGoal || 5) / 2),
  },
  {
    id: 'goal_slayer',
    title: 'Drtič výzev',
    description: 'Úspěšně jsi splnil svůj měsíční cíl.',
    icon: Trophy,
    condition: (stats) => (stats?.monthlyRead || 0) >= (stats?.monthlyGoal || 5),
  },
  {
    id: 'goal_overachiever',
    title: 'Nadplán',
    description: 'Překonal jsi svůj měsíční cíl o 2 knihy.',
    icon: Star,
    condition: (stats) => (stats?.monthlyRead || 0) >= ((stats?.monthlyGoal || 5) + 2),
  },
  {
    id: 'goal_double',
    title: 'Dvojitý zásah',
    description: 'Zdvojnásobil jsi svůj stanovený měsíční cíl.',
    icon: Trophy,
    condition: (stats) => (stats?.monthlyRead || 0) >= ((stats?.monthlyGoal || 5) * 2),
  },
  {
    id: 'goal_triple',
    title: 'Trojitá koruna',
    description: 'Ztrojnásobil jsi svůj měsíční plán.',
    icon: Crown,
    condition: (stats) => (stats?.monthlyRead || 0) >= ((stats?.monthlyGoal || 5) * 3),
  },

  // ==========================================
  // KATEGORIE 5: KALENDÁŘNÍ MĚSÍCE (12 odznáčků)
  // ==========================================
  {
    id: 'month_jan',
    title: 'Novoroční start',
    description: 'Byl jsi aktivní během měsíce Leden.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Leden' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_feb',
    title: 'Únorový ledoborec',
    description: 'Byl jsi aktivní během měsíce Únor.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Únor' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_mar',
    title: 'Březnová moudrost',
    description: 'Byl jsi aktivní během měsíce Březen.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Březen' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_apr',
    title: 'Aprílové stránky',
    description: 'Byl jsi aktivní během měsíce Duben.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Duben' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_may',
    title: 'Májový květ',
    description: 'Byl jsi aktivní během měsíce Květen.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Květen' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_jun',
    title: 'Slunovrat příběhů',
    description: 'Byl jsi aktivní během měsíce Červen.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Červen' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_jul',
    title: 'Letní čtení',
    description: 'Byl jsi aktivní během měsíce Červenec.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Červenec' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_aug',
    title: 'Srpnová pohoda',
    description: 'Byl jsi aktivní během měsíce Srpen.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Srpen' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_sep',
    title: 'Zářijová škola',
    description: 'Byl jsi aktivní během měsíce Září.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Září' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_oct',
    title: 'Podzimní archiv',
    description: 'Byl jsi aktivní během měsíce Říjen.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Říjen' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_nov',
    title: 'Listopadová melancholie',
    description: 'Byl jsi aktivní během měsíce Listopad.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Listopad' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },
  {
    id: 'month_dec',
    title: 'Zimní pohoda',
    description: 'Byl jsi aktivní během měsíce Prosinec.',
    icon: Calendar,
    condition: (stats) => stats?.currentMonthName === 'Prosinec' && ((stats?.monthlyRead || 0) >= 1 || (stats?.streak || 0) >= 1),
  },

  // ==========================================
  // KATEGORIE 6: ČASOVÝ FINIŠ / SPECIÁLNÍ (4 odznáčky)
  // ==========================================
  {
    id: 'time_15_days',
    title: 'Klidný čtenář',
    description: 'Do konce měsíce zbývá víc než 15 dní a ty už pilně čteš.',
    icon: Calendar,
    condition: (stats) => (stats?.daysRemainingInMonth || 0) >= 15 && (stats?.monthlyRead || 0) >= 1,
  },
  {
    id: 'time_last_week',
    title: 'Finiš na obzoru',
    description: 'Čteš v posledním týdnu kalendářního měsíce.',
    icon: Calendar,
    condition: (stats) => (stats?.daysRemainingInMonth || 0) <= 7 && (stats?.daysRemainingInMonth || 0) > 0,
  },
  {
    id: 'time_clutch',
    title: 'Za pět minut dvanáct',
    description: 'Splnil jsi měsíční cíl v úplně poslední den měsíce.',
    icon: Zap,
    condition: (stats) => (stats?.daysRemainingInMonth || 0) === 0 && (stats?.monthlyRead || 0) >= (stats?.monthlyGoal || 5),
  },
  {
    id: 'time_panic',
    title: 'Čtenářská panika',
    description: 'V poslední den měsíce ti chybí už jen 1 kniha do cíle.',
    icon: ZapOff,
    condition: (stats) => (stats?.daysRemainingInMonth || 0) === 0 && ((stats?.monthlyGoal || 5) - (stats?.monthlyRead || 0) === 1),
  }
];

const UserStats = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState(25); // Změněno na 25
  const [activeTab, setActiveTab] = useState('streak'); 
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  
  const [stats, setStats] = useState({
    streak: 0,
    monthlyRead: 0,
    monthlyGoal: 25, // Změněno na 25
    totalRead: 0,
    weeklyActivity: [],
    xp: 0,
    level: 1,
    levelName: "Začínající čtenář 🌱",
    levelBadgeClass: "",
    levelBoxClass: "",
    xpNeededForNext: 100,
    daysRemainingInMonth: 0,
    currentMonthName: "",
    showInLeaderboard: true 
  });

  const [leaderboards, setLeaderboards] = useState({
    streak: [],
    level: [],
    totalRead: [],
    monthlyRead: [],
    xp: []
  });

  // Pomocná funkce pro výpočet XP bonusu z winstreaku podle zadaných pravidel
  const calculateXpMultiplier = (streakCount) => {
    if (streakCount >= 50) {
      return streakCount * 50; // Winstreak 50+ dní = streak * 50 XP
    }
    if (streakCount >= 10) {
      return streakCount * 25; // Winstreak 10-49 dní = streak * 25 XP
    }
    return streakCount * 10; // Winstreak 0-9 dní = streak * 10 XP
  };

  const getLevelVisuals = (lvl) => {
    if (lvl >= 20) return {
      name: "Bůh zapomenutých příběhů 🌌",
      badge: "border border-amber-500/40 text-amber-500 bg-amber-500/10 font-black animate-pulse",
      box: "bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg"
    };
    if (lvl >= 15) return { 
      name: "Mág nejvyšší knihovny 🧙‍♂️", 
      badge: "border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-bold", 
      box: "bg-emerald-700 text-white" 
    };
    if (lvl >= 10) return { 
      name: "Mistr skrytých pravd 🗝️", 
      badge: "style-badge-adaptive border border-current opacity-90", 
      box: "style-box-adaptive bg-current text-[var(--bg-card)] opacity-90" 
    };
    if (lvl >= 5)  return { 
      name: "Pravidelný knihomol 🐛", 
      badge: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]", 
      box: "bg-[var(--bg-primary)] text-[var(--text-primary)]" 
    };

    return {
      name: "Začínající čtenář 🌱",
      badge: "bg-[var(--bg-badge)] text-[var(--text-badge)]",
      box: "bg-[var(--bg-primary)] text-[var(--text-primary)]"
    };
  };

  const getRequiredXpForLevel = (lvl) => {
    if (lvl <= 1) return 0;
    return Math.round(100 * Math.pow(1.5, lvl - 1));
  };

  const calculateLevelAndProgress = (totalXp) => {
    if (totalXp >= 1000000) {
      return { level: 100, xpInCurrentLevel: 100, xpNeededForNext: 100 };
    }
    let currentLevel = 1;
    while (totalXp >= getRequiredXpForLevel(currentLevel + 1) && currentLevel < 100) {
      currentLevel++;
    }
    const xpForCurrentLevelStart = getRequiredXpForLevel(currentLevel);
    const xpForNextLevelStart = getRequiredXpForLevel(currentLevel + 1);
    const xpInCurrentLevel = totalXp - xpForCurrentLevelStart;
    const xpNeededForNext = xpForNextLevelStart - xpForCurrentLevelStart;

    return { level: currentLevel, xpInCurrentLevel, xpNeededForNext };
  };

  const fetchFullStats = async () => {
    if (!user) return;
    try {
      const savedGoal = localStorage.getItem(`monthly_goal_${user.id}`);
      const currentGoal = savedGoal ? parseInt(savedGoal, 10) : 25; // Změněno na 25
      setNewGoalInput(currentGoal);

      // 1. Načtení dat aktuálního uživatele
      const { data: userBooks } = await supabase
        .from('user_books')
        .select('updated_at, is_read')
        .eq('user_id', user.id)
        .eq('is_read', true);

      const { data: activityData } = await supabase
        .from('user_daily_activity')
        .select('activity_date')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false });

      const { data: profileData } = await supabase
        .from('profiles')
        .select('fake_xp, show_in_leaderboard, email')
        .eq('id', user.id)
        .single();

      const bonusXp = profileData?.fake_xp ? parseInt(profileData.fake_xp, 10) : 0;
      const showInLeaderboard = profileData?.show_in_leaderboard ?? true;
      const totalRead = userBooks?.length || 0;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const monthlyRead = userBooks?.filter(ub => {
        const date = new Date(ub.updated_at);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      }).length || 0;

      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysRemainingInMonth = lastDayOfMonth - now.getDate();

      const monthNames = [
        "Leden", "Únor", "Březen", "Duben", "Květen", "Červen", 
        "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
      ];
      const currentMonthName = monthNames[currentMonth];

      let streak = 0;
      const activeDates = activityData?.map(a => a.activity_date) || [];
      
      if (activeDates.length > 0) {
        const todayStr = new Date().toLocaleDateString('sv');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('sv');

        if (activeDates.includes(todayStr) || activeDates.includes(yesterdayStr)) {
          let checkDate = activeDates.includes(todayStr) ? new Date() : yesterday;
          while (true) {
            const checkDateStr = checkDate.toLocaleDateString('sv');
            if (activeDates.includes(checkDateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }

      const czechDays = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
      const weeklyActivityGenerated = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('sv');
        
        weeklyActivityGenerated.push({
          dayLabel: czechDays[d.getDay()],
          isActive: activeDates.includes(dateStr),
          isToday: i === 0
        });
      }

      const baseXpFromBooks = totalRead * 100; 
      const streakXpBonus = calculateXpMultiplier(streak); // Spočítáme bonus z winstreaku (0-9=*10, 10-49=*25, 50+=*50)
      const totalXp = baseXpFromBooks + bonusXp + streakXpBonus;
      const { level, xpInCurrentLevel, xpNeededForNext } = calculateLevelAndProgress(totalXp);
      const visuals = getLevelVisuals(level);

      setStats({
        streak,
        monthlyRead,
        monthlyGoal: currentGoal,
        totalRead,
        weeklyActivity: weeklyActivityGenerated,
        xp: xpInCurrentLevel,
        level,
        levelName: visuals.name,
        levelBadgeClass: visuals.badge,
        levelBoxClass: visuals.box,
        xpNeededForNext,
        daysRemainingInMonth,
        currentMonthName,
        showInLeaderboard
      });

      // 2. GENERUJEME LEADERBOARDY Z VEŘEJNÝCH PROFILŮ
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, fake_xp, show_in_leaderboard')
        .eq('show_in_leaderboard', true);

      if (allProfiles) {
        const { data: allBooks } = await supabase.from('user_books').select('user_id, updated_at').eq('is_read', true);
        const { data: allActivities } = await supabase.from('user_daily_activity').select('user_id, activity_date');

        const mappedUsers = allProfiles.map(p => {
          const uBooks = allBooks?.filter(b => b.user_id === p.id) || [];
          const uActs = allActivities?.filter(a => a.user_id === p.id).map(a => a.activity_date) || [];

          let uStreak = 0;
          if (uActs.length > 0) {
            const todayStr = new Date().toLocaleDateString('sv');
            const yest = new Date(); yest.setDate(yest.getDate() - 1);
            const yestStr = yest.toLocaleDateString('sv');
            if (uActs.includes(todayStr) || uActs.includes(yestStr)) {
              let chk = uActs.includes(todayStr) ? new Date() : yest;
              while (uActs.includes(chk.toLocaleDateString('sv'))) {
                uStreak++;
                chk.setDate(chk.getDate() - 1);
              }
            }
          }

          const uMRead = uBooks.filter(b => {
            const d = new Date(b.updated_at);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          }).length;

          // Propis výpočtu winstreak XP násobiče i do globálního žebříčku celkových XP
          const uStreakXpBonus = calculateXpMultiplier(uStreak);
          const uXpTotal = (uBooks.length * 100) + (parseInt(p.fake_xp, 10) || 0) + uStreakXpBonus;
          const { level: uLvl } = calculateLevelAndProgress(uXpTotal);

          return {
            email: p.email || 'Anonymní čtenář',
            streak: uStreak,
            level: uLvl,
            totalRead: uBooks.length,
            monthlyRead: uMRead,
            xp: uXpTotal,
            isMe: p.id === user.id
          };
        });

        setLeaderboards({
          streak: [...mappedUsers].sort((a, b) => b.streak - a.streak).slice(0, 10),
          level: [...mappedUsers].sort((a, b) => b.level - a.level).slice(0, 10),
          totalRead: [...mappedUsers].sort((a, b) => b.totalRead - a.totalRead).slice(0, 10),
          monthlyRead: [...mappedUsers].sort((a, b) => b.monthlyRead - a.monthlyRead).slice(0, 10),
          xp: [...mappedUsers].sort((a, b) => b.xp - a.xp).slice(0, 10)
        });
      }

    } catch (error) {
      console.error("Chyba při načítání kompletních statistik a žebříčků:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullStats();
  }, [user]);

  const togglePrivacy = async () => {
    if (!user || isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    const newValue = !stats.showInLeaderboard;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_in_leaderboard: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setStats(prev => ({ ...prev, showInLeaderboard: newValue }));
      fetchFullStats();
    } catch (err) {
      console.error("Chyba při ukládání nastavení soukromí:", err);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };
        
  const handleSaveGoal = () => {
    const goalNum = parseInt(newGoalInput, 10);
    if (isNaN(goalNum) || goalNum < 1) return;
    localStorage.setItem(`monthly_goal_${user.id}`, goalNum);
    setStats(prev => ({ ...prev, monthlyGoal: goalNum }));
    setIsEditingGoal(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div style={{ borderTopColor: 'transparent', borderLeftColor: 'var(--bg-primary)', borderRightColor: 'var(--bg-primary)', borderBottomColor: 'var(--bg-primary)' }} className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm font-bold opacity-60 animate-pulse">Sestavuji tvůj kompletní přehled a síň slávy...</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((stats.monthlyRead / stats.monthlyGoal) * 100));
  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpNeededForNext) * 100));

  const categories = [
    { id: 'streak', label: 'Plamínky 🔥', icon: Flame, suffix: 'dní' },
    { id: 'level', label: 'Úroveň 🏆', icon: Trophy, suffix: 'lvl' },
    { id: 'totalRead', label: 'Celkem knih 📚', icon: CheckCircle, suffix: 'knih' },
    { id: 'monthlyRead', label: 'Tento měsíc 📅', icon: Calendar, suffix: 'knih' },
    { id: 'xp', label: 'Celkové XP ⭐', icon: Sparkles, suffix: 'XP' }
  ];

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-300">
      
      {/* SEKCE: NASTAVENÍ SOUKROMÍ ŽEBŘÍČKU */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3 text-left">
          {stats.showInLeaderboard ? (
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Shield size={20} /></div>
          ) : (
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><ShieldOff size={20} /></div>
          )}
          <div>
            <h4 className="text-sm font-black m-0">Zveřejnění v Síni slávy</h4>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs m-0">
              {stats.showInLeaderboard ? "Ostatní čtenáři tě vidí v žebříčcích. Soutěž o první místa!" : "Tvůj profil je skrytý. Výsledky vidíš pouze ty."}
            </p>
          </div>
        </div>
        <button 
          onClick={togglePrivacy} 
          disabled={isUpdatingPrivacy}
          style={{ 
            backgroundColor: stats.showInLeaderboard ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)', 
            color: stats.showInLeaderboard ? '#ef4444' : 'var(--text-primary)' 
          }} 
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-sm hover:opacity-90 transition-all"
        >
          {isUpdatingPrivacy ? 'Aktualizuji...' : stats.showInLeaderboard ? 'Skrýt mé výsledky 🔒' : 'Chci soutěžit! 🌍'}
        </button>
      </div>

      {/* VELKÁ PROFILOVÁ HLAVIČKA */}
      <div style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }} className="rounded-3xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div style={{ backgroundColor: 'var(--bg-primary)' }} className="absolute -right-10 -top-10 w-40 h-40 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <span className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider mb-2 inline-block transition-all duration-300 ${stats.levelBadgeClass}`}>
              {stats.levelName}
            </span>
            <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: 'var(--bg-card)' }}>Moje Statistiky</h1>
            <p className="text-sm font-medium opacity-80" style={{ color: 'var(--bg-body)' }}>Každý den jedna kapitola tě posune dál.</p>
          </div>
          
          {/* LEVEL BAR */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' }} className="border backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 min-w-[250px]">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-lg transition-all duration-300 ${stats.levelBoxClass}`}>
              {stats.level}
            </div>
            <div className="flex-1 space-y-1 text-left">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider opacity-60" style={{ color: 'var(--bg-body)' }}>
                <span>Úroveň čtenáře</span>
                <span>{stats.xp} / {stats.xpNeededForNext} XP</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${xpPercent}%`, backgroundColor: 'var(--bg-primary)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TŘI HLAVNÍ METRIKY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* STREAK */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-left">
              <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider">Aktuální Streak</h3>
              <p className="text-4xl font-black text-amber-600 flex items-baseline gap-1 m-0">
                {stats.streak} <span style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-bold opacity-60">dní</span>
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <Flame size={24} className={stats.streak > 0 ? "fill-amber-500" : ""} />
            </div>
          </div>
          
          {/* Informační pole pro motivaci uživatelů k udržení sérií a násobičům */}
          <div style={{ borderColor: 'var(--border-color)' }} className="mt-2 pt-2 border-t text-left text-[10px] space-y-0.5">
            <div className={`flex justify-between ${stats.streak < 10 ? 'font-black text-amber-600' : 'opacity-60'}`}>
              <span>0-9 dní sére:</span><span>winstreak * 10 XP</span>
            </div>
            <div className={`flex justify-between ${stats.streak >= 10 && stats.streak < 50 ? 'font-black text-indigo-500' : 'opacity-60'}`}>
              <span>10-49 dní série 🔥:</span><span>winstreak * 25 XP</span>
            </div>
            <div className={`flex justify-between ${stats.streak >= 50 ? 'font-black text-emerald-500 animate-pulse' : 'opacity-60'}`}>
              <span>50+ dní série 👑:</span><span>winstreak * 50 XP</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }} className="text-xs font-medium mt-3 pt-2 border-t text-left">
            {stats.streak > 0 ? "Skvělé! Dnes máš splněno, série pokračuje." : "Dnes jsi ještě nečetl. Otevři knihu a zachraň plamínek!"}
          </p>
        </div>

        {/* MĚSÍČNÍ VÝZVA (Natvrdo upraveno na 25) */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1 text-left">
                <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider">Výzva na {stats.currentMonthName}</h3>
                <p style={{ color: 'var(--text-badge)' }} className="text-4xl font-black m-0">
                  {stats.monthlyRead} <span style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-bold opacity-60">z {stats.monthlyGoal}</span>
                </p>
              </div>
              <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="p-3 rounded-xl">
                <Calendar size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: 'var(--bg-primary)' }}></div>
              </div>
              <div style={{ color: 'var(--text-muted)' }} className="flex justify-between text-[10px] font-black uppercase opacity-80">
                <span>{progressPercent}% splněno</span>
                <span>{stats.daysRemainingInMonth === 0 ? "Dnes je poslední den!" : `Zbývá ${stats.daysRemainingInMonth} dní`}</span>
              </div>
            </div>
          </div>
          <div style={{ borderColor: 'var(--border-color)' }} className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold">
            {isEditingGoal ? (
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="number" min="1" value={newGoalInput} 
                  onChange={(e) => setNewGoalInput(e.target.value)} 
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }}
                  className="w-16 px-2 py-1 border rounded-md outline-none text-sm font-bold text-center"
                />
                <button style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} onClick={handleSaveGoal} className="px-2 py-1 rounded font-black uppercase text-[10px] cursor-pointer border-none shadow-sm">Uložit</button>
                <button style={{ color: 'var(--text-muted)' }} onClick={() => setIsEditingGoal(false)} className="px-1 py-1 font-bold cursor-pointer bg-transparent border-none">Zrušit</button>
              </div>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)' }} className="opacity-70">Měsíční limit laťky:</span>
                <button onClick={() => setIsEditingGoal(true)} style={{ color: 'var(--text-badge)' }} className="font-black uppercase tracking-wider p-0 bg-transparent border-none cursor-pointer text-[10px]">Změnit cíl</button>
              </>
            )}
          </div>
        </div>

        {/* CELKEM PŘEČTENO */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-left">
              <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider">Celková knihovna</h3>
              <p style={{ color: 'var(--text-body)' }} className="text-4xl font-black m-0">
                {stats.totalRead} <span style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-bold opacity-60">knih</span>
              </p>
            </div>
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="p-3 rounded-xl">
              <CheckCircle size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }} className="text-xs font-medium mt-4 pt-3 border-t text-left flex items-center gap-1">
            <Sparkles size={12} style={{ color: 'var(--bg-primary)' }} /> Všechna přečtená díla od začátku tvého profilu.
          </p>
        </div>
      </div>

      {/* TÝDENNÍ AKTIVITA */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm mb-8">
        <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider mb-4 text-left flex items-center gap-1.5">
          <TrendingUp size={14} /> Tvoje aktivita v posledních dnech
        </h3>
        <div className="grid grid-cols-7 gap-2 md:gap-4 text-center">
          {stats.weeklyActivity.map((day, idx) => (
            <div key={idx} style={{ borderColor: day.isToday ? 'var(--bg-primary)' : 'transparent', backgroundColor: day.isToday ? 'var(--bg-badge)' : 'transparent' }} className="p-3 rounded-xl flex flex-col items-center gap-2 border">
              <span style={{ color: day.isToday ? 'var(--text-badge)' : 'var(--text-muted)' }} className={`text-xs font-black uppercase ${!day.isToday && 'opacity-60'}`}>{day.dayLabel}</span>
              <div style={{ backgroundColor: day.isActive ? 'rgba(245, 158, 11, 1)' : 'rgba(0,0,0,0.05)', color: day.isActive ? '#ffffff' : 'var(--text-muted)' }} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm">
                {day.isActive ? <Flame size={16} className="fill-white text-white" /> : <div style={{ backgroundColor: 'currentColor' }} className="w-1.5 h-1.5 rounded-full opacity-40"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SÍŇ SLÁVY (LEADERBOARDS) */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider m-0 flex items-center gap-1.5">
            <Users size={16} style={{ color: 'var(--bg-primary)' }} /> Globální Síň Slávy Jomarid Books (Měsíční cíl: 25 🎯)
          </h3>
          {!stats.showInLeaderboard && (
            <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md uppercase">
              Jsi v režimu inkognito 🔒
            </span>
          )}
        </div>

        {/* TLAČÍTKA KATEGORIÍ */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-primary)' : 'var(--bg-badge)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-badge)'
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer transition-all shadow-sm"
              >
                <CatIcon size={14} /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* VÝPIS ŽEBŘÍČKU */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {leaderboards[activeTab]?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }} className="text-sm font-bold text-center py-6 opacity-60">V této kategorii zatím nikdo nesoutěží.</p>
          ) : (
            leaderboards[activeTab].map((row, index) => {
              const currentCategory = categories.find(c => c.id === activeTab);
              const displayValue = row[activeTab];
              
              let medalStyle = "text-xs font-black opacity-40 w-6 text-center";
              if (index === 0) medalStyle = "text-xl w-6 text-center animate-bounce";
              if (index === 1) medalStyle = "text-lg w-6 text-center";
              if (index === 2) medalStyle = "text-md w-6 text-center";

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: row.isMe ? 'var(--bg-badge)' : 'rgba(0,0,0,0.02)',
                    borderColor: row.isMe ? 'var(--bg-primary)' : 'transparent'
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${row.isMe && 'font-bold shadow-sm'}`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <span className={medalStyle}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm tracking-wide truncate max-w-[200px] sm:max-w-[350px]">
                        {row.email} {row.isMe && <span className="text-[10px] bg-[var(--bg-primary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded ml-1 uppercase font-black">Ty</span>}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right font-black text-sm flex items-center gap-1">
                    <span>{displayValue.toLocaleString()}</span>
                    <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase opacity-60">
                      {currentCategory?.suffix}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ODZNÁČKY */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm mb-8">
        <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider mb-6 text-left flex items-center gap-1.5">
          <Award size={16} style={{ color: 'var(--bg-primary)' }} /> Sběratelské Odznáčky Knihovny
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BOOK_BADGES.map((badge) => {
            const isUnlocked = badge.condition(stats);
            const BadgeIcon = badge.icon;
            return (
              <div key={badge.id} style={{ backgroundColor: isUnlocked ? 'var(--bg-badge)' : 'rgba(0, 0, 0, 0.04)', borderColor: isUnlocked ? 'var(--border-color)' : 'transparent', opacity: isUnlocked ? 1 : 0.4 }} className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 shadow-inner ${isUnlocked ? 'scale-100' : 'scale-95'}`}>
                <div style={{ backgroundColor: isUnlocked ? 'var(--bg-primary)' : 'rgba(255,255,255,0.05)', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }} className="w-12 h-12 rounded-full flex items-center justify-center shadow-md shrink-0 transition-transform duration-500">
                  <BadgeIcon size={22} className={isUnlocked ? "animate-pulse" : ""} />
                </div>
                <div className="text-left flex flex-col">
                  <span style={{ color: isUnlocked ? 'var(--text-badge)' : 'var(--text-muted)' }} className="font-black text-sm tracking-wide uppercase">{badge.title}</span>
                  <span style={{ color: 'var(--text-body)' }} className="text-xs opacity-70 mt-0.5">{badge.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TLAČÍTKA ZPĚT */}
      <div className="flex justify-end">
        <Link to="/app" className="no-underline">
          <button style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity border-none cursor-pointer shadow-md">
            Zpět do knihovny <ChevronRight size={14} />
          </button>
        </Link>
      </div>

    </div>
  );
};

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      
      // Bezpečné načtení dat bez nespolehlivých DB joinů
      Promise.all([
        supabase.from('books').select('id, title, author'),
        supabase.from('user_books').select('book_id, status').eq('user_id', user.id)
      ]).then(([booksRes, userBooksRes]) => {
        const allBooks = booksRes.data || [];
        const myUserBooks = userBooksRes.data || [];

        // Vyfiltrujeme pouze ty knihy, ke kterým má uživatel schválený přístup (status === 'active')
        const activeBooks = allBooks.filter(book => {
          const userBookEntry = myUserBooks.find(ub => ub.book_id === book.id);
          return userBookEntry?.status === 'active';
        });

        setUserBooks(activeBooks);
        setLoading(false);
      }).catch(err => {
        console.error("Chyba při vyhledávání:", err);
        setLoading(false);
      });
    } else { 
      setQuery(''); 
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Filtrování výsledků podle zadaného textu v inputu
  const filtered = userBooks.filter(b => 
    b?.title?.toLowerCase().includes(query.toLowerCase()) || 
    b?.author?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-start p-4 pt-20" onClick={onClose}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl shadow-2xl w-full max-w-xl p-6 relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 opacity-50 hover:opacity-100 cursor-pointer text-current bg-transparent border-none">
          <X size={20} />
        </button>
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-60">Vyhledat v mých knihách</h3>
        <div className="relative flex items-center text-slate-800">
          <Search className="absolute left-4 opacity-40 text-current" size={20} />
          <input 
            type="text" 
            placeholder="Zadejte název díla nebo jméno autora..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            autoFocus 
            className="w-full pl-12 pr-4 py-3 border border-black/10 rounded-xl outline-none bg-black/5 text-slate-900 font-bold" 
          />
        </div>
        <div className="mt-4 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Načítání katalogu...
            </div>
          ) : query.trim() === '' ? (
            <p className="text-center py-6 text-xs uppercase tracking-wider opacity-40">Našeptávač se aktivuje psaním...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-6 text-sm opacity-60 font-medium">Žádná z vašich schválených knih neodpovídá zadání.</p>
          ) : (
            filtered.map(book => (
              <Link 
                to={`/read/${book.id}`} 
                key={book.id} 
                onClick={onClose} 
                className="p-3 flex justify-between items-center hover:bg-black/5 transition-colors rounded-xl no-underline text-current"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{book.title}</h4>
                  <p className="text-xs uppercase font-semibold opacity-50 mt-0.5">{book.author}</p>
                </div>
                <ChevronRight size={16} className="opacity-50 text-emerald-600" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      style={{ borderColor: 'var(--border-color)' }} 
      className="border-b last:border-b-0 text-left py-4"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ color: 'var(--text-body)' }}
        className="w-full flex justify-between items-center bg-transparent border-none outline-none cursor-pointer font-black uppercase text-xs tracking-wider text-left py-2 gap-4 group"
      >
        <span className="flex items-center gap-2.5">
          <HelpCircle 
            size={14} 
            style={{ color: 'var(--bg-primary)' }} 
            className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" 
          />
          {question}
        </span>
        <ChevronDown 
          size={16} 
          style={{ color: 'var(--text-muted)' }}
          className={`transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Plynulá vysunovací animace bez trhání přes CSS Grid trick */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pt-2 pb-1' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
        }`}
      >
        <div className="overflow-hidden">
          <p 
            style={{ color: 'var(--text-muted)' }} 
            className="text-xs font-medium leading-relaxed pl-6"
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  // 🔥 AKTUALIZOVANÉ TITULY VČETNĚ HOBINA ROODA JAKO HLAVNÍHO MAGNETU
  const featuredBooks = [
    { 
      title: "Hobin Rood: DÍL 1: JAK OŽEBRAČIT PRVNÍ VESNICI", 
      category: "Dobrodružná satira", 
      author: "Jomarid"
    },
    { 
      title: "Šepot starých knihoven 1. část: Vězení pro příběhy", 
      category: "Mysteriózní fantasy", 
      author: "Alexandr Heryán"
    },
    { 
      title: "Jomirad 1. část", 
      category: "Superhrdinská sága", 
      author: "Jomarid"
    },
  ];

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-5xl mx-auto px-4 pt-24 pb-12 text-center animate-in fade-in duration-700 relative overflow-visible font-sans">
      
      {/* ====================================================
          🔥 PRÉMIOVÉ SBĚRATELSKÉ RAZÍTKO (VIZUÁLNÍ MAGNET)
         ==================================================== */}
      <div className="absolute top-6 right-4 sm:right-12 z-50 pointer-events-none md:scale-110 select-none animate-in zoom-in-50 duration-1000 delay-300">
        <div 
          style={{ 
            borderColor: 'var(--bg-primary)', 
            color: 'var(--bg-primary)',
            boxShadow: '0 0 15px rgba(0,0,0,0.05)'
          }} 
          className="border-[3px] border-dashed rounded-xl px-4 py-2 font-black text-[11px] sm:text-xs uppercase tracking-widest rotate-12 bg-white/5 backdrop-blur-xs flex flex-col items-center gap-0.5"
        >
          <span className="opacity-90 tracking-normal text-[9px] font-bold">Aplikace Ověřena</span>
          <span className="text-sm font-black tracking-tight">JOMARID BOOKS</span>
          <div className="w-full h-[1px] bg-current my-0.5 opacity-30" />
          <span className="text-[9px] tracking-wider">STABLE CORE v2.5</span>
        </div>
      </div>

      {/* 1. HERO SEKCE */}
      <section className="mb-20 relative">
        {/* Horní badge s pulzováním */}
        <div 
          style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider mb-6 animate-pulse"
        >
          <Library size={14} /> Výběrová digitální edice
        </div>
        
        {/* Hlavní nadpis s plynulým náběhem */}
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 leading-tight animate-in slide-in-from-top-6 duration-500">
          Exkluzivní literární díla <br/>
          <span style={{ color: 'var(--bg-primary)' }} className="inline-block hover:scale-105 transition-transform duration-300">
            na dosah ruky
          </span>
        </h1>
        
        {/* Popisek */}
        <p style={{ color: 'var(--text-muted)' }} className="text-base md:text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
          Vítejte v privátním fondu Jomarid Books. Sledujte osudy hrdiny Hobina Rooda, odhalte skryté pravdy v ságách Jomirada a rozpleťte tajemství série Šepot starých knihoven prostřednictvím našeho Cloud-to-Screen rozhraní.
        </p>

        {/* Hlavní akční tlačítko */}
        <div className="max-w-md mx-auto space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <button 
            onClick={() => navigate('/app')} 
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            className="w-full py-4 uppercase font-black tracking-wider text-sm border-none rounded-xl shadow-lg hover:scale-[1.03] hover:shadow-xl active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen size={16} /> Odemknout digitální čítárnu
          </button>
          
          <p style={{ color: 'var(--text-muted)' }} className="text-[11px] font-bold uppercase opacity-50 tracking-wider">
            Nemáte účet? Zřídíte si ho okamžitě a zdarma přímo u vstupu.
          </p>
        </div>

        {/* SEKCE: NAŠE TITULY + KARTY */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-8 text-center">— NAŠE HLAVNÍ TITULY —</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {featuredBooks.map((book, idx) => (
              <div 
                key={idx}
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                className="group relative h-48 rounded-xl p-5 border flex flex-col justify-between text-left shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate('/app')}
              >
                {/* Dynamické podbarvení pozadí při hoveru */}
                <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                
                <div className="relative z-10 flex justify-between items-start w-full">
                  <span style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded shadow-xs">
                    {book.category}
                  </span>
                  <Book size={14} style={{ color: 'var(--text-muted)' }} className="opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-300" />
                </div>

                <div className="relative z-10">
                  <span style={{ color: 'var(--text-muted)' }} className="text-[9px] uppercase font-bold tracking-wider opacity-70 block mb-0.5">
                    {book.author}
                  </span>
                  <h4 style={{ color: 'var(--text-body)' }} className="font-black uppercase text-sm leading-tight mb-2 tracking-tight line-clamp-2 transition-colors group-hover:text-indigo-500">
                    {book.title}
                  </h4>
                  <span style={{ color: 'var(--bg-primary)' }} className="text-[10px] font-black tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                    OTEVŘÍT KNIHU <ChevronRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--border-color)' }} className="border-0 h-[1px] my-16 opacity-30" />

      {/* 2. STATISTIKY (Social Proof) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-24">
        {[
          { value: "100%", label: "Digitální formát" },
          { value: "0 ms", label: "Odezva při otáčení" },
          { value: "24/7", label: "Okamžitý přístup" },
          { value: "Cloud", label: "Synchronizace pozice" }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} 
            className="p-4 rounded-xl border transition-all duration-300 hover:scale-[1.04] hover:shadow-md shadow-sm"
          >
            <p style={{ color: 'var(--text-body)' }} className="text-3xl font-black leading-none mb-1 tracking-tight">{stat.value}</p>
            <p style={{ color: 'var(--text-muted)' }} className="text-[9px] font-black uppercase tracking-wider opacity-60">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* 3. SEKCE: GAMEFIKACE A PROGRESE */}
      <section className="mb-24 animate-in fade-in duration-1000">
        <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-3 text-center">— ČTENÍ JAKO HRA —</h2>
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-10 max-w-xl mx-auto leading-tight">
          Získávejte úrovně, plňte výzvy a odemykejte vzácné trofeje
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {/* Prvek 1: Úrovně a XP */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md group">
            <div style={{ color: 'var(--bg-primary)' }} className="mb-4 transition-transform group-hover:scale-110 duration-300"><Award size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>Čtenářský Level</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Každá přečtená stránka vám generuje zkušenostní body (XP). Postupujte od Zapáleného začátečníka až na bájnou úroveň 100 – Avatar vědění.
            </p>
          </div>

          {/* Prvek 2: Daily Streak */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md group">
            <div className="mb-4 text-orange-500 transition-transform group-hover:scale-110 duration-300"><Flame size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>Denní plamínky</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Udržte si zvyk pravidelného čtení. Čtěte každý den, navyšujte svůj denní Streak a nenechte svůj literární oheň vyhasnout.
            </p>
          </div>

          {/* Prvek 3: Obří sbírka odznaků */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md group">
            <div className="mb-4 text-yellow-500 transition-transform group-hover:scale-110 duration-300"><Trophy size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>80+ Achievementů</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Odhalte skryté milníky rozdělené do 6 unikátních kategorií. Systém automaticky sleduje vaše statistiky a odměňuje vaše čtenářské úspěchy.
            </p>
          </div>

          {/* Prvek 4: Měsíční milníky */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md group">
            <div className="mb-4 text-cyan-500 transition-transform group-hover:scale-110 duration-300"><Target size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>Měsíční výzvy</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Stanovte si na začátku měsíce osobní knižní cíl. Zvládnete splnit plán na 100 %, nebo ho překonáte a získáte odznak Dvojitého zásahu?
            </p>
          </div>
        </div>
      </section>

      {/* 4. VLASTNOSTI / VÝHODY (Features) */}
      <section className="mb-24">
        <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-10 text-center">— PROČ ČÍST S JOMARID BOOKS —</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Feature 1 */}
          <div style={{ borderColor: 'var(--border-color)' }} className="space-y-3 p-5 rounded-xl border border-transparent hover:bg-neutral-500/5 transition-all duration-300 group">
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-6">
              <Zap size={20} />
            </div>
            <h3 style={{ color: 'var(--text-body)' }} className="text-sm font-black uppercase tracking-wider">Bleskové Cloud-to-Screen</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Žádné stahování těžkých PDF nebo EPUB souborů. Naše technologie renderuje texty přímo ze šifrovaného cloudu do vašeho prohlížeče v reálnét čase.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ borderColor: 'var(--border-color)' }} className="space-y-3 p-5 rounded-xl border border-transparent hover:bg-neutral-500/5 transition-all duration-300 group">
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-6">
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ color: 'var(--text-body)' }} className="text-sm font-black uppercase tracking-wider">Privátní kurátorovaný fond</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Nejsme masová knihovna plná balastu. Zaměřujeme se výhradně na prémiové edice, odborné texty a exkluzivní edice, které jinde nenajdete.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ borderColor: 'var(--border-color)' }} className="space-y-3 p-5 rounded-xl border border-transparent hover:bg-neutral-500/5 transition-all duration-300 group">
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-6">
              <Sparkles size={20} />
            </div>
            <h3 style={{ color: 'var(--text-body)' }} className="text-sm font-black uppercase tracking-wider">Čisté prostředí bez reklam</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Vaše soustředění je pro nás prioritou. Rozhraní čítárny je absolutně minimalistické, bez rušivých prvků, sociálních sítí či otravných bannerů.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ČASTO KLADENÉ OTÁZKY (FAQ) */}
      <section className="max-w-2xl mx-auto mb-24">
        <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-8 text-center">— ČASTO KLADENÉ OTÁZKY —</h2>
        
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-6 rounded-xl border shadow-sm">
          <div className="opacity-95 space-y-2">
            <FaqItem 
              question="Jak funguje systém gamifikace a získávání odznaků?" 
              answer="Aplikace na pozadí plně monitoruje vaši čtenářskou aktivitu. Kdykoliv přečtete kapitolu, udržíte denní sérii (streak) nebo splníte měsíční cíl, automaticky se vyhodnotí splnění podmínek. V profilu čtenáře pak okamžitě uvidíte nově odemčené barevné trofeje z celkové sbírky 80 jedinečných odznaků." 
            />
            <FaqItem 
              question="Jak získám přístup ke konkrétním knihám?" 
              answer="Po registraci a vstupu do digitální čítárny uvidíte katalog knih. Správce systému přiděluje licence k jednotlivým titulům na základě vašeho uživatelského profilu. Jakmile vám knihu schválí, okamžitě se vám odemkne." 
            />
            <FaqItem 
              question="Musím něco stahovat nebo instalovat?" 
              answer="Vůbec nic. Jomarid Books funguje kompletně ve vašem webovém prohlížeči (na počítači, tabletu i telefonu). Kód je optimalizovaný pro maximální rychlost a minimální spotřebu dat." 
            />
            <FaqItem 
              question="Pamatuje si systém, kde jsem přestal číst?" 
              answer="Ano. Naše cloudová architektura ukládá vaši přesnou pozici v otevřené knize, takže můžete plynule navázat na mobilu přesně tam, kde jste na počítači skončili." 
            />
            <FaqItem 
              question="Kolik stojí zřízení a vedení účtu?" 
              answer="Vytvoření profilu a přístup do základního rozhraní čítárny je kompletně zdarma. Přidělování specifických licencí podléhá interním pravidlům fondu Jomarid Books." 
            />
          </div>
        </div>
      </section>

      {/* 6. FINÁLNÍ CTA SEKCE */}
      <section style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }} className="rounded-2xl p-8 md:p-12 mb-16 text-center shadow-xl relative overflow-hidden group">
        <div style={{ backgroundColor: 'var(--bg-primary)' }} className="absolute -right-10 -top-10 w-40 h-40 opacity-10 rounded-full blur-2xl transition-all group-hover:scale-110 duration-500"></div>
        
        <h3 style={{ color: 'var(--bg-card)' }} className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">Začněte číst ještě dnes</h3>
        <p style={{ color: 'var(--bg-body)' }} className="text-xs md:text-sm font-medium max-w-lg mx-auto mb-6 opacity-80">
          Vstupte do zabezpečeného literárního ekosystému a objevte digitální komfort nové generace doprovázený herními odměnami.
        </p>
        <div className="max-w-xs mx-auto relative z-10">
          <button 
            onClick={() => navigate('/app')}
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            className="w-full py-3 border-none font-black uppercase text-xs tracking-wider rounded-lg shadow-md cursor-pointer hover:opacity-95 hover:scale-[1.03] active:scale-[0.99] transition-all duration-200"
          >
            Spustit aplikaci
          </button>
        </div>
      </section>

      {/* 7. MODERNÍ KOMPLETNÍ PATIČKA */}
      <footer style={{ borderColor: 'var(--border-color)' }} className="mt-20 pt-8 border-t opacity-70 flex flex-col sm:flex-row items-center justify-between text-[11px] font-black uppercase tracking-wider gap-4">
        <div style={{ color: 'var(--text-muted)' }} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
          <span>© {new Date().getFullYear()} Jomarid Books Ltd.</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="font-medium normal-case opacity-70">Verze platformy v2.5 (Stable Core + Gamification)</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="mailto:wwsigmamango@gmail.com" style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="flex items-center gap-2 no-underline hover:opacity-85 px-3 py-1.5 rounded-md transition-all shadow-xs">
            <Phone size={10} /> Podpora: wwsigmamango@gmail.com
          </a>
        </div>
      </footer>

    </div>
  );
};

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false); // 🔥 Přepínač Login / Registrace
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    try {
      if (isSignUp) {
        // 📝 REŽIM REGISTRACE
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        alert('Účet úspěšně vytvořen! Nyní se můžete přihlásit.');
        setIsSignUp(false); // Přepneme uživatele zpět na login
        setPassword('');    // Vyčistíme heslo pro bezpečnost
      } else {
        // 🔑 REŽIM PŘIHLÁŠENÍ
        await login(email, password);
        navigate('/app');
      }
    } catch (err) {
      if (isSignUp) {
        setError(err.message || 'Chyba při vytváření účtu.');
      } else {
        setError('Neplatný e-mail nebo přístupové heslo.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-sm mx-auto py-24 px-4 animate-in fade-in duration-300">
      <Card>
        {/* Dynamický nadpis podle režimu */}
        <h2 style={{ color: 'var(--text-body)' }} className="text-xl font-black text-center uppercase tracking-tight mb-6">
          {isSignUp ? 'Vytvořit nový účet' : 'Vstup do čítárny'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="E-mailová adresa" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-body)'
            }}
            className="w-full p-3 border rounded-lg text-sm font-bold outline-none transition-colors focus:style={{borderColor:'var(--bg-primary)'}} placeholder:opacity-50" 
            required 
          />
          <input 
            type="password" 
            placeholder={isSignUp ? 'Zvolte si heslo' : 'Přístupové heslo'} 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-body)'
            }}
            className="w-full p-3 border rounded-lg text-sm font-bold outline-none transition-colors focus:style={{borderColor:'var(--bg-primary)'}} placeholder:opacity-50" 
            required 
          />
          
          {error && (
            <p className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-500/10 p-2 rounded-md">
              <AlertTriangle size={12}/> {error}
            </p>
          )}
          
          {/* Dynamické tlačítko */}
          <Button type="submit" disabled={loading} className="w-full py-3 uppercase tracking-wider">
            {loading ? 'Zpracovávám...' : isSignUp ? 'Zaregistrovat se' : 'Odemknout čítárnu'}
          </Button>
        </form>

        {/* 🔥 Přepínací odkaz pod formulářem */}
        <div style={{ borderColor: 'var(--border-color)' }} className="mt-4 pt-4 border-t text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ color: 'var(--bg-primary)' }}
            className="text-xs font-bold hover:underline bg-transparent border-none cursor-pointer tracking-wide uppercase"
          >
            {isSignUp ? 'Už máte účet? Přihlaste se' : 'Nemáte účet? Zaregistrujte se zde'}
          </button>
        </div>
      </Card>
    </div>
  );
};

const UserLibrary = () => {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [likedBookIds, setLikedBookIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all | owned | pending

  // Pomocná funkce pro zjištění username uživatele
  const getUsername = useCallback((email) => {
    return email ? email.split('@')[0] : '';
  }, []);

  const loadLibraryData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 🔥 STREAK - Uložení denní aktivity čtenáře
      const todayStr = new Date().toLocaleDateString('sv');
      await supabase
        .from('user_daily_activity')
        .upsert(
          { user_id: user.id, activity_date: todayStr }, 
          { onConflict: 'user_id,activity_date' }
        );

      // Paralelní načítání pro brutální rychlost načítání
      const [booksRes, userBooksRes, likesRes, allLikesRes] = await Promise.all([
        supabase.from('books').select('*'),
        supabase.from('user_books').select('book_id, is_read, status, updated_at, scroll_position').eq('user_id', user.id),
        supabase.from('book_likes').select('book_id').eq('user_id', user.id),
        supabase.from('book_likes').select('book_id')
      ]);

      if (booksRes.error) throw booksRes.error;
      if (userBooksRes.error) throw userBooksRes.error;

      if (likesRes.data) {
        setLikedBookIds(likesRes.data.map(l => l.book_id));
      }

      const currentUsername = getUsername(user.email);

      // Sloučení a procesování dat s integrovaným auto-assignem
      const processedBooks = (booksRes.data || []).map(b => {
        const userBookEntry = userBooksRes.data?.find(ub => ub.book_id === b.id);
        const totalLikesCount = (allLikesRes.data?.filter(l => l.book_id === b.id).length || 0) + (b.fake_likes || 0);

        // 🌟 AUTOMATICKÝ PŘÍSTUP (Auto-assign logika na FE)
        // Pokud knihu vydal sám přihlášený uživatel (autor === username), má k ní přístup automaticky
        const isOwner = b.author === currentUsername;
        const hasAccess = isOwner || userBookEntry?.status === 'active';
        const isPending = !isOwner && userBookEntry?.status === 'requested';

        return {
          id: b.id,
          title: b.title,
          author: b.author,
          likesCount: totalLikesCount,
          hasAccess,
          isPending,
          isOwner,
          isRead: userBookEntry?.is_read || false,
          scrollPosition: userBookEntry?.scroll_position || 0,
          lastOpened: userBookEntry?.updated_at ? new Date(userBookEntry.updated_at).getTime() : 0
        };
      });

      // Seřazení: Rozepsané a aktivní jdou jako první, pak podle data otevření
      processedBooks.sort((a, b) => {
        if (a.hasAccess && b.hasAccess) {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return b.lastOpened - a.lastOpened;
        }
        if (a.hasAccess !== b.hasAccess) return b.hasAccess - a.hasAccess;
        return 0;
      });
      
      setBooks(processedBooks);
    } catch (error) {
      console.error("Chyba při načítání knihovny:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user, getUsername]);

  useEffect(() => { 
    loadLibraryData(); 
  }, [loadLibraryData]);

  const handleRequestLicense = async (bookId) => {
    if (!user) return;
    setSubmittingId(bookId);
    try {
      const { error } = await supabase
        .from('user_books')
        .insert([{ 
          user_id: user.id, 
          book_id: bookId, 
          status: 'requested', 
          is_read: false 
        }]);

      if (error) throw error;

      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isPending: true } : b));
    } catch (err) {
      alert("Nepodařilo se odeslat žádost: " + err.message);
    } finally { 
      setSubmittingId(null); 
    }
  };

  // Filtrování knih na základě vybrané záložky
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (activeFilter === 'owned') return b.hasAccess;
      if (activeFilter === 'pending') return b.isPending;
      return true; // 'all'
    });
  }, [books, activeFilter]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
      <Loader2 className="animate-spin mb-4" size={40} style={{ color: 'var(--bg-primary)' }} />
      <p className="text-sm font-black uppercase tracking-wider opacity-60">Otevírám tvůj čtenářský trezor...</p>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-6xl mx-auto px-4 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HLAVNÍ HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-500/20">
              <Sparkles size={10} /> Prémiová knihovna
            </span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight m-0">Tvoje Knihovna</h2>
        </div>
        <button 
          onClick={logout} 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold uppercase text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 active:scale-95 transition-all shadow-sm"
        >
          <LogOut size={14} />
          <span>Odhlásit se</span>
        </button>
      </div>

      {/* 🔥 GAMIFIKAČNÍ STREAK PANEL */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Flame size={24} className="animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase m-0 tracking-tight">Dnešní čtení aktivováno!</h4>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium m-0 opacity-70">Tvůj denní streak byl zaznamenán. Udržuj plamen zapálený!</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {['all', 'owned', 'pending'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                backgroundColor: activeFilter === filter ? 'var(--text-body)' : 'var(--bg-secondary)',
                color: activeFilter === filter ? 'var(--bg-body)' : 'var(--text-body)',
                borderColor: 'var(--border-color)'
              }}
              className="px-3.5 py-2 border rounded-xl font-black text-[10px] uppercase cursor-pointer tracking-wider transition-all hover:opacity-90 active:scale-95"
            >
              {filter === 'all' && 'Všechny díla'}
              {filter === 'owned' && 'Moje Knihy'}
              {filter === 'pending' && 'V řízení'}
            </button>
          ))}
        </div>
      </div>

      {/* MŘÍŽKA S KNIHAMI */}
      {filteredBooks.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl text-center py-16 px-4 shadow-inner">
          <Compass size={40} className="mx-auto mb-3 opacity-30 animate-spin" style={{ animationDuration: '10s' }} />
          <h4 className="font-black uppercase text-sm tracking-tight m-0">V této sekci nic není</h4>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium max-w-xs mx-auto mt-1 opacity-75">Zkus přepnout filtr nebo zažádej o novou licenci z katalogu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredBooks.map(b => {
            const isUserLiked = likedBookIds.includes(b.id);
            
            return (
              <div 
                key={b.id} 
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} 
                className="border p-4 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--bg-primary)]/30 relative"
              >
                <div>
                  {/* OBÁLKA KNIHY */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="aspect-[3/4] rounded-xl mb-4 flex flex-col items-center justify-center relative overflow-hidden group-hover:brightness-105 transition-all shadow-inner">
                    {/* Efektní pozadí pro zamčené vs odemčené */}
                    <div className={`absolute inset-0 opacity-5 bg-gradient-to-t ${b.hasAccess ? 'from-emerald-500 to-transparent' : 'from-neutral-500 to-transparent'}`} />
                    
                    {b.hasAccess ? (
                      <BookOpen size={36} className="opacity-40 text-[var(--bg-primary)] transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <Lock size={36} className="opacity-20 transition-transform duration-300 group-hover:rotate-12" />
                    )}
                    
                    {/* Badge typu auto-assign / autorství */}
                    {b.isOwner && (
                      <span className="absolute bottom-2 left-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                        <Shield size={10} /> Vlastní dílo
                      </span>
                    )}

                    {/* Likes Badge */}
                    <div className="absolute top-2 right-2 border px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black bg-[var(--bg-card)] shadow-sm transition-transform group-hover:scale-105" style={{ borderColor: 'var(--border-color)' }}>
                      <Heart size={11} className={`${isUserLiked ? "fill-red-500 text-red-500" : "opacity-30"}`} />
                      <span>{b.likesCount}</span>
                    </div>
                  </div>

                  {/* INFO O KNIZE */}
                  <h4 className="font-black uppercase text-sm tracking-tight line-clamp-2 m-0 group-hover:text-[var(--bg-primary)] transition-colors">{b.title}</h4>
                  <p className="text-xs uppercase font-bold mt-1 opacity-60 m-0" style={{ color: 'var(--text-muted)' }}>{b.author}</p>
                  
                  {/* PROGRESS BAR */}
                  {b.hasAccess && (
                    <div className="mt-4 space-y-1 bg-[var(--bg-secondary)] p-2 rounded-xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider opacity-60">
                        <span>{b.isRead ? 'Dokončeno' : 'Rozečteno'}</span>
                        <span>{Math.round(b.scrollPosition)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-700 rounded-full" 
                          style={{ 
                            width: `${b.isRead ? 100 : b.scrollPosition}%`, 
                            backgroundColor: b.isRead ? 'var(--text-body)' : 'var(--bg-primary)' 
                          }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* AKČNÍ TLAČÍTKA */}
                <div className="mt-4">
                  {b.hasAccess ? (
                    <Link to={`/read/${b.id}`} className="no-underline block">
                      <button 
                        style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }} 
                        className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 hover:opacity-90"
                      >
                        <BookOpen size={13} /> {b.isRead ? 'Číst znovu' : 'Pokračovat v čtení'}
                      </button>
                    </Link>
                  ) : b.isPending ? (
                    <div 
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                      className="py-3 text-center rounded-xl border text-[10px] font-black uppercase tracking-wider opacity-60 cursor-default animate-pulse"
                    >
                      Čeká na schválení
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRequestLicense(b.id)} 
                      disabled={submittingId === b.id}
                      style={{ backgroundColor: 'var(--bg-primary)', color: 'white' }} 
                      className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer border-none shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:brightness-110"
                    >
                      {submittingId === b.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>Zažádat o licenci</>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Stavy dat a uživatele
  const [book, setBook] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0); 
  const [isRead, setIsRead] = useState(false); 
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  
  // Uživatelské preference čtení
  const [textSize, setTextSize] = useState('base');
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = vypnuto, 1-2 rychlosti
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const progressRef = useRef(0);
  const autoScrollInterval = useRef(null);
  const isInitialScrollSet = useRef(false); // Klíčový zámek proti házení na konec

  // Bezpečná lokální mapa velikostí písma
  const fontSizeMap = {
    'base': 'text-base md:text-lg leading-relaxed',
    'lg': 'text-lg md:text-xl leading-loose',
    'xl': 'text-xl md:text-2xl leading-loose font-semibold'
  };

  const getScrollMetrics = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    const totalHeight = scrollHeight - clientHeight;
    return { scrollY, totalHeight };
  };

  const calculateCurrentProgress = () => {
    const { scrollY, totalHeight } = getScrollMetrics();
    if (totalHeight <= 0) return 0;
    return (scrollY / totalHeight) * 100;
  };

  const calculateTimeRemaining = useCallback((contentStr, progressPct) => {
    if (!contentStr) return 0;
    const words = contentStr.trim().split(/\s+/).length;
    const wordsRemaining = words * (1 - progressPct / 100);
    return Math.ceil(wordsRemaining / 200);
  }, []);

  const saveReadingProgress = async () => {
    const currentUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
    if (!currentUserId || !id) return;

    // Pokud ještě neproběhl úvodní skok na pozici, data neukládáme (přepsali bychom si je nulkou)
    if (!isInitialScrollSet.current) return;

    const progressToSave = Math.min(100, Math.max(0, Math.round(progressRef.current * 10) / 10));

    await supabase
      .from('user_books')
      .update({
        last_read_at: new Date().toISOString(),
        scroll_position: progressToSave
      })
      .eq('user_id', currentUserId)
      .eq('book_id', id);
  };

  // 1. Sledování scrollování a aktualizace progressu
  useEffect(() => {
    const handleScroll = () => {
      // Dokud neskočíme na správné místo, ignorujeme eventy scrollování
      if (!isInitialScrollSet.current) return;

      const progress = calculateCurrentProgress();
      setReadingProgress(progress);
      progressRef.current = progress;

      if (book?.content) {
        setTimeRemaining(calculateTimeRemaining(book.content, progress));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, book, calculateTimeRemaining]);

  // 2. Fungující logika pro Auto-Scroll
  useEffect(() => {
    if (autoScrollSpeed > 0) {
      autoScrollInterval.current = setInterval(() => {
        window.scrollBy(0, autoScrollSpeed === 1 ? 1 : 2);
      }, 30);
    } else {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    }

    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [autoScrollSpeed]);

  // 3. Interval pro automatické ukládání (každých 30 vteřin)
  useEffect(() => {
    const interval = setInterval(() => {
      if (progressRef.current > 0 && isInitialScrollSet.current) {
        saveReadingProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [id, userId]);

  // 4. BeforeUnload pro uložení při zavření
  useEffect(() => {
    const handleBeforeUnload = () => saveReadingProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, userId]);

  // Korekce skoku na pozici při změně velikosti textu
  useEffect(() => {
    if (loading || !isInitialScrollSet.current) return;
    
    const currentPct = progressRef.current;
    const timer = setTimeout(() => {
      const { totalHeight } = getScrollMetrics();
      const targetScroll = (currentPct * totalHeight) / 100;
      window.scrollTo(0, targetScroll);
    }, 60);

    return () => clearTimeout(timer);
  }, [textSize, loading]);

  // Načtení dat knihy a validace oprávnění
  useEffect(() => {
    async function verifyAndLoad() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        setUserId(currentUserId);
        
        const { data: access } = await supabase
          .from('user_books')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('book_id', id)
          .single();

        if (!access) {
          setErr('Nemáte k této knize aktivní přístupovou licenci.');
          setLoading(false);
          return;
        }

        setIsRead(access.is_read || false); 

        const { data: b } = await supabase
          .from('books')
          .select('title, author, content, fake_likes, book_likes(count)')
          .eq('id', id)
          .single();
        
        if (b) {
          setBook(b);
          setLikesCount((b.book_likes?.[0]?.count || 0) + (b.fake_likes || 0));
          setTimeRemaining(calculateTimeRemaining(b.content, access.scroll_position || 0));
        }

        if (currentUserId) {
          const { data: like } = await supabase
            .from('book_likes')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('book_id', id)
            .maybeSingle();
          if (like) setIsLiked(true);
        }

        // 1. Vypneme loading stav
        setLoading(false);

        // 2. Okamžitě naplánujeme skok po vykreslení DOM bez animací
        if (access.scroll_position && access.scroll_position > 0) {
          progressRef.current = access.scroll_position;
          setReadingProgress(access.scroll_position);
          
          setTimeout(() => {
            const { totalHeight } = getScrollMetrics();
            const pixelPosition = (access.scroll_position * totalHeight) / 100;
            
            // Skočíme okamžitě na přesný pixel, žádný smooth scroll, který by se pral s layoutem
            window.scrollTo(0, pixelPosition);
            
            // Odemkneme ukládání a sledování scrollu až PO úspěšném skoku
            setTimeout(() => {
              isInitialScrollSet.current = true;
            }, 100);
          }, 150); // Dostatečná pauza, aby prohlížeč schoval loader a vykreslil text
        } else {
          isInitialScrollSet.current = true;
        }

      } catch (e) {
        setErr('Chyba při otevírání knihy.');
        setLoading(false);
      }
    }

    verifyAndLoad();
  }, [id, calculateTimeRemaining]);

  const toggleReadStatus = async (status) => {
    await supabase.from('user_books').update({ is_read: status }).eq('user_id', userId).eq('book_id', id);
    setIsRead(status);
    if (status) {
      setTimeout(() => navigate('/app'), 400);
    } 
  };

  const toggleLike = async () => {
    if (!userId || !id) return;
    if (isLiked) {
      await supabase.from('book_likes').delete().eq('user_id', userId).eq('book_id', id);
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('book_likes').insert([{ user_id: userId, book_id: id }]);
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleBack = async (e) => {
    e.preventDefault();
    setAutoScrollSpeed(0);
    await saveReadingProgress();
    navigate('/app');
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-body)' }} className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-xs font-black uppercase tracking-widest opacity-60 mt-3 animate-pulse">Připravuji čtecí plátno...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-body)' }} className="min-h-screen flex flex-col justify-center items-center p-6 text-center">
        <AlertTriangle className="text-amber-500 mb-2" size={40} />
        <h3 className="font-black uppercase text-base tracking-tight m-0">Přístup odepřen</h3>
        <p className="text-sm opacity-70 max-w-sm mt-2">{err}</p>
        <button onClick={() => navigate('/app')} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-lg active:scale-95 transition-all">Zpět do knihovny</button>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        backgroundColor: 'var(--bg-body)', 
        color: 'var(--text-body)', 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        MozUserSelect: 'none', 
        msUserSelect: 'none'
      }} 
      onContextMenu={e => e.preventDefault()} 
      className="min-h-screen pb-24 relative select-none font-sans"
    >
      {/* 1. TOP PROGRESS BAR */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[110] bg-black/5 backdrop-blur-xs">
        <div className="h-full transition-all duration-150 ease-out" style={{ width: `${readingProgress}%`, backgroundColor: 'var(--bg-primary)' }}/>
      </div>

      {/* 2. PEVNÁ HORNÍ LIŠTA NASTAVENÍ */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxSizing: 'border-box'
        }} 
        className="fixed top-4 left-4 right-4 z-[100] border rounded-2xl p-3 shadow-xl flex items-center justify-between max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <a href="/app" onClick={handleBack} className="w-9 h-9 rounded-xl flex items-center justify-center border no-underline transition-all active:scale-95 hover:bg-black/5" style={{ color: 'var(--text-body)', borderColor: 'var(--border-color)' }}>
            <ArrowLeft size={16} />
          </a>
          <div>
            <h5 className="font-black text-xs uppercase tracking-tight m-0 truncate max-w-[140px] sm:max-w-[240px]">{book?.title}</h5>
            <p style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase font-bold m-0">{timeRemaining > 0 ? `Zbývá cca ${timeRemaining} min` : 'Dočteno'}</p>
          </div>
        </div>

        {/* OVLÁDÁNÍ ČTENÍ */}
        <div className="flex items-center gap-2">
          
          {/* Hands-free AutoScroll Control */}
          <button 
            onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : 0)}
            style={{ borderColor: autoScrollSpeed > 0 ? 'var(--bg-primary)' : 'var(--border-color)' }}
            className={`h-9 px-3 rounded-xl border text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all ${autoScrollSpeed > 0 ? 'bg-black/5 text-amber-500' : 'opacity-70 hover:bg-black/5'}`}
          >
            {autoScrollSpeed > 0 ? <Pause size={12} className="animate-pulse" /> : <Play size={12} />}
            <span className="hidden md:inline">{autoScrollSpeed === 0 ? 'Hands-free' : `Rychlost ${autoScrollSpeed}x`}</span>
          </button>

          {/* Přepínač velikosti písma */}
          <div className="flex items-center border rounded-xl p-0.5" style={{ borderColor: 'var(--border-color)' }}>
            {['base', 'lg', 'xl'].map((size) => (
              <button 
                key={size} 
                onClick={() => setTextSize(size)} 
                style={{ 
                  backgroundColor: textSize === size ? 'var(--bg-primary)' : 'transparent', 
                  color: textSize === size ? 'var(--text-primary)' : 'var(--text-muted)' 
                }}
                className={`w-8 h-8 rounded-lg text-xs font-black uppercase transition-all border-none cursor-pointer flex items-center justify-center ${textSize !== size && 'hover:bg-black/5'}`}
              >
                {size === 'base' ? 'A' : size === 'lg' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 3. TĚLO KNIHY (Odstraněny layout-breaking animace pro stabilní scroll) */}
      <div className="max-w-3xl mx-auto pt-36 px-4">
        
        {/* TITULNÍ BLOK KNIHY */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1 opacity-70">
                <Eye size={12} />
                <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-widest m-0">{book?.author || 'Neznámý autor'}</p>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight m-0">{book?.title}</h1>
            </div>

            {/* Like Tlačítko */}
            <button 
              onClick={toggleLike} 
              style={{ 
                backgroundColor: isLiked ? 'var(--bg-secondary)' : 'transparent', 
                borderColor: isLiked ? 'var(--bg-primary)' : 'var(--border-color)', 
                color: isLiked ? 'var(--bg-primary)' : 'var(--text-muted)' 
              }} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase border tracking-wider cursor-pointer transition-all active:scale-90 ${isLiked ? 'shadow-inner' : 'hover:bg-black/5'}`}
            >
              <Heart size={14} className={isLiked ? "animate-bounce fill-current" : ""} />
              <span>{likesCount} lajků</span>
            </button>
          </div>
        </div>

        {/* OCHRÁNĚNÝ TEXT KNIHY */}
        <div 
          style={{ color: 'var(--text-body)', borderColor: 'var(--border-color)' }} 
          onCopy={e => e.preventDefault()}
          onBeforeCopy={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
          onSelectStart={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
          className={`max-w-2xl mx-auto whitespace-pre-line text-justify tracking-wide transition-all duration-300 select-none pb-12 font-medium border-b border-dashed ${fontSizeMap[textSize]}`}
        >
          {book?.content}
        </div>

        {/* FOOTER ČTEČKY */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-1 shadow-xs">
            <BookOpen size={20} style={{ color: 'var(--text-muted)' }} className="opacity-60" />
          </div>
          
          <h4 className="font-black uppercase text-xs tracking-wider m-0 opacity-80">Dočetli jste na konec kapitoly</h4>
          
          <button 
            onClick={() => toggleReadStatus(!isRead)} 
            style={{ 
              backgroundColor: isRead ? 'var(--bg-secondary)' : 'var(--bg-primary)', 
              color: isRead ? 'var(--text-body)' : 'var(--text-primary)'
            }} 
            className="px-12 py-4 border-none rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-98 shadow-md flex items-center gap-2"
          >
            {isRead ? (
              <><RefreshCw size={14} /> Resetovat stav a číst znovu</>
            ) : (
              <><Check size={14} className="font-black" /> Označit jako přečtené</>
            )}
          </button>
          
          {isRead && (
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500 m-0 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              ✓ Kniha byla uložena mezi dokončené svazky.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

const PublisherDashboard = () => {
  const [myBooks, setMyBooks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); 
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Pomocná funkce pro získání username z e-mailu
  const getUsername = useCallback((email) => {
    return email ? email.split('@')[0] : '';
  }, []);

  // Výpočet celkového počtu lajků nakladatele pro statistickou kartu
  const getTotalLikes = () => {
    return myBooks.reduce((sum, b) => sum + (b.likesCount || 0), 0);
  };

  const fetchPublisherBooks = async (username) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(`
          id, 
          title, 
          author, 
          fake_likes,
          book_likes(count)
        `)
        .eq('author', username);

      if (error) throw error;

      if (data) {
        const booksWithLikes = data.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          likesCount: (book.book_likes?.[0]?.count || 0) + (book.fake_likes || 0) 
        }));
        setMyBooks(booksWithLikes);
      }
    } catch (err) {
      console.error("Chyba při načítání knih nakladatele:", err.message);
    }
  };

  const fetchPendingRequests = async (username) => {
    setLoadingRequests(true);
    try {
      const { data: publisherBooks, error: booksError } = await supabase
        .from('books')
        .select('id')
        .eq('author', username);

      if (booksError) throw booksError;

      const bookIds = publisherBooks?.map(b => b.id) || [];

      if (bookIds.length === 0) {
        setPendingRequests([]);
        return;
      }

      // 🔥 OPRAVA: Přidán explicitní join profiles!user_id(email) kvůli více relacím v databázi
      const { data: requests, error: requestsError } = await supabase
        .from('user_books')
        .select(`
          id,
          user_id,
          book_id,
          status,
          created_at,
          profiles!user_id(email),
          books(title)
        `)
        .eq('status', 'requested')
        .in('book_id', bookIds);

      if (requestsError) throw requestsError;
      if (requests) setPendingRequests(requests);

    } catch (err) {
      console.error("Chyba při načítání žádostí:", err.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadAllData = useCallback(async () => {
    if (!user) return;
    const username = getUsername(user.email);

    try {
      // Paralelní načítání všech dat pro lepší performance
      await Promise.all([
        fetchPublisherBooks(username),
        fetchPendingRequests(username),
        (async () => {
          const { data, error } = await supabase.from('profiles').select('id, email');
          if (!error) setProfiles(data || []);
        })()
      ]);
    } catch (err) {
      console.error("Chyba při inicializaci dat dashboardu:", err.message);
    }
  }, [user, getUsername]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const createBook = async (e) => {
    e.preventDefault();
    if (!title || !content) return alert('Doplňte název a text knihy.');

    setIsSubmitting(true);
    const username = getUsername(user.email);

    try {
      // 1. Vložení nové knihy (vrací vložený řádek pro získání nového ID)
      const { data: insertedBook, error: bookError } = await supabase
        .from('books')
        .insert([{ 
          title, 
          content, 
          author: username,
          fake_likes: 0
        }])
        .select('id')
        .single();

      if (bookError) throw bookError;

      // 2. 🔥 AUTO-ASSIGN: Automatické přiřazení aktivní licence pro samotného nakladatele
      if (insertedBook?.id && user?.id) {
        const { error: assignError } = await supabase
          .from('user_books')
          .insert([{ 
            user_id: user.id, 
            book_id: insertedBook.id,
            status: 'active',
            is_read: false
          }]);
        
        if (assignError) {
          console.warn("Kniha byla vytvořena, ale auto-assign selhal:", assignError.message);
        }
      }

      // Reset formuláře a refresh seznamu
      setTitle(''); 
      setContent('');
      await fetchPublisherBooks(username);
      alert('Kniha byla úspěšně publikována a hned přiřazena do Vaší knihovny!');

    } catch (error) {
      alert('Chyba při publikování: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignBook = async () => {
    if (!selectedBookId || !selectedUserId) return alert('Vyberte knihu a uživatele');
    
    const { error } = await supabase.from('user_books').insert([{ 
      user_id: selectedUserId, 
      book_id: selectedBookId,
      status: 'active',
      is_read: false
    }]);
    
    if (error) {
      alert('Chyba nebo uživatel již tuto knihu má: ' + error.message);
    } else {
      alert('Kniha byla úspěšně přiřazena uživateli!');
      setSelectedBookId('');
      setSelectedUserId('');
    }
  };

  const handleApproveRequest = async (requestId) => {
    const { error } = await supabase
      .from('user_books')
      .update({ status: 'active' })
      .eq('id', requestId);

    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } else {
      alert('Žádost se nepodařilo schválit: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('id', requestId);

    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } else {
      alert('Žádost se nepodařilo zamítnout: ' + error.message);
    }
  };

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-5xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HLAVIČKA PANELU */}
      <div style={{ borderColor: 'var(--border-color)' }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight m-0">Nakladatelský Panel</h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium mt-1 opacity-70">Správa rukopisů, autorských licencí a čtenářské komunity.</p>
        </div>
        <span style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="text-xs px-4 py-2 border rounded-xl font-bold uppercase flex items-center gap-2 shadow-sm">
          <ShieldCheck size={14} style={{ color: 'var(--bg-primary)' }} />
          <span>Vydavatel: {getUsername(user?.email)}</span>
        </span>
      </div>

      {/* MINI STATISTICKÝ PŘEHLED (DASHBOARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-4 flex items-center gap-4 shadow-sm border rounded-2xl">
          <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-current">
            <BookOpen size={20} className="opacity-80" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider m-0 opacity-60">Vydané svazky</p>
            <h3 className="text-xl font-black m-0">{myBooks.length}</h3>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-4 flex items-center gap-4 shadow-sm border rounded-2xl">
          <div style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--bg-primary)' }} className="w-12 h-12 rounded-xl flex items-center justify-center">
            <Heart size={20} className="fill-current" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider m-0 opacity-60">Ohlasy celkem</p>
            <h3 className="text-xl font-black m-0">{getTotalLikes()} lajků</h3>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className={`p-4 flex items-center gap-4 shadow-sm border rounded-2xl transition-all ${pendingRequests.length > 0 ? 'border-amber-500/30' : ''}`}>
          <div style={{ backgroundColor: pendingRequests.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)' }} className="w-12 h-12 rounded-xl flex items-center justify-center">
            <Clock size={20} className={pendingRequests.length > 0 ? "text-amber-500 animate-pulse" : "opacity-80"} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider m-0 opacity-60">Čekající žádosti</p>
            <h3 className={`text-xl font-black m-0 ${pendingRequests.length > 0 ? 'text-amber-500' : ''}`}>{pendingRequests.length}</h3>
          </div>
        </div>
      </div>
      
      {/* SEKCE 1: ČEKAJÍCÍ ŽÁDOSTI O LICENCE */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-6 shadow-md rounded-2xl border">
        <h3 style={{ color: 'var(--bg-primary)' }} className="font-black mb-4 text-base uppercase tracking-tight flex items-center gap-2">
          <Clock size={18} className={pendingRequests.length > 0 ? "animate-spin duration-1000" : ""} /> Žádosti o schválení licencí k Vašim knihám
        </h3>
        
        {loadingRequests ? (
          <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-60 py-6 justify-center">
            <Loader2 className="animate-spin" size={16}/> Načítám žádosti čtenářů...
          </div>
        ) : pendingRequests.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="text-center py-6 rounded-xl border border-dashed border-neutral-300/30">
            <p className="text-xs font-black uppercase opacity-50 m-0 tracking-wide">Všechny licence jsou vyřízeny. Žádný čtenář nečeká.</p>
          </div>
        ) : (
          <div style={{ borderColor: 'var(--border-color)' }} className="divide-y border rounded-xl overflow-hidden shadow-sm">
            {pendingRequests.map(req => (
              <div key={req.id} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 gap-4 transition-colors hover:bg-black/5">
                <div className="flex items-start gap-3">
                  <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="w-9 h-9 rounded-lg border flex items-center justify-center opacity-70">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase m-0 tracking-tight">{req.books?.title}</h4>
                    {/* Vykreslení upravené relace */}
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium m-0 mt-0.5">Čtenář: <span style={{ color: 'var(--text-body)' }} className="font-bold">{req.profiles?.email}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    onClick={() => handleApproveRequest(req.id)}
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    className="py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} /> Schválit
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(req.id)}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                    className="py-2 px-3 rounded-xl text-xs font-black uppercase border cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 active:scale-95 transition-all flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DVOUSLOUPCOVÝ EDITAČNÍ BLOK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FORMULÁŘ PRO NOVOU KNIHU */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-6 shadow-md rounded-2xl border">
          <h3 className="font-black mb-4 text-base uppercase tracking-tight flex items-center gap-2">
            <PlusCircle size={18} style={{ color: 'var(--bg-primary)' }} /> Vložit novou knihu do katalogu
          </h3>
          <form onSubmit={createBook} className="space-y-4">
            <input 
              type="text" 
              placeholder="Název knihy" 
              value={title} 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
              className="w-full p-3.5 border rounded-xl font-bold outline-none text-sm placeholder:opacity-40 transition-all focus:border-[var(--bg-primary)]" 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Sem vložte kompletní text knihy..." 
              value={content} 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
              className="w-full p-3.5 border rounded-xl font-bold outline-none resize-none text-sm placeholder:opacity-40 transition-all focus:border-[var(--bg-primary)]" 
              rows={7} 
              onChange={e => setContent(e.target.value)} 
              required 
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              className="w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider border-none cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><BookOpen size={14}/> Publikovat svazek</>}
            </button>
          </form>
        </div>
        
        {/* RUČNÍ PŘIŘAZENÍ LICENCE */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-6 shadow-md rounded-2xl border flex flex-col justify-between">
          <div>
            <h3 className="font-black mb-4 text-base uppercase tracking-tight flex items-center gap-1.5">
              <UserPlus size={18} style={{ color: 'var(--bg-primary)' }} /> Přímé přiřazení licence čtenáři
            </h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium mb-4 opacity-70">Umožňuje okamžitě darovat nebo přiřadit licenci vybranému uživateli bez nutnosti schvalovacího procesu.</p>
            
            <div className="space-y-3">
              <select 
                onChange={e => setSelectedBookId(e.target.value)} 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3.5 border rounded-xl font-bold text-xs outline-none cursor-pointer transition-all focus:border-[var(--bg-primary)]"
                value={selectedBookId}
              >
                <option value="">-- Vyberte SVOU knihu --</option>
                {myBooks.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
              
              <select 
                onChange={e => setSelectedUserId(e.target.value)} 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3.5 border rounded-xl font-bold text-xs outline-none cursor-pointer transition-all focus:border-[var(--bg-primary)]"
                value={selectedUserId}
              >
                <option value="">-- Vyberte čtenáře podle e-mailu --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.email}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            onClick={assignBook} 
            style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }}
            className="w-full py-3.5 mt-4 rounded-xl font-black uppercase text-xs tracking-wider border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] shadow-md flex items-center justify-center gap-2"
          >
            <UserPlus size={14} /> Aktivovat licenci natvrdo
          </button>
        </div>
      </div>

      {/* STATISTIKY VYDANÝCH KNIH */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-6 shadow-md rounded-2xl border">
        <h3 className="font-black mb-4 text-base uppercase tracking-tight flex items-center gap-2">
          <BarChart3 size={18} style={{ color: 'var(--bg-primary)' }} /> Katalog Vašich děl a čtenářské ohlasy
        </h3>
        
        {myBooks.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="text-center py-8 rounded-xl border border-dashed border-neutral-300/30">
            <p className="text-xs font-black uppercase opacity-50 m-0 tracking-wide">Zatím jste do katalogu nevložil(a) žádné knihy.</p>
          </div>
        ) : (
          <div style={{ borderColor: 'var(--border-color)' }} className="border rounded-xl divide-y max-h-72 overflow-y-auto shadow-sm">
            {myBooks.map(b => (
              <div key={b.id} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="flex justify-between items-center p-4 transition-colors hover:bg-black/5">
                <div>
                  <h4 className="font-black text-sm uppercase m-0 tracking-tight">{b.title}</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase opacity-50 font-black m-0 mt-0.5">ID svazku: {b.id}</p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-primary)', color: 'var(--bg-primary)' }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm font-black text-xs select-none">
                  <Heart size={12} className="fill-current text-current" />
                  <span>{b.likesCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  // --- Základní stavy dat ---
  const [books, setBooks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // --- Stavy rozhraní (UX) ---
  const [activeTab, setActiveTab] = useState('overview'); // overview | books | users | logs
  const [globalLoading, setGlobalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // --- Filtry & Vyhledávání ---
  const [searchBook, setSearchBook] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterLogType, setFilterLogType] = useState('all');

  // --- Formulářové stavy pro Knihy ---
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [fakeLikes, setFakeLikes] = useState(0); 
  const [isAutoAssigned, setIsAutoAssigned] = useState(false); 
  const [editingBookId, setEditingBookId] = useState(null);
  
  // --- Správa konkrétního uživatele ---
  const [activeUser, setActiveUser] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [userFakeXpInput, setUserFakeXpInput] = useState(0);

  // Bezpečný zápis do systémových logů
  const safeLog = async (logType, message) => {
    try {
      await supabase.from('system_logs').insert([{ log_type: logType, message }]);
    } catch (err) {
      console.warn("Logování do DB selhalo (RLS/403):", message);
    }
  };

  // Hlavní funkce pro načtení všech dat ze systému
  const refreshData = async () => {
    setGlobalLoading(true);
    try {
      // 1. Načtení knih
      const { data: b } = await supabase
        .from('books')
        .select('id, title, author, fake_likes, is_auto_assigned, book_likes(count)');
        
      // 2. Načtení profilů
      const { data: p } = await supabase
        .from('profiles')
        .select('id, email, role, created_at, fake_xp')
        .order('created_at', { ascending: false });
      
      // 3. Načtení logů
      const { data: l } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      
      // 4. Načtení čekajících žádostí o licenci
      const { data: reqs, error: reqError } = await supabase
        .from('user_books')
        .select('id, user_id, book_id, created_at, status')
        .eq('status', 'requested');

      if (reqError) console.error("Chyba při načítání user_books:", reqError);

      // JS in-memory spojení dat pro spolehlivost bez DB JOINů
      const mapovaneZadosti = reqs?.map(req => {
        const najdiProfil = p?.find(u => u.id === req.user_id);
        const najdiKnihu = b?.find(k => k.id === req.book_id);

        return {
          id: req.id,
          user_id: req.user_id,
          book_id: req.book_id,
          created_at: req.created_at,
          profiles: { email: najdiProfil ? najdiProfil.email : `ID: ${req.user_id?.substring(0, 6)}...` },
          books: { title: najdiKnihu ? najdiKnihu.title : `Kniha ID: ${req.book_id?.substring(0, 6)}...` }
        };
      }) || [];
      
      const booksWithLikes = b?.map(book => {
        const realLikes = book.book_likes?.[0]?.count || 0;
        const fikes = book.fake_likes || 0;
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          fake_likes: fikes,
          is_auto_assigned: book.is_auto_assigned || false,
          likesCount: realLikes + fikes 
        };
      }) || [];

      // Synchronizace rozpracovaného uživatele po refreshování dat
      if (activeUser) {
        const updatedActiveUser = p?.find(u => u.id === activeUser.id);
        if (updatedActiveUser) {
          setActiveUser(updatedActiveUser);
          setUserFakeXpInput(updatedActiveUser.fake_xp || 0);
        }
      }

      setBooks(booksWithLikes); 
      setProfiles(p || []); 
      setLogs(l || []);
      setPendingRequests(mapovaneZadosti);
    } catch (err) {
      console.error("Chyba v refreshData:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Inicializace a real-time poslech na systémové logy
  useEffect(() => {
    refreshData();
    const sub = supabase.channel('sys_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, payload => {
        setLogs(prev => [payload.new, ...prev].slice(0, 50));
      }).subscribe();
    
    return () => { supabase.removeChannel(sub); };
  }, []);

  // --- Klientské vyhledávací a filtrační procesory (useMemo) ---
  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(searchBook.toLowerCase()) || 
      b.author.toLowerCase().includes(searchBook.toLowerCase())
    );
  }, [books, searchBook]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchesSearch = p.email?.toLowerCase().includes(searchUser.toLowerCase());
      const matchesRole = filterRole === 'all' || (p.role || 'uživatel') === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchUser, filterRole]);

  const filteredLogs = useMemo(() => {
    if (filterLogType === 'all') return logs;
    return logs.filter(l => l.log_type === filterLogType);
  }, [logs, filterLogType]);

  // --- Handlery akcí ---
  const approveRequest = async (requestId, userEmail, bookTitle) => {
    setActionLoading(true);
    const { error } = await supabase.from('user_books').update({ status: 'active' }).eq('id', requestId);
    if (!error) {
      await safeLog('SUCCESS', `Schválena licence na knihu "${bookTitle}" pro ${userEmail}`);
      refreshData();
    } else {
      alert('Chyba při schvalování: ' + error.message);
    }
    setActionLoading(false);
  };

  const rejectRequest = async (requestId, userEmail, bookTitle) => {
    if (!confirm(`Opravdu chcete zamítnout žádost uživatele ${userEmail} o knihu "${bookTitle}"?`)) return;
    setActionLoading(true);
    const { error } = await supabase.from('user_books').delete().eq('id', requestId);
    if (!error) {
      await safeLog('WARN', `Zamítnuta žádost na knihu "${bookTitle}" od ${userEmail}`);
      refreshData();
    } else {
      alert('Chyba při mazání žádosti: ' + error.message);
    }
    setActionLoading(false);
  };

  const saveBook = async (e) => {
    e.preventDefault();
    if (!title) return alert('Doplňte název knihy.');
    setActionLoading(true);

    const payload = { 
      title, 
      author: author || 'Neznámý', 
      content, 
      fake_likes: parseInt(fakeLikes) || 0,
      is_auto_assigned: isAutoAssigned 
    };

    if (editingBookId) {
      const { error } = await supabase.from('books').update(payload).eq('id', editingBookId);
      if (!error) {
        await safeLog('SUCCESS', `Upravena kniha: ${title} (Auto-přiřazení: ${isAutoAssigned ? 'ANO' : 'NE'})`);
        setEditingBookId(null);
        setTitle(''); setAuthor(''); setContent(''); setFakeLikes(0); setIsAutoAssigned(false);
        refreshData();
      } else {
        alert('Chyba při úpravě: ' + error.message);
      }
    } else {
      if (!content) { setActionLoading(false); return alert('Doplňte text knihy.'); }
      const { error } = await supabase.from('books').insert([payload]);
      if (!error) {
        await safeLog('SUCCESS', `Uložená nová kniha: ${title} (Auto-přiřazení: ${isAutoAssigned ? 'ANO' : 'NE'})`);
        setTitle(''); setAuthor(''); setContent(''); setFakeLikes(0); setIsAutoAssigned(false);
        refreshData();
      } else {
        alert('Chyba při ukládání: ' + error.message);
      }
    }
    setActionLoading(false);
  };

  const startEditBook = async (book) => {
    const { data, error } = await supabase.from('books').select('content, fake_likes, is_auto_assigned').eq('id', book.id).single();
    if (!error && data) {
      setEditingBookId(book.id);
      setTitle(book.title);
      setAuthor(book.author);
      setContent(data.content || '');
      setFakeLikes(data.fake_likes || 0);
      setIsAutoAssigned(data.is_auto_assigned || false);
      setActiveTab('books'); 
    } else {
      alert('Nepodařilo se načíst kompletní text knihy k editaci.');
    }
  };

  const handleSaveFakeXp = async () => {
    if (!activeUser) return;
    let xpNum = parseInt(userFakeXpInput) || 0;
    if (xpNum >= 1000000) xpNum = 1000000;
    
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ fake_xp: xpNum }).eq('id', activeUser.id);

    if (!error) {
      await safeLog('SUCCESS', `Uživateli ${activeUser.email} nastaveno ${xpNum} bonusových XP.`);
      setActiveUser(prev => prev ? { ...prev, fake_xp: xpNum } : null);
      setUserFakeXpInput(xpNum);
      refreshData();
    } else {
      alert('Chyba při ukládání XP: ' + error.message);
    }
    setActionLoading(false);
  };

  const toggleRole = async (uId, currentRole) => {
    let nextRole = 'uživatel';
    if (currentRole === 'uživatel') nextRole = 'nakladatel';
    else if (currentRole === 'nakladatel') nextRole = 'správce';
    else if (currentRole === 'správce') nextRole = 'uživatel';

    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', uId);
    if (!error) {
      await safeLog('WARN', `Změna role uživatele ${uId} na ${nextRole}`);
      refreshData();
    } else {
      alert('Chyba při změně role: ' + error.message);
    }
  };

  const toggleBookAutoAssign = async (bookId, currentStatus) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('books')
      .update({ is_auto_assigned: !currentStatus })
      .eq('id', bookId);

    if (!error) {
      await safeLog('SUCCESS', `Změněn status automatického přidělení pro Knihu ID: ${bookId}`);
      refreshData();
    } else {
      alert('Chyba při změně auto-assign stavu: ' + error.message);
    }
    setActionLoading(false);
  };

  const revokeAllLicenses = async (uId, uEmail) => {
    if (!confirm(`🚨 OPRAVDU CHCETE ODEBRAT VŠECHNY LICENCE uživateli ${uEmail}? Uživatel ztratí přístup ke všem knihám.`)) return;
    setActionLoading(true);
    const { error } = await supabase.from('user_books').delete().eq('user_id', uId);
    if (!error) {
      await safeLog('WARN', `Kompletní revokace licencí pro uživatele: ${uEmail}`);
      alert('Všechny přístupy byly smazány.');
      refreshData();
    } else {
      alert('Chyba při odebírání: ' + error.message);
    }
    setActionLoading(false);
  };

  const assignBookToUser = async () => {
    if (!activeUser || !selectedBookId) return;
    setActionLoading(true);
    
    const { data: existing } = await supabase
      .from('user_books')
      .select('id, status')
      .eq('user_id', activeUser.id)
      .eq('book_id', selectedBookId)
      .single();

    let error;
    if (existing) {
      const { error: updateError } = await supabase.from('user_books').update({ status: 'active' }).eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('user_books').insert([{ user_id: activeUser.id, book_id: selectedBookId, status: 'active' }]);
      error = insertError;
    }
    
    if (error) {
      alert('Chyba při přiřazování licence: ' + error.message);
    } else {
      await safeLog('SUCCESS', `Přiřazena aktivní kniha uživateli ${activeUser.email}`);
      setSelectedBookId('');
      refreshData();
    }
    setActionLoading(false);
  };

  const assignAllBooksToUser = async () => {
    if (!activeUser || books.length === 0) return;
    if (!confirm(`Opravdu chcete uživateli ${activeUser.email} okamžitě odemknout ÚPLNĚ VŠECHNY knihy?`)) return;

    setActionLoading(true);
    try {
      const { data: existingUserBooks, error: fetchError } = await supabase.from('user_books').select('book_id, id, status').eq('user_id', activeUser.id);
      if (fetchError) throw fetchError;
      
      const existingBookIds = existingUserBooks?.map(ub => ub.book_id) || [];
      const requestedEntries = existingUserBooks?.filter(ub => ub.status === 'requested') || [];

      if (requestedEntries.length > 0) {
        await supabase.from('user_books').update({ status: 'active' }).in('id', requestedEntries.map(re => re.id));
      }

      const booksToAssign = books.filter(b => !existingBookIds.includes(b.id));
      if (booksToAssign.length > 0) {
        const insertData = booksToAssign.map(b => ({ user_id: activeUser.id, book_id: b.id, status: 'active' }));
        const { error: insertError } = await supabase.from('user_books').insert(insertData);
        if (insertError) throw insertError;
      }

      await safeLog('SUCCESS', `Hromadně aktivovány VŠECHNY knihy pro: ${activeUser.email}`);
      refreshData();
    } catch (err) {
      alert('Chyba: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const assignSelectedBookToAllUsers = async () => {
    if (!selectedBookId) return alert('Nejprve zvolte knihu z rozevíracího seznamu.');
    const selectedBook = books.find(b => b.id === selectedBookId);
    if (!selectedBook) return;
    if (profiles.length === 0) return alert('V systému nejsou žádní uživatelé.');
    if (!confirm(`🚨 Opravdu chcete knihu "${selectedBook.title}" IHNED aktivovat VŠEM registrovaným čtenářům?`)) return;

    setActionLoading(true);
    try {
      const { data: alreadyHasBook, error: fetchError } = await supabase.from('user_books').select('user_id, id, status').eq('book_id', selectedBookId);
      if (fetchError) throw fetchError;
      
      const userIdsWithBook = alreadyHasBook?.map(ub => ub.user_id) || [];
      const requestedEntries = alreadyHasBook?.filter(ub => ub.status === 'requested') || [];

      if (requestedEntries.length > 0) {
        await supabase.from('user_books').update({ status: 'active' }).in('id', requestedEntries.map(re => re.id));
      }

      const profilesToAssign = profiles.filter(p => !userIdsWithBook.includes(p.id));
      if (profilesToAssign.length > 0) {
        const insertData = profilesToAssign.map(p => ({ user_id: p.id, book_id: selectedBookId, status: 'active' }));
        const { error: insertError } = await supabase.from('user_books').insert(insertData);
        if (insertError) throw insertError;
      }

      await safeLog('SUCCESS', `Kniha "${selectedBook.title}" byla globálně aktivována všem uživatelům.`);
      setSelectedBookId('');
      refreshData();
    } catch (err) {
      alert('Chyba při hromadném sdílení: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const currentSelectedBook = books.find(b => b.id === selectedBookId);

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-200 space-y-6">
      
      {/* HEADER DASHBOARDU */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-solid gap-4" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Shield size={26} className="text-red-500 animate-pulse" /> Core Admin Panel 2026
          </h1>
          <p className="text-xs font-semibold opacity-70" style={{ color: 'var(--text-muted)' }}>
            Komplexní správa licencí, autorských práv, uživatelských klanů a systémových logů.
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button 
            onClick={refreshData} 
            disabled={globalLoading || actionLoading}
            variant="secondary"
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider border rounded-lg hover:opacity-80 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={globalLoading ? "animate-spin" : ""} /> Sync Data
          </Button>
        </div>
      </div>

      {/* STATISTICKÉ UKAZATELE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 py-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Database size={22}/></div>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-60">Katalog Titulů</h4>
            <p className="text-xl font-black">{books.length} Knih v DB</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><Users size={22}/></div>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-60">Komunita</h4>
            <p className="text-xl font-black">{profiles.length} Čtenářů</p>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: pendingRequests.length > 0 ? '#eab308' : 'var(--border-color)' }} className="flex items-center gap-4 py-4 border-2 transition-all">
          <div className={`p-3 rounded-xl ${pendingRequests.length > 0 ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-500/10 opacity-50"}`}><UserCheck size={22}/></div>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-60">Žádosti o licenci</h4>
            <p className={`text-xl font-black ${pendingRequests.length > 0 ? "text-yellow-500 font-extrabold" : ""}`}>{pendingRequests.length} Ke schválení</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500"><Terminal size={22}/></div>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-60">Live Stream Log</h4>
            <p className="text-xl font-black">{logs.length} Záznamů</p>
          </div>
        </Card>
      </div>

      {/* TAB NAVIGACE */}
      <div className="flex border-b font-black text-xs uppercase tracking-wider space-x-1" style={{ borderColor: 'var(--border-color)' }}>
        {[
          { id: 'overview', label: 'Přehled & Žádosti', icon: <FileText size={14} /> },
          { id: 'books', label: 'Knihovna & Editace', icon: <Database size={14} /> },
          { id: 'users', label: 'Uživatelé & Licence', icon: <Users size={14} /> },
          { id: 'logs', label: 'Systémový Syslog', icon: <Terminal size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchBook(''); }}
            style={{ 
              backgroundColor: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
              borderColor: activeTab === tab.id ? 'var(--border-color)' : 'transparent',
              color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)'
            }}
            className={`flex items-center gap-2 px-4 py-3 border-t border-x rounded-t-xl transition-all cursor-pointer -mb-[1px]`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* INDIKÁTOR AKČNÍHO LOADINGU */}
      {actionLoading && (
        <div className="w-full bg-yellow-500 text-black text-center text-xs font-black py-1 rounded animate-pulse uppercase tracking-widest">
          Probíhá zápis do databáze Supabase... Čekejte prosím.
        </div>
      )}

      {/* 1. ZÁLOŽKA: PŘEHLED A ŽÁDOSTI */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-0 overflow-hidden border-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="p-4 font-black text-xs uppercase tracking-wider flex justify-between items-center border-b" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                <span className="flex items-center gap-2">📥 Čekající žádosti o autorizaci licencí</span>
                <span className="bg-yellow-500 text-black font-black px-2 py-0.5 rounded text-[10px]">{pendingRequests.length}</span>
              </div>
              <div className="divide-y max-h-[450px] overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
                {pendingRequests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }} className="text-center py-12 text-xs font-bold opacity-60 italic">
                    Všechny žádosti byly vyřízeny. Systém je stabilní.
                  </p>
                ) : (
                  pendingRequests.map(req => {
                    const userEmail = req.profiles?.email || `Uživatel (ID: ${req.user_id?.substring(0, 5)}...)`;
                    const bookTitle = req.books?.title || `Kniha (ID: ${req.book_id?.substring(0, 5)}...)`;
                    return (
                      <div key={req.id} className="p-4 flex items-center justify-between text-xs font-bold hover:bg-[var(--bg-primary)]/40 transition-colors gap-4" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="truncate flex-1">
                          <p className="truncate text-sm font-black">{userEmail}</p>
                          <p style={{ color: 'var(--bg-primary)' }} className="text-[11px] truncate mt-0.5">
                            Vyžaduje přístup k titulu: <span className="font-black uppercase underline">{bookTitle}</span>
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="success" disabled={actionLoading} onClick={() => approveRequest(req.id, userEmail, bookTitle)} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg">
                            Schválit Přístup
                          </Button>
                          <Button variant="danger" disabled={actionLoading} onClick={() => rejectRequest(req.id, userEmail, bookTitle)} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg">
                            Zamítnout
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-4 space-y-4">
            <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-2">Rychlý přehled stavu</h3>
              <div className="text-xs space-y-2 font-bold opacity-80">
                <div className="flex justify-between"><span>Verze UI Core:</span><span className="font-mono">4.12.0-stable</span></div>
                <div className="flex justify-between"><span>Průměrný věk relací:</span><span>Reálný čas</span></div>
                <div className="flex justify-between"><span>RLS bypass logování:</span><span className="text-emerald-500">Aktivní (safeLog)</span></div>
              </div>
            </Card>
            <div className="text-[11px] font-mono p-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-900 shadow-inner">
              <span className="text-yellow-500 font-bold block mb-1">💡 Tip Admina:</span>
              Kliknutím na tlačítko s ikonou štítu <Shield size={10} className="inline"/> u jakéhokoliv uživatele v záložce Uživatelé můžete okamžitě přepínat jeho oprávnění.
            </div>
          </div>
        </div>
      )}

      {/* 2. ZÁLOŽKA: SPRÁVA KNIH */}
      {activeTab === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card>
              <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                {editingBookId ? <ShieldAlert size={16} className="text-yellow-500"/> : <Plus size={16}/>}
                {editingBookId ? 'Upravit digitální titul' : 'Registrovat nový digitální titul'}
              </h3>
              <form onSubmit={saveBook} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Přesný název knihy..." 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                  className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-40" 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Autor / Vydavatel..." 
                  value={author} 
                  onChange={e => setAuthor(e.target.value)} 
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                  className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-40" 
                />
                
                <div className="space-y-1">
                  <label style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider block pl-1 opacity-70">Umělá Prestiž (Počet Fake Lajků)</label>
                  <input 
                    type="number" 
                    placeholder="Počet lajků..." 
                    value={fakeLikes} 
                    onChange={e => setFakeLikes(Math.max(0, parseInt(e.target.value) || 0))} 
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                    className="w-full p-3 border rounded-lg text-sm font-bold outline-none" 
                  />
                </div>

                <div style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }} className="flex items-center gap-3 p-3 border rounded-xl mb-4 shadow-inner">
                  <input 
                    type="checkbox" 
                    id="is_auto_assigned"
                    checked={isAutoAssigned} 
                    onChange={(e) => setIsAutoAssigned(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="is_auto_assigned" className="text-[10px] font-black uppercase tracking-wide cursor-pointer select-none flex items-center gap-1.5">
                    <Sparkles size={12} className="text-yellow-500 fill-current" /> Automatická kniha (Přiřadit všem zdarma)
                  </label>
                </div>

                <div className="space-y-1">
                  <label style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider block pl-1 opacity-70">Obsah a Text knihy</label>
                  <textarea 
                    placeholder="Sem vložte čistý text knihy, kapitoly nebo markdown..." 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    rows={8} 
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                    className="w-full p-3 border rounded-lg text-sm font-medium outline-none resize-none font-mono placeholder:opacity-40" 
                    required 
                  />
                </div>
                
                <Button type="submit" disabled={actionLoading} className="w-full py-3 uppercase tracking-wider font-black">
                  {editingBookId ? '💾 Aktualizovat data v DB' : '🚀 Vydat knihu do oběhu'}
                </Button>

                {editingBookId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingBookId(null); setTitle(''); setAuthor(''); setContent(''); setFakeLikes(0); setIsAutoAssigned(false); }}
                    style={{ color: 'var(--text-muted)' }}
                    className="w-full py-2 text-xs hover:underline uppercase cursor-pointer bg-transparent border-none font-bold tracking-wide"
                  >
                    Stornovat úpravy
                  </button>
                )}
              </form>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex gap-2 items-center p-2 rounded-xl border border-solid" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <Search size={16} className="opacity-60 ml-2 shadow-sm shrink-0" />
              <input 
                type="text"
                placeholder="Filtrovat knihy podle názvu či autora..."
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
                className="w-full bg-transparent border-none outline-none font-bold text-xs p-1"
              />
              {searchBook && <button onClick={() => setSearchBook('')} className="text-xs px-2 opacity-50 hover:opacity-100 font-bold">X</button>}
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b font-black text-xs uppercase tracking-wider flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                <span>Inventář titulů (Katalog aplikací)</span>
                <span className="opacity-60">{filteredBooks.length} nalezeno</span>
              </div>
              <div className="p-2 max-h-[500px] overflow-y-auto space-y-1.5">
                {filteredBooks.length === 0 ? (
                  <p className="text-xs font-bold text-center py-8 italic opacity-50">Žádné knihy neodpovídají vyhledávacímu dotazu.</p>
                ) : (
                  filteredBooks.map(b => (
                    <div key={b.id} style={{ backgroundColor: 'var(--bg-secondary)' }} className="flex justify-between items-center p-3 rounded-xl text-xs font-bold gap-4 hover:opacity-95 transition-opacity">
                      <span className="truncate flex-1">
                        <span className="text-sm font-black block truncate flex items-center gap-1.5">
                          {b.title}
                          {b.is_auto_assigned && (
                            <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide flex items-center gap-0.5">
                              <Sparkles size={10} className="fill-current" /> Auto
                            </span>
                          )}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }} className="opacity-70 font-medium">Autor: {b.author}</span>
                      </span>
                      
                      <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--bg-secondary)' }} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] shrink-0 font-black shadow-sm">
                        <Heart size={10} className="fill-current" />
                        <span>{b.likesCount}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button 
                          onClick={() => startEditBook(b)}
                          style={{ color: 'var(--bg-primary)' }}
                          className="bg-transparent border-none cursor-pointer hover:scale-110 transition-transform font-bold text-base"
                          title="Editovat parametry a text"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={async () => { 
                            if(confirm(`Smazat knihu "${b.title}" natvrdo z DB? Tato akce smaže i existující uživatelské licence!`)) { 
                              await supabase.from('books').delete().eq('id', b.id); 
                              await safeLog('DANGER', `Smazána kniha z databáze: ${b.title}`);
                              refreshData(); 
                            } 
                          }} 
                          style={{ color: 'var(--text-muted)' }}
                          className="bg-transparent border-none cursor-pointer hover:text-red-500 hover:scale-110 transition-all flex items-center"
                          title="Smazat titul z DB"
                        >
                          <Trash size={14}/>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. ZÁLOŽKA: UŽIVATELÉ A LICENCE */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2 items-center p-2 rounded-xl border border-solid" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <Search size={16} className="opacity-60 ml-2 shrink-0" />
                <input 
                  type="text"
                  placeholder="Hledat uživatele podle e-mailu..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-bold text-xs p-1"
                />
              </div>
              <div className="flex gap-2 items-center p-2 rounded-xl border border-solid shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <Filter size={14} className="opacity-60 ml-1" />
                <select 
                  value={filterRole} 
                  onChange={e => setFilterRole(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold font-sans cursor-pointer"
                >
                  <option value="all">Všechny role</option>
                  <option value="uživatel">Uživatelé</option>
                  <option value="nakladatel">Nakladatelé</option>
                  <option value="správce">Správci</option>
                </select>
              </div>
            </div>

            <Card className="overflow-hidden p-0">
              <div style={{ borderColor: 'var(--border-color)' }} className="p-4 border-b font-black text-xs uppercase tracking-wider">
                Databáze čtenářských účtů a oprávnění
              </div>
              <div className="max-h-[450px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} className="font-black uppercase border-b opacity-80 sticky top-0 z-10">
                      <th className="p-3">Uživatel</th>
                      <th className="p-3">Role systému</th>
                      <th className="p-3 text-right">Řízení</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                    {filteredProfiles.map(p => (
                      <tr key={p.id} style={{ borderColor: 'var(--border-color)' }} className={`hover:bg-[var(--bg-secondary)] transition-colors font-bold ${activeUser?.id === p.id ? "bg-[var(--bg-secondary)] ring-1 ring-inset ring-blue-500/30" : ""}`}>
                        <td className="p-3 truncate max-w-[200px]">
                          <div className="truncate text-sm font-black">{p.email}</div>
                          {p.fake_xp > 0 && (
                            <div className="text-[10px] font-black flex items-center gap-1 mt-0.5" style={{ color: 'var(--bg-primary)' }}>
                              <Award size={10}/> {p.fake_xp >= 1000000 ? "Level 100 (Max)" : `+${p.fake_xp} Admin XP`}
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-middle">
                          <span 
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }} 
                            className={`text-[9px] px-2.5 py-0.5 rounded-full uppercase border border-solid font-black shadow-sm tracking-wider`}
                          >
                            {p.role || 'uživatel'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex justify-end items-center gap-2">
                          <Button 
                            variant={activeUser?.id === p.id ? "success" : "secondary"} 
                            onClick={() => { setActiveUser(p); setUserFakeXpInput(p.fake_xp || 0); }} 
                            className="text-[10px] px-2.5 py-1 uppercase flex items-center gap-1 font-black"
                          >
                            <Plus size={10}/> Vybrat
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => toggleRole(p.id, p.role)} 
                            className="p-1.5 border border-solid rounded-lg cursor-pointer" 
                            title="Cyklovat roli (Uživatel -> Nakladatel -> Správce)"
                          >
                            <Shield size={13}/>
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => revokeAllLicenses(p.id, p.email)} 
                            className="p-1.5 text-red-400 border border-solid border-red-500/20 rounded-lg hover:bg-red-500/10 cursor-pointer" 
                            title="Kompletní revokace (Smazat všechny licence uživatele)"
                          >
                            <XCircle size={13}/>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* DISTRIBUČNÍ PANEL VYBRANÉHO UŽIVATELE */}
          <div className="lg:col-span-5 space-y-4">
            <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="border-2">
              <h3 style={{ color: 'var(--bg-primary)' }} className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck size={18}/> Správce distribuce a oprávnění
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider block opacity-70">1. Vyberte knihu z registru</label>
                  
                  {/* Vyhledávací a filtrovací pole pro rychlé prohledávání registru knih */}
                  <div className="flex gap-2 items-center p-2 mb-1.5 rounded-lg border border-solid bg-[var(--bg-primary)]" style={{ borderColor: 'var(--border-color)' }}>
                    <Search size={14} className="opacity-50 ml-1 shrink-0" />
                    <input 
                      type="text"
                      placeholder="Rychlý filtr knih (název / autor)..."
                      value={searchBook}
                      onChange={e => setSearchBook(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold p-0.5"
                    />
                  </div>

                  <select 
                    value={selectedBookId} 
                    onChange={e => setSelectedBookId(e.target.value)} 
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                    className="w-full p-3 border rounded-lg font-bold text-xs outline-none cursor-pointer shadow-sm"
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)' }}>
                      -- ({filteredBooks.length}) Titulů odpovídá filtru --
                    </option>
                    {filteredBooks.map(b => (
                      <option key={b.id} value={b.id} style={{ background: 'var(--bg-secondary)' }}>
                        {b.title} ({b.author})
                      </option>
                    ))}
                  </select>
                </div>

                {/* MODUL PRO UKÁZKU A PŘEPÍNÁNÍ AUTO-ASSIGNU VYBRANÉ KNIHY */}
                {selectedBookId && currentSelectedBook && (
                  <div style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} className="p-3 rounded-xl border border-solid flex items-center justify-between gap-4 animate-in fade-in duration-150">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles size={11} className="text-yellow-500 fill-current"/> Auto-Assign globální příznak
                      </span>
                      <span className="text-[9px] opacity-50 block font-bold">Přidělí se automaticky každému čtenáři</span>
                    </div>
                    <Button
                      variant={currentSelectedBook.is_auto_assigned ? "success" : "secondary"}
                      onClick={() => toggleBookAutoAssign(currentSelectedBook.id, currentSelectedBook.is_auto_assigned)}
                      disabled={actionLoading}
                      className="text-[10px] px-3 py-1.5 font-black uppercase tracking-wider shrink-0"
                    >
                      {currentSelectedBook.is_auto_assigned ? "✨ Aktivní" : "Vypnuto"}
                    </Button>
                  </div>
                )}

                <Button 
                  onClick={assignSelectedBookToAllUsers}
                  variant="purple"
                  disabled={actionLoading || !selectedBookId}
                  className="w-full text-xs py-2.5 uppercase tracking-wider font-black shadow-md flex items-center justify-center gap-1"
                >
                  📢 Globální odemčení této knihy VŠEM čtenářům
                </Button>
                
                {activeUser ? (
                  <div style={{ borderColor: 'var(--border-color)' }} className="mt-4 pt-4 border-t border-solid space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs font-bold text-blue-400 truncate m-0">Target: <span className="font-black text-sm">{activeUser.email}</span></p>
                    </div>
                    
                    <div style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} className="p-3 rounded-xl space-y-2 border border-solid">
                      <label style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                        Modifikátor bonusových XP (Úroveň Profilu)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={userFakeXpInput} 
                          onChange={e => setUserFakeXpInput(parseInt(e.target.value) || 0)}
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                          className="w-full p-2 border rounded-lg text-xs font-bold outline-none font-mono" 
                          placeholder="Množství XP..."
                        />
                        <button 
                          onClick={handleSaveFakeXp}
                          disabled={actionLoading}
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }}
                          className="px-3 font-black text-[10px] uppercase rounded-lg border border-solid cursor-pointer hover:opacity-80 transition-opacity shrink-0 active:scale-95 duration-100"
                        >
                          Uložit XP
                        </button>
                      </div>
                      <span className="text-[9px] opacity-40 font-bold block">* Zadejte hodnotu ≥ 1 000 000 pro okamžitý skok na Level 100.</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={assignBookToUser} 
                        disabled={actionLoading || !selectedBookId}
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-body)' }}
                        className="flex-1 text-xs py-2.5 uppercase font-black rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        Aktivovat zvolenou knihu
                      </button>
                      <Button variant="secondary" onClick={() => setActiveUser(null)} className="text-xs py-2.5 font-bold">Zrušit výběr</Button>
                    </div>
                    
                    <Button 
                      onClick={assignAllBooksToUser}
                      disabled={actionLoading}
                      variant="success"
                      className="w-full text-xs py-2.5 uppercase tracking-wider font-black shadow-sm"
                    >
                      ✨ Full Unlock: Aktivovat mu VŠECHNY knihy z databáze
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs font-bold opacity-50 italic border border-dashed rounded-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
                    Pro individuální přidělení licencí nebo zápis XP vyberte uživatele ze sousední tabulky.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 4. ZÁLOŽKA: SYSTÉMOVÉ LOGY (FULL CORE SYSLOG) */}
      {activeTab === 'logs' && (
        <Card className="bg-slate-950 text-emerald-400 font-mono p-5 border border-slate-900 shadow-2xl rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-black uppercase tracking-widest pb-3 border-b border-solid border-slate-900 gap-2">
            <span className="flex items-center gap-1.5 text-slate-400"><Terminal size={14} /> Postgres Live Core Syslog</span>
            <div className="flex gap-2 items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto">
              <span className="text-slate-500 pl-1 text-[10px]">Filtr eventu:</span>
              <select 
                value={filterLogType} 
                onChange={e => setFilterLogType(e.target.value)}
                className="bg-transparent border-none text-emerald-400 font-mono outline-none text-xs cursor-pointer"
              >
                <option value="all">VŠECHNY LOGY</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARN">WARN</option>
                <option value="DANGER">DANGER</option>
              </select>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {filteredLogs.length === 0 ? (
              <p className="text-slate-500 italic text-center py-12">Žádné systémové logy v zadané konfiguraci nebyly zachyceny.</p>
            ) : (
              filteredLogs.map((log, index) => {
                let badgeColor = "text-emerald-400";
                if (log.log_type === 'WARN') badgeColor = "text-yellow-400";
                if (log.log_type === 'DANGER' || log.log_type === 'ERROR') badgeColor = "text-red-500 font-extrabold";
                
                return (
                  <div key={log.id || index} className="py-1.5 border-b border-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-900/30 px-1 rounded transition-colors">
                    <span className="break-all">
                      <span className={`inline-block w-20 uppercase font-black ${badgeColor}`}>[{log.log_type || 'INFO'}]</span>
                      <span className="text-slate-200">{log.message}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-sans sm:font-mono">
                      {log.created_at ? new Date(log.created_at).toLocaleString('cs-CZ') : 'Nyní'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-900 text-right">
            Kanál Real-time Event Stream přes WebSockets [Aktivní]
          </div>
        </Card>
      )}

    </div>
  );
};

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('jomarid-books-theme') || 'saas');

  useEffect(() => {
    const vars = THEMES[currentTheme] || THEMES.saas;
    const b = document.body;
    Object.keys(vars).forEach(k => b.style.setProperty(k, vars[k]));
  }, [currentTheme]);

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ currentTheme, changeTheme: (t) => { setCurrentTheme(t); localStorage.setItem('jomarid-books-theme', t); } }}>
        <Router>
          <div style={{ background: 'var(--bg-body)', color: 'var(--text-body)' }} className="min-h-screen flex flex-col font-sans antialiased transition-all duration-200">
            <Navbar onOpenSearch={() => setIsSearchOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)} />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Chráněné uživatelské sekce */}
                <Route path="/app" element={<ProtectedUserRoute><UserLibrary /></ProtectedUserRoute>} />
                <Route path="/read/:id" element={<ProtectedUserRoute><ReaderPage /></ProtectedUserRoute>} />
                <Route path="/publisher" element={<ProtectedUserRoute><PublisherDashboard /></ProtectedUserRoute>} />
                
                {/* 🔥 Statistiky jsou nyní bezpečně pod uživatelskou ochranou */}
                <Route path="/stats" element={<ProtectedUserRoute><UserStats /></ProtectedUserRoute>} />
                
                {/* Administrace */}
                <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              </Routes>
            </main>
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          </div>
        </Router>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}
