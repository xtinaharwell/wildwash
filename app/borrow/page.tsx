"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { client } from "@/lib/api/client";
import RouteGuard from "../../components/RouteGuard";

type Order = {
  id: number;
  code: string;
  created_at: string;
  status: string;
  price: string | number;
  actual_price?: string | number;
};

type LoanRequest = {
  order_id: number;
  loan_amount: number;
  duration_days: number;
  purpose: string;
};

export default function BorrowPage(): React.JSX.Element {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [loanDuration, setLoanDuration] = useState<string>("30");
  const [loanPurpose, setLoanPurpose] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch user's orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await client.get("/orders/?page_size=100");
      const ordersList = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      // Filter to delivered or ready orders only (completed/ready for collateral)
      const eligibleOrders = ordersList.filter((o: any) => 
        o.status && (o.status.toLowerCase() === "delivered" || o.status.toLowerCase() === "ready")
      );
      setOrders(eligibleOrders);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Calculate loan details
  const maxLoanAmount = selectedOrder ? Number(selectedOrder.actual_price || selectedOrder.price || 0) * 0.6 : 0;
  const interestRate = 0.02; // 2% daily
  const dailyInterest = maxLoanAmount * (interestRate / 100);
  const totalInterest = dailyInterest * Number(loanDuration);
  const totalRepayment = maxLoanAmount + totalInterest;

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setLoanAmount("");
    setError(null);
    setSuccess(null);
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedOrder) {
      setError("Please select an order as collateral");
      return;
    }

    const loanAmt = Number(loanAmount);
    if (!loanAmt || loanAmt <= 0) {
      setError("Please enter a valid loan amount");
      return;
    }

    if (loanAmt > maxLoanAmount) {
      setError(`Loan amount cannot exceed KSh ${maxLoanAmount.toFixed(0)} (60% of order value)`);
      return;
    }

    if (!loanPurpose.trim()) {
      setError("Please specify the purpose of the loan");
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, this would call a backend endpoint
      // For now, we'll show a success message
      setSuccess(
        `Loan request submitted! You will receive KSh ${loanAmt.toFixed(0)} within 24 hours. Your order (${selectedOrder.code}) is held as collateral.`
      );
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setShowForm(false);
        setSelectedOrder(null);
        setLoanAmount("");
        setLoanDuration("30");
        setLoanPurpose("");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit loan request");
    } finally {
      setLoading(false);
    }
  };

  const getOrderValue = (order: Order) => {
    const value = order.actual_price || order.price || 0;
    return Number(value);
  };

  const formatCurrency = (value: number) => {
    return `KSh ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold mb-3">Borrow with Your Orders</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              Use your completed or ready orders as collateral to get instant cash loans. Quick approval, flexible repayment terms, and competitive rates.
            </p>
          </header>

          {/* How it works */}
          <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">1</div>
                <h3 className="font-semibold mb-2">Select Order</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Choose a completed or ready order as collateral</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">2</div>
                <h3 className="font-semibold mb-2">Request Loan</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Request up to 60% of order value as a loan</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">3</div>
                <h3 className="font-semibold mb-2">Quick Approval</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Get approved within 24 hours</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">4</div>
                <h3 className="font-semibold mb-2">Get Funds</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Cash deposited directly to your account</p>
              </div>
            </div>
          </section>

          {/* Rates & Terms */}
          <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <div className="text-3xl font-bold text-red-600 mb-2">2%</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Daily Interest Rate</div>
            </div>
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <div className="text-3xl font-bold text-red-600 mb-2">24h</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Approval & Funding Time</div>
            </div>
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <div className="text-3xl font-bold text-red-600 mb-2">60%</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Max Loan vs Order Value</div>
            </div>
          </section>

          {/* Available Orders */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Your Eligible Orders</h2>
            
            {loading && !orders.length ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-center text-slate-600">
                Loading your orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-center">
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  You don't have any eligible orders yet. Complete an order first to use it as collateral.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                  Book a Service
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`rounded-2xl p-4 shadow cursor-pointer transition-all ${
                      selectedOrder?.id === order.id
                        ? "bg-red-600 text-white ring-2 ring-red-400"
                        : "bg-white/80 dark:bg-white/5 hover:shadow-lg hover:scale-105"
                    }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-mono font-semibold">{order.code}</div>
                        <div className={`text-xs ${selectedOrder?.id === order.id ? "opacity-90" : "text-slate-500"}`}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        selectedOrder?.id === order.id
                          ? "bg-white text-red-600"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {order.status}
                      </div>
                    </div>
                    <div className={`text-sm mb-2 ${selectedOrder?.id === order.id ? "opacity-90" : ""}`}>
                      Order Value: <span className="font-semibold">{formatCurrency(getOrderValue(order))}</span>
                    </div>
                    <div className={`text-sm ${selectedOrder?.id === order.id ? "opacity-90" : "text-slate-600 dark:text-slate-400"}`}>
                      Max Loan: <span className="font-semibold text-red-600">{formatCurrency(getOrderValue(order) * 0.7)}</span>
                    </div>
                    {selectedOrder?.id === order.id && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="text-xs opacity-90">✓ Selected as collateral</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Loan Request Form */}
          {selectedOrder && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Loan Request</h2>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Collateral:</strong> {selectedOrder.code} ({formatCurrency(getOrderValue(selectedOrder))})
                </p>
              </div>

              <form onSubmit={handleRequestLoan} className="space-y-5">
                {/* Loan Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Amount (KSh)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder={`0 - ${maxLoanAmount.toFixed(0)}`}
                      max={maxLoanAmount}
                      min="0"
                      step="100"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                    <div className="absolute right-4 top-2.5 text-xs text-slate-500">
                      Max: {formatCurrency(maxLoanAmount)}
                    </div>
                  </div>
                </div>

                {/* Loan Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2">Repayment Period</label>
                  <select
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all">
                    <option value="30">24 hours</option>
                    <option value="60">48 hours</option>
                    <option value="90">7 days</option>
                    <option value="180">2 weeks</option>
                    <option value="180">1 month</option>
                  </select>
                </div>

                {/* Loan Purpose */}
                <div>
                  <label className="block text-sm font-medium mb-2">Purpose of Loan</label>
                  <textarea
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    placeholder="E.g., Business expansion, emergency expenses, etc."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                  />
                </div>

                {/* Loan Summary */}
                {loanAmount && Number(loanAmount) > 0 && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Loan Amount:</span>
                      <span className="font-semibold">{formatCurrency(Number(loanAmount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Daily Interest (2%):</span>
                      <span className="font-semibold">{formatCurrency((Number(loanAmount) * 0.02))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Interest for {loanDuration} days:</span>
                      <span className="font-semibold">{formatCurrency((Number(loanAmount) * 0.02) * Number(loanDuration))}</span>
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-600 pt-2 flex justify-between">
                      <span className="font-semibold">Total to Repay:</span>
                      <span className="font-bold text-lg text-red-600">{formatCurrency(Number(loanAmount) + ((Number(loanAmount) * 0.02) * Number(loanDuration)))}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !loanAmount}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {loading ? "Processing..." : "Request Loan"}
                </button>
              </form>
            </section>
          )}

          {/* Terms & Conditions */}
          <section className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <h3 className="text-lg font-bold mb-3">Terms & Conditions</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• Loans are provided at 2% daily interest rate</li>
              <li>• You can borrow up to 60% of your order value</li>
              <li>• Your order serves as collateral and will be held until loan is repaid</li>
              <li>• Approval takes 24 hours</li>
              <li>• Early repayment is allowed without penalties</li>
              <li>• If loan is not repaid by due date, the collateral order will be forfeited</li>
            </ul>
          </section>
        </div>
      </div>
    </RouteGuard>
  );
}
