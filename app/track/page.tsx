"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";

// track.tsx - Customer tracking page for Wild Wash
// Saves: simulate fetch and show a timeline + ETA + rider contact

type StatusPoint = {
  key: string;
  label: string;
  subtitle?: string;
  timestamp?: string; // ISO or human
  done?: boolean;
};

export default function TrackPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<null | { code: string; items: number; weightKg?: number; package: string; price: string; status: string; eta: string; statusLog: StatusPoint[]; rider?: { name: string; phone?: string } }>(null);
  const [subscribed, setSubscribed] = useState(false);

  // sample DB for simulation
  const sample = {
    "WW-12345": {
      code: "WW-12345",
      items: 12,
      weightKg: 4.2,
      package: "Standard (Wash + Fold)",
      price: "KSh 1,680",
      status: "Washing",
      eta: "Today, 14:10",
      rider: { name: "Samson", phone: "+254700111222" },
      statusLog: [
        { key: "received", label: "Received", subtitle: "Picked up from Nairobi - Westlands", timestamp: "10:12 AM", done: true },
        { key: "washing", label: "Washing", subtitle: "Cycle in progress (40%)", timestamp: "10:25 AM", done: true },
        { key: "drying", label: "Drying & Folding", subtitle: "Queued for dryer", timestamp: undefined, done: false },
        { key: "ready", label: "Ready for Delivery", subtitle: "Out for delivery when ready", timestamp: undefined, done: false },
        { key: "delivered", label: "Delivered", subtitle: "Completed", timestamp: undefined, done: false },
      ],
    },
    "WW-99999": {
      code: "WW-99999",
      items: 6,
      weightKg: 2.3,
      package: "Premium (Delicate & Care)",
      price: "KSh 1,610",
      status: "Ready",
      eta: "Tomorrow, 09:00",
      rider: { name: "Aisha", phone: "+254700333444" },
      statusLog: [
        { key: "received", label: "Received", subtitle: "Picked up from Mombasa - City Centre", timestamp: "Yesterday 15:00", done: true },
        { key: "washing", label: "Washing", subtitle: "Completed", timestamp: "Yesterday 18:00", done: true },
        { key: "drying", label: "Drying & Folding", subtitle: "Completed", timestamp: "Today 06:00", done: true },
        { key: "ready", label: "Ready for Delivery", subtitle: "Ready at depot", timestamp: "Today 07:30", done: true },
        { key: "delivered", label: "Delivered", subtitle: "Completed", timestamp: undefined, done: false },
      ],
    }
  } as Record<string, any>;

  useEffect(() => {
    // If the user navigated with a code in the URL (optional), you could auto-load it here.
  }, []);

  function lookupCode(c: string) {
    setLoading(true);
    setError(null);
    setOrder(null);
    setSubscribed(false);
    // simulate network
    setTimeout(() => {
      const found = sample[c.trim().toUpperCase()];
      if (found) {
        setOrder(found);
      } else {
        setError("Order not found — check your tracking code and try again.");
      }
      setLoading(false);
    }, 700);
  }

  function handleTrack(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return setError("Enter a tracking code (e.g. WW-12345).");
    lookupCode(code);
  }

  function copyCode() {
    if (!order) return;
    navigator.clipboard?.writeText(order.code);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Track your order</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enter the tracking code you received at pickup to see live status, ETA and rider details.</p>
        </header>

        <form onSubmit={handleTrack} className="flex gap-3">
          <label htmlFor="track" className="sr-only">Tracking code</label>
          <input id="track" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WW-12345" className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" />
          <button type="submit" disabled={loading} className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm">{loading ? 'Searching…' : 'Track'}</button>
        </form>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Order card */}
            {order ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Tracking code</div>
                    <div className="font-mono font-semibold text-lg">{order.code}</div>
                    <div className="mt-1 text-sm text-slate-600">{order.items} items · {order.weightKg ? `${order.weightKg} kg` : ''} · {order.package}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">Status</div>
                    <div className="font-semibold text-emerald-600">{order.status}</div>
                    <div className="text-xs text-slate-500 mt-2">ETA</div>
                    <div className="font-medium">{order.eta}</div>
                    <div className="mt-2 flex items-center gap-2 justify-end">
                      <button onClick={copyCode} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">Copy</button>
                      <a href={`tel:${order.rider?.phone || ''}`} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">Call rider</a>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600`} style={{ width: `${calcProgress(order.status)}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{calcProgress(order.status)}% complete</div>
                </div>

                {/* Timeline */}
                <div className="mt-4">
                  <ol className="space-y-3">
                    {order.statusLog.map((s) => (
                      <li key={s.key} className="flex items-start gap-3">
                        <div className={`mt-1 w-3 h-3 rounded-full ${s.done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        <div>
                          <div className="flex items-baseline gap-2">
                            <div className="font-medium">{s.label}</div>
                            <div className="text-xs text-slate-500">{s.timestamp}</div>
                          </div>
                          <div className="text-sm text-slate-600 mt-1">{s.subtitle}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 text-xs text-slate-500">If you think there is a problem with your order, <Link href="/contact" className="underline">contact support</Link> or call the rider.</div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">Search a tracking code to see live updates here.</div>
            )}
          </div>

          <aside>
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow space-y-3 text-sm">
              <div className="font-semibold">Notifications</div>
              <div className="text-sm text-slate-600">Subscribe to updates for this order:</div>
              <div className="flex items-center gap-2 mt-2">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={subscribed} onChange={() => setSubscribed((s) => !s)} className="w-4 h-4" /> <span>Subscribe</span></label>
                <button disabled={!order} onClick={() => setSubscribed(true)} className="ml-auto text-xs bg-emerald-600 text-white px-3 py-1 rounded">Enable</button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800" />

              <div>
                <div className="font-semibold">Rider</div>
                {order ? (
                  <div className="text-sm text-slate-700 mt-1">
                    <div>{order.rider?.name}</div>
                    <a href={`tel:${order.rider?.phone}`} className="text-sm underline">{order.rider?.phone}</a>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 mt-1">Rider contact shown when order is found.</div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800" />

              <div>
                <div className="font-semibold">Outputs</div>
                <div className="text-sm text-slate-600 mt-2">You will receive:</div>
                <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                  <li>Order receipt (PDF)</li>
                  <li>Tracking updates (push/SMS/email)</li>
                  <li>Delivery confirmation</li>
                </ul>
              </div>

            </div>

            <div className="mt-4 text-xs text-slate-500">Tip: If your ETA is soon but status hasn't updated, refresh the tracking or contact support.</div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* --- helpers --- */

function calcProgress(status: string){
  switch(status.toLowerCase()){
    case 'received': return 10;
    case 'washing': return 40;
    case 'drying': return 60;
    case 'ready': return 90;
    case 'delivered': return 100;
    default: return 0;
  }
}
