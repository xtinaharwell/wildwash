"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { client } from "@/lib/api/client";
import RouteGuard from "@/components/RouteGuard";
import Link from "next/link";

type LoanApplication = {
  id: string;
  loan_type: "order_collateral" | "collateral_only";
  loan_amount: string;
  duration_days: number;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "active" | "repaid" | "defaulted" | "cancelled";
  total_interest: string;
  total_repayment: string;
  order_code?: string;
  collateral_items?: Array<{
    id: string;
    collateral_type: string;
    description: string;
    estimated_value: string;
  }>;
  guarantors?: Array<{
    id: string;
    name: string;
    email: string;
    phone_number: string;
    relationship: string;
  }>;
  created_at: string;
  approved_at?: string;
  funded_at?: string;
  due_date?: string;
  amount_repaid: string;
};

const statusColors = {
  pending: { bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-900 dark:text-yellow-200", badge: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
  approved: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-900 dark:text-blue-200", badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  active: { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", text: "text-green-900 dark:text-green-200", badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
  repaid: { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-900 dark:text-emerald-200", badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  rejected: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", text: "text-red-900 dark:text-red-200", badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  defaulted: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", text: "text-red-900 dark:text-red-200", badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  cancelled: { bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-800", text: "text-slate-900 dark:text-slate-200", badge: "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400" },
};

const statusLabels = {
  pending: "Awaiting Review",
  approved: "Approved",
  active: "Active Loan",
  repaid: "Fully Repaid",
  rejected: "Rejected",
  defaulted: "Defaulted",
  cancelled: "Cancelled",
};

export default function LoansPage(): React.JSX.Element {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // RouteGuard handles authentication, only fetch if authenticated
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await client.get("/loans/loans/");
      const apps = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setApplications(apps);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load loan applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number | undefined | null) => {
    if (!value && value !== 0) return "KSh 0";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "KSh 0";
    return `KSh ${num.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "active":
        return "💰";
      case "repaid":
        return "🎉";
      case "rejected":
        return "❌";
      case "defaulted":
        return "⚠️";
      case "cancelled":
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-extrabold">My Loan Applications</h1>
              <Link
                href="/borrow"
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all">
                + New Application
              </Link>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Track your loan applications and their approval status
            </p>
          </header>

          {/* Loading State */}
          {loading && (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-8 shadow text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">Loading your applications...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-6 shadow border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchApplications}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && applications.length === 0 && (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-8 shadow text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">No Applications Yet</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                You haven't submitted any loan applications yet. Start by creating one now!
              </p>
              <Link
                href="/borrow"
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all">
                Apply for a Loan
              </Link>
            </div>
          )}

          {/* Applications List */}
          {!loading && !error && applications.length > 0 && (
            <div className="space-y-6">
              {applications.map((app) => {
                const colors = statusColors[app.status as keyof typeof statusColors] || statusColors.pending;
                return (
                  <div
                    key={app.id}
                    className={`rounded-2xl shadow border-2 ${colors.bg} ${colors.border} p-6 transition-all hover:shadow-lg`}>
                    {/* Header with Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getStatusIcon(app.status)}</div>
                        <div>
                          <h3 className="text-lg font-bold">
                            {app.loan_type === "order_collateral" ? "Order Collateral Loan" : "Asset Collateral Loan"}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Application ID: {app.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                        {statusLabels[app.status as keyof typeof statusLabels]}
                      </div>
                    </div>

                    {/* Loan Amount & Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Loan Amount</p>
                        <p className="text-lg font-bold">{formatCurrency(app.loan_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Repayment Period</p>
                        <p className="text-lg font-bold">{app.duration_days} day{app.duration_days !== 1 ? "s" : ""}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Repayment</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(app.total_repayment)}</p>
                      </div>
                    </div>

                    {/* Purpose & Details */}
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Purpose</p>
                      <p className="text-sm">{app.purpose}</p>
                    </div>

                    {/* Collateral Info */}
                    {app.loan_type === "order_collateral" && app.order_code && (
                      <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Collateral</p>
                        <p className="text-sm font-mono font-semibold">{app.order_code}</p>
                      </div>
                    )}

                    {app.loan_type === "collateral_only" && app.collateral_items && app.collateral_items.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Collateral Items ({app.collateral_items.length})</p>
                        <div className="space-y-1">
                          {app.collateral_items.map((item) => (
                            <p key={item.id} className="text-sm">
                              <span className="capitalize font-medium">{item.collateral_type}:</span> {item.description.substring(0, 40)}... ({formatCurrency(item.estimated_value)})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Guarantors */}
                    {app.guarantors && app.guarantors.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Guarantor{app.guarantors.length !== 1 ? "s" : ""} ({app.guarantors.length})</p>
                        <div className="space-y-1">
                          {app.guarantors.map((g) => (
                            <p key={g.id} className="text-sm">
                              <span className="font-medium">{g.name}</span> ({g.relationship})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Submitted</p>
                        <p className="font-medium">{formatDate(app.created_at)}</p>
                      </div>
                      {app.status === "approved" && app.approved_at && (
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Approved</p>
                          <p className="font-medium text-green-600 dark:text-green-400">{formatDate(app.approved_at)}</p>
                        </div>
                      )}
                      {app.status === "active" && app.due_date && (
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Due Date</p>
                          <p className="font-medium text-red-600 dark:text-red-400">{formatDate(app.due_date)}</p>
                        </div>
                      )}
                      {(app.status === "repaid" || app.status === "defaulted") && (
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Amount Repaid</p>
                          <p className="font-medium">{formatCurrency(app.amount_repaid)}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-all">
                        View Details
                      </button>
                      {app.status === "active" && (
                        <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all">
                          Make Payment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
