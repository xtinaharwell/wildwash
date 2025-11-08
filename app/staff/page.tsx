"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { client } from '@/lib/api/client';
import { getStoredAuthState, isValidAuthState } from '@/lib/auth';
import { Spinner, OrderStatusUpdate } from '@/components';

type Order = Record<string, any>;

export default function StaffDashboard(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riderFilter, setRiderFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await client.get('/users/me/');
      setProfile(data);
      return data;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const fetchOrders = useCallback(async (locationId?: number) => {
    try {
      const data = await client.get('/orders/');
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      if (locationId == null) {
        setOrders(list);
        return;
      }

      // Filter orders by service_location - support several possible shapes
      const filtered = list.filter((o: any) => {
        const raw = o;
        // common shapes: raw.service_location (id), raw.service_location.id, o.service_location
        const a = raw?.service_location ?? raw?.service_location?.id ?? o?.service_location;
        return String(a) === String(locationId);
      });

      setOrders(filtered);
    } catch (err: any) {
      throw err;
    }
  }, []);

  useEffect(() => {
    // Prefer the persisted auth state used across the app
    const stored = typeof window !== 'undefined' ? getStoredAuthState() : null;

    // If no stored auth state, redirect to staff-login
    if (!stored || !isValidAuthState(stored)) {
      router.push('/staff-login');
      return;
    }

    // If user is logged in but not staff, show access denied (don't redirect to login)
    if (!stored.user?.is_staff && !stored.user?.is_superuser) {
      setLoading(false);
      setError('You do not have permission to access the staff dashboard.');
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await fetchProfile();
        const locId = me?.service_location ?? me?.service_location?.id ?? null;
        await fetchOrders(locId ?? undefined);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load staff dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfile, fetchOrders, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const total = orders.length;

  // derive available filter options from loaded orders
  const availableStatuses = Array.from(new Set(orders.map(o => (o.status ?? '').toString()))).filter(Boolean);
  const availableRiders = Array.from(new Set(orders.map(o => (o.rider ?? '').toString()))).filter(Boolean);

  const filteredOrders = orders.filter(o => {
    if (statusFilter && String(o.status ?? '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (riderFilter && String(o.rider ?? '').toLowerCase() !== riderFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesCode = String(o.code ?? '').toLowerCase().includes(q);
      const matchesUser = String(o.user ?? o.rider ?? '').toLowerCase().includes(q);
      if (!matchesCode && !matchesUser) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Staff Name:</span> {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.username}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Location:</span> {profile?.service_location_display ?? profile?.service_location?.name ?? 'Not assigned'}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="">All statuses</option>
            {availableStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={riderFilter}
            onChange={(e) => setRiderFilter(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="">All riders</option>
            {availableRiders.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or rider"
            className="rounded-md border px-2 py-1 text-sm"
          />

          <button onClick={() => { setStatusFilter(''); setRiderFilter(''); setSearchQuery(''); }} className="text-sm text-slate-500">Reset</button>
        </div>
      </header>

      <div className="mb-6">
        <div className="inline-flex items-center gap-4">
          <div className="text-sm text-slate-500">Total orders for location</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow">
        <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="text-left py-2 px-3 w-32">Code</th>
                <th className="text-left py-2 px-3 w-72">Status</th>
                <th className="text-left py-2 px-3">Rider</th>
                <th className="text-right py-2 px-3">Price</th>
                <th className="text-right py-2 px-3 w-32">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 200).map((o) => (
                <tr key={o.id ?? o.code} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 px-3 font-mono">
                    <Link href={`/orders/${o.code}`} className="text-indigo-600 hover:underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="py-2 px-3">
                    <OrderStatusUpdate
                      orderId={o.id}
                      currentStatus={o.status ?? o.state ?? 'requested'}
                      onUpdate={fetchOrders}
                    />
                  </td>
                  <td className="py-2 px-3">{(o.rider && (o.rider.name || o.rider.username)) ?? o.rider ?? o.user ?? '—'}</td>
                  <td className="py-2 px-3 text-right">{Number(o.price ?? o.price_display ?? 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{o.created_at?.split?.('T')?.[0] ?? '—'}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No orders found for your location.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
