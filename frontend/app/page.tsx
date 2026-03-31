"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");


  // 🔹 LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  // 🔹 REGISTER
  const handleRegister = async () => {
    if (!name || !email || !password || !role) {
      alert("Fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.msg || "Signup failed");
        return;
      }

      // store token after signup
      localStorage.setItem("token", data.token);

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

        {/* 🔹 GOOGLE */}
        <button
          className="w-full py-2 bg-blue-600 rounded-lg"
          onClick={() =>
            signIn("google", { callbackUrl: "/dashboard" })
          }
        >
          Continue with Google
        </button>

        {/* 🔹 DIVIDER */}
        <div className="flex items-center gap-2 text-gray-400">
          <div className="flex-1 h-px bg-gray-700"></div>
          OR
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* 🔹 FORM */}
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

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
          >
            <option value="">Select Role</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="INTERVIEWER">Interviewer</option>
          </select>

          <button
            onClick={isLogin ? handleLogin : handleRegister}
            className="py-2 bg-green-600 rounded-lg"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </div>

        {/* 🔹 TOGGLE */}
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