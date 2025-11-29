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
  const [detailsFormOrderId, setDetailsFormOrderId] = useState<number | null>(null);
  const [detailsForm, setDetailsForm] = useState<{ items?: number; weight_kg?: string; pickup_notes?: string; actual_price?: string }>({});
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riderFilter, setRiderFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await client.get('/users/me/');
      console.log('[Staff] Profile fetched:', data);
      setProfile(data);
      return data;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const fetchOrders = useCallback(async (locationId?: number) => {
    try {
      const data = await client.get('/orders/');
      console.log('[Staff] Raw orders response:', data);
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      console.log('[Staff] Orders list:', list);
      console.log('[Staff] List length:', list.length);
      
      if (list.length === 0) {
        console.log('[Staff] ⚠️ No orders returned from API');
      }
      
      // The backend should already filter by location for staff users
      // But we'll keep this check just in case
      setOrders(list);
    } catch (err: any) {
      console.error('[Staff] Error fetching orders:', err);
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
        console.log('[Staff] Profile object:', me);
        console.log('[Staff] Staff location:', me?.service_location);
        console.log('[Staff] Staff location display:', me?.service_location_display);
        await fetchOrders();
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load staff dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfile, fetchOrders, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* center spinner and text inside the white card */}
        <div className="rounded-lg bg-white dark:bg-slate-800 p-8 shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-red-600 dark:text-red-400" />
          <div className="mt-4 text-slate-600 dark:text-slate-400 text-sm">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
            <div className="font-semibold">Error</div>
            <div className="mt-1 text-sm">{error}</div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Dashboard</h1>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Staff Name:</span> {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.username}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Location:</span> {profile?.service_location_display ?? profile?.service_location?.name ?? 'Not assigned'}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">All statuses</option>
              {availableStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value)}
              className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
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
              className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />

            <button 
              onClick={() => { setStatusFilter(''); setRiderFilter(''); setSearchQuery(''); }} 
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Reset
            </button>
          </div>
        </header>

      <div className="mb-6">
        <div className="inline-flex items-center gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total orders for location</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</div>
        </div>
      </div>

      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="text-left py-2 px-3 w-32">Code</th>
                <th className="text-left py-2 px-3 w-72">Status</th>
                <th className="text-left py-2 px-3">Rider</th>
                <th className="text-right py-2 px-3">Estimated Price</th>
                <th className="text-right py-2 px-3">Actual Price</th>
                <th className="text-right py-2 px-3">Actions</th>
                <th className="text-right py-2 px-3 w-32">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 200).map((o) => (
                <tr key={o.id ?? o.code} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-2 px-3 font-mono">
                    <Link href={`/orders/${o.code}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
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
                  <td className="py-2 px-3 text-slate-900 dark:text-slate-300">
                    {typeof o.rider === 'object' 
                      ? (o.rider?.username || o.rider?.first_name || o.rider?.name || '—')
                      : o.rider ?? o.user ?? '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900 dark:text-slate-300">
                    {(() => {
                      // Prefer a numeric total_price if provided by the API
                      const total = o.total_price ?? null;
                      if (total !== null && total !== undefined && !isNaN(Number(total))) {
                        return `KSh ${Number(total).toLocaleString()}`;
                      }

                      // Fall back to numeric price
                      if (o.price !== undefined && o.price !== null && !isNaN(Number(o.price))) {
                        return `KSh ${Number(o.price).toLocaleString()}`;
                      }

                      // Fall back to pre-formatted price_display string from API
                      if (o.price_display) return o.price_display;

                      return '—';
                    })()}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900 dark:text-slate-300">
                    {(() => {
                      if (o.actual_price !== undefined && o.actual_price !== null && !isNaN(Number(o.actual_price))) {
                        return `KSh ${Number(o.actual_price).toLocaleString()}`;
                      }
                      return '—';
                    })()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          // Open details modal for this order
                          setDetailsFormOrderId(o.id);
                          setDetailsForm({
                            items: o.items ?? 1,
                            weight_kg: o.weight_kg ? String(o.weight_kg) : '',
                            pickup_notes: o.pickup_notes ?? '',
                            actual_price: o.actual_price !== undefined && o.actual_price !== null ? String(o.actual_price) : ''
                          });
                        }}
                        className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        Add details
                      </button>
                      <div className="text-right text-slate-600 dark:text-slate-400">{o.created_at?.split?.('T')?.[0] ?? '—'}</div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">
                    No orders found for your location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Details modal overlay */}
      {detailsFormOrderId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Add / Edit Details</h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-600">Quantity</label>
              <input
                type="number"
                min={1}
                value={detailsForm.items ?? 1}
                onChange={(e) => setDetailsForm(prev => ({ ...prev, items: Number(e.target.value) }))}
                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />

              <label className="text-xs text-slate-600">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={detailsForm.weight_kg ?? ''}
                onChange={(e) => setDetailsForm(prev => ({ ...prev, weight_kg: e.target.value }))}
                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />

              <label className="text-xs text-slate-600">Short description / notes</label>
              <textarea
                value={detailsForm.pickup_notes ?? ''}
                onChange={(e) => setDetailsForm(prev => ({ ...prev, pickup_notes: e.target.value }))}
                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                rows={3}
                placeholder="e.g. 3 shirts, 2 towels"
              />

              <label className="text-xs text-slate-600">Actual price paid (KSh)</label>
              <input
                type="number"
                step="0.01"
                value={detailsForm.actual_price ?? ''}
                onChange={(e) => setDetailsForm(prev => ({ ...prev, actual_price: e.target.value }))}
                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                placeholder="e.g. 350.00"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDetailsFormOrderId(null)}
                className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Build payload and only include fields that are set
                    const payload: any = {
                      status: 'in_progress', // keep existing status or you could omit
                    };
                    if (detailsForm.items !== undefined) payload.quantity = detailsForm.items;
                    if (detailsForm.weight_kg !== undefined) payload.weight_kg = detailsForm.weight_kg;
                    if (detailsForm.pickup_notes !== undefined) payload.description = detailsForm.pickup_notes;
                    if (detailsForm.actual_price !== undefined && detailsForm.actual_price !== '') payload.actual_price = detailsForm.actual_price;

                    // Send PATCH to update order details
                    await client.patch(`/orders/update/?id=${detailsFormOrderId}`, payload);
                    setDetailsFormOrderId(null);
                    await fetchOrders();
                  } catch (err: any) {
                    console.error('Failed to save details:', err);
                    alert(err?.message || 'Failed to save details');
                  }
                }}
                className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Save details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
