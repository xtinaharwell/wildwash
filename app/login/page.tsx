"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { handleLogin, LOGIN_ENDPOINTS } from "@/lib/api/loginHelpers";
import { Spinner } from "@/components";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    
    const result = await handleLogin(
      LOGIN_ENDPOINTS.USER,
      { username, password },
      dispatch
    );

    if (result.success) {
      // Get the redirect URL from the search params
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect') || '/';
      router.push(redirectUrl);
    } else {
      setError(result.error || "Login failed");
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-md mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sign in to your account or{" "}
            <a href="/signup" className="text-red-600 hover:text-red-500">
              create a new account
            </a>
            .
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow space-y-4">
          <div>
            <label className="text-xs text-slate-500">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <Spinner className="h-4 w-4 text-white -ml-1 mr-2" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername("");
                setPassword("");
                setError(null);
              }}
              className="rounded-md border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-sm"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
