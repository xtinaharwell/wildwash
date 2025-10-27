"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  fetchOrders,
  createOrder,
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
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // create form state (local)
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [urgency, setUrgency] = useState(1);
  const [items, setItems] = useState(1);
  const [packageCount, setPackageCount] = useState(1);
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [price, setPrice] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

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

  function gotoTrack(code: string) {
    router.push(`/track?code=${encodeURIComponent(code)}`);
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMessage(null);

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

    try {
      // dispatch createOrder thunk
      const resultAction = await dispatch(createOrder(payload));
      // unwrap-like check: if rejected, it will be of type rejected
      if (createOrder.rejected.match(resultAction)) {
        const err = (resultAction.payload as string) || (resultAction.error && resultAction.error.message) || 'Create failed';
        setErrorMessage(err);
      } else {
        // success — reset form and close
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
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message ?? 'Failed to create order');
    }
  }

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
            <button onClick={() => setCreating((c) => !c)} className="rounded-full px-4 py-2 bg-red-600 text-white text-sm shadow">{creating ? 'Close' : 'New order'}</button>
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
              <button type="submit" disabled={fullState.createLoading} className="px-4 py-2 rounded bg-red-600 text-white text-sm">{fullState.createLoading ? 'Creating…' : 'Create order'}</button>
            </div>
          </form>
        )}

        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex gap-3">
            <input value={query ?? ''} onChange={(e) => dispatch(setQuery(e.target.value))} placeholder="Search by code, package or price" className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300" />
            <select value={statusFilter} onChange={(e) => dispatch(setStatusFilter(e.target.value as any))} className="rounded-md border px-3 py-2 text-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((o) => (
                <article key={o.code} className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-500">{new Date(o.date).toLocaleString()}</div>
                      <div className="font-mono font-semibold text-lg mt-1">{o.code}</div>
                      <div className="mt-1 text-sm text-slate-600">{o.items} items · {o.weightKg ? `${o.weightKg} kg` : ''} · {o.package}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Status</div>
                      <div className={`font-semibold ${o.status === 'Delivered' ? 'text-slate-700' : 'text-red-600'}`}>{o.status}</div>
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
