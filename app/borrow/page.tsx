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

type Collateral = {
  id: string;
  type: string; // 'order', 'property', 'vehicle', 'equipment', 'other'
  description: string;
  estimatedValue: number;
};

type Guarantor = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  relationship: string;
};

export default function BorrowPage(): React.JSX.Element {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Tab state
  const [activeTab, setActiveTab] = useState<"orders" | "collateral">("orders");

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
  
  // Additional Collateral State (for collateral tab)
  const [collateralItems, setCollateralItems] = useState<Collateral[]>([]);
  const [collateralType, setCollateralType] = useState<string>("property");
  const [collateralDescription, setCollateralDescription] = useState<string>("");
  const [collateralValue, setCollateralValue] = useState<string>("");
  const [collateralLoanAmount, setCollateralLoanAmount] = useState<string>("");
  const [collateralLoanDuration, setCollateralLoanDuration] = useState<string>("30");
  const [collateralLoanPurpose, setCollateralLoanPurpose] = useState<string>("");

  // Guarantor State
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [guarantorName, setGuarantorName] = useState<string>("");
  const [guarantorPhone, setGuarantorPhone] = useState<string>("");
  const [guarantorEmail, setGuarantorEmail] = useState<string>("");
  const [guarantorRelationship, setGuarantorRelationship] = useState<string>("friend");

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

  // Calculate total collateral value for collateral tab
  const totalCollateralValueTab = collateralItems.reduce((sum, c) => sum + c.estimatedValue, 0);
  const maxLoanFromCollateral = totalCollateralValueTab * 0.6;
  const collateralDailyInterest = maxLoanFromCollateral * (interestRate / 100);
  const collateralTotalInterest = collateralDailyInterest * Number(collateralLoanDuration);
  const collateralTotalRepayment = maxLoanFromCollateral + collateralTotalInterest;

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setLoanAmount("");
    setError(null);
    setSuccess(null);
  };

  const handleAddCollateral = () => {
    if (!collateralType.trim()) {
      setError("Please select collateral type");
      return;
    }
    if (!collateralDescription.trim()) {
      setError("Please describe the collateral");
      return;
    }
    const collateralVal = Number(collateralValue);
    if (!collateralVal || collateralVal <= 0) {
      setError("Please enter a valid estimated value");
      return;
    }

    const newCollateral: Collateral = {
      id: Date.now().toString(),
      type: collateralType,
      description: collateralDescription,
      estimatedValue: collateralVal,
    };

    setCollateralItems([...collateralItems, newCollateral]);
    setCollateralType("property");
    setCollateralDescription("");
    setCollateralValue("");
    setError(null);
  };

  const handleRemoveCollateral = (id: string) => {
    setCollateralItems(collateralItems.filter((c) => c.id !== id));
  };

  const handleAddGuarantor = () => {
    if (!guarantorName.trim()) {
      setError("Please enter guarantor's name");
      return;
    }
    if (!guarantorPhone.trim()) {
      setError("Please enter guarantor's phone number");
      return;
    }
    if (!guarantorEmail.trim()) {
      setError("Please enter guarantor's email");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guarantorEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Basic phone validation
    if (!/^(\+\d{1,3}[- ]?)?\d{9,}$/.test(guarantorPhone.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number");
      return;
    }

    const newGuarantor: Guarantor = {
      id: Date.now().toString(),
      name: guarantorName,
      phoneNumber: guarantorPhone,
      email: guarantorEmail,
      relationship: guarantorRelationship,
    };

    setGuarantors([...guarantors, newGuarantor]);
    setGuarantorName("");
    setGuarantorPhone("");
    setGuarantorEmail("");
    setGuarantorRelationship("friend");
    setError(null);
  };

  const handleRemoveGuarantor = (id: string) => {
    setGuarantors(guarantors.filter((g) => g.id !== id));
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (activeTab === "orders") {
      // Orders tab validation
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

      if (guarantors.length === 0) {
        setError("Please add at least one guarantor");
        return;
      }

      try {
        setLoading(true);

        const loanRequestPayload = {
          loan_type: "order_collateral",
          order_id: selectedOrder.id,
          loan_amount: loanAmt,
          duration_days: Number(loanDuration),
          purpose: loanPurpose,
          collateral: {
            type: "order",
            primary_order_value: getOrderValue(selectedOrder),
          },
          guarantors: guarantors.map((g) => ({
            name: g.name,
            phone_number: g.phoneNumber,
            email: g.email,
            relationship: g.relationship,
          })),
        };

        const response = await client.post("/loans/request/", loanRequestPayload);

        setSuccess(
          `Loan request submitted successfully! Loan ID: ${response.id || "pending"}. You will receive KSh ${loanAmt.toFixed(0)} within 24 hours. Your order (${selectedOrder.code}) is held as collateral.`
        );

        setTimeout(() => {
          setSelectedOrder(null);
          setLoanAmount("");
          setLoanDuration("30");
          setLoanPurpose("");
          setGuarantors([]);
          fetchOrders();
        }, 3000);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit loan request. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Collateral tab validation
      if (collateralItems.length === 0) {
        setError("Please add at least one collateral item");
        return;
      }

      const loanAmt = Number(collateralLoanAmount);
      if (!loanAmt || loanAmt <= 0) {
        setError("Please enter a valid loan amount");
        return;
      }

      if (loanAmt > maxLoanFromCollateral) {
        setError(`Loan amount cannot exceed KSh ${maxLoanFromCollateral.toFixed(0)} (60% of collateral value)`);
        return;
      }

      if (!collateralLoanPurpose.trim()) {
        setError("Please specify the purpose of the loan");
        return;
      }

      if (guarantors.length === 0) {
        setError("Please add at least one guarantor");
        return;
      }

      try {
        setLoading(true);

        const loanRequestPayload = {
          loan_type: "collateral_only",
          loan_amount: loanAmt,
          duration_days: Number(collateralLoanDuration),
          purpose: collateralLoanPurpose,
          collateral: {
            type: "mixed",
            items: collateralItems.map((c) => ({
              type: c.type,
              description: c.description,
              estimated_value: c.estimatedValue,
            })),
            total_collateral_value: totalCollateralValueTab,
          },
          guarantors: guarantors.map((g) => ({
            name: g.name,
            phone_number: g.phoneNumber,
            email: g.email,
            relationship: g.relationship,
          })),
        };

        const response = await client.post("/loans/request/", loanRequestPayload);

        setSuccess(
          `Loan request submitted successfully! Loan ID: ${response.id || "pending"}. You will receive KSh ${loanAmt.toFixed(0)} within 24 hours.`
        );

        setTimeout(() => {
          setCollateralItems([]);
          setCollateralLoanAmount("");
          setCollateralLoanDuration("30");
          setCollateralLoanPurpose("");
          setGuarantors([]);
        }, 3000);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit loan request. Please try again."
        );
      } finally {
        setLoading(false);
      }
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
            <h1 className="text-4xl font-extrabold mb-3">Get a Loan</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              Borrow money using your completed orders or other assets as collateral. Quick approval, flexible repayment terms, and competitive rates.
            </p>
          </header>

          {/* Tab Navigation */}
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => {
                setActiveTab("orders");
                setError(null);
                setSuccess(null);
              }}
              className={`px-8 py-3 font-semibold rounded-lg transition-all ${
                activeTab === "orders"
                  ? "bg-red-600 text-white shadow-lg hover:bg-red-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}>
               Borrow with Your Orders
            </button>
            <button
              onClick={() => {
                setActiveTab("collateral");
                setError(null);
                setSuccess(null);
              }}
              className={`px-8 py-3 font-semibold rounded-lg transition-all ${
                activeTab === "collateral"
                  ? "bg-red-600 text-white shadow-lg hover:bg-red-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}>
               Borrow with Other Collateral
            </button>
          </div>

          {/* How it works */}
          {activeTab === "orders" && (
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
          )}

          {activeTab === "collateral" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">1</div>
                  <h3 className="font-semibold mb-2">Add Collateral</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">List your assets (property, vehicle, equipment, etc.)</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">2</div>
                  <h3 className="font-semibold mb-2">Add Guarantor</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Provide a guarantor to strengthen your application</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">3</div>
                  <h3 className="font-semibold mb-2">Submit Request</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Request up to 60% of collateral value</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">4</div>
                  <h3 className="font-semibold mb-2">Get Funds</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cash deposited within 24 hours</p>
                </div>
              </div>
            </section>
          )}

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
              <div className="text-sm text-slate-600 dark:text-slate-300">Up to 60% of collateral value</div>
            </div>
          </section>

          {/* Available Orders - Orders Tab Only */}
          {activeTab === "orders" && (
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
                    href="/cart"
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
                        Max Loan: <span className="font-semibold text-red-600">{formatCurrency(getOrderValue(order) * 0.6)}</span>
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
          )}

          {/* Collateral Section - Collateral Tab Only */}
          {activeTab === "collateral" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">Add Your Collateral</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Add items you own as collateral to secure your loan. You can borrow up to 60% of the total estimated value.
              </p>

              {/* Add Collateral Form */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type of Collateral</label>
                    <select
                      value={collateralType}
                      onChange={(e) => setCollateralType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all">
                      <option value="property">Property</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="equipment">Equipment</option>
                      <option value="jewelry">Jewelry/Gold</option>
                      <option value="electronics">Electronics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Value (KSh)</label>
                    <input
                      type="number"
                      value={collateralValue}
                      onChange={(e) => setCollateralValue(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1000"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={collateralDescription}
                    onChange={(e) => setCollateralDescription(e.target.value)}
                    placeholder="E.g., 4-bedroom house in Nairobi, 2018 Honda Civic, etc."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCollateral}
                  className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-all">
                  + Add Collateral Item
                </button>
              </div>

              {/* Added Collateral List */}
              {collateralItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Added Collateral ({collateralItems.length})</h3>
                  {collateralItems.map((collateral) => (
                    <div
                      key={collateral.id}
                      className="flex justify-between items-start p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <div className="font-medium text-sm capitalize">{collateral.type}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{collateral.description}</div>
                        <div className="text-sm font-semibold text-red-600 mt-2">
                          {formatCurrency(collateral.estimatedValue)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollateral(collateral.id)}
                        className="ml-3 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Total Collateral Value:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCollateralValueTab)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                      <span className="font-medium text-sm">Max Loan Amount (60%):</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(maxLoanFromCollateral)}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Guarantor Section - Only in Collateral Tab */}
          {activeTab === "collateral" && collateralItems.length > 0 && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">Guarantor Information</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Add at least one guarantor who can vouch for the loan. This helps improve approval chances.
              </p>

              {/* Add Guarantor Form */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Guarantor's Full Name</label>
                    <input
                      type="text"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={guarantorEmail}
                      onChange={(e) => setGuarantorEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship</label>
                    <select
                      value={guarantorRelationship}
                      onChange={(e) => setGuarantorRelationship(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all">
                      <option value="friend">Friend</option>
                      <option value="family">Family Member</option>
                      <option value="employer">Employer</option>
                      <option value="colleague">Colleague</option>
                      <option value="business_partner">Business Partner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddGuarantor}
                  className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-all">
                  + Add Guarantor
                </button>
              </div>

              {/* Added Guarantors List */}
              {guarantors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Added Guarantors ({guarantors.length})</h3>
                  {guarantors.map((guarantor) => (
                    <div
                      key={guarantor.id}
                      className="flex justify-between items-start p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{guarantor.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          📞 {guarantor.phoneNumber}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          📧 {guarantor.email}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 capitalize">
                          Relationship: {guarantor.relationship}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuarantor(guarantor.id)}
                        className="ml-3 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {activeTab === "orders" && selectedOrder && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Loan Request</h2>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                  <strong>Selected Order:</strong> {selectedOrder.code} ({formatCurrency(getOrderValue(selectedOrder))})
                </p>
                <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold">
                    <strong>Guarantors:</strong> {guarantors.length} added
                  </p>
                  {guarantors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {guarantors.map((g) => (
                        <li key={g.id} className="text-xs text-blue-900 dark:text-blue-200">
                          • {g.name} ({g.relationship})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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

          {/* Loan Request Form - Collateral Tab */}
          {activeTab === "collateral" && collateralItems.length > 0 && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Loan Request</h2>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                  <strong>Total Collateral Value:</strong> {formatCurrency(totalCollateralValueTab)}
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                  <strong>Max Loan Amount (60%):</strong> {formatCurrency(maxLoanFromCollateral)}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold">
                    <strong>Guarantors:</strong> {guarantors.length} added
                  </p>
                  {guarantors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {guarantors.map((g) => (
                        <li key={g.id} className="text-xs text-blue-900 dark:text-blue-200">
                          • {g.name} ({g.relationship})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <form onSubmit={handleRequestLoan} className="space-y-5">
                {/* Loan Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Amount (KSh)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={collateralLoanAmount}
                      onChange={(e) => setCollateralLoanAmount(e.target.value)}
                      placeholder={`0 - ${maxLoanFromCollateral.toFixed(0)}`}
                      max={maxLoanFromCollateral}
                      min="0"
                      step="100"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                    <div className="absolute right-4 top-2.5 text-xs text-slate-500">
                      Max: {formatCurrency(maxLoanFromCollateral)}
                    </div>
                  </div>
                </div>

                {/* Loan Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2">Repayment Period</label>
                  <select
                    value={collateralLoanDuration}
                    onChange={(e) => setCollateralLoanDuration(e.target.value)}
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
                    value={collateralLoanPurpose}
                    onChange={(e) => setCollateralLoanPurpose(e.target.value)}
                    placeholder="E.g., Business expansion, emergency expenses, etc."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                  />
                </div>

                {/* Loan Summary */}
                {collateralLoanAmount && Number(collateralLoanAmount) > 0 && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Loan Amount:</span>
                      <span className="font-semibold">{formatCurrency(Number(collateralLoanAmount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Daily Interest (2%):</span>
                      <span className="font-semibold">{formatCurrency((Number(collateralLoanAmount) * 0.02))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Interest for {collateralLoanDuration} days:</span>
                      <span className="font-semibold">{formatCurrency((Number(collateralLoanAmount) * 0.02) * Number(collateralLoanDuration))}</span>
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-600 pt-2 flex justify-between">
                      <span className="font-semibold">Total to Repay:</span>
                      <span className="font-bold text-lg text-red-600">{formatCurrency(Number(collateralLoanAmount) + ((Number(collateralLoanAmount) * 0.02) * Number(collateralLoanDuration)))}</span>
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
                  disabled={loading || !collateralLoanAmount}
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
