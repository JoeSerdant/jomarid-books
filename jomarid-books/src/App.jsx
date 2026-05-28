import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
// 🔥 PŘÍMÝ IMPORT PRO SRDÍČKO A DALŠÍ IKONY, ABY NEZÁVISELY NA DYNAMICKÉ FUNKCI:
import { Heart, BookOpen, Book, ChevronRight, Loader2, LogOut, Shield } from 'lucide-react';
import { supabase } from './lib/supabase';

// Pomocná funkce pro ikony (ponech ji tu pro starší komponenty, pokud ji využívají)
const getIcon = (name) => Icons[name] || Icons.Book || Icons.HelpCircle;

// Definice ikon
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
const ChevronDown = getIcon('ChevronDown'); // Ujisti se, že tu máš i tuhle
const Clock = getIcon('Clock');
const Trash = getIcon('Trash');
// Přidej tyto řádky pod tvoje stávající definice ikon:
const Sparkles = getIcon('Sparkles');
const HelpCircle = getIcon('HelpCircle');
const Zap = getIcon('Zap'); // Lucide ho zná jako Zap, přes getIcon se bezpečně namapuje
const Check = getIcon('Check');
const UserPlus = getIcon('UserPlus');

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
    '--bg-body': '#fdfaf5',
    '--text-body': '#112211',     
    '--bg-card': 'rgba(255, 255, 255, 0.96)', 
    '--border-color': '#D2C1B0',  
    '--bg-navbar': 'rgba(255, 253, 247, 0.85)',
    '--text-muted': '#2E5A44',    
    '--bg-primary': '#00875A',    
    '--text-primary': '#FFFFFF',
    '--bg-secondary': '#FFFFFF',
    '--text-secondary': '#00875A',
    '--bg-badge': 'rgba(0, 135, 90, 0.15)',
    '--text-badge': '#00875A',
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
        {user ? (
          <>
            <Link to="/app" className="no-underline"><Button variant="secondary" className="text-xs">Moje Knihovna</Button></Link>
            
            {role === 'správce' && (
              <Link to="/admin" className="no-underline"><Button className="text-xs bg-red-600 border-none text-white hover:bg-red-700">Admin Panel</Button></Link>
            )}
            
            {(role === 'správce' || role === 'nakladatel') && (
              <Link to="/publisher" className="no-underline"><Button className="text-xs bg-purple-600 border-none text-white">Nakladatel</Button></Link>
            )}
          </>
        ) : (
          <Link to="/login" className="no-underline"><Button variant="secondary" className="text-xs">Přihlášení</Button></Link>
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

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      supabase.from('user_books').select('books(id, title, author)').eq('user_id', user.id).then(({ data }) => {
        setUserBooks(data?.map(i => i.books) || []);
        setLoading(false);
      });
    } else { setQuery(''); }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const filtered = userBooks.filter(b => b?.title?.toLowerCase().includes(query.toLowerCase()) || b?.author?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-start p-4 pt-20" onClick={onClose}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl shadow-2xl w-full max-w-xl p-6 relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 opacity-50 hover:opacity-100 cursor-pointer text-current bg-transparent border-none"><X size={20} /></button>
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-60">Vyhledat v mých knihách</h3>
        <div className="relative flex items-center">
          <Search className="absolute left-4 opacity-40" size={20} />
          <input type="text" placeholder="Zadejte název díla nebo jméno autora..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus className="w-full pl-12 pr-4 py-3 border border-black/10 rounded-xl outline-none bg-black/5 text-current" />
        </div>
        <div className="mt-4 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-xs flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={14} /> Načítání katalogu...</div>
          ) : query.trim() === '' ? (
            <p className="text-center py-6 text-xs uppercase tracking-wider opacity-40">Našeptávač se aktivuje psaním...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-6 text-sm opacity-60">Žádná z vašich schválených knih neodpovídá zadání.</p>
          ) : (
            filtered.map(book => (
              <Link to={`/read/${book.id}`} key={book.id} onClick={onClose} className="p-3 flex justify-between items-center hover:bg-black/5 transition-colors rounded-xl no-underline text-current">
                <div><h4 className="font-bold text-sm">{book.title}</h4><p className="text-xs opacity-60">{book.author}</p></div>
                <ChevronRight size={16} className="opacity-50" />
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
    <div className="border-b border-black/10 text-left py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center bg-transparent border-none outline-none cursor-pointer text-slate-900 font-black uppercase text-xs tracking-wider text-left py-2 gap-4"
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={14} className="text-indigo-600 shrink-0" />
          {question}
        </span>
        <ChevronDown size={16} className={`transform transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed pt-2 pl-6 animate-fadeIn">
          {answer}
        </p>
      )}
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  // 🔥 REÁLNÉ TITULY Z VAŠÍ DATABÁZE
  const featuredBooks = [
    { 
      title: "Jomirad 1. část", 
      category: "Superhrdinská sága", 
      author: "Jomarid", 
      color: "from-slate-800 to-indigo-950" 
    },
    { 
      title: "Šepot starých knihoven 1. část: Vězení pro příběhy", 
      category: "Mysteriózní fantasy", 
      author: "Alexandr Heryán", 
      color: "from-amber-900 to-stone-950" 
    },
    { 
      title: "Jomirad 2. část", 
      category: "Superhrdinská sága", 
      author: "Jomarid", 
      color: "from-blue-900 to-slate-950" 
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
      
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
          Vítejte v privátním fondu Jomarid Books. Sledujte osudy superhrdiny Jomirada a odhalte tajemství ukrytá v sérii Šepot starých knihoven. Nabízíme prémiové čtení přes dedikované Cloud-to-Screen rozhraní.
        </p>

        {/* Hlavní akční tlačítka */}
        <div className="max-w-md mx-auto space-y-4 mb-16">
          <Button 
            onClick={() => navigate('/app')} 
            className="w-full py-4 uppercase font-black tracking-wider text-sm shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
          >
            <BookOpen size={16} /> Odemknout digitální čítárnu
          </Button>
          
          <p className="text-[11px] font-bold uppercase opacity-40 tracking-wider">
            Nemáte účet? Zřídíte si ho okamžitě a zdarma přímo u vstupu.
          </p>
        </div>

        {/* SEKCE: NAŠE TITULY + KARTY */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 text-center">— NAŠE TITULY —</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {featuredBooks.map((book, idx) => (
              <div 
                key={idx}
                className="group relative h-48 rounded-xl p-4 bg-gradient-to-br text-white flex flex-col justify-between text-left shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate('/app')}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${book.color} opacity-95 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative z-10 flex justify-between items-start w-full">
                  <span className="text-[9px] uppercase font-black tracking-widest bg-white/20 px-2 py-0.5 rounded text-indigo-200">
                    {book.category}
                  </span>
                  <Book size={14} className="opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                </div>

                <div className="relative z-10">
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-60 block mb-0.5">
                    {book.author}
                  </span>
                  <h4 className="font-black uppercase text-sm leading-tight mb-1 tracking-tight line-clamp-2">{book.title}</h4>
                  <span className="text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-indigo-300">
                    Otevřít knihu <ChevronRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-0 h-[1px] bg-black/5 my-16" />

      {/* 2. STATISTIKY (Social Proof) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-24">
        <div className="p-4 rounded-xl bg-black/2 border border-black/5 hover:bg-black/[0.04] transition-colors">
          <p className="text-3xl font-black text-slate-900 leading-none mb-1">100%</p>
          <p className="text-[9px] font-black uppercase tracking-wider opacity-50">Digitální formát</p>
        </div>
        <div className="p-4 rounded-xl bg-black/2 border border-black/5 hover:bg-black/[0.04] transition-colors">
          <p className="text-3xl font-black text-slate-900 leading-none mb-1">0 ms</p>
          <p className="text-[9px] font-black uppercase tracking-wider opacity-50">Odezva při otáčení</p>
        </div>
        <div className="p-4 rounded-xl bg-black/2 border border-black/5 hover:bg-black/[0.04] transition-colors">
          <p className="text-3xl font-black text-slate-900 leading-none mb-1">24/7</p>
          <p className="text-[9px] font-black uppercase tracking-wider opacity-50">Okamžitý přístup</p>
        </div>
        <div className="p-4 rounded-xl bg-black/2 border border-black/5 hover:bg-black/[0.04] transition-colors">
          <p className="text-3xl font-black text-slate-900 leading-none mb-1">Cloud</p>
          <p className="text-[9px] font-black uppercase tracking-wider opacity-50">Synchronizace pozice</p>
        </div>
      </section>

      {/* 3. VLASTNOSTI / VÝHODY (Features) */}
      <section className="mb-24">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-40 mb-10 text-center">— PROČ ČÍST S JOMARID BOOKS —</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-3 p-5 rounded-xl hover:bg-black/2 border border-transparent hover:border-black/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Zap size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Bleskové Cloud-to-Screen</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Žádné stahování těžkých PDF nebo EPUB souborů. Naše technologie renderuje texty přímo ze šifrovaného cloudu do vašeho prohlížeče v reálném čase.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl hover:bg-black/2 border border-transparent hover:border-black/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Privátní kurátorovaný fond</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Nejsme masová knihovna plná balastu. Zaměřujeme se výhradně na prémiové edice, odborné texty a exkluzivní překlady, které jinde nenajdete.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl hover:bg-black/2 border border-transparent hover:border-black/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Sparkles size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Čisté prostředí bez reklam</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium leading-relaxed">
              Vaše soustředění je pro nás prioritou. Rozhraní čítárny je absolutně minimalistické, bez rušivých prvků, sociálních sítí či otravných bannerů.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ČASTO KLADENÉ OTÁZKY (FAQ) */}
      <section className="max-w-2xl mx-auto mb-24">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-40 mb-8 text-center">— ČASTO KLADENÉ OTÁZKY —</h2>
        
        <div className="space-y-1 bg-black/2 p-5 rounded-xl border border-black/5 divide-y divide-black/5">
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
      </section>

      {/* 5. FINÁLNÍ CTA SEKCE (Znovu popostrčit ke konverzi) */}
      <section className="bg-indigo-600 text-white rounded-2xl p-8 md:p-12 mb-16 text-center shadow-xl hover:shadow-indigo-500/10 transition-shadow">
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">Začněte číst ještě dnes</h3>
        <p className="text-indigo-100 text-xs md:text-sm font-medium max-w-lg mx-auto mb-6">
          Vstupte do zabezpečeného literárního ekosystému a objevte digitální komfort nové generace.
        </p>
        <div className="max-w-xs mx-auto">
          <button 
            onClick={() => navigate('/app')}
            className="w-full py-3 bg-white text-indigo-600 border-none font-black uppercase text-xs tracking-wider rounded-lg shadow cursor-pointer hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.99] transition-all"
          >
            Spustit aplikaci
          </button>
        </div>
      </section>

      {/* 6. MODERNÍ KOMPLETNÍ PATIČKA (Footer) */}
      <footer className="mt-20 pt-8 border-t border-black/5 opacity-60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-black uppercase tracking-wider gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
          <span>© {new Date().getFullYear()} Jomarid Books Ltd.</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="font-medium normal-case opacity-70">Verze platformy v2.4 (Stable Core)</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="mailto:wwsigmamango@gmail.com" className="flex items-center gap-2 text-current no-underline hover:underline bg-black/5 px-3 py-1.5 rounded-md transition-colors">
            <PhoneIcon size={10} /> Podpora: wwsigmamango@gmail.com
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
    <div className="max-w-sm mx-auto py-24 px-4">
      <Card>
        {/* Dynamický nadpis podle režimu */}
        <h2 className="text-xl font-black text-center uppercase tracking-tight mb-6">
          {isSignUp ? 'Vytvořit nový účet' : 'Vstup do čítárny'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="E-mailová adresa" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" 
            required 
          />
          <input 
            type="password" 
            placeholder={isSignUp ? 'Zvolte si heslo' : 'Přístupové heslo'} 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" 
            required 
          />
          
          {error && (
            <p className="text-red-600 text-xs font-bold flex items-center gap-1">
              <AlertTriangle size={12}/> {error}
            </p>
          )}
          
          {/* Dynamické tlačítko */}
          <Button type="submit" disabled={loading} className="w-full py-3 uppercase tracking-wider">
            {loading ? 'Zpracovávám...' : isSignUp ? 'Zaregistrovat se' : 'Odemknout čítárnu'}
          </Button>
        </form>

        {/* 🔥 Přepínací odkaz pod formulářem */}
        <div className="mt-4 pt-4 border-t border-black/5 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer"
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
      // 1. Načteme VŠECHNY knihy samostatně
      const { data: allBooks, error: booksError } = await supabase
        .from('books')
        .select('*');

      if (booksError) throw booksError;

      // 2. Načteme záznamy user_books pro aktuálního uživatele
      const { data: myUserBooks, error: userBooksError } = await supabase
        .from('user_books')
        .select('book_id, is_read, status')
        .eq('user_id', user.id);

      if (userBooksError) throw userBooksError;

      // 3. Načteme ID knih, které uživatel lajknul
      const { data: likesData, error: likesError } = await supabase
        .from('book_likes')
        .select('book_id')
        .eq('user_id', user.id);

      if (likesError) throw likesError;
      if (likesData) setLikedBookIds(likesData.map(l => l.book_id));

      // 4. Načteme celkové počty lajků pro agregaci v JS
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
          isRead: userBookEntry?.is_read || false
        };
      });

      // 🔥 NOVÉ ŘAZENÍ: Přečtené knihy padají na úplný konec seznamu
      processedBooks.sort((a, b) => {
        // 1. Pokud se liší stav přečtení, nepřečtená kniha jde VŽDY nahoru
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }

        // 2. Pokud jsou obě nepřečtené (nebo obě přečtené), řadíme podle oprávnění:
        // Aktivní přístup (hasAccess) má přednost před čekajícím (isPending)
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
      <div className="text-center py-20">
        <Loader2 className="animate-spin mx-auto mb-2 text-slate-800" />
        <p className="text-sm font-medium opacity-60">Načítám knihovnu...</p>
      </div>
    );
  }

  const userRole = user?.role || user?.user_metadata?.role;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-slate-800">
      {/* Horní lišta s navigací */}
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-black/5">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Knihovna a katalog</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {userRole === 'admin' && (
            <Link to="/admin" className="text-xs bg-black text-white px-3 py-2 rounded font-bold uppercase tracking-wider no-underline hover:opacity-80 transition-opacity">
              Admin Panel
            </Link>
          )}
          {userRole === 'nakladatel' && (
            <Link to="/nakladatel" className="text-xs bg-black text-white px-3 py-2 rounded font-bold uppercase tracking-wider no-underline hover:opacity-80 transition-opacity">
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
              /* STAV 1: Uživatel má licenci aktivní (Kniha je přístupná) */
              <Link to={`/read/${b.id}`} key={b.id} className="no-underline text-current">
                <Card className={`hover:scale-[1.02] cursor-pointer h-full flex flex-col justify-between ${b.isRead ? 'opacity-50 bg-slate-50/60' : ''}`}>
                  <div>
                    <div className="aspect-[3/4] bg-black/5 rounded-lg mb-4 flex items-center justify-center relative">
                      <Book size={32} className="opacity-20" />
                      
                      {/* UKAZATEL LAJKŮ */}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 border border-black/5 text-[10px] font-bold">
                        <Heart size={10} className={isUserLiked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                        <span>{b.likesCount}</span>
                      </div>
                    </div>
                    <h4 className="font-black uppercase text-sm line-clamp-2">{b.title}</h4>
                    <p className="text-xs uppercase font-medium mt-1 opacity-60">{b.author}</p>
                    {b.isRead && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black uppercase mt-2 inline-block">
                        ✓ Přečteno
                      </span>
                    )}
                  </div>
                  <div className={`mt-4 pt-3 border-t text-[10px] font-black uppercase flex items-center justify-between ${b.isRead ? 'text-slate-500' : 'text-emerald-600'}`}>
                    <span>{b.isRead ? "Znovu otevřít" : "Otevřít knihu"}</span>
                    <ChevronRight size={12}/>
                  </div>
                </Card>
              </Link>
            ) : b.isPending ? (
              /* STAV 2: Žádost byla odeslána (Čeká se na schválení) */
              <Card key={b.id} className="opacity-80 flex flex-col justify-between bg-amber-50/40 border-amber-200">
                <div>
                  <div className="aspect-[3/4] bg-amber-50 rounded-lg mb-4 flex items-center justify-center relative">
                    <Clock size={32} className="text-amber-500 opacity-30" />
                    
                    {/* UKAZATEL LAJKŮ */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 border border-black/5 text-[10px] font-bold">
                      <Heart size={10} className={isUserLiked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                      <span>{b.likesCount}</span>
                    </div>
                  </div>
                  <h4 className="font-black uppercase text-sm line-clamp-2">{b.title}</h4>
                  <p className="text-xs uppercase font-medium mt-1 opacity-60">{b.author}</p>
                </div>
                <div className="mt-4 w-full py-2 bg-amber-100/60 text-amber-800 text-center rounded font-black text-[10px] uppercase flex items-center justify-center gap-1 border-0">
                  <Clock size={12} className="animate-pulse" /> Čeká na schválení
                </div>
              </Card>
            ) : (
              /* STAV 3: Uživatel nemá licenci ani o ni nepožádal (Zamknuto) */
              <Card key={b.id} className="opacity-60 flex flex-col justify-between bg-black/5">
                <div>
                  <div className="aspect-[3/4] bg-black/10 rounded-lg mb-4 flex items-center justify-center relative">
                    <Lock size={32} className="opacity-20" />
                    
                    {/* UKAZATEL LAJKŮ */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 border border-black/5 text-[10px] font-bold">
                      <Heart size={10} className={isUserLiked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                      <span>{b.likesCount}</span>
                    </div>
                  </div>
                  <h4 className="font-black uppercase text-sm line-clamp-2">{b.title}</h4>
                  <p className="text-xs uppercase font-medium mt-1 opacity-60">{b.author}</p>
                </div>
                <button 
                  disabled={submittingId === b.id}
                  onClick={() => handleRequestLicense(b.id)}
                  className="mt-4 w-full py-2 bg-black/10 hover:bg-black/20 disabled:bg-black/5 rounded font-black text-[10px] uppercase cursor-pointer transition-colors border-0 flex items-center justify-center"
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

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-800"/></div>;
  if (err) return <div className="max-w-sm mx-auto py-20 px-4"><Card className="text-center font-bold text-red-600">{err}</Card></div>;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-slate-800" style={{ userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
      <a href="/app" onClick={handleBack} className="text-xs uppercase font-bold no-underline opacity-50 hover:opacity-100 flex items-center gap-1 text-current mb-4">
        ← Zpět do knihovny
      </a>
      
      <Card className="p-8 md:p-12 relative overflow-hidden">
        {/* Hlavička knihy, autor a tvoje lajky */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-black/5">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{book?.title}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase">Autor: {book?.author || 'Neznámý'}</p>
          </div>
          
          {/* Tlačítko pro lajkování */}
          <button 
            onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase border tracking-wider cursor-pointer transition-all ${
              isLiked 
                ? "bg-red-50 border-red-200 text-red-600" 
                : "bg-transparent border-black/10 text-slate-500 hover:border-black/30"
            }`}
          >
            <Heart size={14} className={isLiked ? "fill-red-500 text-red-500" : ""} />
            <span>{likesCount} lajků</span>
          </button>
        </div>

        {/* Text knihy */}
        <div className="text-base leading-relaxed whitespace-pre-line text-justify font-medium">
          {book?.content}
        </div>

        {/* NOVÁ SEKCE NA KONCI */}
        <div className="mt-16 pt-8 border-t border-black/5 flex flex-col items-center gap-4">
          <button 
            onClick={() => toggleReadStatus(!isRead)}
            className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-wider border-none cursor-pointer transition-all ${
              isRead 
                ? "bg-black/5 text-slate-500 hover:bg-black/10" 
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
            }`}
          >
            {isRead ? "Znovu otevřít svazek" : "Dokončit svazek ✓"}
          </button>
          {isRead && <p className="text-[10px] font-bold uppercase opacity-40">Tento svazek je v knihovně označen jako přečtený.</p>}
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
    <div style={{ color: 'var(--text-body)' }} className="max-w-5xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center mb-4 border-b pb-4 border-black/5">
        <h2 className="text-2xl font-black uppercase tracking-tight">Nakladatelský Panel</h2>
        <span className="text-xs bg-black/5 px-3 py-1.5 rounded-full font-bold uppercase opacity-60">
          Vydavatel: {getUsername(user?.email)}
        </span>
      </div>
      
      {/* SEKCE 1: ČEKAJÍCÍ ŽÁDOSTI O LICENCE (NOVINKA) */}
      <Card className="border-amber-200 bg-amber-50/10">
        <h3 className="font-bold mb-4 text-lg uppercase tracking-tight flex items-center gap-2 text-amber-900">
          <Clock size={20} className="text-amber-600" /> Žádosti o schválení licencí k Vašim knihám
        </h3>
        
        {loadingRequests ? (
          <div className="flex items-center gap-2 text-sm opacity-60 py-4"><Loader2 className="animate-spin" size={16}/> Načítám žádosti čtenářů...</div>
        ) : pendingRequests.length === 0 ? (
          <p className="text-sm font-medium opacity-60 italic py-2">Žádný čtenář aktuálně nečeká na schválení licence.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-3 first:pt-0 last:pb-0">
                <div>
                  <h4 className="font-black text-sm text-slate-950 uppercase">{req.books?.title}</h4>
                  <p className="text-xs font-medium text-slate-500">Čtenář: <span className="font-bold text-slate-800">{req.profiles?.email}</span></p>
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
              className="w-full p-3 border rounded-lg bg-black/5 text-slate-900 font-bold尊 outline-none text-sm" 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Text knihy..." 
              value={content} 
              className="w-full p-3 border rounded-lg bg-black/5 text-slate-900 font-bold outline-none resize-none text-sm" 
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
              className="w-full p-3 border rounded-lg bg-white text-slate-950 font-bold text-xs"
              value={selectedBookId}
            >
              <option value="">-- Vyberte SVOU knihu --</option>
              {myBooks.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            
            <select 
              onChange={e => setSelectedUserId(e.target.value)} 
              className="w-full p-3 border rounded-lg bg-white text-slate-950 font-bold text-xs"
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
          <div className="divide-y divide-black/5 max-h-72 overflow-y-auto">
            {myBooks.map(b => (
              <div key={b.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{b.title}</h4>
                  <p className="text-[10px] uppercase opacity-50 font-bold">Autor: {b.author}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100">
                  <Heart size={14} className="fill-red-500 text-red-500" />
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
        
      // 2. Načtení profilů
      const { data: p } = await supabase.from('profiles').select('id, email, role, created_at');
      
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

      // Finální nastavení stavů bez duplicitních přepisů
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
    const nextRole = currentRole === 'správce' ? 'uživatel' : 'správce';
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', uId);
    if (!error) {
      await safeLog('WARN', `Změna role uživatele ${uId} na ${nextRole}`);
      refreshData();
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
      alert('Přístup úspěšně udělen a aktivován.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-slate-800">
      {/* Karty statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center gap-4 py-4">
          <Database className="text-indigo-600" size={24}/>
          <div>
            <h4 className="text-[10px] font-black uppercase opacity-50">Knihovny</h4>
            <p className="text-lg font-black">{books.length} Titulů v DB</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4">
          <Users className="text-purple-600" size={24}/>
          <div>
            <h4 className="text-[10px] font-black uppercase opacity-50">Uživatelé</h4>
            <p className="text-lg font-black">{profiles.length} Registrovaných</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4 bg-amber-500/5 border-amber-200">
          <UserCheck className="text-amber-600" size={24}/>
          <div>
            <h4 className="text-[10px] font-black uppercase opacity-50">Nové žádosti</h4>
            <p className="text-lg font-black text-amber-700">{pendingRequests.length} Ke schválení</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Levý sloupec */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16}/> {editingBookId ? 'Upravit digitální knihu' : 'Nová digitální kniha'}
            </h3>
            <form onSubmit={saveBook} className="space-y-3">
              <input type="text" placeholder="Název knihy..." value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" required />
              <input type="text" placeholder="Autor..." value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" />
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-50 block pl-1">Uměle přidat lajky (Prestiž)</label>
                <input 
                  type="number" 
                  placeholder="Počet lajků..." 
                  value={fakeLikes} 
                  onChange={e => setFakeLikes(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" 
                />
              </div>

              <textarea placeholder="Sem vložte čistý text knihy..." value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-medium text-slate-900 outline-none resize-none" required />
              
              <Button type="submit" className="w-full py-3 uppercase tracking-wider">
                {editingBookId ? 'Uložit změny v knize' : 'Uložit knihu do systému'}
              </Button>

              {editingBookId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingBookId(null); setTitle(''); setAuthor(''); setContent(''); setFakeLikes(0); }}
                  className="w-full py-2 text-xs text-slate-500 hover:text-black uppercase cursor-pointer bg-transparent border-none font-bold"
                >
                  Zrušit editaci
                </button>
              )}
            </form>
          </Card>

          <Card>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={16}/> Vytvořit nový účet</h3>
            <form onSubmit={createNewUser} className="space-y-3">
              <input name="email" type="email" placeholder="E-mail nového uživatele..." className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold outline-none" required />
              <input name="password" type="password" placeholder="Počáteční heslo..." className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold outline-none" required />
              <Button type="submit" className="w-full py-3 uppercase tracking-wider bg-emerald-600 text-white border-none hover:bg-emerald-700">Vytvořit účet</Button>
            </form>
          </Card>

          <Card className="border-2 border-indigo-600 bg-indigo-50/5">
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2 text-indigo-600"><UserCheck size={16}/> Distribuce a přímá aktivace</h3>
            
            <div className="space-y-3">
              <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className="w-full p-2.5 border border-black/10 rounded-lg bg-white text-slate-950 font-bold text-xs">
                <option value="">-- Zvolte knihu pro distribuci --</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>

              <button  
                onClick={assignSelectedBookToAllUsers}
                className="w-full text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none font-black rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
              >
                📢 Aktivovat tuto knihu VŠEM uživatelům
              </button>
              
              {activeUser && (
                <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                  <p className="text-xs font-bold truncate text-indigo-600">Vybraný uživatel: {activeUser.email}</p>
                  <div className="flex gap-2">
                    <Button onClick={assignBookToUser} className="flex-1 text-xs py-2 bg-indigo-600 text-white border-none uppercase hover:bg-indigo-700">Aktivovat vybranou</Button>
                    <Button variant="secondary" onClick={() => setActiveUser(null)} className="text-xs py-2">Zrušit výběr</Button>
                  </div>
                  <button  
                    onClick={assignAllBooksToUser}
                    className="w-full text-xs py-2 bg-purple-600 hover:bg-purple-700 text-white border-none font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    ✨ Aktivovat mu VŠECHNY knihy z DB
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Pravý sloupec */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SEKCE: ŽÁDOSTI O LICENCE KE SCHVÁLENÍ */}
          <Card className="border-2 border-amber-400 bg-amber-50/10 p-0 overflow-hidden">
            <div className="p-4 bg-amber-500/10 border-b border-amber-200 font-black text-xs uppercase tracking-wider text-amber-800 flex justify-between items-center">
              <span>📥 Čekající žádosti o licenci ke schválení</span>
              <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded text-[10px]">{pendingRequests.length}</span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-black/5">
              {pendingRequests.length === 0 ? (
                <p className="text-center py-6 text-xs font-bold opacity-50 text-slate-500">Žádné nové žádosti o licenci nejsou hlášeny.</p>
              ) : (
                pendingRequests.map(req => {
                  const userEmail = req.profiles?.email || `Uživatel (ID: ${req.user_id?.substring(0, 5)}...)`;
                  const bookTitle = req.books?.title || `Kniha (ID: ${req.book_id?.substring(0, 5)}...)`;

                  return (
                    <div key={req.id} className="p-3 flex items-center justify-between text-xs font-bold hover:bg-amber-50/20 transition-colors gap-4">
                      <div className="truncate flex-1">
                        <p className="text-slate-900 truncate">{userEmail}</p>
                        <p className="text-[10px] text-indigo-600 truncate mt-0.5">žádá o knihu: <span className="font-black uppercase">{bookTitle}</span></p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => approveRequest(req.id, userEmail, bookTitle)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded border-none cursor-pointer transition-colors"
                        >
                          Schválit
                        </button>
                        <button 
                          onClick={() => rejectRequest(req.id, userEmail, bookTitle)}
                          className="px-2 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-black text-[10px] uppercase rounded border-none cursor-pointer transition-colors"
                        >
                          Odmítnout
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-black/5 font-black text-xs uppercase tracking-wider">Správa čtenářských licencí a účtů</div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-black/[0.02] font-black uppercase opacity-60 border-b border-black/5">
                    <th className="p-3">Uživatel</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors font-bold">
                      <td className="p-3 truncate max-w-[180px]">{p.email}</td>
                      <td className="p-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase ${p.role === 'správce' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{p.role}</span>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setActiveUser(p)} className="text-[9px] px-2 py-1 uppercase"><Plus size={10}/> Vybrat</Button>
                        <button onClick={() => toggleRole(p.id, p.role)} className="p-1 border-none bg-transparent cursor-pointer text-slate-500 hover:text-slate-900" title="Změnit roli"><Shield size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* INVENTÁŘ TITULŮ */}
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-black/5 font-black text-xs uppercase tracking-wider">Inventář titulů (Katalog)</div>
            <div className="p-3 max-h-48 overflow-y-auto space-y-1.5">
              {books.map(b => (
                <div key={b.id} className="flex justify-between items-center p-2 rounded bg-black/[0.02] text-xs font-bold gap-4">
                  <span className="truncate flex-1">
                    {b.title} <span className="opacity-40 font-normal">({b.author})</span>
                  </span>
                  
                  <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 text-[10px] shrink-0">
                    <Heart size={10} className="fill-red-500 text-red-500" />
                    <span>{b.likesCount}</span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => startEditBook(b)}
                      className="text-indigo-600 bg-transparent border-none cursor-pointer hover:text-indigo-800 font-bold text-sm"
                      title="Upravit knihu"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={async () => { if(confirm('Odstranit knihu z databáze?')) { await supabase.from('books').delete().eq('id', b.id); refreshData(); } }} 
                      className="text-red-600 bg-transparent border-none cursor-pointer hover:text-red-800 flex items-center"
                      title="Smazat knihu"
                    >
                      <Trash size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Core syslog */}
          <Card className="bg-slate-950 text-emerald-400 font-mono p-4 border border-slate-900 shadow-2xl">
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
                <Route path="/app" element={<ProtectedUserRoute><UserLibrary /></ProtectedUserRoute>} />
                <Route path="/read/:id" element={<ProtectedUserRoute><ReaderPage /></ProtectedUserRoute>} />
                <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                <Route path="/publisher" element={<ProtectedUserRoute><PublisherDashboard /></ProtectedUserRoute>} />
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

