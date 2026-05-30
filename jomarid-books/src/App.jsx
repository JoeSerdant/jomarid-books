import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Book, ChevronRight, Loader2, LogOut, Shield, Heart, BookOpen } from 'lucide-react';
import { supabase } from './lib/supabase';

// bezpečný getter ikon
const getIcon = (name) => Icons[name] || Icons.Book || Icons.HelpCircle;

// ICON MAP
const Lock = getIcon('Lock');
const Plus = getIcon('Plus');
const ShieldCheck = getIcon('ShieldCheck');
const Trash2 = getIcon('Trash2');
const Library = getIcon('Library');
const Search = getIcon('Search');
const X = getIcon('X');
const Settings = getIcon('Settings');
const Terminal = getIcon('Terminal');
const Database = getIcon('Database');
const Users = getIcon('Users');
const AlertTriangle = getIcon('AlertTriangle');
const UserCheck = getIcon('UserCheck');
const PhoneIcon = getIcon('Phone');
const ChevronDown = getIcon('ChevronDown');
const Clock = getIcon('Clock');
const Trash = getIcon('Trash');

const Sparkles = getIcon('Sparkles');
const HelpCircle = getIcon('HelpCircle');
const Zap = getIcon('Zap');
const Check = getIcon('Check');
const UserPlus = getIcon('UserPlus');
const BarChart2 = getIcon('BarChart2');
const ChartBar = getIcon('ChartBar');
const Award = getIcon('Award');
const Flame = getIcon('Flame');
const Calendar = getIcon('Calendar');
const CheckCircle = getIcon('CheckCircle');
const TrendingUp = getIcon('TrendingUp');
const Trophy = getIcon('Trophy');

// 🟡 problémová ikona – může chybět podle verze lucide-react
const BookOpenIcon = getIcon('BookOpen');
const Compass = getIcon('Compass');
const Footprints = getIcon('Footprints') || getIcon('FootprintsIcon') || getIcon('Map');
const Scroll = getIcon('Scroll');
const BookMarked = getIcon('BookMarked');
const Feather = getIcon('Feather');
const Crown = getIcon('Crown');
const InfinityIcon = getIcon('Infinity');
const Gem = getIcon('Gem');
const Star = getIcon('Star');
const Gauge = getIcon('Gauge');
const ZapOff = getIcon('ZapOff');
const HeartIcon = getIcon('Heart');

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
  const [newGoalInput, setNewGoalInput] = useState(5);
  
  const [stats, setStats] = useState({
    streak: 0,
    monthlyRead: 0,
    monthlyGoal: 5,
    totalRead: 0,
    weeklyActivity: [],
    xp: 0,
    level: 1,
    levelName: "Začínající čtenář 🌱",
    levelBadgeClass: "",
    levelBoxClass: "",
    xpNeededForNext: 100,
    daysRemainingInMonth: 0,
    currentMonthName: ""
  });

  // Přizpůsobení herních vizuálů tak, aby ladily s jakýmkoliv vybraným motivem (SaaS, Dark i Dark Oak)
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
    let currentLevel = 1;
    while (totalXp >= getRequiredXpForLevel(currentLevel + 1)) {
      currentLevel++;
    }
    const xpForCurrentLevelStart = getRequiredXpForLevel(currentLevel);
    const xpForNextLevelStart = getRequiredXpForLevel(currentLevel + 1);
    const xpInCurrentLevel = totalXp - xpForCurrentLevelStart;
    const xpNeededForNext = xpForNextLevelStart - xpForCurrentLevelStart;

    return { level: currentLevel, xpInCurrentLevel, xpNeededForNext };
  };

  useEffect(() => {
    const fetchFullStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const savedGoal = localStorage.getItem(`monthly_goal_${user.id}`);
        const currentGoal = savedGoal ? parseInt(savedGoal, 10) : 5;
        setNewGoalInput(currentGoal);

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
          .select('fake_xp')
          .eq('id', user.id)
          .single();

        const bonusXp = profileData?.fake_xp ? parseInt(profileData.fake_xp, 10) : 0;
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

        const daysOfWeek = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('sv');
          last7Days.push({
            dayLabel: daysOfWeek[d.getDay()],
            isActive: activeDates.includes(dateStr),
            isToday: i === 0
          });
        }

        const baseXp = (totalRead * 100) + (streak * 25);
        const totalXpCalculated = baseXp + bonusXp;

        const lvlSpecs = calculateLevelAndProgress(totalXpCalculated);
        const visuals = getLevelVisuals(lvlSpecs.level);

        setStats({
          streak,
          monthlyRead,
          monthlyGoal: currentGoal,
          totalRead,
          weeklyActivity: last7Days,
          xp: lvlSpecs.xpInCurrentLevel,
          level: lvlSpecs.level,
          levelName: visuals.name,
          levelBadgeClass: visuals.badge,
          levelBoxClass: visuals.box,
          xpNeededForNext: lvlSpecs.xpNeededForNext,
          daysRemainingInMonth,
          currentMonthName
        });

      } catch (err) {
        console.error("Chyba při sestavování statistik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullStats();
  }, [user]);

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
        <p style={{ color: 'var(--text-muted)' }} className="text-sm font-bold opacity-60 animate-pulse">Sestavuji tvůj kompletní přehled...</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((stats.monthlyRead / stats.monthlyGoal) * 100));
  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpNeededForNext) * 100));

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-300">
      
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
        
        {/* 1. KARTA: STREAK */}
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
          <p style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }} className="text-xs font-medium mt-4 pt-3 border-t text-left">
            {stats.streak > 0 ? "Skvělé! Dnes máš splněno, série pokračuje." : "Dnes jsi ještě nečetl. Otevři knihu a zachraň plamínek!"}
          </p>
        </div>

        {/* 2. KARTA: MĚSÍČNÍ VÝZVA */}
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
                <span>
                  {stats.daysRemainingInMonth === 0 ? "Dnes je poslední den!" : `Zbývá ${stats.daysRemainingInMonth} dní`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderColor: 'var(--border-color)' }} className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold">
            {isEditingGoal ? (
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="number" 
                  min="1" 
                  value={newGoalInput} 
                  onChange={(e) => setNewGoalInput(e.target.value)} 
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }}
                  className="w-16 px-2 py-1 border rounded-md outline-none text-sm font-bold text-center"
                />
                <button style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} onClick={handleSaveGoal} className="px-2 py-1 rounded font-black uppercase text-[10px] cursor-pointer border-none shadow-sm">Uložit</button>
                <button style={{ color: 'var(--text-muted)' }} onClick={() => setIsEditingGoal(false)} className="px-1 py-1 font-bold cursor-pointer bg-transparent border-none">Zrušit</button>
              </div>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)' }} className="opacity-70">Chceš změnit svůj cíl?</span>
                <button 
                  onClick={() => setIsEditingGoal(true)} 
                  style={{ color: 'var(--text-badge)' }}
                  className="font-black uppercase tracking-wider p-0 bg-transparent border-none cursor-pointer text-[10px]"
                >
                  Nastavit cíl
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. KARTA: CELKEM PŘEČTENO */}
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
            <div 
              key={idx} 
              style={{ 
                borderColor: day.isToday ? 'var(--bg-primary)' : 'transparent',
                backgroundColor: day.isToday ? 'var(--bg-badge)' : 'transparent' 
              }}
              className="p-3 rounded-xl flex flex-col items-center gap-2 border"
            >
              <span 
                style={{ color: day.isToday ? 'var(--text-badge)' : 'var(--text-muted)' }} 
                className={`text-xs font-black uppercase ${!day.isToday && 'opacity-60'}`}
              >
                {day.dayLabel}
              </span>
              <div 
                style={{
                  backgroundColor: day.isActive ? 'rgba(245, 158, 11, 1)' : 'rgba(0,0,0,0.05)',
                  color: day.isActive ? '#ffffff' : 'var(--text-muted)'
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                {day.isActive ? (
                  <Flame size={16} className="fill-white text-white" />
                ) : (
                  <div style={{ backgroundColor: 'currentColor' }} className="w-1.5 h-1.5 rounded-full opacity-40"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= NÝNÍ PŘIDANÁ SEKCE: MOJE ÚSPĚCHY ================= */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm mb-8">
        <h3 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider mb-6 text-left flex items-center gap-1.5">
          <Award size={16} style={{ color: 'var(--bg-primary)' }} /> Sběratelské Odznáčky Knihovny
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BOOK_BADGES.map((badge) => {
            // Každý odznáček si zkontroluje aktuální vypočítaný stav
            const isUnlocked = badge.condition(stats);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={badge.id}
                style={{
                  backgroundColor: isUnlocked ? 'var(--bg-badge)' : 'rgba(0, 0, 0, 0.1)',
                  borderColor: isUnlocked ? 'var(--border-color)' : 'transparent',
                  opacity: isUnlocked ? 1 : 0.4
                }}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 shadow-inner ${
                  isUnlocked ? 'scale-100' : 'scale-95'
                }`}
              >
                <div
                  style={{
                    backgroundColor: isUnlocked ? 'var(--bg-primary)' : 'rgba(255,255,255,0.05)',
                    color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md shrink-0 transition-transform duration-500"
                >
                  <BadgeIcon size={22} className={isUnlocked ? "animate-pulse" : ""} />
                </div>
                
                <div className="text-left flex flex-col">
                  <span
                    style={{ color: isUnlocked ? 'var(--text-badge)' : 'var(--text-muted)' }}
                    className="font-black text-sm tracking-wide uppercase"
                  >
                    {badge.title}
                  </span>
                  <span
                    style={{ color: 'var(--text-body)' }}
                    className="text-xs opacity-70 mt-0.5"
                  >
                    {badge.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* =================================================================== */}

      {/* TLAČÍTKO ZPĚT */}
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

      {/* Plynulá vysunovací animace bez trhání */}
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

  // 🔥 REÁLNÉ TITULY S DYNAMICKÝMI AKCENTY PODLE MOTIVU
  const featuredBooks = [
    { 
      title: "Jomirad 1. část", 
      category: "Superhrdinská sága", 
      author: "Jomarid"
    },
    { 
      title: "Šepot starých knihoven 1. část: Vězení pro příběhy", 
      category: "Mysteriózní fantasy", 
      author: "Alexandr Heryán"
    },
    { 
      title: "Jomirad 2. část", 
      category: "Superhrdinská sága", 
      author: "Jomarid"
    },
  ];

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center animate-in fade-in duration-300">
      
      {/* 1. HERO SEKCE */}
      <section className="mb-20">
        {/* Horní badge */}
        <div 
          style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider mb-6"
        >
          <Library size={14} /> Výběrová digitální edice
        </div>
        
        {/* Hlavní nadpis */}
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 leading-none">
          Exkluzivní literární díla <br/>
          <span style={{ color: 'var(--bg-primary)' }}>na dosah ruky</span>
        </h1>
        
        {/* Popisek */}
        <p style={{ color: 'var(--text-muted)' }} className="text-base md:text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          Vítejte v privátním fondu Jomarid Books. Sledujte osudy superhrdiny Jomirada a odhalte tajemství ukrytá v sérii Šepot starých knihoven. Nabíziamo prémiové čtení přes dedikované Cloud-to-Screen rozhraní.
        </p>

        {/* Hlavní akční tlačítka */}
        <div className="max-w-md mx-auto space-y-4 mb-16">
          <button 
            onClick={() => navigate('/app')} 
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            className="w-full py-4 uppercase font-black tracking-wider text-sm border-none rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen size={16} /> Odemknout digitální čítárnu
          </button>
          
          <p style={{ color: 'var(--text-muted)' }} className="text-[11px] font-bold uppercase opacity-50 tracking-wider">
            Nemáte účet? Zřídíte si ho okamžitě a zdarma přímo u vstupu.
          </p>
        </div>

        {/* SEKCE: NAŠE TITULY + KARTY */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-6 text-center">— NAŠE TITULY —</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {featuredBooks.map((book, idx) => (
              <div 
                key={idx}
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                className="group relative h-48 rounded-xl p-4 border flex flex-col justify-between text-left shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate('/app')}
              >
                {/* Podbarvení pozadí při hoveru pomocí sekundární barvy motivu */}
                <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                
                <div className="relative z-10 flex justify-between items-start w-full">
                  <span style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded">
                    {book.category}
                  </span>
                  <Book size={14} style={{ color: 'var(--text-muted)' }} className="opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                </div>

                <div className="relative z-10">
                  <span style={{ color: 'var(--text-muted)' }} className="text-[9px] uppercase font-bold tracking-wider opacity-70 block mb-0.5">
                    {book.author}
                  </span>
                  <h4 style={{ color: 'var(--text-body)' }} className="font-black uppercase text-sm leading-tight mb-1 tracking-tight line-clamp-2">{book.title}</h4>
                  <span style={{ color: 'var(--bg-primary)' }} className="text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Otevřít knihu <ChevronRight size={10} />
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
            className="p-4 rounded-xl border transition-all duration-300 hover:scale-[1.03] shadow-sm"
          >
            <p style={{ color: 'var(--text-body)' }} className="text-3xl font-black leading-none mb-1">{stat.value}</p>
            <p style={{ color: 'var(--text-muted)' }} className="text-[9px] font-black uppercase tracking-wider opacity-60">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* ==========================================
          🔥 NOVÁ SEKCE: GAMEFIKACE A PROGRESE
         ========================================== */}
      <section className="mb-24">
        <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-3 text-center">— ČTENÍ JAKO HRA —</h2>
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-10 max-w-xl mx-auto leading-tight">
          Získávejte úrovně, plňte výzvy a odemykejte vzácné trofeje
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {/* Prvek 1: Úrovně a XP */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm relative overflow-hidden">
            <div style={{ color: 'var(--bg-primary)' }} className="mb-4"><Award size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>Čtenářský Level</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Každá přečtená stránka vám generuje zkušenostní body (XP). Postupujte od Zapáleného začátečníka až na bájnou úroveň 100 – Avatar vědění.
            </p>
          </div>

          {/* Prvek 2: Daily Streak */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm relative overflow-hidden">
            <div className="mb-4 text-orange-500"><Flame size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>Denní plamínky</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Udržte si zvyk pravidelného čtení. Čtěte každý den, navyšujte svůj denní Streak a nenechte svůj literární oheň vyhasnout.
            </p>
          </div>

          {/* Prvek 3: Obří sbírka odznaků */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm relative overflow-hidden">
            <div className="mb-4 text-yellow-500"><Trophy size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>80+ Achievementů</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Odhalte skryté milníky rozdělené do 6 unikátních kategorií. Systém automaticky sleduje vaše statistiky a odměňuje vaše čtenářské úspěchy.
            </p>
          </div>

          {/* Prvek 4: Měsíční milníky */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border shadow-sm relative overflow-hidden">
            <div className="mb-4 text-cyan-500"><Target size={24} /></div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-body)' }}>Měsíční výzvy</h4>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Stanovte si na začátku měsíce osobní knižní cíl. Zvládnete splnit plán na 100 %, nebo ho překonáte a získáte odznak Dvojitého zásahu?
            </p>
          </div>
        </div>
      </section>

      {/* 3. VLASTNOSTI / VÝHODY (Features) */}
      <section className="mb-24">
        <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-10 text-center">— PROČ ČÍST S JOMARID BOOKS —</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Feature 1 */}
          <div style={{ borderColor: 'var(--border-color)' }} className="space-y-3 p-5 rounded-xl border border-transparent hover:bg-neutral-500/5 transition-all duration-300">
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 style={{ color: 'var(--text-body)' }} className="text-sm font-black uppercase tracking-wider">Bleskové Cloud-to-Screen</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Žádné stahování těžkých PDF nebo EPUB souborů. Naše technologie renderuje texty přímo ze šifrovaného cloudu do vašeho prohlížeče v reálném čase.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ borderColor: 'var(--border-color)' }} className="space-y-3 p-5 rounded-xl border border-transparent hover:bg-neutral-500/5 transition-all duration-300">
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="w-10 h-10 rounded-lg flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ color: 'var(--text-body)' }} className="text-sm font-black uppercase tracking-wider">Privátní kurátorovaný fond</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Nejsme masová knihovna plná balastu. Zaměřujeme se výhradně na prémiové edice, odborné texty a exkluzivní překlady, které jinde nenajdete.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ borderColor: 'var(--border-color)' }} className="space-y-3 p-5 rounded-xl border border-transparent hover:bg-neutral-500/5 transition-all duration-300">
            <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h3 style={{ color: 'var(--text-body)' }} className="text-sm font-black uppercase tracking-wider">Čisté prostředí bez reklam</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Vaše soustředění je pro nás prioritou. Rozhraní čítárny je absolutně minimalistické, bez rušivých prvků, sociálních sítí či otravných bannerů.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ČASTO KLADENÉ OTÁZKY (FAQ) */}
      <section className="max-w-2xl mx-auto mb-24">
        <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-widest opacity-50 mb-8 text-center">— ČASTO KLADENÉ OTÁZKY —</h2>
        
        <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="p-5 rounded-xl border">
          <div className="opacity-95">
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

      {/* 5. FINÁLNÍ CTA SEKCE */}
      <section style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }} className="rounded-2xl p-8 md:p-12 mb-16 text-center shadow-xl relative overflow-hidden">
        <div style={{ backgroundColor: 'var(--bg-primary)' }} className="absolute -right-10 -top-10 w-40 h-40 opacity-10 rounded-full blur-2xl"></div>
        
        <h3 style={{ color: 'var(--bg-card)' }} className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">Začněte číst ještě dnes</h3>
        <p style={{ color: 'var(--bg-body)' }} className="text-xs md:text-sm font-medium max-w-lg mx-auto mb-6 opacity-80">
          Vstupte do zabezpečeného literárního ekosystému a objevte digitální komfort nové generace doprovázený herními odměnami.
        </p>
        <div className="max-w-xs mx-auto relative z-10">
          <button 
            onClick={() => navigate('/app')}
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            className="w-full py-3 border-none font-black uppercase text-xs tracking-wider rounded-lg shadow cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] transition-all"
          >
            Spustit aplikaci
          </button>
        </div>
      </section>

      {/* 6. MODERNÍ KOMPLETNÍ PATIČKA (Footer) */}
      <footer style={{ borderColor: 'var(--border-color)' }} className="mt-20 pt-8 border-t opacity-70 flex flex-col sm:flex-row items-center justify-between text-[11px] font-black uppercase tracking-wider gap-4">
        <div style={{ color: 'var(--text-muted)' }} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
          <span>© {new Date().getFullYear()} Jomarid Books Ltd.</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="font-medium normal-case opacity-70">Verze platformy v2.5 (Stable Core + Gamification)</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="mailto:wwsigmamango@gmail.com" style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="flex items-center gap-2 no-underline hover:opacity-80 px-3 py-1.5 rounded-md transition-colors">
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

  const loadLibraryData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 🔥 STREAK: Zapíšeme dnešní aktivitu uživatele do databáze
      const todayStr = new Date().toLocaleDateString('sv');
      await supabase
        .from('user_daily_activity')
        .upsert(
          { user_id: user.id, activity_date: todayStr }, 
          { onConflict: 'user_id,activity_date' }
        );

      // 1. Načteme VŠECHNY knihy samostatně
      const { data: allBooks, error: booksError } = await supabase
        .from('books')
        .select('*');

      if (booksError) throw booksError;

      // 2. Načteme záznamy user_books
      const { data: myUserBooks, error: userBooksError } = await supabase
        .from('user_books')
        .select('book_id, is_read, status, updated_at')
        .eq('user_id', user.id);

      if (userBooksError) throw userBooksError;

      // 3. Načteme ID knih, které uživatel lajknul
      const { data: likesData, error: likesError } = await supabase
        .from('book_likes')
        .select('book_id')
        .eq('user_id', user.id);

      if (likesError) throw likesError;
      if (likesData) setLikedBookIds(likesData.map(l => l.book_id));

      // 4. Načteme celkové počty lajků
      const { data: allLikes, error: allLikesError } = await supabase
        .from('book_likes')
        .select('book_id');

      if (allLikesError) throw allLikesError;

      // 5. Sloučení dat v JavaScriptu
      const processedBooks = (allBooks || []).map(b => {
        const userBookEntry = myUserBooks?.find(ub => ub.book_id === b.id);
        const totalLikesCount = allLikes?.filter(l => l.book_id === b.id).length || 0;

        return {
          id: b.id,
          title: b.title,
          author: b.author,
          likesCount: totalLikesCount + (b.fake_likes || 0),
          hasAccess: userBookEntry?.status === 'active',
          isPending: userBookEntry?.status === 'requested',
          isRead: userBookEntry?.is_read || false,
          lastOpened: userBookEntry?.updated_at ? new Date(userBookEntry.updated_at).getTime() : 0
        };
      });

      // Kombinované řazení
      processedBooks.sort((a, b) => {
        if (a.hasAccess && b.hasAccess) {
          if (b.lastOpened !== a.lastOpened) {
            return b.lastOpened - a.lastOpened;
          }
          if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1;
          }
        }
        if (a.hasAccess !== b.hasAccess) return b.hasAccess - a.hasAccess;
        if (a.isPending !== b.isPending) return b.isPending - a.isPending;
        return 0;
      });
      
      setBooks(processedBooks);
    } catch (error) {
      console.error("Chyba při načítání knihovny:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, [user]);

  const handleRequestLicense = async (bookId) => {
    if (!user) return;
    setSubmittingId(bookId);

    try {
      const { error } = await supabase
        .from('user_books')
        .insert([
          { 
            user_id: user.id, 
            book_id: bookId, 
            status: 'requested', 
            is_read: false 
          }
        ]);

      if (error) throw error;

      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isPending: true } : b));
    } catch (error) {
      console.error("Chyba při odesílání žádosti:", error);
      alert("Žádost se nepodařilo odeslat. Zkuste to prosím znovu.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ color: 'var(--text-body)' }} className="text-center py-20">
        <Loader2 style={{ color: 'var(--bg-primary)' }} className="animate-spin mx-auto mb-2" />
        <p className="text-sm font-medium opacity-60">Načítám knihovnu...</p>
      </div>
    );
  }

  const userRole = user?.role || user?.user_metadata?.role;

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-300">
      {/* Horní lišta s navigací */}
      <div style={{ borderColor: 'var(--border-color)' }} className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Knihovna a katalog</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {userRole === 'admin' && (
            <Link to="/admin" style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }} className="text-xs px-3 py-2 rounded font-bold uppercase tracking-wider no-underline hover:opacity-90 transition-opacity">
              Admin Panel
            </Link>
          )}
          {userRole === 'nakladatel' && (
            <Link to="/nakladatel" style={{ backgroundColor: 'var(--text-body)', color: 'var(--bg-body)' }} className="text-xs px-3 py-2 rounded font-bold uppercase tracking-wider no-underline hover:opacity-90 transition-opacity">
              Nakladatel
            </Link>
          )}
          <Button variant="danger" onClick={logout} className="text-xs flex items-center gap-1">
            <LogOut size={14}/> Odhlásit
          </Button>
        </div>
      </div>

      {/* Mřížka knih */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {books.length === 0 ? (
          <p className="col-span-full text-center py-10 opacity-60">Žádné knihy k zobrazení. Zkontroluj databázi.</p>
        ) : (
          books.map(b => {
            const isUserLiked = likedBookIds.includes(b.id);

            return b.hasAccess ? (
              /* STAV 1: Kniha je přístupná */
              <Link to={`/read/${b.id}`} key={b.id} className="no-underline text-current">
                <Card style={{ backgroundColor: b.isRead ? 'var(--bg-secondary)' : 'var(--bg-card)', borderColor: 'var(--border-color)' }} className={`hover:scale-[1.02] cursor-pointer h-full flex flex-col justify-between transition-all ${b.isRead ? 'opacity-60' : ''}`}>
                  <div>
                    <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="aspect-[3/4] rounded-lg mb-4 flex items-center justify-center relative">
                      <Book size={32} style={{ color: 'var(--text-muted)' }} className="opacity-30" />
                      
                      {/* UKAZATEL LAJKŮ */}
                      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }} className="absolute top-2 right-2 border px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold">
                        <Heart size={10} className={isUserLiked ? "fill-red-500 text-red-500" : "opacity-40"} />
                        <span>{b.likesCount}</span>
                      </div>
                    </div>
                    <h4 className="font-black uppercase text-sm line-clamp-2">{b.title}</h4>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-medium mt-1 opacity-80">{b.author}</p>
                    {b.isRead && (
                      <span style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="text-[9px] px-2 py-0.5 rounded font-black uppercase mt-2 inline-block">
                        ✓ Přečteno
                      </span>
                    )}
                  </div>
                  <div style={{ borderColor: 'var(--border-color)', color: b.isRead ? 'var(--text-muted)' : 'var(--bg-primary)' }} className="mt-4 pt-3 border-t text-[10px] font-black uppercase flex items-center justify-between">
                    <span>{b.isRead ? "Znovu otevřít" : "Otevřít knihu"}</span>
                    <ChevronRight size={12}/>
                  </div>
                </Card>
              </Link>
            ) : b.isPending ? (
              /* STAV 2: Čeká se na schválení */
              <Card key={b.id} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="opacity-80 flex flex-col justify-between">
                <div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="aspect-[3/4] rounded-lg mb-4 flex items-center justify-center relative">
                    <Clock size={32} style={{ color: 'var(--bg-primary)' }} className="opacity-40" />
                    
                    {/* UKAZATEL LAJKŮ */}
                    <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }} className="absolute top-2 right-2 border px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold">
                      <Heart size={10} className={isUserLiked ? "fill-red-500 text-red-500" : "opacity-40"} />
                      <span>{b.likesCount}</span>
                    </div>
                  </div>
                  <h4 className="font-black uppercase text-sm line-clamp-2">{b.title}</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-medium mt-1 opacity-80">{b.author}</p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }} className="mt-4 w-full py-2 text-center rounded font-black text-[10px] uppercase flex items-center justify-center gap-1 border border-transparent">
                  <Clock size={12} className="animate-pulse" /> Čeká na schválení
                </div>
              </Card>
            ) : (
              /* STAV 3: Zamknuto / Zažádat o licenci */
              <Card key={b.id} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="opacity-50 flex flex-col justify-between">
                <div>
                  <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="aspect-[3/4] rounded-lg mb-4 flex items-center justify-center relative">
                    <Lock size={32} style={{ color: 'var(--text-muted)' }} className="opacity-30" />
                    
                    {/* UKAZATEL LAJKŮ */}
                    <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }} className="absolute top-2 right-2 border px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold">
                      <Heart size={10} className={isUserLiked ? "fill-red-500 text-red-500" : "opacity-40"} />
                      <span>{b.likesCount}</span>
                    </div>
                  </div>
                  <h4 className="font-black uppercase text-sm line-clamp-2">{b.title}</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-medium mt-1 opacity-80">{b.author}</p>
                </div>
                <button 
                  disabled={submittingId === b.id}
                  onClick={() => handleRequestLicense(b.id)}
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }}
                  className="mt-4 w-full py-2 hover:opacity-80 disabled:opacity-50 border rounded font-black text-[10px] uppercase cursor-pointer transition-all flex items-center justify-center"
                >
                  {submittingId === b.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Zažádat o licenci"
                  )}
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const ReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0); // 🔥 Sledování celkového počtu lajků
  const [isRead, setIsRead] = useState(false); 
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const saveReadingProgress = async () => {
    const currentUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
    if (!currentUserId || !id) return;

    const currentScroll = window.scrollY;

    await supabase
      .from('user_books')
      .update({
        last_read_at: new Date().toISOString(),
        scroll_position: Math.floor(currentScroll)
      })
      .eq('user_id', currentUserId)
      .eq('book_id', id);
  };

  useEffect(() => {
    async function verifyAndLoad() {
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

      // Načtení knihy včetně fake_likes a reálných book_likes pro správný výpočet
      const { data: b } = await supabase
        .from('books')
        .select('title, author, content, fake_likes, book_likes(count)')
        .eq('id', id)
        .single();
      
      if (b) {
        setBook(b);
        const realLikes = b.book_likes?.[0]?.count || 0;
        const fakeLikes = b.fake_likes || 0;
        setLikesCount(realLikes + fakeLikes); // 🔥 Výpočet shodný s administrací
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

      setLoading(false);

      if (access.scroll_position && access.scroll_position > 0) {
        setTimeout(() => {
          window.scrollTo({ top: access.scroll_position, behavior: 'smooth' });
        }, 150);
      }
    }

    verifyAndLoad();

    // Přidání event listenerů pro uložení pozice při odchodu/zavření tabu
    const handleBeforeUnload = () => {
      saveReadingProgress();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, userId]);

  // Funkce pro přepnutí stavu přečteno
  const toggleReadStatus = async (status) => {
    await supabase
      .from('user_books')
      .update({ is_read: status })
      .eq('user_id', userId)
      .eq('book_id', id);
    
    setIsRead(status);
    if (status) navigate('/app'); 
  };

  // 🔥 Kompletní funkční toggleLike pro čtenáře
  const toggleLike = async () => {
    if (!userId || !id) return;

    if (isLiked) {
      // Smazat lajk
      const { error } = await supabase
        .from('book_likes')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', id);

      if (!error) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      }
    } else {
      // Přidat lajk
      const { error } = await supabase
        .from('book_likes')
        .insert([{ user_id: userId, book_id: id }]);

      if (!error) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }
  };

  const handleBack = async (e) => {
    e.preventDefault();
    await saveReadingProgress();
    navigate('/app');
  };

  if (loading) return <div style={{ color: 'var(--text-body)' }} className="text-center py-20"><Loader2 style={{ color: 'var(--bg-primary)' }} className="animate-spin mx-auto"/></div>;
  if (err) return <div className="max-w-sm mx-auto py-20 px-4"><Card className="text-center font-bold text-red-500 p-4">{err}</Card></div>;

  return (
    <div style={{ color: 'var(--text-body)', userSelect: 'none' }} onContextMenu={e => e.preventDefault()} className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in duration-300">
      <a href="/app" onClick={handleBack} style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-bold no-underline opacity-60 hover:opacity-100 flex items-center gap-1 mb-4 transition-opacity">
        ← Zpět do knihovny
      </a>
      
      <Card className="p-8 md:p-12 relative overflow-hidden">
        {/* Hlavička knihy, autor a tvoje lajky */}
        <div style={{ borderColor: 'var(--border-color)' }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{book?.title}</h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-bold uppercase opacity-80">Autor: {book?.author || 'Neznámý'}</p>
          </div>
          
          {/* Tlačítko pro lajkování */}
          <button 
            onClick={toggleLike}
            style={{ 
              backgroundColor: isLiked ? 'var(--bg-secondary)' : 'transparent', 
              borderColor: isLiked ? 'var(--bg-primary)' : 'var(--border-color)',
              color: isLiked ? 'var(--bg-primary)' : 'var(--text-muted)'
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase border tracking-wider cursor-pointer transition-all hover:opacity-90"
          >
            <Heart size={14} style={{ fill: isLiked ? 'var(--bg-primary)' : 'transparent', color: isLiked ? 'var(--bg-primary)' : 'currentColor' }} />
            <span>{likesCount}</span>
          </button>
        </div>

        {/* Text knihy */}
        <div style={{ color: 'var(--text-body)' }} className="text-base leading-relaxed whitespace-pre-line text-justify font-medium tracking-wide">
          {book?.content}
        </div>

        {/* NOVÁ SEKCE NA KONCI */}
        <div style={{ borderColor: 'var(--border-color)' }} className="mt-16 pt-8 border-t flex flex-col items-center gap-4">
          <button 
            onClick={() => toggleReadStatus(!isRead)}
            style={{ 
              backgroundColor: isRead ? 'var(--bg-secondary)' : 'var(--bg-primary)', 
              color: isRead ? 'var(--text-muted)' : 'var(--text-primary)'
            }}
            className="px-8 py-3 rounded-full font-black uppercase text-xs tracking-wider border-none cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] shadow-md"
          >
            {isRead ? "Znovu otevřít svazek" : "Dokončit svazek ✓"}
          </button>
          {isRead && <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase opacity-50">Tento svazek je v knihovně označen jako přečtený.</p>}
        </div>
      </Card>
    </div>
  );
};

const PublisherDashboard = () => {
  const [myBooks, setMyBooks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); // 🔥 Nový stav pro čekající žádosti
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const { user } = useAuth();

  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  // Funkce pro načtení knih nakladatele včetně agregovaného počtu lajků
  const fetchPublisherBooks = async (username) => {
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

    if (!error && data) {
      const booksWithLikes = data.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        likesCount: (book.book_likes?.[0]?.count || 0) + (book.fake_likes || 0) // 🔥 Sčítáme i fake_likes
      }));
      setMyBooks(booksWithLikes);
    }
  };

  // 🔥 NOVÁ FUNKCE: Načtení žádostí o licence pouze pro knihy tohoto nakladatele
  const fetchPendingRequests = async (username) => {
    setLoadingRequests(true);
    try {
      // Nejprve vytáhneme ID všech knih, které patří tomuto autorovi
      const { data: publisherBooks } = await supabase
        .from('books')
        .select('id')
        .eq('author', username);

      const bookIds = publisherBooks?.map(b => b.id) || [];

      if (bookIds.length === 0) {
        setPendingRequests([]);
        return;
      }

      // Vytáhneme žádosti 'requested' navázané na tyto knihy + dotáhneme profily a info o knize
      const { data: requests, error } = await supabase
        .from('user_books')
        .select(`
          id,
          user_id,
          book_id,
          status,
          created_at,
          profiles(email),
          books(title)
        `)
        .eq('status', 'requested')
        .in('book_id', bookIds);

      if (!error && requests) {
        setPendingRequests(requests);
      }
    } catch (err) {
      console.error("Chyba při načítání žádostí:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadAllData = () => {
    if (!user) return;
    const username = getUsername(user.email);
    fetchPublisherBooks(username);
    fetchPendingRequests(username);

    supabase.from('profiles').select('id, email').then(({ data }) => {
      setProfiles(data || []);
    });
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const createBook = async (e) => {
    e.preventDefault();
    if (!title || !content) return alert('Doplňte název a text knihy.');

    const username = getUsername(user.email);

    const { error } = await supabase.from('books').insert([{ 
      title, 
      content, 
      author: username,
      fake_likes: 0
    }]);

    if (!error) {
      alert('Kniha úspěšně publikována!');
      setTitle(''); 
      setContent('');
      fetchPublisherBooks(username);
    } else {
      alert('Chyba při publikování: ' + error.message);
    }
  };

  // Přímé ruční přiřazení (vytvoří rovnou aktivní licenci)
  const assignBook = async () => {
    if (!selectedBookId || !selectedUserId) return alert('Vyberte knihu a uživatele');
    
    const { error } = await supabase.from('user_books').insert([{ 
      user_id: selectedUserId, 
      book_id: selectedBookId,
      status: 'active',
      is_read: false
    }]);
    
    if (error) alert('Chyba nebo uživatel již tuto knihu má: ' + error.message);
    else {
      alert('Kniha byla úspěšně přiřazena uživateli!');
      setSelectedBookId('');
      setSelectedUserId('');
    }
  };

  // 🔥 NOVÁ FUNKCE: Schválení žádosti čtenáře
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

  // 🔥 NOVÁ FUNKCE: Zamítnutí / smazání žádosti čtenáře
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
    <div style={{ color: 'var(--text-body)' }} className="max-w-5xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-300">
      <div style={{ borderColor: 'var(--border-color)' }} className="flex justify-between items-center mb-4 border-b pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">Nakladatelský Panel</h2>
        <span style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }} className="text-xs px-3 py-1.5 rounded-full font-bold uppercase opacity-80">
          Vydavatel: {getUsername(user?.email)}
        </span>
      </div>
      
      {/* SEKCE 1: ČEKAJÍCÍ ŽÁDOSTI O LICENCE */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <h3 style={{ color: 'var(--bg-primary)' }} className="font-bold mb-4 text-lg uppercase tracking-tight flex items-center gap-2">
          <Clock size={20} /> Žádosti o schválení licencí k Vašim knihám
        </h3>
        
        {loadingRequests ? (
          <div className="flex items-center gap-2 text-sm opacity-60 py-4"><Loader2 className="animate-spin" size={16}/> Načítám žádosti čtenářů...</div>
        ) : pendingRequests.length === 0 ? (
          <p className="text-sm font-medium opacity-60 italic py-2">Žádný čtenář aktuálně nečeká na schválení licence.</p>
        ) : (
          <div style={{ borderColor: 'var(--border-color)' }} className="divide-y">
            {pendingRequests.map(req => (
              <div key={req.id} style={{ borderColor: 'var(--border-color)' }} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-3 first:pt-0 last:pb-0">
                <div>
                  <h4 className="font-black text-sm uppercase">{req.books?.title}</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium">Čtenář: <span style={{ color: 'var(--text-body)' }} className="font-bold">{req.profiles?.email}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="success" 
                    onClick={() => handleApproveRequest(req.id)}
                    className="py-2 px-3"
                  >
                    <Check size={14} /> Schválit přístup
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => handleRejectRequest(req.id)}
                    className="py-2 px-2"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FORMULÁŘ PRO NOVOU KNIHU */}
        <Card>
          <h3 className="font-bold mb-4 text-lg uppercase tracking-tight">Vložit novou knihu</h3>
          <form onSubmit={createBook} className="space-y-4">
            <input 
              type="text" 
              placeholder="Název knihy" 
              value={title} 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
              className="w-full p-3 border rounded-lg font-bold outline-none text-sm placeholder:opacity-50" 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Text knihy..." 
              value={content} 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
              className="w-full p-3 border rounded-lg font-bold outline-none resize-none text-sm placeholder:opacity-50" 
              rows={6} 
              onChange={e => setContent(e.target.value)} 
              required 
            />
            <Button type="submit" className="w-full py-3 uppercase tracking-wider">
              Publikovat knihu
            </Button>
          </form>
        </Card>
        
        {/* RUČNÍ PŘIŘAZENÍ LICENCE */}
        <Card>
          <h3 className="font-bold mb-4 text-lg uppercase tracking-tight flex items-center gap-1.5">
            <UserPlus size={18}/> Nucené přiřazení licence
          </h3>
          <div className="space-y-3">
            <select 
              onChange={e => setSelectedBookId(e.target.value)} 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
              className="w-full p-3 border rounded-lg font-bold text-xs outline-none"
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
              className="w-full p-3 border rounded-lg font-bold text-xs outline-none"
              value={selectedUserId}
            >
              <option value="">-- Vyberte čtenáře --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.email}</option>
              ))}
            </select>
            
            <Button 
              onClick={assignBook} 
              variant="purple"
              className="w-full py-3 font-bold uppercase text-xs"
            >
              Přiřadit licenci natvrdo
            </Button>
          </div>
        </Card>
      </div>

      {/* STATISTIKY VYDANÝCH KNIH */}
      <Card>
        <h3 className="font-bold mb-4 text-lg uppercase tracking-tight flex items-center gap-2">
          <BookOpen size={20} /> Moje vydané tituly a ohlasy
        </h3>
        {myBooks.length === 0 ? (
          <p className="text-sm font-medium opacity-60 italic py-2">Zatím jste nevydal(a) žádné knihy.</p>
        ) : (
          <div style={{ borderColor: 'var(--border-color)' }} className="divide-y max-h-72 overflow-y-auto">
            {myBooks.map(b => (
              <div key={b.id} style={{ borderColor: 'var(--border-color)' }} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div>
                  <h4 className="font-bold text-sm">{b.title}</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase opacity-60 font-bold">Autor: {b.author}</p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bg-primary)', color: 'var(--bg-primary)' }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border">
                  <Heart size={14} className="fill-current text-current" />
                  <span className="font-black text-xs">{b.likesCount} lajků</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  const [books, setBooks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); // Žádosti o licenci
  const [logs, setLogs] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [fakeLikes, setFakeLikes] = useState(0); 
  const [activeUser, setActiveUser] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);
  
  // Nový stav pro editaci bonusových XP v admin panelu
  const [userFakeXpInput, setUserFakeXpInput] = useState(0);

  // Pomocná funkce pro bezpečný zápis do logů (ignoruje 403 chyby z RLS, aby nezasekla aplikaci)
  const safeLog = async (logType, message) => {
    try {
      await supabase.from('system_logs').insert([{ log_type: logType, message }]);
    } catch (err) {
      console.warn("Logování do DB selhalo (pravděpodobně RLS/403):", message);
    }
  };

  // 1. Načítání dat z databáze
  const refreshData = async () => {
    try {
      // 1. Načtení knih
      const { data: b } = await supabase
        .from('books')
        .select('id, title, author, fake_likes, book_likes(count)');
        
      // 2. Načtení profilů (PŘIDÁN SLOUPEC fake_xp)
      const { data: p } = await supabase.from('profiles').select('id, email, role, created_at, fake_xp');
      
      // 3. Načtení logů (pokud selže kvůli RLS, vrátí prázdné pole)
      const { data: l } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(15);
      
      // 4. BEZPEČNÉ NAČTENÍ ŽÁDOSTÍ (Bez nespolehlivého databázového JOINu)
      const { data: reqs, error: reqError } = await supabase
        .from('user_books')
        .select('id, user_id, book_id, created_at, status')
        .eq('status', 'requested');

      if (reqError) {
        console.error("Chyba při načítání user_books:", reqError);
      }

      // Ruční propojení dat v JavaScriptu (stoprocentní jistota funkčnosti)
      const mapovanéZadosti = reqs?.map(req => {
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
          likesCount: realLikes + fikes 
        };
      }) || [];

      // Aktualizace vybraného uživatele, aby se mu hned přepsala data, pokud se změnila v DB
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
      setPendingRequests(mapovanéZadosti);
    } catch (err) {
      console.error("Chyba v refreshData:", err);
    }
  };

  useEffect(() => {
    refreshData();
    const sub = supabase.channel('sys_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, payload => {
        setLogs(prev => [payload.new, ...prev]);
      }).subscribe();
    
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Schválení čekající žádosti
  const approveRequest = async (requestId, userEmail, bookTitle) => {
    const { error } = await supabase
      .from('user_books')
      .update({ status: 'active' })
      .eq('id', requestId);

    if (!error) {
      await safeLog('SUCCESS', `Schválena licence na knihu "${bookTitle}" pro ${userEmail}`);
      alert('Licence byla úspěšně schválena!');
      refreshData();
    } else {
      alert('Chyba při schvalování: ' + error.message);
    }
  };

  // Zamítnutí / Smazání čekající žádosti
  const rejectRequest = async (requestId, userEmail, bookTitle) => {
    if (!confirm(`Opravdu chcete zamítnout žádost uživatele ${userEmail} o knihu "${bookTitle}"?`)) return;
    
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('id', requestId);

    if (!error) {
      await safeLog('WARN', `Zamítnuta žádost na knihu "${bookTitle}" od ${userEmail}`);
      refreshData();
    } else {
      alert('Chyba při mazání žádosti: ' + error.message);
    }
  };

  // 2. Uložení / Úprava knihy
  const saveBook = async (e) => {
    e.preventDefault();
    if (!title) return alert('Doplňte název knihy.');

    if (editingBookId) {
      const { error } = await supabase
        .from('books')
        .update({ 
          title, 
          author: author || 'Neznámý', 
          content, 
          fake_likes: parseInt(fakeLikes) || 0 
        })
        .eq('id', editingBookId);
        
      if (!error) {
        await safeLog('SUCCESS', `Upravena kniha: ${title} (Lajky: ${fakeLikes})`);
        alert('Kniha byla úspěšně aktualizována!');
        setEditingBookId(null);
      } else {
        alert('Chyba při úpravě: ' + error.message);
      }
    } else {
      if (!content) return alert('Doplňte text knihy.');
      const { error } = await supabase
        .from('books')
        .insert([{ 
          title, 
          author: author || 'Neznámý', 
          content, 
          fake_likes: parseInt(fakeLikes) || 0 
        }]);
        
      if (!error) {
        await safeLog('SUCCESS', `Uložená kniha: ${title} s počtem lajků ${fakeLikes}`);
        alert('Kniha byla úspěšně uložena do systému!');
      } else {
        alert('Chyba při ukládání: ' + error.message);
      }
    }
    
    setTitle(''); setAuthor(''); setContent(''); setFakeLikes(0);
    refreshData();
  };

  const startEditBook = async (book) => {
    const { data, error } = await supabase.from('books').select('content, fake_likes').eq('id', book.id).single();
    if (!error && data) {
      setEditingBookId(book.id);
      setTitle(book.title);
      setAuthor(book.author);
      setContent(data.content || '');
      setFakeLikes(data.fake_likes || 0);
    } else {
      alert('Nepodařilo se načíst text knihy k editaci.');
    }
  };

  // Funkce pro uložení Fake XP uživateli
  const handleSaveFakeXp = async () => {
    if (!activeUser) return;
    const xpNum = parseInt(userFakeXpInput) || 0;
    
    const { error } = await supabase
      .from('profiles')
      .update({ fake_xp: xpNum })
      .eq('id', activeUser.id);

    if (!error) {
      await safeLog('SUCCESS', `Uživateli ${activeUser.email} nastaveno ${xpNum} bonusových XP.`);
      alert('Bonusové XP byly úspěšně uloženy!');
      refreshData();
    } else {
      alert('Chyba při ukládání XP: ' + error.message);
    }
  };

  // 3. Správa uživatelů a rolí
  const createNewUser = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    if (!email) return alert('Zadej e-mail');

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password || 'DocasneHeslo123!',
    });

    if (error) {
      alert('Chyba: ' + error.message);
    } else {
      alert('Uživatel vytvořen!');
      e.target.reset();
      refreshData();
    }
  };

  const toggleRole = async (uId, currentRole) => {
    let nextRole = 'uživatel';
    
    if (currentRole === 'uživatel') {
      nextRole = 'nakladatel';
    } else if (currentRole === 'nakladatel') {
      nextRole = 'správce';
    } else if (currentRole === 'správce') {
      nextRole = 'uživatel';
    }

    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', uId);
    if (!error) {
      await safeLog('WARN', `Změna role uživatele ${uId} na ${nextRole}`);
      refreshData();
    } else {
      alert('Chyba při změně role: ' + error.message);
    }
  };

  // 4. DISTRIBUCE LICENCÍ
  const assignBookToUser = async () => {
    if (!activeUser || !selectedBookId) return;
    
    const { data: existing } = await supabase
      .from('user_books')
      .select('id, status')
      .eq('user_id', activeUser.id)
      .eq('book_id', selectedBookId)
      .single();

    let error;
    if (existing) {
      const { error: updateError } = await supabase
        .from('user_books')
        .update({ status: 'active' })
        .eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('user_books')
        .insert([{ user_id: activeUser.id, book_id: selectedBookId, status: 'active' }]);
      error = insertError;
    }
    
    if (error) {
      alert('Chyba při přiřazování licence: ' + error.message);
    } else {
      await safeLog('SUCCESS', `Přiřazena aktivní kniha uživateli ${activeUser.email}`);
      alert('Přístup úspěšně udělen and aktivován.');
      setSelectedBookId('');
      refreshData();
    }
  };

  const assignAllBooksToUser = async () => {
    if (!activeUser || books.length === 0) return;
    if (!confirm(`Opravdu chcete uživateli ${activeUser.email} přidělit licenci ke VŠEM knihám jako aktivní?`)) return;

    try {
      const { data: existingUserBooks, error: fetchError } = await supabase
        .from('user_books')
        .select('book_id, id, status')
        .eq('user_id', activeUser.id);

      if (fetchError) throw fetchError;
      
      const existingBookIds = existingUserBooks?.map(ub => ub.book_id) || [];
      const requestedEntries = existingUserBooks?.filter(ub => ub.status === 'requested') || [];

      if (requestedEntries.length > 0) {
        await supabase
          .from('user_books')
          .update({ status: 'active' })
          .in('id', requestedEntries.map(re => re.id));
      }

      const booksToAssign = books.filter(b => !existingBookIds.includes(b.id));

      if (booksToAssign.length > 0) {
        const insertData = booksToAssign.map(b => ({
          user_id: activeUser.id,
          book_id: b.id,
          status: 'active'
        }));
        const { error: insertError } = await supabase.from('user_books').insert(insertData);
        if (insertError) throw insertError;
      }

      await safeLog('SUCCESS', `Hromadně aktivovány VŠECHNY knihy pro: ${activeUser.email}`);
      alert(`Všechny knihy byly uživateli plně aktivovány!`);
      refreshData();
    } catch (err) {
      alert('Chyba při hromadném přiřazování: ' + err.message);
    }
  };

  const assignSelectedBookToAllUsers = async () => {
    if (!selectedBookId) return alert('Nejprve zvolte knihu z rozevíracího seznamu.');
    const selectedBook = books.find(b => b.id === selectedBookId);
    if (!selectedBook) return;

    if (profiles.length === 0) return alert('V systému nejsou žádní uživatelé.');
    if (!confirm(`Opravdu chcete knihu "${selectedBook.title}" IHNED aktivovat VŠEM registrovaným uživatelům?`)) return;

    try {
      const { data: alreadyHasBook, error: fetchError } = await supabase
        .from('user_books')
        .select('user_id, id, status')
        .eq('book_id', selectedBookId);

      if (fetchError) throw fetchError;
      
      const userIdsWithBook = alreadyHasBook?.map(ub => ub.user_id) || [];
      const requestedEntries = alreadyHasBook?.filter(ub => ub.status === 'requested') || [];

      if (requestedEntries.length > 0) {
        await supabase
          .from('user_books')
          .update({ status: 'active' })
          .in('id', requestedEntries.map(re => re.id));
      }

      const profilesToAssign = profiles.filter(p => !userIdsWithBook.includes(p.id));

      if (profilesToAssign.length > 0) {
        const insertData = profilesToAssign.map(p => ({
          user_id: p.id,
          book_id: selectedBookId,
          status: 'active'
        }));
        const { error: insertError } = await supabase.from('user_books').insert(insertData);
        if (insertError) throw insertError;
      }

      await safeLog('SUCCESS', `Kniha "${selectedBook.title}" byla aktivována všem registrovaným uživatelům.`);
      alert(`Kniha byla úspěšně plně zpřístupněna všem uživatelům!`);
      setSelectedBookId('');
      refreshData();
    } catch (err) {
      alert('Chyba při hromadném sdílení knihy: ' + err.message);
    }
  };

  const handleSelectUserFromTable = (p) => {
    setActiveUser(p);
    setUserFakeXpInput(p.fake_xp || 0);
  };

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-300 space-y-8">
      {/* Karty statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 py-4">
          <Database style={{ color: 'var(--bg-primary)' }} size={24}/>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-70">Knihovny</h4>
            <p className="text-lg font-black">{books.length} Titulů v DB</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4">
          <Users style={{ color: 'var(--bg-primary)' }} size={24}/>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-70">Uživatelé</h4>
            <p className="text-lg font-black">{profiles.length} Registrovaných</p>
          </div>
        </Card>
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="flex items-center gap-4 py-4 border-2">
          <UserCheck style={{ color: 'var(--bg-primary)' }} size={24}/>
          <div>
            <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-70">Nové žádosti</h4>
            <p style={{ color: 'var(--bg-primary)' }} className="text-lg font-black">{pendingRequests.length} Ke schválení</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Levý sloupec */}
        <div className="lg:col-span-5 space-y-6">
          {/* SPRÁVA DIGITÁLNÍ KNIHY */}
          <Card>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16}/> {editingBookId ? 'Upravit digitální knihu' : 'Nová digitální kniha'}
            </h3>
            <form onSubmit={saveBook} className="space-y-3">
              <input 
                type="text" 
                placeholder="Název knihy..." 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-50" 
                required 
              />
              <input 
                type="text" 
                placeholder="Autor..." 
                value={author} 
                onChange={e => setAuthor(e.target.value)} 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-50" 
              />
              
              <div className="space-y-1">
                <label style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider block pl-1 opacity-70">Uměle přidat lajky (Prestiž)</label>
                <input 
                  type="number" 
                  placeholder="Počet lajků..." 
                  value={fakeLikes} 
                  onChange={e => setFakeLikes(Math.max(0, parseInt(e.target.value) || 0))} 
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                  className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-50" 
                />
              </div>

              <textarea 
                placeholder="Sem vložte čistý text knihy..." 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                rows={6} 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3 border rounded-lg text-sm font-medium outline-none resize-none placeholder:opacity-50" 
                required 
              />
              
              <Button type="submit" className="w-full py-3 uppercase tracking-wider">
                {editingBookId ? 'Uložit změny v knize' : 'Uložit knihu do systému'}
              </Button>

              {editingBookId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingBookId(null); setTitle(''); setAuthor(''); setContent(''); setFakeLikes(0); }}
                  style={{ color: 'var(--text-muted)' }}
                  className="w-full py-2 text-xs hover:underline uppercase cursor-pointer bg-transparent border-none font-bold tracking-wide"
                >
                  Zrušit editaci
                </button>
              )}
            </form>
          </Card>

          {/* VYTVOŘIT NOVÝ ÚČET */}
          <Card>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={16}/> Vytvořit nový účet</h3>
            <form onSubmit={createNewUser} className="space-y-3">
              <input 
                name="email" 
                type="email" 
                placeholder="E-mail nového uživatele..." 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-50" 
                required 
              />
              <input 
                name="password" 
                type="password" 
                placeholder="Počáteční heslo..." 
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-3 border rounded-lg text-sm font-bold outline-none placeholder:opacity-50" 
                required 
              />
              <Button type="submit" variant="success" className="w-full py-3 uppercase tracking-wider">
                Vytvořit účet
              </Button>
            </form>
          </Card>

          {/* DISTRIBUCE + FAKE XP FORMULÁŘ */}
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="border-2">
            <h3 style={{ color: 'var(--bg-primary)' }} className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
              <UserCheck size={16}/> Distribuce a správa účtu
            </h3>
            
            <div className="space-y-3">
              <select 
                value={selectedBookId} 
                onChange={e => setSelectedBookId(e.target.value)} 
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                className="w-full p-2.5 border rounded-lg font-bold text-xs outline-none"
              >
                <option value="" style={{ background: 'var(--bg-secondary)' }}>-- Zvolte knihu pro distribuci --</option>
                {books.map(b => <option key={b.id} value={b.id} style={{ background: 'var(--bg-secondary)' }}>{b.title}</option>)}
              </select>

              <Button 
                onClick={assignSelectedBookToAllUsers}
                variant="success"
                className="w-full text-xs py-2.5 uppercase tracking-wider font-black"
              >
                📢 Aktivovat tuto knihu VŠEM uživatelům
              </Button>
              
              {activeUser && (
                <div style={{ borderColor: 'var(--border-color)' }} className="mt-4 pt-4 border-t space-y-3">
                  <p style={{ color: 'var(--bg-primary)' }} className="text-xs font-bold truncate m-0">Vybraný uživatel: {activeUser.email}</p>
                  
                  {/* FORMULÁŘ NA PRIDÁNÍ FAKE XP */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} className="p-3 rounded-xl space-y-2 border">
                    <label style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-wider opacity-80 block">Bonusové XP pro účet</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={userFakeXpInput} 
                        onChange={e => setUserFakeXpInput(parseInt(e.target.value) || 0)}
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-body)' }}
                        className="w-full p-2 border rounded-lg text-xs font-bold outline-none placeholder:opacity-50" 
                        placeholder="Napiš hodnotu..."
                      />
                      <button 
                        onClick={handleSaveFakeXp}
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }}
                        className="px-3 font-black text-[10px] uppercase rounded-lg border border-solid cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                      >
                        Uložit XP
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={assignBookToUser} 
                      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-body)' }}
                      className="flex-1 text-xs py-2 uppercase font-bold rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Aktivovat vybranou
                    </button>
                    <Button variant="secondary" onClick={() => setActiveUser(null)} className="text-xs py-2">Zrušit výběr</Button>
                  </div>
                  <Button 
                    onClick={assignAllBooksToUser}
                    variant="purple"
                    className="w-full text-xs py-2 uppercase tracking-wider"
                  >
                    ✨ Aktivovat mu VŠECHNY knihy z DB
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Pravý sloupec */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ČEKAJÍCÍ ŽÁDOSTI O LICENCE KE SCHVÁLENÍ */}
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} className="border-2 p-0 overflow-hidden">
            <div style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} className="p-4 border-b font-black text-xs uppercase tracking-wider flex justify-between items-center">
              <span>📥 Čekající žádosti o licenci ke schválení</span>
              <span style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-body)' }} className="font-black px-2 py-0.5 rounded text-[10px]">{pendingRequests.length}</span>
            </div>
            <div style={{ borderColor: 'var(--border-color)' }} className="max-h-52 overflow-y-auto divide-y">
              {pendingRequests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }} className="text-center py-6 text-xs font-bold opacity-60 italic">Žádné nové žádosti o licenci nejsou hlášeny.</p>
              ) : (
                pendingRequests.map(req => {
                  const userEmail = req.profiles?.email || `Uživatel (ID: ${req.user_id?.substring(0, 5)}...)`;
                  const bookTitle = req.books?.title || `Kniha (ID: ${req.book_id?.substring(0, 5)}...)`;

                  return (
                    <div key={req.id} style={{ borderColor: 'var(--border-color)' }} className="p-3 flex items-center justify-between text-xs font-bold hover:opacity-90 transition-opacity gap-4">
                      <div className="truncate flex-1">
                        <p className="truncate">{userEmail}</p>
                        <p style={{ color: 'var(--bg-primary)' }} className="text-[10px] truncate mt-0.5">žádá o knihu: <span className="font-black uppercase">{bookTitle}</span></p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          variant="success"
                          onClick={() => approveRequest(req.id, userEmail, bookTitle)}
                          className="px-3 py-1.5 text-[10px] uppercase rounded"
                        >
                          Schválit
                        </Button>
                        <Button 
                          variant="danger"
                          onClick={() => rejectRequest(req.id, userEmail, bookTitle)}
                          className="px-2 py-1.5 text-[10px] uppercase rounded"
                        >
                          Odmítnout
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* SPRÁVA ČTENÁŘSKÝCH LICENCÍ A ÚČTŮ */}
          <Card className="overflow-hidden p-0">
            <div style={{ borderColor: 'var(--border-color)' }} className="p-4 border-b font-black text-xs uppercase tracking-wider">Správa čtenářských licencí a účtů</div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} className="font-black uppercase border-b opacity-80">
                    <th className="p-3">Uživatel</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                  {profiles.map(p => (
                    <tr key={p.id} style={{ borderColor: 'var(--border-color)' }} className="hover:bg-[var(--bg-secondary)] transition-colors font-bold">
                      <td className="p-3 truncate max-w-[180px]">
                        <div className="truncate">{p.email}</div>
                        {p.fake_xp > 0 && <div style={{ color: 'var(--bg-primary)' }} className="text-[9px] font-black">⭐ +{p.fake_xp} Admin XP</div>}
                      </td>
                      <td className="p-3">
                        <span style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-body)', borderColor: 'var(--border-color)' }} className="text-[9px] px-2 py-0.5 rounded-full uppercase border border-solid font-black">
                          {p.role || 'uživatel'}
                        </span>
                      </td>
                      <td className="p-3 text-right flex justify-end items-center gap-2">
                        <Button variant="secondary" onClick={() => handleSelectUserFromTable(p)} className="text-[9px] px-2 py-1 uppercase flex items-center gap-1"><Plus size={10}/> Vybrat</Button>
                        <button onClick={() => toggleRole(p.id, p.role)} style={{ color: 'var(--text-muted)' }} className="p-1 border-none bg-transparent cursor-pointer hover:opacity-70 transition-opacity" title="Změnit roli (Cyklus: Uživatel -> Nakladatel -> Správce)"><Shield size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* INVENTÁŘ TITULŮ */}
          <Card className="overflow-hidden p-0">
            <div style={{ borderColor: 'var(--border-color)' }} className="p-4 border-b font-black text-xs uppercase tracking-wider">Inventář titulů (Katalog)</div>
            <div className="p-3 max-h-48 overflow-y-auto space-y-1.5">
              {books.map(b => (
                <div key={b.id} style={{ backgroundColor: 'var(--bg-secondary)' }} className="flex justify-between items-center p-2 rounded text-xs font-bold gap-4">
                  <span className="truncate flex-1">
                    {b.title} <span style={{ color: 'var(--text-muted)' }} className="opacity-60 font-normal">({b.author})</span>
                  </span>
                  
                  <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--bg-secondary)' }} className="flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] shrink-0 font-black">
                    <Heart size={10} className="fill-current text-current" />
                    <span>{b.likesCount}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => startEditBook(b)}
                      style={{ color: 'var(--bg-primary)' }}
                      className="bg-transparent border-none cursor-pointer hover:opacity-70 font-bold text-sm"
                      title="Upravit knihu"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={async () => { if(confirm('Odstranit knihu z databáze?')) { await supabase.from('books').delete().eq('id', b.id); refreshData(); } }} 
                      style={{ color: 'var(--text-muted)' }}
                      className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center"
                      title="Smazat knihu"
                    >
                      <Trash size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CORE SYSLOG */}
          <Card className="bg-slate-950 text-emerald-400 font-mono p-4 border border-slate-900 shadow-2xl rounded-xl">
            <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase text-slate-400 tracking-widest pb-2 border-b border-slate-900">
              <span className="flex items-center gap-1"><Terminal size={12} /> Postgres Live Core Syslog</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="space-y-1 text-[11px] max-h-36 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic text-xs">Syslog je prázdný nebo jsou zakázána práva pro čtení.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id}>
                    <span className="text-slate-500">[{log.created_at ? new Date(log.created_at).toLocaleTimeString() : '--:--:--'}]</span>{' '}
                    <span className={log.log_type === 'ERROR' ? 'text-red-500 font-bold' : log.log_type === 'WARN' ? 'text-amber-500 font-bold' : 'text-emerald-400'}>{log.log_type}</span>: {log.message}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
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
