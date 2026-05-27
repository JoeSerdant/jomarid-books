import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { supabase } from './lib/supabase';

// Pomocná funkce pro ikony
const getIcon = (name) => Icons[name] || Icons.Book || Icons.HelpCircle;

// Definice ikon (všechny pod vlastním jménem)
const Book = getIcon('Book');
const Lock = getIcon('Lock');
const Plus = getIcon('Plus');
const ShieldCheck = getIcon('ShieldCheck');
const Trash2 = getIcon('Trash2');
const Loader2 = getIcon('Loader2');
const ChevronRight = getIcon('ChevronRight');
const LogOut = getIcon('LogOut');
const Library = getIcon('Library');
const Search = getIcon('Search');
const X = getIcon('X');
const Settings = getIcon('Settings');
const Terminal = getIcon('Terminal');
const Database = getIcon('Database');
const Users = getIcon('Users');
const AlertTriangle = getIcon('AlertTriangle');
const UserCheck = getIcon('UserCheck');
const Shield = getIcon('Shield');
const BookOpen = getIcon('BookOpen');
const Phone = getIcon('Phone');
const Trash = getIcon('Trash'); 
const Heart = getIcon('Heart'); // <-- Tímto se opravila ta chyba "Cannot access 's' before initialization"

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

const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider mb-6">
        <Library size={14} /> Výběrová digitální edice
      </div>
      <h1 className="text-5xl font-black uppercase tracking-tight mb-6 leading-none">Exkluzivní literární díla <br/><span style={{ color: 'var(--bg-primary)' }}>na dosah ruky</span></h1>
      <p style={{ color: 'var(--text-muted)' }} className="text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
        Vítejte v privátním fondu Jomarid Books. Nabízíme kurátorovaný výběr odborné, umělecké a prémiové literatury v digitální podobě přes dedikované Cloud-to-Screen rozhraní zajišťující plynulé čtení.
      </p>
      <Card className="max-w-md mx-auto p-6 border-2 border-dashed flex flex-col items-center">
        <Phone size={32} style={{ color: 'var(--bg-primary)' }} className="mb-3" />
        <h3 className="font-black uppercase tracking-tight text-sm mb-1">Nemáte zřízený přístup?</h3>
        <p className="text-xs opacity-70 mb-4 text-center">Pro vytvoření čtenářského účtu a schválení licencí ke knihám kontaktujte přímo vydavatelství.</p>
        <a href="tel:+420734657232" className="text-lg font-black tracking-wider text-current no-underline hover:underline">+420 734 657 232</a>
      </Card>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/app" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError('Neplatný e-mail nebo přístupové heslo.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-sm mx-auto py-24 px-4">
      <Card>
        <h2 className="text-xl font-black text-center uppercase tracking-tight mb-6">Vstup do čítárny</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="E-mailová adresa" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" required />
          <input type="password" placeholder="Přístupové heslo" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" required />
          {error && <p className="text-red-600 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12}/> {error}</p>}
          <Button type="submit" disabled={loading} className="w-full py-3 uppercase tracking-wider">{loading ? 'Ověřování...' : 'Odemknout čítárnu'}</Button>
        </form>
      </Card>
    </div>
  );
};


const UserLibrary = () => {
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [likedBookIds, setLikedBookIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Načtení knih i lajků uživatele najednou
  useEffect(() => {
    if (!user) return;

    const loadLibraryData = async () => {
      setLoading(true);
      try {
        // 1. Načtení schválených knih
        const { data: userBooksData } = await supabase
          .from('user_books')
          .select('books(id, title, author)')
          .eq('user_id', user.id);
        
        const filteredBooks = userBooksData?.map(i => i.books).filter(Boolean) || [];
        setBooks(filteredBooks);

        // 2. Načtení lajkovaných knih aktuálního uživatele
        const { data: likesData } = await supabase
          .from('book_likes')
          .select('book_id')
          .eq('user_id', user.id);
          
        if (likesData) {
          setLikedBookIds(likesData.map(l => l.book_id));
        }
      } catch (error) {
        console.error("Chyba při načítání dat knihovny:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLibraryData();
  }, [user]);

  // Funkce pro přidání/odebrání lajku (Toggle Like)
  const toggleLike = async (e, bookId) => {
    // Zabráníme tomu, aby kliknutí na srdíčko spustilo Link a otevřelo čtečku
    e.preventDefault();
    e.stopPropagation();

    if (!user) return alert('Pro lajkování se musíš přihlásit.');

    const isLiked = likedBookIds.includes(bookId);

    if (isLiked) {
      // ODEBRAT LAJK
      const { error } = await supabase
        .from('book_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId);

      if (!error) {
        setLikedBookIds(prev => prev.filter(id => id !== bookId));
      } else {
        alert('Chyba při odebírání lajku: ' + error.message);
      }
    } else {
      // PŘIDAT LAJK
      const { error } = await supabase
        .from('book_likes')
        .insert([{ user_id: user.id, book_id: bookId }]);

      if (!error) {
        setLikedBookIds(prev => [...prev, bookId]);
      } else {
        alert('Chyba při přidávání lajku: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hlavička */}
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-black/5">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Moje schválené svazky</h2>
          <p className="text-xs opacity-60 mt-0.5">Přihlášen: {user?.email}</p>
        </div>
        <Button variant="danger" onClick={logout} className="text-xs">
          <LogOut size={14}/> Odhlásit
        </Button>
      </div>

      {/* Prázdná knihovna */}
      {books.length === 0 ? (
        <Card className="text-center py-12 opacity-80">
          <BookOpen className="mx-auto opacity-30 mb-2" size={40} />
          <p className="font-bold text-sm uppercase">K vašemu účtu nebyly dosud přiřazeny žádné licenční tituly.</p>
        </Card>
      ) : (
        /* Mřížka knih */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {books.map(b => {
            const isLiked = likedBookIds.includes(b.id);

            return (
              <Link to={`/read/${b.id}`} key={b.id} className="no-underline text-current">
                <Card className="hover:scale-[1.02] transition-transform cursor-pointer h-full flex flex-col justify-between relative group">
                  <div>
                    {/* Náhled knihy a absolutně umístěné srdíčko */}
                    <div className="aspect-[3/4] bg-black/5 rounded-lg mb-4 flex items-center justify-center relative">
                      <Book size={32} className="opacity-20" />
                      
                      {/* Tlačítko pro lajk */}
                      <button 
                        onClick={(e) => toggleLike(e, b.id)}
                        className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full border-none cursor-pointer transition-transform active:scale-95 shadow-sm z-10"
                      >
                        <Heart 
                          size={16} 
                          className={isLiked ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500 transition-colors"} 
                        />
                      </button>
                    </div>

                    <h4 className="font-black uppercase tracking-tight text-sm line-clamp-2 pr-6">{b.title}</h4>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-medium mt-1">{b.author}</p>
                  </div>

                  {/* Spodní lišta karty */}
                  <div className="mt-4 pt-3 border-t border-black/5 text-[10px] font-black uppercase flex items-center justify-between text-emerald-600">
                    <span>Otevřít knihu</span> 
                    <ChevronRight size={12}/>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ReaderPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function verifyAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUserId(currentUserId);
      
      // Verification of active license
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

      // Load book content
      const { data: b } = await supabase.from('books').select('title, author, content').eq('id', id).single();
      setBook(b);

      // Check if user already liked this book
      if (currentUserId) {
        const { data: like } = await supabase
          .from('book_likes')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('book_id', id)
          .maybeSingle(); // maybeSingle nevyhodí chybu, pokud řádek neexistuje

        if (like) setIsLiked(true);
      }

      setLoading(false);
    }

    verifyAndLoad();

    // Anti-copy shortcut protection
    const blockShortcuts = (e) => {
      if (
        (e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'a') || 
        (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.key === 's') || 
        (e.metaKey && e.key === 'c') || (e.metaKey && e.key === 'a') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('keydown', blockShortcuts);
    return () => window.removeEventListener('keydown', blockShortcuts);
  }, [id]);

  // Funkce pro lajkování přímo uvnitř čtečky
  const toggleLike = async () => {
    if (!userId) return alert('Pro lajkování se musíš přihlásit.');

    if (isLiked) {
      // ODEBRAT LAJK
      const { error } = await supabase
        .from('book_likes')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', id);

      if (!error) setIsLiked(false);
    } else {
      // PŘIDAT LAJK
      const { error } = await supabase
        .from('book_likes')
        .insert([{ user_id: userId, book_id: id }]);

      if (!error) setIsLiked(true);
    }
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto"/></div>;
  if (err) return <div className="max-w-sm mx-auto py-20 px-4"><Card className="text-center font-bold text-red-600">{err}</Card></div>;

  return (
    <div 
      className="max-w-3xl mx-auto py-12 px-4"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      <Link to="/app" className="text-xs uppercase font-bold no-underline opacity-50 hover:opacity-100 flex items-center gap-1 text-current mb-4">
        ← Zpět do knihovny
      </Link>
      
      <Card className="p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest opacity-20 flex items-center gap-1">
          <Shield size={10}/> Chráněný náhled
        </div>

        {/* Flexbox rozvržení pro název a tlačítko lajku */}
        <div className="flex justify-between items-start gap-4 mb-1">
          <h1 className="text-3xl font-black uppercase tracking-tight line-clamp-2 flex-1">
            {book?.title}
          </h1>
          
          {/* Tlačítko pro Lajk */}
          <button 
            onClick={toggleLike}
            className="p-2.5 bg-black/5 hover:bg-black/10 rounded-full border-none cursor-pointer transition-all active:scale-95 shrink-0"
            title={isLiked ? "Odebrat z oblíbených" : "Označit jako líbí se mi"}
          >
            <Heart 
              size={20} 
              className={isLiked ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500 transition-colors"} 
            />
          </button>
        </div>

        <p 
          style={{ color: 'var(--text-muted)' }} 
          className="text-xs font-black uppercase tracking-wider mb-8 pb-4 border-b border-black/5"
        >
          {book?.author}
        </p>

        <div className="text-base leading-relaxed whitespace-pre-line text-justify font-medium">
          {book?.content}
        </div>
      </Card>
    </div>
  );
};

const PublisherDashboard = () => {
  const [myBooks, setMyBooks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
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
        book_likes(count)
      `)
      .eq('author', username);

    if (!error && data) {
      // Supabase vrátí pole objektů, tak ho mapujeme na čistější strukturu
      const booksWithLikes = data.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        likesCount: book.book_likes?.[0]?.count || 0
      }));
      setMyBooks(booksWithLikes);
    }
  };

  useEffect(() => {
    if (!user) return;

    const username = getUsername(user.email);
    fetchPublisherBooks(username);

    supabase.from('profiles').select('id, email').then(({ data }) => {
      setProfiles(data || []);
    });
  }, [user]);

  const createBook = async (e) => {
    e.preventDefault();
    if (!title || !content) return alert('Doplňte název a text knihy.');

    const username = getUsername(user.email);

    const { error } = await supabase.from('books').insert([{ 
      title, 
      content, 
      author: username 
    }]);

    if (!error) {
      alert('Kniha úspěšně publikována!');
      setTitle(''); 
      setContent('');
      
      // Znovu načteme aktualizovaný seznam knih i s lajky (bude mít 0 lajků)
      fetchPublisherBooks(username);
    } else {
      alert('Chyba při publikování: ' + error.message);
    }
  };

  const assignBook = async () => {
    if (!selectedBookId || !selectedUserId) return alert('Vyberte knihu a uživatele');
    
    const { error } = await supabase.from('user_books').insert([{ 
      user_id: selectedUserId, 
      book_id: selectedBookId 
    }]);
    
    if (error) alert('Chyba nebo uživatel již tuto knihu má: ' + error.message);
    else alert('Kniha byla úspěšně přiřazena uživateli!');
  };

  return (
    <div style={{ color: 'var(--text-body)' }} className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">Nakladatelský Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FORMULÁŘ */}
        <Card>
          <h3 className="font-bold mb-4 text-lg uppercase tracking-tight">Vložit novou knihu</h3>
          <form onSubmit={createBook} className="space-y-4">
            <input 
              type="text" 
              placeholder="Název knihy" 
              value={title} 
              className="w-full p-3 border rounded-lg bg-black/5 text-slate-900 font-bold outline-none" 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Text knihy..." 
              value={content} 
              className="w-full p-3 border rounded-lg bg-black/5 text-slate-900 font-bold outline-none resize-none" 
              rows={6} 
              onChange={e => setContent(e.target.value)} 
              required 
            />
            <Button type="submit" className="w-full py-3 uppercase tracking-wider">
              Publikovat knihu
            </Button>
          </form>
        </Card>
        
        {/* LICENCE */}
        <Card>
          <h3 className="font-bold mb-4 text-lg uppercase tracking-tight">Přiřadit licenci čtenáři</h3>
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
              className="w-full py-3 bg-purple-600 border-none text-white font-bold uppercase text-xs"
            >
              Přiřadit knihu
            </Button>
          </div>
        </Card>
      </div>

      {/* STATISTIKY VYDANÝCH KNIH */}
      <Card>
        <h3 className="font-bold mb-4 text-lg uppercase tracking-tight flex items-center gap-2">
          <BookOpen size={20} /> Moje vydané tituly a statistiky
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
                  <span className="font-black text-xs">{b.likesCount}</span>
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
  const [logs, setLogs] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);

  const refreshData = async () => {
    // Upraveno: Načítáme knihy i s agregovaným počtem lajků z tabulky book_likes
    const { data: b } = await supabase
      .from('books')
      .select('id, title, author, book_likes(count)');
      
    const { data: p } = await supabase.from('profiles').select('id, email, role, created_at');
    const { data: l } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(15);
    
    // Namapujeme data knih tak, aby obsahovala přímé číslo likesCount
    const booksWithLikes = b?.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      likesCount: book.book_likes?.[0]?.count || 0
    })) || [];

    setBooks(booksWithLikes); 
    setProfiles(p || []); 
    setLogs(l || []);
  };

  useEffect(() => {
    refreshData();
    const sub = supabase.channel('sys_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, payload => {
        setLogs(prev => [payload.new, ...prev]);
      }).subscribe();
    
    return () => { supabase.removeChannel(sub); };
  }, []);

  const saveBook = async (e) => {
    e.preventDefault();
    if (!title) return alert('Doplňte název knihy.');

    if (editingBookId) {
      // REŽIM ÚPRAVA
      const { error } = await supabase
        .from('books')
        .update({ title, author: author || 'Neznámý', content })
        .eq('id', editingBookId);
        
      if (!error) {
        await supabase.from('system_logs').insert([{ log_type: 'SUCCESS', message: `Upravena kniha: ${title}` }]);
        alert('Kniha byla úspěšně aktualizována!');
        setEditingBookId(null);
      } else {
        alert('Chyba při úpravě: ' + error.message);
      }
    } else {
      // REŽIM NOVÁ KNIHA
      if (!content) return alert('Doplňte text knihy.');
      const { error } = await supabase
        .from('books')
        .insert([{ title, author: author || 'Neznámý', content }]);
        
      if (!error) {
        await supabase.from('system_logs').insert([{ log_type: 'SUCCESS', message: `Uložena kniha: ${title}` }]);
        alert('Kniha byla úspěšně uložena do systému!');
      } else {
        alert('Chyba při ukládání: ' + error.message);
      }
    }
    
    setTitle(''); setAuthor(''); setContent('');
    refreshData();
  };

  const startEditBook = async (book) => {
    const { data, error } = await supabase.from('books').select('content').eq('id', book.id).single();
    if (!error && data) {
      setEditingBookId(book.id);
      setTitle(book.title);
      setAuthor(book.author);
      setContent(data.content || '');
    } else {
      alert('Nepodařilo se načíst text knihy k editaci.');
    }
  };

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
      alert('Uživatel vytvořen! Pokud vyžaduješ potvrzení e-mailu, zkontroluj schránku.');
      e.target.reset();
      refreshData();
    }
  };

  const toggleRole = async (uId, currentRole) => {
    const nextRole = currentRole === 'správce' ? 'uživatel' : 'správce';
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', uId);
    if (!error) {
      await supabase.from('system_logs').insert([{ log_type: 'WARN', message: `Změna role uživatele ${uId} na ${nextRole}` }]);
      refreshData();
    }
  };

  const assignBookToUser = async () => {
    if (!activeUser || !selectedBookId) return;
    const { error } = await supabase.from('user_books').insert([{ user_id: activeUser.id, book_id: selectedBookId }]);
    
    if (error) {
      alert('Tento uživatel již k této knize přístup má.');
    } else {
      await supabase.from('system_logs').insert([{ log_type: 'SUCCESS', message: `Přiřazena kniha uživateli ${activeUser.email}` }]);
      alert('Přístup úspěšně schválen a zapsán do DB.');
      setSelectedBookId('');
    }
  };

  const assignAllBooksToUser = async () => {
    if (!activeUser || books.length === 0) return;
    if (!confirm(`Opravdu chcete uživateli ${activeUser.email} přidělit licenci ke VŠEM knihám najednou?`)) return;

    const insertData = books.map(b => ({
      user_id: activeUser.id,
      book_id: b.id
    }));

    const { error } = await supabase
      .from('user_books')
      .upsert(insertData, { onConflict: 'user_id,book_id' });

    if (error) {
      alert('Chyba při hromadném přiřazování: ' + error.message);
    } else {
      await supabase.from('system_logs').insert([{ log_type: 'SUCCESS', message: `Hromadně schváleny VŠECHNY knihy pro: ${activeUser.email}` }]);
      alert('Všechny dostupné knihy byly úspěšně schváleny!');
    }
  };

  const assignSelectedBookToAllUsers = async () => {
    if (!selectedBookId) return alert('Nejprve zvolte knihu z rozevíracího seznamu.');
    const selectedBook = books.find(b => b.id === selectedBookId);
    if (!selectedBook) return;

    if (!confirm(`Opravdu chcete knihu "${selectedBook.title}" zpřístupnit VŠEM registrovaným uživatelům?`)) return;

    const insertData = profiles.map(p => ({
      user_id: p.id,
      book_id: selectedBookId
    }));

    if (insertData.length === 0) return alert('V systému nejsou žádní uživatelé.');

    const { error } = await supabase
      .from('user_books')
      .upsert(insertData, { onConflict: 'user_id,book_id' });

    if (error) {
      alert('Chyba při hromadném sdílení knihy: ' + error.message);
    } else {
      await supabase.from('system_logs').insert([{ log_type: 'SUCCESS', message: `Kniha "${selectedBook.title}" byla globálně přidělena všem uživatelům.` }]);
      alert(`Kniha "${selectedBook.title}" byla úspěšně přidělena všem uživatelům!`);
      setSelectedBookId('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
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
        <Card className="flex items-center gap-4 py-4">
          <Shield className="text-emerald-600" size={24}/>
          <div>
            <h4 className="text-[10px] font-black uppercase opacity-50">Ochrana</h4>
            <p className="text-sm font-black text-emerald-600 uppercase mt-1">Cloud text locked</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leví sloupec - Formuláře */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16}/> {editingBookId ? 'Upravit digitální knihu' : 'Nová digitální kniha'}
            </h3>
            <form onSubmit={saveBook} className="space-y-3">
              <input type="text" placeholder="Název knihy..." value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" required />
              <input type="text" placeholder="Autor..." value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" />
              <textarea placeholder="Sem vložte čistý text knihy..." value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-medium text-slate-900 outline-none resize-none" required />
              
              <Button type="submit" className="w-full py-3 uppercase tracking-wider">
                {editingBookId ? 'Uložit změny v knize' : 'Uložit knihu do systému'}
              </Button>

              {editingBookId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingBookId(null); setTitle(''); setAuthor(''); setContent(''); }}
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
              <Button type="submit" className="w-full py-3 uppercase tracking-wider bg-emerald-600 text-white border-none">Vytvořit účet</Button>
            </form>
          </Card>

          <Card className="border-2 border-indigo-600 bg-indigo-50/5">
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2 text-indigo-600"><UserCheck size={16}/> Distribuce licencí</h3>
            
            <div className="space-y-3">
              <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className="w-full p-2.5 border border-black/10 rounded-lg bg-white text-slate-950 font-bold text-xs">
                <option value="">-- Zvolte knihu pro distribuci --</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>

              <button  
                onClick={assignSelectedBookToAllUsers}
                className="w-full text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none font-black rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
              >
                📢 Přidělit tuto knihu VŠEM uživatelům
              </button>
              
              {activeUser && (
                <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                  <p className="text-xs font-bold truncate text-indigo-600">Vybraný uživatel: {activeUser.email}</p>
                  <div className="flex gap-2">
                    <Button onClick={assignBookToUser} className="flex-1 text-xs py-2 bg-indigo-600 text-white border-none uppercase">Schválit vybranou</Button>
                    <Button variant="secondary" onClick={() => setActiveUser(null)} className="text-xs py-2">Zrušit výběr</Button>
                  </div>
                  <button  
                    onClick={assignAllBooksToUser}
                    className="w-full text-xs py-2 bg-purple-600 hover:bg-purple-700 text-white border-none font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    ✨ Přidělit mu VŠECHNY knihy z DB
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Pravý sloupec - Tabulky a přehledy */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-black/5 font-black text-xs uppercase tracking-wider">Správa čtenářských licencí a účtů</div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-black/2 font-black uppercase opacity-60 border-b border-black/5">
                    <th className="p-3">Uživatel</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} className="border-b border-black/5 hover:bg-black/2 transition-colors font-bold">
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

          {/* ZDE JE UPRAVENÝ INVENTÁŘ S POČTY LAJKŮ */}
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-black/5 font-black text-xs uppercase tracking-wider">Inventář titulů (Katalog)</div>
            <div className="p-3 max-h-48 overflow-y-auto space-y-1.5">
              {books.map(b => (
                <div key={b.id} className="flex justify-between items-center p-2 rounded bg-black/2 text-xs font-bold gap-4">
                  <span className="truncate flex-1">
                    {b.title} <span className="opacity-40 font-normal">({b.author})</span>
                  </span>
                  
                  {/* Indikátor počtu lajků */}
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

          {/* Postgres core syslog */}
          <Card className="bg-slate-950 text-emerald-400 font-mono p-4 border border-slate-900 shadow-2xl">
            <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase text-slate-400 tracking-widest pb-2 border-b border-slate-900">
              <span className="flex items-center gap-1"><Terminal size={12} /> Postgres Live Core Syslog</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="space-y-1 text-[11px] max-h-36 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id}>
                  <span className="text-slate-500">[{new Date(log.created_at).toLocaleTimeString()}]</span>{' '}
                  <span className={log.log_type === 'ERROR' ? 'text-red-500 font-bold' : log.log_type === 'WARN' ? 'text-amber-500 font-bold' : 'text-emerald-400'}>{log.log_type}</span>: {log.message}
                </div>
              ))}
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

