"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, Truck, CheckCircle, DollarSign, Loader2 } from "lucide-react";

// Sample admin data (in real app, fetch from API)
const sampleOrders = [
  { id: "WW-12345", status: "Washing", price: 1680, date: "2025-10-14", rider: "Samson" },
  { id: "WW-99999", status: "Ready", price: 1610, date: "2025-10-13", rider: "Aisha" },
  { id: "WW-10001", status: "Delivered", price: 2000, date: "2025-10-13", rider: "Samson" },
  { id: "WW-10002", status: "Delivered", price: 1950, date: "2025-10-12", rider: "Aisha" },
  { id: "WW-10003", status: "Received", price: 1350, date: "2025-10-15", rider: "James" },
];

export default function AdminPage() {
  const [orders, setOrders] = useState(sampleOrders);
  const [loading, setLoading] = useState(false);

  // derived statistics
  const totalOrders = orders.length;
  const completed = orders.filter((o) => o.status === "Delivered").length;
  const inProgress = orders.filter((o) => o.status !== "Delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);
  const activeRiders = new Set(orders.map((o) => o.rider)).size;

  // for graphing
  const dailyStats = Object.values(
    orders.reduce((acc, o) => {
      if (!acc[o.date]) acc[o.date] = { date: o.date, orders: 0, revenue: 0 };
      acc[o.date].orders += 1;
      acc[o.date].revenue += o.price;
      return acc;
    }, {} as Record<string, { date: string; orders: number; revenue: number }>)
  );

  useEffect(() => {
    // simulate fetch
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold">Admin Statistics Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Monitor performance, revenue, and activity across all orders.</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-600 w-6 h-6" />
          </div>
        ) : (
          <>
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon={<Users />} label="Total Orders" value={totalOrders.toString()} />
              <StatCard icon={<Loader2 />} label="In Progress" value={inProgress.toString()} />
              <StatCard icon={<CheckCircle />} label="Completed" value={completed.toString()} />
              <StatCard icon={<DollarSign />} label="Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} />
              <StatCard icon={<Truck />} label="Active Riders" value={activeRiders.toString()} />
            </div>

            {/* --- Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Orders per Day */}
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">Orders per Day</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Trend */}
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- Recent Orders Table --- */}
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow mb-10">
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
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 px-3 font-mono">{o.id}</td>
                        <td className="py-2 px-3">{o.status}</td>
                        <td className="py-2 px-3">{o.rider}</td>
                        <td className="py-2 px-3 text-right">{o.price.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- Rider Performance --- */}
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
              <h2 className="text-lg font-semibold mb-3">Rider Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from(new Set(orders.map((o) => o.rider))).map((rider) => {
                  const riderOrders = orders.filter((o) => o.rider === rider);
                  const completed = riderOrders.filter((o) => o.status === "Delivered").length;
                  const total = riderOrders.length;
                  return (
                    <div key={rider} className="rounded-xl bg-white/70 dark:bg-white/10 p-4 text-sm">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{rider}</div>
                      <div className="mt-1 text-slate-500">Total Orders: {total}</div>
                      <div className="text-slate-500">Completed: {completed}</div>
                      <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(completed / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Reusable StatCard --- */
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow flex flex-col gap-1">
      <div className="flex items-center gap-2 text-emerald-600">{icon}<span className="font-semibold">{label}</span></div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
