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

  // ======= Configure these =======
  const whatsappNumber = "+254 705 415948"; // replace with real E.164 number
  const whatsappText = "Hi%20Wild%20Wash!%20I%20need%20help%20with%20my%20order."; // URL-encoded
  const whatsappHref = `https://api.whatsapp.com/send?phone=${encodeURIComponent(
    whatsappNumber
  )}&text=${whatsappText}`;
  // ==============================

  return (
    <>
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
                <Link href="/#how" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">How it works</Link>
                <Link href="/track" onClick={() => setMobileOpen(false)} className="block text-lg px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Track</Link>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800" />

                <Link href="/book" onClick={() => setMobileOpen(false)} className="block text-center rounded-lg bg-emerald-600 text-white px-4 py-3 font-semibold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Book Pickup</Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Floating WhatsApp button (moved OUTSIDE the header) ---------- */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Wild Wash on WhatsApp"
        className="fixed z-[9999] flex items-center gap-3 rounded-full bg-emerald-500 hover:brightness-95 shadow-lg px-3 py-2 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        // use the safe-area CSS so the button doesn't sit under home indicators / notches
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          right: "calc(env(safe-area-inset-right, 0px) + 16px)",
        }}
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 0 5.373 0 12a11.94 11.94 0 003.48 8.52L0 24l3.6-1.02A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-3.2-1.12-6.16-3.48-8.52z" fill="#25D366"></path>
            <path d="M17.1 14.1c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.67.15-.2.3-.78.96-.95 1.16-.17.2-.34.22-.63.07-.3-.15-1.27-.47-2.42-1.48-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.12.3-.34.45-.51.15-.17.2-.28.3-.47.1-.2 0-.38-.05-.53-.05-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.36-.01-.55-.01-.2 0-.52.07-.79.37-.27.3-1.02 1-1.02 2.44 0 1.44 1.05 2.83 1.2 3.03.15.2 2.08 3.2 5.05 4.49 2.98 1.29 2.98.86 3.52.81.54-.05 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.08-.12-.27-.2-.57-.35z" fill="#FFF"></path>
          </svg>
        </span>

        <span className="hidden sm:inline-block text-sm font-semibold text-white select-none">
          Chat on WhatsApp
        </span>
      </a>
    </>
  );
}
