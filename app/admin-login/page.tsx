"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Loading from "./loading";
import { handleLogin, LOGIN_ENDPOINTS } from "@/lib/api/loginHelpers";
import { Spinner } from "@/components";
import type { RootState } from "@/redux/store";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  // If already authenticated as admin, redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole === 'admin') {
      router.push(redirect);
    }
  }, [isAuthenticated, isLoading, userRole, router, redirect]);

  // Show loading state while auth is initializing
  if (isLoading) {
    return <Loading />;
  }

  // If authenticated as admin, show nothing (redirect is happening)
  if (isAuthenticated && userRole === 'admin') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await handleLogin(
      LOGIN_ENDPOINTS.ADMIN,
      { username, password },
      dispatch
    );

    if (result.success) {
      router.push(redirect);
    } else {
      setError(result.error || "An error occurred during login");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/80 dark:bg-white/5 backdrop-blur rounded-2xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Please login with your admin credentials
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/50 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm shadow-sm placeholder-slate-400
                         focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm shadow-sm placeholder-slate-400
                         focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>
    </div>
  );
}