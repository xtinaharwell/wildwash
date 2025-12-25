"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import RouteGuard from "../../components/RouteGuard";
import BNPLManager from "../../components/BNPLManager";
import { client } from "../../lib/api/client";

type Offer = {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  discount_amount: number;
  code: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  is_claimed: boolean;
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      setError(null);

      try {
        const response = await client.get('/offers');
        // Ensure we always have an array, even if empty
        const offersData = Array.isArray(response) ? response : response.results || [];
        setOffers(offersData);
      } catch (err: any) {
        setError(err.message || "Failed to load offers");
        console.error("Error fetching offers:", err);
        // Ensure offers is always an array even on error
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  async function claimOffer(id: number) {
    try {
      await client.post(`/offers/${id}/claim`);

      // Refresh offers list to update claim status
      const updatedOffers = offers.map(offer => 
        offer.id === id ? { ...offer, is_claimed: true } : offer
      );
      setOffers(updatedOffers);
    } catch (err: any) {
      setError(err.message || "Failed to claim offer");
      console.error("Error claiming offer:", err);
    }
  }

  const filtered = offers.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.title.toLowerCase().includes(q) || 
      o.description.toLowerCase().includes(q) || 
      o.code.toLowerCase().includes(q) ||
      (o.discount_percent > 0 ? `${o.discount_percent}%`.includes(q) : '')
    );
  });

  return (
    <RouteGuard>
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Offers — This week</h1>
        </header>

        <section className="mb-6 flex gap-3 items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search offers" className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300" />
          <button onClick={() => setSubscribed((s) => !s)} className={`px-3 py-2 rounded text-sm ${subscribed ? 'bg-red-600 text-white' : 'bg-slate-100'}`}>{subscribed ? 'Subscribed' : 'Subscribe'}</button>
        </section>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BNPL Manager */}
            <div className="rounded-2xl overflow-hidden">
              <BNPLManager />
            </div>

            {/* Offers list */}
            {loading ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">Loading offers…</div>
            ) : error ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">No offers found.</div>
            ) : (
              filtered.map((o) => (
                <article key={o.id} className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{o.title}</div>
                      <div className="text-sm text-slate-600 mt-2">{o.description}</div>
                      <div className="mt-2 text-xs text-slate-500">Code: {o.code}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        {o.discount_percent > 0 
                          ? `${o.discount_percent}% OFF`
                          : `KSh ${o.discount_amount} OFF`}
                      </div>
                      {o.max_uses && (
                        <div className="text-xs text-slate-500 mt-2">
                          {o.max_uses - o.current_uses} of {o.max_uses} remaining
                        </div>
                      )}
                      {o.valid_until && (
                        <div className="text-xs text-slate-500 mt-1">
                          Expires {new Date(o.valid_until).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {o.is_claimed ? (
                      <div className="px-3 py-2 rounded bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
                        Claimed ✓
                      </div>
                    ) : (
                      <button 
                        onClick={() => claimOffer(o.id)} 
                        className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                      >
                        Claim Offer
                      </button>
                    )}
                    <div className="ml-auto text-xs text-slate-500">
                      {o.current_uses} claimed
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>

      </div>
    </div>
    </RouteGuard>
  );
}
