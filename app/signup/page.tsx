"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../../redux/features/authSlice";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example hard-coded locations - replace with API call if you have a locations endpoint
  const locations = ["Juja", "Thika", "Makongeni", "Runda", "Wendani", "KM"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          phone: formData.phone,
          password: formData.password,
          location: formData.location,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || body || `Status ${res.status}`);
      }

      // After successful registration, attempt to login
      const loginRes = await fetch(`${API_BASE}/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!loginRes.ok) {
        router.push("/login");
        return;
      }

      const data = await loginRes.json();
      const token = data?.token ?? data?.access ?? null;
      const user = data?.user;

      if (token && user) {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        dispatch(setAuth(user));
        router.push("/");
        return;
      }
      
      router.push("/login");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-md mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">Create an account</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="text-red-600 hover:text-red-500">
              Sign in instead
            </Link>
            .
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow space-y-4">
          <div>
            <label className="text-xs text-slate-500">Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="Choose a username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Phone Number</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="+254 123456789"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Location</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">Select a location</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ username: "", phone: "", password: "", confirmPassword: "", location: "" });
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
