"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { role: contextRole } = useRole();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

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

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.msg || "Login failed. Please try again.");
        return;
      }
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.msg || "Signup failed. Please try again.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.removeItem("selectedRole");
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
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
  };

  const handleGoogleSignIn = () => {
    const finalRole = contextRole || role;
    if (finalRole) localStorage.setItem("selectedRole", finalRole);
    signIn("google", { callbackUrl: `/post-auth?role=${finalRole}` });
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="panel w-full max-w-md p-7 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <p className="mono text-xs uppercase tracking-[0.14em] text-white/60">
            Authentication
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/60 transition hover:text-white cursor-pointer"
          >
            Home
          </button>
        </div>

        <h1 className="text-2xl font-medium text-white">
          {isLogin ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {isLogin
            ? "Continue to your interview workspace."
            : "Set up your account and continue as interviewer or candidate."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-white/[0.03] p-1 text-sm">
          <button
            onClick={() => handleSwitch(true)}
            className={`rounded-md px-3 py-2 transition cursor-pointer ${
              isLogin ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => handleSwitch(false)}
            className={`rounded-md px-3 py-2 transition cursor-pointer ${
              !isLogin
                ? "bg-white text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm text-white transition hover:border-white/25 hover:bg-white/[0.04] cursor-pointer"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-white/45">
            or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3">
          {!isLogin && (
            <input
              className="w-full rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          )}

          <input
            className="w-full rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />

          <input
            className="w-full rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />

          {!isLogin && (
            <select
              className="w-full rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/30"
              value={role}
              title="auth"
              onChange={(e) => {
                setRole(e.target.value);
                setError("");
              }}
            >
              <option value="">Select role</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="INTERVIEWER">Interviewer</option>
            </select>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          className="mt-5 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          onClick={isLogin ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading
            ? isLogin
              ? "Signing in..."
              : "Creating account..."
            : isLogin
              ? "Sign in"
              : "Create account"}
        </button>
      </section>
    </main>
  );
}
