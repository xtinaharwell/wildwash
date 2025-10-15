"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "backdrop-blur-md bg-white/60 dark:bg-black/50 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/95 flex items-center justify-center shadow-md shrink-0">
                <Link
                    href="/"
                    aria-label="Go to Wild Wash home"
                    title="Wild Wash — Home"
                    className="w-12 h-12 rounded-2xl bg-emerald-500/95 flex items-center justify-center shadow-md shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
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
            <Link href="/services" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Services</Link>
            <Link href="/orders" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Your Orders</Link>
            <Link href="/track" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Track</Link>
            <Link href="/book" className="ml-2 inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium shadow-md hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Book Pickup</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/book" className="md:hidden inline-flex items-center justify-center rounded-full bg-emerald-600 text-white px-3 py-2 text-sm font-semibold shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" aria-label="Book pickup">Book</Link>

            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <svg className={`w-6 h-6 transition-transform ${mobileOpen ? "rotate-90" : "rotate-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden transition-[max-height,opacity] duration-200 ease-out overflow-hidden ${mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="mt-2 rounded-xl bg-white/95 dark:bg-black/60 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <Link href="/services" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Services</Link>
              <Link href="/orders" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Your Orders</Link>
              <Link href="/#how" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">How it works</Link>
              <Link href="/track" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Track</Link>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800" />

              <Link href="/book" onClick={() => setMobileOpen(false)} className="block text-center rounded-lg bg-emerald-600 text-white px-4 py-3 font-semibold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Book Pickup</Link>

              <div className="flex gap-3 mt-2 justify-center">
                <Link href="/contact" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Contact</Link>
                <Link href="/admin" className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Admin</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
