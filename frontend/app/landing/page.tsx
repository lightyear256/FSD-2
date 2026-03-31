"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ChatMessage {
  own: boolean;
  who: string;
  msg: string;
}

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface Step {
  n: string;
  title: string;
  body: React.ReactNode;
}

interface StatItem {
  num: string;
  unit: string;
  desc: string;
}

const GlobalStyles = () => (
  <style>{`
    :root {
      --bg: #06080f; --bg2: #0c0f1a; --bg3: #10152a;
      --surface: rgba(255,255,255,.04); --surface2: rgba(255,255,255,.07);
      --border: rgba(255,255,255,.08); --border2: rgba(255,255,255,.14);
      --text: #e8eaf2; --muted: #6b7280; --muted2: #9ca3af;
      --cyan: #00d9ff; --cyan-dim: rgba(0,217,255,.12);
      --green: #00e5a0; --accent2: #7c6ff7;
    }
    @keyframes pulse {
      0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)}
    }
    @keyframes fadeUp {
      from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
    }
    .badge-dot{width:6px;height:6px;border-radius:50%;background:var(--cyan);animation:pulse 2s ease infinite;display:inline-block;flex-shrink:0}
    .status-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 2s ease infinite;display:inline-block}
    .fu0{animation:fadeUp .6s ease both}
    .fu1{animation:fadeUp .6s .1s ease both}
    .fu2{animation:fadeUp .6s .2s ease both}
    .fu3{animation:fadeUp .6s .3s ease both}
    .fu4{animation:fadeUp .6s .4s ease both}
    .fu5{animation:fadeUp .8s .5s ease both}
    .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
    .reveal.visible{opacity:1;transform:translateY(0)}
    .feat-card{background:var(--bg2);transition:background .3s;position:relative;overflow:hidden}
    .feat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan-dim),transparent);opacity:0;transition:opacity .3s}
    .feat-card:hover{background:var(--bg3)}
    .feat-card:hover::after{opacity:1}
    .step-item{display:flex;gap:1.25rem;align-items:flex-start;opacity:.4;transition:opacity .3s;cursor:default}
    .step-item.active{opacity:1}
    .step-num{width:36px;height:36px;border-radius:10px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted2);flex-shrink:0;transition:all .3s}
    .step-item.active .step-num{background:var(--cyan-dim);border-color:rgba(0,217,255,.3);color:var(--cyan)}
    .tech-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:.5rem 1rem;border-radius:8px;background:var(--surface);border:1px solid var(--border2);color:var(--muted2);transition:all .2s;cursor:default}
    .tech-pill:hover{color:var(--text);background:var(--surface2);border-color:rgba(255,255,255,.2)}
    .noise{background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")}
    .cta-box::before{content:'';position:absolute;inset:-1px;border-radius:24px;background:linear-gradient(135deg,rgba(0,217,255,.2),rgba(124,111,247,.15),rgba(0,229,160,.1));z-index:-1}
    input::placeholder{color:var(--muted)}
    input:focus{border-color:rgba(0,217,255,.4)!important;outline:none}
  `}</style>
);

const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: "linear-gradient(135deg,#00d9ff,#7c6ff7)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}
  >
    <svg viewBox="0 0 16 16" fill="none" width={size * 0.5} height={size * 0.5}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
    </svg>
  </div>
);

const UserAvatar = ({ size = 28, opacity = 0.5 }: { size?: number; opacity?: number }) => (
  <svg viewBox="0 0 24 24" fill={`rgba(107,114,128,${opacity})`} width={size} height={size}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 border-b"
      style={{ background: "rgba(6,8,15,.7)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}
    >
      <a href="#" className="flex items-center gap-2.5 no-underline">
        <LogoIcon />
        <span style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>
          PeerRoom
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        {[["Features", "#features"], ["How it works", "#how"], ["Technology", "#tech"]].map(([l, h]) => (
          <li key={l}><a href={h} style={{ fontSize: 14, color: "var(--muted2)", textDecoration: "none" }}>{l}</a></li>
        ))}
      </ul>

      <div className="flex items-center gap-4">
        <a href="#" className="text-sm font-medium px-4 py-2 rounded-lg transition-all no-underline"
          style={{ color: "var(--muted2)" }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--surface)"; (e.target as HTMLElement).style.color = "var(--text)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "var(--muted2)"; }}>
          Sign in
        </a>
        <a href="#" className="text-sm font-medium px-5 py-2 rounded-lg transition-all no-underline"
          style={{ background: "var(--cyan)", color: "var(--bg)" }}>
          Get Started
        </a>
      </div>
    </nav>
  );
}

function Badge({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="inline-flex items-center gap-1.5"
      style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--cyan)", background: "var(--cyan-dim)", border: "1px solid rgba(0,217,255,.2)", borderRadius: 100, padding: "0.35rem 0.9rem", ...style }}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}

const chatMessages: ChatMessage[] = [
  { own: false, who: "Peer", msg: "Hey! Can you see my screen?" },
  { own: true, who: "You", msg: "Not yet, let me try sharing" },
  { own: false, who: "Peer", msg: "Let's start with the first question" },
];

function AppMockup() {
  return (
    <div className="fu5 w-full max-w-[960px] mx-auto mt-16 relative">
      <div className="absolute -inset-0.5 -z-10 rounded-[18px]"
        style={{ background: "linear-gradient(135deg,rgba(0,217,255,.3),rgba(124,111,247,.2),rgba(0,229,160,.15))", filter: "blur(1px)" }} />

      <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--bg2)", borderColor: "var(--border)", boxShadow: "0 80px 120px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.05)" }}>
        <div className="flex items-center gap-2.5 px-5 py-3 border-b" style={{ background: "rgba(255,255,255,.03)", borderColor: "var(--border)" }}>
          <div className="flex gap-1.5">
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
          </div>
          <div className="flex-1 text-center py-1 px-3 rounded-md max-w-[300px] mx-auto"
            style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,.04)", border: "1px solid var(--border)" }}>
            peerroom.io/room/69322998-5545...
          </div>
          <div className="w-11" />
        </div>

        <div className="grid h-[420px]" style={{ gridTemplateColumns: "1fr 260px" }}>
          <div className="flex flex-col" style={{ background: "#080a12" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: "rgba(255,255,255,.02)", borderColor: "var(--border)" }}>
              <span style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, color: "var(--muted)" }}>69322998-5545-4a67...</span>
              <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--green)" }}>
                <span className="status-dot" /> Connected
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative" style={{ background: "#050709" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ background: "linear-gradient(135deg,#1a1f3a,#2a2040)", borderColor: "var(--border2)" }}>
                  <UserAvatar size={28} opacity={0.5} />
                </div>
                <span style={{ fontSize: 12, color: "var(--muted2)" }}>Waiting for peer…</span>
              </div>
              <div className="absolute bottom-14 right-3 w-[100px] h-[68px] rounded-[10px] overflow-hidden" style={{ border: "1px solid var(--border2)" }}>
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg,#1a3050,#0d1e36)" }}>
                  <UserAvatar size={20} opacity={0.4} />
                </div>
                <span className="absolute bottom-0 left-0 right-0 text-center py-0.5" style={{ fontSize: 9, color: "rgba(255,255,255,.6)", background: "rgba(0,0,0,.4)" }}>You</span>
              </div>
            </div>

            <div className="flex justify-center gap-2.5 py-2.5 border-t" style={{ background: "rgba(255,255,255,.02)", borderColor: "var(--border)" }}>
              {[
                { stroke: "#9ca3af", danger: false, path: <><path d="M8 2v7M5.5 4.5a3 3 0 005 0M4 11a5 5 0 008 0" /></> },
                { stroke: "#9ca3af", danger: false, path: <><rect x="2" y="4" width="8" height="8" rx="1.5" /><path d="M10 6.5l4-2v7l-4-2" /></> },
                { stroke: "#e74c3c", danger: true, path: <><path d="M1 8.5c2.5-3.5 11.5-3.5 14 0" strokeLinecap="round" /><path d="M3 10.5l-2 3M13 10.5l2 3" strokeLinecap="round" /></> },
              ].map((btn, i) => (
                <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: btn.danger ? "rgba(231,76,60,.2)" : "rgba(255,255,255,.05)", border: `1px solid ${btn.danger ? "rgba(231,76,60,.3)" : "var(--border)"}` }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke={btn.stroke} strokeWidth="1.5" width={14} height={14}>{btn.path}</svg>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col border-l" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <div className="px-3.5 py-2.5 border-b text-xs font-medium" style={{ background: "rgba(255,255,255,.02)", borderColor: "var(--border)", color: "var(--muted2)" }}>Chat</div>
            <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
              {chatMessages.map(({ own, who, msg }, i) => (
                <div key={i} className={`flex flex-col gap-0.5 ${own ? "items-end" : "items-start"}`}>
                  <span style={{ fontSize: 9, color: "var(--muted)", padding: "0 4px" }}>{who}</span>
                  <div style={{ fontSize: 11, padding: "6px 10px", borderRadius: own ? "10px 10px 3px 10px" : "10px 10px 10px 3px", maxWidth: "90%", lineHeight: 1.4, background: own ? "rgba(0,217,255,.15)" : "rgba(255,255,255,.07)", color: own ? "rgba(0,217,255,.9)" : "var(--muted2)" }}>
                    {msg}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 p-2.5 border-t" style={{ background: "rgba(255,255,255,.02)", borderColor: "var(--border)" }}>
              <div className="flex-1 h-7 flex items-center px-2.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 10, color: "var(--muted)" }}>Message…</div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cyan)" }}>
                <svg viewBox="0 0 12 12" fill="none" stroke="#06080f" strokeWidth="1.5" width={11} height={11}><path d="M1 6h10M7 2l4 4-4 4" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 overflow-hidden z-10">
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
        style={{ background: "radial-gradient(ellipse at center,rgba(0,217,255,.08) 0%,rgba(124,111,247,.06) 40%,transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-[30%] w-[600px] h-[400px]"
        style={{ background: "radial-gradient(ellipse at center,rgba(0,229,160,.05) 0%,transparent 65%)" }} />

      <div className="fu0"><Badge>WebRTC · Peer-to-Peer · Zero latency</Badge></div>

      <h1 className="fu1 font-normal leading-[1.08] tracking-tight max-w-3xl mt-8"
        style={{ fontFamily: "Instrument Serif,Georgia,serif", fontSize: "clamp(3rem,7vw,6rem)", color: "var(--text)" }}>
        The interview room<br />
        <em className="italic" style={{ color: "var(--cyan)" }}>built for engineers</em>
      </h1>

      <p className="fu2 max-w-[520px] mx-auto mt-6 leading-[1.7]" style={{ fontSize: "1.15rem", color: "var(--muted2)", fontWeight: 300 }}>
        Create a private video room in seconds. No installs, no accounts — just share a link and start your technical interview.
      </p>

      <div className="fu3 flex items-center gap-4 mt-2 flex-wrap justify-center">
        <a href="#" className="inline-flex items-center gap-2 no-underline transition-all"
          style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 500, color: "var(--bg)", background: "var(--cyan)", padding: "0.85rem 2rem", borderRadius: 10 }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.opacity = ".9"; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 16px 40px rgba(0,217,255,.25)"; }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.opacity = "1"; el.style.transform = "none"; el.style.boxShadow = "none"; }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1012 0A6 6 0 002 8zm8.5-1.5L7 9V5l3.5 1.5z" fill="currentColor" /></svg>
          Get Started
        </a>
        <a href="#" className="no-underline transition-all"
          style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 500, color: "var(--text)", background: "none", border: "1px solid var(--border2)", padding: "0.85rem 2rem", borderRadius: 10 }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.background = "var(--surface)"; el.style.borderColor = "rgba(255,255,255,.2)"; }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.background = "none"; el.style.borderColor = "var(--border2)"; }}>
          Login
        </a>
      </div>

     

      <AppMockup />
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="py-12 px-4 text-center z-10 relative border-t border-b" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,.01)" }}>
      <p className="mb-6" style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 12, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Trusted by engineering teams at
      </p>
      <div className="flex items-center justify-center gap-12 flex-wrap">
        {["STRIPE", "VERCEL", "LINEAR", "SUPABASE", "CLERK", "TURSO"].map((n) => (
          <span key={n} style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 13, color: "var(--muted)", opacity: .5, letterSpacing: "0.05em", fontWeight: 500, transition: "opacity .2s", cursor: "default" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = ".5")}>
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}

const features: Feature[] = [
  { title: "Instant rooms", desc: "Generate a unique room URL in one click. Share it — your peer joins in seconds.", icon: <svg viewBox="0 0 20 20" fill="none" stroke="var(--cyan)" strokeWidth="1.5" width={20} height={20}><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2.5" /></svg> },
  { title: "P2P video & audio", desc: "WebRTC handles the connection directly — your video travels peer-to-peer with minimal latency.", icon: <svg viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.5" width={20} height={20}><path d="M3 10c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7" /><path d="M3 10h5M14 6l-4 4" /></svg> },
  { title: "In-room chat", desc: "Send messages, share links, and paste code snippets without leaving the room.", icon: <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent2)" strokeWidth="1.5" width={20} height={20}><path d="M4 4h12v9H4zM7 17h6" /><path d="M10 13v4" /></svg> },
  { title: "Video controls", desc: "Mute, disable camera, or leave with one click. Picture-in-picture keeps your local feed always visible.", icon: <svg viewBox="0 0 20 20" fill="none" stroke="var(--cyan)" strokeWidth="1.5" width={20} height={20}><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></svg> },
  { title: "Auto-reconnect", desc: "ICE candidate buffering and clean state resets keep calls alive through network hiccups.", icon: <svg viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.5" width={20} height={20}><path d="M10 3a7 7 0 100 14A7 7 0 0010 3z" /><path d="M10 7v3l2 2" /></svg> },
  { title: "2-person rooms", desc: "Rooms hold exactly two participants — private by design. No uninvited guests, ever.", icon: <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent2)" strokeWidth="1.5" width={20} height={20}><path d="M17 11a5 5 0 01-10 0V6" /><path d="M7 3l-4 4 4 4" /></svg> },
];

function Features() {
  const ref = useReveal();
  return (
    <section id="features" ref={ref} className="reveal z-10 relative py-32 px-4 max-w-[1100px] mx-auto">
      <div className="text-center mb-20">
        <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "var(--cyan)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Features</div>
        <h2 className="font-normal tracking-tight leading-[1.15] mb-4" style={{ fontFamily: "Instrument Serif,Georgia,serif", fontSize: "clamp(2rem,4vw,3.2rem)", color: "var(--text)" }}>
          Everything you need<br />for a <em className="italic" style={{ color: "var(--cyan)" }}>great interview</em>
        </h2>
        <p style={{ fontSize: "1.05rem", color: "var(--muted2)", maxWidth: 480, margin: "0 auto", fontWeight: 300 }}>
          Built on WebRTC so video goes peer-to-peer — no server in the middle, no lag, no recordings.
        </p>
      </div>
      <div className="grid rounded-[20px] overflow-hidden border" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5px", background: "var(--border)", borderColor: "var(--border)" }}>
        {features.map(({ title, desc, icon }) => (
          <div key={title} className="feat-card p-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>{icon}</div>
            <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>{title}</h3>
            <p style={{ fontSize: "0.92rem", color: "var(--muted2)", lineHeight: 1.65, fontWeight: 300 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps: Step[] = [
  { n: "01", title: "Create a room", body: "Hit the button — a UUID room is provisioned instantly in the database and your browser grabs camera/mic access." },
  { n: "02", title: "Share the link", body: "Copy the URL from the address bar and send it to your peer. When they open it, the Socket.IO signaling fires." },
  {
    n: "03", title: "Peer connects", body: (
      <>The server emits{" "}
        <code style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, color: "var(--cyan)", background: "var(--cyan-dim)", padding: "1px 5px", borderRadius: 4 }}>ready</code>
        , user 1 creates an SDP offer, user 2 answers — ICE negotiation completes and video starts flowing.</>
    )
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const ref = useReveal();

  useEffect(() => {
    const t = setInterval(() => setActive((s) => (s + 1) % steps.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="how" ref={ref} className="reveal z-10 relative py-32 px-4 max-w-[1100px] mx-auto">
      <div className="grid gap-24 items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "var(--cyan)", textTransform: "uppercase", marginBottom: "0.75rem" }}>How it works</div>
          <h2 className="font-normal tracking-tight leading-[1.15] mb-10" style={{ fontFamily: "Instrument Serif,Georgia,serif", fontSize: "clamp(2rem,4vw,3rem)", color: "var(--text)" }}>
            From zero to live in<br /><em className="italic" style={{ color: "var(--cyan)" }}>three steps</em>
          </h2>
          <div className="flex flex-col gap-10">
            {steps.map(({ n, title, body }, i) => (
              <div key={n} className={`step-item${active === i ? " active" : ""}`}>
                <div className="step-num" style={{ fontFamily: "IBM Plex Mono,monospace" }}>{n}</div>
                <div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>{title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--muted2)", fontWeight: 300, lineHeight: 1.6 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center">
          <svg viewBox="0 0 300 200" width={300} height={200}>
            <line x1="80" y1="60" x2="220" y2="60" stroke="rgba(0,217,255,.3)" strokeWidth="1.5" strokeDasharray="5 3">
              <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="3s" repeatCount="indefinite" />
            </line>
            {[{ x1: 80, y1: 60, x2: 150, y2: 150 }, { x1: 220, y1: 60, x2: 150, y2: 150 }].map((l, i) => (
              <line key={i} {...l} stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4 4">
                <animate attributeName="stroke-dashoffset" from="0" to="-60" dur="4s" repeatCount="indefinite" />
              </line>
            ))}
            {[
              { cx: 80, cy: 60, fill: "rgba(0,217,255,.07)", stroke: "rgba(0,217,255,.3)", label: "USER 1", sub: "Caller", lc: "rgba(0,217,255,", },
              { cx: 220, cy: 60, fill: "rgba(0,229,160,.07)", stroke: "rgba(0,229,160,.3)", label: "USER 2", sub: "Answerer", lc: "rgba(0,229,160,", },
              { cx: 150, cy: 155, fill: "rgba(124,111,247,.07)", stroke: "rgba(124,111,247,.3)", label: "SERVER", sub: "Signaling", lc: "rgba(124,111,247,", },
            ].map(({ cx, cy, fill, stroke, label, sub, lc }) => (
              <g key={label}>
                <circle cx={cx} cy={cy} r={32} fill={fill} stroke={stroke} strokeWidth="1" />
                <text x={cx} y={cy - 4} textAnchor="middle" fill={`${lc}.8)`} fontSize="9" fontFamily="IBM Plex Mono">{label}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fill={`${lc}.4)`} fontSize="8" fontFamily="IBM Plex Mono">{sub}</text>
              </g>
            ))}
            <text x="150" y="42" textAnchor="middle" fill="rgba(0,217,255,.5)" fontSize="8" fontFamily="IBM Plex Mono">P2P video stream</text>
            <text x="150" y="52" textAnchor="middle" fill="rgba(0,217,255,.25)" fontSize="7" fontFamily="IBM Plex Mono">▶ ▶ ▶</text>
          </svg>
        </div>
      </div>
    </section>
  );
}

const stats: StatItem[] = [
  { num: "<50", unit: "ms", desc: "Avg. ICE negotiation time" },
  { num: "0", unit: "", desc: "Server hops for video — pure P2P" },
  { num: "100", unit: "%", desc: "Open source · self-hostable" },
];

function Stats() {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal z-10 relative py-20 px-4 border-t border-b" style={{ borderColor: "var(--border)", background: "var(--bg2)" }}>
      <div className="max-w-[900px] mx-auto grid grid-cols-3 gap-8 text-center">
        {stats.map(({ num, unit, desc }) => (
          <div key={desc} className="p-4">
            <div className="font-normal leading-none tracking-tight" style={{ fontFamily: "Instrument Serif,Georgia,serif", fontSize: "clamp(2.5rem,5vw,4rem)", color: "var(--text)", letterSpacing: "-0.03em" }}>
              <em className="italic" style={{ color: "var(--cyan)" }}>{num}</em>{unit}
            </div>
            <div className="mt-2" style={{ fontSize: 14, color: "var(--muted)", fontWeight: 300 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const techTags = ["Next.js 14", "TypeScript", "WebRTC", "Socket.IO", "Node.js", "Express", "Prisma", "PostgreSQL", "Tailwind CSS", "STUN / ICE"];

function TechStack() {
  const ref = useReveal();
  return (
    <section id="tech" ref={ref} className="reveal z-10 relative py-32 px-4 max-w-[900px] mx-auto text-center">
      <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "var(--cyan)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Built with</div>
      <h2 className="font-normal tracking-tight leading-[1.15] mb-3" style={{ fontFamily: "Instrument Serif,Georgia,serif", fontSize: "clamp(2rem,4vw,3rem)", color: "var(--text)" }}>
        Modern stack,<br /><em className="italic" style={{ color: "var(--green)" }}>zero magic</em>
      </h2>
      <p className="mb-14" style={{ fontSize: "1rem", color: "var(--muted2)", maxWidth: 480, margin: "0 auto 3.5rem", fontWeight: 300 }}>
        Every layer is visible and replaceable. No black boxes, no vendor lock-in.
      </p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {techTags.map((tag) => (
          <span key={tag} className="tech-pill" style={{ fontFamily: "IBM Plex Mono,monospace" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--cyan)", opacity: .7, display: "inline-block" }} />
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal z-10 relative py-32 px-4 text-center overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]"
        style={{ background: "radial-gradient(ellipse at center,rgba(0,217,255,.06),rgba(124,111,247,.04) 50%,transparent 70%)" }} />
      <div className="cta-box relative max-w-[600px] mx-auto border rounded-3xl px-12 py-16" style={{ background: "var(--bg2)", borderColor: "var(--border2)" }}>
        <div className="flex justify-center mb-6"><Badge>Free to use</Badge></div>
        <h2 className="font-normal tracking-tight leading-[1.15] mb-4" style={{ fontFamily: "Instrument Serif,Georgia,serif", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "var(--text)" }}>
          Ready to run your<br /><em className="italic" style={{ color: "var(--cyan)" }}>next interview?</em>
        </h2>
        <p className="mb-8" style={{ fontSize: "1rem", color: "var(--muted2)", fontWeight: 300 }}>Create a room, share the link, interview in seconds.</p>
        <div className="flex gap-2 max-w-[400px] mx-auto">
          <input type="email" placeholder="your@email.com" className="flex-1 h-12 px-4 rounded-xl border transition-all"
            style={{ background: "var(--surface)", borderColor: "var(--border2)", fontSize: 14, color: "var(--text)", outline: "none", fontFamily: "Outfit,sans-serif" }} />
          <button className="h-12 px-6 rounded-xl font-semibold whitespace-nowrap transition-all"
            style={{ background: "var(--cyan)", color: "var(--bg)", fontFamily: "Outfit,sans-serif", fontSize: 14, border: "none", cursor: "pointer" }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.opacity = ".88"; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.opacity = "1"; el.style.transform = "none"; }}>
            Get started
          </button>
        </div>
        <p className="mt-4" style={{ fontSize: 12, color: "var(--muted)" }}>No credit card · No install · Just works</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="z-10 relative px-4 py-12 flex items-center justify-between max-w-[1100px] mx-auto border-t" style={{ borderColor: "var(--border)" }}>
      <a href="#" className="flex items-center gap-2.5 no-underline">
        <LogoIcon size={26} />
        <span style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>PeerRoom</span>
      </a>
      <ul className="flex gap-8 list-none">
        {["GitHub", "Docs", "Privacy"].map((l) => (
          <li key={l}><a href="#" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>{l}</a></li>
        ))}
      </ul>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>© 2026 PeerRoom</span>
    </footer>
  );
}

function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) e.target.classList.add("visible"); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

export default function PeerRoomPage() {
  return (
    <>
      <GlobalStyles />
      <div className="noise pointer-events-none fixed inset-0 z-0 opacity-40" />

      <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "Outfit,sans-serif", lineHeight: 1.6, overflowX: "hidden" }}>
        <Nav />
        <Hero />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Stats />
        <TechStack />
        <CTA />
        <Footer />
      </div>
    </>
  );
}