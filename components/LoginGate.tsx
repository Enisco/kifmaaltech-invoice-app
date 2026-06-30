"use client";

import { useState, useEffect, createContext, useContext } from "react";

interface AuthContextValue {
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({ signOut: () => {} });
export const useAuth = () => useContext(AuthContext);

// -----------------------------------------------------------------------------
// Fixed credentials. This is a soft gate to keep apprentices from poking around
// — NOT real security. Anyone who opens browser dev tools can read these. Don't
// rely on it to protect anything sensitive. Change them here.
// -----------------------------------------------------------------------------
const CREDENTIALS = {
  username: process.env.NEXT_PUBLIC_AUTH_USERNAME ?? "",
  password: process.env.NEXT_PUBLIC_AUTH_PASSWORD ?? "",
};
const SESSION_KEY = "kifmaal.auth";

interface LoginGateProps {
  children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "ok");
    setReady(true);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      username.trim() === CREDENTIALS.username &&
      password === CREDENTIALS.password
    ) {
      sessionStorage.setItem(SESSION_KEY, "ok");
      setAuthed(true);
      setError("");
    } else {
      setError("Those details don't match. Check with the office.");
    }
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setUsername("");
    setPassword("");
  }

  // Avoid a flash of the login screen before sessionStorage is read.
  if (!ready) return null;

  if (authed) {
    return (
      <AuthContext.Provider value={{ signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest px-6">
      {/* Ambient solar-panel grid */}
      <div className="panel-grid absolute inset-0 opacity-40" />
      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-solar/30 blur-3xl"
        aria-hidden={true}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl bg-panel/95 p-8 shadow-lift backdrop-blur"
      >
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Sun />
            <span className="font-display text-lg font-700 tracking-tight text-ink">
              KifmaalTech
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">Invoice generator — staff only</p>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
            placeholder="kifmaal"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-forest px-4 py-2.5 text-sm font-600 text-white transition hover:bg-forest2"
        >
          Open the generator
        </button>
      </form>
    </main>
  );
}

function Sun() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
      <circle cx="12" cy="12" r="4.5" fill="#F5A524" />
      {[...Array(8)].map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(a) * 7;
        const y1 = 12 + Math.sin(a) * 7;
        const x2 = 12 + Math.cos(a) * 9.5;
        const y2 = 12 + Math.sin(a) * 9.5;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#F5A524"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
