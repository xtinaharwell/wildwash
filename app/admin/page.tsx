"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import RouteGuard from "@/components/RouteGuard";
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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riderFilter, setRiderFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');

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

  // filter helpers
  const availableStatuses = Array.from(new Set(orders.map(o => (o.status ?? '').toString()))).filter(Boolean);
  const availableRiders = Array.from(new Set(orders.map(o => (o.rider ?? '').toString()))).filter(Boolean);
  const availableLocations = Array.from(new Set(orders.map(o => (o.raw?.user?.location || '').toString()))).filter(Boolean);

  const getDateRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: weekStart.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      case 'custom':
        return {
          start: startDate,
          end: endDate
        };
      default:
        return { start: '', end: '' };
    }
  }, [dateFilter, startDate, endDate]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter && String(o.status ?? '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (riderFilter && String(o.rider ?? '').toLowerCase() !== riderFilter.toLowerCase()) return false;
    if (locationFilter) {
      const customerLocation = (o.raw?.user?.location || '').toLowerCase();
      if (customerLocation !== locationFilter.toLowerCase()) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesCode = String(o.code ?? '').toLowerCase().includes(q);
      const matchesRider = String(o.rider ?? '').toLowerCase().includes(q);
      if (!matchesCode && !matchesRider) return false;
    }

    // Date filtering
    const { start, end } = getDateRange();
    if (start && end) {
      const orderDate = o.created_at?.split('T')[0];
      if (!orderDate || orderDate < start || orderDate > end) return false;
    }

    return true;
  });

  // Compute body JSX separately to avoid complex inline nested ternaries in JSX
  const body = (() => {
    if (loadingOrders || loadingLocations) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-red-600 w-6 h-6" />
        </div>
      );
    }
    if (errorOrders || errorLocations) {
      return (
        <div className="py-8">
          {errorOrders && <div className="mb-2 text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Orders error: {errorOrders}</div>}
          {errorLocations && <div className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Riders error: {errorLocations}</div>}
        </div>
      );
    }

    return (
      <div>
        {/* Summary */}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard icon={<Users />} label="Total Orders" value={String(totalOrders)} />
          <StatCard icon={<Loader2 />} label="In Progress" value={String(inProgress)} />
          <StatCard icon={<CheckCircle />} label="Completed" value={String(completed)} />
          <StatCard icon={<DollarSign />} label="Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} />
          <StatCard icon={<Truck />} label="Active Riders" value={String(new Set(orders.map(o => o.rider)).size)} />
          <StatCard icon={<MapPin />} label="Total Riders" value={String(riderCount)} />
        </div>

        {/* Recent Orders */}
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recent Orders</h2>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All statuses</option>
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <select 
                  value={riderFilter} 
                  onChange={(e) => setRiderFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All riders</option>
                  {availableRiders.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={locationFilter} 
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All locations</option>
                  {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <input 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search code or rider" 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20" 
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value as any)} 
                  className="rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm"
                >
                  <option value="week">Last 7 days</option>
                  <option value="today">Today</option>
                  <option value="month">Last 30 days</option>
                  <option value="custom">Custom range</option>
                </select>

                {dateFilter === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm"
                    />
                  </>
                )}
              </div>

              <button 
                onClick={() => { 
                  setStatusFilter(''); 
                  setRiderFilter(''); 
                  setLocationFilter('');
                  setSearchQuery(''); 
                  setDateFilter('week');
                  setStartDate('');
                  setEndDate('');
                }} 
                className="text-sm px-3 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-once">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                </svg>
                Reset all filters
              </button>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              <table className="min-w-full text-sm divide-y divide-slate-200/50 dark:divide-slate-800/50">
                <thead className="text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Code</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Location</th>
                    <th className="text-left py-3 px-4 font-medium">Rider</th>
                    <th className="text-right py-3 px-4 font-medium">Price (KSh)</th>
                    <th className="text-right py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {filteredOrders.slice(0, 50).map((o) => (
                    <tr key={o.id ?? o.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">
                        <Link href={`/orders/${o.code}`} className="hover:underline">
                          {o.code}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{o.raw?.user?.location || "—"}</td>
                      <td className="py-3 px-4">{o.rider ?? "—"}</td>
                      <td className="py-3 px-4 text-right font-medium">{Number(o.price ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{o.created_at?.split?.("T")?.[0] ?? "—"}</td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="8" y1="15" x2="16" y2="15"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                          <span>No orders found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts and Statistics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Orders per Day Chart */}
          <ChartCard title="Orders per Day">
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          {/* Rider Order Statistics */}
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Rider Statistics</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-3 px-4">Rider</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-center py-3 px-4">Total Orders</th>
                    <th className="text-center py-3 px-4">Completed</th>
                    <th className="text-center py-3 px-4">In Progress</th>
                    <th className="text-center py-3 px-4">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {availableRiders.map((rider) => {
                    const riderOrders = orders.filter(o => String(o.rider) === rider);
                    const completed = riderOrders.filter(o => String(o.status).toLowerCase() === 'delivered').length;
                    const inProgress = riderOrders.filter(o => !['delivered', 'cancelled'].includes(String(o.status).toLowerCase())).length;
                    const total = riderOrders.length;
                    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={rider} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-medium">{rider}</td>
                        <td className="py-3 px-4">{riderOrders[0]?.raw?.rider?.service_location?.name || "—"}</td>
                        <td className="py-3 px-4 text-center">{total}</td>
                        <td className="py-3 px-4 text-center text-green-600">{completed}</td>
                        <td className="py-3 px-4 text-center text-blue-600">{inProgress}</td>
                        <td className="py-3 px-4 text-center font-medium">{successRate}%</td>
                      </tr>
                    );
                  })}
                  {availableRiders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No riders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Admin — Orders & Riders</h1>
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

          {body}
        </div>
      </div>
    </RouteGuard>
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
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-1 sm:gap-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="flex items-center gap-1.5 text-red-600">
        <span className="w-4 h-4 sm:w-5 sm:h-5">{icon}</span>
        <span className="font-medium text-slate-600 dark:text-slate-300 text-xs sm:text-sm truncate">{label}</span>
      </div>
      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
      <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">{title}</h2>
      <div className="transition-transform duration-300 hover:scale-[1.02]">
        <ResponsiveContainer width="100%" height={250}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

