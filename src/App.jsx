import { useState, useEffect } from "react";
import {
  supabase,
  getPosts, savePost, deletePost, togglePostField,
  addComment, approveComment, deleteComment,
  getVoices, addVoice, toggleVoiceFeatured, deleteVoice,
  getReading, addBook, deleteBook,
  getSetting, setSetting,
} from "./supabase.js";

/* ─── GOOGLE FONTS ───────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #F8FAFB; }
    ::-webkit-scrollbar-thumb { background: #4FC3F7; border-radius: 3px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-up { animation: fadeUp 0.5s ease forwards; }
    .fade-in { animation: fadeIn 0.4s ease forwards; }
  `}</style>
);

/* ─── PALETTE ─────────────────────────────────────────────────── */
const C = {
  white: "#FFFFFF", soft: "#F8FAFB", charcoal: "#1A1A2E",
  blue: "#4FC3F7", blueDark: "#0288D1", gold: "#D97706",
  mid: "#6B7280", border: "#E5E7EB", lightBlue: "#E0F7FF",
};

/* ─── ADMIN CREDS ─────────────────────────────────────────────── */
const ADMIN_EMAIL = "mohamedmohammud@gmail.com";
const ADMIN_PASSWORD = "Kulan@2040!";

/* ─── HELPERS ─────────────────────────────────────────────────── */
const Btn = ({ children, onClick, style = {}, outline, small, gold }) => (
  <button onClick={onClick} style={{
    background: gold ? C.gold : outline ? "transparent" : C.blue,
    color: outline ? C.charcoal : C.white,
    border: outline ? `1.5px solid ${C.border}` : "none",
    padding: small ? "8px 18px" : "12px 28px",
    borderRadius: "6px", fontSize: small ? "12px" : "13px",
    fontFamily: "'DM Sans', sans-serif", fontWeight: "500",
    letterSpacing: "0.5px", cursor: "pointer", transition: "all 0.2s", ...style,
  }}
    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
  >{children}</button>
);

const Tag = ({ children }) => (
  <span style={{ background: C.lightBlue, color: C.blueDark, fontSize: "10px", padding: "3px 10px", borderRadius: "20px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>{children}</span>
);

const Divider = () => <div style={{ height: "1px", background: C.border, margin: "32px 0" }} />;

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px" }}>
    <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

/* ─── NAV ─────────────────────────────────────────────────────── */
const Nav = ({ page, setPage, lang, setLang }) => {
  const links = [
    { label: lang === "en" ? "Vision" : "Aragti", key: "vision" },
    { label: "Blog", key: "blog" },
    { label: lang === "en" ? "My Story" : "Taariikhda", key: "story" },
    { label: lang === "en" ? "Reading List" : "Buugaagta", key: "reading" },
    { label: lang === "en" ? "Let's Connect" : "Xiriirka", key: "connect" },
  ];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.white, fontSize: "14px", fontWeight: "700", fontFamily: "Playfair Display" }}>S</span>
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: C.charcoal, fontWeight: "600" }}>
            Somalia <span style={{ color: C.blue }}>2040</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {links.map(l => (
            <span key={l.key} onClick={() => setPage(l.key)} style={{
              color: page === l.key ? C.blue : C.charcoal, fontSize: "13px", fontWeight: "500",
              cursor: "pointer", borderBottom: page === l.key ? `2px solid ${C.blue}` : "2px solid transparent",
              paddingBottom: "4px", transition: "all 0.2s",
            }}>{l.label}</span>
          ))}
          <button onClick={() => setLang(lang === "en" ? "so" : "en")} style={{
            background: C.soft, border: `1px solid ${C.border}`, borderRadius: "20px",
            padding: "5px 12px", fontSize: "11px", cursor: "pointer",
            fontFamily: "'DM Sans'", color: C.charcoal, fontWeight: "600", letterSpacing: "0.5px",
          }}>{lang === "en" ? "SO" : "EN"}</button>
        </div>
      </div>
    </nav>
  );
};

/* ─── FOOTER ──────────────────────────────────────────────────── */
const Footer = ({ setPage }) => (
  <footer style={{ background: C.charcoal, color: C.white, padding: "48px 24px 24px", marginTop: "80px" }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", marginBottom: "40px" }}>
        <div>
          <div style={{ fontFamily: "Playfair Display", fontSize: "22px", marginBottom: "12px" }}>Somalia <span style={{ color: C.blue }}>2040</span></div>
          <p style={{ color: "#9CA3AF", fontSize: "13px", maxWidth: "260px", lineHeight: "1.7" }}>A space for honest thinking, Somali voices, and the long game toward a better future.</p>
        </div>
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
          {[["vision","Vision"],["blog","Blog"],["story","My Story"],["reading","Reading List"],["connect","Let's Connect"]].map(([key, label]) => (
            <div key={key} onClick={() => setPage(key)} style={{ color: "#9CA3AF", fontSize: "13px", cursor: "pointer" }}
              onMouseEnter={e => e.target.style.color = C.white}
              onMouseLeave={e => e.target.style.color = "#9CA3AF"}
            >{label}</div>
          ))}
        </div>
      </div>
      <div style={{ height: "1px", background: "#374151", margin: "0 0 24px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ color: "#6B7280", fontSize: "12px" }}>2026 politics.mmohamud.me - Somalia 2040</p>
        <a href="https://mmohamud.me" style={{ color: "#6B7280", fontSize: "12px", textDecoration: "none" }}>mmohamud.me</a>
      </div>
    </div>
  </footer>
);

/* ─── HOME PAGE ───────────────────────────────────────────────── */
const HomePage = ({ posts, lang, word, setPage, setCurrentPost, voices }) => {
  const featured = posts.find(p => p.featured && p.published);
  const recent = posts.filter(p => p.published && !p.featured).slice(0, 2);
  const featuredVoice = voices.find(v => v.featured);
  return (
    <div className="fade-in">
      <div style={{ background: `linear-gradient(135deg, ${C.soft} 0%, ${C.lightBlue} 100%)`, padding: "80px 24px 60px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <Tag>{lang === "en" ? "Somalia 2040" : "Soomaaliya 2040"}</Tag>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", color: C.charcoal, fontWeight: "700", lineHeight: "1.2", margin: "20px 0 16px" }}>
            {lang === "en" ? "Building the future Somalia deserves." : "Dhisidda mustaqbalka Soomaaliya mudan."}
          </h1>
          <p style={{ color: C.mid, fontSize: "17px", lineHeight: "1.8", maxWidth: "580px", margin: "0 auto 32px" }}>
            {lang === "en" ? "A personal space for honest thinking, Somali voices, and the long work of imagining what could be." : "Meel shakhsi ah oo loogu talagalay fikraddii daacadda ah, codadka Soomaalida."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => setPage("vision")}>{lang === "en" ? "Read the Vision" : "Akhri Aragtida"}</Btn>
            <Btn outline onClick={() => setPage("blog")}>{lang === "en" ? "Browse Blog" : "Blog-ka"}</Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px" }}>
        {featured && (
          <div style={{ marginBottom: "64px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ height: "2px", width: "32px", background: C.blue }} />
              <span style={{ color: C.mid, fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase" }}>Featured</span>
            </div>
            <div onClick={() => { setCurrentPost(featured); setPage("post"); }} style={{ cursor: "pointer", background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(79,195,247,0.15)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ background: `linear-gradient(135deg, ${C.charcoal}, #2D3748)`, padding: "48px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "240px" }}>
                <span style={{ fontFamily: "Playfair Display", fontSize: "80px", color: C.blue, opacity: 0.3 }}>"</span>
              </div>
              <div style={{ padding: "40px" }}>
                <Tag>Featured Essay</Tag>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: C.charcoal, margin: "16px 0 12px", lineHeight: "1.3" }}>
                  {lang === "en" ? featured.title : (featured.title_so || featured.title)}
                </h2>
                <p style={{ color: C.mid, fontSize: "14px", lineHeight: "1.7", marginBottom: "20px" }}>
                  {lang === "en" ? featured.excerpt : (featured.excerpt_so || featured.excerpt)}
                </p>
                <span style={{ color: C.blue, fontSize: "13px", fontWeight: "500" }}>{featured.date} →</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "48px", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ height: "2px", width: "32px", background: C.gold }} />
              <span style={{ color: C.mid, fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase" }}>Recent Writing</span>
            </div>
            {recent.map(post => (
              <div key={post.id} onClick={() => { setCurrentPost(post); setPage("post"); }} style={{ cursor: "pointer", padding: "24px 0", borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.querySelector("h3").style.color = C.blue}
                onMouseLeave={e => e.currentTarget.querySelector("h3").style.color = C.charcoal}
              >
                <span style={{ color: C.mid, fontSize: "11px" }}>{post.date}</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: C.charcoal, margin: "8px 0 10px", transition: "color 0.2s", lineHeight: "1.3" }}>
                  {lang === "en" ? post.title : (post.title_so || post.title)}
                </h3>
                <p style={{ color: C.mid, fontSize: "14px", lineHeight: "1.6" }}>
                  {lang === "en" ? post.excerpt : (post.excerpt_so || post.excerpt)}
                </p>
              </div>
            ))}
            <div style={{ marginTop: "24px" }}><Btn outline small onClick={() => setPage("blog")}>All posts →</Btn></div>
          </div>

          <div>
            {word && (
              <div style={{ background: C.charcoal, borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
                <div style={{ color: C.blue, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Somali Word of the Week</div>
                <div style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.white, marginBottom: "6px" }}>{word.somali}</div>
                <div style={{ color: C.gold, fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>{word.english}</div>
                <p style={{ color: "#9CA3AF", fontSize: "13px", lineHeight: "1.6", fontStyle: "italic" }}>{word.sentence}</p>
              </div>
            )}
            {featuredVoice && (
              <div style={{ background: C.soft, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px" }}>
                <div style={{ color: C.mid, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Community Voice</div>
                <p style={{ color: C.charcoal, fontSize: "15px", lineHeight: "1.7", fontStyle: "italic", marginBottom: "16px" }}>"{featuredVoice.text}"</p>
                <div style={{ color: C.mid, fontSize: "12px" }}>{featuredVoice.author} - {featuredVoice.location}</div>
                <div style={{ marginTop: "16px" }}><Btn small outline onClick={() => setPage("connect")}>Share Your Voice →</Btn></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── BLOG PAGE ───────────────────────────────────────────────── */
const BlogPage = ({ posts, lang, setPage, setCurrentPost }) => {
  const published = posts.filter(p => p.published);
  return (
    <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}>
      <Tag>Writing</Tag>
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "40px", color: C.charcoal, margin: "16px 0 12px" }}>Blog</h1>
      <p style={{ color: C.mid, fontSize: "15px", lineHeight: "1.7", marginBottom: "48px" }}>
        {lang === "en" ? "Essays, reflections, and perspectives on Somalia, governance, and the diaspora." : "Maqaallo, fikrardo, iyo aragtiyaha ku saabsan Soomaaliya."}
      </p>
      {published.map(post => (
        <div key={post.id} onClick={() => { setCurrentPost(post); setPage("post"); }} style={{ cursor: "pointer", padding: "32px 0", borderBottom: `1px solid ${C.border}` }}
          onMouseEnter={e => e.currentTarget.querySelector("h2").style.color = C.blue}
          onMouseLeave={e => e.currentTarget.querySelector("h2").style.color = C.charcoal}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: C.mid, fontSize: "12px" }}>{post.date}</span>
            {post.featured && <Tag>Featured</Tag>}
          </div>
          <h2 style={{ fontFamily: "Playfair Display", fontSize: "26px", color: C.charcoal, marginBottom: "12px", lineHeight: "1.3", transition: "color 0.2s" }}>
            {lang === "en" ? post.title : (post.title_so || post.title)}
          </h2>
          <p style={{ color: C.mid, fontSize: "14px", lineHeight: "1.7", marginBottom: "16px" }}>
            {lang === "en" ? post.excerpt : (post.excerpt_so || post.excerpt)}
          </p>
          <span style={{ color: C.blue, fontSize: "13px", fontWeight: "500" }}>Read more →</span>
        </div>
      ))}
    </div>
  );
};

/* ─── POST PAGE ───────────────────────────────────────────────── */
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
const VisionPage = ({ lang, timeline }) => (
  <div className="fade-in">
    <div style={{ background: `linear-gradient(135deg, ${C.charcoal} 0%, #2D3748 100%)`, padding: "80px 24px 64px", color: C.white, textAlign: "center" }}>
      <Tag>The Vision</Tag>
      <h1 style={{ fontFamily: "Playfair Display", fontSize: "clamp(32px, 5vw, 48px)", margin: "20px 0 16px", lineHeight: "1.2" }}>
        {lang === "en" ? "What I believe Somalia can become." : "Waxa aan aaminahay in Soomaaliya noqon karto."}
      </h1>
    </div>
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}>
      {[
        { title: lang === "en" ? "On Technology & Governance" : "Teknolojiyada & Xukuumadda", body: lang === "en" ? "Somalia's path forward runs through digital infrastructure. A government that invests in cybersecurity, digital identity, and transparent e-governance will be a government its people can actually trust." : "Jidka Soomaaliya wuxuu maraa kaabayaasha dijital." },
        { title: lang === "en" ? "On the Diaspora" : "Diaspora-da", body: lang === "en" ? "The millions of Somalis living abroad are not a footnote. They are an untapped engine. My vision includes building real, structural channels through which diaspora talent, capital, and experience flow back into Somalia." : "Malaayin Soomaali ah oo dibadda ku nool kuma aha qoraal kooban." },
        { title: lang === "en" ? "On Unity" : "Midnimada", body: lang === "en" ? "Unity comes from building institutions that people trust, systems that are fair, and leadership that listens. That is the kind of unity I want to work toward." : "Midnimadu kuma timaado in dadka lagu kalliftey inay is waafaqaan." },
      ].map((item, i) => (
        <div key={i} style={{ marginBottom: "48px", display: "flex", gap: "16px" }}>
          <div style={{ width: "3px", background: C.blue, borderRadius: "2px", flexShrink: 0, marginTop: "6px" }} />
          <div>
            <h2 style={{ fontFamily: "Playfair Display", fontSize: "26px", color: C.charcoal, marginBottom: "16px" }}>{item.title}</h2>
            <p style={{ color: C.mid, fontSize: "16px", lineHeight: "1.9" }}>{item.body}</p>
          </div>
        </div>
      ))}
      <Divider />
      <h2 style={{ fontFamily: "Playfair Display", fontSize: "28px", color: C.charcoal, marginBottom: "36px" }}>The Roadmap to 2040</h2>
      {timeline && timeline.map((phase, i) => (
        <div key={i} style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
          <div style={{ flexShrink: 0, textAlign: "right", width: "100px" }}>
            <div style={{ color: C.blue, fontSize: "12px", fontWeight: "600" }}>{phase.year}</div>
            <div style={{ color: C.mid, fontSize: "11px" }}>{phase.phase}</div>
          </div>
          <div style={{ width: "1px", background: C.border, flexShrink: 0 }} />
          <div>
            {phase.items.map((item, j) => (
              <div key={j} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
                <span style={{ color: C.charcoal, fontSize: "14px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── STORY PAGE ──────────────────────────────────────────────── */
const StoryPage = ({ lang }) => (
  <div className="fade-in" style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px" }}>
    <Tag>About</Tag>
    <h1 style={{ fontFamily: "Playfair Display", fontSize: "40px", color: C.charcoal, margin: "16px 0 40px" }}>{lang === "en" ? "My Story" : "Taariikhda"}</h1>
    {[
      { heading: lang === "en" ? "Where I come from" : "Xagga aan ka yimid", text: lang === "en" ? "I am Somali, raised in the diaspora, rooted in Columbus, Ohio. My background spans cybersecurity, IT, and community building. I hold degrees in Computer Science and Business, and I am currently completing an MS in Cybersecurity at Western Governors University." : "Waxaan ahay Soomaali, ku koray diaspora, xidid ku leh Columbus, Ohio." },
      { heading: lang === "en" ? "Why politics" : "Sababta siyaasadda", text: lang === "en" ? "It started as a feeling. Not a plan, not a calculation. A quiet but persistent sense that Somalia's future matters, and that people who understand technology, governance, and community have something real to offer." : "Waxay bilaabatay dareen. Maaha qorshe, maahan xisaab." },
      { heading: lang === "en" ? "What I am building" : "Waxa aan dhisayo", text: lang === "en" ? "Through Kulan Group, I am building platforms that serve education, cybersecurity, and community for the Somali diaspora. These projects are not separate from the political vision. They are part of it." : "Iyada oo loo marayo Kulan Group, waxaan dhisayaa barnaamijyo u adeega waxbarashada." },
    ].map((s, i) => (
      <div key={i} style={{ marginBottom: "40px" }}>
        <h2 style={{ fontFamily: "Playfair Display", fontSize: "22px", color: C.charcoal, marginBottom: "12px" }}>{s.heading}</h2>
        <p style={{ color: C.mid, fontSize: "16px", lineHeight: "1.9" }}>{s.text}</p>
      </div>
    ))}
  </div>
);

/* ─── READING PAGE ────────────────────────────────────────────── */
const ReadingPage = ({ reading, lang }) => (
  <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}>
    <Tag>Library</Tag>
    <h1 style={{ fontFamily: "Playfair Display", fontSize: "40px", color: C.charcoal, margin: "16px 0 12px" }}>{lang === "en" ? "Reading List" : "Buugaagta"}</h1>
    <p style={{ color: C.mid, fontSize: "15px", marginBottom: "48px", lineHeight: "1.7" }}>{lang === "en" ? "Books and resources shaping my thinking on Somalia, governance, and leadership." : "Buugaag iyo xogaha qaabeeya fikradayda."}</p>
    {[...new Set(reading.map(r => r.category))].map(cat => (
      <div key={cat} style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ height: "2px", width: "24px", background: C.gold }} />
          <span style={{ color: C.mid, fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>{cat}</span>
        </div>
        {reading.filter(r => r.category === cat).map(book => (
          <div key={book.id} style={{ background: C.soft, borderRadius: "12px", padding: "20px 24px", marginBottom: "12px", borderLeft: `3px solid ${C.blue}` }}>
            <div style={{ fontWeight: "600", color: C.charcoal, fontSize: "16px", marginBottom: "4px" }}>{book.title}</div>
            <div style={{ color: C.blue, fontSize: "13px", marginBottom: "8px" }}>{book.author}</div>
            <p style={{ color: C.mid, fontSize: "13px", lineHeight: "1.6" }}>{book.note}</p>
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ─── CONNECT PAGE ────────────────────────────────────────────── */
const ConnectPage = ({ voices, onVoiceSubmit, lang, monthlyQ }) => {
  const [form, setForm] = useState({ author: "", location: "", text: "" });
  const [submitted, setSubmitted] = useState(false);
  const featured = voices.filter(v => v.featured);
  const others = voices.filter(v => !v.featured);

  const submit = async () => {
    if (!form.author || !form.text) return;
    await onVoiceSubmit({ ...form, featured: false, date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) });
    setSubmitted(true);
  };

  return (
    <div className="fade-in">
      <div style={{ background: `linear-gradient(135deg, ${C.lightBlue}, ${C.soft})`, padding: "64px 24px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
        <Tag>Community</Tag>
        <h1 style={{ fontFamily: "Playfair Display", fontSize: "40px", color: C.charcoal, margin: "16px 0 12px" }}>{lang === "en" ? "Let's Connect" : "Aan Xiriirno"}</h1>
        <p style={{ color: C.mid, maxWidth: "480px", margin: "0 auto", fontSize: "15px", lineHeight: "1.8" }}>
          {lang === "en" ? "This space belongs to every Somali who has something to say. Share your voice." : "Meesha waxay u tahay Soomaali kasta oo wax yidhaahda."}
        </p>
      </div>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 24px" }}>
        {monthlyQ && (
          <div style={{ background: C.charcoal, borderRadius: "16px", padding: "36px", marginBottom: "48px", textAlign: "center" }}>
            <div style={{ color: C.blue, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Monthly Question</div>
            <p style={{ fontFamily: "Playfair Display", fontSize: "22px", color: C.white, lineHeight: "1.5", maxWidth: "560px", margin: "0 auto" }}>"{monthlyQ}"</p>
          </div>
        )}
        {featured.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ height: "2px", width: "24px", background: C.gold }} />
              <span style={{ color: C.mid, fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>Featured Voices</span>
            </div>
            {featured.map(v => (
              <div key={v.id} style={{ background: C.soft, borderRadius: "12px", padding: "24px", marginBottom: "16px", borderLeft: `3px solid ${C.gold}` }}>
                <p style={{ color: C.charcoal, fontSize: "16px", lineHeight: "1.8", fontStyle: "italic", marginBottom: "12px" }}>"{v.text}"</p>
                <span style={{ color: C.mid, fontSize: "12px" }}>{v.author}{v.location ? ` - ${v.location}` : ""}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "48px" }}>
          {others.map(v => (
            <div key={v.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: C.charcoal, fontSize: "14px", lineHeight: "1.7", marginBottom: "12px" }}>"{v.text}"</p>
              <span style={{ color: C.mid, fontSize: "12px" }}>{v.author}{v.location ? ` - ${v.location}` : ""}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.soft, borderRadius: "16px", padding: "40px" }}>
          <h2 style={{ fontFamily: "Playfair Display", fontSize: "26px", color: C.charcoal, marginBottom: "8px" }}>Share Your Voice</h2>
          <p style={{ color: C.mid, fontSize: "14px", marginBottom: "28px" }}>Your submission will be reviewed before it goes live.</p>
          {submitted ? (
            <div style={{ background: C.lightBlue, borderRadius: "8px", padding: "20px", color: C.blueDark, fontSize: "14px" }}>Thank you for sharing. Your voice has been submitted for review.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Your name *"
                  style={{ padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", outline: "none" }} />
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Your city / country"
                  style={{ padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", outline: "none" }} />
              </div>
              <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Your thoughts on Somali politics..." rows={4}
                style={{ width: "100%", padding: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", fontFamily: "DM Sans", fontSize: "14px", resize: "vertical", marginBottom: "16px", outline: "none" }} />
              <Btn onClick={submit}>Submit Your Voice</Btn>
            </>
          )}
        </div>
      </div>
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
const AdminShell = ({ children, tab, setTab, onLogout }) => {
  const tabs = [
    { key: "dash", label: "Dashboard" }, { key: "posts", label: "Blog Posts" },
    { key: "comments", label: "Comments" }, { key: "community", label: "Community" },
    { key: "word", label: "Word of Week" }, { key: "reading", label: "Reading List" },
    { key: "timeline", label: "Timeline" }, { key: "settings", label: "Settings" },
  ];
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.soft }}>
      <div style={{ width: "220px", background: C.charcoal, padding: "24px 0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #374151" }}>
          <div style={{ fontFamily: "Playfair Display", fontSize: "16px", color: C.white }}>Somalia <span style={{ color: C.blue }}>2040</span></div>
          <div style={{ color: "#6B7280", fontSize: "11px", marginTop: "4px" }}>Admin Panel</div>
        </div>
        <div style={{ flex: 1, padding: "16px 0" }}>
          {tabs.map(t => (
            <div key={t.key} onClick={() => setTab(t.key)} style={{ padding: "11px 20px", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: tab === t.key ? C.blue : "#9CA3AF", background: tab === t.key ? "rgba(79,195,247,0.08)" : "transparent", borderLeft: tab === t.key ? `3px solid ${C.blue}` : "3px solid transparent", transition: "all 0.15s" }}>{t.label}</div>
          ))}
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div onClick={onLogout} style={{ color: "#6B7280", fontSize: "12px", cursor: "pointer" }}
            onMouseEnter={e => e.target.style.color = "#EF4444"}
            onMouseLeave={e => e.target.style.color = "#6B7280"}
          >← Logout</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>{children}</div>
    </div>
  );
};

/* ─── ADMIN DASHBOARD ─────────────────────────────────────────── */
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
export default function App() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("en");
  const [posts, setPosts] = useState([]);
  const [voices, setVoices] = useState([]);
  const [reading, setReading] = useState([]);
  const [word, setWord] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [monthlyQ, setMonthlyQ] = useState("");
  const [currentPost, setCurrentPost] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState("dash");
  const [loading, setLoading] = useState(true);

  /* ── Load all data ── */
  const loadAll = async () => {
    setLoading(true);
    const [p, v, r, w, q, t] = await Promise.all([
      getPosts(), getVoices(), getReading(),
      getSetting("word_of_week"), getSetting("monthly_question"), getSetting("timeline"),
    ]);
    setPosts(p); setVoices(v); setReading(r);
    if (w) setWord(w);
    if (q) setMonthlyQ(q);
    if (t) setTimeline(t);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const nav = (p) => { setPage(p); window.scrollTo(0, 0); };

  /* ── Post handlers ── */
  const handleSavePost = async (post) => { await savePost(post); await loadAll(); };
  const handleDeletePost = async (id) => { await deletePost(id); setPosts(posts.filter(p => p.id !== id)); };
  const handleTogglePost = async (id, field, value) => { await togglePostField(id, field, value); await loadAll(); };

  /* ── Comment handlers ── */
  const handleAddComment = async (comment) => { await addComment(comment); await loadAll(); };
  const handleApproveComment = async (id) => { await approveComment(id); await loadAll(); };
  const handleDeleteComment = async (id) => { await deleteComment(id); await loadAll(); };

  /* ── Voice handlers ── */
  const handleAddVoice = async (voice) => { const v = await addVoice(voice); if (v) setVoices([...voices, v]); };
  const handleToggleVoice = async (id, featured) => { await toggleVoiceFeatured(id, featured); await loadAll(); };
  const handleDeleteVoice = async (id) => { await deleteVoice(id); setVoices(voices.filter(v => v.id !== id)); };

  /* ── Reading handlers ── */
  const handleAddBook = async (book) => { const b = await addBook(book); if (b) setReading([...reading, b]); };
  const handleDeleteBook = async (id) => { await deleteBook(id); setReading(reading.filter(r => r.id !== id)); };

  /* ── Settings handlers ── */
  const handleUpdateWord = async (w) => { await setSetting("word_of_week", w); setWord(w); };
  const handleUpdateQ = async (q) => { await setSetting("monthly_question", q); setMonthlyQ(q); };
  const handleUpdateTimeline = async (t) => { await setSetting("timeline", t); setTimeline(t); };

  /* ── Admin mode ── */
  if (page === "admin") {
    if (!adminLoggedIn) return (<><FontLink /><AdminLogin onLogin={() => setAdminLoggedIn(true)} /></>);
    return (
      <>
        <FontLink />
        <AdminShell tab={adminTab} setTab={setAdminTab} onLogout={() => { setAdminLoggedIn(false); nav("home"); }}>
          {adminTab === "dash" && <AdminDash posts={posts} voices={voices} />}
          {adminTab === "posts" && <AdminPosts posts={posts} onSave={handleSavePost} onDelete={handleDeletePost} onToggle={handleTogglePost} />}
          {adminTab === "comments" && <AdminComments posts={posts} onApprove={handleApproveComment} onDelete={handleDeleteComment} />}
          {adminTab === "community" && <AdminCommunity voices={voices} onToggleFeatured={handleToggleVoice} onDelete={handleDeleteVoice} monthlyQ={monthlyQ} onUpdateQ={handleUpdateQ} />}
          {adminTab === "word" && <AdminWord word={word} onUpdate={handleUpdateWord} />}
          {adminTab === "reading" && <AdminReading reading={reading} onAdd={handleAddBook} onDelete={handleDeleteBook} />}
          {adminTab === "timeline" && <AdminTimeline timeline={timeline} onUpdate={handleUpdateTimeline} />}
          {adminTab === "settings" && <AdminSettings setPage={nav} />}
        </AdminShell>
      </>
    );
  }

  return (
    <>
      <FontLink />
      <div style={{ minHeight: "100vh", background: C.white, fontFamily: "'DM Sans', sans-serif" }}>
        <Nav page={page} setPage={nav} lang={lang} setLang={setLang} />
        {loading ? <Spinner /> : (
          <>
            {page === "home" && <HomePage posts={posts} lang={lang} word={word} setPage={nav} setCurrentPost={setCurrentPost} voices={voices} />}
            {page === "blog" && <BlogPage posts={posts} lang={lang} setPage={nav} setCurrentPost={setCurrentPost} />}
            {page === "post" && currentPost && <PostPage post={posts.find(p => p.id === currentPost.id) || currentPost} lang={lang} setPage={nav} onCommentSubmit={handleAddComment} />}
            {page === "vision" && <VisionPage lang={lang} timeline={timeline} />}
            {page === "story" && <StoryPage lang={lang} />}
            {page === "reading" && <ReadingPage reading={reading} lang={lang} />}
            {page === "connect" && <ConnectPage voices={voices} onVoiceSubmit={handleAddVoice} lang={lang} monthlyQ={monthlyQ} />}
          </>
        )}
        <Footer setPage={nav} />
        <div onClick={() => nav("admin")} style={{ position: "fixed", bottom: "24px", right: "24px", background: C.charcoal, color: C.white, padding: "10px 16px", borderRadius: "30px", fontSize: "12px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontWeight: "500", letterSpacing: "0.5px" }}>
          Admin →
        </div>
      </div>
    </>
  );
}
