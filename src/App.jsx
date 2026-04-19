import { useState, useEffect, useRef, useCallback } from "react";
import {
  getPosts, savePost, deletePost, togglePostField,
  addComment, approveComment, deleteComment,
  getVoices, addVoice, toggleVoiceFeatured, deleteVoice,
  getReading, addBook, deleteBook,
  getSetting, setSetting, incrementViews,
  getWordArchive, addToWordArchive, setActiveWord,
} from "./supabase.js";

const GlobalStyles = ({ dark }) => (
  <style>{`
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
    .post-content blockquote { border-left: 3px solid #4FC3F7; padding: 12px 20px; margin: 2rem 0; background: rgba(79,195,247,0.05); border-radius: 0 8px 8px 0; font-style: italic; color: ${dark ? '#94A3B8' : '#6B7280'}; }
    .post-content ul, .post-content ol { padding-left: 1.5rem; margin: 1rem 0; }
    .post-content li { margin-bottom: 0.5rem; line-height: 1.7; color: ${dark ? '#CBD5E1' : '#374151'}; }
    .post-content img { max-width: 100%; border-radius: 12px; margin: 2rem 0; }
    .post-content a { color: #4FC3F7; border-bottom: 1px solid rgba(79,195,247,0.3); text-decoration: none; }
    [contenteditable] { outline: none; }
    [contenteditable] blockquote { border-left: 3px solid #4FC3F7; padding-left: 12px; margin: 8px 0; color: #6B7280; font-style: italic; }
    [contenteditable] h1 { font-family: 'Playfair Display'; font-size: 28px; margin: 8px 0; }
    [contenteditable] h2 { font-family: 'Playfair Display'; font-size: 22px; margin: 8px 0; }
    [contenteditable] h3 { font-family: 'Playfair Display'; font-size: 18px; margin: 8px 0; }
    [contenteditable] ul, [contenteditable] ol { padding-left: 20px; margin: 6px 0; }
    [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
    [contenteditable] a { color: #4FC3F7; }
  `}</style>
);

/* ─── ANNOUNCEMENT BANNER ──────────────────────────────────────── */
const AnnouncementBanner = ({ announcement, onClose }) => {
  if (!announcement) return null;
  return (
    <div style={{ background: announcement.color || '#4FC3F7', color: announcement.color === '#F8FAFC' ? '#0F172A' : '#FFFFFF', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '500', position: 'relative', zIndex: 200 }}>
      <span>{announcement.message}</span>
      <button onClick={onClose} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px', opacity: 0.8, lineHeight: 1 }}>×</button>
    </div>
  );
};

const getT = (dark) => ({
  bg:        dark ? '#08111E' : '#FAFAF8',
  soft:      dark ? '#0F1E30' : '#F4F4F0',
  card:      dark ? '#0F1E30' : '#FFFFFF',
  charcoal:  dark ? '#F1F5F9' : '#0F172A',
  body:      dark ? '#CBD5E1' : '#374151',
  mid:       dark ? '#64748B' : '#9CA3AF',
  border:    dark ? '#1A2D44' : '#E8E8E4',
  lightBlue: dark ? '#0C2D48' : '#EFF9FF',
  blue:      '#4FC3F7',
  blueDark:  dark ? '#7DD3F8' : '#0284C7',
  gold:      '#D97706',
  navBg:     dark ? 'rgba(8,17,30,0.95)' : 'rgba(250,250,248,0.95)',
  footBg:    dark ? '#040C16' : '#0A0F1A',
  inputBg:   dark ? '#08111E' : '#FFFFFF',
  dark,
});

const ADMIN_EMAIL    = "mohamedmohammud@gmail.com";
const ADMIN_PASSWORD = "Kulan@2040!";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
};

const useInView = (ref) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
};

const AnimatedDiv = ({ children, style = {}, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(18px)', transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
};

const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n || 0);
const getRT = (c) => { if (!c) return "1 min"; const w = c.replace(/<[^>]*>/g, "").trim().split(' ').filter(s => s.length > 0).length; return `${Math.max(1, Math.ceil(w / 200))} min read`; };
const getReadingTime = (content) => {
  if (!content) return '1 min read';
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(' ').filter(s => s.length > 0).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const isHTML = (str) => str && /<[a-z][\s\S]*>/i.test(str);

const Btn = ({ children, onClick, style = {}, outline, small, gold, T }) => {
  const t = T || getT(false);
  return (
    <button onClick={onClick} style={{ background: gold ? t.gold : outline ? 'transparent' : t.blue, color: outline ? t.charcoal : '#FFF', border: outline ? `1.5px solid ${t.border}` : 'none', padding: small ? '7px 14px' : '10px 22px', borderRadius: '6px', fontSize: small ? '12px' : '13px', fontFamily: "'DM Sans',sans-serif", fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', ...style }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >{children}</button>
  );
};

const Tag = ({ children, T }) => {
  const t = T || getT(false);
  return <span style={{ background: t.lightBlue, color: t.blueDark, fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>{children}</span>;
};

const Divider = ({ T }) => { const t = T || getT(false); return <div style={{ height: '1px', background: t.border, margin: '24px 0' }} />; };

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTop: '3px solid #4FC3F7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const SkeletonBlock = ({ h = '16px', w = '100%', mb = '10px', dark }) => (
  <div style={{ width: w, height: h, borderRadius: '6px', marginBottom: mb, background: dark ? 'linear-gradient(90deg,#1E293B 25%,#334155 50%,#1E293B 75%)' : 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
);

const PostSkeleton = ({ dark }) => (
  <div style={{ maxWidth: '700px', margin: '0 auto', padding: '52px 24px' }}>
    <SkeletonBlock h="12px" w="80px" dark={dark} />
    <SkeletonBlock h="40px" w="80%" mb="14px" dark={dark} />
    <SkeletonBlock h="40px" w="60%" mb="24px" dark={dark} />
    <SkeletonBlock h="12px" w="100px" mb="32px" dark={dark} />
    {[100,90,100,85,95].map((w, i) => <SkeletonBlock key={i} h="16px" w={`${w}%`} dark={dark} />)}
  </div>
);

const BlogSkeleton = ({ dark }) => (
  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '52px 24px' }}>
    {[0,1,2].map(i => (
      <div key={i} style={{ padding: '28px 0', borderBottom: '1px solid #E5E7EB' }}>
        <SkeletonBlock h="12px" w="100px" dark={dark} />
        <SkeletonBlock h="28px" w="75%" mb="10px" dark={dark} />
        <SkeletonBlock h="14px" w="90%" dark={dark} />
        <SkeletonBlock h="14px" w="70%" dark={dark} />
      </div>
    ))}
  </div>
);

const StarLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#4FC3F7"/>
    <polygon points="20,7 23.1,16.6 33.5,16.6 25.2,22.4 28.3,32 20,26.2 11.7,32 14.8,22.4 6.5,16.6 16.9,16.6" fill="white"/>
  </svg>
);

const ReadingProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      const s = el.scrollTop || document.body.scrollTop;
      const sh = el.scrollHeight - el.clientHeight;
      setP(sh > 0 ? (s / sh) * 100 : 0);
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: '3px' }}>
      <div style={{ height: '100%', width: `${p}%`, background: 'linear-gradient(90deg,#4FC3F7,#D97706)', transition: 'width 0.1s linear' }} />
    </div>
  );
};

const BackToTop = ({ T }) => {
  const t = T || getT(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ position: 'fixed', bottom: '72px', right: '20px', background: '#4FC3F7', color: '#FFF', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '16px', zIndex: 49, boxShadow: '0 2px 12px rgba(79,195,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      title="Back to top"
    >↑</button>
  );
};

const ShareButtons = ({ title, T }) => {
  const t = T || getT(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const bs = { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: "'DM Sans'", fontWeight: '500', cursor: 'pointer', border: `1px solid ${t.border}`, background: t.soft, color: t.charcoal, transition: 'all 0.2s' };
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', color: t.mid, letterSpacing: '1px', textTransform: 'uppercase' }}>Share</span>
      <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank')} style={bs}>𝕏 Twitter</button>
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank')} style={bs}>WhatsApp</button>
      <button onClick={copyLink} style={{ ...bs, background: copied ? '#D1FAE5' : t.soft, color: copied ? '#065F46' : t.charcoal }}>{copied ? '✓ Copied' : 'Copy link'}</button>
    </div>
  );
};

const Newsletter = ({ T, compact }) => {
  const t = T || getT(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const submit = async () => {
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      await fetch('https://formspree.io/f/xeepavdd', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ email, _subject: 'Somalia 2040 Newsletter' }) });
      setStatus('success');
    } catch { setStatus('error'); }
  };
  if (compact) return (
    <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Newsletter</div>
      <p style={{ color: t.mid, fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>Somalia 2040 updates directly to your inbox.</p>
      {status === 'success' ? <p style={{ color: '#059669', fontSize: '13px' }}>You are in. Thank you.</p> : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={{ flex: 1, padding: '8px 11px', border: `1px solid ${t.border}`, borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none', minWidth: 0 }} />
          <Btn small onClick={submit} T={t}>{status === 'loading' ? '...' : 'Join'}</Btn>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ background: '#1A1A2E', borderRadius: '14px', padding: '40px', textAlign: 'center', marginTop: '56px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>Stay Connected</div>
      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: '#FFF', marginBottom: '8px' }}>Join the Somalia 2040 newsletter</h3>
      <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '22px', lineHeight: '1.7' }}>Essays, updates, and ideas. No noise. Just signal.</p>
      {status === 'success' ? <p style={{ color: '#34D399', fontSize: '15px' }}>You are in. Thank you.</p> : (
        <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="your@email.com" type="email" style={{ flex: 1, padding: '11px 14px', border: '1px solid #334155', borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '14px', background: '#0F172A', color: '#F1F5F9', outline: 'none', minWidth: '180px' }} />
          <Btn onClick={submit} T={t}>{status === 'loading' ? 'Joining...' : 'Subscribe'}</Btn>
        </div>
      )}
      {status === 'error' && <p style={{ color: '#F87171', fontSize: '13px', marginTop: '8px' }}>Something went wrong. Try again.</p>}
    </div>
  );
};

const SearchBar = ({ value, onChange, T }) => {
  const t = T || getT(false);
  return (
    <div style={{ position: 'relative', marginBottom: '28px' }}>
      <svg style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.charcoal} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search posts..."
        style={{ width: '100%', padding: '10px 36px 10px 38px', border: `1.5px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', transition: 'border 0.2s' }}
        onFocus={e => e.target.style.borderColor = '#4FC3F7'} onBlur={e => e.target.style.borderColor = t.border}
      />
      {value && <button onClick={() => onChange('')} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.mid, fontSize: '18px', lineHeight: 1 }}>x</button>}
    </div>
  );
};

const RichTextEditor = ({ value, onChange, T }) => {
  const t = T || getT(false);
  const ref = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || '';
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || '';
      initialized.current = true;
    }
  }, [value]);

  const exec = (cmd, arg) => {
    ref.current.focus();
    document.execCommand(cmd, false, arg || null);
    onChange(ref.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt('Enter URL (https://...)');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) exec('insertImage', url);
  };

  const bs = { padding: '5px 9px', border: `1px solid ${t.border}`, background: t.soft, color: t.charcoal, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans', transition: 'all 0.15s', flexShrink: 0 };
  const sep = { width: '1px', height: '20px', background: t.border, margin: '0 3px', flexShrink: 0 };

  return (
    <div style={{ border: `1.5px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{ background: t.soft, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onMouseDown={e => { e.preventDefault(); exec('bold'); }} style={{ ...bs, fontWeight: '700' }}>B</button>
        <button onMouseDown={e => { e.preventDefault(); exec('italic'); }} style={{ ...bs, fontStyle: 'italic' }}>I</button>
        <button onMouseDown={e => { e.preventDefault(); exec('underline'); }} style={{ ...bs, textDecoration: 'underline' }}>U</button>
        <button onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }} style={{ ...bs, textDecoration: 'line-through' }}>S</button>
        <div style={sep} />
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h1'); }} style={{ ...bs, fontFamily: 'Playfair Display', fontSize: '14px' }}>H1</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2'); }} style={{ ...bs, fontFamily: 'Playfair Display', fontSize: '12px' }}>H2</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3'); }} style={{ ...bs, fontFamily: 'Playfair Display', fontSize: '11px' }}>H3</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p'); }} style={bs}>P</button>
        <div style={sep} />
        <button onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} style={bs}>• List</button>
        <button onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} style={bs}>1. List</button>
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'blockquote'); }} style={bs}>Quote</button>
        <div style={sep} />
        <button onMouseDown={e => { e.preventDefault(); insertLink(); }} style={bs}>Link</button>
        <button onMouseDown={e => { e.preventDefault(); insertImage(); }} style={bs}>Image</button>
        <div style={sep} />
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }} defaultValue="" style={{ ...bs, padding: '4px 6px' }}>
          <option value="" disabled>Size</option>
          {[['Small','1'],['Normal','3'],['Large','5'],['XLarge','7']].map(([l,v]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }} style={{ ...bs, fontSize: '11px', color: '#EF4444' }}>Clear</button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => onChange(ref.current.innerHTML)}
        style={{ minHeight: '300px', padding: '16px', outline: 'none', color: t.charcoal, background: t.inputBg, fontSize: '15px', lineHeight: '1.85', fontFamily: 'DM Sans' }}
      />
    </div>
  );
};

const Nav = ({ page, setPage, lang, setLang, dark, setDark, T, siteTitle }) => {
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
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', color: t.charcoal, fontWeight: '600', lineHeight: '1.1' }}>{siteTitle || 'Somalia'} <span style={{ color: '#4FC3F7' }}>2040</span></div>
              <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '600' }}>Build. Unite. Lead.</div>
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
              {links.map(l => (
                <span key={l.key} onClick={() => nav(l.key)} style={{ color: page === l.key ? '#4FC3F7' : t.charcoal, fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: page === l.key ? '2px solid #4FC3F7' : '2px solid transparent', paddingBottom: '3px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{l.label}</span>
              ))}
              <button onClick={() => setLang(lang === 'en' ? 'so' : 'en')} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '4px 11px', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans', color: t.charcoal, fontWeight: '600' }}>{lang === 'en' ? 'SO' : 'EN'}</button>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }} title="Toggle dark mode">{dark ? '☀️' : '🌙'}</button>
            </div>
          )}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>{dark ? '☀️' : '🌙'}</button>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ height: '2px', background: t.charcoal, borderRadius: '2px', width: i === 1 && menuOpen ? '14px' : '22px', transition: 'all 0.2s' }} />)}
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>
      {isMobile && menuOpen && (
        <div className="slide-down" style={{ position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, zIndex: 99, background: t.navBg, borderTop: `1px solid ${t.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {links.map(l => (
            <div key={l.key} onClick={() => nav(l.key)} style={{ padding: '14px 0', fontSize: '20px', fontFamily: 'Playfair Display', color: page === l.key ? '#4FC3F7' : t.charcoal, cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>{l.label}</div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => { setLang(lang === 'en' ? 'so' : 'en'); setMenuOpen(false); }} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans', color: t.charcoal, fontWeight: '600' }}>
              {lang === 'en' ? 'Switch to Somali' : 'Switch to English'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const Footer = ({ setPage, T, siteTitle }) => {
  const t = T;
  return (
    <footer style={{ background: t.footBg, color: '#FFF', padding: '48px 20px 24px', marginTop: '64px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <StarLogo size={32} />
              <div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: '#FFF', lineHeight: '1.1' }}>{siteTitle || 'Somalia'} <span style={{ color: '#4FC3F7' }}>2040</span></div>
                <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '600' }}>Build. Unite. Lead.</div>
              </div>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: '13px', maxWidth: '240px', lineHeight: '1.7' }}>A space for honest thinking, Somali voices, and the long game.</p>
          </div>
          <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
            {[['vision','Vision'],['blog','Blog'],['story','My Story'],['reading','Reading List'],['connect',"Let's Connect"]].map(([key, label]) => (
              <div key={key} onClick={() => setPage(key)} style={{ color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = '#FFF'} onMouseLeave={e => e.target.style.color = '#9CA3AF'}>{label}</div>
            ))}
          </div>
        </div>
        <div style={{ height: '1px', background: '#1F2937', margin: '0 0 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ color: '#6B7280', fontSize: '12px' }}>2026 politics.mmohamud.me</p>
          <a href="https://mmohamud.me" style={{ color: '#6B7280', fontSize: '12px', textDecoration: 'none' }}>mmohamud.me</a>
        </div>
      </div>
    </footer>
  );
};

const HomePage = ({ posts, lang, word, setPage, setCurrentPost, voices, dark, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const featured = posts.find(p => p.featured && p.published);
  const recent = posts.filter(p => p.published && !p.featured).slice(0, 2);
  const featuredVoice = voices.find(v => v.featured);

  return (
    <div className="fade-in">
      <div style={{ background: dark ? 'linear-gradient(135deg,#0F172A 0%,#0C2D48 100%)' : `linear-gradient(135deg,#F8FAFB 0%,#E0F7FF 100%)`, padding: isMobile ? '36px 16px 28px' : '44px 24px 36px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <Tag T={t}>{lang === 'en' ? 'Build. Unite. Lead.' : 'Dhis. Mideyso. Hoggaami.'}</Tag>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '28px' : 'clamp(28px,3.5vw,44px)', color: t.charcoal, fontWeight: '700', lineHeight: '1.2', margin: '14px 0 12px' }}>
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

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '28px 16px' : '44px 24px' }}>
        {featured && (
          <AnimatedDiv style={{ marginBottom: isMobile ? '36px' : '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ height: '2px', width: '28px', background: '#4FC3F7' }} />
              <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Featured</span>
            </div>
            <div onClick={() => { setCurrentPost(featured); setPage('post'); }} style={{ cursor: 'pointer', background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,195,247,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {featured.thumbnail_url ? (
                <img src={featured.thumbnail_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '200px' }} />
              ) : (
                <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#2D3748)', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? '120px' : '220px' }}>
                  <span style={{ fontFamily: 'Playfair Display', fontSize: '72px', color: '#4FC3F7', opacity: 0.25 }}>"</span>
                </div>
              )}
              <div style={{ padding: isMobile ? '22px' : '36px' }}>
                <Tag T={t}>Featured Essay</Tag>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '20px' : '22px', color: t.charcoal, margin: '12px 0 10px', lineHeight: '1.3' }}>
                  {lang === 'en' ? featured.title : (featured.title_so || featured.title)}
                </h2>
                <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.7', marginBottom: '16px' }}>
                  {lang === 'en' ? featured.excerpt : (featured.excerpt_so || featured.excerpt)}
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '500' }}>{featured.date} →</span>
                  <span style={{ color: t.mid, fontSize: '11px' }}>{getReadingTime(featured.content)}</span>
                  {featured.views > 0 && <span style={{ color: t.mid, fontSize: '11px' }}>{featured.views} reads</span>}
                </div>
              </div>
            </div>
          </AnimatedDiv>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: isMobile ? '28px' : '44px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ height: '2px', width: '28px', background: t.gold }} />
              <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Recent Writing</span>
            </div>
            {recent.length === 0 && <p style={{ color: t.mid, fontSize: '14px' }}>No posts yet. Coming soon.</p>}
            {recent.map((post, idx) => (
              <AnimatedDiv key={post.id} delay={idx * 0.1}>
                <div onClick={() => { setCurrentPost(post); setPage('post'); }} style={{ cursor: 'pointer', padding: '20px 0', borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.querySelector('h3').style.color = '#4FC3F7'}
                  onMouseLeave={e => e.currentTarget.querySelector('h3').style.color = t.charcoal}
                >
                  {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ color: t.mid, fontSize: '11px' }}>{post.date}</span>
                    <span style={{ color: t.mid, fontSize: '11px' }}>{getReadingTime(post.content)}</span>
                    {post.views > 0 && <span style={{ color: t.mid, fontSize: '11px' }}>{post.views} reads</span>}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '18px' : '20px', color: t.charcoal, margin: '0 0 8px', transition: 'color 0.2s', lineHeight: '1.3' }}>
                    {lang === 'en' ? post.title : (post.title_so || post.title)}
                  </h3>
                  <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.6' }}>
                    {lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}
                  </p>
                </div>
              </AnimatedDiv>
            ))}
            <div style={{ marginTop: '18px' }}><Btn outline small onClick={() => setPage('blog')} T={t}>All posts →</Btn></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {word && (
              <AnimatedDiv delay={0.1}>
                <div style={{ background: dark ? '#0C1929' : '#1A1A2E', borderRadius: '14px', padding: '22px' }}>
                  <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>Somali Word of the Week</div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: '#FFF', marginBottom: '4px' }}>{word.somali}</div>
                  <div style={{ color: t.gold, fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>{word.english}</div>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic' }}>{word.sentence}</p>
                </div>
              </AnimatedDiv>
            )}
            {featuredVoice && (
              <AnimatedDiv delay={0.15}>
                <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px' }}>
                  <div style={{ color: t.mid, fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>Community Voice</div>
                  <p style={{ color: t.charcoal, fontSize: '14px', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '10px' }}>"{featuredVoice.text}"</p>
                  <div style={{ color: t.mid, fontSize: '12px', marginBottom: '12px' }}>{featuredVoice.author} · {featuredVoice.location}</div>
                  <Btn small outline onClick={() => setPage('connect')} T={t}>Share Your Voice →</Btn>
                </div>
              </AnimatedDiv>
            )}
            <AnimatedDiv delay={0.2}><Newsletter T={t} compact /></AnimatedDiv>
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
  const filtered = search ? published.filter(p => (p.title + ' ' + (p.excerpt || '')).toLowerCase().includes(search.toLowerCase())) : published;

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '28px 16px' : '48px 24px' }}>
      <Tag T={t}>Writing</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '30px' : '38px', color: t.charcoal, margin: '12px 0 10px' }}>Blog</h1>
      <p style={{ color: t.mid, fontSize: '14px', lineHeight: '1.7', marginBottom: '28px' }}>
        {lang === 'en' ? 'Essays, reflections, and perspectives on Somalia, governance, and the diaspora.' : 'Maqaallo, fikrardo, iyo aragtiyaha ku saabsan Soomaaliya.'}
      </p>
      <SearchBar value={search} onChange={setSearch} T={t} />
      {filtered.length === 0 && <p style={{ color: t.mid }}>{search ? `No results for "${search}"` : 'No posts yet.'}</p>}
      {filtered.map((post, idx) => (
        <AnimatedDiv key={post.id} delay={idx * 0.05}>
          <div onClick={() => { setCurrentPost(post); setPage('post'); }} style={{ cursor: 'pointer', padding: isMobile ? '22px 0' : '26px 0', borderBottom: `1px solid ${t.border}` }}
            onMouseEnter={e => e.currentTarget.querySelector('h2').style.color = '#4FC3F7'}
            onMouseLeave={e => e.currentTarget.querySelector('h2').style.color = t.charcoal}
          >
            {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: isMobile ? '160px' : '200px', objectFit: 'cover', borderRadius: '10px', marginBottom: '14px' }} />}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: t.mid, fontSize: '12px' }}>{post.date}</span>
              <span style={{ color: t.mid, fontSize: '12px' }}>{getReadingTime(post.content)}</span>
              {post.views > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{post.views} reads</span>}
              {post.featured && <Tag T={t}>Featured</Tag>}
            </div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '21px' : '25px', color: t.charcoal, marginBottom: '10px', lineHeight: '1.3', transition: 'color 0.2s' }}>
              {lang === 'en' ? post.title : (post.title_so || post.title)}
            </h2>
            <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.7', marginBottom: '10px' }}>
              {lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}
            </p>
            <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '500' }}>Read more →</span>
          </div>
        </AnimatedDiv>
      ))}
      <Newsletter T={t} />
    </div>
  );
};

const PostPage = ({ post, lang, setPage, onCommentSubmit, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [comment, setComment] = useState({ author: '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const comments = (post.somalia_comments || []).filter(c => c.approved);
  const content = lang === 'en' ? post.content : (post.content_so || post.content);
  const iStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', marginBottom: '10px' };

  const handleSubmit = async () => {
    if (!comment.author || !comment.text) return;
    await onCommentSubmit({ post_id: post.id, ...comment, approved: false, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) });
    setSubmitted(true);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 24px' }}>
      <ReadingProgress />
      <span onClick={() => setPage('blog')} style={{ color: '#4FC3F7', cursor: 'pointer', fontSize: '13px', display: 'inline-block', marginBottom: '24px' }}>← Back to Blog</span>
      <Tag T={t}>Essay</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '26px' : 'clamp(26px,4vw,38px)', color: t.charcoal, margin: '12px 0 10px', lineHeight: '1.2' }}>
        {lang === 'en' ? post.title : (post.title_so || post.title)}
      </h1>
      {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '320px', objectFit: 'cover' }} />}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{ color: t.mid, fontSize: '12px' }}>{post.date}</span>
        <span style={{ color: t.mid, fontSize: '12px' }}>{getReadingTime(content)}</span>
        {post.views > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{post.views} reads</span>}
      </div>
      <ShareButtons title={lang === 'en' ? post.title : (post.title_so || post.title)} T={t} />
      <Divider T={t} />
      {content && (
        isHTML(content) ? (
          <div className="post-content" dangerouslySetInnerHTML={{ __html: content }} style={{ color: t.charcoal, fontSize: isMobile ? '16px' : '17px', lineHeight: '1.95' }} />
        ) : (
          content.split('\n\n').map((para, i) => <p key={i} style={{ color: t.charcoal, fontSize: isMobile ? '16px' : '17px', lineHeight: '1.95', marginBottom: '20px' }}>{para}</p>)
        )
      )}
      <Divider T={t} />
      <ShareButtons title={lang === 'en' ? post.title : (post.title_so || post.title)} T={t} />

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal, marginBottom: '22px' }}>Responses ({comments.length})</h3>
        {comments.map(c => (
          <AnimatedDiv key={c.id} style={{ background: t.soft, borderRadius: '10px', padding: '16px 18px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '14px' }}>{c.author}</span>
              <span style={{ color: t.mid, fontSize: '12px' }}>{c.date}</span>
            </div>
            <p style={{ color: t.charcoal, fontSize: '14px', lineHeight: '1.6' }}>{c.text}</p>
          </AnimatedDiv>
        ))}
        <div style={{ background: t.soft, borderRadius: '14px', padding: isMobile ? '20px' : '26px', marginTop: '22px' }}>
          <h4 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '14px' }}>Leave a response</h4>
          {submitted ? <p style={{ color: '#059669', fontSize: '14px' }}>Your response has been submitted for review. Thank you.</p> : (
            <>
              <input value={comment.author} onChange={e => setComment({ ...comment, author: e.target.value })} placeholder="Your name" style={iStyle} />
              <textarea value={comment.text} onChange={e => setComment({ ...comment, text: e.target.value })} placeholder="Share your thoughts..." rows={4} style={{ ...iStyle, resize: 'vertical', marginBottom: '12px' }} />
              <Btn onClick={handleSubmit} T={t}>Submit Response</Btn>
            </>
          )}
        </div>
      </div>
      <Newsletter T={t} />
    </div>
  );
};

const VisionPage = ({ lang, timeline, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div className="fade-in">
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#2D3748)', padding: isMobile ? '44px 16px 36px' : '68px 24px 52px', color: '#FFF', textAlign: 'center' }}>
        <Tag T={t}>The Vision</Tag>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '26px' : 'clamp(26px,4vw,42px)', margin: '14px 0 12px', lineHeight: '1.2' }}>
          {lang === 'en' ? 'What I believe Somalia can become.' : 'Waxa aan aaminahay in Soomaaliya noqon karto.'}
        </h1>
        <p style={{ color: '#9CA3AF', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: '1.8' }}>
          {lang === 'en' ? 'This is a living document. It will grow as my thinking matures. Nothing here is final.' : 'Waa dukumiinti nool. Wuu kordhayaa marka fikradaydu ay bislaato.'}
        </p>
      </div>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? '28px 16px' : '48px 24px' }}>
        {[
          { title: lang === 'en' ? 'On Technology & Governance' : 'Teknolojiyada & Xukuumadda', body: lang === 'en' ? "Somalia's path forward runs through digital infrastructure. A government that invests in cybersecurity, digital identity, and transparent e-governance will be a government its people can actually trust. I believe this is not optional. It is the foundation." : "Jidka Soomaaliya wuxuu maraa kaabayaasha dijital. Xukuumad ku maalgalisa ammaanka dijital waxay noqon doontaa mid dadkeeda aaminsan." },
          { title: lang === 'en' ? 'On the Diaspora' : 'Diaspora-da', body: lang === 'en' ? "The millions of Somalis living abroad are not a footnote. They are an untapped engine. My vision includes building real, structural channels through which diaspora talent, capital, and experience flow back into Somalia." : "Malaayin Soomaali ah oo dibadda ku nool kuma aha qoraal kooban. Waa matoor aan la isticmaalin." },
          { title: lang === 'en' ? 'On Unity' : 'Midnimada', body: lang === 'en' ? "I don't believe unity comes from forcing people to agree. It comes from building institutions people trust, systems that are fair, and leadership that listens." : "Midnimadu kuma timaado in dadka lagu kalliftey inay is waafaqaan. Waxay ka timaaddaa dhisidda hay'adaha dadku aaminsan yihiin." },
        ].map((item, i) => (
          <AnimatedDiv key={i} delay={i * 0.1} style={{ marginBottom: '36px', display: 'flex', gap: '16px' }}>
            <div style={{ width: '3px', background: '#4FC3F7', borderRadius: '2px', flexShrink: 0, marginTop: '6px' }} />
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '24px', color: t.charcoal, marginBottom: '10px' }}>{item.title}</h2>
              <p style={{ color: t.mid, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.9' }}>{item.body}</p>
            </div>
          </AnimatedDiv>
        ))}
        <Divider T={t} />
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '28px' }}>The Roadmap to 2040</h2>
        {timeline && timeline.map((phase, i) => (
          <AnimatedDiv key={i} delay={i * 0.08} style={{ display: 'flex', gap: isMobile ? '14px' : '22px', marginBottom: '24px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: isMobile ? '76px' : '96px' }}>
              <div style={{ color: '#4FC3F7', fontSize: '11px', fontWeight: '600' }}>{phase.year}</div>
              <div style={{ color: t.mid, fontSize: '10px' }}>{phase.phase}</div>
            </div>
            <div style={{ width: '1px', background: t.border, flexShrink: 0, marginTop: '4px', alignSelf: 'stretch' }} />
            <div>
              {phase.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.gold, flexShrink: 0, marginTop: '6px' }} />
                  <span style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.5' }}>{item}</span>
                </div>
              ))}
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
      {/* Dark hero */}
      <div style={{ background: 'linear-gradient(160deg, #040C16 0%, #0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(79,195,247,0.05), transparent)', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>About</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : '56px', color: '#F8FAFC', letterSpacing: '-1px', lineHeight: '1.1', marginBottom: '20px' }}>
            {lang === 'en' ? 'My Story' : 'Taariikhda'}
          </h1>
          <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '560px' }}>
            {lang === 'en'
              ? 'A Somali-American from Columbus, Ohio. Cybersecurity professional. Community builder. And someone who believes deeply in Somalia's potential.'
              : 'Soomaali-Maraykan ah oo ka ah Columbus, Ohio. Xirfadlaha ammaanka dijital. Dhisaha bulshada.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '44px 20px' : '68px 24px' }}>

        {/* Photo placeholder + intro */}
        <AnimatedDiv style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: isMobile ? '28px' : '48px', alignItems: 'start', marginBottom: '64px', paddingBottom: '64px', borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ width: '100%', paddingBottom: '100%', borderRadius: '16px', background: `linear-gradient(135deg, ${t.soft}, ${t.lightBlue})`, position: 'relative', overflow: 'hidden', border: `1px solid ${t.border}` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '48px' }}>🇸🇴</div>
                <span style={{ color: t.mid, fontSize: '12px', letterSpacing: '1px' }}>Photo coming soon</span>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Based in', value: 'Columbus, Ohio' },
                { label: 'Background', value: 'Cybersecurity & IT' },
                { label: 'Education', value: 'MS Cybersecurity, WGU' },
                { label: 'Goal', value: 'Somalia 2040' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ color: t.mid, fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', minWidth: '80px', textTransform: 'uppercase' }}>{item.label}</span>
                  <span style={{ color: t.charcoal, fontSize: '13px' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color: t.body || t.mid, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.95', marginBottom: '20px' }}>
              {lang === 'en'
                ? "I was born into the Somali diaspora, raised in Columbus, Ohio, shaped by two worlds. American by upbringing, Somali by roots, and restless by nature."
                : "Waxaan ku dhashay diaspora Soomaaliyeed, ku koray Columbus, Ohio, oo laga qaabeeyey laba adduun."}
            </p>
            <p style={{ color: t.body || t.mid, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.95', marginBottom: '20px' }}>
              {lang === 'en'
                ? "My career has been in cybersecurity and technology. I have spent years studying how systems fail and how they can be protected. I hold an AS in Computer Science from Columbus State, a BS in Business from Franklin University, and I am currently completing an MS in Cybersecurity at Western Governors University."
                : "Shaqadeyda waxay ahayd ammaanka dijital iyo teknoolajiyada."}
            </p>
            <p style={{ color: t.body || t.mid, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.95' }}>
              {lang === 'en'
                ? "Alongside that I have been building Kulan Group, a holding company with platforms serving education, cybersecurity, and community for the Somali diaspora. Every project I build is practice for something bigger."
                : "Xagga kale waxaan dhisayaa Kulan Group."}
            </p>
          </div>
        </AnimatedDiv>

        {/* Key chapters */}
        {[
          {
            year: '2040',
            heading: lang === 'en' ? 'Why Somalia?' : 'Sababta Soomaaliya?',
            body: lang === 'en'
              ? "It started as a feeling. Not a plan, not a calculation. A quiet but persistent sense that Somalia's future matters, and that people who understand technology, governance, and community have something real to offer. I am still figuring this out. Somalia 2040 is my way of thinking in public."
              : "Waxay bilaabatay dareen. Maaha qorshe, maahan xisaab.",
            color: '#4FC3F7',
          },
          {
            year: 'Now',
            heading: lang === 'en' ? 'What I am building toward' : 'Waxa aan doonayo',
            body: lang === 'en'
              ? "A Somali political leader who understands technology, the diaspora, and the next generation. Somalia needs people who have worked in the real world, built real things, and failed and learned. I am building that track record one project at a time."
              : "Hogaamiye siyaasadeed oo fahma teknoolajiyada, diaspora-da, iyo jiilka soo socda.",
            color: '#D97706',
          },
          {
            year: 'Core',
            heading: lang === 'en' ? 'What drives me' : 'Waxa i dhaqaajiyo',
            body: lang === 'en'
              ? "The diaspora gave me education, perspective, and opportunity. Somalia gave me identity, purpose, and the weight of belonging. I feel a responsibility to bridge those two things. Not out of guilt. Out of genuine belief that it is possible."
              : "Diaspora-da ayaa ii siisay waxbarasho, aragtida, iyo fursadda. Soomaaliya ayaa ii siisay aqoonsiga.",
            color: '#10B981',
          },
        ].map((item, i) => (
          <AnimatedDiv key={i} delay={i * 0.1} style={{ display: 'flex', gap: isMobile ? '16px' : '28px', marginBottom: '48px', paddingBottom: '48px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ flexShrink: 0, width: isMobile ? '52px' : '64px', textAlign: 'right' }}>
              <div style={{ color: item.color, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>{item.year}</div>
            </div>
            <div style={{ width: '2px', background: `linear-gradient(to bottom, ${item.color}, transparent)`, borderRadius: '2px', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '14px', letterSpacing: '-0.3px' }}>{item.heading}</h2>
              <p style={{ color: t.body || t.mid, fontSize: isMobile ? '15px' : '16px', lineHeight: '1.9' }}>{item.body}</p>
            </div>
          </AnimatedDiv>
        ))}

        {/* Milestones */}
        <AnimatedDiv>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ height: '2px', width: '28px', background: '#D97706' }} />
            <span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>The Journey</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '48px' }}>
            {[
              { num: '2', label: 'Degrees completed' },
              { num: 'MS', label: 'Currently studying' },
              { num: '14+', label: 'Projects built' },
              { num: '2040', label: 'The goal year' },
            ].map(item => (
              <div key={item.label} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: '#4FC3F7', fontWeight: '700', marginBottom: '6px' }}>{item.num}</div>
                <div style={{ color: t.mid, fontSize: '12px', lineHeight: '1.4' }}>{item.label}</div>
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
    <div className="fade-in" style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? '28px 16px' : '48px 24px' }}>
      <Tag T={t}>Library</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '30px' : '38px', color: t.charcoal, margin: '12px 0 10px' }}>{lang === 'en' ? 'Reading List' : 'Buugaagta'}</h1>
      <p style={{ color: t.mid, fontSize: '14px', marginBottom: '36px', lineHeight: '1.7' }}>{lang === 'en' ? 'Books and resources shaping my thinking on Somalia, governance, and leadership.' : 'Buugaag iyo xogaha qaabeeya fikradayda.'}</p>
      {[...new Set(reading.map(r => r.category))].map(cat => (
        <div key={cat} style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '2px', width: '20px', background: t.gold }} />
            <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>{cat}</span>
          </div>
          {reading.filter(r => r.category === cat).map((book, i) => (
            <AnimatedDiv key={book.id} delay={i * 0.05} style={{ background: t.soft, borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', borderLeft: '3px solid #4FC3F7' }}>
              <div style={{ fontWeight: '600', color: t.charcoal, fontSize: '15px', marginBottom: '3px' }}>{book.title}</div>
              <div style={{ color: '#4FC3F7', fontSize: '12px', marginBottom: '6px' }}>{book.author}</div>
              <p style={{ color: t.mid, fontSize: '13px', lineHeight: '1.6' }}>{book.note}</p>
            </AnimatedDiv>
          ))}
        </div>
      ))}
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
  const iStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none' };
  const submit = async () => { if (!form.author || !form.text) return; await onVoiceSubmit({ ...form, featured: false, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }); setSubmitted(true); };

  return (
    <div className="fade-in">
      <div style={{ background: `linear-gradient(135deg,${t.lightBlue},${t.soft})`, padding: isMobile ? '36px 16px 28px' : '52px 24px 40px', textAlign: 'center', borderBottom: `1px solid ${t.border}` }}>
        <Tag T={t}>Community</Tag>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '36px', color: t.charcoal, margin: '12px 0 10px' }}>{lang === 'en' ? "Let's Connect" : 'Aan Xiriirno'}</h1>
        <p style={{ color: t.mid, maxWidth: '440px', margin: '0 auto', fontSize: '14px', lineHeight: '1.8' }}>
          {lang === 'en' ? 'This space belongs to every Somali who has something to say.' : 'Meesha waxay u tahay Soomaali kasta oo wax yidhaahda.'}
        </p>
      </div>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: isMobile ? '28px 16px' : '48px 24px' }}>
        {monthlyQ && (
          <AnimatedDiv style={{ background: '#1A1A2E', borderRadius: '14px', padding: isMobile ? '24px 18px' : '32px', marginBottom: '36px', textAlign: 'center' }}>
            <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>Monthly Question</div>
            <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '18px' : '20px', color: '#FFF', lineHeight: '1.6', maxWidth: '540px', margin: '0 auto' }}>"{monthlyQ}"</p>
          </AnimatedDiv>
        )}
        {featured.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ height: '2px', width: '20px', background: t.gold }} />
              <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>Featured Voices</span>
            </div>
            {featured.map(v => (
              <AnimatedDiv key={v.id} style={{ background: t.soft, borderRadius: '10px', padding: '18px 20px', marginBottom: '10px', borderLeft: `3px solid ${t.gold}` }}>
                <p style={{ color: t.charcoal, fontSize: '14px', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '8px' }}>"{v.text}"</p>
                <span style={{ color: t.mid, fontSize: '12px' }}>{v.author}{v.location ? ` · ${v.location}` : ''}</span>
              </AnimatedDiv>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '36px' }}>
          {others.map((v, i) => (
            <AnimatedDiv key={v.id} delay={i * 0.05} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px' }}>
              <p style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.7', marginBottom: '8px' }}>"{v.text}"</p>
              <span style={{ color: t.mid, fontSize: '12px' }}>{v.author}{v.location ? ` · ${v.location}` : ''}</span>
            </AnimatedDiv>
          ))}
        </div>
        <div style={{ background: t.soft, borderRadius: '14px', padding: isMobile ? '22px' : '32px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '24px', color: t.charcoal, marginBottom: '6px' }}>Share Your Voice</h2>
          <p style={{ color: t.mid, fontSize: '13px', marginBottom: '22px' }}>Your submission will be reviewed before it goes live.</p>
          {submitted ? (
            <div style={{ background: t.lightBlue, borderRadius: '8px', padding: '14px', color: t.blueDark, fontSize: '14px' }}>Thank you for sharing. Your voice has been submitted for review.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Your name *" style={iStyle} />
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Your city / country" style={iStyle} />
              </div>
              <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Your thoughts on Somali politics..." rows={4} style={{ ...iStyle, resize: 'vertical', marginBottom: '12px' }} />
              <Btn onClick={submit} T={t}>Submit Your Voice</Btn>
            </>
          )}
        </div>
        <Newsletter T={t} />
      </div>
    </div>
  );
};

/* ─── MARKETING / ABOUT PAGE ──────────────────────────────────────── */
const MarketingPage = ({ setPage, lang, voices, posts, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const totalReads = posts.reduce((s, p) => s + (p.views || 0), 0);
  const publishedCount = posts.filter(p => p.published).length;

  return (
    <div style={{ paddingTop: '64px' }}>
      {/* HERO */}
      <div style={{ background: 'linear-gradient(160deg, #040C16 0%, #08111E 40%, #040C16 100%)', minHeight: isMobile ? '70vh' : '80vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: isMobile ? '60px 20px' : '80px 24px' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(79,195,247,0.07), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="fade-in" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)', borderRadius: '20px', padding: '6px 14px', marginBottom: '28px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4FC3F7', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>Somalia 2040 · Build. Unite. Lead.</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : 'clamp(44px,5vw,68px)', color: '#F8FAFC', fontWeight: '700', lineHeight: '1.08', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              {lang === 'en'
                ? <>The platform for<br /><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Somalia's</span> future<br />leaders.</>
                : <>Madasha<br /><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Soomaaliya's</span><br />hogaaminteeda mustaqbalka.</>}
            </h1>
            <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '520px', marginBottom: '40px' }}>
              {lang === 'en'
                ? 'Essays, community voices, and an honest roadmap from a Somali-American who believes the diaspora has a role to play in shaping what comes next.'
                : 'Maqaallo, codadka bulshada, iyo qorshaha daacadda ah ee Soomaali-Maraykan ah.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('blog')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.2px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7DD3F8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#4FC3F7'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >{lang === 'en' ? 'Read the essays' : 'Akhri maqaalada'}</button>
              <button onClick={() => setPage('vision')} style={{ background: 'transparent', color: '#94A3B8', border: '1.5px solid #1A2D44', padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: '6px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.color = '#4FC3F7'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2D44'; e.currentTarget.style.color = '#94A3B8'; }}
              >{lang === 'en' ? 'The Vision' : 'Aragtida'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background: t.soft, borderBottom: `1px solid ${t.border}`, padding: isMobile ? '24px 20px' : '28px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { num: publishedCount, label: lang === 'en' ? 'Essays published' : 'Maqaallo la daabacay' },
            { num: fmt(totalReads), label: lang === 'en' ? 'Total reads' : 'Akhrinta guud' },
            { num: voices.length, label: lang === 'en' ? 'Community voices' : 'Codadka bulshada' },
            { num: '2040', label: lang === 'en' ? 'The target year' : 'Sannadka bartilmaameedka' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: '32px', color: '#4FC3F7', fontWeight: '700', lineHeight: '1' }}>{item.num}</div>
              <div style={{ color: t.mid, fontSize: '13px', marginTop: '6px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* THREE PILLARS */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '52px 20px' : '80px 24px' }}>
        <AnimatedDiv style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>The Vision</span>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '40px', color: t.charcoal, letterSpacing: '-0.5px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.2' }}>
            {lang === 'en' ? 'Three things Somalia needs most.' : 'Saddexda wax oo Soomaaliya ugu baahan tahay.'}
          </h2>
        </AnimatedDiv>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '80px' }}>
          {[
            { icon: '💻', title: lang === 'en' ? 'Technology & Governance' : 'Teknoolajiyada & Xukuumadda', body: lang === 'en' ? 'Somalia needs leaders who understand digital infrastructure, cybersecurity, and e-governance. Technology is not optional. It is the foundation of modern statehood.' : 'Soomaaliya waxay u baahan tahay hogaamineyaasha fahmaya kaabayaasha dijital.', color: '#4FC3F7' },
            { icon: '🌍', title: lang === 'en' ? 'Diaspora Power' : 'Xoogga Diaspora', body: lang === 'en' ? 'Millions of educated, globally connected Somalis live abroad. Building structural channels for their expertise, capital, and experience to flow home is one of the most important untapped opportunities.' : 'Malaayin Soomaali ah oo waxbarashada leh ayaa dibadda ku nool.', color: '#D97706' },
            { icon: '🤝', title: lang === 'en' ? 'Unity Through Trust' : 'Midnimada Xoogga Aaminaadda', body: lang === 'en' ? 'Unity is not forced agreement. It comes from fair systems, accountable institutions, and leadership that genuinely listens. That is the Somalia I want to help build.' : 'Midnimadu kuma timaado heshiis lagu khasbiyo.', color: '#10B981' },
          ].map((pillar, i) => (
            <AnimatedDiv key={i} delay={i * 0.1}>
              <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '32px 28px', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 48px ${pillar.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{pillar.icon}</div>
                <div style={{ width: '32px', height: '3px', background: pillar.color, borderRadius: '2px', marginBottom: '16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal, marginBottom: '14px', letterSpacing: '-0.2px', lineHeight: '1.3' }}>{pillar.title}</h3>
                <p style={{ color: t.body || t.mid, fontSize: '15px', lineHeight: '1.8' }}>{pillar.body}</p>
              </div>
            </AnimatedDiv>
          ))}
        </div>

        {/* ROADMAP VISUAL */}
        <AnimatedDiv style={{ marginBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
            <div style={{ height: '2px', width: '28px', background: '#D97706' }} />
            <span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>The Roadmap</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '0' }}>
            {[
              { year: '2026-28', phase: 'Foundation', icon: '🎓', color: '#4FC3F7', active: true },
              { year: '2029-31', phase: 'Building', icon: '🔨', color: '#7DD3F8', active: false },
              { year: '2032-35', phase: 'Positioning', icon: '📡', color: '#D97706', active: false },
              { year: '2036-38', phase: 'Entry', icon: '🗣', color: '#F59E0B', active: false },
              { year: '2039-40', phase: 'Campaign', icon: '🇸🇴', color: '#10B981', active: false },
            ].map((step, i) => (
              <div key={i} style={{ position: 'relative', textAlign: 'center', padding: isMobile ? '16px 8px' : '20px 12px' }}>
                {i < 4 && !isMobile && <div style={{ position: 'absolute', top: '28px', left: '50%', width: '100%', height: '2px', background: `linear-gradient(to right, ${step.color}, ${['#7DD3F8','#D97706','#F59E0B','#10B981'][i]})`, zIndex: 0 }} />}
                <div style={{ position: 'relative', zIndex: 1, width: '48px', height: '48px', borderRadius: '50%', background: step.active ? step.color : t.soft, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px', boxShadow: step.active ? `0 0 20px ${step.color}40` : 'none' }}>
                  {step.icon}
                </div>
                <div style={{ color: step.color, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>{step.year}</div>
                <div style={{ color: t.charcoal, fontSize: '12px', fontWeight: '500' }}>{step.phase}</div>
                {step.active && <div style={{ color: '#4FC3F7', fontSize: '10px', marginTop: '4px', fontWeight: '600' }}>← Now</div>}
              </div>
            ))}
          </div>
        </AnimatedDiv>

        {/* PERSONAL QUOTE */}
        <AnimatedDiv style={{ marginBottom: '80px' }}>
          <div style={{ background: t.dark ? '#040C16' : '#0A0F1A', borderRadius: '20px', padding: isMobile ? '36px 28px' : '56px 60px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(79,195,247,0.06), transparent)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '60px' : '80px', color: '#4FC3F7', opacity: 0.15, lineHeight: '0.5', marginBottom: '20px' }}>"</div>
            <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '26px', color: '#F8FAFC', lineHeight: '1.6', marginBottom: '24px', maxWidth: '640px', fontStyle: 'italic', letterSpacing: '-0.2px' }}>
              {lang === 'en'
                ? "It started as a feeling. Not a plan, not a calculation. A quiet but persistent sense that Somalia's future matters, and that people like me have something real to offer."
                : "Waxay bilaabatay dareen. Maaha qorshe, maahan xisaab. Dareen degdeg ah oo adag oo ah in mustaqbalka Soomaaliya muhiim yahay."}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(79,195,247,0.15)', border: '1px solid rgba(79,195,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🇸🇴</div>
              <div>
                <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: '600' }}>Mohamud Mohamed</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>Founder, Somalia 2040</div>
              </div>
            </div>
          </div>
        </AnimatedDiv>

        {/* CTA */}
        <AnimatedDiv>
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 40px', background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '36px', color: t.charcoal, marginBottom: '14px', letterSpacing: '-0.3px' }}>
              {lang === 'en' ? 'Join the conversation.' : 'Ku biir xiriirka.'}
            </h2>
            <p style={{ color: t.mid, fontSize: '16px', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto 32px' }}>
              {lang === 'en'
                ? 'This is a space for every Somali who thinks deeply about the future. Share your voice, read the essays, and follow the journey to 2040.'
                : 'Meeshan waxay u tahay Soomaali kasta oo si qoto dheer u fikira mustaqbalka.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('connect')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: '13px 30px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7DD3F8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#4FC3F7'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >{lang === 'en' ? "Let's Connect" : 'Aan Xiriirno'}</button>
              <button onClick={() => setPage('blog')} style={{ background: 'transparent', color: t.charcoal, border: `1.5px solid ${t.border}`, padding: '13px 30px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.color = '#4FC3F7'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.charcoal; }}
              >{lang === 'en' ? 'Read the Blog' : 'Blog-ka'}</button>
            </div>
          </div>
        </AnimatedDiv>
      </div>
    </div>
  );
};

/* ─── ADMIN ANALYTICS ─────────────────────────────────────────────── */
const AdminAnalytics = ({ T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const s = await getAnalyticsSummary(days);
      setSummary(s);
      setLoading(false);
    };
    load();
  }, [days]);

  const maxDaily = summary?.dailyViews?.length > 0
    ? Math.max(...summary.dailyViews.map(([, v]) => v), 1)
    : 1;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, letterSpacing: '-0.3px' }}>Analytics</h1>
          <p style={{ color: t.mid, fontSize: '13px', marginTop: '4px' }}>Site performance and visitor insights</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${days === d ? '#4FC3F7' : t.border}`, background: days === d ? 'rgba(79,195,247,0.1)' : t.card, color: days === d ? '#4FC3F7' : t.mid, transition: 'all 0.2s' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #E5E7EB', borderTop: '2px solid #4FC3F7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : !summary ? (
        <div style={{ textAlign: 'center', padding: '60px', background: t.card, borderRadius: '12px', border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
          <p style={{ color: t.mid, fontSize: '14px' }}>No analytics data yet. Data will appear as visitors browse the site.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Page Views', value: summary.totalViews, color: '#4FC3F7', icon: '👁' },
              { label: 'Unique Sessions', value: summary.uniqueSessions, color: '#D97706', icon: '👤' },
              { label: 'Mobile Visitors', value: summary.devices?.mobile || 0, color: '#10B981', icon: '📱' },
              { label: 'Desktop Visitors', value: summary.devices?.desktop || 0, color: '#8B5CF6', icon: '💻' },
            ].map(s => (
              <div key={s.label} style={{ background: t.card, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}`, borderTop: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display' }}>{s.value}</div>
                <div style={{ color: t.mid, fontSize: '12px', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Daily chart */}
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Daily Page Views</h3>
                <span style={{ color: t.mid, fontSize: '12px', marginLeft: 'auto' }}>Last {days} days</span>
              </div>
              {summary.dailyViews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: t.mid, fontSize: '13px' }}>No data yet for this period</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px' }}>
                  {summary.dailyViews.map(([date, views]) => (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'default' }}
                      title={`${date}: ${views} views`}
                    >
                      <div style={{ width: '100%', height: `${Math.max(4, (views / maxDaily) * 100)}px`, background: 'rgba(79,195,247,0.5)', borderRadius: '2px 2px 0 0', minHeight: '4px', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,195,247,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,195,247,0.5)'}
                      >
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#4FC3F7', borderRadius: '2px 2px 0 0', height: `${Math.max(4, (views / maxDaily) * 100)}%`, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                {summary.dailyViews.length > 0 && (
                  <>
                    <span style={{ color: t.mid, fontSize: '10px' }}>{summary.dailyViews[0]?.[0]}</span>
                    <span style={{ color: t.mid, fontSize: '10px' }}>{summary.dailyViews[summary.dailyViews.length - 1]?.[0]}</span>
                  </>
                )}
              </div>
            </div>

            {/* Device breakdown */}
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '16px', background: '#D97706', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Devices</h3>
              </div>
              {Object.entries(summary.devices || {}).filter(([, v]) => v > 0).map(([device, count]) => {
                const total = Object.values(summary.devices || {}).reduce((s, v) => s + v, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const colors = { desktop: '#4FC3F7', mobile: '#D97706', tablet: '#10B981' };
                const icons = { desktop: '💻', mobile: '📱', tablet: '📱' };
                return (
                  <div key={device} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{icons[device]}</span>{device.charAt(0).toUpperCase() + device.slice(1)}
                      </span>
                      <span style={{ color: colors[device] || '#4FC3F7', fontSize: '13px', fontWeight: '700' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: t.border, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[device] || '#4FC3F7', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
              {Object.values(summary.devices || {}).every(v => v === 0) && (
                <p style={{ color: t.mid, fontSize: '13px' }}>No device data yet.</p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            {/* Top Pages */}
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{ width: '3px', height: '16px', background: '#10B981', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Top Pages</h3>
              </div>
              {summary.topPages.length === 0 ? (
                <p style={{ color: t.mid, fontSize: '13px' }}>No page data yet.</p>
              ) : summary.topPages.map(([page, views], i) => (
                <div key={page} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < summary.topPages.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <span style={{ color: t.mid, fontSize: '11px', fontWeight: '700', width: '16px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: t.charcoal, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page || 'Home'}</span>
                  </div>
                  <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '700', flexShrink: 0, marginLeft: '12px' }}>{views}</span>
                </div>
              ))}
            </div>

            {/* Referrers + GA tip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <div style={{ width: '3px', height: '16px', background: '#8B5CF6', borderRadius: '2px' }} />
                  <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Top Referrers</h3>
                </div>
                {summary.topReferrers.length === 0 ? (
                  <p style={{ color: t.mid, fontSize: '13px' }}>No referrer data yet. Most visitors came directly.</p>
                ) : summary.topReferrers.map(([ref, count], i) => (
                  <div key={ref} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < summary.topReferrers.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <span style={{ color: t.charcoal, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {ref.replace('https://', '').replace('http://', '').split('/')[0]}
                    </span>
                    <span style={{ color: '#8B5CF6', fontSize: '13px', fontWeight: '700' }}>{count}</span>
                  </div>
                ))}
              </div>

              {/* GA4 tip card */}
              <div style={{ background: 'linear-gradient(135deg, #040C16, #0F1E30)', borderRadius: '12px', padding: '20px', border: `1px solid #1A2D44` }}>
                <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '10px' }}>Power tip</div>
                <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                  For deeper analytics including real-time users, geographic data, and user journeys, connect Google Analytics 4 to your site. You already have GA4 experience from Kulan Institute.
                </p>
                <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                  Open Google Analytics →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AdminLogin = ({ onLogin, T }) => {
  const t = T;
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const attempt = () => { if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) { onLogin(); } else setErr(true); };
  const iStyle = { width: '100%', padding: '11px 13px', border: `1.5px solid ${err ? '#EF4444' : t.border}`, borderRadius: '10px', fontFamily: 'DM Sans', fontSize: '14px', marginBottom: '10px', outline: 'none', color: t.charcoal, background: t.soft };
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: t.card, borderRadius: '20px', padding: '44px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ margin: '0 auto 14px', display: 'inline-block' }}><StarLogo size={48} /></div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '4px' }}>Admin Access</h2>
          <p style={{ color: t.mid, fontSize: '13px' }}>Somalia 2040 · Dashboard</p>
        </div>
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px' }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()} placeholder="your@email.com" style={iStyle} />
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px' }}>Password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()} placeholder="••••••••" style={{ ...iStyle, letterSpacing: '3px' }} />
        {err && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '8px' }}>Incorrect email or password.</p>}
        <Btn onClick={attempt} T={t} style={{ width: '100%', marginTop: '6px' }}>Enter Dashboard</Btn>
      </div>
    </div>
  );
};

const AdminShell = ({ children, tab, setTab, onLogout, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const tabs = [
    { key: 'dash', label: 'Dashboard', icon: '⊞' },
    { key: 'posts', label: 'Blog Posts', icon: '✍' },
    { key: 'media', label: 'Media Library', icon: '🖼' },
    { key: 'comments', label: 'Comments', icon: '💬' },
    { key: 'community', label: 'Community', icon: '👥' },
    { key: 'word', label: 'Word of Week', icon: '📖' },
    { key: 'reading', label: 'Reading List', icon: '📚' },
    { key: 'timeline', label: 'Timeline', icon: '🗓' },
    { key: 'analytics', label: 'Analytics', icon: '📊' },
    { key: 'settings', label: 'Settings', icon: '⚙' },
  ];

  const Sidebar = () => (
    <div style={{ width: isMobile ? '100%' : '220px', background: '#040C16', borderRight: '1px solid #0A1628', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 'auto' : '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: '1px solid #0A1628', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StarLogo size={28} />
        <div>
          <div style={{ fontFamily: 'Playfair Display', fontSize: '14px', color: '#F8FAFC', letterSpacing: '-0.2px' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span></div>
          <div style={{ color: '#334155', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {tabs.map(tb => (
          <div key={tb.key} onClick={() => { setTab(tb.key); setSideOpen(false); }}
            style={{
              padding: '11px 20px', cursor: 'pointer', fontSize: '13px',
              fontWeight: tab === tb.key ? '600' : '400',
              color: tab === tb.key ? '#4FC3F7' : '#475569',
              background: tab === tb.key ? 'rgba(79,195,247,0.07)' : 'transparent',
              borderLeft: tab === tb.key ? '3px solid #4FC3F7' : '3px solid transparent',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
            }}
            onMouseEnter={e => { if (tab !== tb.key) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }}
            onMouseLeave={e => { if (tab !== tb.key) { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; } }}
          >
            <span style={{ fontSize: '15px', opacity: 0.75, width: '20px', textAlign: 'center' }}>{tb.icon}</span>
            <span>{tb.label}</span>
          </div>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #0A1628' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🇸🇴</div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '500' }}>Mohamud</div>
            <div style={{ color: '#334155', fontSize: '10px' }}>Admin</div>
          </div>
        </div>
        <div onClick={onLogout} style={{ color: '#334155', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#334155'}
        >← Logout</div>
      </div>
    </div>
  );

  if (isMobile) return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      <div style={{ background: '#040C16', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0A1628' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StarLogo size={24} />
          <div style={{ fontFamily: 'Playfair Display', fontSize: '14px', color: '#F8FAFC' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span> <span style={{ color: '#334155', fontSize: '10px' }}>Admin</span></div>
        </div>
        <button onClick={() => setSideOpen(!sideOpen)} style={{ background: 'none', border: 'none', color: '#F8FAFC', fontSize: '20px', cursor: 'pointer' }}>☰</button>
      </div>
      {sideOpen && <Sidebar />}
      <div style={{ padding: '24px 16px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: 'calc(100vw - 220px)' }}>
        {children}
      </div>
    </div>
  );
};


const AdminDash = ({ posts, voices, T, onTabChange }) => {
  const t = T;
  const isMobile = useIsMobile();
  const published = posts.filter(p => p.published);
  const drafts = posts.filter(p => !p.published);
  const pending = posts.flatMap(p => p.somalia_comments || []).filter(c => !c.approved);
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const featuredVoices = voices.filter(v => v.featured);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const quotes = [
    "The future belongs to those who prepare for it today.",
    "Build the Somalia you want to see.",
    "Every great leader was once a dreamer with a plan.",
    "A thousand mile journey begins with a single step.",
    "Wadaniyad waa salka dhismaha waddanka.",
  ];
  const quote = quotes[now.getDate() % quotes.length];

  const stats = [
    { label: 'Published Posts', value: published.length, sub: `${drafts.length} draft${drafts.length !== 1 ? 's' : ''}`, color: '#4FC3F7', icon: '✍' },
    { label: 'Total Reads', value: fmt(totalViews), sub: 'across all posts', color: '#D97706', icon: '👁' },
    { label: 'Pending', value: pending.length, sub: `comment${pending.length !== 1 ? 's' : ''} to review`, color: pending.length > 0 ? '#EF4444' : '#10B981', icon: '💬' },
    { label: 'Voices', value: voices.length, sub: `${featuredVoices.length} featured`, color: '#10B981', icon: '👥' },
  ];

  const quickActions = [
    { label: 'New Post', icon: '✍', action: 'posts' },
    { label: 'Upload Media', icon: '🖼', action: 'media' },
    { label: 'Word of Week', icon: '📖', action: 'word' },
    { label: 'Community', icon: '👥', action: 'community' },
  ];

  const topPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <div className="fade-in">
      {/* Welcome Header */}
      <div style={{ background: 'linear-gradient(135deg, #040C16, #0F1E30)', borderRadius: '16px', padding: isMobile ? '28px 24px' : '36px 40px', marginBottom: '24px', position: 'relative', overflow: 'hidden', border: `1px solid ${t.border}` }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(79,195,247,0.08), transparent)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '6px', letterSpacing: '0.3px' }}>{dateStr}</p>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '30px', color: '#F8FAFC', marginBottom: '12px', letterSpacing: '-0.3px' }}>
              {greeting}, Muzz 👋
            </h1>
            <p style={{ color: '#475569', fontSize: '14px', fontStyle: 'italic', maxWidth: '420px', lineHeight: '1.6' }}>"{quote}"</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600' }}>Site is live</span>
            </div>
            <span style={{ color: '#334155', fontSize: '11px' }}>Somalia 2040 Admin</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: '10px', marginBottom: '20px' }}>
        {quickActions.map(a => (
          <div key={a.label} onClick={() => onTabChange && onTabChange(a.action)} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ fontSize: '20px' }}>{a.icon}</span>
            <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: t.card, borderRadius: '12px', padding: '22px 20px', border: `1px solid ${t.border}`, borderTop: `3px solid ${s.color}`, transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display' }}>{s.value}</div>
              <span style={{ fontSize: '18px', opacity: 0.6 }}>{s.icon}</span>
            </div>
            <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ color: t.mid, fontSize: '11px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {/* Top Posts */}
        <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal }}>Top Posts by Views</h3>
          </div>
          {topPosts.length === 0 && <p style={{ color: t.mid, fontSize: '13px' }}>No posts yet. Write your first one.</p>}
          {topPosts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < topPosts.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: t.mid, fontSize: '12px', fontWeight: '700', width: '16px', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ color: t.mid, fontSize: '11px', marginTop: '2px' }}>{getRT(p.content)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '700' }}>{fmt(p.views || 0)}</span>
                <span style={{ background: p.published ? t.lightBlue : '#FEF3C7', color: p.published ? t.blueDark : '#92400E', fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '700' }}>{p.published ? 'Live' : 'Draft'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pending + Recent Voices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}`, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div style={{ width: '3px', height: '16px', background: pending.length > 0 ? '#EF4444' : '#10B981', borderRadius: '2px' }} />
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal }}>
                {pending.length > 0 ? `${pending.length} Pending Comment${pending.length !== 1 ? 's' : ''}` : 'All Comments Approved'}
              </h3>
            </div>
            {pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                <p style={{ color: t.mid, fontSize: '13px' }}>You are all caught up.</p>
              </div>
            ) : pending.slice(0, 4).map(c => (
              <div key={c.id} style={{ padding: '10px 0', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{c.author}</div>
                <div style={{ color: t.mid, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{c.text}</div>
              </div>
            ))}
          </div>

          <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '3px', height: '16px', background: '#D97706', borderRadius: '2px' }} />
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal }}>Somalia 2040 Progress</h3>
            </div>
            {[
              { label: 'Phase 1: Foundation', progress: 65, color: '#4FC3F7' },
              { label: 'Language Progress', progress: 30, color: '#D97706' },
              { label: 'Community Growth', progress: voices.length > 0 ? Math.min(voices.length * 10, 100) : 5, color: '#10B981' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: t.charcoal, fontSize: '12px', fontWeight: '500' }}>{item.label}</span>
                  <span style={{ color: item.color, fontSize: '12px', fontWeight: '700' }}>{item.progress}%</span>
                </div>
                <div style={{ height: '4px', background: t.border, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.progress}%`, background: item.color, borderRadius: '2px', transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


const AdminPosts = ({ posts, onSave, onDelete, onToggle, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title:'', title_so:'', excerpt:'', excerpt_so:'',
    content:'', content_so:'', thumbnail_url:'',
    seo_title:'', seo_description:'', category:'', tags:'',
    scheduled_at:'', published:false, featured:false
  });
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [aLang, setALang] = useState('en');
  const [activeSection, setActiveSection] = useState('content');
  const [showMedia, setShowMedia] = useState(false);
  const [pickTarget, setPickTarget] = useState(null);
  const autoSaveTimer = useRef(null);

  const CATEGORIES = ['Politics', 'Technology', 'Diaspora', 'Culture', 'Governance', 'Economy', 'History', 'Opinion'];

  const openEdit = (post) => {
    setEditing(post.id);
    setForm({
      title: post.title||'', title_so: post.title_so||'',
      excerpt: post.excerpt||'', excerpt_so: post.excerpt_so||'',
      content: post.content||'', content_so: post.content_so||'',
      thumbnail_url: post.thumbnail_url||'',
      seo_title: post.seo_title||'', seo_description: post.seo_description||'',
      category: post.category||'', tags: (post.tags||[]).join(', '),
      scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0,16) : '',
      published: post.published, featured: post.featured
    });
  };

  const openNew = () => {
    setEditing('new');
    setForm({ title:'', title_so:'', excerpt:'', excerpt_so:'', content:'', content_so:'', thumbnail_url:'', seo_title:'', seo_description:'', category:'', tags:'', scheduled_at:'', published:false, featured:false });
  };

  const triggerAutoSave = (updatedForm) => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 1500);
  };

  const updateForm = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    triggerAutoSave(updated);
  };

  const save = async () => {
    setSaving(true);
    const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const payload = editing === 'new'
      ? { ...form, tags: tagsArr, scheduled_at: form.scheduled_at || null, date: new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) }
      : { id: editing, ...form, tags: tagsArr, scheduled_at: form.scheduled_at || null };
    await onSave(payload);
    setSaving(false);
    setEditing(null);
  };

  const pickMedia = (target) => { setPickTarget(target); setShowMedia(true); };
  const handleMediaSelect = (url) => { updateForm(pickTarget, url); setShowMedia(false); };

  const iStyle = { width:'100%', padding:'9px 11px', border:`1px solid ${t.border}`, borderRadius:'8px', fontSize:'13px', marginBottom:'10px', outline:'none', background:t.inputBg, color:t.charcoal };
  const tabStyle = (active) => ({ padding:'8px 16px', background:'none', border:'none', borderBottom:`2px solid ${active?'#4FC3F7':'transparent'}`, color:active?'#4FC3F7':t.mid, cursor:'pointer', fontSize:'13px', fontWeight:'600', marginBottom:'-1px', transition:'all 0.15s' });

  if (showMedia) return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ fontFamily:'Playfair Display', fontSize:'20px', color:t.charcoal }}>Pick from Media Library</h2>
        <Btn small outline onClick={() => setShowMedia(false)} T={t}>Cancel</Btn>
      </div>
      <AdminMedia T={t} onSelect={handleMediaSelect} />
    </div>
  );

  if (editing !== null) return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'22px', color:t.charcoal }}>{editing==='new'?'New Post':'Edit Post'}</h1>
          {autoSaved && <span style={{ color:'#10B981', fontSize:'12px', marginTop:'4px', display:'block' }}>✓ Auto-saved</span>}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <Btn outline small onClick={() => setEditing(null)} T={t}>Cancel</Btn>
          <Btn small onClick={save} T={t} disabled={saving}>{saving?'Saving...':'Save Post'}</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 280px', gap:'16px', alignItems:'start' }}>
        {/* Main editor */}
        <div>
          {/* Language tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${t.border}`, marginBottom:'16px' }}>
            {[['en','English'],['so','Somali']].map(([key,label]) => (
              <button key={key} onClick={() => setALang(key)} style={tabStyle(aLang===key)}>{label}</button>
            ))}
          </div>

          {/* Section tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${t.border}`, marginBottom:'20px', overflowX:'auto' }}>
            {[['content','Content'],['seo','SEO'],['media','Media']].map(([key,label]) => (
              <button key={key} onClick={() => setActiveSection(key)} style={tabStyle(activeSection===key)}>{label}</button>
            ))}
          </div>

          {activeSection === 'content' && (
            <div style={{ background:t.card, borderRadius:'12px', padding:isMobile?'16px':'24px', border:`1px solid ${t.border}` }}>
              {aLang === 'en' ? (
                <>
                  <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>TITLE (ENGLISH)</label>
                  <input style={iStyle} value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="Post title..." />
                  <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>EXCERPT</label>
                  <textarea style={{ ...iStyle, resize:'vertical' }} rows={2} value={form.excerpt} onChange={e => updateForm('excerpt', e.target.value)} placeholder="Short description shown on blog list..." />
                  <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'8px', fontWeight:'700', letterSpacing:'0.5px' }}>CONTENT</label>
                  <RTE value={form.content} onChange={v => updateForm('content', v)} T={t} />
                </>
              ) : (
                <>
                  <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>CINWAANKA (TITLE)</label>
                  <input style={iStyle} value={form.title_so} onChange={e => updateForm('title_so', e.target.value)} placeholder="Cinwaanka Soomaali..." />
                  <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>SOO-KOOB (EXCERPT)</label>
                  <textarea style={{ ...iStyle, resize:'vertical' }} rows={2} value={form.excerpt_so} onChange={e => updateForm('excerpt_so', e.target.value)} placeholder="Soo-koob gaaban..." />
                  <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'8px', fontWeight:'700', letterSpacing:'0.5px' }}>WAXA BUUXA (CONTENT)</label>
                  <RTE value={form.content_so} onChange={v => updateForm('content_so', v)} T={t} />
                  {!form.content_so && form.content && (
                    <div style={{ background:t.lightBlue, borderRadius:'8px', padding:'12px', marginTop:'8px' }}>
                      <p style={{ color:t.blueDark, fontSize:'12px' }}>💡 English content exists but no Somali translation yet. Visitors in Somali regions will see the English version until you translate.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeSection === 'seo' && (
            <div style={{ background:t.card, borderRadius:'12px', padding:isMobile?'16px':'24px', border:`1px solid ${t.border}` }}>
              <div style={{ marginBottom:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                  <div style={{ width:'3px', height:'16px', background:'#4FC3F7', borderRadius:'2px' }} />
                  <h3 style={{ fontFamily:'Playfair Display', fontSize:'17px', color:t.charcoal }}>SEO Settings</h3>
                </div>
                <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>SEO TITLE <span style={{ color:t.mid, fontWeight:'400' }}>(shown in search results)</span></label>
                <input style={iStyle} value={form.seo_title} onChange={e => updateForm('seo_title', e.target.value)} placeholder={form.title || 'Leave blank to use post title'} />
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                  <label style={{ color:t.mid, fontSize:'11px', fontWeight:'700', letterSpacing:'0.5px' }}>META DESCRIPTION</label>
                  <span style={{ color: form.seo_description.length > 160 ? '#EF4444' : t.mid, fontSize:'11px' }}>{form.seo_description.length}/160</span>
                </div>
                <textarea style={{ ...iStyle, resize:'vertical', marginBottom:'16px' }} rows={3} value={form.seo_description} onChange={e => updateForm('seo_description', e.target.value)} placeholder="Description shown in Google search results (max 160 characters)..." />
              </div>

              {/* Preview */}
              <div style={{ background:t.soft, borderRadius:'10px', padding:'16px', border:`1px solid ${t.border}` }}>
                <p style={{ color:t.mid, fontSize:'11px', marginBottom:'10px', fontWeight:'700', letterSpacing:'0.5px' }}>GOOGLE PREVIEW</p>
                <div style={{ fontFamily:'arial,sans-serif' }}>
                  <div style={{ color:'#1a0dab', fontSize:'18px', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {form.seo_title || form.title || 'Post title'}
                  </div>
                  <div style={{ color:'#006621', fontSize:'13px', marginBottom:'4px' }}>politics.mmohamud.me</div>
                  <div style={{ color:'#545454', fontSize:'13px', lineHeight:'1.5' }}>
                    {(form.seo_description || form.excerpt || 'Add a meta description to improve your search appearance.').slice(0, 160)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'media' && (
            <div style={{ background:t.card, borderRadius:'12px', padding:isMobile?'16px':'24px', border:`1px solid ${t.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                <div style={{ width:'3px', height:'16px', background:'#D97706', borderRadius:'2px' }} />
                <h3 style={{ fontFamily:'Playfair Display', fontSize:'17px', color:t.charcoal }}>Thumbnail Image</h3>
              </div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                <Btn small outline onClick={() => pickMedia('thumbnail_url')} T={t}>📁 Pick from Library</Btn>
                <span style={{ color:t.mid, fontSize:'12px', alignSelf:'center' }}>or paste URL:</span>
              </div>
              <input style={iStyle} value={form.thumbnail_url} onChange={e => updateForm('thumbnail_url', e.target.value)} placeholder="https://..." />
              {form.thumbnail_url ? (
                <div style={{ position:'relative' }}>
                  <img src={form.thumbnail_url} alt="thumbnail" style={{ width:'100%', maxHeight:'200px', objectFit:'cover', borderRadius:'10px' }} onError={e => e.target.style.display='none'} />
                  <button onClick={() => updateForm('thumbnail_url', '')} style={{ position:'absolute', top:'8px', right:'8px', background:'rgba(0,0,0,0.6)', color:'#FFF', border:'none', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer', fontSize:'16px' }}>×</button>
                </div>
              ) : (
                <ImgUploader onSelect={url => updateForm('thumbnail_url', url)} T={t} label="Upload thumbnail" />
              )}
            </div>
          )}
        </div>

        {/* Sidebar settings */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {/* Publish settings */}
          <div style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.border}` }}>
            <h3 style={{ fontFamily:'Playfair Display', fontSize:'16px', color:t.charcoal, marginBottom:'16px' }}>Publish Settings</h3>
            {[['published','Published (live on site)'],['featured','Featured on Homepage']].map(([f,l]) => (
              <label key={f} style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', fontSize:'13px', color:t.charcoal, marginBottom:'12px', fontWeight:'500' }}>
                <div onClick={() => updateForm(f, !form[f])} style={{ width:'36px', height:'20px', borderRadius:'10px', background:form[f]?'#4FC3F7':t.border, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:'2px', left:form[f]?'18px':'2px', width:'16px', height:'16px', borderRadius:'50%', background:'#FFF', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                {l}
              </label>
            ))}

            <div style={{ height:'1px', background:t.border, margin:'12px 0' }} />
            <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>SCHEDULE PUBLISH</label>
            <input type="datetime-local" style={iStyle} value={form.scheduled_at} onChange={e => updateForm('scheduled_at', e.target.value)} />
            {form.scheduled_at && !form.published && (
              <div style={{ background:t.lightBlue, borderRadius:'6px', padding:'8px 10px' }}>
                <p style={{ color:t.blueDark, fontSize:'11px' }}>📅 Will auto-publish at the scheduled time.</p>
              </div>
            )}
          </div>

          {/* Category & Tags */}
          <div style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.border}` }}>
            <h3 style={{ fontFamily:'Playfair Display', fontSize:'16px', color:t.charcoal, marginBottom:'14px' }}>Category & Tags</h3>
            <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>CATEGORY</label>
            <select style={{ ...iStyle, cursor:'pointer' }} value={form.category} onChange={e => updateForm('category', e.target.value)}>
              <option value="">No category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ color:t.mid, fontSize:'11px', display:'block', marginBottom:'4px', fontWeight:'700', letterSpacing:'0.5px' }}>TAGS <span style={{ fontWeight:'400' }}>(comma separated)</span></label>
            <input style={iStyle} value={form.tags} onChange={e => updateForm('tags', e.target.value)} placeholder="e.g. diaspora, governance, tech" />
            {form.tags && (
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'6px' }}>
                {form.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <span key={tag} style={{ background:t.lightBlue, color:t.blueDark, fontSize:'11px', padding:'3px 10px', borderRadius:'20px', fontWeight:'600' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Word count */}
          <div style={{ background:t.soft, borderRadius:'10px', padding:'16px', border:`1px solid ${t.border}` }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {[
                { label:'Words', value: (form.content||'').replace(/<[^>]*>/g,'').trim().split(' ').filter(s => s.length > 0).length },
                { label:'Read time', value: getRT(form.content) },
              ].map(item => (
                <div key={item.label} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'Playfair Display', fontSize:'20px', color:'#4FC3F7', fontWeight:'700' }}>{item.value}</div>
                  <div style={{ color:t.mid, fontSize:'11px', marginTop:'2px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'26px', color:t.charcoal, letterSpacing:'-0.3px' }}>Blog Posts</h1>
          <p style={{ color:t.mid, fontSize:'13px', marginTop:'4px' }}>{posts.filter(p=>p.published).length} published · {posts.filter(p=>!p.published).length} drafts</p>
        </div>
        <Btn small onClick={openNew} T={t}>+ New Post</Btn>
      </div>

      {/* Category filter pills */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
        {['All', ...new Set(posts.map(p=>p.category).filter(Boolean))].map(cat => (
          <span key={cat} style={{ background:t.soft, border:`1px solid ${t.border}`, borderRadius:'20px', padding:'4px 12px', fontSize:'12px', color:t.mid, cursor:'pointer' }}>{cat}</span>
        ))}
      </div>

      <div style={{ background:t.card, borderRadius:'12px', overflow:'hidden', border:`1px solid ${t.border}` }}>
        {posts.length === 0 && <p style={{ padding:'32px', color:t.mid }}>No posts yet. Create your first one.</p>}
        {posts.map((p, i) => (
          <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderBottom:i<posts.length-1?`1px solid ${t.border}`:'none', flexWrap:'wrap', gap:'8px', transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = t.soft}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex:1, minWidth:'120px', display:'flex', gap:'12px', alignItems:'center' }}>
              {p.thumbnail_url && <img src={p.thumbnail_url} alt="" style={{ width:'44px', height:'44px', objectFit:'cover', borderRadius:'8px', flexShrink:0 }} onError={e=>e.target.style.display='none'} />}
              <div>
                <div style={{ color:t.charcoal, fontSize:'13px', fontWeight:'500' }}>{p.title}</div>
                <div style={{ display:'flex', gap:'8px', marginTop:'3px', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ color:t.mid, fontSize:'11px' }}>{p.date}</span>
                  <span style={{ color:t.mid, fontSize:'11px' }}>{fmt(p.views||0)} views</span>
                  <span style={{ color:t.mid, fontSize:'11px' }}>{getRT(p.content)}</span>
                  {p.category && <span style={{ background:t.lightBlue, color:t.blueDark, fontSize:'10px', padding:'2px 7px', borderRadius:'20px', fontWeight:'600' }}>{p.category}</span>}
                  {p.featured && <span style={{ color:'#D97706', fontSize:'11px', fontWeight:'600' }}>★</span>}
                  {p.scheduled_at && !p.published && <span style={{ color:'#8B5CF6', fontSize:'11px', fontWeight:'600' }}>⏰ Scheduled</span>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
              <span onClick={() => onToggle(p.id,'published',!p.published)} style={{ background:p.published?t.lightBlue:'#FEF3C7', color:p.published?t.blueDark:'#92400E', fontSize:'10px', padding:'3px 9px', borderRadius:'20px', fontWeight:'700', cursor:'pointer', letterSpacing:'0.3px', transition:'all 0.15s' }}>{p.published?'Live':'Draft'}</span>
              <Btn small outline onClick={() => openEdit(p)} T={t}>Edit</Btn>
              <Btn small danger onClick={() => { if(confirm('Delete this post?')) onDelete(p.id); }} T={t}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const AdminComments = ({ posts, onApprove, onDelete, T }) => {
  const t = T;
  const all = posts.flatMap(p => (p.somalia_comments || []).map(c => ({ ...c, postTitle: p.title })));
  const pending = all.filter(c => !c.approved);
  const approved = all.filter(c => c.approved);
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '24px' }}>Comment Moderation</h1>
      {pending.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: '#F59E0B', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Pending ({pending.length})</div>
          {pending.map(c => (
            <div key={c.id} style={{ background: t.card, borderRadius: '10px', padding: '16px 18px', marginBottom: '8px', borderLeft: '3px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                <div><span style={{ fontWeight: '600', color: t.charcoal, fontSize: '13px' }}>{c.author}</span><span style={{ color: t.mid, fontSize: '11px', marginLeft: '8px' }}>on: {c.postTitle}</span></div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Btn small onClick={() => onApprove(c.id)} T={t} style={{ background: '#D1FAE5', color: '#065F46', border: 'none' }}>Approve</Btn>
                  <Btn small onClick={() => onDelete(c.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Delete</Btn>
                </div>
              </div>
              <p style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.6' }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
      {approved.length > 0 && (
        <div>
          <div style={{ color: '#10B981', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Approved ({approved.length})</div>
          {approved.map(c => (
            <div key={c.id} style={{ background: t.card, borderRadius: '10px', padding: '14px 18px', marginBottom: '8px', borderLeft: '3px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                <div><span style={{ fontWeight: '600', color: t.charcoal, fontSize: '13px' }}>{c.author}</span><span style={{ color: t.mid, fontSize: '11px', marginLeft: '8px' }}>on: {c.postTitle}</span></div>
                <Btn small onClick={() => onDelete(c.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Delete</Btn>
              </div>
              <p style={{ color: t.charcoal, fontSize: '13px', lineHeight: '1.6' }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
      {all.length === 0 && <p style={{ color: t.mid }}>No comments yet.</p>}
    </div>
  );
};

const AdminCommunity = ({ voices, onToggleFeatured, onDelete, monthlyQ, onUpdateQ, T }) => {
  const t = T;
  const [q, setQ] = useState(monthlyQ || '');
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '22px' }}>Community Manager</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '22px', marginBottom: '18px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '12px' }}>Monthly Question</h3>
        <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', resize: 'vertical', outline: 'none', background: t.inputBg, color: t.charcoal, marginBottom: '10px' }} />
        <Btn small onClick={() => onUpdateQ(q)} T={t}>Update Question</Btn>
      </div>
      <div style={{ background: t.card, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Community Voices ({voices.length})</span>
        </div>
        {voices.map((v, i) => (
          <div key={v.id} style={{ padding: '14px 18px', borderBottom: i < voices.length - 1 ? `1px solid ${t.border}` : 'none' }}>
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

const AdminWord = ({ word, wordArchive, onUpdate, onAddToArchive, onSetActive, T }) => {
  const t = T;
  const [form, setForm] = useState({ somali: '', english: '', sentence: '' });
  const [adding, setAdding] = useState(false);
  const iStyle = { width: '100%', padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', outline: 'none', background: t.inputBg, color: t.charcoal, marginBottom: '10px' };

  const handleAdd = async () => {
    if (!form.somali || !form.english) return;
    setAdding(true);
    await onAddToArchive({ ...form, active: false });
    setForm({ somali: '', english: '', sentence: '' });
    setAdding(false);
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '22px' }}>Word of the Week</h1>

      {word && (
        <div style={{ background: '#0F172A', borderRadius: '12px', padding: '22px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Currently Active</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: '#FFF' }}>{word.somali}</div>
            <div style={{ color: t.gold, fontSize: '13px', margin: '3px 0 6px' }}>{word.english}</div>
            <p style={{ color: '#9CA3AF', fontSize: '12px', fontStyle: 'italic' }}>{word.sentence}</p>
          </div>
          <div style={{ background: '#10B981', color: '#FFF', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', alignSelf: 'flex-start' }}>Active</div>
        </div>
      )}

      <div style={{ background: t.card, borderRadius: '12px', padding: '22px', marginBottom: '18px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '14px' }}>Add New Word</h3>
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Somali Word</label>
        <input value={form.somali} onChange={e => setForm({ ...form, somali: e.target.value })} placeholder="e.g. Wadaniyad" style={iStyle} />
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>English Translation</label>
        <input value={form.english} onChange={e => setForm({ ...form, english: e.target.value })} placeholder="e.g. Patriotism" style={iStyle} />
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Example Sentence (Somali)</label>
        <input value={form.sentence} onChange={e => setForm({ ...form, sentence: e.target.value })} placeholder="Faqradda tusaale ah..." style={iStyle} />
        <Btn small onClick={handleAdd} T={t}>{adding ? 'Adding...' : 'Add to Archive'}</Btn>
      </div>

      <div style={{ background: t.card, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Word Archive ({wordArchive.length})</span>
        </div>
        {wordArchive.length === 0 && <p style={{ padding: '20px', color: t.mid, fontSize: '13px' }}>No words in archive yet.</p>}
        {wordArchive.map((w, i) => (
          <div key={w.id} style={{ padding: '14px 18px', borderBottom: i < wordArchive.length - 1 ? `1px solid ${t.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>{w.somali}</span>
              <span style={{ color: t.mid, fontSize: '12px', marginLeft: '10px' }}>{w.english}</span>
              <span style={{ color: t.mid, fontSize: '11px', display: 'block', marginTop: '2px' }}>{new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {w.active ? (
                <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>Active</span>
              ) : (
                <Btn small onClick={() => onSetActive(w.id, w)} T={t} style={{ background: t.lightBlue, color: t.blueDark, border: 'none' }}>Set Active</Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminReading = ({ reading, onAdd, onDelete, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ title: '', author: '', category: '', note: '' });
  const iStyle = { padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', outline: 'none', background: t.inputBg, color: t.charcoal };
  const add = async () => { if (!form.title || !form.author) return; await onAdd(form); setForm({ title: '', author: '', category: '', note: '' }); };
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '22px' }}>Reading List</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '22px', marginBottom: '18px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '14px' }}>Add a Book</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          {[['title','Title'],['author','Author'],['category','Category']].map(([f, p]) => (
            <input key={f} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} placeholder={p} style={iStyle} />
          ))}
        </div>
        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Why you recommend it..." rows={2} style={{ ...iStyle, width: '100%', resize: 'vertical', marginBottom: '10px' }} />
        <Btn small onClick={add} T={t}>Add Book</Btn>
      </div>
      {reading.map(b => (
        <div key={b.id} style={{ background: t.card, borderRadius: '8px', padding: '13px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '13px' }}>{b.title}</span>
            <span style={{ color: '#4FC3F7', fontSize: '12px', marginLeft: '8px' }}>by {b.author}</span>
            <span style={{ color: t.mid, fontSize: '11px', display: 'block' }}>{b.category}</span>
          </div>
          <Btn small onClick={() => onDelete(b.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Remove</Btn>
        </div>
      ))}
    </div>
  );
};

const AdminTimeline = ({ timeline, onUpdate, T }) => {
  const t = T;
  const [local, setLocal] = useState(timeline || []);
  useEffect(() => { setLocal(timeline || []); }, [timeline]);
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal }}>Somalia 2040 Roadmap</h1>
        <Btn small onClick={() => onUpdate(local)} T={t}>Save Changes</Btn>
      </div>
      {local.map((phase, i) => (
        <div key={i} style={{ background: t.card, borderRadius: '10px', padding: '18px', marginBottom: '12px' }}>
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

const AdminSettings = ({ setPage, siteTitle, onUpdateTitle, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(siteTitle || 'Somalia');
  const [saved, setSaved] = useState(false);
  const [announcement, setAnnouncement] = useState({ message: '', color: '#4FC3F7', active: false });
  const [annSaved, setAnnSaved] = useState(false);
  const [annLoading, setAnnLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const ann = await getAnnouncement();
      if (ann) setAnnouncement({ message: ann.message, color: ann.color || '#4FC3F7', active: true });
      setAnnLoading(false);
    };
    load();
  }, []);

  const saveTitle = async () => { await onUpdateTitle(title); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const saveAnn = async () => {
    await saveAnnouncement(announcement.message, announcement.color);
    setAnnSaved(true);
    setTimeout(() => setAnnSaved(false), 2000);
  };

  const clearAnn = async () => {
    await clearAnnouncement();
    setAnnouncement({ message: '', color: '#4FC3F7', active: false });
  };

  const runScheduled = async () => {
    const count = await publishScheduledPosts();
    setScheduledCount(count);
    setTimeout(() => setScheduledCount(0), 4000);
  };

  const COLORS = ['#4FC3F7', '#D97706', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px', letterSpacing: '-0.3px' }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>

        {/* Site Identity */}
        <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Site Identity</h3>
          </div>
          <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>SITE TITLE</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <input value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1, padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none' }} />
            <Btn small onClick={saveTitle} T={t} style={{ background: saved ? '#10B981' : undefined }}>{saved ? '✓ Saved' : 'Save'}</Btn>
          </div>
          <p style={{ color: t.mid, fontSize: '12px', marginBottom: '20px' }}>Shows as "{title} 2040" in navbar, footer, and browser tab.</p>
          {[['Site URL', 'politics.mmohamud.me'], ['Admin Email', 'mohamedmohammud@gmail.com']].map(([l, v]) => (
            <div key={l} style={{ marginBottom: '14px' }}>
              <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>{l.toUpperCase()}</label>
              <input defaultValue={v} readOnly style={{ width: '100%', padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '13px', background: t.soft, color: t.mid, outline: 'none' }} />
            </div>
          ))}
        </div>

        {/* Announcement Banner */}
        <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#D97706', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Announcement Banner</h3>
          </div>
          <p style={{ color: t.mid, fontSize: '13px', marginBottom: '14px', lineHeight: '1.5' }}>Show a banner across the top of the site for announcements or news.</p>
          {annLoading ? <p style={{ color: t.mid, fontSize: '13px' }}>Loading...</p> : (
            <>
              <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>MESSAGE</label>
              <textarea value={announcement.message} onChange={e => setAnnouncement({ ...announcement, message: e.target.value })} rows={2} placeholder="e.g. New essay published: Why Somalia needs technology-first leadership" style={{ width: '100%', padding: '10px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none', resize: 'vertical', marginBottom: '12px' }} />
              <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '8px', fontWeight: '700', letterSpacing: '0.5px' }}>BANNER COLOR</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setAnnouncement({ ...announcement, color: c })} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer', border: announcement.color === c ? '3px solid white' : '2px solid transparent', boxShadow: announcement.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.15s' }} />
                ))}
              </div>
              {/* Preview */}
              {announcement.message && (
                <div style={{ background: announcement.color, borderRadius: '8px', padding: '10px 16px', marginBottom: '14px', textAlign: 'center' }}>
                  <span style={{ color: '#FFF', fontSize: '13px', fontWeight: '500' }}>{announcement.message}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn small onClick={saveAnn} T={t} style={{ background: annSaved ? '#10B981' : undefined }}>{annSaved ? '✓ Active' : 'Set Banner'}</Btn>
                {announcement.active && <Btn small outline onClick={clearAnn} T={t}>Clear Banner</Btn>}
              </div>
            </>
          )}
        </div>

        {/* Post Scheduling */}
        <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#8B5CF6', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Scheduled Posts</h3>
          </div>
          <p style={{ color: t.mid, fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
            Posts with a scheduled publish time will not go live automatically. Click below to manually publish any posts whose scheduled time has passed.
          </p>
          <Btn small onClick={runScheduled} T={t} style={{ background: scheduledCount > 0 ? '#10B981' : undefined }}>
            {scheduledCount > 0 ? `✓ Published ${scheduledCount} post${scheduledCount !== 1 ? 's' : ''}` : '⏰ Publish Scheduled Posts'}
          </Btn>
          <p style={{ color: t.mid, fontSize: '11px', marginTop: '10px' }}>Run this whenever you want to check for posts ready to publish.</p>
        </div>

        {/* Quick links */}
        <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#10B981', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Quick Links</h3>
          </div>
          {[
            { label: '🌐 View Public Site', action: () => setPage('home') },
            { label: '📊 View Analytics', action: () => {} },
            { label: '🖼 Media Library', action: () => {} },
            { label: '📝 Write New Post', action: () => {} },
          ].map(item => (
            <div key={item.label} onClick={item.action} style={{ padding: '10px 0', borderBottom: `1px solid ${t.border}`, cursor: 'pointer', color: t.charcoal, fontSize: '13px', fontWeight: '500', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4FC3F7'}
              onMouseLeave={e => e.currentTarget.style.color = t.charcoal}
            >{item.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [page, setPage]             = useState('home');
  const [transitioning, setTransitioning] = useState(false);
  const [displayPage, setDisplayPage] = useState('home');
  const [lang, setLang]             = useState('en');
  const [dark, setDark]             = useState(false);
  const [posts, setPosts]           = useState([]);
  const [voices, setVoices]         = useState([]);
  const [reading, setReading]       = useState([]);
  const [word, setWord]             = useState(null);
  const [wordArchive, setWordArchive] = useState([]);
  const [timeline, setTimeline]     = useState([]);
  const [monthlyQ, setMonthlyQ]     = useState('');
  const [siteTitle, setSiteTitle]   = useState('Somalia');
  const [currentPost, setCurrentPost] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => localStorage.getItem('s2040_admin') === 'true');
  const [adminTab, setAdminTab]     = useState(() => localStorage.getItem('s2040_tab') || 'dash');
  const [loading, setLoading]       = useState(true);
  const [announcement, setAnnouncement] = useState(null);
  const [annDismissed, setAnnDismissed] = useState(false);

  const T = getT(dark);

    const nav = useCallback((p) => {
    if (p !== 'admin') {
      localStorage.setItem('s2040_page', p);
      trackEvent('page_view', { page: p });
    }
    setTransitioning(true);
    setTimeout(() => {
      setPage(p);
      setDisplayPage(p);
      setTransitioning(false);
      window.scrollTo(0, 0);
    }, 150);
  }, []);

  useEffect(() => {
    const detectLang = async () => {
      try {
        const r = await fetch('https://ipapi.co/json/');
        const d = await r.json();
        if (['SO','DJ','ET','KE','ER'].includes(d.country_code)) setLang('so');
      } catch {}
    };
    detectLang();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('s2040_dark');
    if (saved === 'true') setDark(true);
  }, []);

  useEffect(() => { localStorage.setItem('s2040_dark', dark); }, [dark]);
  useEffect(() => { localStorage.setItem('s2040_tab', adminTab); }, [adminTab]);
  useEffect(() => { localStorage.setItem('s2040_tab', adminTab); }, [adminTab]);

  useEffect(() => { document.title = `${siteTitle} 2040`; }, [siteTitle]);

  const loadAll = async () => {
    setLoading(true);
    const [p, v, r, w, q, tl, st, wa, ann] = await Promise.all([
      getPosts(), getVoices(), getReading(),
      getSetting('word_of_week'), getSetting('monthly_question'), getSetting('timeline'),
      getSetting('site_title'), getWordArchive(), getAnnouncement(),
    ]);
    setPosts(p); setVoices(v); setReading(r);
    if (w) setWord(w);
    if (q) setMonthlyQ(q);
    if (tl) setTimeline(tl);
    if (st) setSiteTitle(typeof st === 'string' ? st : 'Somalia');
    setWordArchive(wa);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    trackEvent('page_view', { page: page });
  }, []);

  const adminLogin = () => { setAdminLoggedIn(true); localStorage.setItem('s2040_admin', 'true'); };
  const adminLogout = () => { setAdminLoggedIn(false); localStorage.removeItem('s2040_admin'); nav('home'); };

  const handleSavePost    = async (p) => { await savePost(p); await loadAll(); };
  const handleDeletePost  = async (id) => { await deletePost(id); setPosts(posts.filter(p => p.id !== id)); };
  const handleTogglePost  = async (id, f, v) => { await togglePostField(id, f, v); await loadAll(); };
  const handleAddComment  = async (c) => { await addComment(c); await loadAll(); };
  const handleApproveComment = async (id) => { await approveComment(id); await loadAll(); };
  const handleDeleteComment  = async (id) => { await deleteComment(id); await loadAll(); };
  const handleAddVoice    = async (v) => { const nv = await addVoice(v); if (nv) setVoices(prev => [nv, ...prev]); };
  const handleToggleVoice = async (id, f) => { await toggleVoiceFeatured(id, f); await loadAll(); };
  const handleDeleteVoice = async (id) => { await deleteVoice(id); setVoices(voices.filter(v => v.id !== id)); };
  const handleAddBook     = async (b) => { const nb = await addBook(b); if (nb) setReading(prev => [...prev, nb]); };
  const handleDeleteBook  = async (id) => { await deleteBook(id); setReading(reading.filter(r => r.id !== id)); };
  const handleUpdateWord  = async (w) => { await setSetting('word_of_week', w); setWord(w); };
  const handleUpdateQ     = async (q) => { await setSetting('monthly_question', q); setMonthlyQ(q); };
  const handleUpdateTimeline = async (tl) => { await setSetting('timeline', tl); setTimeline(tl); };
  const handleUpdateTitle = async (title) => { await setSetting('site_title', title); setSiteTitle(title); };
  const handleAddToArchive = async (w) => { const nw = await addToWordArchive(w); if (nw) setWordArchive(prev => [nw, ...prev]); };
  const handleSetActive   = async (id, wordData) => { await setActiveWord(id, wordData); setWord({ somali: wordData.somali, english: wordData.english, sentence: wordData.sentence }); setWordArchive(prev => prev.map(w => ({ ...w, active: w.id === id }))); };

  const handleOpenPost = async (post) => {
    setCurrentPost(post);
    nav('post');
    await incrementViews(post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
  };

  if (displayPage === 'admin') {
    if (!adminLoggedIn) return (<><GlobalStyles dark={dark} /><AdminLogin onLogin={adminLogin} T={T} /></>);
    return (
      <>
        <GlobalStyles dark={dark} />
        <AdminShell tab={adminTab} setTab={setAdminTab} onLogout={adminLogout} T={T}>
          {adminTab === 'dash'      && <AdminDash posts={posts} voices={voices} T={T} onTabChange={setAdminTab} />}
          {adminTab === 'posts'     && <AdminPosts posts={posts} onSave={handleSavePost} onDelete={handleDeletePost} onToggle={handleTogglePost} T={T} />}
          {adminTab === 'media'     && <AdminMedia T={T} />}
          {adminTab === 'comments'  && <AdminComments posts={posts} onApprove={handleApproveComment} onDelete={handleDeleteComment} T={T} />}
          {adminTab === 'community' && <AdminCommunity voices={voices} onToggleFeatured={handleToggleVoice} onDelete={handleDeleteVoice} monthlyQ={monthlyQ} onUpdateQ={handleUpdateQ} T={T} />}
          {adminTab === 'word'      && <AdminWord word={word} wordArchive={wordArchive} onUpdate={handleUpdateWord} onAddToArchive={handleAddToArchive} onSetActive={handleSetActive} T={T} />}
          {adminTab === 'reading'   && <AdminReading reading={reading} onAdd={handleAddBook} onDelete={handleDeleteBook} T={T} />}
          {adminTab === 'timeline'  && <AdminTimeline timeline={timeline} onUpdate={handleUpdateTimeline} T={T} />}
          {adminTab === 'analytics' && <AdminAnalytics T={T} />}
          {adminTab === 'settings'  && <AdminSettings setPage={nav} siteTitle={siteTitle} onUpdateTitle={handleUpdateTitle} T={T} />}
        </AdminShell>
      </>
    );
  }

  return (
    <>
      <GlobalStyles dark={dark} />
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans',sans-serif", transition: 'background 0.3s, opacity 0.15s', opacity: transitioning ? 0 : 1 }}>
        <Nav page={displayPage} setPage={nav} lang={lang} setLang={setLang} dark={dark} setDark={setDark} T={T} siteTitle={siteTitle} />
        {loading ? (
          displayPage === 'post' ? <PostSkeleton dark={dark} /> : <BlogSkeleton dark={dark} />
        ) : (
          <>
            {displayPage === 'home'    && <HomePage posts={posts} lang={lang} word={word} setPage={nav} setCurrentPost={(p) => handleOpenPost(p)} voices={voices} dark={dark} T={T} />}
            {displayPage === 'blog'    && <BlogPage posts={posts} lang={lang} setPage={nav} setCurrentPost={(p) => handleOpenPost(p)} T={T} />}
            {displayPage === 'post'    && currentPost && <PostPage post={posts.find(p => p.id === currentPost.id) || currentPost} lang={lang} setPage={nav} onCommentSubmit={handleAddComment} T={T} />}
            {displayPage === 'vision'  && <VisionPage lang={lang} timeline={timeline} T={T} />}
            {displayPage === 'story'   && <StoryPage lang={lang} T={T} />}
            {displayPage === 'reading' && <ReadingPage reading={reading} lang={lang} T={T} />}
            {displayPage === 'connect' && <ConnectPage voices={voices} onVoiceSubmit={handleAddVoice} lang={lang} monthlyQ={monthlyQ} T={T} />}
          </>
        )}
        <Footer setPage={nav} T={T} siteTitle={siteTitle} />
        <div onClick={() => nav('admin')} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#040C16', border: '1px solid #1A2D44', color: '#FFF', padding: '8px 14px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', fontWeight: '500', zIndex: 50 }}>Admin →</div>
        <BackToTop T={T} />
      </div>
    </>
  );
}/* ─── NAV ─────────────────────────────────────────────────────────── */
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
    { label: lang === 'en' ? "Let's Connect" : 'Xiriirka', key: 'connect' },
    ];
  const nav = (k) => { setPage(k); setMenuOpen(false); window.scrollTo(0, 0); };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? t.navBg : 'transparent',
        borderBottom: scrolled ? `1px solid ${t.border}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
        transition: 'all 0.3s', padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div onClick={() => nav('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px' }}>
            <StarLogo size={36} />
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: page === 'home' && !scrolled ? '#F8FAFC' : t.charcoal, fontWeight: '600', lineHeight: '1.1', transition: 'color 0.3s' }}>
                {siteTitle || 'Somalia'} <span style={{ color: '#4FC3F7' }}>2040</span>
              </div>
              <div style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '700' }}>Build. Unite. Lead.</div>
            </div>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              {links.map(l => (
                <span key={l.key} onClick={() => nav(l.key)} style={{
                  color: page === l.key ? '#4FC3F7' : (page === 'home' && !scrolled ? '#CBD5E1' : t.charcoal),
                  fontSize: '13px', fontWeight: page === l.key ? '600' : '400',
                  cursor: 'pointer', transition: 'color 0.2s', position: 'relative', letterSpacing: '0.2px',
                }}
                  onMouseEnter={e => { if (page !== l.key) e.currentTarget.style.color = '#4FC3F7'; }}
                  onMouseLeave={e => { if (page !== l.key) e.currentTarget.style.color = page === 'home' && !scrolled ? '#CBD5E1' : t.charcoal; }}
                >
                  {l.label}
                  {page === l.key && <div style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '2px', background: '#4FC3F7', borderRadius: '1px' }} />}
                </span>
              ))}
              <button onClick={() => setLang(lang === 'en' ? 'so' : 'en')} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '700', letterSpacing: '1px', transition: 'all 0.2s' }}>
                {lang === 'en' ? 'SO' : 'EN'}
              </button>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', lineHeight: 1 }}>
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          )}

          {isMobile && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>{dark ? '☀️' : '🌙'}</button>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '5px', width: '24px' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ height: '2px', background: page === 'home' && !scrolled ? '#F8FAFC' : t.charcoal, borderRadius: '1px', width: i === 1 && menuOpen ? '12px' : '22px', transition: 'all 0.2s' }} />)}
              </button>
            </div>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div className="slide-down" style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 99, background: t.bg, borderTop: `1px solid ${t.border}`, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {links.map(l => (
            <div key={l.key} onClick={() => nav(l.key)} style={{ padding: '18px 0', fontSize: '24px', fontFamily: 'Playfair Display', color: page === l.key ? '#4FC3F7' : t.charcoal, cursor: 'pointer', borderBottom: `1px solid ${t.border}`, letterSpacing: '-0.3px' }}>{l.label}</div>
          ))}
          <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
            <button onClick={() => { setLang(lang === 'en' ? 'so' : 'en'); setMenuOpen(false); }} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '600' }}>
              {lang === 'en' ? 'Somali' : 'English'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── FOOTER ──────────────────────────────────────────────────────── */
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
              {[['Vision', 'vision'], ['Blog', 'blog'], ['About', 'about'], ['My Story', 'story']].map(([label, key]) => (
                <div key={key} onClick={() => setPage(key)} style={{ color: '#475569', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#F8FAFC'} onMouseLeave={e => e.target.style.color = '#475569'}>{label}</div>
              ))}
            </div>
            <div>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px' }}>Community</div>
              {[['Reading List', 'reading'], ["Let's Connect", 'connect']].map(([label, key]) => (
                <div key={key} onClick={() => setPage(key)} style={{ color: '#475569', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#F8FAFC'} onMouseLeave={e => e.target.style.color = '#475569'}>{label}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: '1px', background: '#0F1E30', margin: '0 0 28px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#334155', fontSize: '13px' }}>© 2026 politics.mmohamud.me · Somalia 2040</p>
          <a href="https://mmohamud.me" style={{ color: '#334155', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#4FC3F7'} onMouseLeave={e => e.target.style.color = '#334155'}>mmohamud.me</a>
        </div>
      </div>
    </footer>
  );
};

/* ─── HOME PAGE ───────────────────────────────────────────────────── */
const HomePage = ({ posts, lang, word, setPage, setCurrentPost, voices, dark, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const featured = posts.find(p => p.featured && p.published);
  const recent = posts.filter(p => p.published && !p.featured).slice(0, 3);
  const featuredVoice = voices.find(v => v.featured);

  return (
    <div style={{ paddingTop: '64px' }}>
      {/* HERO - Dark editorial */}
      <div style={{
        background: 'linear-gradient(160deg, #040C16 0%, #08111E 50%, #040C16 100%)',
        minHeight: isMobile ? '80vh' : '90vh',
        display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        padding: isMobile ? '80px 20px 60px' : '80px 24px',
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '15%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(79,195,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(217,119,6,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="fade-in" style={{ maxWidth: isMobile ? '100%' : '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
              <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Somalia 2040</span>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? '38px' : 'clamp(50px, 6vw, 80px)',
              color: '#F8FAFC', fontWeight: '700', lineHeight: '1.06',
              marginBottom: '24px', letterSpacing: '-1.5px',
            }}>
              {lang === 'en'
                ? <><span>Building the </span><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>future</span><br />Somalia deserves.</>
                : <><span>Dhisidda </span><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>mustaqbalka</span><br />Soomaaliya mudan.</>}
            </h1>
            <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '520px', marginBottom: '40px' }}>
              {lang === 'en'
                ? 'A personal space for honest thinking, Somali voices, and the long work of imagining what could be.'
                : 'Meel shakhsi ah oo loogu talagalay fikraddii daacadda ah, codadka Soomaalida.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('vision')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: isMobile ? '13px 26px' : '15px 34px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7DD3F8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#4FC3F7'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >{lang === 'en' ? 'Read the Vision' : 'Akhri Aragtida'}</button>
              <button onClick={() => setPage('blog')} style={{ background: 'transparent', color: '#94A3B8', border: '1.5px solid #1A2D44', padding: isMobile ? '13px 26px' : '15px 34px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.color = '#4FC3F7'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2D44'; e.currentTarget.style.color = '#94A3B8'; }}
              >{lang === 'en' ? 'Browse Blog' : 'Blog-ka'}</button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, #4FC3F7)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4FC3F7' }} />
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '48px 20px' : '72px 24px' }}>

        {/* Featured post */}
        {featured && (
          <AnimatedDiv style={{ marginBottom: isMobile ? '56px' : '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
              <span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Featured</span>
            </div>
            <div onClick={() => setCurrentPost(featured)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.border}`, transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 64px rgba(79,195,247,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ background: featured.thumbnail_url ? 'none' : 'linear-gradient(135deg, #0A0F1A, #0F172A)', minHeight: isMobile ? '200px' : '380px', overflow: 'hidden', position: 'relative' }}>
                {featured.thumbnail_url
                  ? <img src={featured.thumbnail_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: isMobile ? '200px' : '380px' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'Playfair Display', fontSize: '140px', color: '#4FC3F7', opacity: 0.06, lineHeight: 1 }}>"</span></div>
                }
              </div>
              <div style={{ padding: isMobile ? '28px 24px' : '52px 48px', background: t.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Tag T={t} color="#4FC3F7">Featured Essay</Tag>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '22px' : '28px', color: t.charcoal, margin: '18px 0 14px', lineHeight: '1.25', letterSpacing: '-0.3px' }}>
                  {lang === 'en' ? featured.title : (featured.title_so || featured.title)}
                </h2>
                <p style={{ color: t.body || t.mid, fontSize: '15px', lineHeight: '1.75', marginBottom: '28px' }}>
                  {lang === 'en' ? featured.excerpt : (featured.excerpt_so || featured.excerpt)}
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: '600', letterSpacing: '0.2px' }}>Read essay →</span>
                  <span style={{ color: t.mid, fontSize: '12px' }}>{featured.date}</span>
                  {(featured.views || 0) > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{fmt(featured.views)} reads</span>}
                </div>
              </div>
            </div>
          </AnimatedDiv>
        )}

        {/* Recent posts + Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? '48px' : '64px', alignItems: 'start' }}>
          <div>
            <AnimatedDiv>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
                <div style={{ height: '2px', width: '32px', background: t.gold }} />
                <span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Recent Writing</span>
              </div>
            </AnimatedDiv>

            {recent.length === 0 && <p style={{ color: t.mid, fontSize: '15px' }}>No posts yet. Coming soon.</p>}

            {recent.map((post, idx) => (
              <AnimatedDiv key={post.id} delay={idx * 0.08}>
                <div onClick={() => setCurrentPost(post)} style={{ cursor: 'pointer', paddingBottom: '36px', marginBottom: '36px', borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => { const h = e.currentTarget.querySelector('.pt'); if (h) h.style.color = '#4FC3F7'; }}
                  onMouseLeave={e => { const h = e.currentTarget.querySelector('.pt'); if (h) h.style.color = t.charcoal; }}
                >
                  {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} />}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: t.mid, fontSize: '12px' }}>{post.date}</span>
                    <span style={{ color: t.mid, fontSize: '12px' }}>{getRT(post.content)}</span>
                    {(post.views || 0) > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{fmt(post.views)} reads</span>}
                  </div>
                  <h3 className="pt" style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '12px', lineHeight: '1.3', transition: 'color 0.2s', letterSpacing: '-0.3px' }}>
                    {lang === 'en' ? post.title : (post.title_so || post.title)}
                  </h3>
                  <p style={{ color: t.body || t.mid, fontSize: '15px', lineHeight: '1.7', marginBottom: '16px' }}>
                    {lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}
                  </p>
                  <span style={{ color: '#4FC3F7', fontSize: '13px', fontWeight: '600', letterSpacing: '0.2px' }}>Read more →</span>
                </div>
              </AnimatedDiv>
            ))}

            <Btn outline onClick={() => setPage('blog')} T={t} style={{ marginTop: '8px' }}>View all posts</Btn>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {word && (
              <AnimatedDiv>
                <div style={{ background: dark ? '#040C16' : '#0A0F1A', borderRadius: '16px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(79,195,247,0.08), transparent)', pointerEvents: 'none' }} />
                  <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '700' }}>Somali Word of the Week</div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: '30px', color: '#F8FAFC', marginBottom: '6px', fontStyle: 'italic', letterSpacing: '-0.3px' }}>{word.somali}</div>
                  <div style={{ color: '#D97706', fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>{word.english}</div>
                  <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', fontStyle: 'italic' }}>{word.sentence}</p>
                </div>
              </AnimatedDiv>
            )}

            {featuredVoice && (
              <AnimatedDiv delay={0.1}>
                <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '3px', height: '16px', background: t.gold, borderRadius: '2px' }} />
                    <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>Community Voice</span>
                  </div>
                  <p style={{ color: t.charcoal, fontSize: '15px', lineHeight: '1.75', fontStyle: 'italic', marginBottom: '14px' }}>"{featuredVoice.text}"</p>
                  <p style={{ color: t.mid, fontSize: '12px', marginBottom: '18px' }}>{featuredVoice.author} · {featuredVoice.location}</p>
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

/* ─── BLOG PAGE ───────────────────────────────────────────────────── */
const BlogPage = ({ posts, lang, setPage, setCurrentPost, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const published = posts.filter(p => p.published);
  const filtered = search ? published.filter(p => (p.title + ' ' + (p.excerpt || '')).toLowerCase().includes(search.toLowerCase())) : published;

  return (
    <div style={{ paddingTop: '64px' }}>
      {/* Dark header */}
      <div style={{ background: 'linear-gradient(160deg, #040C16 0%, #0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '80px 24px 64px', borderBottom: `1px solid #0F1E30` }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Writing</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '40px' : '60px', color: '#F8FAFC', marginBottom: '16px', lineHeight: '1.05', letterSpacing: '-1.5px' }}>Blog</h1>
          <p style={{ color: '#475569', fontSize: isMobile ? '15px' : '17px', lineHeight: '1.7', maxWidth: '520px' }}>
            {lang === 'en' ? 'Essays, reflections, and perspectives on Somalia, governance, and the diaspora.' : 'Maqaallo, fikrardo, iyo aragtiyaha ku saabsan Soomaaliya.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '36px 20px' : '56px 24px' }}>
        <SearchBar value={search} onChange={setSearch} T={t} />
        {filtered.length === 0 && <p style={{ color: t.mid, textAlign: 'center', padding: '48px 0' }}>{search ? `No results for "${search}"` : 'No posts yet.'}</p>}
        {filtered.map((post, idx2) => (
          <AnimatedDiv key={post.id} delay={idx2 * 0.04}>
            <div onClick={() => setCurrentPost(post)} style={{ cursor: 'pointer', paddingBottom: '40px', marginBottom: '40px', borderBottom: `1px solid ${t.border}` }}
              onMouseEnter={e => { const h = e.currentTarget.querySelector('.bt'); if (h) h.style.color = '#4FC3F7'; }}
              onMouseLeave={e => { const h = e.currentTarget.querySelector('.bt'); if (h) h.style.color = t.charcoal; }}
            >
              {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: isMobile ? '180px' : '240px', objectFit: 'cover', borderRadius: '14px', marginBottom: '24px' }} />}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: t.mid, fontSize: '13px' }}>{post.date}</span>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} />
                <span style={{ color: t.mid, fontSize: '13px' }}>{getRT(post.content)}</span>
                {(post.views || 0) > 0 && <><div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} /><span style={{ color: t.mid, fontSize: '13px' }}>{fmt(post.views)} reads</span></>}
                {post.featured && <Tag T={t} color="#4FC3F7">Featured</Tag>}
              </div>
              <h2 className="bt" style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '26px' : '32px', color: t.charcoal, marginBottom: '14px', lineHeight: '1.2', transition: 'color 0.2s', letterSpacing: '-0.5px' }}>
                {lang === 'en' ? post.title : (post.title_so || post.title)}
              </h2>
              <p style={{ color: t.body || t.mid, fontSize: '15px', lineHeight: '1.75', marginBottom: '16px' }}>
                {lang === 'en' ? post.excerpt : (post.excerpt_so || post.excerpt)}
              </p>
              <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: '600', letterSpacing: '0.2px' }}>Read more →</span>
            </div>
          </AnimatedDiv>
        ))}
        <Newsletter T={t} />
      </div>
    </div>
  );
};

/* ─── VISION PAGE ─────────────────────────────────────────────────── */
const VisionPage = ({ lang, timeline, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg, #040C16 0%, #0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(79,195,247,0.05), transparent)', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>The Vision</span>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : 'clamp(32px, 4vw, 52px)', color: '#F8FAFC', marginBottom: '20px', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
            {lang === 'en' ? 'What I believe Somalia can become.' : 'Waxa aan aaminahay in Soomaaliya noqon karto.'}
          </h1>
          <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto' }}>
            {lang === 'en' ? 'This is a living document. It will grow as my thinking matures. Nothing here is final.' : 'Waa dukumiinti nool. Wuu kordhayaa marka fikradaydu ay bislaato.'}
          </p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '44px 20px' : '68px 24px' }}>
        {[
          { title: lang === 'en' ? 'On Technology & Governance' : 'Teknolojiyada & Xukuumadda', body: lang === 'en' ? "Somalia's path forward runs through digital infrastructure. A government that invests in cybersecurity, digital identity, and transparent e-governance will be a government its people can actually trust. I believe this is not optional. It is the foundation." : "Jidka Soomaaliya wuxuu maraa kaabayaasha dijital. Xukuumad ku maalgalisa ammaanka dijital waxay noqon doontaa mid dadkeeda aaminsan." },
          { title: lang === 'en' ? 'On the Diaspora' : 'Diaspora-da', body: lang === 'en' ? "The millions of Somalis living abroad are not a footnote. They are an untapped engine. My vision includes building real, structural channels through which diaspora talent, capital, and experience flow back into Somalia in organized, impactful ways." : "Malaayin Soomaali ah oo dibadda ku nool kuma aha qoraal kooban. Waa matoor aan la isticmaalin." },
          { title: lang === 'en' ? 'On Unity' : 'Midnimada', body: lang === 'en' ? "Unity does not come from forcing agreement. It comes from building institutions people trust, systems that are fair, and leadership that listens. That is the kind of unity I want to work toward." : "Midnimadu kuma timaado in dadka lagu kalliftey inay is waafaqaan." },
        ].map((item, i) => (
          <AnimatedDiv key={i} delay={i * 0.1} style={{ marginBottom: '52px', paddingBottom: '52px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ width: '2px', background: `linear-gradient(to bottom, #4FC3F7, transparent)`, borderRadius: '2px', flexShrink: 0, marginTop: '6px' }} />
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '28px', color: t.charcoal, marginBottom: '16px', letterSpacing: '-0.3px' }}>{item.title}</h2>
                <p style={{ color: t.body || t.mid, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.9' }}>{item.body}</p>
              </div>
            </div>
          </AnimatedDiv>
        ))}
        <AnimatedDiv>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '32px', color: t.charcoal, marginBottom: '40px', letterSpacing: '-0.3px' }}>The Roadmap to 2040</h2>
        </AnimatedDiv>
        {timeline && timeline.map((phase, i) => (
          <AnimatedDiv key={i} delay={i * 0.07}>
            <div style={{ display: 'flex', gap: isMobile ? '16px' : '28px', marginBottom: '36px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: isMobile ? '80px' : '100px', textAlign: 'right' }}>
                <div style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '700', letterSpacing: '0.3px' }}>{phase.year}</div>
                <div style={{ color: t.mid, fontSize: '11px', marginTop: '2px' }}>{phase.phase}</div>
              </div>
              <div style={{ width: '1px', background: t.border, flexShrink: 0, marginTop: '4px', alignSelf: 'stretch' }} />
              <div>
                {phase.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706', flexShrink: 0, marginTop: '7px' }} />
                    <span style={{ color: t.body || t.mid, fontSize: '14px', lineHeight: '1.6' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedDiv>
        ))}
        <Newsletter T={t} />
      </div>
    </div>
  );
};
