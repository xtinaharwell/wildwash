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
  daily_interest_rate?: string | number;
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
  repayments?: Array<{
    id: string;
    amount: string;
    status: string;
    payment_method: string;
    transaction_id: string;
    created_at: string;
    completed_at?: string;
  }>;
  created_at: string;
  approved_at?: string;
  funded_at?: string;
  due_date?: string;
  amount_repaid: string;
};

const statusColors = {
  pending: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-900 dark:text-blue-200", badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
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
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [detailedLoans, setDetailedLoans] = useState<{[key: string]: LoanApplication}>({});

  useEffect(() => {
    // RouteGuard handles authentication, only fetch if authenticated
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log("Fetching loans from /loans/loans/");
      const data = await client.get("/loans/loans/");
      console.log("Loans API response:", data);
      const apps = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      console.log("Processed apps:", apps);
      setApplications(apps);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch loans:", err);
      setError(err?.message || "Failed to load loan applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanDetails = async (loanId: string) => {
    try {
      console.log(`Fetching details for loan ${loanId}`);
      const data = await client.get(`/loans/loans/${loanId}/`);
      console.log(`Loan ${loanId} details:`, data);
      setDetailedLoans(prev => ({
        ...prev,
        [loanId]: data
      }));
    } catch (err: any) {
      console.error(`Failed to fetch details for loan ${loanId}:`, err);
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
        return "●";
      case "approved":
        return "●";
      case "active":
        return "●";
      case "repaid":
        return "●";
      case "rejected":
        return "●";
      case "defaulted":
        return "●";
      case "cancelled":
        return "●";
      default:
        return "●";
    }
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-6 md:py-12">
        <div className="max-w-4xl mx-auto px-3 md:px-4">
          {/* Header */}
          <header className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold mb-2">My Loan Applications</h1>
              </div>
              <Link
                href="/borrow"
                className="flex items-center justify-center gap-2 px-3 md:px-4 py-1 md:py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-xs md:text-sm whitespace-nowrap">
                <span className="text-base"></span>
                New Application
              </Link>
            </div>
            <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300">
              Track your loan applications and their approval status
            </p>
          </header>

          {/* Loading State */}
          {loading && (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 md:p-8 shadow text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full mb-4"></div>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300">Loading your applications...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 md:p-6 shadow border border-red-200 dark:border-red-800">
              <p className="text-sm md:text-base text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchApplications}
                className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm md:text-base">
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && applications.length === 0 && (
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 md:p-8 shadow text-center">
              <div className="text-4xl md:text-5xl mb-4"></div>
              <h3 className="text-lg md:text-xl font-bold mb-2">No Applications Yet</h3>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-6">
                You haven't submitted any loan applications yet. Start by creating one now!
              </p>
              <Link
                href="/borrow"
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm md:text-base">
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
                    className={`rounded-2xl shadow-lg border-l-4 transition-all hover:shadow-2xl hover:-translate-y-1 ${colors.border} overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur`}>
                    {/* Status Bar */}
                    <div className={`h-1 w-full ${colors.border}`}></div>
                    
                    <div className="p-4 md:p-6">
                      {/* Compact Header with Status */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`text-xl md:text-2xl p-2 rounded-lg ${colors.bg} font-bold flex-shrink-0`}>{getStatusIcon(app.status)}</div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm md:text-base font-bold truncate">
                              {app.loan_type === "order_collateral" ? "Order Loan" : "Asset Loan"}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {formatCurrency(app.loan_amount)} • {app.duration_days}d
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${colors.badge} whitespace-nowrap flex-shrink-0`}>
                          {statusLabels[app.status as keyof typeof statusLabels]}
                        </div>
                      </div>

                      {/* Quick Info Row */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                          <p className="text-xs text-slate-600 dark:text-slate-400">To Repay</p>
                          <p className="text-sm font-bold text-orange-600">{formatCurrency(app.total_repayment)}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                          <p className="text-xs text-slate-600 dark:text-slate-400">Submitted</p>
                          <p className="text-xs font-semibold">{formatDate(app.created_at)}</p>
                        </div>
                        {app.status === "active" && app.due_date && (
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-700 dark:text-red-300">Due</p>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{formatDate(app.due_date)}</p>
                          </div>
                        )}
                      </div>

                      {/* Expandable Details Section */}
                      {expandedLoanId === app.id && (
                        <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg space-y-3">
                          {/* Purpose */}
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Purpose</p>
                            <p className="text-sm leading-relaxed">{app.purpose}</p>
                          </div>

                          {/* Collateral Info */}
                          {app.loan_type === "order_collateral" && app.order_code && (
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Order Collateral</p>
                              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 overflow-auto">
                                <p className="font-mono font-bold text-xs break-all">{app.order_code}</p>
                              </div>
                            </div>
                          )}

                          {app.loan_type === "collateral_only" && app.collateral_items && app.collateral_items.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Collateral Items ({app.collateral_items.length})</p>
                              <div className="space-y-1">
                                {app.collateral_items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded text-xs">
                                    <div className="min-w-0 flex-1">
                                      <p><span className="capitalize font-semibold">{item.collateral_type}</span></p>
                                      <p className="text-slate-600 dark:text-slate-400 truncate">{item.description.substring(0, 40)}</p>
                                    </div>
                                    <p className="font-bold text-red-600 whitespace-nowrap flex-shrink-0">{formatCurrency(item.estimated_value)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Guarantors */}
                          {app.guarantors && app.guarantors.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Guarantor{app.guarantors.length !== 1 ? "s" : ""} ({app.guarantors.length})</p>
                              <div className="space-y-1">
                                {app.guarantors.map((g) => (
                                  <div key={g.id} className="p-2 bg-white dark:bg-slate-800 rounded border-l-2 border-red-500">
                                    <p className="font-medium text-xs">{g.name}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                      {g.email} • {g.phone_number}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">Relationship: {g.relationship}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Interest & Additional Info */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Interest Rate</p>
                                <p className="font-semibold">{detailedLoans[app.id]?.daily_interest_rate || "2"}% per day</p>
                              </div>
                              <div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Total Interest</p>
                                <p className="font-semibold text-orange-600">{formatCurrency(detailedLoans[app.id]?.total_interest || app.total_interest)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Repayments */}
                          {detailedLoans[app.id]?.repayments && detailedLoans[app.id].repayments!.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Repayments ({detailedLoans[app.id].repayments!.length})</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {detailedLoans[app.id].repayments!.map((repayment: any) => (
                                  <div key={repayment.id} className="flex justify-between p-1.5 bg-white dark:bg-slate-800 rounded text-xs">
                                    <span>{formatDate(repayment.created_at)}</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(repayment.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            if (expandedLoanId === app.id) {
                              setExpandedLoanId(null);
                            } else {
                              setExpandedLoanId(app.id);
                              if (!detailedLoans[app.id]) {
                                fetchLoanDetails(app.id);
                              }
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold transition-all hover:shadow-md">
                          {expandedLoanId === app.id ? "Hide Details" : "View Details"}
                        </button>
                        {app.status === "active" && (
                          <button className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all hover:shadow-md">
                            Make Payment
                          </button>
                        )}
                      </div>
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
