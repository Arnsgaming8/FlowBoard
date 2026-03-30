"use client";

import { useState } from "react";
import { login, register, recover, resetPassword } from "@/lib/api";

interface AuthPageProps {
  onAuth: (token: string, user: { id: number; email: string }) => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register" | "recover" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("reset") : null;

  if (resetToken && mode !== "reset") {
    setMode("reset");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const data = await login(email, password);
        onAuth(data.token, data.user);
      } else if (mode === "register") {
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const data = await register(email, password);
        onAuth(data.token, data.user);
      } else if (mode === "recover") {
        const data = await recover(email);
        setMessage(data.message);
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
        const data = await resetPassword(resetToken!, password);
        setMessage(data.message);
        setMode("login");
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  const titles = {
    login: "Sign in to FlowBoard",
    register: "Create your account",
    recover: "Reset your password",
    reset: "Set new password",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-indigo-500">Flow</span>Board
          </h1>
          <p className="text-neutral-500 text-sm mt-1">{titles[mode]}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          {mode !== "reset" && (
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-white"
              />
            </div>
          )}

          {mode !== "recover" && (
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                {mode === "reset" ? "New Password" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-white"
              />
            </div>
          )}

          {mode === "reset" && (
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-white"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {message && <p className="text-green-400 text-xs">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : mode === "recover" ? "Send Recovery Email" : "Reset Password"}
          </button>

          <div className="flex flex-col gap-1 text-center">
            {mode === "login" && (
              <>
                <button type="button" onClick={() => { setMode("register"); setError(""); setMessage(""); }} className="text-xs text-indigo-400 hover:text-indigo-300">
                  Create an account
                </button>
                <button type="button" onClick={() => { setMode("recover"); setError(""); setMessage(""); }} className="text-xs text-neutral-500 hover:text-neutral-400">
                  Forgot password?
                </button>
              </>
            )}
            {mode === "register" && (
              <button type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-xs text-indigo-400 hover:text-indigo-300">
                Already have an account? Sign in
              </button>
            )}
            {mode === "recover" && (
              <button type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-xs text-indigo-400 hover:text-indigo-300">
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
