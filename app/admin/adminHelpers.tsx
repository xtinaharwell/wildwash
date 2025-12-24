// app/admin/adminHelpers.tsx
import React from "react";
import { ResponsiveContainer } from "recharts";

/* --- Helpers & small components --- */

export const formatDateTime = (s?: string | null): string => {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString();
  } catch {
    return String(s);
  }
};

export const latestTimeSummary = (arr: any[]): string => {
  if (!arr || arr.length === 0) return "No data";
  const times = arr
    .map((r: any) => new Date(r.recorded_at ?? r.created_at ?? 0).getTime())
    .filter(Boolean)
    .sort((a: number, b: number) => b - a);
  if (times.length === 0) return "No timestamps";
  const latest = new Date(times[0]);
  return `Latest ${latest.toLocaleString()}`;
};

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-1 sm:gap-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
    <div className="flex items-center gap-1.5 text-red-600">
      <span className="w-4 h-4 sm:w-5 sm:h-5">{icon}</span>
      <span className="font-medium text-slate-600 dark:text-slate-300 text-xs sm:text-sm truncate">{label}</span>
    </div>
    <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
  </div>
);

export interface ChartCardProps {
  title: string;
  children: React.ReactElement;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
    <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">{title}</h2>
    <div className="transition-transform duration-300 hover:scale-[1.02]">
      <ResponsiveContainer width="100%" height={250}>
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);
