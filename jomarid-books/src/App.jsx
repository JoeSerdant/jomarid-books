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
const Trash = getIcon('Trash'); // Přidáno, aby AdminDashboard nekřičel
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase.from('user_books').select('books(id, title, author)').eq('user_id', user.id).then(({ data }) => {
        setBooks(data?.map(i => i.books).filter(Boolean) || []);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-black/5">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Moje schválené svazky</h2>
          <p className="text-xs opacity-60 mt-0.5">Přihlášen: {user?.email}</p>
        </div>
        <Button variant="danger" onClick={logout} className="text-xs"><LogOut size={14}/> Odhlásit</Button>
      </div>

      {books.length === 0 ? (
        <Card className="text-center py-12 opacity-80">
          <BookOpen className="mx-auto opacity-30 mb-2" size={40} />
          <p className="font-bold text-sm uppercase">K vašemu účtu nebyly dosud přiřazeny žádné licenční tituly.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {books.map(b => (
            <Link to={`/read/${b.id}`} key={b.id} className="no-underline text-current">
              <Card className="hover:scale-[1.02] cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="aspect-[3/4] bg-black/5 rounded-lg mb-4 flex items-center justify-center"><Book size={32} className="opacity-20" /></div>
                  <h4 className="font-black uppercase tracking-tight text-sm line-clamp-2">{b.title}</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs uppercase font-medium mt-1">{b.author}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/5 text-[10px] font-black uppercase flex items-center justify-between text-emerald-600">
                  <span>Otevřít knihu</span> <ChevronRight size={12}/>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const ReaderPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function verifyAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: access } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('book_id', id)
        .single();

      if (!access) {
        setErr('Nemáte k této knize aktivní přístupovou licenci.');
        setLoading(false);
        return;
      }

      const { data: b } = await supabase.from('books').select('title, author, content').eq('id', id).single();
      setBook(b);
      setLoading(false);
    }

    verifyAndLoad();

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

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto"/></div>;
  if (err) return <div className="max-w-sm mx-auto py-20 px-4"><Card className="text-center font-bold text-red-600">{err}</Card></div>;

  return (
    <div 
      className="max-w-3xl mx-auto py-12 px-4"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      <Link to="/app" className="text-xs uppercase font-bold no-underline opacity-50 hover:opacity-100 flex items-center gap-1 text-current mb-4">← Zpět do knihovny</Link>
      <Card className="p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest opacity-20 flex items-center gap-1"><Shield size={10}/> Chráněný náhled</div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{book?.title}</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs font-black uppercase tracking-wider mb-8 pb-4 border-b border-black/5">{book?.author}</p>
        <div className="text-base leading-relaxed whitespace-pre-line text-justify font-medium">{book?.content}</div>
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

  useEffect(() => {
    if (!user) return;

    const username = getUsername(user.email);

    supabase.from('books').select('*').then(({ data, error }) => {
      if (!error && data) {
        const filteredBooks = data.filter(book => book.author === username);
        setMyBooks(filteredBooks);
      }
    });

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
      
      const { data } = await supabase.from('books').select('*');
      if (data) {
        setMyBooks(data.filter(book => book.author === username));
      }
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
    // OPRAVA CSS: Nastaveno dynamické chování podle vybraného motivu (SaaS / Dark / Emerald)
    <div style={{ color: 'var(--text-body)' }} className="max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-black uppercase mb-8 tracking-tight">Nakladatelský Panel</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FORMULÁŘ - Používá globální styl Card z tvého kódu */}
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
        
        {/* LICENCE - Používá globální styl Card z tvého kódu */}
        <Card>
          <h3 className="font-bold mb-4 text-lg uppercase tracking-tight">Přiřadit licenci čtenáři</h3>
          <div className="space-y-3">
            <select 
              onChange={e => setSelectedBookId(e.target.value)} 
              className="w-full p-3 border rounded-lg bg-white text-slate-950 font-bold text-xs"
            >
              <option value="">-- Vyberte SVOU knihu --</option>
              {myBooks.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            
            <select 
              onChange={e => setSelectedUserId(e.target.value)} 
              className="w-full p-3 border rounded-lg bg-white text-slate-950 font-bold text-xs"
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

  const createNewUser = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    if (!email) return alert('Zadej e-mail');

    const { data, error } = await supabase.auth.signUp({
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

  const refreshData = async () => {
    const { data: b } = await supabase.from('books').select('id, title, author');
    const { data: p } = await supabase.from('profiles').select('id, email, role, created_at');
    const { data: l } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(15);
    setBooks(b || []); 
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

  const createBook = async (e) => {
    e.preventDefault();
    console.log("Pokus o uložení knihy...", { title, author, content });
    if (!title || !content) return alert('Doplňte název a text.');
    
    const { error } = await supabase.from('books').insert([{ title, author: author || 'Neznámý', content }]);
    
    if (!error) {
      await supabase.from('system_logs').insert([{ log_type: 'SUCCESS', message: `Uložena kniha: ${title}` }]);
      setTitle(''); setAuthor(''); setContent(''); refreshData();
      alert('Kniha byla úspěšně uložena do systému!');
    } else {
      console.error("Chyba při ukládání knihy:", error);
      alert('Chyba databáze: ' + error.message);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
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
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2"><Plus size={16}/> Nová digitální kniha</h3>
            <form onSubmit={createBook} className="space-y-3">
              <input type="text" placeholder="Název knihy..." value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" required />
              <input type="text" placeholder="Autor..." value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-bold text-slate-900 outline-none" />
              <textarea placeholder="Sem vložte čistý text knihy..." value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full p-3 border border-black/10 rounded-lg bg-black/5 text-sm font-medium text-slate-900 outline-none resize-none" required />
              <Button type="submit" className="w-full py-3 uppercase tracking-wider">Uložit knihu do systému</Button>
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

          {activeUser && (
            <Card className="border-2 border-indigo-600 bg-indigo-50/5">
              <h3 className="text-sm font-black uppercase tracking-wider mb-1 flex items-center gap-2 text-indigo-600"><UserCheck size={16}/> Schvalování přístupu</h3>
              <p className="text-xs font-bold mb-3 truncate">Pro: {activeUser.email}</p>
              <div className="space-y-3">
                <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className="w-full p-2.5 border border-black/10 rounded-lg bg-white text-slate-950 font-bold text-xs">
                  <option value="">-- Zvolte knihu pro přidělení --</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button onClick={assignBookToUser} className="flex-1 text-xs py-2 bg-indigo-600 text-white border-none uppercase">Schválit vybranou</Button>
                    <Button variant="secondary" onClick={() => setActiveUser(null)} className="text-xs py-2">Zavřít</Button>
                  </div>
                  <button 
                    onClick={assignAllBooksToUser}
                    className="w-full text-xs py-2 bg-purple-600 hover:bg-purple-700 text-white border-none font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    ✨ Přidělit uživateli VŠECHNY knihy
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

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
                        <Button variant="secondary" onClick={() => setActiveUser(p)} className="text-[9px] px-2 py-1 uppercase"><Plus size={10}/> Přidělit licenci</Button>
                        <button onClick={() => toggleRole(p.id, p.role)} className="p-1 border-none bg-transparent cursor-pointer text-slate-500 hover:text-slate-900" title="Změnit roli"><Shield size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-black/5 font-black text-xs uppercase tracking-wider">Inventář titulů (Katalog)</div>
            <div className="p-3 max-h-32 overflow-y-auto space-y-1.5">
              {books.map(b => (
                <div key={b.id} className="flex justify-between items-center p-2 rounded bg-black/2 text-xs font-bold">
                  <span className="truncate pr-4">{b.title} <span className="opacity-40 font-normal">({b.author})</span></span>
                  <button onClick={async () => { if(confirm('Odstranit knihu z databáze?')) { await supabase.from('books').delete().eq('id', b.id); refreshData(); } }} className="text-red-600 bg-transparent border-none cursor-pointer"><Trash size={12}/></button>
                </div>
              ))}
            </div>
          </Card>

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

