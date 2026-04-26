import { useState, useEffect, useRef, useCallback } from "react";
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
  signUp, signIn, signOut, getSession, getProfile, updateProfile,
  savePostForUser, unsavePostForUser, getUserSavedPosts, checkPostSaved,
  likeVoice, isVoiceLiked,
} from "./supabase.js";

/* ─── GLOBAL STYLES ────────────────────────────────── */
const MetaTags = ({ page, post, siteTitle }) => {
  useEffect(() => {
    const t = post
      ? `${post.title} · ${siteTitle} 2040`
      : { vision: `Vision · ${siteTitle} 2040`, blog: `Blog · ${siteTitle} 2040`, story: `My Story · ${siteTitle} 2040`, connect: `Let's Connect · ${siteTitle} 2040`, reading: `Reading List · ${siteTitle} 2040`, about: `About · ${siteTitle} 2040` }[page] || `${siteTitle} 2040 · Build. Unite. Lead.`;
    const d = post
      ? (post.excerpt || `An essay on ${siteTitle} 2040.`)
      : `${siteTitle} 2040 — Build. Unite. Lead. Honest thinking about Somalia's future.`;
    const img = post?.thumbnail_url || 'https://politics.mmohamud.me/og.png';
    const url = `https://politics.mmohamud.me${page && page !== 'home' ? '/' + page : ''}`;
    document.title = t;
    const s = (name, val, prop) => {
      const a = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${a}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(a, name); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    s('description', d); s('og:title', t, 1); s('og:description', d, 1);
    s('og:type', post ? 'article' : 'website', 1); s('og:url', url, 1); s('og:image', img, 1);
    s('og:site_name', `${siteTitle} 2040`, 1); s('twitter:card', 'summary_large_image');
    s('twitter:title', t); s('twitter:description', d); s('twitter:image', img);
    // Canonical URL
    let cl = document.querySelector('link[rel="canonical"]');
    if (!cl) { cl = document.createElement('link'); cl.rel = 'canonical'; document.head.appendChild(cl); }
    cl.href = url;
  }, [page, post, siteTitle]);
  return null;
};

const GlobalStyles = ({ dark }) => {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; overflow-x: hidden; }
    body { overflow-x: hidden; max-width: 100vw; }
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
    [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0;
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } } }
  `;
  useEffect(() => {
    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement('link');
      link.rel = 'icon'; link.type = 'image/svg+xml';
      link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='9' fill='%234FC3F7'/%3E%3Cpolygon points='20,7 23.1,16.6 33,16.6 25.4,22.2 28.5,31.8 20,26.2 11.5,31.8 14.6,22.2 7,16.6 16.9,16.6' fill='white'/%3E%3C/svg%3E";
      document.head.appendChild(link);
    }
  }, []);
  return <style>{css}</style>;
};

/* ─── THEME ───────────────────────────────────── */
const getT = (dark) => ({
  bg: dark ? '#08111E' : '#FAFAF8', soft: dark ? '#0F1E30' : '#F4F4F0',
  card: dark ? '#0F1E30' : '#FFFFFF', border: dark ? '#1A2D44' : '#E8E8E4',
  charcoal: dark ? '#F1F5F9' : '#0F172A', body: dark ? '#CBD5E1' : '#1F2937',
  mid: dark ? '#64748B' : '#6B7280', blue: '#4FC3F7',
  blueDark: dark ? '#7DD3F8' : '#0284C7', gold: '#D97706',
  navBg: dark ? 'rgba(8,17,30,0.97)' : 'rgba(248,250,252,0.98)',
  footBg: dark ? '#040C16' : '#0A0F1A', inputBg: dark ? '#08111E' : '#FFFFFF',
  lightBlue: dark ? '#0C2D48' : '#EFF9FF', dark,
});

const C = { ...getT(false), white: '#FFFFFF' };

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
  return <div ref={ref} style={{ opacity: v ? 1 : 0.15, transform: v ? 'none' : 'translateY(8px)', transition: `opacity 0.3s ease ${delay}s, transform 0.3s ease ${delay}s`, ...style }}>{children}</div>;
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
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="Hiigsiga 2040 star logo">
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
  const t = T || getT(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : 'https://politics.mmohamud.me';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || 'Hiigsiga 2040');

  const copy = () => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const btns = [
    { label: copied ? '✓ Copied' : '🔗 Copy link', action: copy, color: copied ? '#10B981' : t.mid },
    { label: '𝕏 Share', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, color: '#000' },
    { label: '💬 WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, color: '#25D366' },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '20px 0' }}>
      {btns.map(b => b.href ? (
        <a key={b.label} href={b.href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', fontWeight: '500', color: b.color, textDecoration: 'none', background: t.soft, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
        >{b.label}</a>
      ) : (
        <button key={b.label} onClick={b.action} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', fontWeight: '500', color: b.color, background: t.soft, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
        >{b.label}</button>
      ))}
    </div>
  );
};

const Newsletter = ({ T, compact }) => {
  const t = T || getT(false); const [email, setEmail] = useState(''); const [status, setStatus] = useState('idle');
  const submit = async () => { if (!email || !email.includes('@')) return; setStatus('loading'); try { await fetch('https://formspree.io/f/xeepavdd', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ email, _subject: 'Hiigsiga 2040 Newsletter' }) }); setStatus('success'); } catch { setStatus('error'); } };
  if (compact) return (
    <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Newsletter</div>
      <p style={{ color: t.body, fontSize: '13px', marginBottom: '12px', lineHeight: '1.6' }}>Hiigsiga 2040 updates to your inbox.</p>
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
      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: '#FFF', marginBottom: '8px' }}>Join the Hiigsiga 2040 newsletter</h3>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', lineHeight: '1.7' }}>Essays, updates, and ideas. No noise, just signal.</p>
      {status === 'success' ? <p style={{ color: '#34D399', fontSize: '15px', fontWeight: '500' }}>You are in. Thank you.</p> : (
        <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="your@email.com" type="email" style={{ flex: 1, padding: '11px 14px', border: '1px solid #1A2D44', borderRadius: '6px', fontSize: '14px', background: '#08111E', color: '#F1F5F9', outline: 'none', minWidth: '180px' }} />
          <button onClick={submit} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: '11px 22px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{status === 'loading' ? 'Joining...' : 'Subscribe'}</button>
          <p style={{ color: t.mid, fontSize: '11px', marginTop: '10px', lineHeight: '1.5' }}>No spam. Occasional essays only. Unsubscribe anytime.</p>
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
      {value && <button onClick={() => onChange('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.mid, fontSize: '18px', lineHeight: 1 }}>×</button>}
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
const Nav = ({ page, setPage, lang, setLang, dark, setDark, T, siteTitle, user, userProfile, onShowAuth, onSignOut }) => {
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
    { label: lang === 'en' ? 'About' : 'Kuhusus', key: 'about' },
    { label: lang === 'en' ? 'My Story' : 'Taariikhda', key: 'story' },
    { label: lang === 'en' ? "Let\'s Connect" : 'Xiriirka', key: 'connect' },
  ];
  const go = (k) => { setPage(k); setMenuOpen(false); window.scrollTo(0, 0); };
  const onHero = page === 'home' && !scrolled;
  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: onHero ? 'transparent' : t.navBg, borderBottom: onHero ? '1px solid transparent' : `1px solid ${t.border}`, backdropFilter: onHero ? 'none' : 'blur(16px)', WebkitBackdropFilter: onHero ? 'none' : 'blur(16px)', backdropFilter: !onHero && scrolled ? 'blur(14px)' : 'none', WebkitBackdropFilter: !onHero && scrolled ? 'blur(14px)' : 'none', transition: 'all 0.3s', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div onClick={() => go('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', flexShrink: 0, minWidth: 0 }}>
            <StarLogo size={36} />
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: onHero ? '#F8FAFC' : t.charcoal, fontWeight: '600', lineHeight: '1.1', transition: 'color 0.3s' }}>{siteTitle || 'Hiigsiga'}<span style={{ color: '#4FC3F7' }}> 2040</span></div>
              <div style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '700' }}>Build. Unite. Lead.</div>
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
              {links.map(l => (
                <span key={l.key} onClick={() => go(l.key)} style={{ color: page === l.key ? '#4FC3F7' : onHero ? '#CBD5E1' : t.dark ? '#E2E8F0' : '#1E293B', fontSize: '13px', fontWeight: page === l.key ? '700' : '500', cursor: 'pointer', transition: 'color 0.2s', position: 'relative' }}
                  onMouseEnter={e => { if (page !== l.key) e.currentTarget.style.color = '#4FC3F7'; }}
                  onMouseLeave={e => { if (page !== l.key) e.currentTarget.style.color = onHero ? '#CBD5E1' : t.charcoal; }}
                >
                  {l.label}
                  {page === l.key && <div style={{ position: 'absolute', bottom: '-6px', left: 0, right: 0, height: '3px', background: '#4FC3F7', borderRadius: '2px', boxShadow: '0 0 10px rgba(79,195,247,0.7)' }} />}
                </span>
              ))}
              <button onClick={() => setLang(lang === 'en' ? 'so' : 'en')} title={lang === 'en' ? 'Switch to Somali' : 'Switch to English'} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '700', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {lang === 'en' ? <><span>🇸🇴</span><span>SO</span></> : <><span>🇺🇸</span><span>EN</span></>}
              </button>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>{dark ? '☀' : '☾'}</button>
              {user ? (
                <UserMenu user={user} profile={userProfile} onSignOut={onSignOut} onViewProfile={() => go('profile')} T={T} />
              ) : (
                <button onClick={onShowAuth} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '600', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Reader Login</button>
              )}
            </div>
          )}
          {isMobile && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>{dark ? '☀' : '☾'}</button>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', width: '24px', padding: '4px' }}>
                {[0,1,2].map(i => <div key={i} style={{ height: '2px', background: onHero ? '#F8FAFC' : t.dark ? '#E2E8F0' : '#1E293B', borderRadius: '1px', width: i===1&&menuOpen?'12px':'22px', transition: 'all 0.2s' }} />)}
              </button>
            </div>
          )}
        </div>
      </nav>
      {isMobile && menuOpen && (
        <div className="slide-down" style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 99, background: t.bg, borderTop: `1px solid ${t.border}`, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {links.map(l => (<div key={l.key} onClick={() => go(l.key)} style={{ padding: '18px 0', fontSize: '24px', fontFamily: 'Playfair Display', color: page === l.key ? '#4FC3F7' : t.charcoal, cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>{l.label}</div>))}
          <div style={{ marginTop: '28px' }}>
            <button onClick={() => { setLang(lang === 'en' ? 'so' : 'en'); setMenuOpen(false); }} style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', color: '#4FC3F7', fontWeight: '600' }}>{lang === 'en' ? '🇸🇴 Somali' : '🇺🇸 English'}</button>
          </div>
        </div>
      )}
    </>
  );
};

const FooterNewsletter = () => {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const submit = async () => {
    if (!email || !email.includes('@')) return;
    try { await fetch('https://formspree.io/f/xeepavdd', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ email, _subject: 'Hiigsiga 2040 Newsletter' }) }); setDone(true); } catch {}
  };
  if (done) return <p style={{ color: '#34D399', fontSize: '13px', fontWeight: '500' }}>✓ You are in.</p>;
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="your@email.com" style={{ flex: 1, padding: '8px 10px', border: '1px solid #1A2D44', borderRadius: '6px', fontSize: '12px', background: '#08111E', color: '#F1F5F9', outline: 'none', minWidth: 0 }} />
      <button onClick={submit} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>Join</button>
    </div>
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
                <div style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: '#F8FAFC', lineHeight: '1.1' }}>{siteTitle || 'Hiigsiga'}<span style={{ color: '#4FC3F7' }}> 2040</span></div>
                <div style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#4FC3F7', textTransform: 'uppercase', fontWeight: '700' }}>Build. Unite. Lead.</div>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.8' }}>A space for honest thinking, Somali voices, and the long game toward a better future.</p>
          </div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px' }}>Pages</div>
              {[['Vision','vision'],['Blog','blog'],['About','about'],['My Story','story'],['Reading List','reading'],["Let's Connect",'connect']].map(([label,key]) => (
                <div key={key} onClick={() => setPage(key)} style={{ color: '#475569', fontSize: '14px', cursor: 'pointer', marginBottom: '10px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#F8FAFC'} onMouseLeave={e => e.target.style.color='#475569'}>{label}</div>
              ))}
            </div>
            <div style={{ maxWidth: '220px' }}>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '16px' }}>Newsletter</div>
              <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', marginBottom: '14px' }}>Essays and updates on Somalia to your inbox.</p>
              <FooterNewsletter />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          {[['LinkedIn','https://linkedin.com/in/mohamudmohamed'],['Twitter / X','https://twitter.com/mmohamud25'],['Email','mailto:mohamedmohammud@gmail.com']].map(([name,href]) => (
            <a key={name} href={href} target='_blank' rel='noreferrer' style={{ padding: '7px 14px', borderRadius: '8px', background: '#0F1E30', border: '1px solid #1A2D44', color: '#475569', fontSize: '12px', textDecoration: 'none', fontWeight: '500', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor='#4FC3F7'; e.currentTarget.style.color='#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor='#1A2D44'; e.currentTarget.style.color='#475569'; }}>{name}</a>
          ))}
        </div>
        <div style={{ height: '1px', background: '#0F1E30', margin: '0 0 28px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#334155', fontSize: '13px' }}>© 2026 politics.mmohamud.me · Hiigsiga 2040</p>
          <a href="https://mmohamud.me" style={{ color: '#334155', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#4FC3F7'} onMouseLeave={e => e.target.style.color='#334155'}>mmohamud.me</a>
        </div>
      </div>
    </footer>
  );
};


const HomePage = ({ posts, lang, word, wordArchive, setPage, setCurrentPost, voices, dark, T }) => {
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
        {!isMobile && (
          <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, pointerEvents: 'none', userSelect: 'none' }}>
            <svg width="420" height="420" viewBox="0 0 420 420" fill="none">
              <circle cx="210" cy="210" r="200" stroke="#4FC3F7" strokeWidth="1" strokeDasharray="6 4" />
              <circle cx="210" cy="210" r="150" stroke="#4FC3F7" strokeWidth="0.5" strokeDasharray="4 6" />
              <circle cx="210" cy="210" r="100" stroke="#4FC3F7" strokeWidth="0.5" />
              <polygon points="210,60 223,100 265,100 232,124 244,165 210,142 176,165 188,124 155,100 197,100" fill="#4FC3F7" />
              {[0,45,90,135,180,225,270,315].map((deg, i) => (
                <circle key={i} cx={210 + 200 * Math.cos(deg * Math.PI / 180)} cy={210 + 200 * Math.sin(deg * Math.PI / 180)} r="3" fill="#4FC3F7" />
              ))}
            </svg>
          </div>
        )}
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="fade-in" style={{ maxWidth: isMobile ? '100%' : '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
              <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Hiigsiga 2040</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '38px' : 'clamp(50px,6vw,78px)', color: '#F8FAFC', fontWeight: '700', lineHeight: '1.06', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              {lang === 'en' ? <><span>Building the </span><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>future </span><br />Somalia deserves.</> : <><span>Dhisidda </span><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>mustaqbalka</span><br />Soomaaliya mudan.</>}
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
        <div onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite', cursor: 'pointer' }}>
          <span style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px', opacity: 0.7 }}>Scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom,rgba(79,195,247,0.3),#4FC3F7)' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4FC3F7', boxShadow: '0 0 8px #4FC3F7' }} />
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '48px 20px' : '72px 24px' }}>
        {featured && (
          <AnimatedDiv style={{ marginBottom: isMobile ? '56px' : '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} /><span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Featured</span></div>
            <div onClick={() => setCurrentPost(featured)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.border}`, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 24px 64px rgba(79,195,247,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ background: 'linear-gradient(135deg,#040C16,#0B1829)', minHeight: isMobile ? '220px' : '380px', overflow: 'hidden', position: 'relative' }}>
                {featured.thumbnail_url
                  ? <img src={featured.thumbnail_url} alt={featured.title || 'Featured essay'} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} onError={e => e.target.style.display='none'} />
                  : null}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'Playfair Display', fontSize: '120px', color: '#4FC3F7', opacity: 0.08, lineHeight: 1 }}>"</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '1px', background: 'rgba(79,195,247,0.3)' }} />
                    <span style={{ color: 'rgba(79,195,247,0.5)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Featured Essay</span>
                    <div style={{ width: '32px', height: '1px', background: 'rgba(79,195,247,0.3)' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: isMobile ? '28px 24px' : '52px 48px', background: t.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? '22px' : '28px', color: t.charcoal, margin: '18px 0 14px', lineHeight: '1.25' }}>{lang === 'en' ? featured.title : (featured.title_so || featured.title)}</h2>
                <p style={{ color: t.body, fontSize: '15px', lineHeight: '1.75', marginBottom: '28px' }}>{lang === 'en' ? featured.excerpt : (featured.excerpt_so || featured.excerpt)}</p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: '#4FC3F7', fontSize: '14px', fontWeight: '600' }}>Read essay →</span>
                  <span style={{ color: t.mid, fontSize: '12px' }}>{featured.date}</span>
                  {(featured.views||0) > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{fmt(featured.views)} {featured.views === 1 ? 'read' : 'reads'}</span>}
                </div>
              </div>
            </div>
          </AnimatedDiv>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? '48px' : '64px', alignItems: 'start' }}>
          <div>
            <AnimatedDiv><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}><div style={{ height: '2px', width: '32px', background: t.gold }} /><span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Recent Writing</span></div></AnimatedDiv>
            {recent.length === 0 && <p style={{ color: t.mid, fontSize: '15px', fontStyle: 'italic' }}>More essays coming soon.</p>}
            {recent.map((post, idx) => (
              <AnimatedDiv key={post.id} delay={idx * 0.08}>
                <div onClick={() => setCurrentPost(post)} style={{ cursor: 'pointer', paddingBottom: '36px', marginBottom: '36px', borderBottom: `1px solid ${t.border}` }} onMouseEnter={e => { const h = e.currentTarget.querySelector('.pt'); if(h) h.style.color='#4FC3F7'; }} onMouseLeave={e => { const h = e.currentTarget.querySelector('.pt'); if(h) h.style.color=t.charcoal; }}>
                  {post.thumbnail_url && <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} />}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: t.mid, fontSize: '12px' }}>{post.date}</span>
                    <span style={{ color: t.mid, fontSize: '12px' }}>{getRT(post.content)}</span>
                    {(post.views||0) > 0 && <span style={{ color: t.mid, fontSize: '12px' }}>{fmt(post.views)} {post.views === 1 ? 'read' : 'reads'}</span>}
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
                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {word.date && <span style={{ color: '#334155', fontSize: '11px', letterSpacing: '0.5px' }}>Updated {word.date}</span>}
                  </div>
                  {wordArchive && wordArchive.length > 1 && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #0F1E30' }}>
                      <div style={{ color: '#334155', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Previous words</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {wordArchive.slice(1, 4).map((w, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                            <span style={{ color: '#4FC3F7', fontSize: '13px', fontStyle: 'italic', fontFamily: 'Playfair Display' }}>{w.somali}</span>
                            <span style={{ color: '#334155', fontSize: '11px' }}>{w.english}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                {(post.views||0)>0 && <><div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} /><span style={{ color: t.mid, fontSize: '13px' }}>{fmt(post.views)} {post.views === 1 ? 'read' : 'reads'}</span></>}
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

const VisionPage = ({ lang, timeline, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(79,195,247,0.05),transparent)', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>The Vision</span>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : 'clamp(32px,4vw,52px)', color: '#F8FAFC', marginBottom: '20px', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
            {lang === 'en' ? 'What I believe Somalia can become.' : 'Waxa aan aaminahay in Soomaaliya noqon karto.'}
          </h1>
          <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto' }}>
            {lang === 'en' ? 'This is a living document. It will grow as my thinking matures. Nothing here is final.' : 'Waa dukumiinti nool. Wuu kordhayaa marka fikradaydu ay bislaato.'}
          </p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '44px 20px' : '68px 24px' }}>
        {/* Table of Contents */}
        <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '40px' }}>
          <div style={{ color: t.mid, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '12px' }}>In this document</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[lang === 'en' ? 'On Technology & Governance' : 'Teknolojiyada', lang === 'en' ? 'On the Diaspora' : 'Diaspora-da', lang === 'en' ? 'On Unity' : 'Midnimada', lang === 'en' ? 'The Roadmap to 2040' : 'Qorshaha 2040'].map((section, i) => (
              <a key={i} href={"#vision-" + i} style={{ color: '#4FC3F7', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => e.currentTarget.style.opacity='0.7'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                <span style={{ color: t.mid, fontSize: '12px', minWidth: '24px' }}>0{i + 1}</span>
                {section}
              </a>
            ))}
          </div>
        </div>


        {[
          { title: lang === 'en' ? 'On Technology & Governance' : 'Teknolojiyada & Xukuumadda', body: lang === 'en' ? "Somalia\'s path forward runs through digital infrastructure. A government that invests in cybersecurity, digital identity, and transparent e-governance will be a government its people can actually trust." : "Jidka Soomaaliya wuxuu maraa kaabayaasha dijital." },
          { title: lang === 'en' ? 'On the Diaspora' : 'Diaspora-da', body: lang === 'en' ? "The millions of Somalis living abroad are not a footnote. They are an untapped engine. My vision includes building real channels through which diaspora talent, capital, and experience flow back into Somalia." : "Malaayin Soomaali ah oo dibadda ku nool kuma aha qoraal kooban." },
          { title: lang === 'en' ? 'On Unity' : 'Midnimada', body: lang === 'en' ? "Unity does not come from forcing agreement. It comes from building institutions people trust, systems that are fair, and leadership that listens." : "Midnimadu kuma timaado in dadka lagu kalliftey inay is waafaqaan." },
        ].map((item, i) => (
          <AnimatedDiv key={i} delay={i * 0.1} style={{ marginBottom: '52px', paddingBottom: '52px', borderBottom: `1px solid ${t.border}` }}>
            <div id={`vision-${i}`} style={{ display: 'flex', gap: '24px' }}>
              <div style={{ width: '2px', background: 'linear-gradient(to bottom,#4FC3F7,transparent)', borderRadius: '2px', flexShrink: 0, marginTop: '6px' }} />
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '28px', color: t.charcoal, marginBottom: '16px' }}>{item.title}</h2>
                <p style={{ color: t.body, fontSize: isMobile ? '15px' : '17px', lineHeight: '1.9' }}>{item.body}</p>
              </div>
            </div>
          </AnimatedDiv>
        ))}
        <AnimatedDiv><h2 id='vision-3' style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '32px', color: t.charcoal, marginBottom: '40px' }}>The Roadmap to 2040</h2></AnimatedDiv>
        {timeline && timeline.map((phase, i) => (
          <AnimatedDiv key={i} delay={i * 0.07}>
            <div style={{ display: 'flex', gap: isMobile ? '16px' : '28px', marginBottom: '36px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: isMobile ? '80px' : '100px', textAlign: 'right' }}>
                <div style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '700' }}>{phase.year}</div>
                <div style={{ color: t.mid, fontSize: '11px', marginTop: '2px' }}>{phase.phase}</div>
              </div>
              <div style={{ width: '1px', background: t.border, flexShrink: 0, marginTop: '4px', alignSelf: 'stretch' }} />
              <div>{(phase.items || []).map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706', flexShrink: 0, marginTop: '7px' }} />
                  <span style={{ color: t.body, fontSize: '14px', lineHeight: '1.6' }}>{item}</span>
                </div>
              ))}</div>
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
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '52px 20px 44px' : '88px 24px 72px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>About</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : '56px', color: '#F8FAFC', letterSpacing: '-1px', lineHeight: '1.1', marginBottom: '20px' }}>{lang === 'en' ? 'My Story' : 'Taariikhda'}</h1>
          <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '560px' }}>{lang === 'en' ? "I am Somali-American from Columbus, Ohio. Cybersecurity professional. Community builder. Someone who believes deeply in Somalia." : "Waxaan ahay Soomaali-Maraykan ah oo ka ah Columbus, Ohio."}</p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '44px 20px' : '68px 24px' }}>
        <AnimatedDiv style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: isMobile ? '28px' : '48px', alignItems: 'start', marginBottom: '64px', paddingBottom: '64px', borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ width: '100%', paddingBottom: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: `1px solid ${t.border}`, background: t.soft }}>
              <img
                src="https://uesuhjkerdhveyrkcxcs.supabase.co/storage/v1/object/public/somalia2040-media/muzz-headshot.png"
                alt="Mohamud Mohamed"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🇸🇴</div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['Based in','Columbus, Ohio'],['Field','Cybersecurity & IT'],['Education','MS Cybersecurity, WGU'],['Hiigsiga','Hiigsiga 2040']].map(item => (
                <div key={item[0]} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: t.mid, fontSize: '11px', fontWeight: '700', minWidth: '72px', textTransform: 'uppercase' }}>{item[0]}</span>
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
          { year: '2040', color: '#4FC3F7', heading: lang === 'en' ? 'Why Somalia?' : 'Sababta Soomaaliya?', body: lang === 'en' ? "It started as a feeling. A quiet but persistent sense that Somalia\'s future matters, and that people who understand technology and governance have something real to offer." : "Waxay bilaabatay dareen. Maaha qorshe." },
          { year: 'Now', color: '#D97706', heading: lang === 'en' ? 'What I am building toward' : 'Waxa aan doonayo', body: lang === 'en' ? "A Somali political leader who understands technology, the diaspora, and the next generation. I am building that track record one project at a time." : "Hogaamiye siyaasadeed oo fahma teknoolajiyada, diaspora-da." },
          { year: 'Core', color: '#10B981', heading: lang === 'en' ? 'What drives me' : 'Waxa i dhaqaajiyo', body: lang === 'en' ? "The diaspora gave me education, perspective, and opportunity. Somalia gave me identity, purpose, and the weight of belonging. I feel a responsibility to bridge those two things." : "Diaspora-da ayaa ii siisay waxbarasho. Soomaaliya ayaa ii siisay aqoonsiga." },
        ].map((s, i) => (
          <AnimatedDiv key={i} delay={i * 0.1} style={{ display: 'flex', gap: isMobile ? '16px' : '28px', marginBottom: '48px', paddingBottom: '48px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ flexShrink: 0, width: '64px', textAlign: 'right' }}><div style={{ color: s.color, fontSize: '11px', fontWeight: '700' }}>{s.year}</div></div>
            <div style={{ width: '2px', background: `linear-gradient(to bottom,${s.color},transparent)`, borderRadius: '2px', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '22px' : '26px', color: t.charcoal, marginBottom: '14px' }}>{s.heading}</h2>
              <p style={{ color: t.body, fontSize: isMobile ? '15px' : '16px', lineHeight: '1.9' }}>{s.body}</p>
            </div>
          </AnimatedDiv>
        ))}
        <AnimatedDiv>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px', marginBottom: '48px' }}>
            {[['2','Degrees completed',null],['MS','Currently studying',null],['14+','Projects built','https://kulangroup.com'],['2040','The goal year',null]].map(([num,label,link]) => (
              <div key={num} onClick={link ? () => window.open(link,'_blank') : undefined} style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: link ? 'pointer' : 'default', transition: 'border-color 0.2s' }} onMouseEnter={e => { if(link) e.currentTarget.style.borderColor='#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; }}>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: '#4FC3F7', fontWeight: '700', marginBottom: '6px' }}>{num}</div>
                <div style={{ color: t.mid, fontSize: '12px' }}>{label}{link && <span style={{ color: "#4FC3F7", marginLeft: "4px", fontSize: "10px" }}> (view)</span>}</div>
              </div>
            ))}
          </div>
        </AnimatedDiv>
                <div style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '2px', width: '28px', background: '#4FC3F7' }} />
            <span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Connect</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[['LinkedIn', 'https://linkedin.com/in/mohamudmohamed'], ['Twitter / X', 'https://twitter.com/mmohamud25'], ['Email', 'mailto:mohamedmohammud@gmail.com'], ['Kulan Group', 'https://kulangroup.com']].map(([name, href]) => (
              <a key={name} href={href} target="_blank" rel="noreferrer" style={{ padding: '9px 18px', borderRadius: '8px', background: t.soft, border: `1px solid ${t.border}`, color: t.charcoal, fontSize: '13px', textDecoration: 'none', fontWeight: '500', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor='#4FC3F7'; e.currentTarget.style.color='#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.charcoal; }}>{name}</a>
            ))}
          </div>
        </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Library</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : '56px', color: '#F8FAFC', letterSpacing: '-1px', lineHeight: '1.1', marginBottom: '16px' }}>{lang === 'en' ? 'Reading List' : 'Buugaagta'}</h1>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>{lang === 'en' ? 'Books and resources shaping my thinking on Somalia, governance, and leadership.' : 'Buugaag iyo xogaha qaabeeya fikradayda.'}</p>
        </div>
      </div>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 24px' }}>
        {reading.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.mid }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
            <p style={{ fontSize: '15px' }}>Reading list coming soon.</p>
          </div>
        ) : (
          [...new Set(reading.map(r => r.category))].map(cat => (
            <div key={cat} style={{ marginBottom: '48px' }}>
              <AnimatedDiv><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ height: '2px', width: '24px', background: '#D97706' }} /><span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: '700' }}>{cat}</span></div></AnimatedDiv>
              {reading.filter(r => r.category === cat).map((book, i) => (
                <AnimatedDiv key={book.id} delay={i * 0.06}>
                  <div style={{ background: t.soft, borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', borderLeft: '3px solid #4FC3F7', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '3px' }}>
                      <div style={{ fontWeight: '600', color: t.charcoal, fontSize: '16px' }}>{book.title}</div>
                      {book.status && <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', padding: '3px 8px', borderRadius: '20px', background: book.status === 'Reading' ? 'rgba(79,195,247,0.15)' : book.status === 'Read' ? 'rgba(16,185,129,0.15)' : 'rgba(217,119,6,0.15)', color: book.status === 'Reading' ? '#4FC3F7' : book.status === 'Read' ? '#10B981' : '#D97706' }}>{book.status}</span>}
                    </div>
                    <div style={{ color: '#4FC3F7', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>{book.author}</div>
                    {book.note && <p style={{ color: t.body, fontSize: '13px', lineHeight: '1.7', marginBottom: '10px' }}>{book.note}</p>}
                    {book.link && <a href={book.link} target="_blank" rel="noreferrer" style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '500', textDecoration: 'none', opacity: 0.8 }}>View on Goodreads →</a>}
                  </div>
                </AnimatedDiv>
              ))}
            </div>
          ))
        )}
        <Newsletter T={t} />
      </div>
    </div>
  );
};

const VoiceCard = ({ v, t }) => {
  const [liked, setLiked] = useState(() => isVoiceLiked(v.id));
  const [likes, setLikes] = useState(v.likes || 0);
  const [anim, setAnim] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liked) return;
    setAnim(true);
    setTimeout(() => setAnim(false), 400);
    const result = await likeVoice(v.id);
    if (!result.alreadyLiked) { setLiked(true); setLikes(l => l + 1); }
  };

  return (
    <div style={{ background: t.soft, border: `1px solid ${v.featured ? '#D97706' : t.border}`, borderRadius: '14px', padding: '24px', height: '100%', borderTop: `3px solid ${v.featured ? '#D97706' : t.border}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {v.featured && (
        <span style={{ position: 'absolute', top: '14px', right: '14px', background: '#D97706', color: '#FFF', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase' }}>Featured</span>
      )}
      <p style={{ color: t.charcoal, fontSize: '15px', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '16px', flex: 1 }}>"{v.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#4FC3F7,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#FFF', flexShrink: 0 }}>
            {(v.author || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '600' }}>{v.author}</div>
            {v.location && <div style={{ color: t.mid, fontSize: '12px' }}>{v.location}</div>}
          </div>
        </div>
        <button onClick={handleLike} disabled={liked} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: liked ? 'rgba(79,195,247,0.1)' : 'none', border: `1px solid ${liked ? 'rgba(79,195,247,0.3)' : t.border}`, borderRadius: '20px', padding: '5px 12px', cursor: liked ? 'default' : 'pointer', color: liked ? '#4FC3F7' : t.mid, fontSize: '12px', fontWeight: '600', transition: 'all 0.2s', transform: anim ? 'scale(1.2)' : 'scale(1)' }}>
          <span style={{ fontSize: '14px' }}>{liked ? '♥' : '♡'}</span>
          <span>{likes}</span>
        </button>
      </div>
    </div>
  );
};


const ConnectPage = ({ voices, onVoiceSubmit, lang, monthlyQ, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ author: '', location: '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const iStyle = { width: '100%', padding: '11px 13px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', fontFamily: "'DM Sans',sans-serif" };

  const submit = async () => {
    if (!form.author || !form.text) return;
    await onVoiceSubmit({ ...form, featured: false, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) });
    setSubmitted(true);
  };

  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '48px 20px 40px' : '72px 24px 56px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Community</span>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '32px' : '48px', color: '#F8FAFC', letterSpacing: '-0.5px', lineHeight: '1.1', marginBottom: '16px' }}>
            {lang === 'en' ? "Let's Connect" : 'Aan Xiriirno'}
          </h1>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
            {lang === 'en' ? 'This space belongs to every Somali who has something to say.' : 'Meesha waxay u tahay Soomaali kasta oo wax yidhaahda.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 24px' }}>

        {/* Monthly Question */}
        {monthlyQ && (
          <AnimatedDiv>
            <div style={{ background: t.dark ? '#040C16' : '#0A0F1A', border: `1px solid ${t.border}`, borderRadius: '16px', padding: isMobile ? '28px 22px' : '44px', marginBottom: '48px', textAlign: 'center' }}>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '700' }}>Monthly Question</div>
              <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '26px', color: '#F8FAFC', lineHeight: '1.5', maxWidth: '600px', margin: '0 auto', fontStyle: 'italic' }}>"{monthlyQ}"</p>
              <p style={{ color: '#475569', fontSize: '12px', marginTop: '16px', letterSpacing: '0.5px' }}>Updated monthly</p>
            </div>
          </AnimatedDiv>
        )}

        {/* Voices grid — uniform 3-column */}
        {voices.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <AnimatedDiv>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ height: '2px', width: '24px', background: '#D97706' }} />
                <span style={{ color: t.mid, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: '700' }}>Community Voices</span>
              </div>
            </AnimatedDiv>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '16px' }}>
              {voices.map((v, i) => (
                <AnimatedDiv key={v.id} delay={i * 0.05}>
                  <VoiceCard v={v} t={t} />
                </AnimatedDiv>
              ))}
            </div>
          </div>
        )}

        {/* Share Your Voice form */}
        <AnimatedDiv>
          <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '16px', padding: isMobile ? '28px 22px' : '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '24px' : '30px', color: t.charcoal, marginBottom: '8px' }}>Share Your Voice</h2>
            <p style={{ color: t.mid, fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>Submitted voices are reviewed before going live.</p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                <div style={{ color: t.charcoal, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Thank you for sharing.</div>
                <p style={{ color: t.mid, fontSize: '14px', lineHeight: '1.6' }}>Your voice has been submitted and will appear here once reviewed.</p>
                <button onClick={() => { setSubmitted(false); setForm({ author: '', location: '', text: '' }); }} style={{ marginTop: '16px', background: 'none', border: `1px solid ${t.border}`, borderRadius: '6px', padding: '8px 16px', color: t.mid, fontSize: '13px', cursor: 'pointer' }}>Submit another</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="Your name *" style={iStyle} maxLength={60} />
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Your city / country" style={iStyle} maxLength={60} />
                </div>
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} placeholder="Your thoughts on Somalia, politics, or the future..." rows={5} style={{ ...iStyle, resize: 'vertical', width: '100%', paddingBottom: '28px' }} maxLength={500} />
                  <span style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '11px', color: form.text.length > 450 ? '#EF4444' : t.mid }}>{form.text.length}/500</span>
                </div>
                <Btn onClick={submit} T={t} disabled={!form.author || !form.text} style={{ marginTop: '10px' }}>Submit Your Voice</Btn>
              </>
            )}
          </div>
        </AnimatedDiv>

        <Newsletter T={t} />
      </div>
    </div>
  );
};

const PostPage = ({ post, lang, setPage, onCommentSubmit, user, savedPostIds, onSavePost, onShowAuth, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [comment, setComment] = useState({ author: user?.email?.split('@')[0] || '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const isSaved = savedPostIds && savedPostIds.includes(post.id);
  const comments = (post.somalia_comments || []).filter(c => c.approved);
  const postBody = lang === 'en' ? post.content : (post.content_so || post.content);
  const iStyle = { width: '100%', padding: '10px 13px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" };

  const handleSubmit = async () => {
    if (!comment.author || !comment.text) return;
    await onCommentSubmit({ post_id: post.id, ...comment, approved: false, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) });
    setSubmitted(true);
  };

  return (
    <div style={{ paddingTop: '64px' }}>
      <ReadingProgress />
      {post.thumbnail_url && (
        <div style={{ width: '100%', height: isMobile ? '240px' : '420px', overflow: 'hidden', position: 'relative' }}>
          <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.6))' }} />
        </div>
      )}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '32px 20px' : '56px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <span onClick={() => setPage('blog')} style={{ color: '#4FC3F7', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>← Back to Blog</span>
          <button onClick={() => user ? onSavePost(post.id) : onShowAuth()} style={{ background: isSaved ? 'rgba(79,195,247,0.1)' : 'none', border: isSaved ? '1px solid rgba(79,195,247,0.2)' : `1px solid ${t.border}`, borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: isSaved ? '#4FC3F7' : t.mid, transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", fontWeight: '500' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#4FC3F7'; e.currentTarget.style.color='#4FC3F7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=isSaved?'rgba(79,195,247,0.2)':t.border; e.currentTarget.style.color=isSaved?'#4FC3F7':t.mid; }}
          >🔖 {isSaved ? 'Saved' : 'Save'}</button>
        </div>

        <div style={{ marginBottom: '12px' }}><Tag T={t} color="#4FC3F7">Essay</Tag></div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : 'clamp(28px,4vw,42px)', color: t.charcoal, margin: '16px 0', lineHeight: '1.18', letterSpacing: '-0.5px' }}>
          {lang === 'en' ? post.title : (post.title_so || post.title)}
        </h1>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ color: t.mid, fontSize: '13px' }}>{post.date}</span>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} />
          <span style={{ color: t.mid, fontSize: '13px' }}>{getRT(postBody)}</span>
          {(post.views || 0) > 0 && <><div style={{ width: '3px', height: '3px', borderRadius: '50%', background: t.border }} /><span style={{ color: t.mid, fontSize: '13px' }}>{fmt(post.views)} {post.views === 1 ? 'read' : 'reads'}</span></>}
          {post.category && <Tag T={t}>{post.category}</Tag>}
        </div>

        <ShareBtns title={lang === 'en' ? post.title : (post.title_so || post.title)} T={t} />
        <div style={{ height: '1px', background: t.border, margin: '28px 0' }} />

        {postBody && (
          isHTML(postBody)
            ? <div className="post-content" dangerouslySetInnerHTML={{ __html: postBody }} />
            : postBody.split('\n\n').map((para, i) => <p key={i} style={{ color: t.body, fontSize: isMobile ? '17px' : '18px', lineHeight: '1.95', marginBottom: '1.5rem' }}>{para}</p>)
        )}

        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '32px' }}>
            {post.tags.map(tag => <Tag key={tag} T={t}>#{tag}</Tag>)}
          </div>
        )}

        <div style={{ height: '1px', background: t.border, margin: '40px 0 28px' }} />
        <ShareBtns title={lang === 'en' ? post.title : (post.title_so || post.title)} T={t} />

        {/* Comments */}
        <div style={{ marginTop: '56px' }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal, marginBottom: '28px', letterSpacing: '-0.3px' }}>
            Responses <span style={{ color: t.mid, fontSize: '18px' }}>({comments.length})</span>
          </h3>
          {comments.map(c => (
            <div key={c.id} style={{ background: t.soft, borderRadius: '12px', padding: '20px 22px', marginBottom: '14px', borderLeft: `2px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '14px' }}>{c.author}</span>
                <span style={{ color: t.mid, fontSize: '12px' }}>{c.date}</span>
              </div>
              <p style={{ color: t.body, fontSize: '14px', lineHeight: '1.7' }}>{c.text}</p>
            </div>
          ))}
          <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '14px', padding: isMobile ? '24px' : '32px', marginTop: '28px' }}>
            <h4 style={{ fontFamily: 'Playfair Display', fontSize: '20px', color: t.charcoal, marginBottom: '20px' }}>Leave a response</h4>
            {!user && (
              <div style={{ background: t.lightBlue, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ color: t.blueDark, fontSize: '13px' }}>Sign in to comment with your name.</span>
                <button onClick={onShowAuth} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Reader Login</button>
              </div>
            )}
            {submitted ? (
              <p style={{ color: '#059669', fontSize: '14px', fontWeight: '500' }}>Your response has been submitted for review. Thank you.</p>
            ) : (
              <>
                <input value={comment.author} onChange={e => setComment({...comment, author: e.target.value})} placeholder="Your name" style={iStyle} />
                <textarea value={comment.text} onChange={e => setComment({...comment, text: e.target.value})} placeholder="Share your thoughts..." rows={4} style={{ ...iStyle, resize: 'vertical', marginBottom: '14px' }} />
                <Btn onClick={handleSubmit} T={t}>Submit Response</Btn>
              </>
            )}
          </div>
        </div>
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
/* ─── AUTH MODAL ───────────────────────────────────────────────── */
const AuthModal = ({ onClose, onSuccess, T }) => {
  const t = T;
  const [mode, setMode] = useState('signin'); // signin | signup
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const iStyle = {
    width: '100%', padding: '11px 13px', border: `1.5px solid ${error ? '#EF4444' : t.border}`,
    borderRadius: '8px', fontSize: '14px', marginBottom: '12px',
    outline: 'none', background: t.inputBg, color: t.charcoal,
    fontFamily: "'DM Sans', sans-serif",
  };

  const submit = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !form.name) { setError('Please enter your name.'); return; }
    setLoading(true); setError('');
    const result = mode === 'signup'
      ? await signUp(form.email, form.password, form.name)
      : await signIn(form.email, form.password);
    setLoading(false);
    if (result.error) { setError(result.error.message); return; }
    onSuccess(result.user);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-in" style={{ background: t.card, borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '400px', border: `1px solid ${t.border}`, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: t.mid, fontSize: '22px', lineHeight: 1 }}>×</button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <StarLogo size={40} />
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal, marginTop: '12px', marginBottom: '4px', letterSpacing: '-0.3px' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create Reader Account'}
          </h2>
          <p style={{ color: t.mid, fontSize: '13px' }}>
            {mode === 'signin' ? 'Sign in to save posts and join the conversation.' : 'Create an account to save posts and share your voice.'}
          </p>
        </div>

        {mode === 'signup' && (
          <>
            <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>YOUR NAME</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="How should we call you?" style={iStyle} />
          </>
        )}
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>EMAIL</label>
        <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" style={iStyle} onKeyDown={e => e.key === 'Enter' && submit()} />
        <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>PASSWORD</label>
        <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" style={{ ...iStyle, letterSpacing: '3px' }} onKeyDown={e => e.key === 'Enter' && submit()} />

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

        <button onClick={submit} disabled={loading} style={{ width: '100%', background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', color: t.mid, fontSize: '13px' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} style={{ color: '#4FC3F7', cursor: 'pointer', fontWeight: '600' }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
};

/* ─── USER MENU ────────────────────────────────────────────────── */
const UserMenu = ({ user, profile, onSignOut, onViewProfile, T }) => {
  const t = T;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = (profile?.display_name || user?.email || 'U').charAt(0).toUpperCase();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#4FC3F7,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFF', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
        {initials}
      </div>
      {open && (
        <div className="slide-down" style={{ position: 'absolute', top: '40px', right: 0, background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '8px', minWidth: '180px', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
            <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '600' }}>{profile?.display_name || 'Reader'}</div>
            <div style={{ color: t.mid, fontSize: '11px' }}>{user?.email}</div>
          </div>
          <div style={{ height: '1px', background: t.border, margin: '4px 0' }} />
          {[
            { label: '👤 My Profile', action: () => { onViewProfile(); setOpen(false); } },
            { label: '🔖 Saved Posts', action: () => { onViewProfile(); setOpen(false); } },
          ].map(item => (
            <div key={item.label} onClick={item.action} style={{ padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: t.charcoal, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = t.soft}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{item.label}</div>
          ))}
          <div style={{ height: '1px', background: t.border, margin: '4px 0' }} />
          <div onClick={() => { onSignOut(); setOpen(false); }} style={{ padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#EF4444', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >← Sign out</div>
        </div>
      )}
    </div>
  );
};

/* ─── PROFILE PAGE ─────────────────────────────────────────────── */

const MarketingPage = ({ setPage, lang, voices, posts, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const totalReads = posts.reduce((s, p) => s + (p.views || 0), 0);
  const publishedCount = posts.filter(p => p.published).length;
  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#08111E 40%,#040C16 100%)', minHeight: isMobile ? '70vh' : '80vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: isMobile ? '60px 20px' : '80px 24px' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(79,195,247,0.07),transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="fade-in" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)', borderRadius: '20px', padding: '6px 14px', marginBottom: '28px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4FC3F7', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>Hiigsiga 2040 · Build. Unite. Lead.</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '36px' : 'clamp(44px,5vw,68px)', color: '#F8FAFC', fontWeight: '700', lineHeight: '1.08', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              {lang === 'en' ? <>The platform for<br /><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Somalia\'s</span> future<br />leaders.</> : <>Madasha<br /><span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>mustaqbalka</span><br />hogaaminteeda.</>}
            </h1>
            <p style={{ color: '#64748B', fontSize: isMobile ? '15px' : '18px', lineHeight: '1.8', maxWidth: '520px', marginBottom: '40px' }}>
              {lang === 'en' ? 'Essays, community voices, and an honest roadmap from a Somali-American who believes the diaspora has a role to play in shaping what comes next.' : 'Maqaallo, codadka bulshada, iyo qorshaha daacadda ah.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('blog')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background='#7DD3F8'; e.currentTarget.style.transform='translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background='#4FC3F7'; e.currentTarget.style.transform='translateY(0)'; }}>{lang === 'en' ? 'Read the essays' : 'Akhri maqaalada'}</button>
              <button onClick={() => setPage('vision')} style={{ background: 'transparent', color: '#94A3B8', border: '1.5px solid #1A2D44', padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: '6px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor='#4FC3F7'; e.currentTarget.style.color='#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor='#1A2D44'; e.currentTarget.style.color='#94A3B8'; }}>{lang === 'en' ? 'The Vision' : 'Aragtida'}</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: t.soft, borderBottom: `1px solid ${t.border}`, padding: isMobile ? '24px 20px' : '28px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '24px' }}>
          {[[publishedCount, lang==='en'?'Essays published':'Maqaallo'],[fmt(totalReads),lang==='en'?'Total reads':'Akhrinta'],[voices.length,lang==='en'?'Community voices':'Codadka'],['2040',lang==='en'?'The target year':'Sannadka']].map(([num,label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display', fontSize: '32px', color: '#4FC3F7', fontWeight: '700', lineHeight: '1' }}>{num}</div>
              <div style={{ color: t.mid, fontSize: '13px', marginTop: '6px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '52px 20px' : '80px 24px' }}>
        <AnimatedDiv style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '40px', color: t.charcoal, letterSpacing: '-0.5px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.2' }}>{lang === 'en' ? 'Three things Somalia needs most.' : 'Saddexda wax oo Soomaaliya ugu baahan tahay.'}</h2>
        </AnimatedDiv>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '20px', marginBottom: '80px' }}>
          {[
            { icon: '💻', title: lang==='en'?'Technology & Governance':'Teknoolajiyada', body: lang==='en'?'Somalia needs leaders who understand digital infrastructure, cybersecurity, and e-governance.':'Soomaaliya waxay u baahan tahay hogaamineyaasha fahmaya kaabayaasha dijital.', color: '#4FC3F7' },
            { icon: '🌍', title: lang==='en'?'Diaspora Power':'Xoogga Diaspora', body: lang==='en'?'Millions of educated, globally connected Somalis live abroad. Building channels for their expertise to flow home is one of the most important opportunities.':'Malaayin Soomaali ah oo waxbarashada leh ayaa dibadda ku nool.', color: '#D97706' },
            { icon: '🤝', title: lang==='en'?'Unity Through Trust':'Midnimada', body: lang==='en'?'Unity comes from fair systems, accountable institutions, and leadership that genuinely listens.':'Midnimadu kuma timaado heshiis lagu khasbiyo.', color: '#10B981' },
          ].map((pillar, i) => (
            <AnimatedDiv key={i} delay={i*0.1}>
              <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '32px 28px', height: '100%', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{pillar.icon}</div>
                <div style={{ width: '32px', height: '3px', background: pillar.color, borderRadius: '2px', marginBottom: '16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', color: t.charcoal, marginBottom: '14px' }}>{pillar.title}</h3>
                <p style={{ color: t.body, fontSize: '15px', lineHeight: '1.8' }}>{pillar.body}</p>
              </div>
            </AnimatedDiv>
          ))}
        </div>

        <AnimatedDiv style={{ marginBottom: '80px' }}>
          <div style={{ background: t.dark ? '#040C16' : '#0A0F1A', borderRadius: '20px', padding: isMobile ? '36px 28px' : '56px 60px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle,rgba(79,195,247,0.06),transparent)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'Playfair Display', fontSize: '80px', color: '#4FC3F7', opacity: 0.15, lineHeight: '0.5', marginBottom: '20px' }}>"</div>
            <p style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '20px' : '26px', color: '#F8FAFC', lineHeight: '1.6', marginBottom: '24px', maxWidth: '640px', fontStyle: 'italic' }}>
              {lang === 'en' ? "It started as a feeling. A quiet but persistent sense that Somalia\'s future matters, and that people like me have something real to offer." : "Waxay bilaabatay dareen. Dareen degdeg ah oo adag oo ah in mustaqbalka Soomaaliya muhiim yahay."}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(79,195,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🇸🇴</div>
              <div>
                <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: '600' }}>Mohamud Mohamed</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>Founder, Hiigsiga 2040</div>
              </div>
            </div>
          </div>
        </AnimatedDiv>

        <AnimatedDiv>
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 40px', background: t.soft, border: `1px solid ${t.border}`, borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '36px', color: t.charcoal, marginBottom: '14px' }}>{lang === 'en' ? 'Join the conversation.' : 'Ku biir xiriirka.'}</h2>
            <p style={{ color: t.mid, fontSize: '16px', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto 32px' }}>{lang === 'en' ? 'This is a space for every Somali who thinks deeply about the future.' : 'Meeshan waxay u tahay Soomaali kasta oo si qoto dheer u fikira mustaqbalka.'}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('connect')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', padding: '13px 30px', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background='#7DD3F8'; e.currentTarget.style.transform='translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background='#4FC3F7'; e.currentTarget.style.transform='translateY(0)'; }}>{lang === 'en' ? "Let\'s Connect" : 'Aan Xiriirno'}</button>
              <button onClick={() => setPage('blog')} style={{ background: 'transparent', color: t.charcoal, border: `1.5px solid ${t.border}`, padding: '13px 30px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor='#4FC3F7'; e.currentTarget.style.color='#4FC3F7'; }} onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.charcoal; }}>{lang === 'en' ? 'Read the Blog' : 'Blog-ka'}</button>
            </div>
          </div>
        </AnimatedDiv>
      </div>
    </div>
  );
};
const ProfilePage = ({ user, profile, savedPosts, posts, onUpdateProfile, onUnsave, T }) => {
  const t = T;
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: profile?.display_name || '', bio: profile?.bio || '', location: profile?.location || '' });
  const [saving, setSaving] = useState(false);
  const saved = posts.filter(p => savedPosts.includes(p.id));
  const iStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '14px', background: t.inputBg, color: t.charcoal, outline: 'none', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" };

  const save = async () => {
    setSaving(true);
    await onUpdateProfile(form);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ paddingTop: '64px' }}>
      <div style={{ background: 'linear-gradient(160deg,#040C16 0%,#0A0F1A 100%)', padding: isMobile ? '48px 20px 40px' : '72px 24px 56px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ height: '1px', width: '40px', background: '#4FC3F7' }} />
            <span style={{ color: '#4FC3F7', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>Profile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#4FC3F7,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#FFF', flexShrink: 0 }}>
              {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? '28px' : '36px', color: '#F8FAFC', letterSpacing: '-0.5px', lineHeight: '1.1' }}>{profile?.display_name || 'Reader'}</h1>
              <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px' }}>{user?.email}</p>
              {profile?.location && <p style={{ color: '#4FC3F7', fontSize: '13px', marginTop: '4px' }}>📍 {profile.location}</p>}
            </div>
          </div>
          {profile?.bio && <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.7', marginTop: '20px', maxWidth: '480px' }}>{profile.bio}</p>}
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '36px 20px' : '52px 24px' }}>
        {/* Edit Profile */}
        <div style={{ background: t.soft, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '24px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? '20px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '17px', color: t.charcoal }}>Edit Profile</h3>
            </div>
            {!editing && <Btn small outline onClick={() => setEditing(true)} T={t}>Edit</Btn>}
          </div>
          {editing && (
            <>
              <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>DISPLAY NAME</label>
              <input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} placeholder="Your name" style={iStyle} />
              <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>LOCATION</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Columbus, Ohio" style={iStyle} />
              <label style={{ color: t.mid, fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>BIO</label>
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Tell us about yourself..." rows={3} style={{ ...iStyle, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn small onClick={save} T={t} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
                <Btn small outline onClick={() => setEditing(false)} T={t}>Cancel</Btn>
              </div>
            </>
          )}
        </div>

        {/* Saved Posts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ height: '2px', width: '28px', background: '#D97706' }} />
            <span style={{ color: t.mid, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>Saved Posts ({saved.length})</span>
          </div>
          {saved.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: t.soft, borderRadius: '12px', border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔖</div>
              <p style={{ color: t.mid, fontSize: '14px' }}>No saved posts yet.</p>
              <p style={{ color: t.mid, fontSize: '13px', marginTop: '4px' }}>Click the bookmark icon on any post to save it here.</p>
            </div>
          ) : saved.map((post, i) => (
            <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${t.border}`, gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t.charcoal, fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                <div style={{ color: t.mid, fontSize: '12px', marginTop: '2px' }}>{post.date} · {getRT(post.content)}</div>
              </div>
              <button onClick={() => onUnsave(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.mid, fontSize: '18px', padding: '4px', flexShrink: 0 }} title="Remove from saved">🔖</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminAnalytics = ({ T }) => {
  const t = T || getT(false);
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const s = await getAnalyticsSummary(days); setSummary(s); }
      catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [days]);

  const maxDaily = summary?.dailyViews?.length > 0
    ? Math.max(...summary.dailyViews.map(([, v]) => v), 1) : 1;

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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Page Views', value: summary.totalViews, color: '#4FC3F7', icon: '👁' },
              { label: 'Unique Sessions', value: summary.uniqueSessions, color: '#D97706', icon: '👤' },
              { label: 'Mobile', value: summary.devices?.mobile || 0, color: '#10B981', icon: '📱' },
              { label: 'Desktop', value: summary.devices?.desktop || 0, color: '#8B5CF6', icon: '💻' },
            ].map(s => (
              <div key={s.label} style={{ background: t.card, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}`, borderTop: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display' }}>{s.value}</div>
                  <span style={{ fontSize: '18px', opacity: 0.6 }}>{s.icon}</span>
                </div>
                <div style={{ color: t.mid, fontSize: '12px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Daily Page Views</h3>
                <span style={{ color: t.mid, fontSize: '12px', marginLeft: 'auto' }}>Last {days} days</span>
              </div>
              {summary.dailyViews.length === 0 ? (
                <p style={{ color: t.mid, fontSize: '13px', textAlign: 'center', padding: '20px' }}>No data yet for this period</p>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px' }}>
                    {summary.dailyViews.map(([date, views]) => (
                      <div key={date} title={`${date}: ${views} views`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div style={{ width: '100%', height: `${Math.max(4, (views / maxDaily) * 100)}%`, background: 'rgba(79,195,247,0.5)', borderRadius: '2px 2px 0 0', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,195,247,0.9)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,195,247,0.5)'}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ color: t.mid, fontSize: '10px' }}>{summary.dailyViews[0]?.[0]}</span>
                    <span style={{ color: t.mid, fontSize: '10px' }}>{summary.dailyViews[summary.dailyViews.length - 1]?.[0]}</span>
                  </div>
                </>
              )}
            </div>
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '16px', background: '#D97706', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Devices</h3>
              </div>
              {Object.entries(summary.devices || {}).filter(([, v]) => v > 0).map(([device, count]) => {
                const total = Object.values(summary.devices || {}).reduce((s, v) => s + v, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const colors = { desktop: '#4FC3F7', mobile: '#D97706', tablet: '#10B981' };
                return (
                  <div key={device} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{device.charAt(0).toUpperCase() + device.slice(1)}</span>
                      <span style={{ color: colors[device] || '#4FC3F7', fontSize: '13px', fontWeight: '700' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: t.border, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[device] || '#4FC3F7', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
              {Object.values(summary.devices || {}).every(v => v === 0) && <p style={{ color: t.mid, fontSize: '13px' }}>No device data yet.</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{ width: '3px', height: '16px', background: '#10B981', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Top Pages</h3>
              </div>
              {summary.topPages.length === 0 ? <p style={{ color: t.mid, fontSize: '13px' }}>No page data yet.</p>
                : summary.topPages.map(([page, views], i) => (
                  <div key={page} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < summary.topPages.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <span style={{ color: t.mid, fontSize: '11px', fontWeight: '700', width: '16px' }}>{i + 1}</span>
                      <span style={{ color: t.charcoal, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page || 'Home'}</span>
                    </div>
                    <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '700', marginLeft: '12px' }}>{views}</span>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: t.card, borderRadius: '12px', padding: '22px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <div style={{ width: '3px', height: '16px', background: '#8B5CF6', borderRadius: '2px' }} />
                  <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Top Referrers</h3>
                </div>
                {summary.topReferrers.length === 0
                  ? <p style={{ color: t.mid, fontSize: '13px' }}>No referrer data yet. Most visitors came directly.</p>
                  : summary.topReferrers.map(([ref, count], i) => (
                    <div key={ref} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < summary.topReferrers.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                      <span style={{ color: t.charcoal, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                        {ref.replace('https://', '').replace('http://', '').split('/')[0]}
                      </span>
                      <span style={{ color: '#8B5CF6', fontSize: '13px', fontWeight: '700' }}>{count}</span>
                    </div>
                  ))}
              </div>
              <div style={{ background: 'linear-gradient(135deg,#040C16,#0F1E30)', borderRadius: '12px', padding: '20px', border: '1px solid #1A2D44' }}>
                <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '10px' }}>Power tip</div>
                <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>Connect Google Analytics 4 for deeper geographic data and real-time users.</p>
                <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>Open Google Analytics →</a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AdminLogin = ({ onLogin, T }) => {
  const t = T || getT(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const attempt = () => {
    if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) { onLogin(); setErr(false); }
    else setErr(true);
  };
  const iStyle = (e) => ({ width: "100%", padding: "13px 14px", border: `1.5px solid ${e ? "#EF4444" : t.border}`, borderRadius: "10px", fontFamily: "DM Sans", fontSize: "14px", marginBottom: "12px", outline: "none", color: t.charcoal, background: t.soft });
  return (
    <div style={{ minHeight: "100vh", background: t.charcoal, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: '#FFFFFF', borderRadius: "20px", padding: "48px", width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: '#4FC3F7', display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ color: '#FFFFFF', fontSize: "24px", fontFamily: "Playfair Display", fontWeight: "700" }}>S</span>
          </div>
          <h2 style={{ fontFamily: "Playfair Display", fontSize: "26px", color: t.charcoal, marginBottom: "6px" }}>Admin Access</h2>
          <p style={{ color: t.mid, fontSize: "13px" }}>Hiigsiga 2040 - Dashboard</p>
        </div>
        <label style={{ color: t.mid, fontSize: "12px", display: "block", marginBottom: "6px" }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()} placeholder="your@email.com" style={iStyle(err)} />
        <label style={{ color: t.mid, fontSize: "12px", display: "block", marginBottom: "6px" }}>Password</label>
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


const AdminDash = ({ posts, voices, T, onTabChange }) => {
  const t = T || getT(false);
  const published = posts.filter(p => p.published);
  const drafts = posts.filter(p => !p.published);
  const pending = posts.flatMap(p => (p.somalia_comments || []).filter(c => !c.approved));
  const recentVoices = [...voices].sort((a,b) => b.id - a.id).slice(0, 3);
  const recentComments = pending.slice(0, 3);

  const stats = [
    { label: 'Published', value: published.length, color: '#4FC3F7', tab: 'posts' },
    { label: 'Drafts', value: drafts.length, color: '#D97706', tab: 'posts' },
    { label: 'Pending Comments', value: pending.length, color: '#EF4444', tab: 'comments' },
    { label: 'Voices', value: voices.length, color: '#10B981', tab: 'community' },
  ];

  const quickActions = [
    { label: '✏️ New Post', tab: 'posts' },
    { label: '📖 Word of Week', tab: 'word' },
    { label: '📊 Analytics', tab: 'analytics' },
    { label: '⚙️ Settings', tab: 'settings' },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal }}>Dashboard</h1>
        <span style={{ color: t.mid, fontSize: '13px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {quickActions.map(a => (
          <button key={a.tab} onClick={() => onTabChange(a.tab)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.card, color: t.charcoal, fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4FC3F7'; e.currentTarget.style.color = '#4FC3F7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.charcoal; }}
          >{a.label}</button>
        ))}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} onClick={() => onTabChange(s.tab)} style={{ background: t.card, borderRadius: '12px', padding: '20px', borderTop: `3px solid ${s.color}`, cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '30px', fontWeight: '700', color: s.color, fontFamily: 'Playfair Display', lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: t.mid, fontSize: '12px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        {/* Recent Posts */}
        <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Recent Posts</h3>
            <button onClick={() => onTabChange('posts')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>View all →</button>
          </div>
          {posts.length === 0 && <p style={{ color: t.mid, fontSize: '14px' }}>No posts yet.</p>}
          {posts.slice(0, 6).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: t.charcoal, fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ color: t.mid, fontSize: '11px', marginTop: '2px' }}>{p.date} · {p.views || 0} views</div>
              </div>
              <span style={{ flexShrink: 0, marginLeft: '12px', background: p.published ? 'rgba(79,195,247,0.1)' : '#FEF3C7', color: p.published ? '#4FC3F7' : '#92400E', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                {p.published ? 'Live' : 'Draft'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pending Comments */}
          <div style={{ background: t.card, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Pending Comments {pending.length > 0 && <span style={{ color: '#EF4444' }}>({pending.length})</span>}</h3>
              <button onClick={() => onTabChange('comments')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Review →</button>
            </div>
            {recentComments.length === 0
              ? <p style={{ color: t.mid, fontSize: '13px' }}>No pending comments.</p>
              : recentComments.map(c => (
                <div key={c.id} style={{ padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                  <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{c.author}</div>
                  <div style={{ color: t.mid, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</div>
                </div>
              ))
            }
          </div>

          {/* Recent Voice Submissions */}
          <div style={{ background: t.card, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal }}>Community Voices</h3>
              <button onClick={() => onTabChange('community')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Manage →</button>
            </div>
            {recentVoices.length === 0
              ? <p style={{ color: t.mid, fontSize: '13px' }}>No voices yet.</p>
              : recentVoices.map(v => (
                <div key={v.id} style={{ padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                  <div style={{ color: t.charcoal, fontSize: '13px', fontWeight: '500' }}>{v.author} {v.location ? `· ${v.location}` : ''}</div>
                  <div style={{ color: t.mid, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>"{v.text}"</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPosts = ({ posts, onSave, onDelete, onToggle, T }) => {
  const t = T || getT(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', title_so: '', excerpt: '', excerpt_so: '', content: '', content_so: '', published: false, featured: false, thumbnail_url: '', tags: '', category: '', seo_description: '', scheduled_at: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('content');

  const openEdit = (post) => {
    setEditing(post.id);
    setForm({ title: post.title || '', title_so: post.title_so || '', excerpt: post.excerpt || '', excerpt_so: post.excerpt_so || '', content: post.content || '', content_so: post.content_so || '', published: post.published || false, featured: post.featured || false, thumbnail_url: post.thumbnail_url || '', tags: (post.tags || []).join(', '), category: post.category || '', seo_description: post.seo_description || '', scheduled_at: post.scheduled_at || '' });
    setTab('content');
  };
  const openNew = () => {
    setEditing('new');
    setForm({ title: '', title_so: '', excerpt: '', excerpt_so: '', content: '', content_so: '', published: false, featured: false, thumbnail_url: '', tags: '', category: '', seo_description: '', scheduled_at: '' });
    setTab('content');
  };
  const save = async (publishNow) => {
    setSaving(true);
    const payload = {
      ...(editing !== 'new' ? { id: editing } : { date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }),
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      published: publishNow !== undefined ? publishNow : form.published,
    };
    await onSave(payload);
    setSaving(false);
    setEditing(null);
  };

  const iStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', background: t.inputBg, color: t.charcoal, fontFamily: "'DM Sans',sans-serif", marginBottom: '4px' };
  const tabs = ['content', 'seo', 'settings'];

  if (editing !== null) return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: t.charcoal }}>{editing === 'new' ? 'New Post' : 'Edit Post'}</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Btn outline small onClick={() => setEditing(null)} T={t}>Cancel</Btn>
          <Btn small onClick={() => save(false)} T={t} style={{ background: t.soft, color: t.charcoal, border: `1px solid ${t.border}` }}>{saving ? 'Saving...' : 'Save Draft'}</Btn>
          <Btn small onClick={() => save(true)} T={t}>{saving ? 'Publishing...' : 'Publish'}</Btn>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: t.soft, padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {tabs.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === tb ? '#4FC3F7' : 'transparent', color: tab === tb ? '#0A0F1A' : t.mid, transition: 'all 0.15s', textTransform: 'capitalize' }}>{tb}</button>
        ))}
      </div>

      {tab === 'content' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
            <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '2px', fontWeight: '700', marginBottom: '14px' }}>ENGLISH</div>
            <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700' }}>TITLE</label>
            <input style={iStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Post title..." />
            <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700' }}>EXCERPT</label>
            <textarea style={{ ...iStyle, resize: 'vertical' }} rows={3} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} placeholder="Brief description..." />
            <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700' }}>CONTENT</label>
            <RTE value={form.content} onChange={v => setForm({...form, content: v})} T={t} />
          </div>
          <div style={{ background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` }}>
            <div style={{ color: '#D97706', fontSize: '10px', letterSpacing: '2px', fontWeight: '700', marginBottom: '14px' }}>SOMALI 🇸🇴</div>
            <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700' }}>TITLE (SO)</label>
            <input style={iStyle} value={form.title_so} onChange={e => setForm({...form, title_so: e.target.value})} placeholder="Cinwaanka (Somali)..." />
            <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700' }}>EXCERPT (SO)</label>
            <textarea style={{ ...iStyle, resize: 'vertical' }} rows={3} value={form.excerpt_so} onChange={e => setForm({...form, excerpt_so: e.target.value})} placeholder="Soo koobid..." />
            <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700' }}>CONTENT (SO)</label>
            <textarea style={{ ...iStyle, resize: 'vertical' }} rows={10} value={form.content_so} onChange={e => setForm({...form, content_so: e.target.value})} placeholder="Qoraalka Somali..." />
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div style={{ background: t.card, borderRadius: '12px', padding: '28px', border: `1px solid ${t.border}`, maxWidth: '700px' }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '20px' }}>SEO & Metadata</h3>
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>COVER IMAGE URL</label>
          <input style={iStyle} value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url: e.target.value})} placeholder="https://..." />
          {form.thumbnail_url && <img src={form.thumbnail_url} alt="Cover preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} onError={e => e.target.style.display='none'} />}
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>SEO DESCRIPTION</label>
          <textarea style={{ ...iStyle, resize: 'vertical' }} rows={3} value={form.seo_description} onChange={e => setForm({...form, seo_description: e.target.value})} placeholder="Meta description for search engines (150-160 chars)..." maxLength={160} />
          <div style={{ color: form.seo_description.length > 150 ? '#EF4444' : t.mid, fontSize: '11px', marginBottom: '16px' }}>{form.seo_description.length}/160</div>
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>CATEGORY</label>
          <select style={{ ...iStyle }} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="">No category</option>
            {['Essay', 'Analysis', 'Opinion', 'Update', 'Interview'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>TAGS (comma separated)</label>
          <input style={iStyle} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="Somalia, governance, technology..." />
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ background: t.card, borderRadius: '12px', padding: '28px', border: `1px solid ${t.border}`, maxWidth: '500px' }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '20px' }}>Post Settings</h3>
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>SCHEDULE PUBLISH DATE</label>
          <input type="datetime-local" style={{ ...iStyle, marginBottom: '16px' }} value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} />
          <p style={{ color: t.mid, fontSize: '12px', marginBottom: '24px', lineHeight: '1.5' }}>Leave blank to publish immediately. Scheduled posts go live when you click "Run Scheduler" in Settings.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[['featured', 'Featured on Homepage', 'Pin this post to the homepage hero card'], ['published', 'Published', 'Make this post visible to visitors']].map(([field, label, desc]) => (
              <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: t.soft, borderRadius: '10px', border: `1px solid ${t.border}` }}>
                <div>
                  <div style={{ color: t.charcoal, fontSize: '14px', fontWeight: '500' }}>{label}</div>
                  <div style={{ color: t.mid, fontSize: '12px', marginTop: '2px' }}>{desc}</div>
                </div>
                <div onClick={() => setForm({...form, [field]: !form[field]})} style={{ width: '42px', height: '24px', borderRadius: '12px', background: form[field] ? '#4FC3F7' : t.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: form[field] ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#FFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal }}>Blog Posts</h1>
        <Btn small onClick={openNew} T={t}>+ New Post</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.length === 0 && <div style={{ textAlign: 'center', padding: '60px', background: t.card, borderRadius: '12px', border: `1px solid ${t.border}` }}><div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div><p style={{ color: t.mid }}>No posts yet. Create your first essay.</p></div>}
        {posts.map(p => (
          <div key={p.id} style={{ background: t.card, borderRadius: '12px', padding: '18px 22px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ color: t.charcoal, fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                {p.featured && <span style={{ background: 'rgba(217,119,6,0.15)', color: '#D97706', fontSize: '10px', padding: '1px 7px', borderRadius: '20px', fontWeight: '700', flexShrink: 0 }}>Featured</span>}
              </div>
              <div style={{ color: t.mid, fontSize: '12px' }}>{p.date} · {p.views || 0} views {p.category ? `· ${p.category}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
              <span style={{ background: p.published ? 'rgba(79,195,247,0.1)' : '#FEF3C7', color: p.published ? '#4FC3F7' : '#92400E', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>{p.published ? 'Live' : 'Draft'}</span>
              <Btn small outline onClick={() => openEdit(p)} T={t}>Edit</Btn>
              <Btn small onClick={() => onToggle(p.id, 'published', !p.published)} T={t} style={{ background: p.published ? '#FEF2F2' : 'rgba(79,195,247,0.1)', color: p.published ? '#EF4444' : '#4FC3F7', border: 'none', fontSize: '12px' }}>{p.published ? 'Unpublish' : 'Publish'}</Btn>
              <Btn small onClick={() => window.confirm('Delete this post?') && onDelete(p.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}>Del</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const AdminReading = ({ reading, onAdd, onDelete , T }) => {
  const t = T || getT(false);
  const iStyle = { padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', outline: 'none', background: t.inputBg, color: t.charcoal };
  const [form, setForm] = useState({ title: '', author: '', category: '', note: '', status: 'Read', link: '' });
  const add = async () => {
    if (!form.title || !form.author) return;
    await onAdd(form);
    setForm({ title: '', author: '', category: '', note: '', status: 'Read', link: '' });
  };
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Reading List</h1>
      <div style={{ background: t.card, borderRadius: '12px', padding: '24px', marginBottom: '20px', border: `1px solid ${t.border}` }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '16px' }}>Add a Book</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title *" style={{ ...iStyle, width: '100%' }} />
          <input value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="Author *" style={{ ...iStyle, width: '100%' }} />
          <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category (e.g. Politics, History)" style={{ ...iStyle, width: '100%' }} />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ ...iStyle, width: '100%' }}>
            <option value="Read">✓ Read</option>
            <option value="Reading">📖 Currently Reading</option>
            <option value="Recommended">⭐ Recommended</option>
          </select>
          <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="Goodreads / Amazon link (optional)" style={{ ...iStyle, width: '100%', gridColumn: 'span 2' }} />
        </div>
        <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Why you recommend it — this shows on the public site..." rows={2}
          style={{ ...iStyle, width: '100%', resize: 'vertical', marginBottom: '14px' }} />
        <Btn small onClick={add} T={t}>Add Book</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {reading.length === 0 && <p style={{ color: t.mid, fontSize: '14px', padding: '20px' }}>No books yet.</p>}
        {reading.map(b => (
          <div key={b.id} style={{ background: t.card, borderRadius: '10px', padding: '16px 20px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ color: t.charcoal, fontWeight: '600', fontSize: '14px' }}>{b.title}</span>
                {b.status && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', background: b.status === 'Reading' ? 'rgba(79,195,247,0.15)' : b.status === 'Read' ? 'rgba(16,185,129,0.15)' : 'rgba(217,119,6,0.15)', color: b.status === 'Reading' ? '#4FC3F7' : b.status === 'Read' ? '#10B981' : '#D97706' }}>{b.status}</span>}
              </div>
              <div style={{ color: t.mid, fontSize: '12px' }}>{b.author} · {b.category}</div>
            </div>
            <Btn small onClick={() => onDelete(b.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', flexShrink: 0 }}>Remove</Btn>
          </div>
        ))}
      </div>
    </div>
  );
};
const AdminWord = ({ word, wordArchive, onUpdate , T }) => {
  const t = T || getT(false);
  const [form, setForm] = useState(word || { somali: '', english: '', sentence: '', sentence_en: '' });
  const iStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', outline: 'none', background: t.inputBg, color: t.charcoal };

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Word of the Week</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: t.card, borderRadius: '12px', padding: '28px', border: `1px solid ${t.border}` }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '20px' }}>Current Word</h3>
          {[['somali', 'Somali Word *'], ['english', 'English Translation *'], ['sentence', 'Example Sentence (Somali)'], ['sentence_en', 'Example Sentence (English)']].map(([field, label]) => (
            <div key={field} style={{ marginBottom: '14px' }}>
              <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>{label.toUpperCase()}</label>
              <input value={form[field] || ''} onChange={e => setForm({...form, [field]: e.target.value})} placeholder={label} style={iStyle} />
            </div>
          ))}
          <Btn onClick={() => onUpdate(form)} T={t}>Update Word</Btn>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {word && (
            <div style={{ background: '#040C16', borderRadius: '12px', padding: '24px', border: '1px solid #1A2D44' }}>
              <div style={{ color: '#4FC3F7', fontSize: '10px', letterSpacing: '2px', marginBottom: '12px', fontWeight: '700' }}>LIVE PREVIEW</div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: '#F8FAFC', fontStyle: 'italic', marginBottom: '4px' }}>{form.somali || word.somali}</div>
              <div style={{ color: '#D97706', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>{form.english || word.english}</div>
              {(form.sentence || word.sentence) && <p style={{ color: '#475569', fontSize: '13px', fontStyle: 'italic' }}>{form.sentence || word.sentence}</p>}
            </div>
          )}

          {wordArchive && wordArchive.length > 0 && (
            <div style={{ background: t.card, borderRadius: '12px', padding: '20px', border: `1px solid ${t.border}` }}>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '16px', color: t.charcoal, marginBottom: '14px' }}>Word History ({wordArchive.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wordArchive.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 10px', background: t.soft, borderRadius: '8px' }}>
                    <span style={{ color: '#4FC3F7', fontSize: '14px', fontStyle: 'italic', fontFamily: 'Playfair Display' }}>{w.somali}</span>
                    <span style={{ color: t.mid, fontSize: '13px' }}>{w.english}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const AdminCommunity = ({ voices, onToggleFeatured, onDelete, monthlyQ, onUpdateQ , T }) => {
  const t = T || getT(false);
  const [q, setQ] = useState(monthlyQ || '');
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'featured' ? voices.filter(v => v.featured) : voices;

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Community Manager</h1>

      <div style={{ background: t.card, borderRadius: '12px', padding: '24px', marginBottom: '16px', border: `1px solid ${t.border}` }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal, marginBottom: '14px' }}>Monthly Question</h3>
        <textarea value={q} onChange={e => setQ(e.target.value)} rows={3}
          style={{ width: '100%', padding: '12px', border: `1px solid ${t.border}`, borderRadius: '8px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', resize: 'vertical', outline: 'none', background: t.inputBg, color: t.charcoal, marginBottom: '12px' }} />
        <Btn small onClick={() => onUpdateQ(q)} T={t}>Update Question</Btn>
      </div>

      <div style={{ background: t.card, borderRadius: '12px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Voices ({voices.length})</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'featured'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${filter === f ? '#4FC3F7' : t.border}`, background: filter === f ? 'rgba(79,195,247,0.1)' : 'transparent', color: filter === f ? '#4FC3F7' : t.mid, fontSize: '12px', cursor: 'pointer', fontWeight: '500', textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 && <p style={{ color: t.mid, padding: '24px', fontSize: '14px' }}>No voices yet.</p>}
        {filtered.map((v, i) => (
          <div key={v.id} style={{ padding: '16px 24px', borderBottom: i < filtered.length - 1 ? `1px solid ${t.border}` : 'none', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: t.charcoal, fontWeight: '600', fontSize: '14px' }}>{v.author}</span>
                {v.location && <span style={{ color: t.mid, fontSize: '12px' }}>· {v.location}</span>}
                {v.featured && <span style={{ background: 'rgba(217,119,6,0.15)', color: '#D97706', fontSize: '10px', padding: '1px 7px', borderRadius: '20px', fontWeight: '700' }}>Featured</span>}
                {v.likes > 0 && <span style={{ color: '#4FC3F7', fontSize: '12px' }}>♥ {v.likes}</span>}
              </div>
              <p style={{ color: t.body, fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '6px' }}>"{v.text}"</p>
              {v.date && <span style={{ color: t.mid, fontSize: '11px' }}>{v.date}</span>}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <Btn small onClick={() => onToggleFeatured(v.id, !v.featured)} T={t} style={{ fontSize: '11px', background: v.featured ? 'rgba(217,119,6,0.1)' : 'transparent', color: v.featured ? '#D97706' : t.mid, border: `1px solid ${v.featured ? '#D97706' : t.border}` }}>
                {v.featured ? 'Unfeature' : 'Feature'}
              </Btn>
              <Btn small onClick={() => window.confirm('Delete this voice?') && onDelete(v.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', fontSize: '11px' }}>Del</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


/* ─── ADMIN COMMENTS ──────────────────────────────────────────── */
const AdminComments = ({ posts, onApprove, onDelete, T }) => {
  const t = T || getT(false);
  const allComments = posts.flatMap(p => (p.somalia_comments || []).map(c => ({ ...c, postTitle: p.title })));
  const pending = allComments.filter(c => !c.approved);
  const approved = allComments.filter(c => c.approved);
  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '8px' }}>Comment Moderation</h1>
      <p style={{ color: t.mid, fontSize: '13px', marginBottom: '24px' }}>All comments require approval before appearing publicly.</p>
      {pending.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '3px', height: '16px', background: '#EF4444', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Pending ({pending.length})</h3>
          </div>
          {pending.map(c => (
            <div key={c.id} style={{ background: t.card, borderRadius: '12px', padding: '18px 22px', marginBottom: '10px', borderLeft: '3px solid #F59E0B', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '14px' }}>{c.author}</span>
                  <span style={{ color: t.mid, fontSize: '12px', marginLeft: '10px' }}>on: <em>{c.postTitle}</em></span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Btn small onClick={() => onApprove(c.id)} T={t} style={{ background: '#D1FAE5', color: '#065F46', border: 'none', fontSize: '12px' }}>Approve</Btn>
                  <Btn small onClick={() => onDelete(c.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', fontSize: '12px' }}>Delete</Btn>
                </div>
              </div>
              <p style={{ color: t.body, fontSize: '14px', lineHeight: '1.6' }}>{c.text}</p>
              {c.date && <span style={{ color: t.mid, fontSize: '11px', marginTop: '6px', display: 'block' }}>{c.date}</span>}
            </div>
          ))}
        </div>
      )}
      {approved.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '3px', height: '16px', background: '#10B981', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Approved ({approved.length})</h3>
          </div>
          {approved.map(c => (
            <div key={c.id} style={{ background: t.card, borderRadius: '12px', padding: '16px 20px', marginBottom: '8px', borderLeft: '3px solid #10B981', border: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: '600', color: t.charcoal, fontSize: '14px' }}>{c.author}</span>
                  <span style={{ color: t.mid, fontSize: '12px', marginLeft: '10px' }}>on: <em>{c.postTitle}</em></span>
                  <p style={{ color: t.body, fontSize: '13px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</p>
                </div>
                <Btn small onClick={() => onDelete(c.id)} T={t} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', flexShrink: 0 }}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {allComments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: t.card, borderRadius: '12px', border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
          <p style={{ color: t.mid }}>No comments yet.</p>
        </div>
      )}
    </div>
  );
};

/* ─── ADMIN TIMELINE ──────────────────────────────────────────── */
const AdminTimeline = ({ timeline, onUpdate, T }) => {
  const t = T || getT(false);
  const [phases, setPhases] = useState(timeline || []);
  const addPhase = () => setPhases([...phases, { year: '', phase: 'Phase', items: [''] }]);
  const removePhase = (i) => setPhases(phases.filter((_, j) => j !== i));
  const updatePhase = (i, field, val) => setPhases(phases.map((p, j) => j === i ? { ...p, [field]: val } : p));
  const addItem = (i) => setPhases(phases.map((p, j) => j === i ? { ...p, items: [...p.items, ''] } : p));
  const updateItem = (pi, ii, val) => setPhases(phases.map((p, j) => j === pi ? { ...p, items: p.items.map((item, k) => k === ii ? val : item) } : p));
  const removeItem = (pi, ii) => setPhases(phases.map((p, j) => j === pi ? { ...p, items: p.items.filter((_, k) => k !== ii) } : p));
  const iStyle = { padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: '6px', fontSize: '13px', outline: 'none', background: t.inputBg, color: t.charcoal, fontFamily: "'DM Sans',sans-serif" };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal }}>2040 Roadmap</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn small outline onClick={addPhase} T={t}>+ Add Phase</Btn>
          <Btn small onClick={() => onUpdate(phases)} T={t}>Save Timeline</Btn>
        </div>
      </div>
      {phases.map((phase, pi) => (
        <div key={pi} style={{ background: t.card, borderRadius: '12px', padding: '20px', marginBottom: '12px', border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
            <input value={phase.year} onChange={e => updatePhase(pi, 'year', e.target.value)} placeholder="Year" style={{ ...iStyle, width: '80px' }} />
            <input value={phase.phase} onChange={e => updatePhase(pi, 'phase', e.target.value)} placeholder="Phase name" style={{ ...iStyle, flex: 1 }} />
            <button onClick={() => removePhase(pi)} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
          </div>
          {(phase.items || []).map((item, ii) => (
            <div key={ii} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={item} onChange={e => updateItem(pi, ii, e.target.value)} placeholder="Milestone..." style={{ ...iStyle, flex: 1 }} />
              <button onClick={() => removeItem(pi, ii)} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: t.mid, fontSize: '12px' }}>×</button>
            </div>
          ))}
          <button onClick={() => addItem(pi)} style={{ background: 'none', border: `1px dashed ${t.border}`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', color: t.mid, fontSize: '12px', marginTop: '4px' }}>+ Add item</button>
        </div>
      ))}
      {phases.length === 0 && <div style={{ textAlign: 'center', padding: '48px', background: t.card, borderRadius: '12px', border: `1px dashed ${t.border}`, color: t.mid }}>No phases yet. Add one to build the roadmap.</div>}
    </div>
  );
};

/* ─── ADMIN SETTINGS ──────────────────────────────────────────── */
const AdminSettings = ({ setPage, siteTitle, onUpdateTitle, T }) => {
  const t = T || getT(false);
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(siteTitle || 'Hiigsiga');
  const [saved, setSaved] = useState(false);
  const [annMsg, setAnnMsg] = useState('');
  const [annColor, setAnnColor] = useState('#4FC3F7');
  const [annSaved, setAnnSaved] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const saveTitle = async () => { await onUpdateTitle(title); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const saveAnn = async () => { if (!annMsg) return; await saveAnnouncement(annMsg, annColor); setAnnSaved(true); setTimeout(() => setAnnSaved(false), 2000); };
  const clearAnn = async () => { await clearAnnouncement(); setAnnMsg(''); };
  const runScheduled = async () => { const n = await publishScheduledPosts(); setScheduledCount(n); setTimeout(() => setScheduledCount(0), 3000); };
  const COLORS = ['#4FC3F7', '#D97706', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];
  const iStyle = { width: '100%', padding: '9px 11px', border: `1px solid ${t.border}`, borderRadius: '8px', fontSize: '13px', background: t.inputBg, color: t.charcoal, outline: 'none', fontFamily: "'DM Sans',sans-serif" };
  const card = { background: t.card, borderRadius: '12px', padding: '24px', border: `1px solid ${t.border}` };

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '26px', color: t.charcoal, marginBottom: '24px' }}>Settings</h1>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#4FC3F7', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Site Identity</h3>
          </div>
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>SITE NAME</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...iStyle, flex: 1 }} />
            <Btn small onClick={saveTitle} T={t} style={{ background: saved ? '#10B981' : undefined }}>{saved ? '✓' : 'Save'}</Btn>
          </div>
          <p style={{ color: t.mid, fontSize: '12px', marginBottom: '20px' }}>Displays as "<strong style={{ color: t.charcoal }}>{title} 2040</strong>" across the site.</p>
          {[['Site URL', 'politics.mmohamud.me'], ['Admin Email', 'mohamedmohammud@gmail.com']].map(([l, v]) => (
            <div key={l} style={{ marginBottom: '12px' }}>
              <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '3px' }}>{l.toUpperCase()}</label>
              <input defaultValue={v} readOnly style={{ ...iStyle, background: t.soft, color: t.mid, cursor: 'default' }} />
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#D97706', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Announcement Banner</h3>
          </div>
          <p style={{ color: t.mid, fontSize: '13px', marginBottom: '14px', lineHeight: '1.5' }}>Show a sitewide banner — useful for new essays, events, or announcements.</p>
          <label style={{ color: t.mid, fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>MESSAGE</label>
          <textarea value={annMsg} onChange={e => setAnnMsg(e.target.value)} rows={2} placeholder="e.g. New essay published — read it now →" style={{ ...iStyle, resize: 'vertical', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setAnnColor(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer', border: annColor === c ? '3px solid white' : '2px solid transparent', boxShadow: annColor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.15s' }} />
            ))}
          </div>
          {annMsg && <div style={{ background: annColor, borderRadius: '8px', padding: '10px 16px', marginBottom: '12px', textAlign: 'center' }}><span style={{ color: '#FFF', fontSize: '13px', fontWeight: '500' }}>{annMsg}</span></div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn small onClick={saveAnn} T={t} style={{ background: annSaved ? '#10B981' : undefined }}>{annSaved ? '✓ Live' : 'Set Banner'}</Btn>
            <Btn small outline onClick={clearAnn} T={t}>Clear</Btn>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#8B5CF6', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Scheduled Posts</h3>
          </div>
          <p style={{ color: t.mid, fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>Publish any posts whose scheduled time has passed. Run this after the scheduled date.</p>
          <Btn small onClick={runScheduled} T={t} style={{ background: scheduledCount > 0 ? '#10B981' : undefined }}>
            {scheduledCount > 0 ? `✓ Published ${scheduledCount} post${scheduledCount > 1 ? 's' : ''}` : '⏰ Run Scheduler'}
          </Btn>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '3px', height: '16px', background: '#10B981', borderRadius: '2px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '18px', color: t.charcoal }}>Quick Links</h3>
          </div>
          <div onClick={() => setPage('home')} style={{ padding: '11px 0', borderBottom: `1px solid ${t.border}`, cursor: 'pointer', color: t.charcoal, fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#4FC3F7'}
            onMouseLeave={e => e.currentTarget.style.color = t.charcoal}
          ><span>🌐 View Public Site</span><span>→</span></div>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ padding: '11px 0', borderBottom: `1px solid ${t.border}`, cursor: 'pointer', color: t.charcoal, fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#4FC3F7'}
            onMouseLeave={e => e.currentTarget.style.color = t.charcoal}
          ><span>🗄 Supabase Dashboard</span><span>↗</span></a>
        </div>

      </div>
    </div>
  );
};


/* ─── MAIN APP ────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage]         = useState('home');
  const [lang, setLang]         = useState('en');
  const [dark, setDark]         = useState(() => localStorage.getItem('s2040_dark') === 'true');
  const [posts, setPosts]       = useState([]);
  const [voices, setVoices]     = useState([]);
  const [reading, setReading]   = useState([]);
  const [word, setWord]         = useState(null);
  const [wordArchive, setWordArchive] = useState([]);
  const [monthlyQ, setMonthlyQ] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [siteTitle, setSiteTitle] = useState('Hiigsiga');
  const [announcement, setAnnouncement] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => localStorage.getItem('s2040_admin') === 'true');
  const [adminTab, setAdminTab] = useState('dash');
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser]         = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [savedPostIds, setSavedPostIds] = useState([]);

  useEffect(() => { localStorage.setItem('s2040_dark', dark); }, [dark]);

  const T = getT(dark);

  const nav = useCallback((p) => {
    if (p !== 'admin' && p !== 'post') localStorage.setItem('s2040_page', p);
    if (p !== 'admin') trackEvent('page_view', { page: p });
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, v, r, w, q, tl, st, wa] = await Promise.all([
        getPosts(), getVoices(), getReading(),
        getSetting('word_of_week'), getSetting('monthly_question'), getSetting('timeline'),
        getSetting('site_title'), getWordArchive(),
      ]);
      setPosts(p || []); setVoices(v || []); setReading(r || []);
      if (w) setWord(w);
      if (q) setMonthlyQ(typeof q === 'string' ? q : '');
      if (tl) setTimeline(tl);
      if (st) setSiteTitle(typeof st === 'string' ? st : 'Hiigsiga');
      setWordArchive(wa || []);
      try { const ann = await getAnnouncement(); if (ann) setAnnouncement(ann); } catch {}
    } catch (err) { console.error('loadAll error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadAll();
    trackEvent('page_view', { page: 'home' });
    getSession().then(async (session) => {
      if (session?.user) {
        setUser(session.user);
        getProfile(session.user.id).then(setUserProfile);
        getUserSavedPosts(session.user.id).then(setSavedPostIds);
      }
    });
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          getProfile(session.user.id).then(setUserProfile);
          getUserSavedPosts(session.user.id).then(setSavedPostIds);
        } else { setUser(null); setUserProfile(null); setSavedPostIds([]); }
      });
      return () => subscription.unsubscribe();
    } catch (e) { console.error('Auth listener error:', e); }
  }, []);

  useEffect(() => {
    if (page === 'post' && currentPost && posts.length > 0) {
      const found = posts.find(p => p.id === currentPost.id);
      if (found) setCurrentPost(found);
    }
  }, [posts]);

  const handleAuthSuccess = async (authUser) => {
    setUser(authUser);
    const profile = await getProfile(authUser.id);
    setUserProfile(profile);
    const saved = await getUserSavedPosts(authUser.id);
    setSavedPostIds(saved);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null); setUserProfile(null); setSavedPostIds([]);
  };

  const handleSavePost = async (postId) => {
    if (!user) return;
    if (savedPostIds.includes(postId)) {
      await unsavePostForUser(user.id, postId);
      setSavedPostIds(prev => prev.filter(id => id !== postId));
    } else {
      await savePostForUser(user.id, postId);
      setSavedPostIds(prev => [...prev, postId]);
    }
  };

  const handleUpdateProfile = async (updates) => {
    if (!user) return;
    const updated = await updateProfile(user.id, updates);
    if (updated) setUserProfile(updated);
  };

  const adminLogin  = () => { setAdminLoggedIn(true); localStorage.setItem('s2040_admin', 'true'); };
  const adminLogout = () => { setAdminLoggedIn(false); localStorage.removeItem('s2040_admin'); setAdminTab('dash'); nav('home'); };

  const hSaveBlogPost   = async (p) => { await savePost(p); await loadAll(); };
  const hDeletePost     = async (id) => { await deletePost(id); await loadAll(); };
  const hTogglePost     = async (id, field, val) => { await togglePostField(id, field, val); await loadAll(); };
  const hAddComment     = async (c) => { await addComment(c); await loadAll(); };
  const hApproveComment = async (id) => { await approveComment(id); await loadAll(); };
  const hDeleteComment  = async (id) => { await deleteComment(id); await loadAll(); };
  const hAddVoice       = async (v) => { await addVoice(v); await loadAll(); };
  const hToggleVoice    = async (id, val) => { await toggleVoiceFeatured(id, val); await loadAll(); };
  const hDeleteVoice    = async (id) => { await deleteVoice(id); await loadAll(); };
  const hAddBook        = async (b) => { await addBook(b); await loadAll(); };
  const hDeleteBook     = async (id) => { await deleteBook(id); await loadAll(); };
  const hUpdateWord     = async (w) => { await setSetting('word_of_week', w); await loadAll(); };
  const hUpdateQ        = async (q) => { await setSetting('monthly_question', q); await loadAll(); };
  const hUpdateTimeline = async (tl) => { await setSetting('timeline', tl); await loadAll(); };
  const hUpdateTitle    = async (t) => { await setSetting('site_title', t); setSiteTitle(t); };
  const hOpenPost       = useCallback(async (post) => {
    setCurrentPost(post); localStorage.setItem('s2040_post', JSON.stringify({ id: post.id }));
    nav('post'); incrementViews(post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
  }, [nav]);

  const activePost = page === 'post' && currentPost ? (posts.find(p => p.id === currentPost.id) || currentPost) : null;

  // ── Admin render ──
  if (page === 'admin') {
    if (!adminLoggedIn) return (<><GlobalStyles dark={dark} /><AdminLogin onLogin={adminLogin} T={T} /></>);
    return (
      <>
        <GlobalStyles dark={dark} />
        <AdminShell tab={adminTab} setTab={setAdminTab} onLogout={adminLogout} T={T}>
          {adminTab === 'dash'      && <AdminDash posts={posts} voices={voices} T={T} onTabChange={setAdminTab} />}
          {adminTab === 'posts'     && <AdminPosts posts={posts} onSave={hSaveBlogPost} onDelete={hDeletePost} onToggle={hTogglePost} T={T} />}
          {adminTab === 'media'     && <AdminMedia T={T} />}
          {adminTab === 'analytics' && <AdminAnalytics T={T} />}
          {adminTab === 'comments'  && <AdminComments posts={posts} onApprove={hApproveComment} onDelete={hDeleteComment} T={T} />}
          {adminTab === 'community' && <AdminCommunity voices={voices} onToggleFeatured={hToggleVoice} onDelete={hDeleteVoice} monthlyQ={monthlyQ} onUpdateQ={hUpdateQ} T={T} />}
          {adminTab === 'word'      && <AdminWord word={word} wordArchive={wordArchive} onUpdate={hUpdateWord} T={T} />}
          {adminTab === 'reading'   && <AdminReading reading={reading} onAdd={hAddBook} onDelete={hDeleteBook} T={T} />}
          {adminTab === 'timeline'  && <AdminTimeline timeline={timeline} onUpdate={hUpdateTimeline} T={T} />}
          {adminTab === 'settings'  && <AdminSettings setPage={nav} siteTitle={siteTitle} onUpdateTitle={hUpdateTitle} T={T} />}
        </AdminShell>
      </>
    );
  }

  // ── Public render ──
  return (
    <>
      <GlobalStyles dark={dark} />
      <MetaTags page={page} post={page === 'post' ? activePost : null} siteTitle={siteTitle} />
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans',sans-serif", overflowX: 'hidden' }}>
        {announcement && announcement.active && (
          <AnnouncementBanner message={announcement.message} color={announcement.color} />
        )}
        <Nav page={page} setPage={nav} lang={lang} setLang={setLang} dark={dark} setDark={setDark} T={T} siteTitle={siteTitle} user={user} userProfile={userProfile} onShowAuth={() => setShowAuth(true)} onSignOut={handleSignOut} />
        <main id="main-content">
          {loading ? (
            <div style={{ paddingTop: '64px', minHeight: '100vh', maxWidth: '800px', margin: '0 auto', padding: '120px 24px' }}>
              {[['12px','100px','20px'],['48px','70%','14px'],['48px','50%','28px'],['16px','90%'],['16px','80%'],['16px','85%']].map(([h,w,mb],i) => (
                <div key={i} style={{ height: h, width: w || '100%', background: T.border, borderRadius: '8px', marginBottom: mb || '12px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <>
              {page === 'home'    && <HomePage posts={posts} lang={lang} word={word} wordArchive={wordArchive} setPage={nav} setCurrentPost={hOpenPost} voices={voices} dark={dark} T={T} />}
              {page === 'blog'    && <BlogPage posts={posts} lang={lang} setPage={nav} setCurrentPost={hOpenPost} T={T} />}
              {page === 'vision'  && <VisionPage lang={lang} timeline={timeline} T={T} />}
              {page === 'story'   && <StoryPage lang={lang} T={T} />}
              {page === 'reading' && <ReadingPage reading={reading} lang={lang} T={T} />}
              {page === 'connect' && <ConnectPage voices={voices} onVoiceSubmit={hAddVoice} lang={lang} monthlyQ={monthlyQ} T={T} />}
              {page === 'about'   && <MarketingPage setPage={nav} lang={lang} voices={voices} posts={posts} T={T} />}
              {page === 'profile' && (
                user
                  ? <ProfilePage user={user} profile={userProfile} savedPosts={savedPostIds} posts={posts} onUpdateProfile={handleUpdateProfile} onUnsave={handleSavePost} T={T} />
                  : <div style={{ paddingTop: '140px', textAlign: 'center', minHeight: '60vh' }}>
                      <p style={{ color: T.mid, fontSize: '15px', marginBottom: '20px' }}>Sign in to view your profile.</p>
                      <button onClick={() => setShowAuth(true)} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Reader Login</button>
                    </div>
              )}
              {page === 'post' && (
                activePost
                  ? <PostPage post={activePost} lang={lang} setPage={nav} onCommentSubmit={hAddComment} user={user} savedPostIds={savedPostIds} onSavePost={handleSavePost} onShowAuth={() => setShowAuth(true)} T={T} />
                  : <div style={{ paddingTop: '140px', textAlign: 'center', minHeight: '60vh' }}>
                      <p style={{ color: T.mid, fontSize: '15px', marginBottom: '20px' }}>Post not found.</p>
                      <button onClick={() => nav('blog')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>← Back to Blog</button>
                    </div>
              )}
              {!['home','blog','vision','story','reading','connect','about','profile','post'].includes(page) && (
                <div style={{ paddingTop: '140px', textAlign: 'center', minHeight: '60vh' }}>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: '80px', color: T.border, marginBottom: '16px' }}>404</div>
                  <p style={{ color: T.mid, fontSize: '15px', marginBottom: '24px' }}>Page not found.</p>
                  <button onClick={() => nav('home')} style={{ background: '#4FC3F7', color: '#0A0F1A', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Go Home</button>
                </div>
              )}
            </>
          )}
        </main>
        <Footer setPage={nav} T={T} siteTitle={siteTitle} />
        <BackToTop />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} T={T} />}
        {adminLoggedIn && <div onClick={() => { setPage('admin'); window.scrollTo(0,0); }} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#040C16', color: '#4FC3F7', border: '1px solid #1A2D44', padding: '8px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', zIndex: 50, letterSpacing: '1px', userSelect: 'none' }}>⚙ ADMIN</div>}
      </div>
    </>
  );
}
