"use client"

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Orders page (Next.js client component)
 * - Fetches paginated orders from /api/orders/
 * - Supports search, status filter, server-side pagination
 * - Includes a small "Create order" form that posts to /api/orders/
 *
 * Auth note: This component tries two auth modes:
 *  1) If `localStorage.getItem('access_token')` exists it will send
 *     `Authorization: Bearer <token>` header (typical SPA JWT flow).
 *  2) Otherwise it will use cookie session auth and include credentials
 *     (credentials: 'include') and X-CSRFToken header if found.
 */

type BackendOrder = {
  id: number;
  code: string;
  created_at: string;
  items: number;
  weight_kg?: number | string | null;
  package: string; // service name
  price?: string | number | null;
  price_display?: string | null;
  status: 'requested' | 'picked' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | string;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
};

type Order = {
  code: string;
  date: string; // ISO
  items: number;
  weightKg?: number | null;
  package: string;
  price: string; // formatted for display
  status: "Received" | "Washing" | "Drying" | "Ready" | "Delivered" | "Cancelled";
  eta?: string | null;
  deliveredAt?: string | null;
};

const statusMap: Record<string, Order['status']> = {
  requested: "Received",
  picked: "Washing",
  in_progress: "Drying",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const frontendToBackendStatus: Record<string, string> = {
  Received: 'requested',
  Washing: 'picked',
  Drying: 'in_progress',
  Ready: 'ready',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

function backendToFrontend(o: BackendOrder): Order {
  const price = o.price_display ?? (o.price ? `KSh ${Number(o.price).toLocaleString()}` : "");
  const weightKg = o.weight_kg ? Number(o.weight_kg) : undefined;
  const eta = o.estimated_delivery ? new Date(o.estimated_delivery).toLocaleString() : undefined;
  const deliveredAt = o.delivered_at ? new Date(o.delivered_at).toLocaleString() : undefined;

  return {
    code: o.code || `WW-${o.id}`,
    date: o.created_at,
    items: o.items ?? 0,
    weightKg,
    package: o.package ?? `Package ${o.id}`,
    price,
    status: statusMap[o.status] ?? "Received",
    eta,
    deliveredAt,
  };
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const [k, ...v] = c.split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export default function OrdersPage(): JSX.Element {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Order['status']>("All");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // create form state
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [urgency, setUrgency] = useState(1);
  const [items, setItems] = useState(1);
  const [packageCount, setPackageCount] = useState(1);
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [price, setPrice] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

  // summary computed from current fetched orders
  const summary = useMemo(() => {
    const total = orders.length; // note: this reflects only current page
    const completed = orders.filter((o) => o.status === "Delivered").length;
    const active = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;
    return { total, completed, active };
  }, [orders]);

  useEffect(() => {
    setPage(1); // reset to first page when filters change
  }, [query, statusFilter]);

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      setLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (statusFilter !== 'All') params.set('status', frontendToBackendStatus[statusFilter]);
      if (query) params.set('search', query);

      const url = `/api/orders/?${params.toString()}`;

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        let res: Response;

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          res = await fetch(url, { headers });
        } else {
          // session cookie flow
          const csrftoken = getCookie('csrftoken');
          if (csrftoken) headers['X-CSRFToken'] = csrftoken;
          res = await fetch(url, { headers, credentials: 'include' });
        }

        if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`);
        const data = await res.json();

        // support both list and DRF pagination
        let list: BackendOrder[] = [];
        let count = 0;
        if (Array.isArray(data)) {
          list = data as BackendOrder[];
          count = list.length;
        } else {
          list = (data.results ?? []) as BackendOrder[];
          count = typeof data.count === 'number' ? data.count : list.length;
        }

        if (!mounted) return;
        setOrders(list.map(backendToFrontend));
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        if (!mounted) return;
        setErrorMessage(err.message ?? 'Failed to load orders');
        setOrders([]);
        setLoading(false);
      }
    }

    fetchOrders();
    return () => { mounted = false; };
  }, [page, pageSize, statusFilter, query, refreshCounter]);

  function gotoTrack(code: string) {
    router.push(`/track?code=${encodeURIComponent(code)}`);
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setCreateLoading(true);
    setErrorMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      let res: Response;

      const payload = {
        service: serviceId,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        urgency,
        items,
        package: packageCount,
        weight_kg: weightKg === '' ? null : Number(weightKg),
        price: price ? String(price).replace(/[, ]/g, '') : null,
        estimated_delivery: estimatedDelivery || null,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        res = await fetch('/api/orders/', { method: 'POST', headers, body: JSON.stringify(payload) });
      } else {
        const csrftoken = getCookie('csrftoken');
        if (csrftoken) headers['X-CSRFToken'] = csrftoken;
        res = await fetch('/api/orders/', { method: 'POST', headers, body: JSON.stringify(payload), credentials: 'include' });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create failed ${res.status}: ${text}`);
      }

      const created: BackendOrder = await res.json();

      // after create refresh list (go to page 1 to show newest)
      setPage(1);
      setRefreshCounter((c) => c + 1);

      // reset form and close
      setServiceId(null);
      setPickupAddress('');
      setDropoffAddress('');
      setUrgency(1);
      setItems(1);
      setPackageCount(1);
      setWeightKg('');
      setPrice('');
      setEstimatedDelivery('');
      setCreating(false);

      setCreateLoading(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? 'Failed to create order');
      setCreateLoading(false);
    }
  }

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.code.toLowerCase().includes(q) ||
      o.package.toLowerCase().includes(q) ||
      o.price.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Your orders</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">All orders for your account — view details, track progress or reorder.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setCreating((c) => !c)} className="rounded-full px-4 py-2 bg-emerald-600 text-white text-sm shadow">{creating ? 'Close' : 'New order'}</button>
          </div>
        </header>

        {creating && (
          <form onSubmit={handleCreate} className="mb-6 rounded-2xl bg-white/90 dark:bg-white/5 p-4 shadow space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="number" value={serviceId ?? ''} onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : null)} placeholder="Service ID (e.g. 1)" className="rounded-md border px-3 py-2 text-sm" required />
              <input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Pickup address" className="rounded-md border px-3 py-2 text-sm col-span-2" required />
              <input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Dropoff address" className="rounded-md border px-3 py-2 text-sm col-span-2" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input type="number" min={1} max={5} value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} placeholder="Urgency (1-5)" className="rounded-md border px-3 py-2 text-sm" />
              <input type="number" min={1} value={items} onChange={(e) => setItems(Number(e.target.value))} placeholder="Items" className="rounded-md border px-3 py-2 text-sm" />
              <input type="number" min={1} value={packageCount} onChange={(e) => setPackageCount(Number(e.target.value))} placeholder="Package count" className="rounded-md border px-3 py-2 text-sm" />
              <input type="number" step="0.1" value={weightKg === '' ? '' : weightKg} onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Weight kg" className="rounded-md border px-3 py-2 text-sm" />
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (e.g. 1200)" className="rounded-md border px-3 py-2 text-sm" />
              <input type="datetime-local" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button type="submit" disabled={createLoading} className="px-4 py-2 rounded bg-emerald-600 text-white text-sm">{createLoading ? 'Creating…' : 'Create order'}</button>
            </div>
          </form>
        )}

        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code, package or price" className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-md border px-3 py-2 text-sm">
              <option value="All">All statuses</option>
              <option value="Received">Received</option>
              <option value="Washing">Washing</option>
              <option value="Drying">Drying</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow text-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Orders (page)</div>
              <div className="font-semibold text-lg">{orders.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Active</div>
              <div className="font-semibold text-lg text-emerald-600">{summary.active}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Completed</div>
              <div className="font-semibold text-lg">{summary.completed}</div>
            </div>
          </div>
        </section>

        <main>
          {loading ? (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">Loading your orders…</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">No orders found. Try a different filter or <Link href="/contact" className="underline">contact support</Link>.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((o) => (
                <article key={o.code} className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-500">{new Date(o.date).toLocaleString()}</div>
                      <div className="font-mono font-semibold text-lg mt-1">{o.code}</div>
                      <div className="mt-1 text-sm text-slate-600">{o.items} items · {o.weightKg ? `${o.weightKg} kg` : ''} · {o.package}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Status</div>
                      <div className={`font-semibold ${o.status === 'Delivered' ? 'text-slate-700' : 'text-emerald-600'}`}>{o.status}</div>
                      {o.eta && <div className="text-xs text-slate-500 mt-2">ETA</div>}
                      {o.eta && <div className="font-medium">{o.eta}</div>}
                      <div className="mt-2 flex items-center gap-2 justify-end">
                        <button onClick={() => gotoTrack(o.code)} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">Track</button>
                        <Link href={`/orders/${o.code}`} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/5">Details</Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-slate-600">{o.price}</div>
                    <div className="text-sm text-slate-500">{o.status === 'Delivered' ? `Delivered ${o.deliveredAt ?? ''}` : 'Updates appear here as your order progresses.'}</div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <button className="px-3 py-1 rounded border" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <div className="px-3 py-1">Page {page} of {totalPages}</div>
              <button className="px-3 py-1 rounded border" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}

          {errorMessage && <div className="mt-4 text-sm text-red-500">{errorMessage}</div>}
        </main>
      </div>
    </div>
  );
}
