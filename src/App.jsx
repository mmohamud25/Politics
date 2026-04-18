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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'DM Sans', sans-serif; background: ${dark ? '#0F172A' : '#FFFFFF'}; transition: background 0.3s; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${dark ? '#1E293B' : '#F8FAFB'}; }
    ::-webkit-scrollbar-thumb { background: #4FC3F7; border-radius: 2px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .fade-in { animation: fadeIn 0.3s ease forwards; }
    .slide-down { animation: slideDown 0.25s ease forwards; }
    [contenteditable] blockquote { border-left: 3px solid #4FC3F7; padding-left: 12px; margin: 8px 0; color: #6B7280; font-style: italic; }
    [contenteditable] h1 { font-family: 'Playfair Display', serif; font-size: 28px; margin: 8px 0; }
    [contenteditable] h2 { font-family: 'Playfair Display', serif; font-size: 22px; margin: 8px 0; }
    [contenteditable] h3 { font-family: 'Playfair Display', serif; font-size: 18px; margin: 8px 0; }
    [contenteditable] ul { padding-left: 20px; margin: 6px 0; }
    [contenteditable] ol { padding-left: 20px; margin: 6px 0; }
    [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
    [contenteditable] a { color: #4FC3F7; }
    .post-content blockquote { border-left: 3px solid #4FC3F7; padding-left: 16px; margin: 16px 0; color: #6B7280; font-style: italic; }
    .post-content h1 { font-family: 'Playfair Display', serif; font-size: 28px; margin: 24px 0 12px; }
    .post-content h2 { font-family: 'Playfair Display', serif; font-size: 22px; margin: 20px 0 10px; }
    .post-content h3 { font-family: 'Playfair Display', serif; font-size: 18px; margin: 16px 0 8px; }
    .post-content ul { padding-left: 24px; margin: 12px 0; }
    .post-content ol { padding-left: 24px; margin: 12px 0; }
    .post-content li { margin-bottom: 6px; line-height: 1.7; }
    .post-content img { max-width: 100%; border-radius: 10px; margin: 16px 0; }
    .post-content a { color: #4FC3F7; }
    .post-content p { margin-bottom: 18px; }
  `}</style>
);

const getT = (dark) => ({
  bg: dark ? '#0F172A' : '#FFFFFF',
  soft: dark ? '#1E293B' : '#F8FAFB',
  card: dark ? '#1E293B' : '#FFFFFF',
  charcoal: dark ? '#F1F5F9' : '#1A1A2E',
  mid: dark ? '#94A3B8' : '#6B7280',
  border: dark ? '#334155' : '#E5E7EB',
  lightBlue: dark ? '#0C2D48' : '#E0F7FF',
  blue: '#4FC3F7',
  blueDark: dark ? '#7DD3F8' : '#0288D1',
  gold: '#D97706',
  navBg: dark ? '#0F172A' : '#FFFFFF',
  footBg: dark ? '#020617' : '#1A1A2E',
  inputBg: dark ? '#0F172A' : '#FFFFFF',
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

const getReadingTime = (content) => {
  if (!content) return '1 min read';
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
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
    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '28px 16px' : '48px 24px' }}>
      <Tag T={t}>About</Tag>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '30px' : '38px', color: t.charcoal, margin: '12px 0 32px' }}>{lang === 'en' ? 'My Story' : 'Taariikhda'}</h1>
      {[
        { heading: lang === 'en' ? 'Where I come from' : 'Xagga aan ka yimid', text: lang === 'en' ? "I am Somali, raised in the diaspora, rooted in Columbus, Ohio. My background spans cybersecurity, IT, and community building. I hold degrees in Computer Science and Business, and I am currently completing an MS in Cybersecurity at Western Governors University." : "Waxaan ahay Soomaali, ku koray diaspora, xidid ku leh Columbus, Ohio." },
        { heading: lang === 'en' ? 'Why politics' : 'Sababta siyaasadda', text: lang === 'en' ? "It started as a feeling. Not a plan, not a calculation. A quiet but persistent sense that Somalia's future matters, and that people who understand technology, governance, and community have something real to offer." : "Waxay bilaabatay dareen. Maaha qorshe, maahan xisaab." },
        { heading: lang === 'en' ? 'What I am building' : 'Waxa aan dhisayo', text: lang === 'en' ? "Through Kulan Group, I am building platforms that serve education, cybersecurity, and community for the Somali diaspora. These projects are not separate from the political vision. They are part of it." : "Iyada oo loo marayo Kulan Group, waxaan dhisayaa barnaamijyo u adeega waxbarashada." },
      ].map((s, i) => (
        <AnimatedDiv key={i} delay={i * 0.1} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '22px', color: t.charcoal, marginBottom: '10px' }}>{s.heading}</h2>
          <p style={{ color: t.mid, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.9' }}>{s.text}</p>
        </AnimatedDiv>
      ))}
      <Newsletter T={t} />
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
    { key: 'dash', label: 'Dashboard' }, { key: 'posts', label: 'Blog Posts' },
    { key: 'media', label: 'Media Library' }, { key: 'comments', label: 'Comments' }, { key: 'community', label: 'Community' },
    { key: 'word', label: 'Word of Week' }, { key: 'reading', label: 'Reading List' },
    { key: 'timeline', label: 'Timeline' }, { key: 'settings', label: 'Settings' },
  ];
  const Sidebar = () => (
    <div style={{ width: isMobile ? '100%' : '210px', background: '#0F172A', padding: '20px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 18px 18px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: '15px', color: '#FFF' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span></div>
        <div style={{ color: '#6B7280', fontSize: '10px', marginTop: '2px' }}>Admin Panel</div>
      </div>
      <div style={{ flex: 1, padding: '10px 0' }}>
        {tabs.map(tb => (
          <div key={tb.key} onClick={() => { setTab(tb.key); setSideOpen(false); }}
            style={{ padding: '10px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: tab === tb.key ? '#4FC3F7' : '#9CA3AF', background: tab === tb.key ? 'rgba(79,195,247,0.08)' : 'transparent', borderLeft: tab === tb.key ? '3px solid #4FC3F7' : '3px solid transparent', transition: 'all 0.15s' }}>
            {tb.label}
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div onClick={onLogout} style={{ color: '#6B7280', fontSize: '12px', cursor: 'pointer' }}
          onMouseEnter={e => e.target.style.color = '#EF4444'} onMouseLeave={e => e.target.style.color = '#6B7280'}>
          Logout
        </div>
      </div>
    </div>
  );

  if (isMobile) return (
    <div style={{ background: t.soft, minHeight: '100vh' }}>
      <div style={{ background: '#0F172A', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: '15px', color: '#FFF' }}>Somalia <span style={{ color: '#4FC3F7' }}>2040</span> <span style={{ color: '#6B7280', fontSize: '11px' }}>Admin</span></div>
        <button onClick={() => setSideOpen(!sideOpen)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '20px', cursor: 'pointer' }}>☰</button>
      </div>
      {sideOpen && <Sidebar />}
      <div style={{ padding: '20px 16px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.soft }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>{children}</div>
    </div>
  );
};

const AdminDash = ({ posts, voices, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const stats = [
    { label: 'Published', value: posts.filter(p => p.published).length, color: '#4FC3F7' },
    { label: 'Drafts', value: posts.filter(p => !p.published).length, color: t.gold },
    { label: 'Pending', value: posts.flatMap(p => p.somalia_comments || []).filter(c => !c.approved).length, color: '#EF4444' },
    { label: 'Voices', value: voices.length, color: '#10B981' },
  ];
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '24px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: t.card, borderRadius: '10px', padding: '18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display' }}>{s.value}</div>
            <div style={{ color: t.mid, fontSize: '12px', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: t.card, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ color: t.mid, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Post Views</div>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#4FC3F7', fontFamily: 'Playfair Display' }}>{totalViews.toLocaleString()}</div>
      </div>
      <div style={{ background: t.card, borderRadius: '10px', padding: '22px' }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal, marginBottom: '14px' }}>Recent Posts</h3>
        {posts.slice(0, 6).map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}`, alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{p.title}</span>
              <span style={{ color: t.mid, fontSize: '11px', display: 'block' }}>{p.date} · {p.views || 0} views · {getReadingTime(p.content)}</span>
            </div>
            <span style={{ background: p.published ? t.lightBlue : '#FEF3C7', color: p.published ? t.blueDark : '#92400E', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>{p.published ? 'Published' : 'Draft'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPosts = ({ posts, onSave, onDelete, onToggle, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', title_so: '', excerpt: '', excerpt_so: '', content: '', content_so: '', thumbnail_url: '', published: false, featured: false });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('en');

  const openEdit = (post) => { setEditing(post.id); setForm({ title: post.title || '', title_so: post.title_so || '', excerpt: post.excerpt || '', excerpt_so: post.excerpt_so || '', content: post.content || '', content_so: post.content_so || '', thumbnail_url: post.thumbnail_url || '', published: post.published, featured: post.featured }); };
  const openNew = () => { setEditing('new'); setForm({ title: '', title_so: '', excerpt: '', excerpt_so: '', content: '', content_so: '', thumbnail_url: '', published: false, featured: false }); };
  const save = async () => {
    setSaving(true);
    const payload = editing === 'new' ? { ...form, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) } : { id: editing, ...form };
    await onSave(payload);
    setSaving(false); setEditing(null);
  };

  const iStyle = { width: '100%', padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', marginBottom: '10px', outline: 'none', background: t.inputBg, color: t.charcoal };

  if (editing !== null) return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal }}>{editing === 'new' ? 'New Post' : 'Edit Post'}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn outline small onClick={() => setEditing(null)} T={t}>Cancel</Btn>
          <Btn small onClick={save} T={t}>{saving ? 'Saving...' : 'Save Post'}</Btn>
        </div>
      </div>
      <div style={{ background: t.card, borderRadius: '12px', padding: isMobile ? '16px' : '24px' }}>
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: `1px solid ${t.border}` }}>
          {[['en','English'],['so','Somali']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: activeTab === key ? '2px solid #4FC3F7' : '2px solid transparent', color: activeTab === key ? '#4FC3F7' : t.mid, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: '500', marginBottom: '-1px' }}>{label}</button>
          ))}
        </div>
        {activeTab === 'en' ? (
          <>
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Title</label>
            <input style={iStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Post title" />
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Excerpt</label>
            <textarea style={{ ...iStyle, resize: 'vertical' }} rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description..." />
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '6px' }}>Content</label>
            <RichTextEditor value={form.content} onChange={v => setForm({ ...form, content: v })} T={t} />
          </>
        ) : (
          <>
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Cinwaanka (Title)</label>
            <input style={iStyle} value={form.title_so} onChange={e => setForm({ ...form, title_so: e.target.value })} placeholder="Cinwaanka Soomaali" />
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Soo-koob (Excerpt)</label>
            <textarea style={{ ...iStyle, resize: 'vertical' }} rows={2} value={form.excerpt_so} onChange={e => setForm({ ...form, excerpt_so: e.target.value })} placeholder="Soo-koob gaaban..." />
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '6px' }}>Waxa Buuxa (Content)</label>
            <RichTextEditor value={form.content_so} onChange={v => setForm({ ...form, content_so: v })} T={t} />
          </>
        )}
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '3px' }}>Thumbnail Image URL</label>
        <input style={iStyle} value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://example.com/image.jpg" />
        {form.thumbnail_url && <img src={form.thumbnail_url} alt="thumbnail preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} onError={e => e.target.style.display = 'none'} />}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '8px' }}>
          {[['published','Published'],['featured','Featured on Homepage']].map(([f, l]) => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '13px', color: t.charcoal }}>
              <input type="checkbox" checked={form[f]} onChange={e => setForm({ ...form, [f]: e.target.checked })} />{l}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal }}>Blog Posts</h1>
        <Btn small onClick={openNew} T={t}>+ New Post</Btn>
      </div>
      <div style={{ background: t.card, borderRadius: '12px', overflow: 'hidden' }}>
        {posts.length === 0 && <p style={{ padding: '24px', color: t.mid }}>No posts yet. Create your first one.</p>}
        {posts.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < posts.length - 1 ? `1px solid ${t.border}` : 'none', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: '120px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              {p.thumbnail_url && <img src={p.thumbnail_url} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
              <div>
                <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{p.title}</span>
                <span style={{ color: t.mid, fontSize: '11px', display: 'block' }}>{p.date} · {p.views || 0} views{p.featured ? ' · Featured' : ''}</span>
              </div>
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
  const [title, setTitle] = useState(siteTitle || 'Somalia');
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '22px' }}>Settings</h1>
      <div style={{ background: t.card, borderRadius: '10px', padding: '22px', maxWidth: '460px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px' }}>Site Title</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1, padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none' }} />
            <Btn small onClick={() => onUpdateTitle(title)} T={t}>Save</Btn>
          </div>
          <p style={{ color: t.mid, fontSize: '11px', marginTop: '4px' }}>Shown as "{title} 2040" across the site.</p>
        </div>
        {[['Site URL','politics.mmohamud.me'],['Admin Email',ADMIN_EMAIL]].map(([l, v]) => (
          <div key={l} style={{ marginBottom: '14px' }}>
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px' }}>{l}</label>
            <input defaultValue={v} readOnly style={{ width: '100%', padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '13px', background: t.soft, color: t.mid, outline: 'none' }} />
          </div>
        ))}
        <div style={{ height: '1px', background: t.border, margin: '16px 0' }} />
        <div onClick={() => setPage('home')} style={{ color: '#4FC3F7', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>View Public Site →</div>
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

  const T = getT(dark);

  const nav = useCallback((p) => {
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
    const [p, v, r, w, q, tl, st, wa] = await Promise.all([
      getPosts(), getVoices(), getReading(),
      getSetting('word_of_week'), getSetting('monthly_question'), getSetting('timeline'),
      getSetting('site_title'), getWordArchive(),
    ]);
    setPosts(p); setVoices(v); setReading(r);
    if (w) setWord(w);
    if (q) setMonthlyQ(q);
    if (tl) setTimeline(tl);
    if (st) setSiteTitle(typeof st === 'string' ? st : 'Somalia');
    setWordArchive(wa);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

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
          {adminTab === 'dash'      && <AdminDash posts={posts} voices={voices} T={T} />}
          {adminTab === 'posts'     && <AdminPosts posts={posts} onSave={handleSavePost} onDelete={handleDeletePost} onToggle={handleTogglePost} T={T} />}
          {adminTab === 'media'     && <AdminMedia T={T} />}
          {adminTab === 'comments'  && <AdminComments posts={posts} onApprove={handleApproveComment} onDelete={handleDeleteComment} T={T} />}
          {adminTab === 'community' && <AdminCommunity voices={voices} onToggleFeatured={handleToggleVoice} onDelete={handleDeleteVoice} monthlyQ={monthlyQ} onUpdateQ={handleUpdateQ} T={T} />}
          {adminTab === 'word'      && <AdminWord word={word} wordArchive={wordArchive} onUpdate={handleUpdateWord} onAddToArchive={handleAddToArchive} onSetActive={handleSetActive} T={T} />}
          {adminTab === 'reading'   && <AdminReading reading={reading} onAdd={handleAddBook} onDelete={handleDeleteBook} T={T} />}
          {adminTab === 'timeline'  && <AdminTimeline timeline={timeline} onUpdate={handleUpdateTimeline} T={T} />}
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
        <div onClick={() => nav('admin')} style={{ position: 'fixed', bottom: '20px', right: '20px', background: T.charcoal === '#F1F5F9' ? '#1E293B' : '#1A1A2E', color: '#FFF', padding: '8px 14px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', fontWeight: '500', zIndex: 50 }}>Admin →</div>
        <BackToTop T={T} />
      </div>
    </>
  );
}
