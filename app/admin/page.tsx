"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  Truck,
  CheckCircle,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";

/* --- Types --- */
type RawOrder = Record<string, any>;
type RawLocation = Record<string, any>;

type Order = {
  id?: number;
  code?: string;
  created_at?: string;
  price?: string | number;
  status?: string;
  rider?: string | null;
  raw?: RawOrder;
};

type RiderLocation = {
  id?: number;
  rider?: string | number | null;
  rider_display?: string | null;
  latitude?: number | string;
  longitude?: number | string;
  accuracy?: number | null;
  speed?: number | null;
  recorded_at?: string | null;
  raw?: RawLocation;
};

/* --- Config --- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://wildwosh.kibeezy.com";

/* --- Component --- */
export default function AdminPage(): React.ReactElement {
  const [orders, setOrders] = useState<Order[]>([]);
  const [locations, setLocations] = useState<RiderLocation[]>([]);

  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);

  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [errorLocations, setErrorLocations] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const res = await fetch(`${API_BASE}/orders/`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Orders fetch failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json().catch(() => null);
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setOrders(
        list.map((o: any) => ({
          id: o.id,
          code: o.code,
          created_at: o.created_at,
          price: o.price ?? o.price_display ?? 0,
          status: o.status ?? o.status_code ?? o.state ?? "unknown",
          rider: (o.rider && (o.rider.name || o.rider.username)) ?? o.rider ?? o.user ?? null,
          raw: o,
        }))
      );
    } catch (err: any) {
      console.error("fetchOrders error:", err);
      setErrorOrders(err?.message ?? "Failed to load orders");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true);
    setErrorLocations(null);
    try {
      // public endpoint — no credentials required
      const res = await fetch(`${API_BASE}/riders/`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Riders fetch failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json().catch(() => null);

      // Expect an array of latest locations
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setLocations(
        list.map((l: any) => ({
          id: l.id,
          rider: l.rider ?? null,
          rider_display: l.rider_display ?? (l.rider && l.rider.username) ?? null,
          latitude: l.latitude ?? l.lat ?? null,
          longitude: l.longitude ?? l.lon ?? l.lng ?? null,
          accuracy: l.accuracy ?? null,
          speed: l.speed ?? null,
          recorded_at: l.recorded_at ?? l.created_at ?? null,
          raw: l,
        }))
      );
    } catch (err: any) {
      console.error("fetchLocations error:", err);
      setErrorLocations(err?.message ?? "Failed to load rider locations");
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    // initial load both
    fetchOrders();
    fetchLocations();
  }, [fetchOrders, fetchLocations]);

  // Derived metrics
  const totalOrders = orders.length;
  const completed = orders.filter((o) => String(o.status ?? "").toLowerCase() === "delivered").length;
  const inProgress = orders.filter((o) => String(o.status ?? "").toLowerCase() !== "delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.price ?? 0), 0);

  // Latest location per rider (in case public endpoint returns multiple per rider)
  const latestLocationByRider = (() => {
    const map = new Map<string, RiderLocation>();
    for (const loc of locations) {
      const key = String(loc.rider ?? loc.rider_display ?? loc.id ?? Math.random());
      const existing = map.get(key);
      const tsExisting = existing ? new Date(existing.recorded_at ?? existing.raw?.created_at ?? 0).getTime() : 0;
      const tsNew = new Date(loc.recorded_at ?? loc.raw?.created_at ?? 0).getTime();
      if (!existing || tsNew >= tsExisting) map.set(key, loc);
    }
    return Array.from(map.entries()).map(([riderKey, loc]) => ({ riderKey, ...loc }));
  })();

  const riderCount = latestLocationByRider.length;

  // daily stats for charts
  const dailyStats = Object.values(
    orders.reduce((acc: Record<string, { date: string; orders: number; revenue: number }>, o) => {
      const date = o.created_at?.split?.("T")?.[0] ?? new Date().toISOString().split("T")[0];
      if (!acc[date]) acc[date] = { date, orders: 0, revenue: 0 };
      acc[date].orders += 1;
      acc[date].revenue += Number(o.price ?? 0);
      return acc;
    }, {})
  );

  const refreshAll = async () => {
    await Promise.all([fetchOrders(), fetchLocations()]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Admin — Orders & Riders</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Live overview of orders and rider locations (public riders endpoint).</p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm bg-white/90 dark:bg-white/5"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </header>

        {(loadingOrders || loadingLocations) ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-600 w-6 h-6" />
          </div>
        ) : (errorOrders || errorLocations) ? (
          <div className="py-8">
            {errorOrders && <div className="mb-2 text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Orders error: {errorOrders}</div>}
            {errorLocations && <div className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Riders error: {errorLocations}</div>}
          </div>
        ) : (
          <>
            {/* Summary */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <StatCard icon={<Users />} label="Total Orders" value={String(totalOrders)} />
              <StatCard icon={<Loader2 />} label="In Progress" value={String(inProgress)} />
              <StatCard icon={<CheckCircle />} label="Completed" value={String(completed)} />
              <StatCard icon={<DollarSign />} label="Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} />
              <StatCard icon={<Truck />} label="Active Riders (orders)" value={String(new Set(orders.map(o => o.rider)).size)} />
              <StatCard icon={<MapPin />} label="Riders (locations)" value={String(riderCount)} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ChartCard title="Orders per Day">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Revenue Trend">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ChartCard>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Recent Orders */}
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="text-left py-2 px-3">Code</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Rider</th>
                        <th className="text-right py-2 px-3">Price (KSh)</th>
                        <th className="text-right py-2 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 50).map((o) => (
                        <tr key={o.id ?? o.code} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 px-3 font-mono">{o.code}</td>
                          <td className="py-2 px-3">{o.status}</td>
                          <td className="py-2 px-3">{o.rider ?? "—"}</td>
                          <td className="py-2 px-3 text-right">{Number(o.price ?? 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">{o.created_at?.split?.("T")?.[0] ?? "—"}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No orders found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rider Locations */}
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Rider Locations (latest)</h2>
                  <div className="text-xs text-slate-500">{latestTimeSummary(latestLocationByRider)}</div>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="text-left py-2 px-3">Rider</th>
                        <th className="text-left py-2 px-3">Last seen</th>
                        <th className="text-left py-2 px-3">Lat, Lon</th>
                        <th className="text-left py-2 px-3">Accuracy (m)</th>
                        <th className="text-left py-2 px-3">Speed (m/s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestLocationByRider.map((r) => (
                        <tr key={r.riderKey} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 px-3 font-medium">{r.rider_display ?? String(r.riderKey)}</td>
                          <td className="py-2 px-3">{formatDateTime(r.recorded_at)}</td>
                          <td className="py-2 px-3">{r.latitude ?? "—"}, {r.longitude ?? "—"}</td>
                          <td className="py-2 px-3">{r.accuracy ?? "—"}</td>
                          <td className="py-2 px-3">{r.speed ?? "—"}</td>
                        </tr>
                      ))}
                      {latestLocationByRider.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No rider locations available.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Helpers & small components --- */
function formatDateTime(s?: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString();
  } catch {
    return String(s);
  }
}

function latestTimeSummary(arr: Array<any>) {
  if (!arr || arr.length === 0) return "No data";
  const times = arr
    .map((r) => new Date(r.recorded_at ?? r.created_at ?? 0).getTime())
    .filter(Boolean)
    .sort((a, b) => b - a);
  if (times.length === 0) return "No timestamps";
  const latest = new Date(times[0]);
  return `Latest ${latest.toLocaleString()}`;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow flex flex-col gap-1">
      <div className="flex items-center gap-2 text-emerald-600">{icon}<span className="font-semibold">{label}</span></div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <ResponsiveContainer width="100%" height={250}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

