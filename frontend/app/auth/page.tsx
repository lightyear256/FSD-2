"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";

// ─── Styles ──────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

    :root {
      --bg: #06080f;
      --bg2: #0c0f1a;
      --bg3: #10152a;
      --surface: rgba(255,255,255,.04);
      --surface2: rgba(255,255,255,.07);
      --border: rgba(255,255,255,.08);
      --border2: rgba(255,255,255,.14);
      --text: #e8eaf2;
      --muted: #6b7280;
      --muted2: #9ca3af;
      --cyan: #00d9ff;
      --cyan-dim: rgba(0,217,255,.12);
      --green: #00e5a0;
      --accent2: #7c6ff7;
      --red: #ff4d6a;
      --red-dim: rgba(255,77,106,.12);
    }

    @keyframes pulse {
      0%,100%{opacity:1;transform:scale(1)}
      50%{opacity:.5;transform:scale(.8)}
    }
    @keyframes fadeUp {
      from{opacity:0;transform:translateY(16px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes slideIn {
      from{opacity:0;transform:translateX(-10px)}
      to{opacity:1;transform:translateX(0)}
    }
    @keyframes shimmer {
      0%{background-position:-200% center}
      100%{background-position:200% center}
    }

    .badge-dot {
      width:6px;height:6px;border-radius:50%;
      background:var(--cyan);
      animation:pulse 2s ease infinite;
      display:inline-block;flex-shrink:0;
    }

    .auth-card {
      animation: fadeUp .5s ease both;
      position: relative;
    }
    .auth-card::before {
      content:'';
      position:absolute;inset:-1px;
      border-radius:25px;
      background:linear-gradient(135deg,rgba(0,217,255,.15),rgba(124,111,247,.1),rgba(0,229,160,.08));
      z-index:-1;
    }

    .field-group {
      animation: slideIn .4s ease both;
    }

    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0px 1000px #0c0f1a inset !important;
      -webkit-text-fill-color: #e8eaf2 !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .auth-input {
      width:100%;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 10px;
      padding: .75rem 1rem;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      color: var(--text);
      transition: border-color .2s, background .2s, box-shadow .2s;
      outline: none;
    }
    .auth-input::placeholder { color: var(--muted); }
    .auth-input:focus {
      border-color: rgba(0,217,255,.4);
      background: rgba(0,217,255,.03);
      box-shadow: 0 0 0 3px rgba(0,217,255,.06);
    }
    .auth-input.error {
      border-color: rgba(255,77,106,.4);
      background: var(--red-dim);
    }

    .auth-select {
      width:100%;
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: 10px;
      padding: .75rem 1rem;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      color: var(--text);
      transition: border-color .2s, background .2s;
      outline: none;
      appearance: none;
      cursor: pointer;
    }
    .auth-select:focus {
      border-color: rgba(0,217,255,.4);
      background: rgba(0,217,255,.03);
      box-shadow: 0 0 0 3px rgba(0,217,255,.06);
    }
    .auth-select option { background: #0c0f1a; color: #e8eaf2; }

    .btn-primary {
      width:100%;
      background: var(--cyan);
      color: var(--bg);
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      padding: .85rem 1.5rem;
      cursor: pointer;
      transition: opacity .2s, transform .2s, box-shadow .2s;
    }
    .btn-primary:hover:not(:disabled) {
      opacity: .9;
      transform: translateY(-1px);
      box-shadow: 0 12px 32px rgba(0,217,255,.22);
    }
    .btn-primary:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .btn-google {
      width:100%;
      background: var(--surface2);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid var(--border2);
      border-radius: 10px;
      padding: .8rem 1.5rem;
      cursor: pointer;
      transition: background .2s, border-color .2s, transform .2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .btn-google:hover {
      background: rgba(255,255,255,.08);
      border-color: rgba(255,255,255,.2);
      transform: translateY(-1px);
    }

    .tab-btn {
      flex:1;
      padding: .6rem 1rem;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all .2s;
      border-radius: 8px;
      letter-spacing: .04em;
    }
    .tab-btn.active {
      background: var(--cyan-dim);
      color: var(--cyan);
      border: 1px solid rgba(0,217,255,.25);
    }
    .tab-btn.inactive {
      background: transparent;
      color: var(--muted);
      border: 1px solid transparent;
    }
    .tab-btn.inactive:hover {
      color: var(--muted2);
      background: var(--surface);
    }

    .noise {
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")
    }

    .loading-dots::after {
      content: '';
      animation: dots 1.2s steps(4, end) infinite;
    }
    @keyframes dots {
      0%  { content: ''; }
      25% { content: '.'; }
      50% { content: '..'; }
      75% { content: '...'; }
    }

    .select-wrapper { position: relative; }
    .select-arrow {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--muted);
    }
  `}</style>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.25,
    background: "linear-gradient(135deg,#00d9ff,#7c6ff7)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    <svg viewBox="0 0 16 16" fill="none" width={size * 0.5} height={size * 0.5}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
    </svg>
  </div>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 500,
    color: "var(--muted2)", letterSpacing: "0.06em", textTransform: "uppercase",
    display: "block", marginBottom: "0.5rem",
  }}>
    {children}
  </label>
);

const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em" }}>OR</span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const { role: contextRole } = useRole(); // ✅ read from context

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  // ✅ Seed role + switch to register if arriving from role selection
  useEffect(() => {
    if (contextRole) {
      setRole(contextRole);
      setIsLogin(false);
      return;
    }
    const storedRole = localStorage.getItem("selectedRole");
    if (storedRole) {
      setRole(storedRole);
      setIsLogin(false);
    }
  }, [contextRole]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.msg || "Login failed. Please try again."); return; }
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !role) { setError("Please fill in all fields."); return; }
    setError("");
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.msg || "Signup failed. Please try again."); return; }
      localStorage.setItem("token", data.token);
      localStorage.removeItem("selectedRole"); // ✅ cleanup after successful register
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError("");
    setName(""); setEmail(""); setPassword(""); setRole("");
  };

  // ─── Google sign-in: pass role via callbackUrl + preserve in localStorage ──

  const handleGoogleSignIn = () => {
    const finalRole = contextRole || role;
    if (finalRole) localStorage.setItem("selectedRole", finalRole);
    signIn("google", { callbackUrl: `/post-auth?role=${finalRole}` });
  };

  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <>
      <GlobalStyles />

      {/* Noise overlay */}
      <div
        className="noise"
        style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.4, pointerEvents: "none" }}
      />

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 500,
          background: "radial-gradient(ellipse at center, rgba(0,217,255,.07) 0%, rgba(124,111,247,.05) 40%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-5%", left: "30%",
          width: 500, height: 400,
          background: "radial-gradient(ellipse at center, rgba(0,229,160,.04) 0%, transparent 65%)",
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.25rem 3rem",
        background: "rgba(6,8,15,.7)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <LogoIcon />
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>
            PeerRoom
          </span>
        </a>
        <a
          href="/"
          style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.05em", transition: "color .2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
        >
          ← Back to home
        </a>
      </nav>

      {/* Main */}
      <main style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "6rem 1rem 2rem",
        fontFamily: "Outfit, sans-serif",
        position: "relative", zIndex: 10,
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <LogoIcon size={48} />
            </div>
            <h1 style={{
              fontFamily: "Instrument Serif, Georgia, serif",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 400,
              color: "var(--text)", lineHeight: 1.15, letterSpacing: "-0.01em",
              margin: "0 0 .75rem",
            }}>
              {isLogin ? "Welcome back" : "Join PeerRoom"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted2)", fontWeight: 300, lineHeight: 1.6 }}>
              {isLogin
                ? "Sign in to access your interview rooms."
                : "Create an account to start hosting interviews."}
            </p>
          </div>

          {/* Card */}
          <div
            className="auth-card"
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "2rem",
              position: "relative",
            }}
          >
            {/* Tabs */}
            <div style={{
              display: "flex", gap: 6, marginBottom: "1.75rem",
              background: "var(--surface)", padding: 4, borderRadius: 12,
              border: "1px solid var(--border)",
            }}>
              <button className={`tab-btn ${isLogin ? "active" : "inactive"}`} onClick={() => handleSwitch(true)}>
                Sign In
              </button>
              <button className={`tab-btn ${!isLogin ? "active" : "inactive"}`} onClick={() => handleSwitch(false)}>
                Register
              </button>
            </div>

            {/* Google */}
            <button className="btn-google" onClick={handleGoogleSignIn}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div style={{ margin: "1.5rem 0" }}>
              <Divider />
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {!isLogin && (
                <div className="field-group">
                  <Label>Full Name</Label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                  />
                </div>
              )}

              <div className="field-group">
                <Label>Email</Label>
                <input
                  className={`auth-input${error && !email ? " error" : ""}`}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                />
              </div>

              <div className="field-group">
                <Label>Password</Label>
                <input
                  className={`auth-input${error && !password ? " error" : ""}`}
                  type="password"
                  placeholder={isLogin ? "Your password" : "Min. 8 characters"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                />
              </div>

              {!isLogin && (
                <div className="field-group">
                  <Label>Role</Label>
                  <div className="select-wrapper">
                    <select
                      className="auth-select"
                      value={role}
                      title="auth"
                      onChange={e => { setRole(e.target.value); setError(""); }}
                    >
                      <option value="">Select your role</option>
                      <option value="CANDIDATE">Candidate</option>
                      <option value="INTERVIEWER">Interviewer</option>
                    </select>
                    <span className="select-arrow">
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width={12} height={12}>
                        <path d="M2 4l4 4 4-4" />
                      </svg>
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: ".75rem 1rem",
                  background: "var(--red-dim)",
                  border: "1px solid rgba(255,77,106,.2)",
                  borderRadius: 10,
                }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="var(--red)" strokeWidth="1.5" width={14} height={14}>
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--red)", lineHeight: 1.5 }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                className="btn-primary"
                onClick={isLogin ? handleLogin : handleRegister}
                disabled={loading}
                style={{ marginTop: ".25rem" }}
              >
                {loading ? (
                  <span>
                    {isLogin ? "Signing in" : "Creating account"}
                    <span className="loading-dots" />
                  </span>
                ) : (
                  isLogin ? "Sign in →" : "Create account →"
                )}
              </button>
            </div>

            {/* Forgot password */}
            {isLogin && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <a
                  href="#"
                  style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.04em", transition: "color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--cyan)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                >
                  Forgot password?
                </a>
              </div>
            )}
          </div>

          {/* Toggle link */}
          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 13, color: "var(--muted)", fontWeight: 300 }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => handleSwitch(!isLogin)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--cyan)", fontSize: 13,
                fontFamily: "Outfit, sans-serif", fontWeight: 500,
                textDecoration: "underline", textUnderlineOffset: 3,
                padding: 0, transition: "opacity .2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = ".75")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {isLogin ? "Register here" : "Sign in"}
            </button>
          </p>

          {/* Footer badge */}
          <p style={{
            textAlign: "center", marginTop: "1rem",
            fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--muted)",
            letterSpacing: "0.04em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span className="badge-dot" />
            No credit card · No install · Just works
          </p>

        </div>
      </main>
    </>
  );
}