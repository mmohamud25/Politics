imp
/* Legacy C alias for backwards compat */
const C = { ...getT(false), white: '#FFFFFF' };
ort { useState, useEffect, useRef, useCallback } from "react";
import {
  supabase,
  getPosts, savePost, deletePost, togglePostField,
  addComment, approveComment, deleteComment,
  getVoices, addVoice, toggleVoiceFeatured, deleteVoice,
  getReading, addBook, deleteBook,
  getSetting, setSetting, incrementViews,
  getWordArchive, addToWordArchive, setActiveWord,
  uploadMedia, deleteMedia, listMedia,
  trackEvent, getAnalyticsSummary,
  getAnnouncement, saveAnnouncement, clearAnnouncement, publishScheduledPosts,
} from "./supabase.js";

/* ─── GLOBAL STYLES ────────────────────────────────── */
const GlobalStyles = ({ dark }) => {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'DM Sans', sans-serif; background: ${dark ? '#08111E' : '#FAFAF8'}; transition: background 0.4s; overflow-x: hidden; }
    ::selection { background: rgba(79,195,247,0.25); }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #4FC3F7; border-radius: 2px; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .fade-in { animation: fadeIn 0.3s ease forwards; }
    .slide-down { animation: slideDown 0.25s ease forwards; }
    .post-content p { margin-bottom: 1.5rem; font-size: 18px; line-height: 1.95; color: ${dark ? '#CBD5E1' : '#374151'}; }
    .post-content h1 { font-family: 'Playfair Display', serif; font-size: 32px; margin: 2.5rem 0 1rem; color: ${dark ? '#F1F5F9' : '#0F172A'}; }
    .post-content h2 { font-family: 'Playfair Display', serif; font-size: 26px; margin: 2rem 0 0.75rem; color: ${dark ? '#F1F5F9' : '#0F172A'}; }
    .post-content h3 { font-family: 'Playfair Display', serif; font-size: 20px; margin: 1.5rem 0 0.5rem; color: ${dark ? '#F1F5F9' : '#0F172A'}; }
    .post-content blockquote { border-left: 3px solid #4FC3F7; padding: 12px 20px; margin: 2rem 0; background: rgba(79,195,247,0.05); border-radius: 0 8px 8px 0; font-style: italic; }
    .post-content ul, .post-content ol { padding-left: 1.5rem; margin: 1rem 0; }
    .post-content li { margin-bottom: 0.5rem; line-height: 1.7; }
    .post-content img { max-width: 100%; border-radius: 12px; margin: 2rem 0; }
    .post-content a { color: #4FC3F7; border-bottom: 1px solid rgba(79,195,247,0.3); text-decoration: none; }
    [contenteditable] { outline: none; }
    [contenteditable] h1,[contenteditable] h2,[contenteditable] h3 { font-family: 'Playfair Display'; margin: 8px 0; }
    [contenteditable] blockquote { border-left: 3px solid #4FC3F7; padding-left: 12px; margin: 8px 0; color: #6B7280; font-style: italic; }
    [contenteditable] ul,[contenteditable] ol { padding-left: 20px; margin: 6px 0; }
    [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
  `;
  return <style>{css}</style>;
};

/* ─── THEME ───────────────────────────────────── */
const getT = (dark) => ({
  bg: dark ? '#08111E' : '#FAFAF8', soft: dark ? '#0F1E30' : '#F4F4F0',
  card: dark ? '#0F1E30' : '#FFFFFF', border: dark ? '#1A2D44' : '#E8E8E4',
  charcoal: dark ? '#F1F5F9' : '#0F172A', body: dark ? '#CBD5E1' : '#374151',
  mid: dark ? '#64748B' : '#9CA3AF', blue: '#4FC3F7',
  blueDark: dark ? '#7DD3F8' : '#0284C7', gold: '#D97706',
  navBg: dark ? 'rgba(8,17,30,0.95)' : 'rgba(250,250,248,0.95)',
  footBg: dark ? '#040C16' : '#0A0F1A', inputBg: dark ? '#08111E' : '#FFFFFF',
  lightBlue: dark ? '#0C2D48' : '#EFF9FF', dark,
});
/* ─── UTILITIES ──────────────────────────────── */
const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
};

const useInView = (ref) => {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return v;
};

const AnimatedDiv = ({ children, style = {}, delay = 0 }) => {
  const ref = useRef(null);
  const v = useInView(ref);
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(20px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`, ...style }}>{children}</div>;
};

const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n || 0);
const getRT = (c) => { if (!c) return '1 min'; const w = c.replace(/<[^>]*>/g, '').trim().split(' ').filter(s => s.length > 0).length; return `${Math.max(1, Math.ceil(w / 200))} min read`; };
const isHTML = (s) => s && /<[a-z][\s\S]*>/i.test(s);

const ReadingProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => { const h = () => { const el = document.documentElement; const sh = el.scrollHeight - el.clientHeight; setP(sh > 0 ? (el.scrollTop / sh) * 100 : 0); }; window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  return <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: '2px' }}><div style={{ height: '100%', width: p + '%', background: 'linear-gradient(90deg,#4FC3F7,#D97706)', transition: 'width 0.1s' }} /></div>;
};

const BackToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { const h = () => setShow(window.scrollY > 600); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  if (!show) return null;
  return <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '72px', right: '20px', background: '#4FC3F7', color: '#FFF', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', zIndex: 49, boxShadow: '0 4px 20px rgba(79,195,247,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>↑</button>;
};

const StarLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="9" fill="#4FC3F7"/>
    <polygon points="20,7 23.1,16.6 33.5,16.6 25.2,22.4 28.3,32 20,26.2 11.7,32 14.8,22.4 6.5,16.6 16.9,16.6" fill="white"/>
  </svg>
);

const AnnouncementBanner = ({ announcement, onClose }) => {
  if (!announcement) return null;
  return (
    <div style={{ background: announcement.color || '#4FC3F7', color: '#FFF', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '500', position: 'relative', zIndex: 200 }}>
      <span>{announcement.message}</span>
      <button onClick={onClose} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px', opacity: 0.8, lineHeight: 1 }}>×</button>
    </div>
  );
};

const ShareBtns = ({ title, T }) => {
  const t = T || getT(false); const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const bs = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: `1px solid ${t.border}`, background: t.soft, color: t.charcoal, transition: 'all 0.2s' };
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', color: t.mid, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '600' }}>Share</span>
      <button style={bs} onClick={() => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url), '_blank')}>Twitter</button>
      <button style={bs} onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), '_blank')}>WhatsApp</button>
      <button style={{ ...bs, background: copied ? '#D1FAE5' : t.soft, color: copied ? '#065F46' : t.charcoal }} onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? 'Copied!' : 'Copy link'}</button>
    </div>
  );
};

const Newsletter = ({ T, compact }) => {
  const t = T || getT(false); const [email, setEmail] = useState(''); const [status, setStatus] = useState('idle');
  const submit = async () => { if (!email || !email.includes('@')) return; setStatus('loading'); try { await fetch('https://formspree.io/f/xeepavdd', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ email, _subject: 'Somalia 2040 Newsletter' }) }); setStatus('success'); } catch { setStatus('error'); } };
  if (compact) return (
    <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Newsletter</div>
      <p style={{ color: t.body, fontSize: '13px', marginBottom: '12px', lineHeight: '1.6' }}>Somalia 2040 updates to your inbox.</p>
      {status === 'success' ? <p style={{ color: '#059669', fontSize: '13px', fontWeight: '500' }}>You are in. Thank you.</p> : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={{ flex: 1, padding: '8px 11px', border: `1px solid ${t.border}`, borderRadius: '6px', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none', minWidth: 0 }} />
          <button onClick={submit} style={{ background: '#4FC3F7', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{status === 'loading' ? '...' : 'Join'}</button>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ background: '#0A0F1A', borderRadius: '16px', padding: '44px 32px', textAlign: 'center', marginTop: '60px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '700' }}>Stay Connected</div>
      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: '#FFF', marginBottom: '8px' }}>Join the Somalia 2040 newsletter</h3>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', lineHeight: '1.7' }}>Essays, updates, and ideas. No noise, just signal.</p>
      {status === 'success' ? <p style={{ color: '#34D399', fontSize: '15px', fontWeight: '500' }}>You are in. Thank you.</p> : (
        <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="your@email.com" type="email" style={{ flex: 1, padding: '11px 14px', border: '1px solid #1A2D44', borderRadius: '6px', fontSize: '14px', background: '#08111E', color: '#F1F5F9', outline: 'none', minWidth: '180px' }} />
          <button onClick={submit} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: '11px 22px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{status === 'loading' ? 'Joining...' : 'Subscribe'}</button>
        </div>
      )}
    </div>
  );
};

const SearchBar = ({ value, onChange, T }) => {
  const t = T || getT(false);
  return (
    <div style={{ position: 'relative', marginBottom: '32px' }}>
      <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.charcoal} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search posts..." style={{ width: '100%', padding: '11px 36px 11px 40px', border: `1.5px solid ${t.border}`, borderRadius: '8px', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none' }} onFocus={e => e.target.style.borderColor = '#4FC3F7'} onBlur={e => e.target.style.borderColor = t.border} />
      {value && <button onClick={() => onChange('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.mid, fontSize: '18px' }}>x</button>}
    </div>
  );
};

const Tag = ({ children, T, color }) => {
  const t = T || getT(false);
  return <span style={{ background: color ? color + '18' : t.lightBlue, color: color || t.blueDark, fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700' }}>{children}</span>;
};

const Spinner = ({ size = 28 }) => <div style={{ width: size, height: size, border: '2px solid #E5E7EB', borderTop: '2px solid #4FC3F7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />;

const ImgUploader = ({ onSelect, T, label = 'Upload Image' }) => {
  const t = T || getT(false); const [uploading, setUploading] = useState(false); const ref = useRef(null);
  const handle = async (file) => { if (!file || !file.type.startsWith('image/')) return; setUploading(true); const result = await uploadMedia(file); setUploading(false); if (result) onSelect(result.url); };
  return (
    <div>
      <div onClick={() => ref.current.click()} onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()} style={{ border: `2px dashed ${t.border}`, borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: t.soft, marginBottom: '10px' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4FC3F7'} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
        {uploading ? <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}><Spinner size={20}/><span style={{ color: t.mid, fontSize: '13px' }}>Uploading...</span></div> : <p style={{ color: t.mid, fontSize: '13px' }}>{label} — click or drag and drop</p>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
    </div>
  );
};

/* ─── ADMIN CREDS ─────────────────────────────────────────────── */
const ADMIN_EMAIL = "mohamedmohammud@gmail.com";
const ADMIN_PASSWORD = "Kulan@2040!";

/* ─── BTN ──────────────────────────────────────── */
const Btn = ({ children, onClick, style = {}, outline, small, danger, T, disabled }) => {
  const t = T || getT(false);
  return <button onClick={onClick} disabled={disabled} style={{ background: danger ? '#FEF2F2' : outline ? 'transparent' : '#4FC3F7', color: danger ? '#DC2626' : outline ? t.charcoal : '#FFF', border: danger ? '1px solid #FECACA' : outline ? `1.5px solid ${t.border}` : 'none', padding: small ? '6px 13px' : '10px 22px', borderRadius: '6px', fontSize: small ? '12px' : '13px', fontWeight: '500', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', ...style }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
    onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.5' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >{children}</button>;
};




/* ─── NAV ─────────────────────────────────────────────────────── */
/* ─── NAV ─────────────────────────────────────────────────────── */
const Nav = ({ page, setPage, lang, setLang, dark, setDark, T, siteTitle }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  const links = [
    { label: lang === 'en' ? 'Vision' : 'Aragti', key: 'vision' },
    { label: 'Blog', key: 'blog' },
    { label: lang === 'en' ? 'My Story' : 'Taariikhda', key: 'story' },
    { label: lang === 'en' ? 'Reading List' : 'Buugaagta', key: 'reading' },
    { label: lang === 'en' ? "Let\'s Connect" : 'Xiriirka', key: 'connect' },
  ];
  const go = (k) => { setPage(k); setMenuOpen(false); window.scrollTo(0, 0); };
  const onHero = page === 'home' && !scrolled;
  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? t.navBg : 'transparent', borderBottom: scrolled ? `1px solid ${t.border}` : '1px solid transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none', transition: 'all 0.3s', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div onClick={() => go('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px' }}>
            <StarLogo size={36} />
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: onHero ? '#F8FAFC' : t.charcoal, fontWeight: '600', lineHeight: '1.1', transition: 'color 0.3s' }}>{siteTitle || 'Somalia'} <span style={{ color: '#4FC3F7' }}>2040</span></div>
              <div style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '700' }}>Build. Unite. Lead.</div>
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              {links.map(l => (
                <span key={l.key} onClick={() => go(l.key)} style={{ color: page === l.key ? '#4FC3F7' : onHero ? '#CBD5E1' : t.charcoal, fontSize: '13px', fontWeight: page === l.key ? '600' : '400', cursor: 'pointer', transition: 'color 0.2s', position: 'relative' }}
                  onMouseEnter={e => { if (page !== l.key) e.currentTarget.style.color = '#4FC3F7'; }}
                  onMouseLeave={e => { if (page !== l.key) e.currentTarget.style.color = onHero ? '#CBD5E1' : t.charcoal; }}
                >
                  {l.label}
                  {page === l.key && <div style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '2px', background: '#4FC3F7', borderRadius: '1px' }} />}
                </span>
              ))}
              <button onClick={() => setLang(lang === 'en' ? 'so' : 'en')} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '700', letterSpacing: '1px' }}>{lang === 'en' ? 'SO' : 'EN'}</button>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>{dark ? '☀️' : '🌙'}</button>
            </div>
          )}
          {isMobile && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>{dark ? '☀️' : '🌙'}</button>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', width: '24px', padding: '4px' }}>
                {[0,1,2].map(i => <div key={i} style={{ height: '2px', background: onHero ? '#F8FAFC' : t.charcoal, borderRadius: '1px', width: i===1&&menuOpen?'12px':'22px', transition: 'all 0.2s' }} />)}
              </button>
            </div>
          )}
        </div>
      </nav>
      {isMobile && menuOpen && (
        <div className="slide-down" style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 99, background: t.bg, borderTop: `1px solid ${t.border}`, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {links.map(l => (<div key={l.key} onClick={() => go(l.key)} style={{ padding: '18px 0', fontSize: '24px', fontFamily: 'Playfair Display', color: page === l.key ? '#4FC3F7' : t.charcoal, cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>{l.label}</div>))}
          <div style={{ marginTop: '28px' }}>
            <button onClick={() => { setLang(lang === 'en' ? 'so' : 'en'); setMenuOpen(false); }} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '600' }}>{lang === 'en' ? 'Somali' : 'English'}</button>
          </div>
        </div>
      )}
    </>
  );
};

const Footer = ({ setPage, T, siteTitle }) => {
  const t = T;
  return (
    <footer style={{ background: t.footBg, color: '#FFF', padding: '64px 24px 28px', marginTop: '80px', borderTop: '1px solid #0F1E30' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '48px', marginBottom: '56px' }}>
          <div style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '20px' }}>
              <StarLogo size={32} />
              <div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: '#F8FAFC', lineHeight: '1.1' }}>{siteTitle || 'Somalia'} <span style={{ color: '#4FC3F7' }}>2040</span></div>
                <div style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '700' }}>Build. Unite. Lead.</div>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.8' }}>A space for honest thinking, Somali voices, and the long game toward a better future.</p>
          </div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px' }}>Pages</div>
              {[['Vision','vision'],['Blog','blog'],['About','about'],['My Story','story']].map(([label,key]) => (
                <div key={key} onClick={() => setPage(key)} style={{ color: '#475569', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#F8FAFC'} onMouseLeave={e => e.target.style.color='#475569'}>{label}</div>
              ))}
            </div>
            <div>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px' }}>Community</div>
              {[['Reading List','reading'],["Let\'s Connect",'connect']].map(([label,key]) => (
                <div key={key} onClick={() => setPage(key)} style={{ color: '#475569', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#F8FAFC'} onMouseLeave={e => e.target.style.color='#475569'}>{label}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: '1px', background: '#0F1E30', margin: '0 0 28px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#334155', fontSize: '13px' }}>© 2026 politics.mmohamud.me · Somalia 2040</p>
          <a href="https://mmohamud.me" style={{ color: '#334155', fontSize: '13px', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color='#4FC3F7'} onMouseLeave={e => e.target.style.color='#334155'}>mmohamud.me</a>
        </div>
      </div>
    </footer>
  );
};

const HomePage = ({ posts, lang, word, setPage, setCurrentPost, voices, dark, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const featured = posts.find(p => p.featured && p.published);
  const recent = posts.filter(p => p.published && !p.featured).slice(0, 3);
  const fv = voices.find(v => v.featured);
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#08111E 50%,#040C16 100%)', minHeight: isMobile ? '80vh' : '90vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: isMobile ? '80px 20px 60px' : '80px 24px' }}>
        <div style={{ position: 'absolute', top: '15%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(79,195,247,0.07),transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle,rgba(217,119,6,0.04),transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="fade-in" style={{ maxWidth: isMobile ? '100%' : '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
              <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Somalia 2040</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '38px' : 'clamp(50px,6vw,78px)', color: '#F8FAFC', fontWeight: '700', lineHeight: '1.06', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              {lang === 'en' ? <><span>Building the </span><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>future</span><br />Somalia deserves.</> : <><span>Dhisidda </span><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>mustaqbalka</span><br />Soomaaliya mudan.</>}
            </h1>
            <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '520px', marginBottom: '40px' }}>
              {lang === 'en' ? 'A personal space for honest thinking, Somali voices, and the long work of imagining what could be.' : 'Meel shakhsi ah oo loogu talagalay fikraddii daacadda ah, codadka Soomaalida.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('vision')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: isMobile ? '13px 26px' : '15px 34px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background='#7DD3F8'; e.currentTarget.style.transform='translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background='#4FC3F7'; e.currentTarget.style.transform='translateY(0)'; }}>{lang === 'en' ? 'Read the Vision' : 'Akhri Aragtida'}</button>
              <button onClick={() => setPage('blog')} style={{ background: 'transparent', color: '#94A3B8', border: '1.5px solid #1A2D44', padding: isMobile ? '13px 26px' : '15px 34px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor='#4FC3F7'; e.currentTarget.style.color='#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor='#1A2D44'; e.currentTarget.style.color='#94A3B8'; }}>{lang === 'en' ? 'Browse Blog' : 'Blog-ka'}</button>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom,transparent,#4FC3F7)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4FC3F7' }} />
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '48px 20px' : '72px 24px' }}>
        {featured && (
          <AnimatedDiv style={{ marginBottom: isMobile ? '56px' : '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Featured</span></div>
            <div onClick={() => setCurrentPost(featured)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.border}`, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 24px 64px rgba(79,195,247,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ background: featured.thumbnail_url ? 'none' : 'linear-gradient(135deg,#0A0F1A,#0F172A)', minHeight: isMobile ? '200px' : '380px', overflow: 'hidden', position: 'relative' }}>
                {featured.thumbnail_url ? <img src={featured.thumbnail_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: isMobile ? '200px' : '380px' }} /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Playfair Display', fontSize: '140px', color: '#4FC3F7', opacity: 0.06, lineHeight: 1 }}>"</span></div>}
              </div>
              <div style={{ padding: isMobile ? '28px 24px' : '52px 48px', background: t.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Tag T={t} color="#4FC3F7">Featured Essay</Tag>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '22px' : '28px', color: t.charcoal, margin: '18px 0 14px', lineHeight: '1.25' }}>{lang === 'en' ? featured.title : (featured.title_so || featured.title)}</h2>
                <p style={{ color: t.body, fontSize: '15px', lineHeight: '1.75', marginBottom: '28px' }}>{lang === 'en' ? featured.excerpt : (featured.excerpt_so || featured.excerpt)}</p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: '600' }}>Read essay →</span>
                  <span style={{ color: t.mid, fontSize: '12px' }}>{featured.date}</span>
                  {(featured.views||0) > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{fmt(featured.views)} reads</span>}
                </div>
              </div>
            </div>
          </AnimatedDiv>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? '48px' : '64px', alignItems: 'start' }}>
          <div>
            <AnimatedDiv><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}><div style={{ height: '2px', width: '32px', background: t.gold }} /><span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Recent Writing</span></div></AnimatedDiv>
            {recent.length === 0 && <p style={{ color: t.mid, fontSize: '15px' }}>No posts yet. Coming soon.</p>}
            {recent.map((post, idx) => (
              <AnimatedDiv key={post.id} delay={idx * 0.08}>
                <div onClick={() => setCurrentPost(post)} style={{ cursor: 'pointer', paddingBottom: '36px', marginBottom: '36px', borderBottom: `1px solid ${t.border}` }} onMouseEnter={e => { const h = e.currentTarget.querySelector('.pt'); if(h) h.style.color='#4FC3F7'; }} onMouseLeave={e => { const h = e.currentTarget.querySelector('.pt'); if(h) h.style.color=t.charcoal; }}>
                  {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} />}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: t.mid, fontSize: '12px' }}>{post.date}</span>
                    <span style={{ color: t.mid, fontSize: '12px' }}>{getRT(post.content)}</span>
                    {(post.views||0) > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{fmt(post.views)} reads</span>}
                  </div>
                  <h3 className="pt" style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '12px', lineHeight: '1.3', transition: 'color 0.2s', letterSpacing: '-0.3px' }}>{lang === 'en' ? post.title : (post.title_so || post.title)}</h3>
                  <p style={{ color: t.body, fontSize: '15px', lineHeight: '1.7', marginBottom: '16px' }}>{lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}</p>
                  <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '600' }}>Read more →</span>
                </div>
              </AnimatedDiv>
            ))}
            <Btn outline onClick={() => setPage('blog')} T={t} style={{ marginTop: '8px' }}>View all posts</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {word && (
              <AnimatedDiv>
                <div style={{ background: dark ? '#040C16' : '#0A0F1A', borderRadius: '16px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle,rgba(79,195,247,0.08),transparent)', pointerEvents: 'none' }} />
                  <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '700' }}>Somali Word of the Week</div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: '30px', color: '#F8FAFC', marginBottom: '6px', fontStyle: 'italic' }}>{word.somali}</div>
                  <div style={{ color: '#D97706', fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>{word.english}</div>
                  <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', fontStyle: 'italic' }}>{word.sentence}</p>
                </div>
              </AnimatedDiv>
            )}
            {fv && (
              <AnimatedDiv delay={0.1}>
                <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><div style={{ width: '3px', height: '16px', background: t.gold, borderRadius: '2px' }} /><span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>Community Voice</span></div>
                  <p style={{ color: t.charcoal, fontSize: '15px', lineHeight: '1.75', fontStyle: 'italic', marginBottom: '14px' }}>"{fv.text}"</p>
                  <p style={{ color: t.mid, fontSize: '12px', marginBottom: '18px' }}>{fv.author} · {fv.location}</p>
                  <Btn small outline onClick={() => setPage('connect')} T={t}>Share your voice →</Btn>
                </div>
              </AnimatedDiv>
            )}
            <AnimatedDiv delay={0.15}><Newsletter T={t} compact /></AnimatedDiv>
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogPage = ({ posts, lang, setPage, setCurrentPost, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const published = posts.filter(p => p.published);
  const filtered = search ? published.filter(p => (p.title+' '+(p.excerpt||'')).toLowerCase().includes(search.toLowerCase())) : published;
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '80px 24px 64px', borderBottom: '1px solid #0F1E30' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Writing</span></div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '40px' : '60px', color: '#F8FAFC', marginBottom: '16px', lineHeight: '1.05', letterSpacing: '-1.5px' }}>Blog</h1>
          <p style={{ color: '#475569', fontSize: isMobile ? '15px' : '17px', lineHeight: '1.7', maxWidth: '520px' }}>{lang === 'en' ? 'Essays, reflections, and perspectives on Somalia, governance, and the diaspora.' : 'Maqaallo, fikrardo, iyo aragtiyaha ku saabsan Soomaaliya.'}</p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '36px 20px' : '56px 24px' }}>
        <SearchBar value={search} onChange={setSearch} T={t} />
        {filtered.length === 0 && <p style={{ color: t.mid, textAlign: 'center', padding: '48px 0' }}>{search ? `No results for "${search}"` : 'No posts yet.'}</p>}
        {filtered.map((post, i) => (
          <AnimatedDiv key={post.id} delay={i * 0.04}>
            <div onClick={() => setCurrentPost(post)} style={{ cursor: 'pointer', paddingBottom: '40px', marginBottom: '40px', borderBottom: `1px solid ${t.border}` }} onMouseEnter={e => { const h=e.currentTarget.querySelector('.bt'); if(h) h.style.color='#4FC3F7'; }} onMouseLeave={e => { const h=e.currentTarget.querySelector('.bt'); if(h) h.style.color=t.charcoal; }}>
              {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: isMobile ? '180px' : '240px', objectFit: 'cover', borderRadius: '14px', marginBottom: '24px' }} />}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: t.mid, fontSize: '13px' }}>{post.date}</span>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} />
                <span style={{ color: t.mid, fontSize: '13px' }}>{getRT(post.content)}</span>
                {(post.views||0)>0 && <><div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} /><span style={{ color: t.mid, fontSize: '13px' }}>{fmt(post.views)} reads</span></>}
                {post.featured && <Tag T={t} color="#4FC3F7">Featured</Tag>}
                {post.category && <Tag T={t}>{post.category}</Tag>}
              </div>
              <h2 className="bt" style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '26px' : '32px', color: t.charcoal, marginBottom: '14px', lineHeight: '1.2', transition: 'color 0.2s', letterSpacing: '-0.5px' }}>{lang === 'en' ? post.title : (post.title_so || post.title)}</h2>
              <p style={{ color: t.body, fontSize: '15px', lineHeight: '1.75', marginBottom: '16px' }}>{lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}</p>
              <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: '600' }}>Read more →</span>
            </div>
          </AnimatedDiv>
        ))}
        <Newsletter T={t} />
      </div>
    </div>
  );
};

const PostPage = ({ post, lang, setPage, onCommentSubmit }) => {
  const [comment, setComment] = useState({ author: "", text: "" });
  const [submitted, setSubmitted] = useState(false);
  const comments = (post.somalia_comments || []).filter(c => c.approved);

  const handleSubmit = async () => {
    if (!comment.author || !comment.text) return;
    await onCommentSubmit({ post_id: post.id, ...comment, approved: false, date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) });
    setSubmitted(true);
  };

  const content = lang === "en" ? post.content : (post.content_so || post.content);

  return (
    <div className="fade-in" style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px" }}>
      <span onClick={() => setPage("blog")} style={{ color: C.blue, cursor: "pointer", fontSize: "13px", display: "block", marginBottom: "32px" }}>← Back to Blog</span>
      <Tag>Essay</Tag>
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "clamp(28px, 4vw, 40px)", color: C.charcoal, margin: "16px 0 12px", lineHeight: "1.2" }}>
        {lang === "en" ? post.title : (post.title_so || post.title)}
      </h1>
      <p style={{ color: C.mid, fontSize: "13px", marginBottom: "40px" }}>{post.date}</p>
      <Divider />
      {content && content.split("\n\n").map((para, i) => (
        <p key={i} style={{ color: C.charcoal, fontSize: "17px", lineHeight: "1.9", marginBottom: "24px" }}>{para}</p>
      ))}
      <Divider />
      <div style={{ marginTop: "48px" }}>
        <h3 style={{ fontFamily: "Playfair Display", fontSize: "24px", color: C.charcoal, marginBottom: "32px" }}>Responses ({comments.length})</h3>
        {comments.map(c => (
          <div key={c.id} style={{ background: C.soft, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: "600", color: C.charcoal, fontSize: "14px" }}>{c.author}</span>
              <span style={{ color: C.mid, fontSize: "12px" }}>{c.date}</span>
            </div>
            <p style={{ color: C.charcoal, fontSize: "14px", lineHeight: "1.6" }}>{c.text}</p>
          </div>
        ))}
        <div style={{ background: C.soft, borderRadius: "16px", padding: "28px", marginTop: "32px" }}>
          <h4 style={{ fontFamily: "Playfair Display", fontSize: "18px", color: C.charcoal, marginBottom: "20px" }}>Leave a response</h4>
          {submitted ? (
            <p style={{ color: C.blue, fontSize: "14px" }}>Your response has been submitted for review. Thank you.</p>
          ) : (
            <>
              <input value={comment.author} onChange={e => setComment({ ...comment, author: e.target.value })} placeholder="Your name"
                style={{ width: "100%", padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", marginBottom: "12px", fontFamily: "DM Sans", fontSize: "14px", outline: "none" }} />
              <textarea value={comment.text} onChange={e => setComment({ ...comment, text: e.target.value })} placeholder="Share your thoughts..." rows={4}
                style={{ width: "100%", padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", resize: "vertical", marginBottom: "16px", outline: "none" }} />
              <Btn onClick={handleSubmit}>Submit Response</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── VISION PAGE ─────────────────────────────────────────────── */
/* ─── VISION PAGE ─────────────────────────────────────────────── */
const VisionPage = ({ lang, timeline, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(79,195,247,0.05),transparent)', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>The Vision</span><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /></div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : 'clamp(32px,4vw,52px)', color: '#F8FAFC', marginBottom: '20px', lineHeight: '1.15', letterSpacing: '-0.5px' }}>{lang === 'en' ? 'What I believe Somalia can become.' : 'Waxa aan aaminahay in Soomaaliya noqon karto.'}</h1>
          <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto' }}>{lang === 'en' ? 'This is a living document. It will grow as my thinking matures. Nothing here is final.' : 'Waa dukumiinti nool. Wuu kordhayaa marka fikradaydu ay bislaato.'}</p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '44px 20px' : '68px 24px' }}>
        {[
          { title: lang==='en' ? 'On Technology & Governance' : 'Teknolojiyada & Xukuumadda', body: lang==='en' ? "Somalia\'s path forward runs through digital infrastructure. A government that invests in cybersecurity, digital identity, and transparent e-governance will be a government its people can actually trust." : "Jidka Soomaaliya wuxuu maraa kaabayaasha dijital." },
          { title: lang==='en' ? 'On the Diaspora' : 'Diaspora-da', body: lang==='en' ? "The millions of Somalis living abroad are not a footnote. They are an untapped engine. My vision includes building real, structural channels through which diaspora talent, capital, and experience flow back into Somalia." : "Malaayin Soomaali ah oo dibadda ku nool kuma aha qoraal kooban. Waa matoor aan la isticmaalin." },
          { title: lang==='en' ? 'On Unity' : 'Midnimada', body: lang==='en' ? "Unity does not come from forcing agreement. It comes from building institutions people trust, systems that are fair, and leadership that listens." : "Midnimadu kuma timaado in dadka lagu kalliftey inay is waafaqaan." },
        ].map((item, i) => (
          <AnimatedDiv key={i} delay={i*0.1} style={{ marginBottom: '52px', paddingBottom: '52px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ width: '2px', background: 'linear-gradient(to bottom,#4FC3F7,transparent)', borderRadius: '2px', flexShrink: 0, marginTop: '6px' }} />
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '28px', color: t.charcoal, marginBottom: '16px', letterSpacing: '-0.3px' }}>{item.title}</h2>
                <p style={{ color: t.body, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.9' }}>{item.body}</p>
              </div>
            </div>
          </AnimatedDiv>
        ))}
        <AnimatedDiv><h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '32px', color: t.charcoal, marginBottom: '40px', letterSpacing: '-0.3px' }}>The Roadmap to 2040</h2></AnimatedDiv>
        {timeline && timeline.map((phase, i) => (
          <AnimatedDiv key={i} delay={i*0.07}>
            <div style={{ display: 'flex', gap: isMobile ? '16px' : '28px', marginBottom: '36px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: isMobile ? '80px' : '100px', textAlign: 'right' }}>
                <div style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '700' }}>{phase.year}</div>
                <div style={{ color: t.mid, fontSize: '11px', marginTop: '2px' }}>{phase.phase}</div>
              </div>
              <div style={{ width: '1px', background: t.border, flexShrink: 0, marginTop: '4px', alignSelf: 'stretch' }} />
              <div>{phase.items.map((item, j) => (<div key={j} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706', flexShrink: 0, marginTop: '7px' }} /><span style={{ color: t.body, fontSize: '14px', lineHeight: '1.6' }}>{item}</span></div>))}</div>
            </div>
          </AnimatedDiv>
        ))}
        <Newsletter T={t} />
      </div>
    </div>
  );
};

const StoryPage = ({ lang, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>About</span></div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : '56px', color: '#F8FAFC', letterSpacing: '-1px', lineHeight: '1.1', marginBottom: '20px' }}>{lang === 'en' ? 'My Story' : 'Taariikhda'}</h1>
          <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '560px' }}>{lang === 'en' ? "I am Somali-American from Columbus, Ohio. Cybersecurity professional. Community builder. Someone who believes deeply in Somalia." : "Waxaan ahay Soomaali-Maraykan ah oo ka ah Columbus, Ohio."}</p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '44px 20px' : '68px 24px' }}>
        <AnimatedDiv style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: isMobile ? '28px' : '48px', alignItems: 'start', marginBottom: '64px', paddingBottom: '64px', borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ width: '100%', paddingBottom: '100%', borderRadius: '16px', background: `linear-gradient(135deg,${t.soft},${t.lightBlue})`, position: 'relative', overflow: 'hidden', border: `1px solid ${t.border}` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '48px' }}>🇸🇴</div>
                <span style={{ color: t.mid, fontSize: '12px', letterSpacing: '1px' }}>Photo coming soon</span>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['Based in','Columbus, Ohio'],['Field','Cybersecurity & IT'],['Education','MS Cybersecurity, WGU'],['Goal','Somalia 2040']].map(item => (
                <div key={item[0]} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ color: t.mid, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', minWidth: '72px', textTransform: 'uppercase' }}>{item[0]}</span>
                  <span style={{ color: t.charcoal, fontSize: '13px' }}>{item[1]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color: t.body, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.95', marginBottom: '20px' }}>{lang === 'en' ? "I was born into the Somali diaspora, raised in Columbus, Ohio, shaped by two worlds. American by upbringing, Somali by roots, and restless by nature." : "Waxaan ku dhashay diaspora Soomaaliyeed, ku koray Columbus, Ohio."}</p>
            <p style={{ color: t.body, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.95', marginBottom: '20px' }}>{lang === 'en' ? "My career has been in cybersecurity and technology. I hold an AS in Computer Science from Columbus State, a BS in Business from Franklin University, and am completing an MS in Cybersecurity at Western Governors University." : "Shaqadeyda waxay ahayd ammaanka dijital iyo teknoolajiyada."}</p>
            <p style={{ color: t.body, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.95' }}>{lang === 'en' ? "Alongside that I have been building Kulan Group, platforms serving education, cybersecurity, and community for the Somali diaspora. Every project I build is practice for something bigger." : "Xagga kale waxaan dhisayaa Kulan Group."}</p>
          </div>
        </AnimatedDiv>
        {[
          { year: '2040', color: '#4FC3F7', heading: lang==='en' ? 'Why Somalia?' : 'Sababta Soomaaliya?', body: lang==='en' ? "It started as a feeling. A quiet but persistent sense that Somalia\'s future matters, and that people who understand technology, governance, and community have something real to offer. Somalia 2040 is my way of thinking in public." : "Waxay bilaabatay dareen. Maaha qorshe." },
          { year: 'Now', color: '#D97706', heading: lang==='en' ? 'What I am building toward' : 'Waxa aan doonayo', body: lang==='en' ? "A Somali political leader who understands technology, the diaspora, and the next generation. I am building that track record one project at a time." : "Hogaamiye siyaasadeed oo fahma teknoolajiyada, diaspora-da." },
          { year: 'Core', color: '#10B981', heading: lang==='en' ? 'What drives me' : 'Waxa i dhaqaajiyo', body: lang==='en' ? "The diaspora gave me education, perspective, and opportunity. Somalia gave me identity, purpose, and the weight of belonging. I feel a responsibility to bridge those two things." : "Diaspora-da ayaa ii siisay waxbarasho. Soomaaliya ayaa ii siisay aqoonsiga." },
        ].map((s, i) => (
          <AnimatedDiv key={i} delay={i*0.1} style={{ display: 'flex', gap: isMobile ? '16px' : '28px', marginBottom: '48px', paddingBottom: '48px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ flexShrink: 0, width: isMobile ? '52px' : '64px', textAlign: 'right' }}><div style={{ color: s.color, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>{s.year}</div></div>
            <div style={{ width: '2px', background: `linear-gradient(to bottom,${s.color},transparent)`, borderRadius: '2px', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '14px', letterSpacing: '-0.3px' }}>{s.heading}</h2>
              <p style={{ color: t.body, fontSize: isMobile ? '15px' : '16px', lineHeight: '1.9' }}>{s.body}</p>
            </div>
          </AnimatedDiv>
        ))}
        <AnimatedDiv>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}><div style={{ height: '2px', width: '28px', background: '#D97706' }} /><span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>The Journey</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px', marginBottom: '48px' }}>
            {[['2','Degrees completed'],['MS','Currently studying'],['14+','Projects built'],['2040','The goal year']].map(item => (
              <div key={item[0]} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: '#4FC3F7', fontWeight: '700', marginBottom: '6px' }}>{item[0]}</div>
                <div style={{ color: t.mid, fontSize: '12px', lineHeight: '1.4' }}>{item[1]}</div>
              </div>
            ))}
          </div>
        </AnimatedDiv>
        <Newsletter T={t} />
      </div>
    </div>
  );
};

const ReadingPage = ({ reading, lang, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '48px 20px 40px' : '72px 24px 56px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Library</span></div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : '56px', color: '#F8FAFC', letterSpacing: '-1px', lineHeight: '1.1', marginBottom: '16px' }}>{lang === 'en' ? 'Reading List' : 'Buugaagta'}</h1>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>{lang === 'en' ? 'Books and resources shaping my thinking on Somalia, governance, and leadership.' : 'Buugaag iyo xogaha qaabeeya fikradayda.'}</p>
        </div>
      </div>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 24px' }}>
        {[...new Set(reading.map(r => r.category))].map(cat => (
          <div key={cat} style={{ marginBottom: '48px' }}>
            <AnimatedDiv><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ height: '2px', width: '24px', background: '#D97706' }} /><span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: '700' }}>{cat}</span></div></AnimatedDiv>
            {reading.filter(r => r.category === cat).map((book, i) => (
              <AnimatedDiv key={book.id} delay={i*0.06}>
                <div style={{ background: t.soft, borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', borderLeft: '3px solid #4FC3F7', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
                  <div style={{ fontWeight: '600', color: t.charcoal, fontSize: '16px', marginBottom: '3px' }}>{book.title}</div>
                  <div style={{ color: '#4FC3F7', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>{book.author}</div>
                  <p style={{ color: t.body, fontSize: '13px', lineHeight: '1.7' }}>{book.note}</p>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        ))}
        <Newsletter T={t} />
      </div>
    </div>
  );
};

const ConnectPage = ({ voices, onVoiceSubmit, lang, monthlyQ, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ author: '', location: '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const featured = voices.filter(v => v.featured);
  const others = voices.filter(v => !v.featured);
  const iStyle = { width: '100%', padding: '11px 13px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none' };
  const submit = async () => { if (!form.author || !form.text) return; await onVoiceSubmit({ ...form, featured: false, date: new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) }); setSubmitted(true); };
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '48px 20px 40px' : '72px 24px 56px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Community</span><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /></div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : '48px', color: '#F8FAFC', letterSpacing: '-0.5px', lineHeight: '1.1', marginBottom: '16px' }}>{lang === 'en' ? "Let\'s Connect" : 'Aan Xiriirno'}</h1>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>{lang === 'en' ? 'This space belongs to every Somali who has something to say.' : 'Meesha waxay u tahay Soomaali kasta oo wax yidhaahda.'}</p>
        </div>
      </div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 24px' }}>
        {monthlyQ && (
          <AnimatedDiv>
            <div style={{ background: t.dark ? '#040C16' : '#0A0F1A', border: `1px solid ${t.border}`, borderRadius: '16px', padding: isMobile ? '28px 22px' : '44px', marginBottom: '48px', textAlign: 'center' }}>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '700' }}>Monthly Question</div>
              <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '26px', color: '#F8FAFC', lineHeight: '1.5', maxWidth: '600px', margin: '0 auto', fontStyle: 'italic' }}>"{monthlyQ}"</p>
            </div>
          </AnimatedDiv>
        )}
        {featured.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <AnimatedDiv><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ height: '2px', width: '24px', background: '#D97706' }} /><span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: '700' }}>Featured Voices</span></div></AnimatedDiv>
            {featured.map((v, i) => (
              <AnimatedDiv key={v.id} delay={i*0.07}>
                <div style={{ background: t.soft, borderRadius: '12px', padding: '24px 28px', marginBottom: '14px', borderLeft: '3px solid #D97706' }}>
                  <p style={{ color: t.charcoal, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '12px' }}>"{v.text}"</p>
                  <span style={{ color: t.mid, fontSize: '13px', fontWeight: '500' }}>{v.author}{v.location ? ` · ${v.location}` : ''}</span>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '48px' }}>
          {others.map((v, i) => (
            <AnimatedDiv key={v.id} delay={i*0.05}>
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px 22px' }}>
                <p style={{ color: t.body, fontSize: '14px', lineHeight: '1.75', marginBottom: '12px', fontStyle: 'italic' }}>"{v.text}"</p>
                <span style={{ color: t.mid, fontSize: '12px', fontWeight: '500' }}>{v.author}{v.location ? ` · ${v.location}` : ''}</span>
              </div>
            </AnimatedDiv>
          ))}
        </div>
        <AnimatedDiv>
          <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '16px', padding: isMobile ? '28px 22px' : '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '30px', color: t.charcoal, marginBottom: '8px', letterSpacing: '-0.3px' }}>Share Your Voice</h2>
            <p style={{ color: t.mid, fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>Submitted voices are reviewed before going live.</p>
            {submitted ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '16px 20px', color: '#065F46', fontSize: '14px', fontWeight: '500' }}>Thank you for sharing. Your voice has been submitted for review.</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="Your name *" style={iStyle} />
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Your city / country" style={iStyle} />
                </div>
                <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} placeholder="Your thoughts on Somalia, politics, or the future..." rows={5} style={{ ...iStyle, resize: 'vertical', marginBottom: '16px' }} />
                <Btn onClick={submit} T={t}>Submit Your Voice</Btn>
              </>
            )}
          </div>
        </AnimatedDiv>
        <Newsletter T={t} />
      </div>
    </div>
  );
};

const RTE = ({ value, onChange, T }) => {
  const t = T || getT(false);
  const ref = useRef(null);
  const init = useRef(false);
  const timer = useRef(null);
  useEffect(() => { if (ref.current && !init.current) { ref.current.innerHTML = value || ''; init.current = true; } }, []);
  const exec = (cmd, arg) => { ref.current.focus(); document.execCommand(cmd, false, arg || null); trigger(); };
  const trigger = () => { clearTimeout(timer.current); timer.current = setTimeout(() => { if (ref.current) onChange(ref.current.innerHTML); }, 800); };
  const bs = { padding: '5px 9px', border: `1px solid ${t.border}`, background: t.soft, color: t.charcoal, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 };
  const sep = <div style={{ width: '1px', height: '20px', background: t.border, margin: '0 2px', flexShrink: 0 }}/>;
  return (
    <div style={{ border: `1.5px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{ background: t.soft, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onMouseDown={e => { e.preventDefault(); exec('bold'); }} style={{ ...bs, fontWeight: '700' }}>B</button>
        <button onMouseDown={e => { e.preventDefault(); exec('italic'); }} style={{ ...bs, fontStyle: 'italic' }}>I</button>
        <button onMouseDown={e => { e.preventDefault(); exec('underline'); }} style={{ ...bs, textDecoration: 'underline' }}>U</button>
        {sep}
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h1'); }} style={{ ...bs, fontFamily: 'Playfair Display', fontSize: '13px' }}>H1</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2'); }} style={{ ...bs, fontFamily: 'Playfair Display', fontSize: '12px' }}>H2</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3'); }} style={{ ...bs, fontFamily: 'Playfair Display', fontSize: '11px' }}>H3</button>
        {sep}
        <button onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} style={bs}>List</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'blockquote'); }} style={bs}>Quote</button>
        <button onMouseDown={e => { e.preventDefault(); const u = prompt('URL:'); if(u) exec('createLink', u); }} style={bs}>Link</button>
        <button onMouseDown={e => { e.preventDefault(); const u = prompt('Image URL:'); if(u) exec('insertImage', u); }} style={bs}>Img</button>
        {sep}
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }} defaultValue="" style={{ ...bs, padding: '4px 6px' }}>
          <option value="" disabled>Size</option>
          {[['Small','1'],['Normal','3'],['Large','5'],['XL','7']].map(([l,v]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={trigger} style={{ minHeight: '240px', padding: '16px', color: t.charcoal, background: t.inputBg, fontSize: '15px', lineHeight: '1.85' }} />
      <div style={{ padding: '6px 12px', background: t.soft, borderTop: `1px solid ${t.border}`, fontSize: '11px', color: t.mid }}>Auto-saves as you type</div>
    </div>
  );
};

/* ─── ADMIN MEDIA ──────────────────────────────────────────────── */
const AdminMedia = ({ T, onSelect }) => {
  const t = T || getT(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const ref = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await listMedia();
      setFiles(result || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    await uploadMedia(file);
    await load();
    setUploading(false);
  };

  const remove = async (path) => {
    if (!confirm('Delete this image?')) return;
    await deleteMedia(path);
    setFiles(files.filter(f => f.path !== path));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, letterSpacing: '-0.3px' }}>Media Library</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {uploading && <Spinner size={20}/>}
          <Btn small onClick={() => ref.current.click()} T={t}>+ Upload Image</Btn>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
        </div>
      </div>
      <div style={{ border: `2px dashed ${t.border}`, borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '20px', cursor: 'pointer', background: t.soft }} onClick={() => ref.current.click()} onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()} onMouseEnter={e => e.currentTarget.style.borderColor = '#4FC3F7'} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
        <p style={{ color: t.mid, fontSize: '14px' }}>Drag and drop images here or click to upload</p>
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>
        : files.length === 0 ? <p style={{ color: t.mid, textAlign: 'center', padding: '40px' }}>No images uploaded yet.</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px' }}>
          {files.map(f => (
            <div key={f.path} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden', cursor: onSelect ? 'pointer' : 'default', transition: 'border 0.2s' }} onClick={() => onSelect && onSelect(f.url)} onMouseEnter={e => e.currentTarget.style.borderColor = '#4FC3F7'} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
              <img src={f.url} alt={f.name} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display='none'} />
              <div style={{ padding: '8px 10px' }}>
                <p style={{ color: t.charcoal, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>{f.name}</p>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(f.url); setCopied(f.name); setTimeout(() => setCopied(null), 2000); }} style={{ flex: 1, padding: '4px', fontSize: '10px', background: copied === f.name ? '#D1FAE5' : t.lightBlue, color: copied === f.name ? '#065F46' : t.blueDark, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{copied === f.name ? 'Copied!' : 'Copy URL'}</button>
                  <button onClick={e => { e.stopPropagation(); remove(f.path); }} style={{ padding: '4px 6px', fontSize: '10px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
};

/* ─── ADMIN LOGIN ─────────────────────────────────────────────── */
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const attempt = () => {
    if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) { onLogin(); setErr(false); }
    else setErr(true);
  };
  const iStyle = (e) => ({ width: "100%", padding: "13px 14px", border: `1.5px solid ${e ? "#EF4444" : C.border}`, borderRadius: "10px", fontFamily: "DM Sans", fontSize: "14px", marginBottom: "12px", outline: "none", color: C.charcoal, background: C.soft });
  return (
    <div style={{ minHeight: "100vh", background: C.charcoal, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: C.white, borderRadius: "20px", padding: "48px", width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ color: C.white, fontSize: "24px", fontFamily: "Playfair Display", fontWeight: "700" }}>S</span>
          </div>
          <h2 style={{ fontFamily: "Playfair Display", fontSize: "26px", color: C.charcoal, marginBottom: "6px" }}>Admin Access</h2>
          <p style={{ color: C.mid, fontSize: "13px" }}>Somalia 2040 - Dashboard</p>
        </div>
        <label style={{ color: C.mid, fontSize: "12px", display: "block", marginBottom: "6px" }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()} placeholder="your@email.com" style={iStyle(err)} />
        <label style={{ color: C.mid, fontSize: "12px", display: "block", marginBottom: "6px" }}>Password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()} placeholder="••••••••••" style={{ ...iStyle(err), letterSpacing: "4px" }} />
        {err && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px" }}>Incorrect email or password.</p>}
        <div style={{ height: "8px" }} />
        <Btn onClick={attempt} style={{ width: "100%" }}>Enter Dashboard</Btn>
      </div>
    </div>
  );
};

/* ─── ADMIN SHELL ─────────────────────────────────────────────── */
/* ─── ADMIN SHELL ─────────────────────────────────────────────── */
const AdminShell = ({ children, tab, setTab, onLogout, T }) => {
  const t = T; const isMobile = useIsMobile(); const [sideOpen, setSideOpen] = useState(false);
  const tabs = [
    { key: 'dash', label: 'Dashboard', icon: '⊞' }, { key: 'posts', label: 'Blog Posts', icon: '✍' },
    { key: 'media', label: 'Media Library', icon: '🖼' }, { key: 'analytics', label: 'Analytics', icon: '📊' },
    { key: 'comments', label: 'Comments', icon: '💬' }, { key: 'community', label: 'Community', icon: '👥' },
    { key: 'word', label: 'Word of Week', icon: '📖' }, { key: 'reading', label: 'Reading List', icon: '📚' },
    { key: 'timeline', label: 'Timeline', icon: '🗓' }, { key: 'settings', label: 'Settings', icon: '⚙' },
  ];
  const Sidebar = () => (
    <div style={{ width: isMobile ? '100%' : '220px', background: '#040C16', borderRight: '1px solid #0A1628', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 'auto' : '100vh' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #0A1628', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StarLogo size={28} />
        <div>
          <div style={{ fontFamily: 'Playfair Display', fontSize: '14px', color: '#F8FAFC' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span></div>
          <div style={{ color: '#334155', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {tabs.map(tb => (
          <div key={tb.key} onClick={() => { setTab(tb.key); setSideOpen(false); }} style={{ padding: '11px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === tb.key ? '600' : '400', color: tab === tb.key ? '#4FC3F7' : '#475569', background: tab === tb.key ? 'rgba(79,195,247,0.07)' : 'transparent', borderLeft: tab === tb.key ? '3px solid #4FC3F7' : '3px solid transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={e => { if (tab !== tb.key) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }} onMouseLeave={e => { if (tab !== tb.key) { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; } }}>
            <span style={{ fontSize: '15px', opacity: 0.75, width: '20px', textAlign: 'center' }}>{tb.icon}</span><span>{tb.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #0A1628' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🇸🇴</div>
          <div><div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '500' }}>Mohamud</div><div style={{ color: '#334155', fontSize: '10px' }}>Admin</div></div>
        </div>
        <div onClick={onLogout} style={{ color: '#334155', fontSize: '12px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#334155'}>← Logout</div>
      </div>
    </div>
  );
  if (isMobile) return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      <div style={{ background: '#040C16', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0A1628' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><StarLogo size={24} /><div style={{ fontFamily: 'Playfair Display', fontSize: '14px', color: '#F8FAFC' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span></div></div>
        <button onClick={() => setSideOpen(!sideOpen)} style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '20px', cursor: 'pointer' }}>☰</button>
      </div>
      {sideOpen && <Sidebar />}
      <div style={{ padding: '24px 16px' }}>{children}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 'calc(100vw - 220px)' }}>{children}</div>
    </div>
  );
};


const AdminDash = ({ posts, voices }) => {
  const stats = [
    { label: "Published Posts", value: posts.filter(p => p.published).length, color: C.blue },
    { label: "Drafts", value: posts.filter(p => !p.published).length, color: C.gold },
    { label: "Pending Comments", value: posts.flatMap(p => p.somalia_comments || []).filter(c => !c.approved).length, color: "#EF4444" },
    { label: "Community Voices", value: voices.length, color: "#10B981" },
  ];
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "32px" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "40px" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: C.white, borderRadius: "12px", padding: "24px", borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: "32px", fontWeight: "700", color: s.color, fontFamily: "Playfair Display" }}>{s.value}</div>
            <div style={{ color: C.mid, fontSize: "13px", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.white, borderRadius: "12px", padding: "28px" }}>
        <h3 style={{ fontFamily: "Playfair Display", fontSize: "18px", color: C.charcoal, marginBottom: "20px" }}>Recent Posts</h3>
        {posts.slice(0, 5).map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            <div>
              <span style={{ color: C.charcoal, fontSize: "14px", fontWeight: "500" }}>{p.title}</span>
              <span style={{ color: C.mid, fontSize: "12px", display: "block" }}>{p.date}</span>
            </div>
            <span style={{ background: p.published ? C.lightBlue : "#FEF3C7", color: p.published ? C.blueDark : "#92400E", fontSize: "10px", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" }}>
              {p.published ? "Published" : "Draft"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ADMIN POSTS ─────────────────────────────────────────────── */
const AdminPosts = ({ posts, onSave, onDelete, onToggle }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", title_so: "", excerpt: "", excerpt_so: "", content: "", content_so: "", published: false, featured: false });
  const [saving, setSaving] = useState(false);

  const openEdit = (post) => { setEditing(post.id); setForm({ title: post.title, title_so: post.title_so || "", excerpt: post.excerpt || "", excerpt_so: post.excerpt_so || "", content: post.content || "", content_so: post.content_so || "", published: post.published, featured: post.featured }); };
  const openNew = () => { setEditing("new"); setForm({ title: "", title_so: "", excerpt: "", excerpt_so: "", content: "", content_so: "", published: false, featured: false }); };
  const save = async () => {
    setSaving(true);
    const payload = editing === "new"
      ? { ...form, date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) }
      : { id: editing, ...form };
    await onSave(payload);
    setSaving(false);
    setEditing(null);
  };

  const inputStyle = { width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", marginBottom: "12px", outline: "none" };

  if (editing !== null) return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Playfair Display", fontSize: "24px", color: C.charcoal }}>{editing === "new" ? "New Post" : "Edit Post"}</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Btn outline small onClick={() => setEditing(null)}>Cancel</Btn>
          <Btn small onClick={save}>{saving ? "Saving..." : "Save Post"}</Btn>
        </div>
      </div>
      <div style={{ background: C.white, borderRadius: "12px", padding: "28px" }}>
        {[["title", "Title (English)"], ["title_so", "Title (Somali)"], ["excerpt", "Excerpt (English)"], ["excerpt_so", "Excerpt (Somali)"]].map(([field, label]) => (
          <div key={field}>
            <label style={{ color: C.mid, fontSize: "12px", display: "block", marginBottom: "4px" }}>{label}</label>
            <input style={inputStyle} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={label} />
          </div>
        ))}
        {[["content", "Content (English)"], ["content_so", "Content (Somali)"]].map(([field, label]) => (
          <div key={field}>
            <label style={{ color: C.mid, fontSize: "12px", display: "block", marginBottom: "4px" }}>{label}</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={8} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={label} />
          </div>
        ))}
        <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
          {[["published", "Published"], ["featured", "Featured on Homepage"]].map(([field, label]) => (
            <label key={field} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: C.charcoal }}>
              <input type="checkbox" checked={form[field]} onChange={e => setForm({ ...form, [field]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal }}>Blog Posts</h1>
        <Btn small onClick={openNew}>+ New Post</Btn>
      </div>
      <div style={{ background: C.white, borderRadius: "12px", overflow: "hidden" }}>
        {posts.map((p, i) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < posts.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: C.charcoal, fontSize: "14px", fontWeight: "500" }}>{p.title}</span>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <span style={{ color: C.mid, fontSize: "11px" }}>{p.date}</span>
                {p.featured && <span style={{ color: C.gold, fontSize: "11px" }}>★ Featured</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span onClick={() => onToggle(p.id, "published", !p.published)} style={{ background: p.published ? C.lightBlue : "#FEF3C7", color: p.published ? C.blueDark : "#92400E", fontSize: "10px", padding: "3px 10px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>
                {p.published ? "Published" : "Draft"}
              </span>
              <Btn small outline onClick={() => openEdit(p)}>Edit</Btn>
              <Btn small onClick={() => onDelete(p.id)} style={{ background: "#FEF2F2", color: "#EF4444", border: "none" }}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ADMIN COMMENTS ──────────────────────────────────────────── */
const AdminComments = ({ posts, onApprove, onDelete }) => {
  const allComments = posts.flatMap(p => (p.somalia_comments || []).map(c => ({ ...c, postTitle: p.title })));
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "28px" }}>Comment Moderation</h1>
      {allComments.length === 0 && <p style={{ color: C.mid }}>No comments yet.</p>}
      {allComments.map(c => (
        <div key={c.id} style={{ background: C.white, borderRadius: "12px", padding: "20px 24px", marginBottom: "12px", borderLeft: `3px solid ${c.approved ? "#10B981" : "#F59E0B"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <span style={{ fontWeight: "600", color: C.charcoal, fontSize: "14px" }}>{c.author}</span>
              <span style={{ color: C.mid, fontSize: "12px", marginLeft: "12px" }}>on: {c.postTitle}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {!c.approved && <Btn small onClick={() => onApprove(c.id)} style={{ background: "#D1FAE5", color: "#065F46", border: "none" }}>Approve</Btn>}
              <Btn small onClick={() => onDelete(c.id)} style={{ background: "#FEF2F2", color: "#EF4444", border: "none" }}>Delete</Btn>
            </div>
          </div>
          <p style={{ color: C.charcoal, fontSize: "14px", lineHeight: "1.6" }}>{c.text}</p>
          <span style={{ background: c.approved ? "#D1FAE5" : "#FEF3C7", color: c.approved ? "#065F46" : "#92400E", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600", marginTop: "8px", display: "inline-block" }}>
            {c.approved ? "Approved" : "Pending"}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── ADMIN COMMUNITY ─────────────────────────────────────────── */
const AdminCommunity = ({ voices, onToggleFeatured, onDelete, monthlyQ, onUpdateQ }) => {
  const [q, setQ] = useState(monthlyQ || "");
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "28px" }}>Community Manager</h1>
      <div style={{ background: C.white, borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontFamily: "Playfair Display", fontSize: "18px", color: C.charcoal, marginBottom: "16px" }}>Monthly Question</h3>
        <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} style={{ width: "100%", padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", resize: "vertical", outline: "none", marginBottom: "12px" }} />
        <Btn small onClick={() => onUpdateQ(q)}>Update Question</Btn>
      </div>
      <div style={{ background: C.white, borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: "Playfair Display", fontSize: "18px", color: C.charcoal }}>Community Voices ({voices.length})</h3>
        </div>
        {voices.map((v, i) => (
          <div key={v.id} style={{ padding: "16px 24px", borderBottom: i < voices.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: "600", color: C.charcoal, fontSize: "14px" }}>{v.author}</span>
                {v.location && <span style={{ color: C.mid, fontSize: "12px" }}> - {v.location}</span>}
                <p style={{ color: C.mid, fontSize: "13px", margin: "6px 0 0", lineHeight: "1.5" }}>{v.text}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                <Btn small onClick={() => onToggleFeatured(v.id, !v.featured)} style={{ background: v.featured ? "#FEF3C7" : C.lightBlue, color: v.featured ? "#92400E" : C.blueDark, border: "none" }}>
                  {v.featured ? "Unfeature" : "Feature"}
                </Btn>
                <Btn small onClick={() => onDelete(v.id)} style={{ background: "#FEF2F2", color: "#EF4444", border: "none" }}>Delete</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ADMIN WORD ──────────────────────────────────────────────── */
const AdminWord = ({ word, onUpdate }) => {
  const [form, setForm] = useState(word || { somali: "", english: "", sentence: "" });
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "28px" }}>Word of the Week</h1>
      <div style={{ background: C.white, borderRadius: "12px", padding: "28px", maxWidth: "500px" }}>
        {[["somali", "Somali Word"], ["english", "English Translation"], ["sentence", "Example Sentence (Somali)"]].map(([field, label]) => (
          <div key={field} style={{ marginBottom: "16px" }}>
            <label style={{ color: C.mid, fontSize: "12px", display: "block", marginBottom: "6px" }}>{label}</label>
            <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", outline: "none" }} />
          </div>
        ))}
        <Btn onClick={() => onUpdate(form)}>Update Word</Btn>
      </div>
      {word && (
        <div style={{ marginTop: "24px", background: C.charcoal, borderRadius: "12px", padding: "24px", maxWidth: "500px" }}>
          <div style={{ color: C.blue, fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>PREVIEW</div>
          <div style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.white }}>{word.somali}</div>
          <div style={{ color: C.gold, fontSize: "14px", margin: "4px 0 10px" }}>{word.english}</div>
          <p style={{ color: "#9CA3AF", fontSize: "13px", fontStyle: "italic" }}>{word.sentence}</p>
        </div>
      )}
    </div>
  );
};

/* ─── ADMIN READING ───────────────────────────────────────────── */
const AdminReading = ({ reading, onAdd, onDelete }) => {
  const [form, setForm] = useState({ title: "", author: "", category: "", note: "" });
  const add = async () => {
    if (!form.title || !form.author) return;
    await onAdd(form);
    setForm({ title: "", author: "", category: "", note: "" });
  };
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "28px" }}>Reading List</h1>
      <div style={{ background: C.white, borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontFamily: "Playfair Display", fontSize: "18px", color: C.charcoal, marginBottom: "16px" }}>Add a Book</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          {[["title", "Title"], ["author", "Author"], ["category", "Category"]].map(([f, p]) => (
            <input key={f} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} placeholder={p}
              style={{ padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", outline: "none" }} />
          ))}
        </div>
        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Why you recommend it..." rows={2}
          style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", resize: "vertical", marginBottom: "12px", outline: "none" }} />
        <Btn small onClick={add}>Add Book</Btn>
      </div>
      {reading.map(b => (
        <div key={b.id} style={{ background: C.white, borderRadius: "10px", padding: "16px 20px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontWeight: "600", color: C.charcoal, fontSize: "14px" }}>{b.title}</span>
            <span style={{ color: C.blue, fontSize: "13px", marginLeft: "8px" }}>by {b.author}</span>
            <span style={{ color: C.mid, fontSize: "11px", display: "block", marginTop: "2px" }}>{b.category}</span>
          </div>
          <Btn small onClick={() => onDelete(b.id)} style={{ background: "#FEF2F2", color: "#EF4444", border: "none" }}>Remove</Btn>
        </div>
      ))}
    </div>
  );
};

/* ─── ADMIN TIMELINE ──────────────────────────────────────────── */
const AdminTimeline = ({ timeline, onUpdate }) => {
  const [local, setLocal] = useState(timeline || []);
  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal }}>Somalia 2040 Roadmap</h1>
        <Btn small onClick={() => onUpdate(local)}>Save Changes</Btn>
      </div>
      {local.map((phase, i) => (
        <div key={i} style={{ background: C.white, borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ background: C.lightBlue, color: C.blueDark, fontSize: "12px", fontWeight: "600", padding: "4px 12px", borderRadius: "20px" }}>{phase.year}</div>
            <div style={{ fontFamily: "Playfair Display", fontSize: "18px", color: C.charcoal }}>{phase.phase}</div>
          </div>
          {phase.items.map((item, j) => (
            <div key={j} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
              <input value={item} onChange={e => {
                const updated = [...local];
                updated[i] = { ...updated[i], items: updated[i].items.map((it, idx) => idx === j ? e.target.value : it) };
                setLocal(updated);
              }} style={{ flex: 1, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: "6px", fontFamily: "DM Sans", fontSize: "13px", outline: "none" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/* ─── ADMIN SETTINGS ──────────────────────────────────────────── */
const AdminSettings = ({ setPage }) => (
  <div className="fade-in">
    <h1 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "28px" }}>Settings</h1>
    <div style={{ background: C.white, borderRadius: "12px", padding: "28px", maxWidth: "500px" }}>
      {[["Site URL", "politics.mmohamud.me"], ["Admin Email", ADMIN_EMAIL], ["Site Title", "Somalia 2040"]].map(([label, val]) => (
        <div key={label} style={{ marginBottom: "20px" }}>
          <label style={{ color: C.mid, fontSize: "12px", display: "block", marginBottom: "6px" }}>{label}</label>
          <input defaultValue={val} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", outline: "none" }} />
        </div>
      ))}
      <Divider />
      <div onClick={() => setPage("home")} style={{ color: C.blue, fontSize: "14px", cursor: "pointer", fontWeight: "500" }}>← View Public Site</div>
    </div>
  </div>
);

/* ─── MAIN APP ────────────────────────────────────────────────── */
/* ─── ADMIN ANALYTICS ─────────────────────────────────────────── */
const AdminAnalytics = ({ T }) => {
  const t = T; const isMobile = useIsMobile();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  useEffect(() => {
    const load = async () => { setLoading(true); const s = await getAnalyticsSummary(days); setSummary(s); setLoading(false); };
    load();
  }, [days]);
  const maxD = summary?.dailyViews?.length > 0 ? Math.max(...summary.dailyViews.map(([,v]) => v), 1) : 1;
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div><h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, letterSpacing: '-0.3px' }}>Analytics</h1><p style={{ color: t.mid, fontSize: '13px', marginTop: '4px' }}>Visitor insights</p></div>
        <div style={{ display: 'flex', gap: '6px' }}>{[7,30,90].map(d => (<button key={d} onClick={() => setDays(d)} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${days === d ? '#4FC3F7' : t.border}`, background: days === d ? 'rgba(79,195,247,0.1)' : t.card, color: days === d ? '#4FC3F7' : t.mid }}>{d}d</button>))}</div>
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner /></div> : !summary ? <p style={{ color: t.mid }}>No data yet.</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            {[{ label: 'Page Views', value: summary.totalViews, color: '#4FC3F7' }, { label: 'Sessions', value: summary.uniqueSessions, color: '#D97706' }, { label: 'Mobile', value: summary.devices?.mobile || 0, color: '#10B981' }, { label: 'Desktop', value: summary.devices?.desktop || 0, color: '#8B5CF6' }].map(s => (
              <div key={s.label} style={{ background: t.card, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}`, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display' }}>{s.value}</div>
                <div style={{ color: t.mid, fontSize: '12px', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Daily Views — Last {days} days</h3>
              </div>
              {summary.dailyViews.length === 0 ? <p style={{ color: t.mid, fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No data for this period yet.</p> : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px' }}>
                  {summary.dailyViews.map(([date, views]) => (
                    <div key={date} title={`${date}: ${views} views`} style={{ flex: 1, height: `${Math.max(4, (views / maxD) * 100)}%`, background: 'rgba(79,195,247,0.5)', borderRadius: '2px 2px 0 0', minHeight: '4px', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,195,247,0.9)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,195,247,0.5)'} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '16px', background: '#D97706', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Devices</h3>
              </div>
              {Object.entries(summary.devices || {}).filter(([,v]) => v > 0).map(([device, count]) => {
                const total = Object.values(summary.devices || {}).reduce((s,v) => s+v, 0) || 1;
                const pct = Math.round((count/total)*100);
                const colors = { desktop: '#4FC3F7', mobile: '#D97706', tablet: '#10B981' };
                return (
                  <div key={device} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{device.charAt(0).toUpperCase()+device.slice(1)}</span>
                      <span style={{ color: colors[device] || '#4FC3F7', fontSize: '13px', fontWeight: '700' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: t.border, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[device] || '#4FC3F7', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}><div style={{ width: '3px', height: '16px', background: '#10B981', borderRadius: '2px' }} /><h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Top Pages</h3></div>
              {summary.topPages.length === 0 ? <p style={{ color: t.mid, fontSize: '13px' }}>No data yet.</p> : summary.topPages.map(([page, views], i) => (
                <div key={page} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < summary.topPages.length-1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <span style={{ color: t.mid, fontSize: '11px', fontWeight: '700', width: '16px', flexShrink: 0 }}>{i+1}</span>
                    <span style={{ color: t.charcoal, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page || 'home'}</span>
                  </div>
                  <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '700', marginLeft: '12px', flexShrink: 0 }}>{views}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #040C16, #0F1E30)', borderRadius: '12px', padding: '22px', border: '1px solid #1A2D44' }}>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '10px' }}>Power tip</div>
              <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>For geographic data and user journeys, connect Google Analytics 4. You already have GA4 experience from Kulan Institute.</p>
              <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>Open Google Analytics →</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── MARKETING PAGE ───────────────────────────────────────────── */
const MarketingPage = ({ setPage, lang, voices, posts, T }) => {
  const t = T; const isMobile = useIsMobile();
  const totalReads = posts.reduce((s,p) => s+(p.views||0), 0);
  const pubCount = posts.filter(p => p.published).length;
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg, #040C16 0%, #08111E 40%, #040C16 100%)', minHeight: isMobile ? '70vh' : '80vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: isMobile ? '60px 20px' : '80px 24px' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(79,195,247,0.07), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="fade-in" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)', borderRadius: '20px', padding: '6px 14px', marginBottom: '28px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4FC3F7', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>Somalia 2040 · Build. Unite. Lead.</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : 'clamp(44px,5vw,68px)', color: '#F8FAFC', fontWeight: '700', lineHeight: '1.08', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              {lang === 'en' ? <>The platform for<br /><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Somalia&apos;s</span> future leaders.</> : <>Madasha hogaaminteeda mustaqbalka.</>}
            </h1>
            <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '520px', marginBottom: '40px' }}>{lang === 'en' ? 'Essays, community voices, and an honest roadmap from a Somali-American who believes the diaspora has a role to play.' : 'Maqaallo, codadka bulshada, iyo qorshaha daacadda ah.'}</p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('blog')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#7DD3F8'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#4FC3F7'; e.currentTarget.style.transform = 'translateY(0)'; }}>{lang === 'en' ? 'Read the essays' : 'Akhri maqaalada'}</button>
              <button onClick={() => setPage('vision')} style={{ background: 'transparent', color: '#94A3B8', border: '1.5px solid #1A2D44', padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: '6px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.color = '#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2D44'; e.currentTarget.style.color = '#94A3B8'; }}>{lang === 'en' ? 'The Vision' : 'Aragtida'}</button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: t.soft, borderBottom: `1px solid ${t.border}`, padding: isMobile ? '24px 20px' : '28px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '24px' }}>
          {[{ num: pubCount, label: lang === 'en' ? 'Essays published' : 'Maqaallo la daabacay' }, { num: fmt(totalReads), label: lang === 'en' ? 'Total reads' : 'Akhrinta guud' }, { num: voices.length, label: lang === 'en' ? 'Community voices' : 'Codadka bulshada' }, { num: '2040', label: lang === 'en' ? 'The target year' : 'Sannadka bartilmaameedka' }].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: '32px', color: '#4FC3F7', fontWeight: '700', lineHeight: '1' }}>{item.num}</div>
              <div style={{ color: t.mid, fontSize: '13px', marginTop: '6px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '52px 20px' : '80px 24px' }}>
        <AnimatedDiv style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '40px', color: t.charcoal, letterSpacing: '-0.5px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.2' }}>{lang === 'en' ? 'Three things Somalia needs most.' : 'Saddexda wax oo Soomaaliya ugu baahan tahay.'}</h2>
        </AnimatedDiv>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '20px', marginBottom: '80px' }}>
          {[{ icon: '💻', title: lang === 'en' ? 'Technology & Governance' : 'Teknoolajiyada & Xukuumadda', body: lang === 'en' ? 'Somalia needs leaders who understand digital infrastructure, cybersecurity, and e-governance. Technology is the foundation of modern statehood.' : 'Soomaaliya waxay u baahan tahay hogaamineyaasha fahmaya kaabayaasha dijital.', color: '#4FC3F7' },
           { icon: '🌍', title: lang === 'en' ? 'Diaspora Power' : 'Xoogga Diaspora', body: lang === 'en' ? 'Millions of educated, globally connected Somalis live abroad. Building channels for their expertise and capital to flow home is one of the greatest untapped opportunities.' : 'Malaayin Soomaali ah oo waxbarashada leh ayaa dibadda ku nool.', color: '#D97706' },
           { icon: '🤝', title: lang === 'en' ? 'Unity Through Trust' : 'Midnimada Xoogga Aaminaadda', body: lang === 'en' ? 'Unity is not forced agreement. It comes from fair systems, accountable institutions, and leadership that genuinely listens.' : 'Midnimadu kuma timaado heshiis lagu khasbiyo.', color: '#10B981' }].map((p, i) => (
            <AnimatedDiv key={i} delay={i * 0.1}>
              <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '32px 28px', height: '100%', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{p.icon}</div>
                <div style={{ width: '32px', height: '3px', background: p.color, borderRadius: '2px', marginBottom: '16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal, marginBottom: '14px', letterSpacing: '-0.2px', lineHeight: '1.3' }}>{p.title}</h3>
                <p style={{ color: t.body, fontSize: '15px', lineHeight: '1.8' }}>{p.body}</p>
              </div>
            </AnimatedDiv>
          ))}
        </div>
        <AnimatedDiv style={{ marginBottom: '60px' }}>
          <div style={{ background: t.dark ? '#040C16' : '#0A0F1A', borderRadius: '20px', padding: isMobile ? '36px 28px' : '56px 60px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(79,195,247,0.06), transparent)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '60px' : '80px', color: '#4FC3F7', opacity: 0.15, lineHeight: '0.5', marginBottom: '20px' }}>"</div>
            <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '26px', color: '#F8FAFC', lineHeight: '1.6', marginBottom: '24px', maxWidth: '640px', fontStyle: 'italic', letterSpacing: '-0.2px' }}>{lang === 'en' ? "It started as a feeling. Not a plan, not a calculation. A quiet but persistent sense that Somalia's future matters, and that people like me have something real to offer." : "Waxay bilaabatay dareen. Maaha qorshe, maahan xisaab."}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(79,195,247,0.15)', border: '1px solid rgba(79,195,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🇸🇴</div>
              <div><div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: '600' }}>Mohamud Mohamed</div><div style={{ color: '#475569', fontSize: '12px' }}>Founder, Somalia 2040</div></div>
            </div>
          </div>
        </AnimatedDiv>
        <AnimatedDiv>
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 40px', background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '36px', color: t.charcoal, marginBottom: '14px', letterSpacing: '-0.3px' }}>{lang === 'en' ? 'Join the conversation.' : 'Ku biir xiriirka.'}</h2>
            <p style={{ color: t.mid, fontSize: '16px', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto 32px' }}>{lang === 'en' ? 'This is a space for every Somali who thinks deeply about the future.' : 'Meeshan waxay u tahay Soomaali kasta oo si qoto dheer u fikira mustaqbalka.'}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('connect')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: '13px 30px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#7DD3F8'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#4FC3F7'; e.currentTarget.style.transform = 'translateY(0)'; }}>{lang === 'en' ? "Let's Connect" : 'Aan Xiriirno'}</button>
              <button onClick={() => setPage('blog')} style={{ background: 'transparent', color: t.charcoal, border: `1.5px solid ${t.border}`, padding: '13px 30px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.color = '#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.charcoal; }}>{lang === 'en' ? 'Read the Blog' : 'Blog-ka'}</button>
            </div>
          </div>
        </AnimatedDiv>
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage]         = useState(() => localStorage.getItem('s2040_page') || 'home');
  const [lang, setLang]         = useState('en');
  const [dark, setDark]         = useState(() => localStorage.getItem('s2040_dark') === 'true');
  const [transitioning, setTrans] = useState(false);
  const [posts, setPosts]       = useState([]);
  const [voices, setVoices]     = useState([]);
  const [reading, setReading]   = useState([]);
  const [word, setWord]         = useState(null);
  const [wordArchive, setWordArchive] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [monthlyQ, setMonthlyQ] = useState('');
  const [siteTitle, setSiteTitle] = useState('Somalia');
  const [announcement, setAnnouncement] = useState(null);
  const [annDismissed, setAnnDismissed] = useState(false);
  const [currentPost, setCurrentPost] = useState(() => { try { return JSON.parse(localStorage.getItem('s2040_post') || 'null'); } catch { return null; } });
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => localStorage.getItem('s2040_admin') === 'true');
  const [adminTab, setAdminTab] = useState(() => localStorage.getItem('s2040_tab') || 'dash');
  const [loading, setLoading]   = useState(true);

  const T = getT(dark);

  useEffect(() => { localStorage.setItem('s2040_dark', dark); }, [dark]);
  useEffect(() => { localStorage.setItem('s2040_tab', adminTab); }, [adminTab]);
  useEffect(() => { if (page !== 'admin') localStorage.setItem('s2040_page', page); }, [page]);
  useEffect(() => { document.title = `${siteTitle} 2040`; }, [siteTitle]);

  const nav = useCallback((p) => {
    if (p !== 'admin') { localStorage.setItem('s2040_page', p); trackEvent('page_view', { page: p }); }
    setTrans(true);
    setTimeout(() => { setPage(p); setTrans(false); window.scrollTo(0, 0); }, 150);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, v, r, w, q, tl, st, wa, ann] = await Promise.all([
      getPosts(), getVoices(), getReading(),
      getSetting('word_of_week'), getSetting('monthly_question'), getSetting('timeline'),
      getSetting('site_title'), getWordArchive(), getAnnouncement(),
    ]);
    setPosts(p || []); setVoices(v || []); setReading(r || []);
    if (w) setWord(w);
    if (q) setMonthlyQ(typeof q === 'string' ? q : '');
    if (tl) setTimeline(tl);
    if (st) setSiteTitle(typeof st === 'string' ? st : 'Somalia');
    setWordArchive(wa || []);
    if (ann) setAnnouncement(ann);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); trackEvent('page_view', { page: 'home' }); }, []);

  useEffect(() => {
    if (page === 'post' && currentPost && posts.length > 0) {
      const found = posts.find(p => p.id === currentPost.id);
      if (found) setCurrentPost(found);
    }
  }, [posts]);

  const adminLogin  = () => { setAdminLoggedIn(true); localStorage.setItem('s2040_admin', 'true'); };
  const adminLogout = () => { setAdminLoggedIn(false); localStorage.removeItem('s2040_admin'); nav('home'); };

  const hSavePost    = async (p) => { await savePost(p); await loadAll(); };
  const hDeletePost  = async (id) => { await deletePost(id); setPosts(prev => prev.filter(p => p.id !== id)); };
  const hTogglePost  = async (id, f, v) => { await togglePostField(id, f, v); await loadAll(); };
  const hAddComment  = async (c) => { await addComment(c); await loadAll(); };
  const hApproveComment = async (id) => { await approveComment(id); await loadAll(); };
  const hDeleteComment  = async (id) => { await deleteComment(id); await loadAll(); };
  const hAddVoice    = async (v) => { const nv = await addVoice(v); if (nv) setVoices(prev => [nv, ...prev]); };
  const hToggleVoice = async (id, f) => { await toggleVoiceFeatured(id, f); await loadAll(); };
  const hDeleteVoice = async (id) => { await deleteVoice(id); setVoices(prev => prev.filter(v => v.id !== id)); };
  const hAddBook     = async (b) => { const nb = await addBook(b); if (nb) setReading(prev => [...prev, nb]); };
  const hDeleteBook  = async (id) => { await deleteBook(id); setReading(prev => prev.filter(r => r.id !== id)); };
  const hUpdateWord  = async (w) => { await setSetting('word_of_week', w); setWord(w); };
  const hUpdateQ     = async (q) => { await setSetting('monthly_question', q); setMonthlyQ(q); };
  const hUpdateTimeline = async (tl) => { await setSetting('timeline', tl); setTimeline(tl); };
  const hUpdateTitle = async (title) => { await setSetting('site_title', title); setSiteTitle(title); };
  const hAddToArchive = async (w) => { const nw = await addToWordArchive(w); if (nw) setWordArchive(prev => [nw, ...prev]); };
  const hSetActive   = async (id, wd) => { await setActiveWord(id, wd); setWord({ somali: wd.somali, english: wd.english, sentence: wd.sentence }); setWordArchive(prev => prev.map(w => ({ ...w, active: w.id === id }))); };
  const hOpenPost    = useCallback(async (post) => {
    setCurrentPost(post); localStorage.setItem('s2040_post', JSON.stringify({ id: post.id }));
    nav('post'); incrementViews(post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
  }, [nav]);

  if (page === 'admin') {
    if (!adminLoggedIn) return (<><GlobalStyles dark={dark} /><AdminLogin onLogin={adminLogin} T={T} /></>);
    return (
      <>
        <GlobalStyles dark={dark} />
        <AdminShell tab={adminTab} setTab={setAdminTab} onLogout={adminLogout} T={T}>
          {adminTab === 'dash'      && <AdminDash posts={posts} voices={voices} T={T} onTabChange={setAdminTab} />}
          {adminTab === 'posts'     && <AdminPosts posts={posts} onSave={hSavePost} onDelete={hDeletePost} onToggle={hTogglePost} T={T} />}
          {adminTab === 'media'     && <AdminMedia T={T} />}
          {adminTab === 'analytics' && <AdminAnalytics T={T} />}
          {adminTab === 'comments'  && <AdminComments posts={posts} onApprove={hApproveComment} onDelete={hDeleteComment} T={T} />}
          {adminTab === 'community' && <AdminCommunity voices={voices} onToggleFeatured={hToggleVoice} onDelete={hDeleteVoice} monthlyQ={monthlyQ} onUpdateQ={hUpdateQ} T={T} />}
          {adminTab === 'word'      && <AdminWord word={word} wordArchive={wordArchive} onUpdate={hUpdateWord} onAddToArchive={hAddToArchive} onSetActive={hSetActive} T={T} />}
          {adminTab === 'reading'   && <AdminReading reading={reading} onAdd={hAddBook} onDelete={hDeleteBook} T={T} />}
          {adminTab === 'timeline'  && <AdminTimeline timeline={timeline} onUpdate={hUpdateTimeline} T={T} />}
          {adminTab === 'settings'  && <AdminSettings setPage={nav} siteTitle={siteTitle} onUpdateTitle={hUpdateTitle} T={T} />}
        </AdminShell>
      </>
    );
  }

  const activePost = page === 'post' && currentPost ? (posts.find(p => p.id === currentPost.id) || currentPost) : null;

  return (
    <>
      <GlobalStyles dark={dark} />
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans',sans-serif", transition: 'opacity 0.15s ease', opacity: transitioning ? 0 : 1 }}>
        <Nav page={page} setPage={nav} lang={lang} setLang={setLang} dark={dark} setDark={setDark} T={T} siteTitle={siteTitle} />
        {!annDismissed && announcement && <AnnouncementBanner announcement={announcement} onClose={() => setAnnDismissed(true)} />}

        {loading ? (
          <div style={{ paddingTop: '64px', maxWidth: '800px', margin: '0 auto', padding: '120px 24px' }}>
            {[['12px','100px','20px'],['48px','70%','14px'],['48px','50%','28px'],['16px','90%'],['16px','80%'],['16px','85%']].map(([h, w, mb], i) => (
              <div key={i} style={{ width: w || '100%', height: h, borderRadius: '6px', marginBottom: mb || '10px', background: T.dark ? 'linear-gradient(90deg,#0F1E30 25%,#1A2D44 50%,#0F1E30 75%)' : 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E6 50%,#F0F0EE 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : (
          <>
            {page === 'home'    && <HomePage posts={posts} lang={lang} word={word} setPage={nav} setCurrentPost={hOpenPost} voices={voices} dark={dark} T={T} />}
            {page === 'blog'    && <BlogPage posts={posts} lang={lang} setPage={nav} setCurrentPost={hOpenPost} T={T} />}
            {page === 'post'    && activePost && <PostPage post={activePost} lang={lang} setPage={nav} onCommentSubmit={hAddComment} T={T} />}
            {page === 'vision'  && <VisionPage lang={lang} timeline={timeline} T={T} />}
            {page === 'story'   && <StoryPage lang={lang} T={T} />}
            {page === 'reading' && <ReadingPage reading={reading} lang={lang} T={T} />}
            {page === 'connect' && <ConnectPage voices={voices} onVoiceSubmit={hAddVoice} lang={lang} monthlyQ={monthlyQ} T={T} />}
            {page === 'about'   && <MarketingPage setPage={nav} lang={lang} voices={voices} posts={posts} T={T} />}
          </>
        )}

        <Footer setPage={nav} T={T} siteTitle={siteTitle} />
        <div onClick={() => nav('admin')} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#040C16', color: '#4FC3F7', border: '1px solid #1A2D44', padding: '8px 14px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', fontWeight: '600', zIndex: 50, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#4FC3F7'; e.currentTarget.style.color = '#040C16'; }} onMouseLeave={e => { e.currentTarget.style.background = '#040C16'; e.currentTarget.style.color = '#4FC3F7'; }}>Admin</div>
        <BackToTop />
      </div>
    </>
  );
}
