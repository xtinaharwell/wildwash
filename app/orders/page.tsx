"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  fetchOrders,
  setPage,
  setStatusFilter,
  setQuery,
  selectOrders,
  selectOrdersLoading,
  selectOrdersMeta,
  selectOrdersError,
  selectOrdersState,
} from "@/redux/features/orderSlice";

/**
 * Orders page (Next.js client component) — now using Redux slice
 *
 * Notes:
 * - The slice handles fetching and mapping backend -> frontend shape.
 * - This component keeps local UI state for the create form and "creating" toggle.
 */

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

const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import RouteGuard from "../../components/RouteGuard";

export default function OrdersPage(): React.JSX.Element {

  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state/selectors
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const meta = useAppSelector(selectOrdersMeta);
  const errorFromState = useAppSelector(selectOrdersError);
  const fullState = useAppSelector(selectOrdersState); // for createLoading, refreshCounter, etc.

  // Local UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local controlled search / filter bound to redux meta
  const query = meta.query;
  const statusFilter = meta.statusFilter; // "All" | Order['status']
  const page = meta.page;
  const pageSize = meta.pageSize;
  const totalPages = meta.totalPages ?? 1;

  // summary computed from current fetched orders
  const summary = useMemo(() => {
    const total = orders.length; // this reflects only current page's entries
    const completed = orders.filter((o) => o.status === "Delivered").length;
    const active = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;
    return { total, completed, active };
  }, [orders]);

  // Fetch when relevant meta changes (page, pageSize, statusFilter, query) or when refreshCounter increments
  useEffect(() => {
    setErrorMessage(null);
    dispatch(fetchOrders());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, pageSize, statusFilter, query, fullState.refreshCounter]);

  // sync error message from state
  useEffect(() => {
    if (errorFromState) setErrorMessage(errorFromState);
  }, [errorFromState]);

  // filter the page-local orders list (search client-side on current page)
  const filtered = orders.filter((o) => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return true;
    return (
      (o.code ?? "").toLowerCase().includes(q) ||
      (o.package ?? "").toLowerCase().includes(q) ||
      (String(o.price ?? "").toLowerCase()).includes(q)
    );
  });

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Your orders</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">All orders for your account — view details, track progress or reorder.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="rounded-full w-10 h-10 flex items-center justify-center bg-red-600 text-white text-lg shadow hover:bg-red-700">+</Link>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex gap-3">
            <input value={query ?? ''} onChange={(e) => dispatch(setQuery(e.target.value))} placeholder="Search by code, package or price" className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all" />
            <select value={statusFilter} onChange={(e) => dispatch(setStatusFilter(e.target.value as any))} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-red-300 dark:hover:border-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all cursor-pointer appearance-none bg-[length:1.5em_1.5em] bg-no-repeat bg-right-4" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
              paddingRight: '2.5rem'
            }}>
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
              <div className="font-semibold text-lg text-red-600">{summary.active}</div>
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
            <div className="grid grid-cols-1 gap-6">
              {filtered.map((o) => {
                const statusColors = {
                  'Received': { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-l-4 border-l-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
                  'Washing': { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-l-4 border-l-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
                  'Drying': { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-l-4 border-l-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
                  'Ready': { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-l-4 border-l-green-500', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
                  'Delivered': { bg: 'bg-slate-50 dark:bg-slate-800/20', border: 'border-l-4 border-l-slate-400', badge: 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300' },
                  'Cancelled': { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-l-4 border-l-red-500', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
                };
                
                const colors = statusColors[o.status] || statusColors['Received'];
                
                return (
                <article key={o.code} className={`rounded-2xl bg-white/80 dark:bg-white/5 ${colors.bg} ${colors.border} p-6 shadow hover:shadow-lg transition-shadow`}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm text-slate-500">{new Date(o.date).toLocaleString()}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="font-mono font-semibold text-2xl mt-2">{o.code}</div>
                      <div className="mt-2 text-base text-slate-600 dark:text-slate-400">{o.items} items · {o.weightKg ? `${o.weightKg} kg` : ''} · {o.package}</div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3 border border-white/20 dark:border-white/10">
                          <div className="text-xs text-slate-500 uppercase tracking-wide">Amount</div>
                          <div className="font-semibold text-lg mt-1 text-slate-900 dark:text-slate-100">{o.price}</div>
                        </div>

                        {o.eta && (
                          <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3 border border-white/20 dark:border-white/10">
                            <div className="text-xs text-slate-500 uppercase tracking-wide">ETA</div>
                            <div className="font-semibold text-lg mt-1">{o.eta}</div>
                          </div>
                        )}
                        
                        <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3 border border-white/20 dark:border-white/10">
                          <div className="text-xs text-slate-500 uppercase tracking-wide">Items</div>
                          <div className="font-semibold text-lg mt-1">{o.items}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Link 
                      href={`/orders/${o.code}`} 
                      className="flex-1 px-4 py-3 rounded bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-slate-100 font-medium text-center transition-colors">
                      View Details
                    </Link>
                    <Link 
                      href={`/checkout?order_id=${encodeURIComponent(o.code)}&amount=${encodeURIComponent(o.price.replace(/[^0-9.]/g, ''))}`} 
                      className="flex-1 px-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-center transition-colors">
                      Pay Now
                    </Link>
                  </div>
                </article>
              );
              })}
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <button className="px-3 py-1 rounded border" onClick={() => dispatch(setPage(Math.max(1, page - 1)))} disabled={page === 1}>Prev</button>
              <div className="px-3 py-1">Page {page} of {totalPages}</div>
              <button className="px-3 py-1 rounded border" onClick={() => dispatch(setPage(Math.min(totalPages, page + 1)))} disabled={page === totalPages}>Next</button>
            </div>
          )}

          {errorMessage && <div className="mt-4 text-sm text-red-500">{errorMessage}</div>}
        </main>
      </div>
      </div>
    </RouteGuard>
  );
}
