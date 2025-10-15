"use client"

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderStatus = "Received" | "Washing" | "Drying" | "Ready" | "Delivered" | "Cancelled";

type Order = {
  code: string;
  date: string; // ISO
  items: number;
  weightKg?: number;
  package: string;
  price: string;
  status: OrderStatus;
  eta?: string;
  deliveredAt?: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // sample data (replace with real API call)
  useEffect(() => {
    setLoading(true);
    const sample: Order[] = [
      { code: "WW-12345", date: "2025-10-14T10:12:00Z", items: 12, weightKg: 4.2, package: "Standard (Wash + Fold)", price: "KSh 1,680", status: "Washing", eta: "Today, 14:10" },
      { code: "WW-99999", date: "2025-10-13T15:00:00Z", items: 6, weightKg: 2.3, package: "Premium (Delicate & Care)", price: "KSh 1,610", status: "Ready", eta: "Tomorrow, 09:00" },
      { code: "WW-55555", date: "2025-09-30T08:00:00Z", items: 8, weightKg: 3.1, package: "Express", price: "KSh 2,100", status: "Delivered", deliveredAt: "2025-10-01T11:40:00Z" },
      { code: "WW-22222", date: "2025-10-01T09:30:00Z", items: 4, weightKg: 1.4, package: "Standard", price: "KSh 900", status: "Received" },
      { code: "WW-77777", date: "2025-09-25T12:10:00Z", items: 10, weightKg: 5.3, package: "Premium", price: "KSh 2,500", status: "Delivered", deliveredAt: "2025-09-26T10:00:00Z" },
      { code: "WW-88888", date: "2025-09-20T07:20:00Z", items: 3, weightKg: 1.0, package: "Standard", price: "KSh 450", status: "Cancelled" },
      { code: "WW-44444", date: "2025-10-10T11:00:00Z", items: 7, weightKg: 2.8, package: "Wash Only", price: "KSh 1,200", status: "Drying" },
    ];

    // simulate network
    const t = setTimeout(() => {
      setOrders(sample);
      setLoading(false);
    }, 500);

    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.code.toLowerCase().includes(q) ||
        o.package.toLowerCase().includes(q) ||
        o.price.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    // reset page if filter/search changes
    setPage(1);
  }, [query, statusFilter]);

  function gotoTrack(code: string) {
    // navigate to track page with code query param
    router.push(`/track?code=${encodeURIComponent(code)}`);
  }

  function calcSummary() {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === "Delivered").length;
    const active = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;
    return { total, completed, active };
  }

  const summary = calcSummary();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Your orders</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">All orders for your account — view details, track progress or reorder.</p>
        </header>

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
              <div className="text-xs text-slate-500">Orders</div>
              <div className="font-semibold text-lg">{summary.total}</div>
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
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-sm text-slate-600">No orders found. Try a different filter or <Link href="/contact" className="underline">contact support</Link>.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageItems.map((o) => (
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
                    <div className="text-sm text-slate-500">{o.status === 'Delivered' ? `Delivered ${o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString() : ''}` : ''}</div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">{o.status === 'Delivered' ? 'You can reorder or download receipt from the details page.' : 'Updates appear here as your order progresses.'}</div>
                </article>
              ))}
            </div>
          )}

          {/* pagination */}
          {filtered.length > pageSize && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <button className="px-3 py-1 rounded border" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <div className="px-3 py-1">Page {page} of {totalPages}</div>
              <button className="px-3 py-1 rounded border" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
