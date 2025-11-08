"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/redux/features/authSlice";
import type { RootState } from "@/redux/store";

export default function NavBar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    dispatch(logout());
    setProfileOpen(false);
    router.push("/");
  };

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "backdrop-blur-md bg-white/80 dark:bg-[#071025]/90 shadow-sm border-b border-white/10" : "bg-white/60 dark:bg-[#071025]/60 backdrop-blur-sm border-b border-white/5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <svg className={`w-6 h-6 transition-transform ${mobileOpen ? "rotate-90" : "rotate-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-500/95 flex items-center justify-center shadow-md shrink-0">
                <Link
                    href="/"
                    aria-label="Go to Wild Wash home"
                    title="Wild Wash — Home"
                    className="w-12 h-12 rounded-2xl bg-red-500/95 flex items-center justify-center shadow-md shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                    <span className="font-bold text-white select-none">WW</span>
                </Link>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold leading-none">Wild Wash</h1>
              <p className="text-xs opacity-85 text-slate-700 dark:text-slate-300">Smart laundry, cleaning & fumigation</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-3">
            <Link href="/services" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Services</Link>
            <Link href="/orders" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Your Orders</Link>
            <Link href="/financing" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Financing</Link>
            <Link href="/book" className="ml-2 inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium shadow-md hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Book Pickup</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/book" className="md:hidden inline-flex items-center justify-center rounded-full bg-red-600 text-white px-3 py-2 text-sm font-semibold shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300" aria-label="Book pickup">Book</Link>

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setProfileOpen(false)}>
                        Your Profile
                      </Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                Sign in
              </Link>
            )}


          </div>
        </div>
      </div>

      <div className={`md:hidden transition-[max-height,opacity] duration-200 ease-out overflow-hidden ${mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="mt-2 rounded-xl bg-white/95 dark:bg-black/60 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <Link href="/services" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Services</Link>
              <Link href="/orders" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Your Orders</Link>
              <Link href="/#how" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">How it works</Link>
              <Link href="/financing" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Financing</Link>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800" />

              <Link href="/book" onClick={() => setMobileOpen(false)} className="block text-center rounded-lg bg-red-600 text-white px-4 py-3 font-semibold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Book Pickup</Link>

              <div className="flex gap-3 mt-2 justify-center">
                <Link href="/rider" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Rider</Link>
                <Link href="/staff" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Staff</Link>
                <Link href="/admin" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Admin</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
