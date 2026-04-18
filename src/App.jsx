import { useState, useEffect, useCallback } from "react";
import {
  getPosts, savePost, deletePost, togglePostField,
  addComment, approveComment, deleteComment,
  getVoices, addVoice, toggleVoiceFeatured, deleteVoice,
  getReading, addBook, deleteBook,
  getSetting, setSetting,
} from "./supabase.js";

/* ─── FONTS + GLOBAL CSS ─────────────────────────────────────── */
const GlobalStyles = ({ dark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'DM Sans', sans-serif; background: ${dark ? '#0F172A' : '#FFFFFF'}; transition: background 0.3s, color 0.3s; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${dark ? '#1E293B' : '#F8FAFB'}; }
    ::-webkit-scrollbar-thumb { background: #4FC3F7; border-radius: 2px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .fade-up { animation: fadeUp 0.45s ease forwards; }
    .fade-in { animation: fadeIn 0.35s ease forwards; }
    .slide-down { animation: slideDown 0.25s ease forwards; }
    img { max-width: 100%; }
    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
      .show-mobile { display: flex !important; }
      .stack-mobile { flex-direction: column !important; }
      .full-mobile { grid-template-columns: 1fr !important; }
      .pad-mobile { padding: 32px 16px !important; }
    }
    @media (min-width: 769px) {
      .show-mobile { display: none !important; }
    }
  `}</style>
);

/* ─── THEME ──────────────────────────────────────────────────── */
const getT = (dark) => ({
  bg:       dark ? '#0F172A' : '#FFFFFF',
  soft:     dark ? '#1E293B' : '#F8FAFB',
  card:     dark ? '#1E293B' : '#FFFFFF',
  charcoal: dark ? '#F1F5F9' : '#1A1A2E',
  mid:      dark ? '#94A3B8' : '#6B7280',
  border:   dark ? '#334155' : '#E5E7EB',
  lightBlue:dark ? '#0C2D48' : '#E0F7FF',
  blue:     '#4FC3F7',
  blueDark: dark ? '#7DD3F8' : '#0288D1',
  gold:     '#D97706',
  navBg:    dark ? '#0F172A' : '#FFFFFF',
  footBg:   dark ? '#020617' : '#1A1A2E',
  inputBg:  dark ? '#0F172A' : '#FFFFFF',
});

/* ─── ADMIN CREDS ─────────────────────────────────────────────── */
const ADMIN_EMAIL    = "mohamedmohammud@gmail.com";
const ADMIN_PASSWORD = "Kulan@2040!";

/* ─── HOOKS ───────────────────────────────────────────────────── */
const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
};

/* ─── HELPERS ─────────────────────────────────────────────────── */
const Btn = ({ children, onClick, style = {}, outline, small, gold, T }) => {
  const t = T || getT(false);
  return (
    <button onClick={onClick} style={{
      background: gold ? t.gold : outline ? 'transparent' : t.blue,
      color: outline ? t.charcoal : '#FFFFFF',
      border: outline ? `1.5px solid ${t.border}` : 'none',
      padding: small ? '8px 16px' : '11px 24px',
      borderRadius: '6px', fontSize: small ? '12px' : '13px',
      fontFamily: "'DM Sans', sans-serif", fontWeight: '500',
      letterSpacing: '0.4px', cursor: 'pointer', transition: 'all 0.2s',
      whiteSpace: 'nowrap', ...style,
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >{children}</button>
  );
};

const Tag = ({ children, T }) => {
  const t = T || getT(false);
  return <span style={{ background: t.lightBlue, color: t.blueDark, fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>{children}</span>;
};

const Divider = ({ T }) => {
  const t = T || getT(false);
  return <div style={{ height: '1px', background: t.border, margin: '28px 0' }} />;
};

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTop: '3px solid #4FC3F7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const StarLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#4FC3F7"/>
    <polygon points="20,7 23.1,16.6 33.5,16.6 25.2,22.4 28.3,32 20,26.2 11.7,32 14.8,22.4 6.5,16.6 16.9,16.6" fill="white"/>
  </svg>
);

/* ─── SHARE BUTTONS ───────────────────────────────────────────── */
const ShareButtons = ({ title, T }) => {
  const t = T || getT(false);
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title, url });
    }
  };

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '6px', fontSize: '12px',
    fontFamily: "'DM Sans'", fontWeight: '500', cursor: 'pointer',
    border: `1px solid ${t.border}`, background: t.soft,
    color: t.charcoal, transition: 'all 0.2s',
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
      <span style={{ fontSize: '12px', color: t.mid, alignSelf: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>Share</span>
      <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank')} style={btnStyle}>
        𝕏 Twitter
      </button>
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank')} style={btnStyle}>
        WhatsApp
      </button>
      <button onClick={copyLink} style={{ ...btnStyle, background: copied ? '#D1FAE5' : t.soft, color: copied ? '#065F46' : t.charcoal, border: `1px solid ${copied ? '#6EE7B7' : t.border}` }}>
        {copied ? '✓ Copied' : 'Copy link'}
      </button>
      {typeof navigator !== 'undefined' && navigator.share && (
        <button onClick={shareNative} style={btnStyle}>Share</button>
      )}
    </div>
  );
};

/* ─── NEWSLETTER ──────────────────────────────────────────────── */
const Newsletter = ({ T, compact }) => {
  const t = T || getT(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const submit = async () => {
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      await fetch('https://formspree.io/f/xeepavdd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, _subject: 'Somalia 2040 Newsletter Signup' }),
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (compact) return (
    <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Newsletter</div>
      <p style={{ color: t.mid, fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>Updates on Somalia 2040 directly to your inbox.</p>
      {status === 'success' ? (
        <p style={{ color: '#059669', fontSize: '13px' }}>You're in. Thank you.</p>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email"
            style={{ flex: 1, padding: '9px 12px', border: `1px solid ${t.border}`, borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none', minWidth: 0 }} />
          <Btn small onClick={submit} T={t}>{status === 'loading' ? '...' : 'Join'}</Btn>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: t.charcoal === '#F1F5F9' ? '#1E293B' : '#1A1A2E', borderRadius: '16px', padding: '40px', textAlign: 'center', marginTop: '64px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Stay Connected</div>
      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: '#FFFFFF', marginBottom: '8px' }}>Join the Somalia 2040 newsletter</h3>
      <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px', lineHeight: '1.7' }}>Essays, updates, and ideas on Somalia's future. No noise. Just signal.</p>
      {status === 'success' ? (
        <p style={{ color: '#34D399', fontSize: '15px' }}>You're in. Thank you for joining.</p>
      ) : (
        <div style={{ display: 'flex', gap: '10px', maxWidth: '420px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="your@email.com" type="email"
            style={{ flex: 1, padding: '12px 16px', border: '1px solid #334155', borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '14px', background: '#0F172A', color: '#F1F5F9', outline: 'none', minWidth: '200px' }} />
          <Btn onClick={submit} T={t}>{status === 'loading' ? 'Joining...' : 'Subscribe'}</Btn>
        </div>
      )}
      {status === 'error' && <p style={{ color: '#F87171', fontSize: '13px', marginTop: '8px' }}>Something went wrong. Try again.</p>}
    </div>
  );
};

/* ─── SEARCH BAR ──────────────────────────────────────────────── */
const SearchBar = ({ value, onChange, T }) => {
  const t = T || getT(false);
  return (
    <div style={{ position: 'relative', marginBottom: '32px' }}>
      <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.charcoal} strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search posts..."
        style={{ width: '100%', padding: '11px 16px 11px 40px', border: `1.5px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', transition: 'border 0.2s' }}
        onFocus={e => e.target.style.borderColor = '#4FC3F7'}
        onBlur={e => e.target.style.borderColor = t.border}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.mid, fontSize: '18px', lineHeight: 1 }}>×</button>
      )}
    </div>
  );
};

/* ─── NAV ─────────────────────────────────────────────────────── */
const Nav = ({ page, setPage, lang, setLang, dark, setDark, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { label: lang === 'en' ? 'Vision' : 'Aragti', key: 'vision' },
    { label: 'Blog', key: 'blog' },
    { label: lang === 'en' ? 'My Story' : 'Taariikhda', key: 'story' },
    { label: lang === 'en' ? 'Reading List' : 'Buugaagta', key: 'reading' },
    { label: lang === 'en' ? "Let's Connect" : 'Xiriirka', key: 'connect' },
  ];

  const nav = (key) => { setPage(key); setMenuOpen(false); window.scrollTo(0, 0); };

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: '0 20px', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div onClick={() => nav('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StarLogo size={34} />
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: t.charcoal, fontWeight: '600', lineHeight: '1.1' }}>
                Somalia <span style={{ color: '#4FC3F7' }}>2040</span>
              </div>
              <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '600' }}>Build. Unite. Lead.</div>
            </div>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {links.map(l => (
                <span key={l.key} onClick={() => nav(l.key)} style={{ color: page === l.key ? '#4FC3F7' : t.charcoal, fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: page === l.key ? '2px solid #4FC3F7' : '2px solid transparent', paddingBottom: '3px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{l.label}</span>
              ))}
              <button onClick={() => setLang(lang === 'en' ? 'so' : 'en')} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '4px 11px', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans', color: t.charcoal, fontWeight: '600' }}>
                {lang === 'en' ? 'SO' : 'EN'}
              </button>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }} title="Toggle dark mode">
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          )}

          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>{dark ? '☀️' : '🌙'}</button>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ height: '2px', background: t.charcoal, borderRadius: '2px', transition: 'all 0.2s', width: i === 1 && menuOpen ? '14px' : '22px' }} />)}
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div className="slide-down" style={{ position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, zIndex: 99, background: t.navBg, borderTop: `1px solid ${t.border}`, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {links.map(l => (
            <div key={l.key} onClick={() => nav(l.key)} style={{ padding: '14px 0', fontSize: '18px', fontFamily: 'Playfair Display', color: page === l.key ? '#4FC3F7' : t.charcoal, cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>{l.label}</div>
          ))}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => { setLang(lang === 'en' ? 'so' : 'en'); setMenuOpen(false); }} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans', color: t.charcoal, fontWeight: '600' }}>
              {lang === 'en' ? 'Switch to Somali' : 'Switch to English'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── FOOTER ──────────────────────────────────────────────────── */
const Footer = ({ setPage, T }) => {
  const t = T;
  return (
    <footer style={{ background: t.footBg, color: '#FFFFFF', padding: '48px 20px 24px', marginTop: '64px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <StarLogo size={32} />
              <div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: '#FFFFFF', lineHeight: '1.1' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span></div>
                <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '600' }}>Build. Unite. Lead.</div>
              </div>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: '13px', maxWidth: '240px', lineHeight: '1.7' }}>A space for honest thinking, Somali voices, and the long game toward a better future.</p>
          </div>
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {[['vision','Vision'],['blog','Blog'],['story','My Story'],['reading','Reading List'],['connect',"Let's Connect"]].map(([key, label]) => (
              <div key={key} onClick={() => setPage(key)} style={{ color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = '#FFFFFF'}
                onMouseLeave={e => e.target.style.color = '#9CA3AF'}
              >{label}</div>
            ))}
          </div>
        </div>
        <div style={{ height: '1px', background: '#1F2937', margin: '0 0 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ color: '#6B7280', fontSize: '12px' }}>© 2026 politics.mmohamud.me</p>
          <a href="https://mmohamud.me" style={{ color: '#6B7280', fontSize: '12px', textDecoration: 'none' }}>mmohamud.me</a>
        </div>
      </div>
    </footer>
  );
};

/* ─── HOME PAGE ───────────────────────────────────────────────── */
const HomePage = ({ posts, lang, word, setPage, setCurrentPost, voices, dark, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const featured = posts.find(p => p.featured && p.published);
  const recent = posts.filter(p => p.published && !p.featured).slice(0, 2);
  const featuredVoice = voices.find(v => v.featured);

  return (
    <div className="fade-in">
      <div style={{ background: dark ? 'linear-gradient(135deg, #0F172A 0%, #0C2D48 100%)' : `linear-gradient(135deg, ${t.soft} 0%, ${t.lightBlue} 100%)`, padding: isMobile ? '36px 16px 28px' : '44px 24px 36px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <Tag T={t}>{lang === 'en' ? 'Build. Unite. Lead.' : 'Dhis. Mideyso. Hoggaami.'}</Tag>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : 'clamp(28px, 3.5vw, 44px)', color: t.charcoal, fontWeight: '700', lineHeight: '1.2', margin: '14px 0 12px' }}>
            {lang === 'en' ? 'Building the future Somalia deserves.' : 'Dhisidda mustaqbalka Soomaaliya mudan.'}
          </h1>
          <p style={{ color: t.mid, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto 22px' }}>
            {lang === 'en' ? 'A personal space for honest thinking, Somali voices, and the long work of imagining what could be.' : 'Meel shakhsi ah oo loogu talagalay fikraddii daacadda ah, codadka Soomaalida.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn onClick={() => setPage('vision')} T={t}>{lang === 'en' ? 'Read the Vision' : 'Akhri Aragtida'}</Btn>
            <Btn outline onClick={() => setPage('blog')} T={t}>{lang === 'en' ? 'Browse Blog' : 'Blog-ka'}</Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '32px 16px' : '48px 24px' }}>
        {featured && (
          <div style={{ marginBottom: isMobile ? '40px' : '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ height: '2px', width: '28px', background: '#4FC3F7' }} />
              <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Featured</span>
            </div>
            <div onClick={() => { setCurrentPost(featured); setPage('post'); }} style={{ cursor: 'pointer', background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,195,247,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ background: dark ? '#0C1929' : 'linear-gradient(135deg, #1A1A2E, #2D3748)', padding: isMobile ? '32px 24px' : '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? '120px' : '220px' }}>
                <span style={{ fontFamily: 'Playfair Display', fontSize: '72px', color: '#4FC3F7', opacity: 0.25 }}>"</span>
              </div>
              <div style={{ padding: isMobile ? '24px' : '36px' }}>
                <Tag T={t}>Featured Essay</Tag>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '20px' : '22px', color: t.charcoal, margin: '12px 0 10px', lineHeight: '1.3' }}>
                  {lang === 'en' ? featured.title : (featured.title_so || featured.title)}
                </h2>
                <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.7', marginBottom: '16px' }}>
                  {lang === 'en' ? featured.excerpt : (featured.excerpt_so || featured.excerpt)}
                </p>
                <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '500' }}>{featured.date} →</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: isMobile ? '32px' : '48px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ height: '2px', width: '28px', background: t.gold }} />
              <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Recent Writing</span>
            </div>
            {recent.length === 0 && <p style={{ color: t.mid, fontSize: '14px' }}>No posts yet. Coming soon.</p>}
            {recent.map(post => (
              <div key={post.id} onClick={() => { setCurrentPost(post); setPage('post'); }} style={{ cursor: 'pointer', padding: '20px 0', borderBottom: `1px solid ${t.border}` }}
                onMouseEnter={e => e.currentTarget.querySelector('h3').style.color = '#4FC3F7'}
                onMouseLeave={e => e.currentTarget.querySelector('h3').style.color = t.charcoal}
              >
                <span style={{ color: t.mid, fontSize: '11px' }}>{post.date}</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '18px' : '20px', color: t.charcoal, margin: '6px 0 8px', transition: 'color 0.2s', lineHeight: '1.3' }}>
                  {lang === 'en' ? post.title : (post.title_so || post.title)}
                </h3>
                <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.6' }}>
                  {lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}
                </p>
              </div>
            ))}
            <div style={{ marginTop: '20px' }}>
              <Btn outline small onClick={() => setPage('blog')} T={t}>All posts →</Btn>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {word && (
              <div style={{ background: dark ? '#0C1929' : '#1A1A2E', borderRadius: '14px', padding: '24px' }}>
                <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Somali Word of the Week</div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: '#FFFFFF', marginBottom: '4px' }}>{word.somali}</div>
                <div style={{ color: t.gold, fontSize: '13px', fontWeight: '500', marginBottom: '10px' }}>{word.english}</div>
                <p style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic' }}>{word.sentence}</p>
              </div>
            )}
            {featuredVoice && (
              <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '24px' }}>
                <div style={{ color: t.mid, fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Community Voice</div>
                <p style={{ color: t.charcoal, fontSize: '14px', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '12px' }}>"{featuredVoice.text}"</p>
                <div style={{ color: t.mid, fontSize: '12px', marginBottom: '14px' }}>{featuredVoice.author} · {featuredVoice.location}</div>
                <Btn small outline onClick={() => setPage('connect')} T={t}>Share Your Voice →</Btn>
              </div>
            )}
            <Newsletter T={t} compact />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── BLOG PAGE ───────────────────────────────────────────────── */
const BlogPage = ({ posts, lang, setPage, setCurrentPost, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const published = posts.filter(p => p.published);
  const filtered = search
    ? published.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt || '').toLowerCase().includes(search.toLowerCase()))
    : published;

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '32px 16px' : '52px 24px' }}>
      <Tag T={t}>Writing</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : '40px', color: t.charcoal, margin: '14px 0 10px' }}>Blog</h1>
      <p style={{ color: t.mid, fontSize: '14px', lineHeight: '1.7', marginBottom: '32px' }}>
        {lang === 'en' ? 'Essays, reflections, and perspectives on Somalia, governance, and the diaspora.' : 'Maqaallo, fikrardo, iyo aragtiyaha ku saabsan Soomaaliya.'}
      </p>
      <SearchBar value={search} onChange={setSearch} T={t} />
      {filtered.length === 0 && <p style={{ color: t.mid, fontSize: '14px' }}>{search ? `No posts matching "${search}"` : 'No posts yet.'}</p>}
      {filtered.map(post => (
        <div key={post.id} onClick={() => { setCurrentPost(post); setPage('post'); }} style={{ cursor: 'pointer', padding: isMobile ? '24px 0' : '28px 0', borderBottom: `1px solid ${t.border}` }}
          onMouseEnter={e => e.currentTarget.querySelector('h2').style.color = '#4FC3F7'}
          onMouseLeave={e => e.currentTarget.querySelector('h2').style.color = t.charcoal}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: t.mid, fontSize: '12px' }}>{post.date}</span>
            {post.featured && <Tag T={t}>Featured</Tag>}
          </div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '10px', lineHeight: '1.3', transition: 'color 0.2s' }}>
            {lang === 'en' ? post.title : (post.title_so || post.title)}
          </h2>
          <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.7', marginBottom: '12px' }}>
            {lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}
          </p>
          <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '500' }}>Read more →</span>
        </div>
      ))}
      <Newsletter T={t} />
    </div>
  );
};

/* ─── POST PAGE ───────────────────────────────────────────────── */
const PostPage = ({ post, lang, setPage, onCommentSubmit, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [comment, setComment] = useState({ author: '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const comments = (post.somalia_comments || []).filter(c => c.approved);
  const content = lang === 'en' ? post.content : (post.content_so || post.content);

  const handleSubmit = async () => {
    if (!comment.author || !comment.text) return;
    await onCommentSubmit({ post_id: post.id, ...comment, approved: false, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) });
    setSubmitted(true);
  };

  const inputStyle = { width: '100%', padding: '11px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', marginBottom: '10px' };

  return (
    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '28px 16px' : '52px 24px' }}>
      <span onClick={() => setPage('blog')} style={{ color: '#4FC3F7', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '28px' }}>← Back to Blog</span>
      <Tag T={t}>Essay</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '26px' : 'clamp(26px, 4vw, 38px)', color: t.charcoal, margin: '14px 0 10px', lineHeight: '1.2' }}>
        {lang === 'en' ? post.title : (post.title_so || post.title)}
      </h1>
      <p style={{ color: t.mid, fontSize: '12px', marginBottom: '8px' }}>{post.date}</p>
      <ShareButtons title={lang === 'en' ? post.title : (post.title_so || post.title)} T={t} />
      <div style={{ height: '1px', background: t.border, margin: '24px 0' }} />
      {content && content.split('\n\n').map((para, i) => (
        <p key={i} style={{ color: t.charcoal, fontSize: isMobile ? '16px' : '17px', lineHeight: '1.95', marginBottom: '22px' }}>{para}</p>
      ))}
      <div style={{ height: '1px', background: t.border, margin: '28px 0' }} />
      <ShareButtons title={lang === 'en' ? post.title : (post.title_so || post.title)} T={t} />

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal, marginBottom: '24px' }}>Responses ({comments.length})</h3>
        {comments.map(c => (
          <div key={c.id} style={{ background: t.soft, borderRadius: '10px', padding: '16px 18px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '14px' }}>{c.author}</span>
              <span style={{ color: t.mid, fontSize: '12px' }}>{c.date}</span>
            </div>
            <p style={{ color: t.charcoal, fontSize: '14px', lineHeight: '1.6' }}>{c.text}</p>
          </div>
        ))}
        <div style={{ background: t.soft, borderRadius: '14px', padding: isMobile ? '20px' : '28px', marginTop: '24px' }}>
          <h4 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '16px' }}>Leave a response</h4>
          {submitted ? (
            <p style={{ color: '#059669', fontSize: '14px' }}>Your response has been submitted for review. Thank you.</p>
          ) : (
            <>
              <input value={comment.author} onChange={e => setComment({ ...comment, author: e.target.value })} placeholder="Your name" style={inputStyle} />
              <textarea value={comment.text} onChange={e => setComment({ ...comment, text: e.target.value })} placeholder="Share your thoughts..." rows={4} style={{ ...inputStyle, resize: 'vertical', marginBottom: '14px' }} />
              <Btn onClick={handleSubmit} T={t}>Submit Response</Btn>
            </>
          )}
        </div>
      </div>
      <Newsletter T={t} />
    </div>
  );
};

/* ─── VISION PAGE ─────────────────────────────────────────────── */
const VisionPage = ({ lang, timeline, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div className="fade-in">
      <div style={{ background: dark => dark ? '#020617' : 'linear-gradient(135deg, #1A1A2E, #2D3748)', background: 'linear-gradient(135deg, #1A1A2E, #2D3748)', padding: isMobile ? '48px 16px 40px' : '72px 24px 56px', color: '#FFFFFF', textAlign: 'center' }}>
        <Tag T={t}>{lang === 'en' ? 'The Vision' : 'Aragtida'}</Tag>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : 'clamp(28px, 4vw, 44px)', margin: '16px 0 14px', lineHeight: '1.2' }}>
          {lang === 'en' ? 'What I believe Somalia can become.' : 'Waxa aan aaminahay in Soomaaliya noqon karto.'}
        </h1>
        <p style={{ color: '#9CA3AF', maxWidth: '500px', margin: '0 auto', fontSize: '15px', lineHeight: '1.8' }}>
          {lang === 'en' ? 'This is a living document. It will grow as my thinking matures. Nothing here is final.' : 'Waa dukumiinti nool. Wuu kordhayaa marka fikradaydu ay bislaato.'}
        </p>
      </div>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? '32px 16px' : '52px 24px' }}>
        {[
          { title: lang === 'en' ? 'On Technology & Governance' : 'Teknolojiyada & Xukuumadda', body: lang === 'en' ? "Somalia's path forward runs through digital infrastructure. A government that invests in cybersecurity, digital identity, and transparent e-governance will be a government its people can actually trust. I believe this is not optional. It is the foundation." : "Jidka Soomaaliya wuxuu maraa kaabayaasha dijital. Xukuumad ku maalgalisa ammaanka dijital, aqoonsiga dijital, iyo xukuumad kala-xisaabtanka ah waxay noqon doontaa mid dadkeeda run aaminsan." },
          { title: lang === 'en' ? 'On the Diaspora' : 'Diaspora-da', body: lang === 'en' ? "The millions of Somalis living abroad are not a footnote. They are an untapped engine. My vision includes building real, structural channels through which diaspora talent, capital, and experience flow back into Somalia in organized, impactful ways." : "Malaayin Soomaali ah oo dibadda ku nool kuma aha qoraal kooban. Waa matoor aan la isticmaalin." },
          { title: lang === 'en' ? 'On Unity' : 'Midnimada', body: lang === 'en' ? "I don't believe unity comes from forcing people to agree. It comes from building institutions that people trust, systems that are fair, and leadership that listens. That is the kind of unity I want to work toward." : "Midnimadu kuma timaado in dadka lagu kalliftey inay is waafaqaan. Waxay ka timaaddaa dhisidda hay'adaha dadku aaminsan yihiin." },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: '40px', display: 'flex', gap: '16px' }}>
            <div style={{ width: '3px', background: '#4FC3F7', borderRadius: '2px', flexShrink: 0, marginTop: '6px' }} />
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '24px', color: t.charcoal, marginBottom: '12px' }}>{item.title}</h2>
              <p style={{ color: t.mid, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.9' }}>{item.body}</p>
            </div>
          </div>
        ))}

        <div style={{ height: '1px', background: t.border, margin: '40px 0' }} />
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '28px', color: t.charcoal, marginBottom: '32px' }}>The Roadmap to 2040</h2>
        {timeline && timeline.map((phase, i) => (
          <div key={i} style={{ display: 'flex', gap: isMobile ? '16px' : '24px', marginBottom: '28px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: isMobile ? '80px' : '100px' }}>
              <div style={{ color: '#4FC3F7', fontSize: '11px', fontWeight: '600' }}>{phase.year}</div>
              <div style={{ color: t.mid, fontSize: '10px' }}>{phase.phase}</div>
            </div>
            <div style={{ width: '1px', background: t.border, flexShrink: 0, marginTop: '4px' }} />
            <div>
              {phase.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.gold, flexShrink: 0, marginTop: '6px' }} />
                  <span style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.5' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Newsletter T={t} />
      </div>
    </div>
  );
};

/* ─── STORY PAGE ──────────────────────────────────────────────── */
const StoryPage = ({ lang, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '32px 16px' : '52px 24px' }}>
      <Tag T={t}>About</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : '40px', color: t.charcoal, margin: '14px 0 36px' }}>{lang === 'en' ? 'My Story' : 'Taariikhda'}</h1>
      {[
        { heading: lang === 'en' ? 'Where I come from' : 'Xagga aan ka yimid', text: lang === 'en' ? "I am Somali, raised in the diaspora, rooted in Columbus, Ohio. My background spans cybersecurity, IT, and community building. I hold degrees in Computer Science and Business, and I am currently completing an MS in Cybersecurity at Western Governors University." : "Waxaan ahay Soomaali, ku koray diaspora, xidid ku leh Columbus, Ohio." },
        { heading: lang === 'en' ? 'Why politics' : 'Sababta siyaasadda', text: lang === 'en' ? "It started as a feeling. Not a plan, not a calculation. A quiet but persistent sense that Somalia's future matters, and that people who understand technology, governance, and community have something real to offer. I am still in the early stages of figuring this out." : "Waxay bilaabatay dareen. Maaha qorshe, maahan xisaab." },
        { heading: lang === 'en' ? 'What I am building' : 'Waxa aan dhisayo', text: lang === 'en' ? "Through Kulan Group, I am building platforms that serve education, cybersecurity, and community for the Somali diaspora. These projects are not separate from the political vision. They are part of it." : "Iyada oo loo marayo Kulan Group, waxaan dhisayaa barnaamijyo u adeega waxbarashada." },
      ].map((s, i) => (
        <div key={i} style={{ marginBottom: '36px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '22px', color: t.charcoal, marginBottom: '10px' }}>{s.heading}</h2>
          <p style={{ color: t.mid, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.9' }}>{s.text}</p>
        </div>
      ))}
      <Newsletter T={t} />
    </div>
  );
};

/* ─── READING PAGE ────────────────────────────────────────────── */
const ReadingPage = ({ reading, lang, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div className="fade-in" style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? '32px 16px' : '52px 24px' }}>
      <Tag T={t}>Library</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : '40px', color: t.charcoal, margin: '14px 0 10px' }}>{lang === 'en' ? 'Reading List' : 'Buugaagta'}</h1>
      <p style={{ color: t.mid, fontSize: '14px', marginBottom: '40px', lineHeight: '1.7' }}>{lang === 'en' ? 'Books and resources shaping my thinking on Somalia, governance, and leadership.' : 'Buugaag iyo xogaha qaabeeya fikradayda.'}</p>
      {[...new Set(reading.map(r => r.category))].map(cat => (
        <div key={cat} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ height: '2px', width: '20px', background: t.gold }} />
            <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>{cat}</span>
          </div>
          {reading.filter(r => r.category === cat).map(book => (
            <div key={book.id} style={{ background: t.soft, borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', borderLeft: '3px solid #4FC3F7' }}>
              <div style={{ fontWeight: '600', color: t.charcoal, fontSize: '15px', marginBottom: '3px' }}>{book.title}</div>
              <div style={{ color: '#4FC3F7', fontSize: '12px', marginBottom: '6px' }}>{book.author}</div>
              <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.6' }}>{book.note}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/* ─── CONNECT PAGE ────────────────────────────────────────────── */
const ConnectPage = ({ voices, onVoiceSubmit, lang, monthlyQ, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ author: '', location: '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const featured = voices.filter(v => v.featured);
  const others = voices.filter(v => !v.featured);
  const inputStyle = { width: '100%', padding: '11px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none' };

  const submit = async () => {
    if (!form.author || !form.text) return;
    await onVoiceSubmit({ ...form, featured: false, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) });
    setSubmitted(true);
  };

  return (
    <div className="fade-in">
      <div style={{ background: t.dark ? 'linear-gradient(135deg, #0C2D48, #0F172A)' : `linear-gradient(135deg, ${t.lightBlue}, ${t.soft})`, padding: isMobile ? '40px 16px 32px' : '56px 24px 44px', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>
        <Tag T={t}>Community</Tag>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '38px', color: t.charcoal, margin: '14px 0 10px' }}>{lang === 'en' ? "Let's Connect" : 'Aan Xiriirno'}</h1>
        <p style={{ color: t.mid, maxWidth: '440px', margin: '0 auto', fontSize: '14px', lineHeight: '1.8' }}>
          {lang === 'en' ? 'This space belongs to every Somali who has something to say. Share your voice.' : 'Meesha waxay u tahay Soomaali kasta oo wax yidhaahda.'}
        </p>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: isMobile ? '32px 16px' : '52px 24px' }}>
        {monthlyQ && (
          <div style={{ background: '#1A1A2E', borderRadius: '14px', padding: isMobile ? '28px 20px' : '36px', marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Monthly Question</div>
            <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '18px' : '22px', color: '#FFFFFF', lineHeight: '1.6', maxWidth: '540px', margin: '0 auto' }}>"{monthlyQ}"</p>
          </div>
        )}

        {featured.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ height: '2px', width: '20px', background: t.gold }} />
              <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>Featured Voices</span>
            </div>
            {featured.map(v => (
              <div key={v.id} style={{ background: t.soft, borderRadius: '10px', padding: '20px', marginBottom: '12px', borderLeft: `3px solid ${t.gold}` }}>
                <p style={{ color: t.charcoal, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '10px' }}>"{v.text}"</p>
                <span style={{ color: t.mid, fontSize: '12px' }}>{v.author}{v.location ? ` · ${v.location}` : ''}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '40px' }}>
          {others.map(v => (
            <div key={v.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '18px' }}>
              <p style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.7', marginBottom: '10px' }}>"{v.text}"</p>
              <span style={{ color: t.mid, fontSize: '12px' }}>{v.author}{v.location ? ` · ${v.location}` : ''}</span>
            </div>
          ))}
        </div>

        <div style={{ background: t.soft, borderRadius: '14px', padding: isMobile ? '24px' : '36px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '6px' }}>Share Your Voice</h2>
          <p style={{ color: t.mid, fontSize: '13px', marginBottom: '24px' }}>Your submission will be reviewed before it goes live.</p>
          {submitted ? (
            <div style={{ background: t.lightBlue, borderRadius: '8px', padding: '16px', color: t.blueDark, fontSize: '14px' }}>Thank you for sharing. Your voice has been submitted for review.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Your name *" style={inputStyle} />
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Your city / country" style={inputStyle} />
              </div>
              <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Your thoughts on Somali politics..." rows={4}
                style={{ ...inputStyle, resize: 'vertical', marginBottom: '14px' }} />
              <Btn onClick={submit} T={t}>Submit Your Voice</Btn>
            </>
          )}
        </div>
        <Newsletter T={t} />
      </div>
    </div>
  );
};

/* ─── ADMIN LOGIN ─────────────────────────────────────────────── */
const AdminLogin = ({ onLogin, T }) => {
  const t = T;
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const attempt = () => {
    if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) { onLogin(); setErr(false); }
    else setErr(true);
  };
  const iStyle = { width: '100%', padding: '12px 14px', border: `1.5px solid ${err ? '#EF4444' : t.border}`, borderRadius: '10px', fontFamily: 'DM Sans', fontSize: '14px', marginBottom: '12px', outline: 'none', color: t.charcoal, background: t.soft };
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: t.card, borderRadius: '20px', padding: '44px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ margin: '0 auto 16px', display: 'inline-block' }}><StarLogo size={48} /></div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '6px' }}>Admin Access</h2>
          <p style={{ color: t.mid, fontSize: '13px' }}>Somalia 2040 · Dashboard</p>
        </div>
        <label style={{ color: t.mid, fontSize: '12px', display: 'block', marginBottom: '5px' }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()} placeholder="your@email.com" style={iStyle} />
        <label style={{ color: t.mid, fontSize: '12px', display: 'block', marginBottom: '5px' }}>Password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()} placeholder="••••••••" style={{ ...iStyle, letterSpacing: '3px' }} />
        {err && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '8px' }}>Incorrect email or password.</p>}
        <Btn onClick={attempt} T={t} style={{ width: '100%', marginTop: '4px' }}>Enter Dashboard</Btn>
      </div>
    </div>
  );
};

/* ─── ADMIN SHELL ─────────────────────────────────────────────── */
const AdminShell = ({ children, tab, setTab, onLogout, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const tabs = [
    { key: 'dash', label: 'Dashboard' }, { key: 'posts', label: 'Blog Posts' },
    { key: 'comments', label: 'Comments' }, { key: 'community', label: 'Community' },
    { key: 'word', label: 'Word of Week' }, { key: 'reading', label: 'Reading List' },
    { key: 'timeline', label: 'Timeline' }, { key: 'settings', label: 'Settings' },
  ];
  const Sidebar = () => (
    <div style={{ width: isMobile ? '100%' : '210px', background: '#0F172A', padding: '20px 0', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 'auto' : '100vh' }}>
      <div style={{ padding: '0 18px 20px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: '15px', color: '#FFFFFF' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span></div>
        <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>Admin Panel</div>
      </div>
      <div style={{ flex: 1, padding: '12px 0' }}>
        {tabs.map(tb => (
          <div key={tb.key} onClick={() => { setTab(tb.key); setSideOpen(false); }} style={{ padding: '10px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: tab === tb.key ? '#4FC3F7' : '#9CA3AF', background: tab === tb.key ? 'rgba(79,195,247,0.08)' : 'transparent', borderLeft: tab === tb.key ? '3px solid #4FC3F7' : '3px solid transparent', transition: 'all 0.15s' }}>{tb.label}</div>
        ))}
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div onClick={onLogout} style={{ color: '#6B7280', fontSize: '12px', cursor: 'pointer' }}
          onMouseEnter={e => e.target.style.color = '#EF4444'}
          onMouseLeave={e => e.target.style.color = '#6B7280'}
        >← Logout</div>
      </div>
    </div>
  );

  if (isMobile) return (
    <div style={{ background: t.soft, minHeight: '100vh' }}>
      <div style={{ background: '#0F172A', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: '15px', color: '#FFFFFF' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span> <span style={{ color: '#6B7280', fontSize: '11px' }}>Admin</span></div>
        <button onClick={() => setSideOpen(!sideOpen)} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '20px', cursor: 'pointer' }}>☰</button>
      </div>
      {sideOpen && <Sidebar />}
      <div style={{ padding: '24px 16px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.soft }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>{children}</div>
    </div>
  );
};

/* ─── ADMIN DASHBOARD ─────────────────────────────────────────── */
const AdminDash = ({ posts, voices, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const stats = [
    { label: 'Published', value: posts.filter(p => p.published).length, color: '#4FC3F7' },
    { label: 'Drafts', value: posts.filter(p => !p.published).length, color: t.gold },
    { label: 'Pending', value: posts.flatMap(p => p.somalia_comments || []).filter(c => !c.approved).length, color: '#EF4444' },
    { label: 'Voices', value: voices.length, color: '#10B981' },
  ];
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '28px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: t.card, borderRadius: '10px', padding: '20px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display' }}>{s.value}</div>
            <div style={{ color: t.mid, fontSize: '12px', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: t.card, borderRadius: '10px', padding: '24px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '16px' }}>Recent Posts</h3>
        {posts.slice(0, 5).map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}`, alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{p.title}</span>
              <span style={{ color: t.mid, fontSize: '11px', display: 'block' }}>{p.date}</span>
            </div>
            <span style={{ background: p.published ? t.lightBlue : '#FEF3C7', color: p.published ? t.blueDark : '#92400E', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
              {p.published ? 'Published' : 'Draft'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ADMIN POSTS ─────────────────────────────────────────────── */
const AdminPosts = ({ posts, onSave, onDelete, onToggle, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', title_so: '', excerpt: '', excerpt_so: '', content: '', content_so: '', published: false, featured: false });
  const [saving, setSaving] = useState(false);

  const openEdit = (post) => { setEditing(post.id); setForm({ title: post.title, title_so: post.title_so || '', excerpt: post.excerpt || '', excerpt_so: post.excerpt_so || '', content: post.content || '', content_so: post.content_so || '', published: post.published, featured: post.featured }); };
  const openNew = () => { setEditing('new'); setForm({ title: '', title_so: '', excerpt: '', excerpt_so: '', content: '', content_so: '', published: false, featured: false }); };
  const save = async () => {
    setSaving(true);
    const payload = editing === 'new' ? { ...form, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) } : { id: editing, ...form };
    await onSave(payload);
    setSaving(false); setEditing(null);
  };

  const iStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', marginBottom: '10px', outline: 'none', background: t.inputBg, color: t.charcoal };

  if (editing !== null) return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal }}>{editing === 'new' ? 'New Post' : 'Edit Post'}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn outline small onClick={() => setEditing(null)} T={t}>Cancel</Btn>
          <Btn small onClick={save} T={t}>{saving ? 'Saving...' : 'Save Post'}</Btn>
        </div>
      </div>
      <div style={{ background: t.card, borderRadius: '12px', padding: isMobile ? '20px' : '28px' }}>
        {[['title','Title (English)'],['title_so','Title (Somali)'],['excerpt','Excerpt (English)'],['excerpt_so','Excerpt (Somali)']].map(([f, l]) => (
          <div key={f}><label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>{l}</label><input style={iStyle} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} /></div>
        ))}
        {[['content','Content (English)'],['content_so','Content (Somali)']].map(([f, l]) => (
          <div key={f}><label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>{l}</label><textarea style={{ ...iStyle, resize: 'vertical' }} rows={8} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} /></div>
        ))}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '6px' }}>
          {[['published','Published'],['featured','Featured on Homepage']].map(([f, l]) => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '14px', color: t.charcoal }}>
              <input type="checkbox" checked={form[f]} onChange={e => setForm({ ...form, [f]: e.target.checked })} />{l}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal }}>Blog Posts</h1>
        <Btn small onClick={openNew} T={t}>+ New Post</Btn>
      </div>
      <div style={{ background: t.card, borderRadius: '12px', overflow: 'hidden' }}>
        {posts.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < posts.length - 1 ? `1px solid ${t.border}` : 'none', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{p.title}</span>
              <span style={{ color: t.mid, fontSize: '11px', display: 'block' }}>{p.date}{p.featured ? ' · ★ Featured' : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span onClick={() => onToggle(p.id, 'published', !p.published)} style={{ background: p.published ? t.lightBlue : '#FEF3C7', color: p.published ? t.blueDark : '#92400E', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}>{p.published ? 'Published' : 'Draft'}</span>
              <Btn small outline onClick={() => openEdit(p)} T={t}>Edit</Btn>
              <Btn small onClick={() => onDelete(p.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ADMIN COMMENTS ──────────────────────────────────────────── */
const AdminComments = ({ posts, onApprove, onDelete, T }) => {
  const t = T;
  const all = posts.flatMap(p => (p.somalia_comments || []).map(c => ({ ...c, postTitle: p.title })));
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Comment Moderation</h1>
      {all.length === 0 && <p style={{ color: t.mid }}>No comments yet.</p>}
      {all.map(c => (
        <div key={c.id} style={{ background: t.card, borderRadius: '10px', padding: '18px 20px', marginBottom: '10px', borderLeft: `3px solid ${c.approved ? '#10B981' : '#F59E0B'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '13px' }}>{c.author}</span>
              <span style={{ color: t.mid, fontSize: '11px', marginLeft: '10px' }}>on: {c.postTitle}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {!c.approved && <Btn small onClick={() => onApprove(c.id)} T={t} style={{ background: '#D1FAE5', color: '#065F46', border: 'none' }}>Approve</Btn>}
              <Btn small onClick={() => onDelete(c.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Delete</Btn>
            </div>
          </div>
          <p style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.6' }}>{c.text}</p>
          <span style={{ background: c.approved ? '#D1FAE5' : '#FEF3C7', color: c.approved ? '#065F46' : '#92400E', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', marginTop: '6px', display: 'inline-block' }}>
            {c.approved ? 'Approved' : 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── ADMIN COMMUNITY ─────────────────────────────────────────── */
const AdminCommunity = ({ voices, onToggleFeatured, onDelete, monthlyQ, onUpdateQ, T }) => {
  const t = T;
  const [q, setQ] = useState(monthlyQ || '');
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Community Manager</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '22px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '12px' }}>Monthly Question</h3>
        <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', resize: 'vertical', outline: 'none', background: t.inputBg, color: t.charcoal, marginBottom: '10px' }} />
        <Btn small onClick={() => onUpdateQ(q)} T={t}>Update Question</Btn>
      </div>
      <div style={{ background: t.card, borderRadius: '10px', overflow: 'hidden' }}>
        {voices.map((v, i) => (
          <div key={v.id} style={{ padding: '14px 20px', borderBottom: i < voices.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '13px' }}>{v.author}</span>
                {v.location && <span style={{ color: t.mid, fontSize: '11px' }}> · {v.location}</span>}
                <p style={{ color: t.mid, fontSize: '12px', margin: '4px 0 0', lineHeight: '1.5' }}>{v.text}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Btn small onClick={() => onToggleFeatured(v.id, !v.featured)} T={t} style={{ background: v.featured ? '#FEF3C7' : t.lightBlue, color: v.featured ? '#92400E' : t.blueDark, border: 'none' }}>{v.featured ? 'Unfeature' : 'Feature'}</Btn>
                <Btn small onClick={() => onDelete(v.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Delete</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ADMIN WORD ──────────────────────────────────────────────── */
const AdminWord = ({ word, onUpdate, T }) => {
  const t = T;
  const [form, setForm] = useState(word || { somali: '', english: '', sentence: '' });
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Word of the Week</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '24px', maxWidth: '460px' }}>
        {[['somali','Somali Word'],['english','English Translation'],['sentence','Example Sentence (Somali)']].map(([f, l]) => (
          <div key={f} style={{ marginBottom: '14px' }}>
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px' }}>{l}</label>
            <input value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none' }} />
          </div>
        ))}
        <Btn onClick={() => onUpdate(form)} T={t}>Update Word</Btn>
      </div>
      {word && (
        <div style={{ marginTop: '20px', background: '#0F172A', borderRadius: '10px', padding: '22px', maxWidth: '460px' }}>
          <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', marginBottom: '10px', textTransform: 'uppercase' }}>Preview</div>
          <div style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: '#FFFFFF' }}>{word.somali}</div>
          <div style={{ color: t.gold, fontSize: '13px', margin: '3px 0 8px' }}>{word.english}</div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', fontStyle: 'italic' }}>{word.sentence}</p>
        </div>
      )}
    </div>
  );
};

/* ─── ADMIN READING ───────────────────────────────────────────── */
const AdminReading = ({ reading, onAdd, onDelete, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ title: '', author: '', category: '', note: '' });
  const iStyle = { padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', outline: 'none', background: t.inputBg, color: t.charcoal };
  const add = async () => { if (!form.title || !form.author) return; await onAdd(form); setForm({ title: '', author: '', category: '', note: '' }); };
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Reading List</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '22px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '14px' }}>Add a Book</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          {[['title','Title'],['author','Author'],['category','Category']].map(([f, p]) => (
            <input key={f} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} placeholder={p} style={iStyle} />
          ))}
        </div>
        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Why you recommend it..." rows={2}
          style={{ ...iStyle, width: '100%', resize: 'vertical', marginBottom: '10px' }} />
        <Btn small onClick={add} T={t}>Add Book</Btn>
      </div>
      {reading.map(b => (
        <div key={b.id} style={{ background: t.card, borderRadius: '8px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '13px' }}>{b.title}</span>
            <span style={{ color: '#4FC3F7', fontSize: '12px', marginLeft: '8px' }}>by {b.author}</span>
            <span style={{ color: t.mid, fontSize: '11px', display: 'block', marginTop: '1px' }}>{b.category}</span>
          </div>
          <Btn small onClick={() => onDelete(b.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Remove</Btn>
        </div>
      ))}
    </div>
  );
};

/* ─── ADMIN TIMELINE ──────────────────────────────────────────── */
const AdminTimeline = ({ timeline, onUpdate, T }) => {
  const t = T;
  const [local, setLocal] = useState(timeline || []);
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal }}>Somalia 2040 Roadmap</h1>
        <Btn small onClick={() => onUpdate(local)} T={t}>Save Changes</Btn>
      </div>
      {local.map((phase, i) => (
        <div key={i} style={{ background: t.card, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ background: t.lightBlue, color: t.blueDark, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>{phase.year}</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>{phase.phase}</div>
          </div>
          {phase.items.map((item, j) => (
            <div key={j} style={{ display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '7px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.gold, flexShrink: 0 }} />
              <input value={item} onChange={e => { const u = [...local]; u[i] = { ...u[i], items: u[i].items.map((it, idx) => idx === j ? e.target.value : it) }; setLocal(u); }}
                style={{ flex: 1, padding: '5px 9px', border: `1px solid ${t.border}`, borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '12px', outline: 'none', background: t.inputBg, color: t.charcoal }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/* ─── ADMIN SETTINGS ──────────────────────────────────────────── */
const AdminSettings = ({ setPage, T }) => {
  const t = T;
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Settings</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '24px', maxWidth: '460px' }}>
        {[['Site URL','politics.mmohamud.me'],['Admin Email',ADMIN_EMAIL],['Site Title','Somalia 2040']].map(([l, v]) => (
          <div key={l} style={{ marginBottom: '16px' }}>
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px' }}>{l}</label>
            <input defaultValue={v} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none' }} />
          </div>
        ))}
        <div style={{ height: '1px', background: t.border, margin: '16px 0' }} />
        <div onClick={() => setPage('home')} style={{ color: '#4FC3F7', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>← View Public Site</div>
      </div>
    </div>
  );
};

/* ─── MAIN APP ────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage]             = useState('home');
  const [lang, setLang]             = useState('en');
  const [dark, setDark]             = useState(false);
  const [posts, setPosts]           = useState([]);
  const [voices, setVoices]         = useState([]);
  const [reading, setReading]       = useState([]);
  const [word, setWord]             = useState(null);
  const [timeline, setTimeline]     = useState([]);
  const [monthlyQ, setMonthlyQ]     = useState('');
  const [currentPost, setCurrentPost] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminTab, setAdminTab]     = useState('dash');
  const [loading, setLoading]       = useState(true);

  const T = getT(dark);

  /* ── Auto language by location ── */
  useEffect(() => {
    const detectLang = async () => {
      try {
        const r = await fetch('https://ipapi.co/json/');
        const d = await r.json();
        const somaliRegion = ['SO','DJ','ET','KE','ER'];
        if (somaliRegion.includes(d.country_code)) setLang('so');
      } catch { /* default to English */ }
    };
    detectLang();
  }, []);

  /* ── Dark mode persist ── */
  useEffect(() => {
    const saved = localStorage.getItem('s2040_dark');
    if (saved === 'true') setDark(true);
  }, []);
  useEffect(() => { localStorage.setItem('s2040_dark', dark); }, [dark]);

  /* ── Load data ── */
  const loadAll = async () => {
    setLoading(true);
    const [p, v, r, w, q, tl] = await Promise.all([
      getPosts(), getVoices(), getReading(),
      getSetting('word_of_week'), getSetting('monthly_question'), getSetting('timeline'),
    ]);
    setPosts(p); setVoices(v); setReading(r);
    if (w) setWord(w);
    if (q) setMonthlyQ(q);
    if (tl) setTimeline(tl);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const nav = (p) => { setPage(p); window.scrollTo(0, 0); };

  /* ── Handlers ── */
  const handleSavePost    = async (p) => { await savePost(p); await loadAll(); };
  const handleDeletePost  = async (id) => { await deletePost(id); setPosts(posts.filter(p => p.id !== id)); };
  const handleTogglePost  = async (id, f, v) => { await togglePostField(id, f, v); await loadAll(); };
  const handleAddComment  = async (c) => { await addComment(c); await loadAll(); };
  const handleApproveComment = async (id) => { await approveComment(id); await loadAll(); };
  const handleDeleteComment  = async (id) => { await deleteComment(id); await loadAll(); };
  const handleAddVoice    = async (v) => { const nv = await addVoice(v); if (nv) setVoices([...voices, nv]); };
  const handleToggleVoice = async (id, f) => { await toggleVoiceFeatured(id, f); await loadAll(); };
  const handleDeleteVoice = async (id) => { await deleteVoice(id); setVoices(voices.filter(v => v.id !== id)); };
  const handleAddBook     = async (b) => { const nb = await addBook(b); if (nb) setReading([...reading, nb]); };
  const handleDeleteBook  = async (id) => { await deleteBook(id); setReading(reading.filter(r => r.id !== id)); };
  const handleUpdateWord  = async (w) => { await setSetting('word_of_week', w); setWord(w); };
  const handleUpdateQ     = async (q) => { await setSetting('monthly_question', q); setMonthlyQ(q); };
  const handleUpdateTimeline = async (tl) => { await setSetting('timeline', tl); setTimeline(tl); };

  const sharedProps = { T, dark };

  if (page === 'admin') {
    if (!adminLoggedIn) return (<><GlobalStyles dark={dark} /><AdminLogin onLogin={() => setAdminLoggedIn(true)} T={T} /></>);
    return (
      <>
        <GlobalStyles dark={dark} />
        <AdminShell tab={adminTab} setTab={setAdminTab} onLogout={() => { setAdminLoggedIn(false); nav('home'); }} T={T}>
          {adminTab === 'dash'      && <AdminDash posts={posts} voices={voices} T={T} />}
          {adminTab === 'posts'     && <AdminPosts posts={posts} onSave={handleSavePost} onDelete={handleDeletePost} onToggle={handleTogglePost} T={T} />}
          {adminTab === 'comments'  && <AdminComments posts={posts} onApprove={handleApproveComment} onDelete={handleDeleteComment} T={T} />}
          {adminTab === 'community' && <AdminCommunity voices={voices} onToggleFeatured={handleToggleVoice} onDelete={handleDeleteVoice} monthlyQ={monthlyQ} onUpdateQ={handleUpdateQ} T={T} />}
          {adminTab === 'word'      && <AdminWord word={word} onUpdate={handleUpdateWord} T={T} />}
          {adminTab === 'reading'   && <AdminReading reading={reading} onAdd={handleAddBook} onDelete={handleDeleteBook} T={T} />}
          {adminTab === 'timeline'  && <AdminTimeline timeline={timeline} onUpdate={handleUpdateTimeline} T={T} />}
          {adminTab === 'settings'  && <AdminSettings setPage={nav} T={T} />}
        </AdminShell>
      </>
    );
  }

  return (
    <>
      <GlobalStyles dark={dark} />
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.3s' }}>
        <Nav page={page} setPage={nav} lang={lang} setLang={setLang} dark={dark} setDark={setDark} T={T} />
        {loading ? <Spinner /> : (
          <>
            {page === 'home'    && <HomePage posts={posts} lang={lang} word={word} setPage={nav} setCurrentPost={setCurrentPost} voices={voices} dark={dark} T={T} />}
            {page === 'blog'    && <BlogPage posts={posts} lang={lang} setPage={nav} setCurrentPost={setCurrentPost} T={T} />}
            {page === 'post'    && currentPost && <PostPage post={posts.find(p => p.id === currentPost.id) || currentPost} lang={lang} setPage={nav} onCommentSubmit={handleAddComment} T={T} />}
            {page === 'vision'  && <VisionPage lang={lang} timeline={timeline} T={T} />}
            {page === 'story'   && <StoryPage lang={lang} T={T} />}
            {page === 'reading' && <ReadingPage reading={reading} lang={lang} T={T} />}
            {page === 'connect' && <ConnectPage voices={voices} onVoiceSubmit={handleAddVoice} lang={lang} monthlyQ={monthlyQ} T={T} />}
          </>
        )}
        <Footer setPage={nav} T={T} />
        <div onClick={() => nav('admin')} style={{ position: 'fixed', bottom: '20px', right: '20px', background: T.charcoal === '#F1F5F9' ? '#1E293B' : '#1A1A2E', color: '#FFFFFF', padding: '8px 14px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', fontWeight: '500', zIndex: 50 }}>Admin →</div>
      </div>
    </>
  );
}
