"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";

export default function AuthPage() {
  const router = useRouter();
  const { role: contextRole } = useRole(); // ✅ read from context

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    // ✅ Prefer context role (still alive if no redirect yet)
    if (contextRole) {
      setRole(contextRole);
      setIsLogin(false);
      return;
    }
    // ✅ Fallback to localStorage (page was refreshed)
    const storedRole = localStorage.getItem("selectedRole");
    if (storedRole) {
      setRole(storedRole);
      setIsLogin(false);
    }
  }, [contextRole]);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.msg || "Login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      alert("Fill all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.msg || "Signup failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.removeItem("selectedRole"); // ✅ cleanup
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 flex flex-col gap-6">

        <h1 className="text-2xl font-bold text-center">
          {isLogin ? "Login" : "Register"}
        </h1>

        {/* GOOGLE */}
        <button
          className="w-full py-2 bg-blue-600 rounded-lg"
          onClick={() => {
            const finalRole = contextRole || role; 
            if (finalRole) localStorage.setItem("selectedRole", finalRole);
            signIn("google", { callbackUrl: `/post-auth?role=${finalRole}` });
          }}
        >
          Continue with Google
        </button>

        {/* DIVIDER */}
        <div className="flex items-center gap-2 text-gray-400">
          <div className="flex-1 h-px bg-gray-700"></div>
          OR
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* FORM */}
        <div className="flex flex-col gap-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
          />

          <button
            onClick={isLogin ? handleLogin : handleRegister}
            className="py-2 bg-green-600 rounded-lg"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </div>

        {/* TOGGLE */}
        <p className="text-sm text-center text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register" : "Login"}
          </span>
        </p>

      </div>
    </div>
  );
}