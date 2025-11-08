"use client"

import React, { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setSent("Please enter a valid email.");
      return;
    }
    setSent("Subscribing...");
    setTimeout(() => setSent("Thanks — we'll send updates to " + email), 900);
    setEmail("");
  }

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white/80 via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] backdrop-blur-sm p-6 md:p-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/95 dark:bg-slate-800 flex items-center justify-center shadow-md">
              <img src="/favicon.png" alt="Wild Wash" className="h-8 w-8" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Wild Wash</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Smart laundry, cleaning & fumigation — tracked & stress-free</div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            <div>Phone: <a href="tel:+254705415948" className="font-medium text-gray-900 hover:text-red-600 dark:text-gray-100 dark:hover:text-red-500 transition-colors duration-200">+254 705 415948</a></div>
            <div className="mt-1">Email: <a href="mailto:hello@wildwash.co" className="font-medium text-gray-900 hover:text-red-600 dark:text-gray-100 dark:hover:text-red-500 transition-colors duration-200">hello@wildwash.co</a></div>
            {/* <div className="mt-2">Service hours: Mon–Sat 7:00–19:00 · Sun 8:00–14:00</div> */}
          </div>

          <div className="mt-6 flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <a aria-label="Instagram" href="#" className="p-2 rounded-md text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7z"/></svg>
            </a>
            <a aria-label="Twitter" href="#" className="p-2 rounded-md text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M19 7.5c.01.14.01.28.01.42 0 4.28-3.26 9.22-9.22 9.22-1.83 0-3.53-.55-4.96-1.5.25.03.5.04.76.04 1.52 0 2.92-.52 4.04-1.39-1.42-.03-2.62-.97-3.03-2.27.2.04.41.06.62.06.3 0 .59-.04.86-.12-1.48-.3-2.59-1.6-2.59-3.16v-.04c.43.24.92.39 1.45.41-1.36-.91-1.2-2.87.25-3.64 1.24-.69 2.78-.01 3.18.61.99-.2 1.92-.56 2.77-1.06-.32 1-1 1.74-1.88 2.23.87-.1 1.7-.33 2.47-.67-.57.84-1.3 1.57-2.12 2.16z"/></svg>
            </a>
            <a aria-label="Facebook" href="#" className="p-2 rounded-md text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M13 3h3v3h-3c-1.1 0-2 .9-2 2v2h5l-1 4h-4v7h-4v-7H6v-4h3V8a5 5 0 0 1 5-5z"/></svg>
            </a>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <div className="font-semibold text-gray-900 dark:text-gray-100">Explore</div>
          <Link href="/services" className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200 text-sm">Services</Link>
          <Link href="/book" className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200 text-sm">Book Pickup</Link>
          <Link href="/track" className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200 text-sm">Track Order</Link>
          <Link href="/contact" className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors duration-200 text-sm">Contact</Link>
        </nav>

        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">Get updates</div>
          <form onSubmit={handleSubscribe} className="mt-2 flex gap-2">
            <label htmlFor="newsletter" className="sr-only">Email address</label>
            <input 
              id="newsletter" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@domain.com" 
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-red-400" 
            />
            <button 
              type="submit" 
              className="rounded-md bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Subscribe
            </button>
          </form>
          {sent && <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{sent}</div>}

          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Wild Wash · 
            <a href="/" className="hover:text-red-600 dark:hover:text-red-500 transition-colors duration-200 underline ml-1">
              wildwash.co
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
