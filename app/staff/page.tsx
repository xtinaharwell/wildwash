"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { client } from '@/lib/api/client';

type Order = Record<string, any>;

export default function StaffDashboard(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/staff-login');
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await fetchProfile();
        if (!me?.is_staff && !me?.is_superuser) {
          router.push('/staff-login');
          return;
        }

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
        <div>Loading…</div>
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Showing orders for your assigned location: {profile?.service_location_display ?? profile?.service_location ?? 'Unknown'}</p>
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
                <th className="text-left py-2 px-3">Code</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Rider</th>
                <th className="text-right py-2 px-3">Price</th>
                <th className="text-right py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 200).map((o) => (
                <tr key={o.id ?? o.code} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 px-3 font-mono">{o.code}</td>
                  <td className="py-2 px-3">{o.status ?? o.state ?? '—'}</td>
                  <td className="py-2 px-3">{(o.rider && (o.rider.name || o.rider.username)) ?? o.rider ?? o.user ?? '—'}</td>
                  <td className="py-2 px-3 text-right">{Number(o.price ?? o.price_display ?? 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{o.created_at?.split?.('T')?.[0] ?? '—'}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No orders found for your location.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
