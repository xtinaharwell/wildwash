"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type StatusPoint = {
  key: string;
  label: string;
  subtitle?: string;
  timestamp?: string;
  done?: boolean;
};

type RawOrder = Record<string, any>;

type Order = {
  id?: number;
  code: string;
  createdAt?: string;
  user?: string;
  serviceName?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  items: number;
  weightKg?: number;
  package: string;
  price: string;
  priceDisplay?: string | null;
  status: string;
  eta?: string;
  deliveredAt?: string;
  rider?: { name: string; phone?: string };
  statusLog?: StatusPoint[];
  raw?: RawOrder;
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    const [k, ...v] = c.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

import { useSearchParams } from 'next/navigation';

export default function TrackPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get('code') || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  // Auto-lookup code from URL parameter
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      lookupCode(urlCode);
    }
  }, [searchParams]);

  // base; empty means same origin. Adjust if your API is remote.
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://wildwosh.kibeezy.com";

  async function lookupCode(c: string) {
    setLoading(true);
    setError(null);
    setOrder(null);

    const codeParam = c.trim().toUpperCase();
    if (!codeParam) {
      setError("Please provide a tracking code.");
      setLoading(false);
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        const csrftoken = getCookie("csrftoken");
        if (csrftoken) headers["X-CSRFToken"] = csrftoken;
      }

      const url = `${API_BASE}/orders?code=${encodeURIComponent(codeParam)}`;

      const res = await fetch(url, {
        method: "GET",
        headers,
        credentials: token ? "omit" : "include",
      });

      // parse JSON (or throw)
      let data: any;
      try {
        data = await res.json();
      } catch (e) {
        const text = await res.text().catch(() => "<non-json body>");
        throw new Error(res.ok ? "Server returned non-JSON response" : `Server error: ${res.status} ${text}`);
      }

      if (!res.ok) {
        const err = typeof data === "object" ? JSON.stringify(data) : String(data);
        throw new Error(`Server error ${res.status}: ${err}`);
      }

      // find single result
      let found: any = null;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          setError("Order not found — check the tracking code and try again.");
          setLoading(false);
          return;
        }
        found = data[0];
      } else if (Array.isArray(data.results ?? null)) {
        if ((data.results as any[]).length === 0) {
          setError("Order not found — check the tracking code and try again.");
          setLoading(false);
          return;
        }
        found = data.results[0];
      } else if (data && typeof data === "object") {
        // if the API returns the order object directly, use it
        found = data.id || data.code ? data : null;
        if (!found) {
          setError("Unexpected server response shape — see console for details.");
          console.warn("Unexpected response:", data);
          setLoading(false);
          return;
        }
      } else {
        setError("Unexpected server response — see console for details.");
        setLoading(false);
        return;
      }

      // normalize
      const mapped: Order = {
        id: found.id,
        code: found.code || `WW-${found.id}`,
        createdAt: found.created_at ?? found.createdAt ?? undefined,
        user: found.user ?? undefined,
        serviceName: found.service_name ?? (found.service && typeof found.service === "object" ? found.service.name : undefined),
        pickupAddress: found.pickup_address ?? undefined,
        dropoffAddress: found.dropoff_address ?? undefined,
        items: found.items ?? 0,
        weightKg: found.weight_kg ? Number(found.weight_kg) : undefined,
        package: (() => {
          if (typeof found.package === "string" && found.package) return found.package;
          if (found.service_name) return found.service_name;
          if (found.service && typeof found.service === "object") return found.service.name ?? "Standard";
          return found.package ?? "Standard";
        })(),
        price: found.price_display ?? (found.price ? `KSh ${Number(found.price).toLocaleString()}` : ""),
        priceDisplay: found.price_display ?? null,
        status: mapStatus(found.status ?? found.status_code ?? ""),
        eta: found.estimated_delivery ? new Date(found.estimated_delivery).toLocaleString() : undefined,
        deliveredAt: found.delivered_at ? new Date(found.delivered_at).toLocaleString() : undefined,
        rider: found.rider ? { name: found.rider.name, phone: found.rider.phone } : undefined,
        statusLog: found.timeline ?? found.status_log ?? [],
        raw: found,
      };

      setOrder(mapped);
    } catch (err: any) {
      console.error("Lookup error:", err);
      setError(err?.message ?? "Failed to fetch order — see console.");
    } finally {
      setLoading(false);
    }
  }

  function handleTrack(e?: React.FormEvent) {
    e?.preventDefault();
    setOrder(null);
    setError(null);
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
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Enter the tracking code you received at pickup to see live status, ETA and rider details.
          </p>
        </header>

        <form onSubmit={handleTrack} className="flex gap-3">
          <input
            id="track"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. WW-12345"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          />
          <button type="submit" disabled={loading} className="rounded-md bg-red-600 text-white px-4 py-2 text-sm">
            {loading ? "Searching…" : "Track"}
          </button>
        </form>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {order ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Tracking code</div>
                    <div className="font-mono font-semibold text-lg">{order.code}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {order.items} items · {order.weightKg ? `${order.weightKg} kg` : ""} · {order.package}
                    </div>
                    {order.serviceName && <div className="text-xs text-slate-500 mt-1">Service: {order.serviceName}</div>}
                    {order.user && <div className="text-xs text-slate-500">Account: {order.user}</div>}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">Status</div>
                    <div className="font-semibold text-red-600">{order.status}</div>
                    <div className="text-xs text-slate-500 mt-2">ETA</div>
                    <div className="font-medium">{order.eta || "—"}</div>
                    <div className="mt-2 flex items-center gap-2 justify-end">
                      <button onClick={copyCode} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">Copy</button>
                      {order.rider?.phone && <a href={`tel:${order.rider.phone}`} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">Call rider</a>}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 sm:h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        order.status.toLowerCase() === 'cancelled'
                          ? 'bg-gray-400'
                          : order.status.toLowerCase() === 'delivered'
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600 animate-pulse'
                      }`}
                      style={{ width: `${calcProgress(order.status)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="text-slate-500 dark:text-slate-400">
                      {calcProgress(order.status)}% complete
                    </div>
                    <div className={`font-medium ${
                      order.status.toLowerCase() === 'cancelled'
                        ? 'text-gray-500'
                        : order.status.toLowerCase() === 'delivered'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                </div>

                {/* DETAILS tab (placed below the progress for single-view) */}
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-slate-700">Details</h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                    <div><div className="text-xs text-slate-500">Created</div><div className="font-medium text-slate-800">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</div></div>
                    <div><div className="text-xs text-slate-500">Account</div><div className="font-medium text-slate-800">{order.user ?? "—"}</div></div>

                    <div><div className="text-xs text-slate-500">Service</div><div className="font-medium text-slate-800">{order.serviceName ?? order.package}</div></div>
                    <div><div className="text-xs text-slate-500">Items / Weight</div><div className="font-medium text-slate-800">{order.items} items {order.weightKg ? `• ${order.weightKg} kg` : ''}</div></div>

                    <div><div className="text-xs text-slate-500">Pickup</div><div className="font-medium text-slate-800">{order.pickupAddress ?? "—"}</div></div>
                    <div><div className="text-xs text-slate-500">Dropoff</div><div className="font-medium text-slate-800">{order.dropoffAddress ?? "—"}</div></div>

                    <div><div className="text-xs text-slate-500">Price</div><div className="font-medium text-slate-800">{order.price || "—"}</div></div>
                    <div><div className="text-xs text-slate-500">Delivered</div><div className="font-medium text-slate-800">{order.deliveredAt ?? "—"}</div></div>

                    <div className="sm:col-span-2">
                      <div className="text-xs text-slate-500">Rider</div>
                      <div className="font-medium text-slate-800">
                        {order.rider ? `${order.rider.name}${order.rider.phone ? ` • ${order.rider.phone}` : ''}` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* optional: status timeline */}
                  {order.statusLog && order.statusLog.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-slate-600">Timeline</h4>
                      <ol className="mt-2 space-y-2 text-sm text-slate-600">
                        {order.statusLog.map((s) => (
                          <li key={s.key} className="flex items-start gap-3">
                            <div className={`mt-1 w-3 h-3 rounded-full ${s.done ? 'bg-red-500' : 'bg-slate-200'}`} />
                            <div>
                              <div className="flex items-baseline gap-2">
                                <div className="font-medium">{s.label}</div>
                                <div className="text-xs text-slate-500">{s.timestamp ?? "—"}</div>
                              </div>
                              {s.subtitle && <div className="text-xs text-slate-500 mt-1">{s.subtitle}</div>}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
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
                <button disabled={!order} onClick={() => setSubscribed(true)} className="ml-auto text-xs bg-red-600 text-white px-3 py-1 rounded">Enable</button>
              </div>

              {order?.rider && (
                <>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800" />
                  <div>
                    <div className="font-semibold">Rider</div>
                    <div className="text-sm text-slate-700 mt-1">
                      <div>{order.rider.name}</div>
                      <a href={`tel:${order.rider.phone}`} className="text-sm underline">{order.rider.phone}</a>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-500">Tip: If your ETA is soon but status hasn't updated, try refreshing the code or contact support.</div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* --- helpers --- */

function calcProgress(status?: string) {
  if (!status) return 0;
  
  // Progress mapping for each status
  const progressMap: Record<string, number> = {
    requested: 10,
    received: 10,
    picked: 30,
    washing: 50,
    in_progress: 60,
    drying: 70,
    ready: 90,
    delivered: 100,
    cancelled: 0
  };
  
  return progressMap[status.toLowerCase()] ?? 0;
}

function mapStatus(s: string): string {
  const map: Record<string, string> = {
    requested: "Received",
    picked: "Washing",
    in_progress: "Drying",
    ready: "Ready",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[s] || s || "Received";
}
