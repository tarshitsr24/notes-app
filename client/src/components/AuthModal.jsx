// client/src/components/AuthModal.jsx
import React, { useState } from "react";
import { API_BASE_URL } from "../config";

function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/register" : "/login";
    const targetUrl = `${API_BASE_URL}/api/auth${endpoint}`;

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error ${res.status}: Request failed`);
      }

      // Save token and dismiss modal
      localStorage.setItem("docs_token", data.token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-white flex flex-col gap-4 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {isRegister ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isRegister
              ? "Register to start creating personal docs"
              : "Sign in to access your saved docs"}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-2 px-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl outline-none text-sm text-white placeholder-zinc-500 focus:border-zinc-500 transition"
          />
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl outline-none text-sm text-white placeholder-zinc-500 focus:border-zinc-500 transition"
          />
        </div>

        {/* Direct onClick button (bypasses form submit issues) */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-blue-600/20"
        >
          {loading ? "Connecting..." : isRegister ? "Sign Up" : "Sign In"}
        </button>

        {/* Bottom toggle button */}
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition text-center cursor-pointer pt-1"
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}

export default AuthModal;