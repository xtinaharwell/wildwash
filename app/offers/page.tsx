"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Offer = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  badge?: string;
  price?: string;
  expires?: string; // ISO
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [bnplOptIn, setBnplOptIn] = useState(false);
  const [showBnplModal, setShowBnplModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // sample offers for the week
    const sample: Offer[] = [
      { id: "o1", title: "25% off Standard Wash", subtitle: "This week only", description: "Save on all Standard (Wash + Fold) packages. Valid for first 3kg.", badge: "Popular", price: "KSh 1,260", expires: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "o2", title: "Free Pickup for New Customers", description: "No pickup fee for your first order when you sign up this week.", badge: "New", expires: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "o3", title: "Premium Delicate Care — 15% off", description: "Extra care for delicates with free garment inspection.", price: "KSh 1,370", expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    const t = setTimeout(() => {
      setOffers(sample);
      setLoading(false);
    }, 350);

    return () => clearTimeout(t);
  }, []);

  function claimOffer(id: string) {
    // TODO: connect to API — for now just simulate
    alert(`Offer ${id} claimed! We'll apply it at checkout.`);
  }

  function openBnpl() {
    setShowBnplModal(true);
  }

  function handleBnplOptIn() {
    if (!phone.trim()) return alert("Enter a phone number to opt in.");
    // simulate opt-in
    setBnplOptIn(true);
    setShowBnplModal(false);
    alert("You're opted into Buy Now Pay Later. We'll send a confirmation SMS.");
  }

  const filtered = offers.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || (o.badge || "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Offers — This week</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Hand-picked deals and a safe way to split payment with Buy Now Pay Later.</p>
        </header>

        <section className="mb-6 flex gap-3 items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search offers" className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300" />
          <button onClick={() => setSubscribed((s) => !s)} className={`px-3 py-2 rounded text-sm ${subscribed ? 'bg-red-600 text-white' : 'bg-slate-100'}`}>{subscribed ? 'Subscribed' : 'Subscribe'}</button>
        </section>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BNPL card */}
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold">Buy Now, Pay Later</div>
                <div className="mt-2 text-sm text-slate-600">Split your order into 2 interest-free payments at checkout. Easy approvals using your phone number.</div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button onClick={openBnpl} className="px-3 py-2 rounded bg-red-600 text-white text-sm">Opt in to BNPL</button>
                <Link href="/help/bnpl" className="text-sm underline">Learn more</Link>
                <div className="ml-auto text-xs text-slate-500">{bnplOptIn ? 'Opted in' : 'Not opted in'}</div>
              </div>
            </div>

            {/* CTA card */}
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">Weekly highlights</div>
                  <div className="mt-2 text-xs text-slate-600">Top picks to save on your next wash.</div>
                </div>
                <div className="text-sm text-slate-500">Ends soon</div>
              </div>

              <div className="mt-3 text-sm text-slate-700">Use these offers at checkout. You can claim them now and they will apply automatically when eligible.</div>
            </div>

            {/* Offers list */}
            {loading ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">Loading offers…</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">No offers found.</div>
            ) : (
              filtered.map((o) => (
                <article key={o.id} className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{o.title}</div>
                      {o.subtitle && <div className="text-xs text-slate-500">{o.subtitle}</div>}
                      <div className="text-sm text-slate-600 mt-2">{o.description}</div>
                    </div>

                    <div className="text-right">
                      {o.badge && <div className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">{o.badge}</div>}
                      {o.price && <div className="font-semibold mt-2">{o.price}</div>}
                      {o.expires && <div className="text-xs text-slate-500 mt-1">Expires {new Date(o.expires).toLocaleDateString()}</div>}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => claimOffer(o.id)} className="px-3 py-2 rounded bg-red-600 text-white text-sm">Claim</button>
                    <Link href={`/offers/${o.id}`} className="text-sm underline">Details</Link>
                    <div className="ml-auto text-xs text-slate-500">Shareable</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>

        {/* BNPL modal */}
        {showBnplModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowBnplModal(false)} />
            <div className="relative max-w-md w-full rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold">Opt in to Buy Now, Pay Later</h2>
              <p className="mt-2 text-sm text-slate-600">Enter your mobile number to check eligibility. Approvals are fast and we never share your data without consent.</p>

              <label className="block mt-4 text-sm">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2547XXXXXXXX" className="w-full rounded-md border px-3 py-2 text-sm mt-1" />

              <div className="mt-4 flex items-center gap-2">
                <button onClick={handleBnplOptIn} className="px-3 py-2 rounded bg-red-600 text-white text-sm">Confirm opt-in</button>
                <button onClick={() => setShowBnplModal(false)} className="px-3 py-2 rounded border text-sm">Cancel</button>
              </div>

              <div className="mt-3 text-xs text-slate-500">By opting in you agree to receive an eligibility SMS. BNPL is subject to terms and limits. <Link href="/terms" className="underline">View terms</Link>.</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
